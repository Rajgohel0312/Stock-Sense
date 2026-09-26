const SelectQuery = require("./SelectQuery");
const InsertQuery = require("./InsertQuery");
const UpdateQuery = require("./UpdateQuery");
const DeleteQuery = require("./DeleteQuery");

class Database {
  constructor(executor) {
    this.executor = executor;
  }

  select(columns = ["*"]) {
    return new SelectQuery(this.executor, columns);
  }

  insert(table) {
    return new InsertQuery(this.executor, table);
  }

  update(table) {
    return new UpdateQuery(this.executor, table);
  }

  delete(table) {
    return new DeleteQuery(this.executor, table);
  }

  async raw(text, values = []) {
    return this.executor.query(text, values);
  }

  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const transaction = {
        query: (text, params) => client.query(text, params),
      };

      const result = await callback(transaction);

      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Database;
