const db = require("../../database");

async function findStock(productId, locationId) {
  const result = await db.raw(
    `
    SELECT
      s.id,
      s.product_id,
      p.name AS product_name,
      p.sku,
      p.category_id,
      c.name AS category_name,

      s.location_id,
      l.name AS location_name,
      l.code AS location_code,

      s.quantity,
      s.reserved_quantity,
      (s.quantity - s.reserved_quantity) AS available_quantity,

      s.created_at,
      s.updated_at

    FROM inventory_stock s
    INNER JOIN products p ON p.id = s.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN locations l ON l.id = s.location_id

    WHERE s.product_id = $1
      AND s.location_id = $2

    LIMIT 1
    `,
    [productId, locationId],
  );

  return result.rows[0] || null;
}

async function findAll({
  productId,
  categoryId,
  warehouseId,
  locationId,
  search,
  lowStock,
  outOfStock,
  limit = 100,
  offset = 0,
} = {}) {
  let query = `
    SELECT
      s.id,
      s.product_id,
      p.name AS product_name,
      p.sku,
      p.category_id,
      cat.name AS category_name,

      s.location_id,
      l.name AS location_name,
      l.code AS location_code,

      l.warehouse_id,
      w.name AS warehouse_name,
      w.code AS warehouse_code,

      s.quantity,
      s.reserved_quantity,
      (s.quantity - s.reserved_quantity) AS available_quantity,

      rr.minimum_quantity AS reorder_minimum,
      rr.reorder_quantity

    FROM inventory_stock s
    INNER JOIN products p ON p.id = s.product_id
    LEFT JOIN categories cat ON cat.id = p.category_id
    INNER JOIN locations l ON l.id = s.location_id
    INNER JOIN warehouses w ON w.id = l.warehouse_id
    LEFT JOIN reorder_rules rr
      ON rr.product_id = s.product_id
      AND (rr.location_id IS NULL OR rr.location_id = s.location_id)
      AND rr.is_active = TRUE

    WHERE 1 = 1
  `;

  const params = [];

  if (productId) {
    params.push(productId);
    query += ` AND s.product_id = $${params.length}`;
  }

  if (categoryId) {
    params.push(categoryId);
    query += ` AND p.category_id = $${params.length}`;
  }

  if (warehouseId) {
    params.push(warehouseId);
    query += ` AND l.warehouse_id = $${params.length}`;
  }

  if (locationId) {
    params.push(locationId);
    query += ` AND s.location_id = $${params.length}`;
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

  if (outOfStock === "true" || outOfStock === true) {
    query += ` AND (s.quantity - s.reserved_quantity) <= 0`;
  }

  if (lowStock === "true" || lowStock === true) {
    query += `
      AND (s.quantity - s.reserved_quantity) > 0
      AND (s.quantity - s.reserved_quantity) <= COALESCE(rr.minimum_quantity, 10)
    `;
  }

  query += `
    ORDER BY p.name ASC, w.name ASC, l.name ASC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  params.push(Math.min(Number(limit) || 100, 500));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await db.raw(query, params);
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
  userId,
}) {
  return db.transaction(async (trx) => {
    const stockResult = await trx.query(
      `
      SELECT id, product_id, location_id, quantity, reserved_quantity
      FROM inventory_stock
      WHERE product_id = $1 AND location_id = $2
      FOR UPDATE
      `,
      [productId, locationId],
    );

    let stock = stockResult.rows[0];

    if (!stock) {
      const insertResult = await trx.query(
        `
        INSERT INTO inventory_stock (product_id, location_id, quantity, reserved_quantity)
        VALUES ($1, $2, 0, 0)
        RETURNING id, product_id, location_id, quantity, reserved_quantity
        `,
        [productId, locationId],
      );

      stock = insertResult.rows[0];

      const lockedResult = await trx.query(
        `
        SELECT id, product_id, location_id, quantity, reserved_quantity
        FROM inventory_stock
        WHERE id = $1
        FOR UPDATE
        `,
        [stock.id],
      );

      stock = lockedResult.rows[0];
    }

    const quantityBefore = Number(stock.quantity);
    const quantityAfter = quantityBefore + Number(quantityChange);

    if (quantityAfter < 0) {
      const error = new Error(
        `Insufficient stock. Available quantity: ${quantityBefore}`,
      );
      error.statusCode = 400;
      throw error;
    }

    const updateResult = await trx.query(
      `
      UPDATE inventory_stock
      SET quantity = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, product_id, location_id, quantity, reserved_quantity
      `,
      [quantityAfter, stock.id],
    );

    const ledgerResult = await trx.query(
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        userId,
      ],
    );

    return {
      stock: updateResult.rows[0],
      ledger: ledgerResult.rows[0],
    };
  });
}

async function getLedger({
  productId,
  locationId,
  warehouseId,
  movementType,
  referenceType,
  referenceId,
  createdBy,
  dateFrom,
  dateTo,
  limit = 100,
  offset = 0,
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
    INNER JOIN products p ON p.id = sl.product_id
    INNER JOIN locations l ON l.id = sl.location_id
    INNER JOIN warehouses w ON w.id = l.warehouse_id
    LEFT JOIN users u ON u.id = sl.created_by
    WHERE 1 = 1
  `;

  const params = [];

  if (productId) {
    params.push(productId);
    query += ` AND sl.product_id = $${params.length}`;
  }

  if (locationId) {
    params.push(locationId);
    query += ` AND sl.location_id = $${params.length}`;
  }

  if (warehouseId) {
    params.push(warehouseId);
    query += ` AND l.warehouse_id = $${params.length}`;
  }

  if (movementType) {
    params.push(movementType);
    query += ` AND sl.movement_type = $${params.length}`;
  }

  if (referenceType) {
    params.push(referenceType);
    query += ` AND sl.reference_type = $${params.length}`;
  }

  if (referenceId) {
    params.push(referenceId);
    query += ` AND sl.reference_id = $${params.length}`;
  }

  if (createdBy) {
    params.push(createdBy);
    query += ` AND sl.created_by = $${params.length}`;
  }

  if (dateFrom) {
    params.push(dateFrom);
    query += ` AND sl.created_at >= $${params.length}`;
  }

  if (dateTo) {
    params.push(dateTo);
    query += ` AND sl.created_at <= $${params.length}`;
  }

  query += `
    ORDER BY sl.created_at DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  params.push(Math.min(Number(limit) || 100, 500));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await db.raw(query, params);
  return result.rows;
}

async function findDocuments({
  type,
  status,
  warehouseId,
  locationId,
  productId,
  categoryId,
  dateFrom,
  dateTo,
  limit = 50,
  offset = 0,
} = {}) {
  const parts = [];
  const params = [];

  const types = type
    ? [type.toLowerCase()]
    : ["receipt", "delivery", "transfer", "adjustment"];

  if (types.includes("receipt")) {
    let q = `
      SELECT
        r.id,
        'receipt' AS document_type,
        r.receipt_number AS document_number,
        r.status,
        r.warehouse_id,
        w.name AS warehouse_name,
        NULL::UUID AS location_id,
        NULL::VARCHAR AS location_name,
        r.created_by,
        u.name AS created_by_name,
        r.created_at,
        r.updated_at
      FROM receipts r
      LEFT JOIN warehouses w ON w.id = r.warehouse_id
      LEFT JOIN users u ON u.id = r.created_by
      WHERE 1=1
    `;
    if (status) {
      params.push(status);
      q += ` AND r.status = $${params.length}`;
    }
    if (warehouseId) {
      params.push(warehouseId);
      q += ` AND r.warehouse_id = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      q += ` AND r.created_at >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      q += ` AND r.created_at <= $${params.length}`;
    }
    if (productId || categoryId || locationId) {
      q += ` AND EXISTS (
        SELECT 1 FROM receipt_items ri
        JOIN products rp ON rp.id = ri.product_id
        WHERE ri.receipt_id = r.id
      `;
      if (productId) {
        params.push(productId);
        q += ` AND ri.product_id = $${params.length}`;
      }
      if (categoryId) {
        params.push(categoryId);
        q += ` AND rp.category_id = $${params.length}`;
      }
      if (locationId) {
        params.push(locationId);
        q += ` AND ri.location_id = $${params.length}`;
      }
      q += ` )`;
    }
    parts.push(q);
  }

  if (types.includes("delivery")) {
    let q = `
      SELECT
        d.id,
        'delivery' AS document_type,
        d.delivery_number AS document_number,
        d.status,
        d.warehouse_id,
        w.name AS warehouse_name,
        d.location_id,
        l.name AS location_name,
        d.created_by,
        u.name AS created_by_name,
        d.created_at,
        d.updated_at
      FROM deliveries d
      LEFT JOIN warehouses w ON w.id = d.warehouse_id
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN users u ON u.id = d.created_by
      WHERE 1=1
    `;
    if (status) {
      params.push(status);
      q += ` AND d.status = $${params.length}`;
    }
    if (warehouseId) {
      params.push(warehouseId);
      q += ` AND d.warehouse_id = $${params.length}`;
    }
    if (locationId) {
      params.push(locationId);
      q += ` AND d.location_id = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      q += ` AND d.created_at >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      q += ` AND d.created_at <= $${params.length}`;
    }
    if (productId || categoryId) {
      q += ` AND EXISTS (
        SELECT 1 FROM delivery_items di
        JOIN products dp ON dp.id = di.product_id
        WHERE di.delivery_id = d.id
      `;
      if (productId) {
        params.push(productId);
        q += ` AND di.product_id = $${params.length}`;
      }
      if (categoryId) {
        params.push(categoryId);
        q += ` AND dp.category_id = $${params.length}`;
      }
      q += ` )`;
    }
    parts.push(q);
  }

  if (types.includes("transfer")) {
    let q = `
      SELECT
        t.id,
        'transfer' AS document_type,
        t.transfer_number AS document_number,
        t.status,
        t.source_warehouse_id AS warehouse_id,
        w.name AS warehouse_name,
        t.source_location_id AS location_id,
        l.name AS location_name,
        t.created_by,
        u.name AS created_by_name,
        t.created_at,
        t.updated_at
      FROM transfers t
      LEFT JOIN warehouses w ON w.id = t.source_warehouse_id
      LEFT JOIN locations l ON l.id = t.source_location_id
      LEFT JOIN users u ON u.id = t.created_by
      WHERE 1=1
    `;
    if (status) {
      params.push(status);
      q += ` AND t.status = $${params.length}`;
    }
    if (warehouseId) {
      params.push(warehouseId);
      q += ` AND (t.source_warehouse_id = $${params.length} OR t.destination_warehouse_id = $${params.length})`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      q += ` AND t.created_at >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      q += ` AND t.created_at <= $${params.length}`;
    }
    if (productId || categoryId || locationId) {
      q += ` AND EXISTS (
        SELECT 1 FROM transfer_items ti
        JOIN products tp ON tp.id = ti.product_id
        WHERE ti.transfer_id = t.id
      `;
      if (productId) {
        params.push(productId);
        q += ` AND ti.product_id = $${params.length}`;
      }
      if (categoryId) {
        params.push(categoryId);
        q += ` AND tp.category_id = $${params.length}`;
      }
      if (locationId) {
        params.push(locationId);
        q += ` AND (ti.source_location_id = $${params.length} OR ti.destination_location_id = $${params.length})`;
      }
      q += ` )`;
    }
    parts.push(q);
  }

  if (types.includes("adjustment")) {
    let q = `
      SELECT
        a.id,
        'adjustment' AS document_type,
        a.adjustment_number AS document_number,
        a.status,
        a.warehouse_id,
        w.name AS warehouse_name,
        a.location_id,
        l.name AS location_name,
        a.created_by,
        u.name AS created_by_name,
        a.created_at,
        a.updated_at
      FROM adjustments a
      LEFT JOIN warehouses w ON w.id = a.warehouse_id
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN users u ON u.id = a.created_by
      WHERE 1=1
    `;
    if (status) {
      params.push(status);
      q += ` AND a.status = $${params.length}`;
    }
    if (warehouseId) {
      params.push(warehouseId);
      q += ` AND a.warehouse_id = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      q += ` AND a.created_at >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      q += ` AND a.created_at <= $${params.length}`;
    }
    if (productId || categoryId || locationId) {
      q += ` AND EXISTS (
        SELECT 1 FROM adjustment_items ai
        JOIN products ap ON ap.id = ai.product_id
        WHERE ai.adjustment_id = a.id
      `;
      if (productId) {
        params.push(productId);
        q += ` AND ai.product_id = $${params.length}`;
      }
      if (categoryId) {
        params.push(categoryId);
        q += ` AND ap.category_id = $${params.length}`;
      }
      if (locationId) {
        params.push(locationId);
        q += ` AND ai.location_id = $${params.length}`;
      }
      q += ` )`;
    }
    parts.push(q);
  }

  if (!parts.length) {
    return [];
  }

  let finalQuery = parts.join(" UNION ALL ");
  finalQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(Math.min(Number(limit) || 50, 200));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await db.raw(finalQuery, params);
  return result.rows;
}

module.exports = {
  findStock,
  findAll,
  changeQuantity,
  getLedger,
  findDocuments,
};