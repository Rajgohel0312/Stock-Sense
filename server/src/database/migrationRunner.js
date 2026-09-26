const fs = require("fs");
const path = require("path");

const {
    pool
} = require("./connection");


const MIGRATIONS_DIR = path.join(
    __dirname,
    "../../migrations"
);


/*
|--------------------------------------------------------------------------
| Get migration files
|--------------------------------------------------------------------------
*/

function getMigrationFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        throw new Error(
            `Migration directory not found: ${MIGRATIONS_DIR}`
        );
    }

    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));
}


/*
|--------------------------------------------------------------------------
| Validate migration filename
|--------------------------------------------------------------------------
*/

function validateMigrationFilename(filename) {
    return /^\d+_[a-zA-Z0-9_-]+\.sql$/.test(filename);
}


/*
|--------------------------------------------------------------------------
| Run migrations
|--------------------------------------------------------------------------
*/

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log("Running database migrations...");

        /*
        |--------------------------------------------------------------------------
        | Migration lock
        |--------------------------------------------------------------------------
        |
        | PostgreSQL advisory locks prevent two application instances
        | from running migrations at the same time.
        |
        */

        await client.query(
            "SELECT pg_advisory_lock($1)",
            [987654321]
        );

        console.log("Migration lock acquired.");

        /*
        |--------------------------------------------------------------------------
        | Ensure migration table exists
        |--------------------------------------------------------------------------
        */

        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id BIGSERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        /*
        |--------------------------------------------------------------------------
        | Get executed migrations
        |--------------------------------------------------------------------------
        */

        const executedResult = await client.query(`
            SELECT filename
            FROM schema_migrations
            ORDER BY id ASC;
        `);

        const executedMigrations = new Set(
            executedResult.rows.map(
                (row) => row.filename
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Get migration files
        |--------------------------------------------------------------------------
        */

        const migrationFiles = getMigrationFiles();

        /*
        |--------------------------------------------------------------------------
        | Validate filenames
        |--------------------------------------------------------------------------
        */

        for (const file of migrationFiles) {
            if (!validateMigrationFilename(file)) {
                throw new Error(
                    `Invalid migration filename: ${file}`
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Run pending migrations
        |--------------------------------------------------------------------------
        */

        const pendingMigrations =
            migrationFiles.filter(
                (file) => !executedMigrations.has(file)
            );

        if (pendingMigrations.length === 0) {
            console.log("No pending migrations.");
            return;
        }

        console.log(
            `Found ${pendingMigrations.length} pending migration(s).`
        );

        for (const filename of pendingMigrations) {
            console.log(`Running migration: ${filename}`);

            const filePath = path.join(
                MIGRATIONS_DIR,
                filename
            );

            const sql = fs.readFileSync(
                filePath,
                "utf8"
            );

            if (!sql.trim()) {
                throw new Error(
                    `Migration file is empty: ${filename}`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Each migration is atomic
            |--------------------------------------------------------------------------
            */

            await client.query("BEGIN");

            try {
                await client.query(sql);

                await client.query(
                    `
                    INSERT INTO schema_migrations (
                        filename
                    )
                    VALUES ($1)
                    `,
                    [filename]
                );

                await client.query("COMMIT");

                console.log(
                    `Migration completed: ${filename}`
                );

            } catch (error) {
                await client.query("ROLLBACK");

                throw new Error(
                    `Migration failed: ${filename}\n${error.message}`
                );
            }
        }

        console.log("All migrations completed.");

    } finally {

        /*
        |--------------------------------------------------------------------------
        | Release advisory lock
        |--------------------------------------------------------------------------
        */

        try {
            await client.query(
                "SELECT pg_advisory_unlock($1)",
                [987654321]
            );

            console.log("Migration lock released.");

        } finally {
            client.release();
        }
    }
}


module.exports = {
    runMigrations
};