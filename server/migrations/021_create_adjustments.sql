CREATE TABLE adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    adjustment_number VARCHAR(50) NOT NULL UNIQUE,

    warehouse_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    reason VARCHAR(255),

    completed_at TIMESTAMPTZ,

    created_by UUID,

    completed_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_adjustments_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_adjustments_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_adjustments_completed_by
        FOREIGN KEY (completed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_adjustment_status
        CHECK (
            status IN (
                'draft',
                'waiting',
                'done',
                'canceled'
            )
        )
);