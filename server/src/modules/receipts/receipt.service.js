const db = require("../../database");
const repository = require("./receipt.repository");

async function createReceipt(data) {
  return repository.createReceipt(data);
}

async function getReceipt(id) {
  const receipt = await repository.findById(id);

  if (!receipt) {
    const error = new Error("Receipt not found");
    error.statusCode = 404;
    throw error;
  }

  receipt.items = await repository.findItems(id);

  return receipt;
}

async function listReceipts(filters) {
  return repository.list(filters);
}

async function addItem(receiptId, data) {
  const receipt = await repository.findById(receiptId);

  if (!receipt) {
    const error = new Error("Receipt not found");
    error.statusCode = 404;
    throw error;
  }

  if (receipt.status !== "draft") {
    const error = new Error("Items can only be added to draft receipts");
    error.statusCode = 409;
    throw error;
  }

  const existing = await repository.findItem(receiptId, data.productId);

  if (existing) {
    const error = new Error("Product already exists in this receipt");
    error.statusCode = 409;
    throw error;
  }

  // Validate location belongs to receipt warehouse
  const locResult = await db.raw(
    `
    SELECT id, warehouse_id, is_active
    FROM locations
    WHERE id = $1
    `,
    [data.locationId],
  );

  if (!locResult.rows.length || !locResult.rows[0].is_active) {
    const error = new Error("Location not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  if (locResult.rows[0].warehouse_id !== receipt.warehouse_id) {
    const error = new Error(
      `Location ${data.locationId} does not belong to receipt warehouse ${receipt.warehouse_id}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Validate product exists and is active
  const prodResult = await db.raw(
    `
    SELECT id, is_active
    FROM products
    WHERE id = $1
    `,
    [data.productId],
  );

  if (!prodResult.rows.length || !prodResult.rows[0].is_active) {
    const error = new Error("Product not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  return repository.addItem({
    receiptId,
    productId: data.productId,
    locationId: data.locationId,
    quantity: data.quantity,
  });
}

async function validateReceipt(receiptId, userId) {
  return db.transaction(async (trx) => {
    // 1. Lock receipt
    const receipt = await repository.lockReceipt(
      receiptId,
      trx,
    );

    if (!receipt) {
      const error = new Error("Receipt not found");
      error.statusCode = 404;
      throw error;
    }

    if (receipt.status !== "draft") {
      const error = new Error(
        `Receipt cannot be validated from ${receipt.status} status`,
      );

      error.statusCode = 409;
      throw error;
    }

    // 2. Get receipt items
    const items = await repository.findItems(
      receiptId,
      trx,
    );

    if (!items.length) {
      const error = new Error(
        "Receipt must contain at least one item",
      );

      error.statusCode = 400;
      throw error;
    }

    // 3. Validate every item
    for (const item of items) {
      // Validate location
      const locationResult = await trx.query(
        `
        SELECT *
        FROM locations
        WHERE id = $1
          AND warehouse_id = $2
          AND is_active = TRUE
        FOR UPDATE
        `,
        [
          item.location_id,
          receipt.warehouse_id,
        ],
      );

      if (!locationResult.rows.length) {
        const error = new Error(
          `Location ${item.location_id} does not belong to warehouse ${receipt.warehouse_id}`,
        );

        error.statusCode = 400;
        throw error;
      }

      // Validate and lock product
      const product = await repository.lockProduct(
        item.product_id,
        trx,
      );

      if (!product) {
        const error = new Error(
          `Product ${item.product_id} not found or inactive.`,
        );

        error.statusCode = 400;
        throw error;
      }
    }

    // 4. Increase stock
    for (const item of items) {
      const quantity = Number(item.quantity);

      // Ensure stock row exists
      await trx.query(
        `
        INSERT INTO inventory_stock (
          product_id,
          location_id,
          quantity,
          reserved_quantity
        )
        VALUES ($1, $2, 0, 0)
        ON CONFLICT (product_id, location_id)
        DO NOTHING
        `,
        [
          item.product_id,
          item.location_id,
        ],
      );

      // Lock stock row
      const stockResult = await trx.query(
        `
        SELECT *
        FROM inventory_stock
        WHERE product_id = $1
          AND location_id = $2
        FOR UPDATE
        `,
        [
          item.product_id,
          item.location_id,
        ],
      );

      const stock = stockResult.rows[0];

      if (!stock) {
        const error = new Error(
          `Inventory stock record could not be created for product ${item.product_id}.`,
        );

        error.statusCode = 500;
        throw error;
      }

      const before = Number(stock.quantity);
      const after = before + quantity;

      // Update stock
      await trx.query(
        `
        UPDATE inventory_stock
        SET
          quantity = $1,
          updated_at = NOW()
        WHERE product_id = $2
          AND location_id = $3
        `,
        [
          after,
          item.product_id,
          item.location_id,
        ],
      );

      // Stock ledger
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
          'receipt',
          'receipt',
          $6,
          $7,
          $8
        )
        `,
        [
          item.product_id,
          item.location_id,
          quantity,
          before,
          after,
          receipt.id,
          `Receipt ${receipt.id}`,
          userId,
        ],
      );
    }

    // 5. Mark receipt as done
    const updated = await repository.updateStatus(
      receiptId,
      "done",
      userId,
      trx,
    );

    return updated;
  });
}

async function cancelReceipt(receiptId, userId) {
  return db.transaction(async (trx) => {
    const receipt = await repository.lockReceipt(receiptId, trx);

    if (!receipt) {
      const error = new Error("Receipt not found");
      error.statusCode = 404;
      throw error;
    }

    if (receipt.status === "done") {
      const error = new Error(
        "Completed receipts cannot be canceled directly. A compensating adjustment is required.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (receipt.status === "canceled") {
      const error = new Error("Receipt is already canceled");
      error.statusCode = 409;
      throw error;
    }

    return repository.updateStatus(receiptId, "canceled", userId, trx);
  });
}

module.exports = {
  createReceipt,
  getReceipt,
  listReceipts,
  addItem,
  validateReceipt,
  cancelReceipt,
};

