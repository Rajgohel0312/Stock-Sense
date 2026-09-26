const db = require("../../database");

async function getSummary({ warehouseId, locationId, categoryId, dateFrom, dateTo } = {}) {
  // 1. Total active products
  const productParams = [];
  let productQuery = "SELECT COUNT(*)::int AS count FROM products WHERE is_active = TRUE";
  if (categoryId) {
    productParams.push(categoryId);
    productQuery += ` AND category_id = $${productParams.length}`;
  }
  const productRes = await db.raw(productQuery, productParams);
  const totalProducts = productRes.rows[0]?.count || 0;

  // 2. Stock metrics
  const stockParams = [];
  let stockQuery = `
    SELECT
      COALESCE(SUM(s.quantity), 0)::numeric AS total_stock,
      COUNT(DISTINCT CASE
        WHEN (s.quantity - s.reserved_quantity) > 0
         AND (s.quantity - s.reserved_quantity) <= COALESCE(rr.minimum_quantity, 10)
        THEN s.product_id
      END)::int AS low_stock_count,
      COUNT(DISTINCT CASE
        WHEN (s.quantity - s.reserved_quantity) <= 0
        THEN s.product_id
      END)::int AS out_of_stock_count
    FROM inventory_stock s
    INNER JOIN products p ON p.id = s.product_id AND p.is_active = TRUE
    INNER JOIN locations l ON l.id = s.location_id
    LEFT JOIN reorder_rules rr
      ON rr.product_id = s.product_id
      AND (rr.location_id IS NULL OR rr.location_id = s.location_id)
      AND rr.is_active = TRUE
    WHERE 1 = 1
  `;

  if (warehouseId) {
    stockParams.push(warehouseId);
    stockQuery += ` AND l.warehouse_id = $${stockParams.length}`;
  }
  if (locationId) {
    stockParams.push(locationId);
    stockQuery += ` AND s.location_id = $${stockParams.length}`;
  }
  if (categoryId) {
    stockParams.push(categoryId);
    stockQuery += ` AND p.category_id = $${stockParams.length}`;
  }

  const stockRes = await db.raw(stockQuery, stockParams);
  const totalStock = Number(stockRes.rows[0]?.total_stock || 0);
  const lowStockProducts = stockRes.rows[0]?.low_stock_count || 0;
  const outOfStockProducts = stockRes.rows[0]?.out_of_stock_count || 0;

  // 3. Pending receipts
  const receiptParams = [];
  let receiptQuery = `
    SELECT COUNT(*)::int AS count
    FROM receipts r
    WHERE r.status IN ('draft', 'waiting', 'ready')
  `;
  if (warehouseId) {
    receiptParams.push(warehouseId);
    receiptQuery += ` AND r.warehouse_id = $${receiptParams.length}`;
  }
  if (dateFrom) {
    receiptParams.push(dateFrom);
    receiptQuery += ` AND r.created_at >= $${receiptParams.length}`;
  }
  if (dateTo) {
    receiptParams.push(dateTo);
    receiptQuery += ` AND r.created_at <= $${receiptParams.length}`;
  }
  const receiptRes = await db.raw(receiptQuery, receiptParams);
  const pendingReceipts = receiptRes.rows[0]?.count || 0;

  // 4. Pending deliveries
  const deliveryParams = [];
  let deliveryQuery = `
    SELECT COUNT(*)::int AS count
    FROM deliveries d
    WHERE d.status IN ('draft', 'waiting', 'ready', 'picked', 'packed')
  `;
  if (warehouseId) {
    deliveryParams.push(warehouseId);
    deliveryQuery += ` AND d.warehouse_id = $${deliveryParams.length}`;
  }
  if (locationId) {
    deliveryParams.push(locationId);
    deliveryQuery += ` AND d.location_id = $${deliveryParams.length}`;
  }
  if (dateFrom) {
    deliveryParams.push(dateFrom);
    deliveryQuery += ` AND d.created_at >= $${deliveryParams.length}`;
  }
  if (dateTo) {
    deliveryParams.push(dateTo);
    deliveryQuery += ` AND d.created_at <= $${deliveryParams.length}`;
  }
  const deliveryRes = await db.raw(deliveryQuery, deliveryParams);
  const pendingDeliveries = deliveryRes.rows[0]?.count || 0;

  // 5. Pending transfers
  const transferParams = [];
  let transferQuery = `
    SELECT COUNT(*)::int AS count
    FROM transfers t
    WHERE t.status IN ('draft', 'waiting', 'ready')
  `;
  if (warehouseId) {
    transferParams.push(warehouseId);
    transferQuery += ` AND (t.source_warehouse_id = $${transferParams.length} OR t.destination_warehouse_id = $${transferParams.length})`;
  }
  if (dateFrom) {
    transferParams.push(dateFrom);
    transferQuery += ` AND t.created_at >= $${transferParams.length}`;
  }
  if (dateTo) {
    transferParams.push(dateTo);
    transferQuery += ` AND t.created_at <= $${transferParams.length}`;
  }
  const transferRes = await db.raw(transferQuery, transferParams);
  const pendingTransfers = transferRes.rows[0]?.count || 0;

  return {
    totalProducts,
    totalStock,
    lowStockProducts,
    outOfStockProducts,
    pendingReceipts,
    pendingDeliveries,
    pendingTransfers,
  };
}

