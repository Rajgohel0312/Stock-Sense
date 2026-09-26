CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL,

    address TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_warehouses_name
        UNIQUE (name),

    CONSTRAINT uq_warehouses_code
        UNIQUE (code)
);