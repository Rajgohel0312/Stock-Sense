const QueryBuilder = require("./QueryBuilder");

const {
    quoteIdentifier,
    validateOperator
} = require("./sql");


class UpdateQuery extends QueryBuilder {

    constructor(executor, table) {
        super(executor);

        this.table = table;

        this.data = null;

        this.conditions = [];

        this.returningColumns = [];
    }


    set(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            throw new TypeError(
                "set() expects an object"
            );
        }

        if (Object.keys(data).length === 0) {
            throw new Error(
                "UPDATE requires at least one field"
            );
        }

        this.data = data;

        return this;
    }


    where(column, operator, value) {

        const placeholder =
            this.addParameter(value);

        this.conditions.push(
            `${quoteIdentifier(column)} ` +
            `${validateOperator(operator)} ` +
            `${placeholder}`
        );

        return this;
    }


    returning(columns) {

        if (!Array.isArray(columns)) {
            columns = [columns];
        }

        this.returningColumns = columns;

        return this;
    }


    compile() {

        if (!this.data) {
            throw new Error(
                "UPDATE requires set()"
            );
        }


        if (this.conditions.length === 0) {
            throw new Error(
                "UPDATE requires WHERE conditions"
            );
        }


        const setStatements =
            Object.keys(this.data)
                .map((column) => {
                    const placeholder =
                        this.addParameter(
                            this.data[column]
                        );

                    return (
                        `${quoteIdentifier(column)} ` +
                        `= ${placeholder}`
                    );
                });


        let sql =
            `UPDATE ${quoteIdentifier(this.table)} ` +
            `SET ${setStatements.join(", ")} ` +
            `WHERE ${this.conditions.join(" AND ")}`;


        if (this.returningColumns.length > 0) {
            sql +=
                " RETURNING " +
                this.returningColumns
                    .map(quoteIdentifier)
                    .join(", ");
        }


        return {
            text: sql,
            values: this.parameters
        };
    }

}


module.exports = UpdateQuery;