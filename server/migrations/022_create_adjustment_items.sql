CREATE TABLE adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    adjustment_id UUID NOT NULL,

    product_id UUID NOT NULL,

    location_id UUID NOT NULL,

    system_quantity NUMERIC(18,3) NOT NULL,

    counted_quantity NUMERIC(18,3) NOT NULL,

    difference_quantity NUMERIC(18,3)
        GENERATED ALWAYS AS (
            counted_quantity - system_quantity
        ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_adjustment_items_adjustment
        FOREIGN KEY (adjustment_id)
        REFERENCES adjustments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_adjustment_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_adjustment_items_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_adjustment_system_quantity
        CHECK (system_quantity >= 0),

    CONSTRAINT chk_adjustment_counted_quantity
        CHECK (counted_quantity >= 0)
);