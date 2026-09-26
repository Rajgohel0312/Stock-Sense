const { createClient } = require("redis");
const env = require("../config/env");

if (!env.redisUrl) {
    throw new Error("REDIS_URL is not defined");
}

const redisClient = createClient({
    url: env.redisUrl
});

redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});

redisClient.on("connect", () => {
    console.log("Redis connecting...");
});

redisClient.on("ready", () => {
    console.log("Redis ready");
});

redisClient.on("reconnecting", () => {
    console.log("Redis reconnecting...");
});

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

async function disconnectRedis() {
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
}

module.exports = {
    redisClient,
    connectRedis,
    disconnectRedis
};