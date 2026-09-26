CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transfer_number VARCHAR(50) NOT NULL UNIQUE,

    source_warehouse_id UUID NOT NULL,

    destination_warehouse_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    scheduled_date DATE,

    completed_at TIMESTAMPTZ,

    created_by UUID,

    completed_by UUID,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transfers_source_warehouse
        FOREIGN KEY (source_warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfers_destination_warehouse
        FOREIGN KEY (destination_warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfers_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_transfers_completed_by
        FOREIGN KEY (completed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_transfer_status
        CHECK (
            status IN (
                'draft',
                'waiting',
                'ready',
                'done',
                'canceled'
            )
        ),

    CONSTRAINT chk_transfer_different_warehouses
        CHECK (
            source_warehouse_id <> destination_warehouse_id
        )
);