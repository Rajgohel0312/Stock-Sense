CREATE TABLE stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    location_id UUID NOT NULL,

    quantity_change NUMERIC(18,3) NOT NULL,

    quantity_before NUMERIC(18,3) NOT NULL,

    quantity_after NUMERIC(18,3) NOT NULL,

    movement_type VARCHAR(30) NOT NULL,

    reference_type VARCHAR(30),

    reference_id UUID,

    notes TEXT,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ledger_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ledger_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ledger_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_ledger_movement_type
        CHECK (
            movement_type IN (
                'receipt',
                'delivery',
                'transfer_in',
                'transfer_out',
                'adjustment'
            )
        ),

    CONSTRAINT chk_ledger_quantity_after
        CHECK (quantity_after >= 0)
);