async function getLowStock({ warehouseId, locationId, categoryId, limit = 50, offset = 0 } = {}) {
  const params = [];
  let query = `
    SELECT
      s.product_id,
      p.name AS product_name,
      p.sku,
      p.category_id,
      cat.name AS category_name,
      s.location_id,
      l.name AS location_name,
      l.warehouse_id,
      w.name AS warehouse_name,
      s.quantity,
      s.reserved_quantity,
      (s.quantity - s.reserved_quantity) AS available_quantity,
      COALESCE(rr.minimum_quantity, 10) AS minimum_threshold,
      rr.reorder_quantity
    FROM inventory_stock s
    JOIN products p ON p.id = s.product_id
    LEFT JOIN categories cat ON cat.id = p.category_id
    JOIN locations l ON l.id = s.location_id
    JOIN warehouses w ON w.id = l.warehouse_id
    LEFT JOIN reorder_rules rr
      ON rr.product_id = s.product_id
      AND (rr.location_id IS NULL OR rr.location_id = s.location_id)
      AND rr.is_active = TRUE
    WHERE (s.quantity - s.reserved_quantity) <= COALESCE(rr.minimum_quantity, 10)
  `;

  if (warehouseId) {
    params.push(warehouseId);
    query += ` AND l.warehouse_id = $${params.length}`;
  }
  if (locationId) {
    params.push(locationId);
    query += ` AND s.location_id = $${params.length}`;
  }
  if (categoryId) {
    params.push(categoryId);
    query += ` AND p.category_id = $${params.length}`;
  }

  query += `
    ORDER BY (s.quantity - s.reserved_quantity) ASC, p.name ASC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  params.push(Math.min(Number(limit) || 50, 200));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await db.raw(query, params);
  return result.rows;
}

async function getRecentMovements({ warehouseId, locationId, categoryId, dateFrom, dateTo, limit = 20, offset = 0 } = {}) {
  const params = [];
  let query = `
    SELECT
      sl.id,
      sl.product_id,
      p.name AS product_name,
      p.sku,
      sl.location_id,
      l.name AS location_name,
      l.warehouse_id,
      w.name AS warehouse_name,
      sl.quantity_change,
      sl.quantity_before,
      sl.quantity_after,
      sl.movement_type,
      sl.reference_type,
      sl.reference_id,
      sl.created_by,
      u.name AS created_by_name,
      sl.created_at
    FROM stock_ledger sl
    JOIN products p ON p.id = sl.product_id
    JOIN locations l ON l.id = sl.location_id
    JOIN warehouses w ON w.id = l.warehouse_id
    LEFT JOIN users u ON u.id = sl.created_by
    WHERE 1 = 1
  `;

  if (warehouseId) {
    params.push(warehouseId);
    query += ` AND l.warehouse_id = $${params.length}`;
  }
  if (locationId) {
    params.push(locationId);
    query += ` AND sl.location_id = $${params.length}`;
  }
  if (categoryId) {
    params.push(categoryId);
    query += ` AND p.category_id = $${params.length}`;
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

  params.push(Math.min(Number(limit) || 20, 100));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await db.raw(query, params);
  return result.rows;
}

async function getPendingDocuments({ warehouseId, locationId, dateFrom, dateTo, limit = 50, offset = 0 } = {}) {
  const parts = [];
  const params = [];

  // Receipts
  let rQuery = `
    SELECT
      r.id,
      'receipt' AS document_type,
      r.receipt_number AS document_number,
      r.status,
      r.warehouse_id,
      w.name AS warehouse_name,
      NULL::UUID AS location_id,
      NULL::VARCHAR AS location_name,
      r.created_at
    FROM receipts r
    JOIN warehouses w ON w.id = r.warehouse_id
    WHERE r.status IN ('draft', 'waiting', 'ready')
  `;
  if (warehouseId) {
    params.push(warehouseId);
    rQuery += ` AND r.warehouse_id = $${params.length}`;
  }
  if (dateFrom) {
    params.push(dateFrom);
    rQuery += ` AND r.created_at >= $${params.length}`;
  }
  if (dateTo) {
    params.push(dateTo);
    rQuery += ` AND r.created_at <= $${params.length}`;
  }
  parts.push(rQuery);

  // Deliveries
  let dQuery = `
    SELECT
      d.id,
      'delivery' AS document_type,
      d.delivery_number AS document_number,
      d.status,
      d.warehouse_id,
      w.name AS warehouse_name,
      d.location_id,
      l.name AS location_name,
      d.created_at
    FROM deliveries d
    JOIN warehouses w ON w.id = d.warehouse_id
    JOIN locations l ON l.id = d.location_id
    WHERE d.status IN ('draft', 'waiting', 'ready', 'picked', 'packed')
  `;
  if (warehouseId) {
    params.push(warehouseId);
    dQuery += ` AND d.warehouse_id = $${params.length}`;
  }
  if (locationId) {
    params.push(locationId);
    dQuery += ` AND d.location_id = $${params.length}`;
  }
  if (dateFrom) {
    params.push(dateFrom);
    dQuery += ` AND d.created_at >= $${params.length}`;
  }
  if (dateTo) {
    params.push(dateTo);
    dQuery += ` AND d.created_at <= $${params.length}`;
  }
  parts.push(dQuery);

  // Transfers
  let tQuery = `
    SELECT
      t.id,
      'transfer' AS document_type,
      t.transfer_number AS document_number,
      t.status,
      t.source_warehouse_id AS warehouse_id,
      w.name AS warehouse_name,
      t.source_location_id AS location_id,
      l.name AS location_name,
      t.created_at
    FROM transfers t
    JOIN warehouses w ON w.id = t.source_warehouse_id
    LEFT JOIN locations l ON l.id = t.source_location_id
    WHERE t.status IN ('draft', 'waiting', 'ready')
  `;
  if (warehouseId) {
    params.push(warehouseId);
    tQuery += ` AND (t.source_warehouse_id = $${params.length} OR t.destination_warehouse_id = $${params.length})`;
  }
  if (dateFrom) {
    params.push(dateFrom);
    tQuery += ` AND t.created_at >= $${params.length}`;
  }
  if (dateTo) {
    params.push(dateTo);
    tQuery += ` AND t.created_at <= $${params.length}`;
  }
  parts.push(tQuery);

  let finalQuery = parts.join(" UNION ALL ");
  finalQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(Math.min(Number(limit) || 50, 200));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await db.raw(finalQuery, params);
  return result.rows;
}

module.exports = {
  getSummary,
  getLowStock,
  getRecentMovements,
  getPendingDocuments,
};
