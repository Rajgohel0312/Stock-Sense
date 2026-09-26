const db = require("../../database");

async function findStock(
  productId,
  locationId
) {
  const result = await db.raw(
    `
    SELECT
      s.id,
      s.product_id,
      p.name AS product_name,
      p.sku,

      s.location_id,
      l.name AS location_name,
      l.code AS location_code,

      s.quantity,
      s.reserved_quantity,

      s.created_at,
      s.updated_at

    FROM inventory_stock s

    INNER JOIN products p
      ON p.id = s.product_id

    INNER JOIN locations l
      ON l.id = s.location_id

    WHERE s.product_id = $1
      AND s.location_id = $2

    LIMIT 1
    `,
    [
      productId,
      locationId
    ]
  );

  return result.rows[0] || null;
}
async function findAll({
  productId,
  warehouseId,
  locationId,
  search
} = {}) {
  let query = `
    SELECT
      s.id,
      s.product_id,
      p.name AS product_name,
      p.sku,

      s.location_id,
      l.name AS location_name,
      l.code AS location_code,

      l.warehouse_id,
      w.name AS warehouse_name,
      w.code AS warehouse_code,

      s.quantity,
      s.reserved_quantity,

      (
        s.quantity - s.reserved_quantity
      ) AS available_quantity

    FROM inventory_stock s

    INNER JOIN products p
      ON p.id = s.product_id

    INNER JOIN locations l
      ON l.id = s.location_id

    INNER JOIN warehouses w
      ON w.id = l.warehouse_id

    WHERE 1 = 1
  `;

  const params = [];

  if (productId) {
    params.push(productId);

    query += `
      AND s.product_id = $${params.length}
    `;
  }

  if (warehouseId) {
    params.push(warehouseId);

    query += `
      AND l.warehouse_id = $${params.length}
    `;
  }

  if (locationId) {
    params.push(locationId);

    query += `
      AND s.location_id = $${params.length}
    `;
  }

  if (search) {
    params.push(`%${search}%`);

    query += `
      AND (
        p.name ILIKE $${params.length}
        OR p.sku ILIKE $${params.length}
        OR l.name ILIKE $${params.length}
        OR l.code ILIKE $${params.length}
      )
    `;
  }

  query += `
    ORDER BY
      p.name ASC,
      w.name ASC,
      l.name ASC
  `;

  const result =
    await db.raw(query, params);

  return result.rows;
}
async function changeQuantity({
  productId,
  locationId,
  quantityChange,
  movementType,
  referenceType = null,
  referenceId = null,
  notes = null,
  userId
}) {
  return db.transaction(async (trx) => {

    /*
     * Lock the stock row.
     */
    const stockResult =
      await trx.query(
        `
        SELECT
          id,
          product_id,
          location_id,
          quantity,
          reserved_quantity

        FROM inventory_stock

        WHERE product_id = $1
          AND location_id = $2

        FOR UPDATE
        `,
        [
          productId,
          locationId
        ]
      );

    let stock =
      stockResult.rows[0];

    /*
     * If no stock row exists,
     * create it.
     */
    if (!stock) {
      const insertResult =
        await trx.query(
          `
          INSERT INTO inventory_stock (
            product_id,
            location_id,
            quantity,
            reserved_quantity
          )
          VALUES (
            $1,
            $2,
            0,
            0
          )
          RETURNING
            id,
            product_id,
            location_id,
            quantity,
            reserved_quantity
          `,
          [
            productId,
            locationId
          ]
        );

      stock =
        insertResult.rows[0];

      /*
       * Lock the newly created row.
       */
      const lockedResult =
        await trx.query(
          `
          SELECT
            id,
            product_id,
            location_id,
            quantity,
            reserved_quantity

          FROM inventory_stock

          WHERE id = $1

          FOR UPDATE
          `,
          [stock.id]
        );

      stock =
        lockedResult.rows[0];
    }

    const quantityBefore =
      Number(stock.quantity);

    const quantityAfter =
      quantityBefore +
      Number(quantityChange);

    /*
     * Never allow negative stock.
     */
    if (quantityAfter < 0) {
      const error = new Error(
        `Insufficient stock. Available quantity: ${quantityBefore}`
      );

      error.statusCode = 400;

      throw error;
    }

    /*
     * Update stock.
     */
    const updateResult =
      await trx.query(
        `
        UPDATE inventory_stock

        SET
          quantity = $1,
          updated_at = NOW()

        WHERE id = $2

        RETURNING
          id,
          product_id,
          location_id,
          quantity,
          reserved_quantity
        `,
        [
          quantityAfter,
          stock.id
        ]
      );

    /*
     * Write immutable audit record.
     */
    const ledgerResult =
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
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING
          id,
          product_id,
          location_id,
          quantity_change,
          quantity_before,
          quantity_after,
          movement_type,
          reference_type,
          reference_id,
          notes,
          created_by,
          created_at
        `,
        [
          productId,
          locationId,
          quantityChange,
          quantityBefore,
          quantityAfter,
          movementType,
          referenceType,
          referenceId,
          notes,
          userId
        ]
      );

    return {
      stock: updateResult.rows[0],
      ledger: ledgerResult.rows[0]
    };
  });
}

async function getLedger({
  productId,
  locationId,
  warehouseId,
  movementType,
  limit = 100,
  offset = 0
} = {}) {
  let query = `
    SELECT
      sl.id,

      sl.product_id,
      p.name AS product_name,
      p.sku,

      sl.location_id,
      l.name AS location_name,
      l.code AS location_code,

      l.warehouse_id,
      w.name AS warehouse_name,

      sl.quantity_change,
      sl.quantity_before,
      sl.quantity_after,

      sl.movement_type,
      sl.reference_type,
      sl.reference_id,

      sl.notes,

      sl.created_by,
      u.name AS created_by_name,

      sl.created_at

    FROM stock_ledger sl

    INNER JOIN products p
      ON p.id = sl.product_id

    INNER JOIN locations l
      ON l.id = sl.location_id

    INNER JOIN warehouses w
      ON w.id = l.warehouse_id

    LEFT JOIN users u
      ON u.id = sl.created_by

    WHERE 1 = 1
  `;

  const params = [];

  if (productId) {
    params.push(productId);

    query += `
      AND sl.product_id = $${params.length}
    `;
  }

  if (locationId) {
    params.push(locationId);

    query += `
      AND sl.location_id = $${params.length}
    `;
  }

  if (warehouseId) {
    params.push(warehouseId);

    query += `
      AND l.warehouse_id = $${params.length}
    `;
  }

  if (movementType) {
    params.push(movementType);

    query += `
      AND sl.movement_type = $${params.length}
    `;
  }

  query += `
    ORDER BY sl.created_at DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  params.push(
    Math.min(Number(limit) || 100, 500)
  );

  params.push(
    Math.max(Number(offset) || 0, 0)
  );

  const result =
    await db.raw(query, params);

  return result.rows;
}

module.exports = {
  findStock,
  findAll,
  changeQuantity,
  getLedger
};