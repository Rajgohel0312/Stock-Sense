const db = require("../../database");
const repository = require("./adjustment.repository");

async function createAdjustment(data) {
  const wh = await db.query(
    "SELECT id, is_active FROM warehouses WHERE id = $1",
    [data.warehouseId],
  );

  if (!wh.rows.length || !wh.rows[0].is_active) {
    const error = new Error("Warehouse not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  return repository.createAdjustment(data);
}

async function getAdjustment(id) {
  const adjustment = await repository.findById(id);
  if (!adjustment) {
    const error = new Error("Adjustment not found");
    error.statusCode = 404;
    throw error;
  }

  adjustment.items = await repository.findItems(id);
  return adjustment;
}

async function listAdjustments(filters) {
  return repository.list(filters);
}

async function addItem(adjustmentId, data) {
  const adjustment = await repository.findById(adjustmentId);
  if (!adjustment) {
    const error = new Error("Adjustment not found");
    error.statusCode = 404;
    throw error;
  }

  if (adjustment.status !== "draft" && adjustment.status !== "count") {
    const error = new Error("Items can only be added to draft or count adjustments");
    error.statusCode = 409;
    throw error;
  }

  // Validate location belongs to warehouse
  const loc = await db.query(
    "SELECT id, is_active FROM locations WHERE id = $1 AND warehouse_id = $2",
    [data.locationId, adjustment.warehouse_id],
  );
  if (!loc.rows.length || !loc.rows[0].is_active) {
    const error = new Error("Location does not belong to adjustment warehouse or is inactive");
    error.statusCode = 400;
    throw error;
  }

  // Validate product is active
  const prod = await db.query(
    "SELECT id, is_active FROM products WHERE id = $1",
    [data.productId],
  );
  if (!prod.rows.length || !prod.rows[0].is_active) {
    const error = new Error("Product not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  const existing = await repository.findItem(adjustmentId, data.productId, data.locationId);
  if (existing) {
    const error = new Error("Product at this location already exists in this adjustment");
    error.statusCode = 409;
    throw error;
  }

  // Read current system quantity
  const stockResult = await db.query(
    "SELECT quantity FROM inventory_stock WHERE product_id = $1 AND location_id = $2",
    [data.productId, data.locationId],
  );
  const currentSystemQuantity = stockResult.rows.length
    ? Number(stockResult.rows[0].quantity)
    : 0;

  return repository.addItem({
    adjustmentId,
    productId: data.productId,
    locationId: data.locationId,
    systemQuantity: currentSystemQuantity,
    countedQuantity: Number(data.countedQuantity),
  });
}

async function validateAdjustment(adjustmentId, userId) {
  return db.transaction(async (trx) => {
    const adjustment = await repository.lockAdjustment(adjustmentId, trx);
    if (!adjustment) {
      const error = new Error("Adjustment not found");
      error.statusCode = 404;
      throw error;
    }

    if (adjustment.status === "done") {
      const error = new Error("Adjustment already validated");
      error.statusCode = 409;
      throw error;
    }

    if (adjustment.status === "canceled") {
      const error = new Error("Canceled adjustments cannot be validated");
      error.statusCode = 409;
      throw error;
    }

    const items = await repository.findItems(adjustmentId, trx);
    if (!items.length) {
      const error = new Error("Adjustment must contain at least one item");
      error.statusCode = 400;
      throw error;
    }

    for (const item of items) {
      const counted = Number(item.counted_quantity);

      // Ensure stock row exists
      await trx.query(
        `
        INSERT INTO inventory_stock (product_id, location_id, quantity, reserved_quantity)
        VALUES ($1, $2, 0, 0)
        ON CONFLICT (product_id, location_id) DO NOTHING
        `,
        [item.product_id, item.location_id],
      );

      // Lock stock row
      const stockResult = await trx.query(
        "SELECT * FROM inventory_stock WHERE product_id = $1 AND location_id = $2 FOR UPDATE",
        [item.product_id, item.location_id],
      );

      const stock = stockResult.rows[0];
      const currentSystemQuantity = Number(stock.quantity);
      const reservedQuantity = Number(stock.reserved_quantity);

      if (counted < reservedQuantity) {
        const error = new Error(
          `Counted quantity (${counted}) cannot be less than reserved quantity (${reservedQuantity}) for product ${item.product_id}`,
        );
        error.statusCode = 409;
        throw error;
      }

      const difference = counted - currentSystemQuantity;

      // Update actual stock
      await trx.query(
        "UPDATE inventory_stock SET quantity = $1, updated_at = NOW() WHERE product_id = $2 AND location_id = $3",
        [counted, item.product_id, item.location_id],
      );

      // Also update system_quantity in adjustment_items to reflect accurate database state at time of validation
      await trx.query(
        "UPDATE adjustment_items SET system_quantity = $1 WHERE id = $2",
        [currentSystemQuantity, item.id],
      );

      // Insert into stock_ledger
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
        VALUES ($1, $2, $3, $4, $5, 'adjustment', 'adjustment', $6, $7, $8)
        `,
        [
          item.product_id,
          item.location_id,
          difference,
          currentSystemQuantity,
          counted,
          adjustment.id,
          `Adjustment ${adjustment.id}`,
          userId,
        ],
      );
    }

    return repository.updateStatus(adjustmentId, "done", userId, trx);
  });
}

async function cancelAdjustment(adjustmentId, userId) {
  return db.transaction(async (trx) => {
    const adjustment = await repository.lockAdjustment(adjustmentId, trx);
    if (!adjustment) {
      const error = new Error("Adjustment not found");
      error.statusCode = 404;
      throw error;
    }

    if (adjustment.status === "done") {
      const error = new Error(
        "Completed adjustments cannot be canceled directly. A new adjustment is required.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (adjustment.status === "canceled") {
      const error = new Error("Adjustment is already canceled");
      error.statusCode = 409;
      throw error;
    }

    return repository.updateStatus(adjustmentId, "canceled", userId, trx);
  });
}

module.exports = {
  createAdjustment,
  getAdjustment,
  listAdjustments,
  addItem,
  validateAdjustment,
  cancelAdjustment,
};
