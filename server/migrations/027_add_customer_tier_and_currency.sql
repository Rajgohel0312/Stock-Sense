/*
|--------------------------------------------------------------------------
| Customer tier and currency
|--------------------------------------------------------------------------
|
| Deliveries and future sales need to know who the customer is and in
| which currency their account is denominated.
|
*/

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS customer_tier VARCHAR(20);

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

UPDATE customers
SET customer_tier = 'standard'
WHERE customer_tier IS NULL;

UPDATE customers
SET currency = 'USD'
WHERE currency IS NULL;

ALTER TABLE customers
    ALTER COLUMN customer_tier SET DEFAULT 'standard';

ALTER TABLE customers
    ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE customers
    ALTER COLUMN customer_tier SET NOT NULL;

ALTER TABLE customers
    ALTER COLUMN currency SET NOT NULL;

ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS chk_customer_tier;

ALTER TABLE customers
    ADD CONSTRAINT chk_customer_tier
        CHECK (
            customer_tier IN (
                'standard',
                'silver',
                'gold',
                'platinum'
            )
        );

ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS chk_customer_currency;

ALTER TABLE customers
    ADD CONSTRAINT chk_customer_currency
        CHECK (currency ~ '^[A-Z]{3}$');

CREATE INDEX IF NOT EXISTS idx_customers_tier
    ON customers (customer_tier);

CREATE INDEX IF NOT EXISTS idx_customers_is_active
    ON customers (is_active);
