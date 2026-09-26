CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_number VARCHAR(50) NOT NULL UNIQUE,

    customer_id UUID,

    warehouse_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    scheduled_date DATE,

    validated_at TIMESTAMPTZ,

    created_by UUID,

    validated_by UUID,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_deliveries_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_deliveries_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_deliveries_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_deliveries_validated_by
        FOREIGN KEY (validated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_delivery_status
        CHECK (
            status IN (
                'draft',
                'waiting',
                'ready',
                'done',
                'canceled'
            )
        )
);