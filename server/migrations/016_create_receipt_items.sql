CREATE TABLE receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    receipt_id UUID NOT NULL,

    product_id UUID NOT NULL,

    location_id UUID NOT NULL,

    quantity NUMERIC(18,3) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_receipt_items_receipt
        FOREIGN KEY (receipt_id)
        REFERENCES receipts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_receipt_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_items_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_receipt_item_quantity
        CHECK (quantity > 0)
);  