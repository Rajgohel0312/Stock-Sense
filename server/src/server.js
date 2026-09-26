const app = require("./app");
const env = require("./config/env");

const {
    testDatabaseConnection
} = require("./config/database/connection");

const {
     runMigrations
} = require('./database/migrationRunner');

const {
    connectRedis,
    disconnectRedis
} = require("./redis/client");

async function startServer() {
    try {
        console.log("Starting StockSense...");

        // PostgreSQL
        await testDatabaseConnection();

        // Database Migrations
        await runMigrations();

        // Redis
        await connectRedis();

        const server = app.listen(env.port, () => {
            console.log(
                `StockSense API running on port ${env.port}`
            );
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down...`);

            server.close(async () => {
                try {
                    await disconnectRedis();

                    console.log("StockSense stopped cleanly.");

                    process.exit(0);
                } catch (error) {
                    console.error(
                        "Shutdown error:",
                        error
                    );

                    process.exit(1);
                }
            });
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        console.error(
            "Failed to start StockSense:",
            error
        );

        process.exit(1);
    }
}

startServer();