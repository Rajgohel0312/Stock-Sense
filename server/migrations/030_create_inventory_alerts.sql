/*
|--------------------------------------------------------------------------
| Create inventory_alerts table
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID,

    warehouse_id UUID,

    location_id UUID,

    alert_type VARCHAR(50) NOT NULL,

    severity VARCHAR(20) NOT NULL DEFAULT 'warning',

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alerts_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_alerts_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_alerts_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_alert_type
        CHECK (
            alert_type IN (
                'LOW_STOCK',
                'OUT_OF_STOCK',
                'PENDING_RECEIPT',
                'PENDING_DELIVERY',
                'TRANSFER_PENDING'
            )
        ),

    CONSTRAINT chk_alert_severity
        CHECK (
            severity IN (
                'info',
                'warning',
                'critical'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_alerts_is_read
    ON inventory_alerts (is_read);

CREATE INDEX IF NOT EXISTS idx_alerts_product
    ON inventory_alerts (product_id);
