CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(50) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (
    name,
    description
)
VALUES
    (
        'inventory_manager',
        'Manages inventory operations'
    ),
    (
        'warehouse_staff',
        'Performs warehouse operations'
    )
ON CONFLICT (name) DO NOTHING;