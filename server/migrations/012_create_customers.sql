CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,

    email VARCHAR(255),

    phone VARCHAR(30),

    address TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);