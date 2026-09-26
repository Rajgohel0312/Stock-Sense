/*
|--------------------------------------------------------------------------
| Create stock_reservations table
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    location_id UUID NOT NULL,

    quantity NUMERIC(18,3) NOT NULL,

    reference_type VARCHAR(50),

    reference_id UUID,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reservations_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reservations_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reservations_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_reservation_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_reservation_status
        CHECK (
            status IN (
                'active',
                'released',
                'consumed'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_reservations_product_loc
    ON stock_reservations (product_id, location_id);

CREATE INDEX IF NOT EXISTS idx_reservations_status
    ON stock_reservations (status);
