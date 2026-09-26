const QueryBuilder = require("./QueryBuilder");

const { quoteIdentifier, quoteTable, validateOperator } = require("./sql");

class SelectQuery extends QueryBuilder {
  constructor(executor, columns = ["*"]) {
    super(executor);

    this.columns = columns;

    this.table = null;

    this.joins = [];

    this.conditions = [];

    this.groupColumns = [];

    this.havingConditions = [];

    this.orderColumns = [];

    this.limitValue = null;

    this.offsetValue = null;

    this.distinctValue = false;
  }

  distinct() {
    this.distinctValue = true;

    return this;
  }

  from(table, alias = null) {
    this.table = quoteTable(table, alias);

    return this;
  }

  join(table, leftColumn, operator, rightColumn, type = "INNER", alias = null) {
    const allowedTypes = ["INNER", "LEFT", "RIGHT", "FULL"];

    const normalizedType = String(type).toUpperCase();

    if (!allowedTypes.includes(normalizedType)) {
      throw new Error(`Invalid join type: ${type}`);
    }

    this.joins.push(
      `${normalizedType} JOIN ` +
        `${quoteTable(table, alias)} ON ` +
        `${quoteIdentifier(leftColumn)} ` +
        `${validateOperator(operator)} ` +
        `${quoteIdentifier(rightColumn)}`,
    );

    return this;
  }

  where(column, operator, value) {
    const sqlOperator = validateOperator(operator);

    const placeholder = this.addParameter(value);

    this.conditions.push(
      `${quoteIdentifier(column)} ` + `${sqlOperator} ${placeholder}`,
    );

    return this;
  }
  whereFunction(functionName, column, operator, value) {
    const allowedFunctions = ["LOWER", "UPPER"];

    const normalizedFunction = String(functionName).toUpperCase();

    if (!allowedFunctions.includes(normalizedFunction)) {
      throw new Error(`Unsupported SQL function: ${functionName}`);
    }

    const placeholder = this.addParameter(value);

    this.conditions.push(
      `${normalizedFunction}(` +
        `${quoteIdentifier(column)}` +
        `) ` +
        `${validateOperator(operator)} ` +
        `${placeholder}`,
    );

    return this;
  }

  whereIn(column, values) {
    if (!Array.isArray(values)) {
      throw new TypeError("whereIn values must be an array");
    }

    if (values.length === 0) {
      this.conditions.push("FALSE");

      return this;
    }

    const placeholders = values.map((value) => this.addParameter(value));

    this.conditions.push(
      `${quoteIdentifier(column)} IN ` + `(${placeholders.join(", ")})`,
    );

    return this;
  }

  whereNull(column) {
    this.conditions.push(`${quoteIdentifier(column)} IS NULL`);

    return this;
  }

  whereNotNull(column) {
    this.conditions.push(`${quoteIdentifier(column)} IS NOT NULL`);

    return this;
  }

  whereColumn(leftColumn, operator, rightColumn) {
    this.conditions.push(
      `${quoteIdentifier(leftColumn)} ` +
        `${validateOperator(operator)} ` +
        `${quoteIdentifier(rightColumn)}`,
    );

    return this;
  }

  groupBy(columns) {
    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    this.groupColumns.push(...columns.map(quoteIdentifier));

    return this;
  }

  having(column, operator, value) {
    const placeholder = this.addParameter(value);

    this.havingConditions.push(
      `${quoteIdentifier(column)} ` +
        `${validateOperator(operator)} ` +
        `${placeholder}`,
    );

    return this;
  }

  orderBy(column, direction = "ASC") {
    const normalizedDirection = String(direction).toUpperCase();

    if (normalizedDirection !== "ASC" && normalizedDirection !== "DESC") {
      throw new Error("Order direction must be ASC or DESC");
    }

    this.orderColumns.push(`${quoteIdentifier(column)} ` + normalizedDirection);

    return this;
  }

  limit(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Limit must be a non-negative integer");
    }

    this.limitValue = value;

    return this;
  }

  offset(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Offset must be a non-negative integer");
    }

    this.offsetValue = value;

    return this;
  }

  compile() {
    if (!this.table) {
      throw new Error("SELECT query requires a table");
    }

    const columns =
      this.columns.length === 0
        ? "*"
        : this.columns
            .map((column) => {
              if (column === "*") {
                return "*";
              }

              if (typeof column === "object") {
                const { column: columnName, alias } = column;

                return (
                  `${quoteIdentifier(columnName)} ` +
                  `AS ${quoteIdentifier(alias)}`
                );
              }

              return quoteIdentifier(column);
            })
            .join(", ");

    let sql =
      `SELECT ` +
      `${this.distinctValue ? "DISTINCT " : ""}` +
      `${columns} ` +
      `FROM ${this.table}`;

    if (this.joins.length > 0) {
      sql += " " + this.joins.join(" ");
    }

    if (this.conditions.length > 0) {
      sql += " WHERE " + this.conditions.join(" AND ");
    }

    if (this.groupColumns.length > 0) {
      sql += " GROUP BY " + this.groupColumns.join(", ");
    }

    if (this.havingConditions.length > 0) {
      sql += " HAVING " + this.havingConditions.join(" AND ");
    }

    if (this.orderColumns.length > 0) {
      sql += " ORDER BY " + this.orderColumns.join(", ");
    }

    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return {
      text: sql,
      values: this.parameters,
    };
  }
}

module.exports = SelectQuery;
