CREATE TABLE delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_id UUID NOT NULL,

    product_id UUID NOT NULL,

    location_id UUID NOT NULL,

    quantity NUMERIC(18,3) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_delivery_items_delivery
        FOREIGN KEY (delivery_id)
        REFERENCES deliveries(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_delivery_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_delivery_items_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_delivery_item_quantity
        CHECK (quantity > 0)
);