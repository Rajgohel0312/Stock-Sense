const QueryBuilder = require("./QueryBuilder");

const {
    quoteIdentifier
} = require("./sql");


class InsertQuery extends QueryBuilder {

    constructor(executor, table) {
        super(executor);

        this.table = table;

        this.data = null;

        this.returningColumns = [];
    }


    values(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            throw new TypeError(
                "values() expects an object"
            );
        }

        const keys = Object.keys(data);

        if (keys.length === 0) {
            throw new Error(
                "INSERT requires at least one value"
            );
        }

        this.data = data;

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
                "INSERT requires values()"
            );
        }


        const keys = Object.keys(this.data);


        const columns = keys
            .map(quoteIdentifier)
            .join(", ");


        const placeholders = keys.map(
            (key) => this.addParameter(
                this.data[key]
            )
        );


        let sql =
            `INSERT INTO ${quoteIdentifier(this.table)} ` +
            `(${columns}) ` +
            `VALUES (${placeholders.join(", ")})`;


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


module.exports = InsertQuery;