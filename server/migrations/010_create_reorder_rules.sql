CREATE TABLE reorder_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    location_id UUID,

    minimum_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,

    maximum_quantity NUMERIC(18,3),

    reorder_quantity NUMERIC(18,3) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reorder_rules_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reorder_rules_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_reorder_product_location
        UNIQUE (
            product_id,
            location_id
        ),

    CONSTRAINT chk_reorder_minimum
        CHECK (minimum_quantity >= 0),

    CONSTRAINT chk_reorder_maximum
        CHECK (
            maximum_quantity IS NULL
            OR maximum_quantity >= minimum_quantity
        ),

    CONSTRAINT chk_reorder_quantity
        CHECK (reorder_quantity > 0)
);