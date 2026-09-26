const { Pool } = require("pg");
const env = require("../config/env");

if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
    connectionString: env.databaseUrl,

    max: 20,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error);
});

async function testDatabaseConnection() {
    const client = await pool.connect();

    try {
        const result = await client.query("SELECT NOW() AS current_time");

        console.log(
            "PostgreSQL connected:",
            result.rows[0].current_time
        );
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    testDatabaseConnection
};