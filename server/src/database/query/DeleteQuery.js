const QueryBuilder = require("./QueryBuilder");

const {
    quoteIdentifier,
    validateOperator
} = require("./sql");


class DeleteQuery extends QueryBuilder {

    constructor(executor, table) {
        super(executor);

        this.table = table;

        this.conditions = [];

        this.returningColumns = [];
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

        if (this.conditions.length === 0) {
            throw new Error(
                "DELETE requires WHERE conditions"
            );
        }


        let sql =
            `DELETE FROM ${quoteIdentifier(this.table)} ` +
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


module.exports = DeleteQuery;