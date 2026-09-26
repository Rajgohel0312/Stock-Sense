CREATE INDEX idx_users_role_id
    ON users(role_id);

CREATE UNIQUE INDEX idx_users_email_lower
    ON users(LOWER(email));


CREATE INDEX idx_products_category_id
    ON products(category_id);

CREATE INDEX idx_products_name
    ON products(name);

CREATE INDEX idx_products_sku
    ON products(sku);


CREATE INDEX idx_locations_warehouse_id
    ON locations(warehouse_id);

CREATE INDEX idx_locations_parent_id
    ON locations(parent_location_id);


CREATE INDEX idx_inventory_product_id
    ON inventory_stock(product_id);

CREATE INDEX idx_inventory_location_id
    ON inventory_stock(location_id);


CREATE INDEX idx_ledger_product_id
    ON stock_ledger(product_id);

CREATE INDEX idx_ledger_location_id
    ON stock_ledger(location_id);

CREATE INDEX idx_ledger_created_at
    ON stock_ledger(created_at);

CREATE INDEX idx_ledger_reference
    ON stock_ledger(reference_type, reference_id);


CREATE INDEX idx_receipts_status
    ON receipts(status);

CREATE INDEX idx_receipts_warehouse_id
    ON receipts(warehouse_id);

CREATE INDEX idx_receipts_scheduled_date
    ON receipts(scheduled_date);


CREATE INDEX idx_deliveries_status
    ON deliveries(status);

CREATE INDEX idx_deliveries_warehouse_id
    ON deliveries(warehouse_id);

CREATE INDEX idx_deliveries_scheduled_date
    ON deliveries(scheduled_date);


CREATE INDEX idx_transfers_status
    ON transfers(status);

CREATE INDEX idx_transfers_source_warehouse
    ON transfers(source_warehouse_id);

CREATE INDEX idx_transfers_destination_warehouse
    ON transfers(destination_warehouse_id);


CREATE INDEX idx_adjustments_status
    ON adjustments(status);

CREATE INDEX idx_adjustments_warehouse_id
    ON adjustments(warehouse_id);


CREATE INDEX idx_reorder_rules_product_id
    ON reorder_rules(product_id);

CREATE INDEX idx_reorder_rules_location_id
    ON reorder_rules(location_id);