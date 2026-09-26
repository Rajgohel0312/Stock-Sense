CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID NOT NULL,

    uom_id UUID NOT NULL,

    name VARCHAR(200) NOT NULL,

    sku VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_products_uom
        FOREIGN KEY (uom_id)
        REFERENCES units_of_measure(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_products_sku
        UNIQUE (sku)
);