/*
|--------------------------------------------------------------------------
| Align deliveries with the delivery specification
|--------------------------------------------------------------------------
|
| The delivery module is written against a header that carries the
| shipping location and an optional customer reference number, and it
| moves through draft -> ready -> picked -> packed -> done.
|
| The original table only knew draft/waiting/ready/done/canceled and
| carried no location, so the module could not run.
|
*/

ALTER TABLE deliveries
    ADD COLUMN IF NOT EXISTS location_id UUID;

ALTER TABLE deliveries
    ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

/*
| Backfill the header location from the existing items so that the
| NOT NULL constraint can be applied without losing data.
*/

UPDATE deliveries d
SET location_id = sub.location_id
FROM (
    SELECT delivery_id, MIN(location_id::text)::uuid AS location_id
    FROM delivery_items
    GROUP BY delivery_id
) sub
WHERE sub.delivery_id = d.id
  AND d.location_id IS NULL;

DELETE FROM deliveries
WHERE location_id IS NULL;

ALTER TABLE deliveries
    ALTER COLUMN location_id SET NOT NULL;

ALTER TABLE deliveries
    ADD CONSTRAINT fk_deliveries_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT;

ALTER TABLE deliveries
    DROP CONSTRAINT IF EXISTS chk_delivery_status;

ALTER TABLE deliveries
    ADD CONSTRAINT chk_delivery_status
        CHECK (
            status IN (
                'draft',
                'waiting',
                'ready',
                'picked',
                'packed',
                'done',
                'canceled'
            )
        );

CREATE INDEX IF NOT EXISTS idx_deliveries_location
    ON deliveries (location_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_status
    ON deliveries (status);
