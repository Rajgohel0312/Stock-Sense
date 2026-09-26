const db = require("../../database");
const repository = require("./transfer.repository");

async function createTransfer(data) {
  // Validate source warehouse
  const srcWh = await db.query(
    "SELECT id, is_active FROM warehouses WHERE id = $1",
    [data.sourceWarehouseId],
  );
  if (!srcWh.rows.length || !srcWh.rows[0].is_active) {
    const error = new Error("Source warehouse not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  // Validate destination warehouse
  const destWh = await db.query(
    "SELECT id, is_active FROM warehouses WHERE id = $1",
    [data.destinationWarehouseId],
  );
  if (!destWh.rows.length || !destWh.rows[0].is_active) {
    const error = new Error("Destination warehouse not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  // If sourceLocationId provided, validate
  if (data.sourceLocationId) {
    const srcLoc = await db.query(
      "SELECT id, is_active FROM locations WHERE id = $1 AND warehouse_id = $2",
      [data.sourceLocationId, data.sourceWarehouseId],
    );
    if (!srcLoc.rows.length || !srcLoc.rows[0].is_active) {
      const error = new Error("Source location does not belong to source warehouse or is inactive");
      error.statusCode = 400;
      throw error;
    }
  }

  // If destinationLocationId provided, validate
  if (data.destinationLocationId) {
    const destLoc = await db.query(
      "SELECT id, is_active FROM locations WHERE id = $1 AND warehouse_id = $2",
      [data.destinationLocationId, data.destinationWarehouseId],
    );
    if (!destLoc.rows.length || !destLoc.rows[0].is_active) {
      const error = new Error("Destination location does not belong to destination warehouse or is inactive");
      error.statusCode = 400;
      throw error;
    }
  }

  return repository.createTransfer(data);
}

async function getTransfer(id) {
  const transfer = await repository.findById(id);
  if (!transfer) {
    const error = new Error("Transfer not found");
    error.statusCode = 404;
    throw error;
  }

  transfer.items = await repository.findItems(id);
  return transfer;
}

async function listTransfers(filters) {
  return repository.list(filters);
}

async function addItem(transferId, data) {
  const transfer = await repository.findById(transferId);
  if (!transfer) {
    const error = new Error("Transfer not found");
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== "draft") {
    const error = new Error("Items can only be added to draft transfers");
    error.statusCode = 409;
    throw error;
  }

  const sourceLocationId =
    data.sourceLocationId ||
    data.source_location_id ||
    transfer.source_location_id;
  const destinationLocationId =
    data.destinationLocationId ||
    data.destLocationId ||
    data.destination_location_id ||
    data.dest_location_id ||
    transfer.destination_location_id;

  if (!sourceLocationId || !destinationLocationId) {
    const error = new Error("Both source and destination locations must be specified");
    error.statusCode = 400;
    throw error;
  }

  if (sourceLocationId === destinationLocationId) {
    const error = new Error("Source and destination locations cannot be the same");
    error.statusCode = 400;
    throw error;
  }

  // Check product is active
  const prod = await db.query(
    "SELECT id, is_active FROM products WHERE id = $1",
    [data.productId],
  );
  if (!prod.rows.length || !prod.rows[0].is_active) {
    const error = new Error("Product not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  const existing = await repository.findItem(transferId, data.productId);
  if (existing) {
    const error = new Error("Product already exists in this transfer");
    error.statusCode = 409;
    throw error;
  }

  return repository.addItem({
    transferId,
    productId: data.productId,
    sourceLocationId,
    destinationLocationId,
    quantity: data.quantity,
  });
}

async function markReady(transferId, userId) {
  return db.transaction(async (trx) => {
    const transfer = await repository.lockTransfer(transferId, trx);
    if (!transfer) {
      const error = new Error("Transfer not found");
      error.statusCode = 404;
      throw error;
    }

    if (transfer.status !== "draft") {
      const error = new Error(`Transfer must be in draft status to mark ready, current: ${transfer.status}`);
      error.statusCode = 409;
      throw error;
    }

    const items = await repository.findItems(transferId, trx);
    if (!items.length) {
      const error = new Error("Transfer must contain at least one item before marking ready");
      error.statusCode = 400;
      throw error;
    }

    return repository.updateStatus(transferId, "ready", userId, trx);
  });
}

async function validateTransfer(transferId, userId) {
  return db.transaction(async (trx) => {
    const transfer = await repository.lockTransfer(transferId, trx);
    if (!transfer) {
      const error = new Error("Transfer not found");
      error.statusCode = 404;
      throw error;
    }

    if (transfer.status === "done") {
      const error = new Error("Transfer already validated");
      error.statusCode = 409;
      throw error;
    }

    if (transfer.status !== "ready") {
      const error = new Error("Only ready transfers can be validated");
      error.statusCode = 409;
      throw error;
    }

    const items = await repository.findItems(transferId, trx);
    if (!items.length) {
      const error = new Error("Transfer must contain at least one item");
      error.statusCode = 400;
      throw error;
    }

    for (const item of items) {
      const quantity = Number(item.quantity);

      // Validate source location belongs to source warehouse and is active
      const srcLoc = await trx.query(
        "SELECT id FROM locations WHERE id = $1 AND warehouse_id = $2 AND is_active = TRUE FOR UPDATE",
        [item.source_location_id, transfer.source_warehouse_id],
      );
      if (!srcLoc.rows.length) {
        const error = new Error(`Source location does not belong to source warehouse or is inactive`);
        error.statusCode = 400;
        throw error;
      }

      // Validate destination location belongs to destination warehouse and is active
      const destLoc = await trx.query(
        "SELECT id FROM locations WHERE id = $1 AND warehouse_id = $2 AND is_active = TRUE FOR UPDATE",
        [item.destination_location_id, transfer.destination_warehouse_id],
      );
      if (!destLoc.rows.length) {
        const error = new Error(`Destination location does not belong to destination warehouse or is inactive`);
        error.statusCode = 400;
        throw error;
      }

      // Lock source stock row
      const srcStockResult = await trx.query(
        "SELECT * FROM inventory_stock WHERE product_id = $1 AND location_id = $2 FOR UPDATE",
        [item.product_id, item.source_location_id],
      );

      if (!srcStockResult.rows.length) {
        const error = new Error(`No stock exists at source location for product ${item.product_id}`);
        error.statusCode = 409;
        throw error;
      }

      const srcStock = srcStockResult.rows[0];
      const srcQuantity = Number(srcStock.quantity);
      const srcReserved = Number(srcStock.reserved_quantity);
      const srcAvailable = srcQuantity - srcReserved;

      if (srcAvailable < quantity) {
        const error = new Error(
          `Insufficient stock at source location for product ${item.product_id}. Available: ${srcAvailable}, required: ${quantity}`,
        );
        error.statusCode = 409;
        throw error;
      }

      // Ensure destination stock row exists
      await trx.query(
        `
        INSERT INTO inventory_stock (product_id, location_id, quantity, reserved_quantity)
        VALUES ($1, $2, 0, 0)
        ON CONFLICT (product_id, location_id) DO NOTHING
        `,
        [item.product_id, item.destination_location_id],
      );

      // Lock destination stock row
      const destStockResult = await trx.query(
        "SELECT * FROM inventory_stock WHERE product_id = $1 AND location_id = $2 FOR UPDATE",
        [item.product_id, item.destination_location_id],
      );
      const destStock = destStockResult.rows[0];
      const destQuantity = Number(destStock.quantity);

      // Deduct from source
      const srcBefore = srcQuantity;
      const srcAfter = srcQuantity - quantity;
      await trx.query(
        "UPDATE inventory_stock SET quantity = $1, updated_at = NOW() WHERE product_id = $2 AND location_id = $3",
        [srcAfter, item.product_id, item.source_location_id],
      );

      // Add to destination
      const destBefore = destQuantity;
      const destAfter = destQuantity + quantity;
      await trx.query(
        "UPDATE inventory_stock SET quantity = $1, updated_at = NOW() WHERE product_id = $2 AND location_id = $3",
        [destAfter, item.product_id, item.destination_location_id],
      );

      // Ledger transfer_out
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
        VALUES ($1, $2, $3, $4, $5, 'transfer_out', 'transfer', $6, $7, $8)
        `,
        [
          item.product_id,
          item.source_location_id,
          -quantity,
          srcBefore,
          srcAfter,
          transfer.id,
          `Transfer out ${transfer.id}`,
          userId,
        ],
      );

      // Ledger transfer_in
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
        VALUES ($1, $2, $3, $4, $5, 'transfer_in', 'transfer', $6, $7, $8)
        `,
        [
          item.product_id,
          item.destination_location_id,
          quantity,
          destBefore,
          destAfter,
          transfer.id,
          `Transfer in ${transfer.id}`,
          userId,
        ],
      );
    }

    return repository.updateStatus(transferId, "done", userId, trx);
  });
}

async function cancelTransfer(transferId, userId) {
  return db.transaction(async (trx) => {
    const transfer = await repository.lockTransfer(transferId, trx);
    if (!transfer) {
      const error = new Error("Transfer not found");
      error.statusCode = 404;
      throw error;
    }

    if (transfer.status === "done") {
      const error = new Error(
        "Completed transfers cannot be canceled directly. A reverse transfer is required.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (transfer.status === "canceled") {
      const error = new Error("Transfer is already canceled");
      error.statusCode = 409;
      throw error;
    }

    return repository.updateStatus(transferId, "canceled", userId, trx);
  });
}

module.exports = {
  createTransfer,
  getTransfer,
  listTransfers,
  addItem,
  markReady,
  validateTransfer,
  cancelTransfer,
};
