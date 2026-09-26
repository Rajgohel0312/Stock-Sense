/*
|--------------------------------------------------------------------------
| Align transfers and adjustments schema
|--------------------------------------------------------------------------
|
| Allow intra-warehouse transfers and add optional reference/location fields.
| Update adjustment status constraints to support count workflow.
|
*/

-- Allow transfers within the same warehouse (location to location)
ALTER TABLE transfers
    DROP CONSTRAINT IF EXISTS chk_transfer_different_warehouses;

ALTER TABLE transfers
    ADD COLUMN IF NOT EXISTS source_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT;

ALTER TABLE transfers
    ADD COLUMN IF NOT EXISTS destination_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT;

ALTER TABLE transfers
    ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Adjustments status update
ALTER TABLE adjustments
    DROP CONSTRAINT IF EXISTS chk_adjustment_status;

ALTER TABLE adjustments
    ADD CONSTRAINT chk_adjustment_status
        CHECK (
            status IN (
                'draft',
                'count',
                'waiting',
                'done',
                'canceled'
            )
        );

ALTER TABLE adjustments
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT;
