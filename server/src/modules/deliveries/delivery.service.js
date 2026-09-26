const db = require("../../database");
const repository = require("./delivery.repository");

async function createDelivery(data) {
  // Check customer active status
  const customerResult = await db.query(
    `
    SELECT id, is_active
    FROM customers
    WHERE id = $1
    `,
    [data.customerId],
  );

  if (!customerResult.rows.length) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  if (!customerResult.rows[0].is_active) {
    const error = new Error("Inactive customer cannot be used for a new delivery");
    error.statusCode = 400;
    throw error;
  }

  // Check warehouse exists
  const warehouseResult = await db.query(
    `
    SELECT id, is_active
    FROM warehouses
    WHERE id = $1
    `,
    [data.warehouseId],
  );

  if (!warehouseResult.rows.length || !warehouseResult.rows[0].is_active) {
    const error = new Error("Warehouse not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  // If location not specified, pick default active location in warehouse
  if (!data.locationId && data.warehouseId) {
    const defaultLoc = await db.query(
      `
      SELECT id
      FROM locations
      WHERE warehouse_id = $1
        AND is_active = TRUE
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [data.warehouseId],
    );
    if (defaultLoc.rows.length) {
      data.locationId = defaultLoc.rows[0].id;
    }
  }

  // Check location belongs to warehouse and is active
  const locationResult = await db.query(
    `
    SELECT id, is_active
    FROM locations
    WHERE id = $1 AND warehouse_id = $2
    `,
    [data.locationId, data.warehouseId],
  );

  if (!locationResult.rows.length || !locationResult.rows[0].is_active) {
    const error = new Error("Delivery location does not belong to warehouse or is inactive");
    error.statusCode = 400;
    throw error;
  }

  return repository.createDelivery(data);
}

async function getDelivery(id) {
  const delivery = await repository.findById(id);

  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    throw error;
  }

  delivery.items = await repository.findItems(id);

  return delivery;
}

async function listDeliveries(filters) {
  return repository.list(filters);
}

async function addItem(deliveryId, data) {
  const delivery = await repository.findById(deliveryId);

  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    throw error;
  }

  if (delivery.status !== "draft") {
    const error = new Error("Items can only be added to draft deliveries");
    error.statusCode = 409;
    throw error;
  }

  const existing = await repository.findItem(deliveryId, data.productId);

  if (existing) {
    const error = new Error("Product already exists in this delivery");
    error.statusCode = 409;
    throw error;
  }

  // Verify product is active
  const productResult = await db.query(
    `
    SELECT id, is_active
    FROM products
    WHERE id = $1
    `,
    [data.productId],
  );

  if (!productResult.rows.length || !productResult.rows[0].is_active) {
    const error = new Error("Product not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  return repository.addItem({
    deliveryId,
    productId: data.productId,
    locationId: data.locationId || delivery.location_id,
    quantity: data.quantity,
  });
}

/*
 * DRAFT → READY
 */
async function markReady(deliveryId, userId) {
  return changeStatus(deliveryId, "draft", "ready", userId);
}

/*
 * READY → PICKED
 */
async function markPicked(deliveryId, userId) {
  return changeStatus(deliveryId, "ready", "picked", userId);
}

/*
 * PICKED → PACKED
 */
async function markPacked(deliveryId, userId) {
  return changeStatus(deliveryId, "picked", "packed", userId);
}

async function changeStatus(deliveryId, expectedStatus, newStatus, userId) {
  return db.transaction(async (trx) => {
    const delivery = await repository.lockDelivery(deliveryId, trx);

    if (!delivery) {
      const error = new Error("Delivery not found");
      error.statusCode = 404;
      throw error;
    }

    if (delivery.status !== expectedStatus) {
      const error = new Error(
        `Delivery must be in ${expectedStatus} status to move to ${newStatus}, current is ${delivery.status}`,
      );
      error.statusCode = 409;
      throw error;
    }

    return repository.updateStatus(deliveryId, newStatus, userId, trx);
  });
}

/*
 * PACKED → DONE
 *
 * This is where stock actually decreases.
 */
async function validateDelivery(deliveryId, userId) {
  return db.transaction(async (trx) => {
    const delivery = await repository.lockDelivery(deliveryId, trx);

    if (!delivery) {
      const error = new Error("Delivery not found");
      error.statusCode = 404;
      throw error;
    }

    if (delivery.status === "done") {
      const error = new Error("Delivery already validated");
      error.statusCode = 409;
      throw error;
    }

    if (delivery.status !== "packed") {
      const error = new Error("Only packed deliveries can be validated");
      error.statusCode = 409;
      throw error;
    }

    const items = await repository.findItems(deliveryId, trx);

    if (!items.length) {
      const error = new Error("Delivery must contain at least one item");
      error.statusCode = 400;
      throw error;
    }

    /*
     * Validate location.
     */
    const locationResult = await trx.query(
      `
      SELECT *
      FROM locations
      WHERE id = $1
        AND warehouse_id = $2
        AND is_active = TRUE
      FOR UPDATE
      `,
      [delivery.location_id, delivery.warehouse_id],
    );

    if (!locationResult.rows.length) {
      const error = new Error("Delivery location does not belong to selected warehouse");
      error.statusCode = 400;
      throw error;
    }

    /*
     * Process every product.
     */
    for (const item of items) {
      const quantity = Number(item.quantity);

      /*
       * Lock inventory row.
       */
      const stockResult = await trx.query(
        `
        SELECT *
        FROM inventory_stock
        WHERE product_id = $1
          AND location_id = $2
        FOR UPDATE
        `,
        [item.product_id, delivery.location_id],
      );

      if (!stockResult.rows.length) {
        const error = new Error(`No stock exists for product ${item.product_id}`);
        error.statusCode = 409;
        throw error;
      }

      const stock = stockResult.rows[0];
      const currentQuantity = Number(stock.quantity);
      const reservedQuantity = Number(stock.reserved_quantity);
      const availableQuantity = currentQuantity - reservedQuantity;

      /*
       * Never allow negative available stock.
       */
      if (availableQuantity < quantity) {
        const error = new Error(
          `Insufficient stock for product ${item.product_id}. Available: ${availableQuantity}, required: ${quantity}`,
        );
        error.statusCode = 409;
        throw error;
      }

      const before = currentQuantity;
      const after = currentQuantity - quantity;

      /*
       * Decrease stock.
       */
      await trx.query(
        `
        UPDATE inventory_stock
        SET
          quantity = $1,
          updated_at = NOW()
        WHERE product_id = $2
          AND location_id = $3
        `,
        [after, item.product_id, delivery.location_id],
      );

      /*
       * Ledger.
       */
      await trx.query(
        `
        INSERT INTO stock_ledger (
          product_id,
          location_id,
          quantity_change,
          quantity_before,
          quantity_after,
          movement_type,
          reference_type,
          reference_id,
          notes,
          created_by
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'delivery',
          'delivery',
          $6,
          $7,
          $8
        )
        `,
        [
          item.product_id,
          delivery.location_id,
          -quantity,
          before,
          after,
          delivery.id,
          `Delivery ${delivery.id}`,
          userId,
        ],
      );
    }

    /*
     * Everything succeeded.
     */
    return repository.updateStatus(deliveryId, "done", userId, trx);
  });
}

/*
 * Cancel delivery
 */
async function cancelDelivery(deliveryId, userId) {
  return db.transaction(async (trx) => {
    const delivery = await repository.lockDelivery(deliveryId, trx);

    if (!delivery) {
      const error = new Error("Delivery not found");
      error.statusCode = 404;
      throw error;
    }

    if (delivery.status === "done") {
      const error = new Error(
        "Completed deliveries cannot be canceled directly. A compensating return or adjustment is required.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (delivery.status === "canceled") {
      const error = new Error("Delivery is already canceled");
      error.statusCode = 409;
      throw error;
    }

    return repository.updateStatus(deliveryId, "canceled", userId, trx);
  });
}

module.exports = {
  createDelivery,
  getDelivery,
  listDeliveries,
  addItem,
  markReady,
  markPicked,
  markPacked,
  validateDelivery,
  cancelDelivery,
};