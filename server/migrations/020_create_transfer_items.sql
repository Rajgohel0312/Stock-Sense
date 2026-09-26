CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transfer_id UUID NOT NULL,

    product_id UUID NOT NULL,

    source_location_id UUID NOT NULL,

    destination_location_id UUID NOT NULL,

    quantity NUMERIC(18,3) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transfer_items_transfer
        FOREIGN KEY (transfer_id)
        REFERENCES transfers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_items_source
        FOREIGN KEY (source_location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_items_destination
        FOREIGN KEY (destination_location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_transfer_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_transfer_different_locations
        CHECK (
            source_location_id <> destination_location_id
        )
);