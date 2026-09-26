CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    warehouse_id UUID NOT NULL,

    parent_location_id UUID,

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL,

    location_type VARCHAR(30) NOT NULL DEFAULT 'internal',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_locations_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_locations_parent
        FOREIGN KEY (parent_location_id)
        REFERENCES locations(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_location_code_per_warehouse
        UNIQUE (
            warehouse_id,
            code
        ),

    CONSTRAINT chk_location_type
        CHECK (
            location_type IN (
                'internal',
                'receiving',
                'shipping',
                'production',
                'damaged'
            )
        )
);