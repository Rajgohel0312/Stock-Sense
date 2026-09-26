const { pool } = require("./src/database/connection");
const { runMigrations } = require("./src/database/migrationRunner");
const { redisClient } = require("./src/redis/client");
const app = require("./src/app");
const http = require("http");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("./src/modules/auth/auth.utils");

let server;
let baseUrl;

async function request(method, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method,
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let json;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    body: json,
  };
}

async function run() {
  console.log("=== STARTING STOCK-SENSE PRD VERIFICATION ===");

  // 1. Run Migrations
  console.log("\n[1] Running migrations...");
  await runMigrations();
  console.log("Migrations applied successfully.");

  // 2. Connect Redis
  try {
    if (!redisClient.isReady) {
      await redisClient.connect();
    }
  } catch (err) {
    console.warn("Redis connect note:", err.message);
  }

  // 3. Start Test HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Server listening on ${baseUrl}`);

  // 4. Seed Essential Master Data
  console.log("\n[2] Seeding master data for testing...");
  const client = await pool.connect();
  let managerToken, staffToken;
  let testWarehouseId, testLocationAId, testLocationBId, testProductId, testCategoryId;

  try {
    // Ensure roles
    await client.query(`
      INSERT INTO roles (name, description) VALUES
        ('inventory_manager', 'Manager'),
        ('warehouse_staff', 'Staff')
      ON CONFLICT (name) DO NOTHING;
    `);

    const rolesRes = await client.query("SELECT id, name FROM roles");
    const managerRoleId = rolesRes.rows.find((r) => r.name === "inventory_manager").id;
    const staffRoleId = rolesRes.rows.find((r) => r.name === "warehouse_staff").id;

    const salt = await bcrypt.genSalt(10);
    const pwdHash = await bcrypt.hash("Password123!", salt);

    // Create or update test manager user
    let managerUser = (
      await client.query(
        "SELECT * FROM users WHERE LOWER(email) = 'mgr_test@stocksense.com'",
      )
    ).rows[0];

    if (!managerUser) {
      const ins = await client.query(
        "INSERT INTO users (role_id, name, email, password_hash, is_active, auth_token_version) VALUES ($1, 'Test Manager', 'mgr_test@stocksense.com', $2, TRUE, 1) RETURNING *",
        [managerRoleId, pwdHash],
      );
      managerUser = ins.rows[0];
    } else {
      await client.query(
        "UPDATE users SET password_hash = $1, role_id = $2, is_active = TRUE, auth_token_version = 1 WHERE id = $3",
        [pwdHash, managerRoleId, managerUser.id],
      );
      managerUser.auth_token_version = 1;
    }

    managerToken = generateAccessToken(managerUser);

    // Create or update test staff user
    let staffUser = (
      await client.query(
        "SELECT * FROM users WHERE LOWER(email) = 'staff_test@stocksense.com'",
      )
    ).rows[0];

    if (!staffUser) {
      const ins = await client.query(
        "INSERT INTO users (role_id, name, email, password_hash, is_active, auth_token_version) VALUES ($1, 'Test Staff', 'staff_test@stocksense.com', $2, TRUE, 1) RETURNING *",
        [staffRoleId, pwdHash],
      );
      staffUser = ins.rows[0];
    } else {
      await client.query(
        "UPDATE users SET password_hash = $1, role_id = $2, is_active = TRUE, auth_token_version = 1 WHERE id = $3",
        [pwdHash, staffRoleId, staffUser.id],
      );
      staffUser.auth_token_version = 1;
    }

    staffToken = generateAccessToken(staffUser);

    // Seed UOM
    let uom = (await client.query("SELECT id FROM units_of_measure LIMIT 1")).rows[0];
    const uomId = uom
      ? uom.id
      : (
          await client.query(
            "INSERT INTO units_of_measure (name, code) VALUES ('Units', 'UNT') RETURNING id",
          )
        ).rows[0].id;

    // Seed Category
    let cat = (
      await client.query("SELECT id FROM categories WHERE name = 'Electronics Test'")
    ).rows[0];
    testCategoryId = cat
      ? cat.id
      : (
          await client.query(
            "INSERT INTO categories (name, description, is_active) VALUES ('Electronics Test', 'Test Category', TRUE) RETURNING id",
          )
        ).rows[0].id;

    // Seed Warehouse
    let wh = (
      await client.query("SELECT id FROM warehouses WHERE code = 'WH-MAIN-TEST'")
    ).rows[0];
    testWarehouseId = wh
      ? wh.id
      : (
          await client.query(
            "INSERT INTO warehouses (name, code, is_active) VALUES ('Main DC Test', 'WH-MAIN-TEST', TRUE) RETURNING id",
          )
        ).rows[0].id;

    // Seed Locations
    let locA = (
      await client.query(
        "SELECT id FROM locations WHERE warehouse_id = $1 AND code = 'LOC-STRG-1'",
        [testWarehouseId],
      )
    ).rows[0];
    testLocationAId = locA
      ? locA.id
      : (
          await client.query(
            "INSERT INTO locations (warehouse_id, name, code, location_type, is_active) VALUES ($1, 'Storage Bay 1', 'LOC-STRG-1', 'internal', TRUE) RETURNING id",
            [testWarehouseId],
          )
        ).rows[0].id;

    let locB = (
      await client.query(
        "SELECT id FROM locations WHERE warehouse_id = $1 AND code = 'LOC-RACK-A'",
        [testWarehouseId],
      )
    ).rows[0];
    testLocationBId = locB
      ? locB.id
      : (
          await client.query(
            "INSERT INTO locations (warehouse_id, name, code, location_type, is_active) VALUES ($1, 'Rack Bay A', 'LOC-RACK-A', 'internal', TRUE) RETURNING id",
            [testWarehouseId],
          )
        ).rows[0].id;

    // Seed Product
    let prod = (
      await client.query("SELECT id FROM products WHERE sku = 'SKU-LAPTOP-TEST-001'")
    ).rows[0];
    testProductId = prod
      ? prod.id
      : (
          await client.query(
            "INSERT INTO products (category_id, uom_id, name, sku, is_active) VALUES ($1, $2, 'Pro Laptop Test', 'SKU-LAPTOP-TEST-001', TRUE) RETURNING id",
            [testCategoryId, uomId],
          )
        ).rows[0].id;

    // Seed Supplier
    let sup = (
      await client.query("SELECT id FROM suppliers WHERE name = 'Global Tech Supplies'")
    ).rows[0];
    testSupplierId = sup
      ? sup.id
      : (
          await client.query(
            "INSERT INTO suppliers (name, email, phone, is_active) VALUES ('Global Tech Supplies', 'supply@tech.com', '+1234567890', TRUE) RETURNING id",
          )
        ).rows[0].id;

    // Clean existing stock for test product
    await client.query(
      "DELETE FROM stock_reservations WHERE product_id = $1",
      [testProductId],
    );
    await client.query(
      "DELETE FROM stock_ledger WHERE product_id = $1",
      [testProductId],
    );
    await client.query(
      "DELETE FROM inventory_stock WHERE product_id = $1",
      [testProductId],
    );

    console.log("Master data successfully seeded.");
  } finally {
    client.release();
  }

  const mgrHeaders = { Authorization: `Bearer ${managerToken}` };
  const staffHeaders = { Authorization: `Bearer ${staffToken}` };

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  ✓ ${message}`);
  }

  // ==========================================
  // MODULE 1: RECEIPTS
  // ==========================================
  console.log("\n--- Testing Module 1: Receipts ---");

  // Create receipt
  const createRecRes = await request("POST", "/api/receipts", {
    headers: mgrHeaders,
    body: {
      supplierId: testSupplierId,
      warehouseId: testWarehouseId,
      notes: "Initial receipt from supplier",
    },
  });
  assert(createRecRes.status === 201, "Receipt created with 201");
  const receiptId = createRecRes.body.data.id;
  assert(createRecRes.body.data.status === "draft", "Receipt initial status is draft");

  // Add item
  const addItemRes = await request("POST", `/api/receipts/${receiptId}/items`, {
    headers: mgrHeaders,
    body: {
      productId: testProductId,
      locationId: testLocationAId,
      quantity: 100,
    },
  });
  assert(addItemRes.status === 201, "Item added to receipt with quantity 100");

  // Validate receipt
  const valRecRes = await request("POST", `/api/receipts/${receiptId}/validate`, {
    headers: mgrHeaders,
  });
  assert(valRecRes.status === 200, "Receipt validated successfully");
  assert(valRecRes.body.data.status === "done", "Receipt marked as done");

  // Double validation check (idempotency)
  const doubleValRes = await request("POST", `/api/receipts/${receiptId}/validate`, {
    headers: mgrHeaders,
  });
  assert(doubleValRes.status === 409, "Double validation rejected with 409 Conflict");

  // Verify stock increased to 100
  const stockCheck1 = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockCheck1.body.data.quantity) === 100, "Stock increased to 100");

  // Test receipt cancellation on draft
  const draftRec = await request("POST", "/api/receipts", {
    headers: mgrHeaders,
    body: { supplierId: testSupplierId, warehouseId: testWarehouseId },
  });
  const cancelDraftRes = await request(
    "POST",
    `/api/receipts/${draftRec.body.data.id}/cancel`,
    { headers: mgrHeaders },
  );
  assert(cancelDraftRes.status === 200, "Draft receipt canceled successfully");

  // Cannot cancel completed receipt
  const cancelDoneRes = await request("POST", `/api/receipts/${receiptId}/cancel`, {
    headers: mgrHeaders,
  });
  assert(cancelDoneRes.status === 409, "Cannot cancel done receipt (409 Conflict)");

  // ==========================================
  // MODULE 2: CUSTOMERS
  // ==========================================
  console.log("\n--- Testing Module 2: Customers ---");

  // Create customer
  const createCustRes = await request("POST", "/api/customers", {
    headers: mgrHeaders,
    body: {
      name: "Acme Enterprises",
      email: "billing@acme.com",
      phone: "+1987654321",
      address: "100 Innovation Way",
      customer_tier: "gold",
      currency: "USD",
    },
  });
  assert(createCustRes.status === 201, "Customer created with 201");
  const customerId = createCustRes.body.data.id;
  assert(createCustRes.body.data.customer_tier === "gold", "Customer tier is gold");
  assert(createCustRes.body.data.currency === "USD", "Currency is USD");

  // List with filters
  const listCustRes = await request(
    "GET",
    "/api/customers?tier=gold&active=true&search=Acme",
    { headers: mgrHeaders },
  );
  assert(listCustRes.status === 200, "Customers filtered list returns 200");
  assert(listCustRes.body.data.length >= 1, "Customer found matching filters");

  // Staff can read
  const staffReadCust = await request("GET", `/api/customers/${customerId}`, {
    headers: staffHeaders,
  });
  assert(staffReadCust.status === 200, "Warehouse staff can read customer");

  // Staff cannot create customer
  const staffCreateCust = await request("POST", "/api/customers", {
    headers: staffHeaders,
    body: { name: "Should Fail" },
  });
  assert(staffCreateCust.status === 403, "Staff cannot create customer (403 Forbidden)");

  // Update customer
  const updateCustRes = await request("PATCH", `/api/customers/${customerId}`, {
    headers: mgrHeaders,
    body: { customer_tier: "platinum" },
  });
  assert(updateCustRes.body.data.customer_tier === "platinum", "Customer tier updated to platinum");

  // ==========================================
  // MODULE 3: DELIVERIES
  // ==========================================
  console.log("\n--- Testing Module 3: Deliveries ---");

  // Create delivery
  const createDelRes = await request("POST", "/api/deliveries", {
    headers: mgrHeaders,
    body: {
      customerId,
      warehouseId: testWarehouseId,
      locationId: testLocationAId,
      notes: "First test delivery",
    },
  });
  assert(createDelRes.status === 201, "Delivery created with 201");
  const deliveryId = createDelRes.body.data.id;

  // Add item: 20 units
  const addDelItemRes = await request("POST", `/api/deliveries/${deliveryId}/items`, {
    headers: mgrHeaders,
    body: {
      productId: testProductId,
      quantity: 20,
    },
  });
  assert(addDelItemRes.status === 201, "Added 20 units to delivery");

  // Workflow steps: DRAFT -> READY -> PICKED -> PACKED
  const readyRes = await request("POST", `/api/deliveries/${deliveryId}/ready`, {
    headers: mgrHeaders,
  });
  assert(readyRes.status === 200 && readyRes.body.data.status === "ready", "Delivery ready");

  const pickRes = await request("POST", `/api/deliveries/${deliveryId}/pick`, {
    headers: staffHeaders,
  });
  assert(pickRes.status === 200 && pickRes.body.data.status === "picked", "Delivery picked by staff");

  const packRes = await request("POST", `/api/deliveries/${deliveryId}/pack`, {
    headers: staffHeaders,
  });
  assert(packRes.status === 200 && packRes.body.data.status === "packed", "Delivery packed by staff");

  // Stock must NOT have decreased yet
  const stockPreDel = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockPreDel.body.data.quantity) === 100, "Stock is still 100 during packed stage");

  // Validate delivery
  const valDelRes = await request("POST", `/api/deliveries/${deliveryId}/validate`, {
    headers: mgrHeaders,
  });
  assert(valDelRes.status === 200, "Delivery validated successfully");
  assert(valDelRes.body.data.status === "done", "Delivery status is done");

  // Stock decreased: 100 - 20 = 80
  const stockPostDel = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockPostDel.body.data.quantity) === 80, "Stock decreased to 80 (100 - 20)");

  // Deactivate customer and verify cannot create delivery
  await request("DELETE", `/api/customers/${customerId}`, { headers: mgrHeaders });
  const delInactiveCust = await request("POST", "/api/deliveries", {
    headers: mgrHeaders,
    body: {
      customerId,
      warehouseId: testWarehouseId,
      locationId: testLocationAId,
    },
  });
  assert(delInactiveCust.status === 400, "Cannot create delivery for inactive customer (400)");

  // Re-activate customer
  await request("PATCH", `/api/customers/${customerId}`, {
    headers: mgrHeaders,
    body: { is_active: true },
  });

  // ==========================================
  // MODULE 4: INTERNAL TRANSFERS
  // ==========================================
  console.log("\n--- Testing Module 4: Internal Transfers ---");

  // Create transfer: testLocationA (Storage Bay 1) -> testLocationB (Rack Bay A)
  const createTrfRes = await request("POST", "/api/transfers", {
    headers: mgrHeaders,
    body: {
      sourceWarehouseId: testWarehouseId,
      destinationWarehouseId: testWarehouseId,
      sourceLocationId: testLocationAId,
      destinationLocationId: testLocationBId,
      notes: "Move 30 units from Storage to Rack A",
    },
  });
  assert(createTrfRes.status === 201, "Transfer created with 201");
  const transferId = createTrfRes.body.data.id;

  // Add item: 30 units
  const addTrfItemRes = await request("POST", `/api/transfers/${transferId}/items`, {
    headers: mgrHeaders,
    body: {
      productId: testProductId,
      quantity: 30,
    },
  });
  assert(addTrfItemRes.status === 201, "Item added to transfer");

  // DRAFT -> READY
  const trfReadyRes = await request("POST", `/api/transfers/${transferId}/ready`, {
    headers: mgrHeaders,
  });
  assert(trfReadyRes.status === 200 && trfReadyRes.body.data.status === "ready", "Transfer ready");

  // Validate transfer
  const valTrfRes = await request("POST", `/api/transfers/${transferId}/validate`, {
    headers: mgrHeaders,
  });
  assert(valTrfRes.status === 200, "Transfer validated successfully");
  assert(valTrfRes.body.data.status === "done", "Transfer marked as done");

  // Verify stock: Location A was 80 -> now 50. Location B was 0 -> now 30.
  const stockA = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockA.body.data.quantity) === 50, "Source stock decreased to 50");

  const stockB = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationBId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockB.body.data.quantity) === 30, "Destination stock increased to 30");

  // ==========================================
  // MODULE 5: STOCK ADJUSTMENTS
  // ==========================================
  console.log("\n--- Testing Module 5: Stock Adjustments ---");

  // Current stock at Location A is 50. Physical count is 45 (difference: -5)
  const createAdjRes = await request("POST", "/api/adjustments", {
    headers: mgrHeaders,
    body: {
      warehouseId: testWarehouseId,
      reason: "Cycle count discrepancy",
    },
  });
  assert(createAdjRes.status === 201, "Adjustment created with 201");
  const adjustmentId = createAdjRes.body.data.id;

  const addAdjItemRes = await request("POST", `/api/adjustments/${adjustmentId}/items`, {
    headers: mgrHeaders,
    body: {
      productId: testProductId,
      locationId: testLocationAId,
      countedQuantity: 45,
    },
  });
  assert(addAdjItemRes.status === 201, "Adjustment item added with counted quantity 45");

  // Validate adjustment
  const valAdjRes = await request("POST", `/api/adjustments/${adjustmentId}/validate`, {
    headers: mgrHeaders,
  });
  assert(valAdjRes.status === 200, "Adjustment validated successfully");
  assert(valAdjRes.body.data.status === "done", "Adjustment marked as done");

  // Check stock updated to 45
  const stockAdjPost = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockAdjPost.body.data.quantity) === 45, "Stock correctly updated to counted 45");

  // ==========================================
  // MODULE 6: STOCK RESERVATIONS
  // ==========================================
  console.log("\n--- Testing Module 6: Stock Reservations ---");

  // Stock at Location A: 45, reserved: 0, available: 45
  const createResRes = await request("POST", "/api/inventory/reservations", {
    headers: mgrHeaders,
    body: {
      productId: testProductId,
      locationId: testLocationAId,
      quantity: 15,
      referenceType: "sales_order",
    },
  });
  assert(createResRes.status === 201, "Reservation created for 15 units");
  const resId = createResRes.body.data.id;

  // Check stock reserved quantity
  const stockResCheck = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockResCheck.body.data.reserved_quantity) === 15, "Reserved quantity is 15");
  assert(Number(stockResCheck.body.data.available_quantity) === 30, "Available quantity is 30 (45 - 15)");

  // Try to reserve more than available (available is 30, try 50)
  const overRes = await request("POST", "/api/inventory/reservations", {
    headers: mgrHeaders,
    body: {
      productId: testProductId,
      locationId: testLocationAId,
      quantity: 50,
    },
  });
  assert(overRes.status === 409, "Over-reservation prevented with 409 Conflict");

  // Release reservation
  const releaseRes = await request(
    "POST",
    `/api/inventory/reservations/${resId}/release`,
    { headers: mgrHeaders },
  );
  assert(releaseRes.status === 200, "Reservation released successfully");

  const stockAfterRel = await request(
    "GET",
    `/api/inventory/stock/${testProductId}/${testLocationAId}`,
    { headers: mgrHeaders },
  );
  assert(Number(stockAfterRel.body.data.reserved_quantity) === 0, "Reserved quantity back to 0");
  assert(Number(stockAfterRel.body.data.available_quantity) === 45, "Available quantity restored to 45");

  // ==========================================
  // MODULE 7: DASHBOARD API
  // ==========================================
  console.log("\n--- Testing Module 7: Dashboard API ---");

  const summaryRes = await request("GET", "/api/dashboard/summary", {
    headers: mgrHeaders,
  });
  assert(summaryRes.status === 200, "Dashboard summary returns 200");
  const summary = summaryRes.body.data;
  assert(typeof summary.totalProducts === "number", "totalProducts is a number");
  assert(typeof summary.totalStock === "number", "totalStock is a number");
  assert(typeof summary.lowStockProducts === "number", "lowStockProducts is a number");
  assert(typeof summary.outOfStockProducts === "number", "outOfStockProducts is a number");
  assert(typeof summary.pendingReceipts === "number", "pendingReceipts is a number");
  assert(typeof summary.pendingDeliveries === "number", "pendingDeliveries is a number");
  assert(typeof summary.pendingTransfers === "number", "pendingTransfers is a number");

  const lowStockRes = await request("GET", "/api/dashboard/low-stock", {
    headers: mgrHeaders,
  });
  assert(lowStockRes.status === 200, "Dashboard low-stock returns 200");

  const recentMovRes = await request("GET", "/api/dashboard/recent-movements", {
    headers: mgrHeaders,
  });
  assert(recentMovRes.status === 200, "Dashboard recent-movements returns 200");
  assert(recentMovRes.body.data.length > 0, "Recent movements recorded in ledger");

  const pendingDocsRes = await request("GET", "/api/dashboard/pending-documents", {
    headers: mgrHeaders,
  });
  assert(pendingDocsRes.status === 200, "Dashboard pending-documents returns 200");

  // ==========================================
  // MODULE 8: SMART INVENTORY FILTERS & DOCUMENTS
  // ==========================================
  console.log("\n--- Testing Module 8: Smart Inventory Filters ---");

  const filterStockRes = await request(
    "GET",
    `/api/inventory/stock?warehouseId=${testWarehouseId}&search=Laptop`,
    { headers: mgrHeaders },
  );
  assert(filterStockRes.status === 200, "Filtered stock returns 200");
  assert(filterStockRes.body.data.length >= 1, "Found matching product in stock query");

  const docFilterRes = await request(
    "GET",
    `/api/inventory/documents?warehouseId=${testWarehouseId}`,
    { headers: mgrHeaders },
  );
  assert(docFilterRes.status === 200, "Unified document filter returns 200");
  assert(docFilterRes.body.data.length >= 3, "Unified documents found receipts/deliveries/transfers");

  // ==========================================
  // MODULE 9: ALERTS
  // ==========================================
  console.log("\n--- Testing Module 9: Alerts ---");

  const alertsRes = await request("GET", "/api/alerts", {
    headers: mgrHeaders,
  });
  assert(alertsRes.status === 200, "Alerts list returns 200");

  if (alertsRes.body.data.length > 0) {
    const alertId = alertsRes.body.data[0].id;
    const markReadRes = await request("PATCH", `/api/alerts/${alertId}/read`, {
      headers: mgrHeaders,
      body: { isRead: true },
    });
    assert(markReadRes.status === 200, "Alert marked as read");
  }

  // ==========================================
  // MODULE 10: AUDIT / STOCK LEDGER
  // ==========================================
  console.log("\n--- Testing Module 10: Audit / Stock Ledger ---");

  const ledgerRes = await request(
    "GET",
    `/api/inventory/stock-ledger?productId=${testProductId}&movementType=delivery`,
    { headers: mgrHeaders },
  );
  assert(ledgerRes.status === 200, "Ledger query with filters returns 200");
  assert(ledgerRes.body.data.length >= 1, "Found delivery ledger records");
  assert(Number(ledgerRes.body.data[0].quantity_change) === -20, "Quantity change is -20");

  // Verify ledger is immutable (no PUT/PATCH/DELETE)
  const delLedgerRes = await request("DELETE", `/api/inventory/stock-ledger/${ledgerRes.body.data[0].id}`, {
    headers: mgrHeaders,
  });
  assert(delLedgerRes.status === 404, "Ledger records cannot be deleted (404/immutable)");

  // ==========================================
  // MODULE 11: PROFILE / ACCOUNT
  // ==========================================
  console.log("\n--- Testing Module 11: Profile / Account ---");

  const profileRes = await request("GET", "/api/profile", {
    headers: mgrHeaders,
  });
  assert(profileRes.status === 200, "Get profile returns 200");
  assert(profileRes.body.data.email === "mgr_test@stocksense.com", "Email matches current user");

  const updateProfRes = await request("PATCH", "/api/profile", {
    headers: mgrHeaders,
    body: { name: "Updated Manager Name" },
  });
  assert(updateProfRes.status === 200 && updateProfRes.body.data.name === "Updated Manager Name", "Profile name updated");

  const changePwdRes = await request("POST", "/api/profile/change-password", {
    headers: mgrHeaders,
    body: {
      currentPassword: "Password123!",
      newPassword: "NewSecurePassword456!",
    },
  });
  assert(changePwdRes.status === 200, "Password changed successfully");

  // Logout all sessions (increments auth_token_version)
  const logoutAllRes = await request("POST", "/api/profile/logout-all", {
    headers: mgrHeaders,
  });
  assert(logoutAllRes.status === 200, "Logout all sessions returns 200");

  // Old token should now be rejected because tokenVersion is outdated
  const rejectedReq = await request("GET", "/api/profile", {
    headers: mgrHeaders,
  });
  assert(rejectedReq.status === 401, "Old token rejected with 401 after logout-all");

  console.log("\n=======================================================");
  console.log("🎉 ALL PRD BACKEND MODULES VERIFIED & WORKING PERFECTLY!");
  console.log("=======================================================\n");

  server.close();
  await pool.end();
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  if (server) server.close();
  pool.end();
  if (redisClient && redisClient.isOpen) redisClient.disconnect();
  process.exit(1);
});
