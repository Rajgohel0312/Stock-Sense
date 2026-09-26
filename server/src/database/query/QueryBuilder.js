class QueryBuilder {

    constructor(executor) {
        this.executor = executor;
        this.parameters = [];
    }


    addParameter(value) {
        this.parameters.push(value);

        return `$${this.parameters.length}`;
    }


    async execute() {
        const compiled = this.compile();

        return this.executor.query(
            compiled.text,
            compiled.values
        );
    }


    compile() {
        throw new Error(
            "compile() must be implemented"
        );
    }

}


module.exports = QueryBuilder;