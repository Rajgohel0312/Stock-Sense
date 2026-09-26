const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const db = require("./database");
const { pool } = require("./config/database/connection");
const { errorHandler } = require("./middleware/errorHandler");
const passport = require("./config/google");

const { redisClient } = require("./redis/client");
const apiRoutes = require("./routes/");

const cookieParser = require("cookie-parser");

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

/*
|--------------------------------------------------------------------------
| Basic Health
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "StockSense API is running",
  });
});

/*
|--------------------------------------------------------------------------
| Infrastructure Health
|--------------------------------------------------------------------------
*/

app.get("/health/services", async (req, res) => {
  let database = "unknown";
  let redis = "unknown";

  try {
    await pool.query("SELECT 1");
    database = "connected";
  } catch (error) {
    database = "disconnected";
  }

  try {
    if (redisClient.isReady) {
      await redisClient.ping();
      redis = "connected";
    } else {
      redis = "disconnected";
    }
  } catch (error) {
    redis = "disconnected";
  }

  const healthy = database === "connected" && redis === "connected";

  res.status(healthy ? 200 : 503).json({
    success: healthy,

    services: {
      database,
      redis,
    },
  });
});

/*
|--------------------------------------------------------------------------
| Query Builder Health
|--------------------------------------------------------------------------
*/

app.get("/health/query-builder", async (req, res) => {
  try {
    const roles = await db
      .select(["id", "name", "description"])
      .from("roles")
      // .where("is_active", "=", true)
      .orderBy("name", "ASC")
      .execute();

    res.json({
      success: true,
      count: roles.rowCount,
      data: roles.rows,
    });
  } catch (error) {
    console.error("Query builder test error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/health/query-builder", async (req, res) => {
  try {
    const roles = await db
      .select(["id", "name", "description"])
      .from("roles")
      .where("is_active", "=", true)
      .orderBy("name", "ASC")
      .execute();

    res.json({
      success: true,
      count: roles.rowCount,
      data: roles.rows,
    });
  } catch (error) {
    console.error("Query builder test error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.use("/api", apiRoutes);

app.use(errorHandler);

module.exports = app;
