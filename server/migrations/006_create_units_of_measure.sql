CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    code VARCHAR(20) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_uom_name
        UNIQUE (name),

    CONSTRAINT uq_uom_code
        UNIQUE (code)
);

INSERT INTO units_of_measure (
    name,
    code
)
VALUES
    ('Piece', 'PCS'),
    ('Kilogram', 'KG'),
    ('Gram', 'G'),
    ('Liter', 'L'),
    ('Meter', 'M'),
    ('Box', 'BOX')
ON CONFLICT (code) DO NOTHING;