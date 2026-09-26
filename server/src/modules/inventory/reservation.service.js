const db = require("../../database");
const repository = require("./reservation.repository");

async function createReservation(data) {
  return db.transaction(async (trx) => {
    // Check product is active
    const prod = await trx.query(
      "SELECT id, is_active FROM products WHERE id = $1",
      [data.productId],
    );
    if (!prod.rows.length || !prod.rows[0].is_active) {
      const error = new Error("Product not found or inactive");
      error.statusCode = 400;
      throw error;
    }

    // Check location is active
    const loc = await trx.query(
      "SELECT id, is_active FROM locations WHERE id = $1",
      [data.locationId],
    );
    if (!loc.rows.length || !loc.rows[0].is_active) {
      const error = new Error("Location not found or inactive");
      error.statusCode = 400;
      throw error;
    }

    // Lock inventory_stock row
    const stockResult = await trx.query(
      `
      SELECT id, quantity, reserved_quantity
      FROM inventory_stock
      WHERE product_id = $1 AND location_id = $2
      FOR UPDATE
      `,
      [data.productId, data.locationId],
    );

    if (!stockResult.rows.length) {
      const error = new Error("No stock exists for this product at the specified location");
      error.statusCode = 409;
      throw error;
    }

    const stock = stockResult.rows[0];
    const currentQty = Number(stock.quantity);
    const currentReserved = Number(stock.reserved_quantity);
    const available = currentQty - currentReserved;
    const requested = Number(data.quantity);

    if (requested > available) {
      const error = new Error(
        `Insufficient available stock for reservation. Available: ${available}, requested: ${requested}`,
      );
      error.statusCode = 409;
      throw error;
    }

    const newReserved = currentReserved + requested;

    await trx.query(
      `
      UPDATE inventory_stock
      SET
        reserved_quantity = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [newReserved, stock.id],
    );

    const reservation = await repository.createReservation(
      {
        productId: data.productId,
        locationId: data.locationId,
        quantity: requested,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        createdBy: data.createdBy,
      },
      trx,
    );

    return reservation;
  });
}

async function getReservation(id) {
  const reservation = await repository.findById(id);
  if (!reservation) {
    const error = new Error("Reservation not found");
    error.statusCode = 404;
    throw error;
  }
  return reservation;
}

async function listReservations(filters) {
  return repository.list(filters);
}

async function releaseReservation(id, userId) {
  return db.transaction(async (trx) => {
    const reservation = await repository.lockReservation(id, trx);
    if (!reservation) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }

    if (reservation.status !== "active") {
      const error = new Error(
        `Cannot release reservation with status '${reservation.status}'`,
      );
      error.statusCode = 409;
      throw error;
    }

    // Lock stock row
    const stockResult = await trx.query(
      `
      SELECT id, quantity, reserved_quantity
      FROM inventory_stock
      WHERE product_id = $1 AND location_id = $2
      FOR UPDATE
      `,
      [reservation.product_id, reservation.location_id],
    );

    if (stockResult.rows.length) {
      const stock = stockResult.rows[0];
      const currentReserved = Number(stock.reserved_quantity);
      const resQty = Number(reservation.quantity);
      const newReserved = Math.max(0, currentReserved - resQty);

      await trx.query(
        `
        UPDATE inventory_stock
        SET
          reserved_quantity = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [newReserved, stock.id],
      );
    }

    const updated = await repository.updateStatus(id, "released", trx);
    return updated;
  });
}

module.exports = {
  createReservation,
  getReservation,
  listReservations,
  releaseReservation,
};
