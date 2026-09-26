const {
    pool
} = require("../config/database/connection");

const Database =
    require("./query/Database");


const db = new Database(pool);


module.exports = db;