CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    location_id UUID NOT NULL,

    quantity NUMERIC(18,3) NOT NULL DEFAULT 0,

    reserved_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_inventory_stock_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_stock_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_inventory_product_location
        UNIQUE (
            product_id,
            location_id
        ),

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_reserved
        CHECK (
            reserved_quantity >= 0
            AND reserved_quantity <= quantity
        )
);