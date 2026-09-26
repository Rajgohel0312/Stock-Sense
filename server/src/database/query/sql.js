
function quoteIdentifier(identifier) {
    if (typeof identifier !== "string") {
        throw new TypeError(
            "SQL identifier must be a string"
        );
    }

    const value = identifier.trim();

    if (!value) {
        throw new Error(
            "SQL identifier cannot be empty"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Support:
    |
    | users
    | users.id
    | p.id
    |--------------------------------------------------------------------------
    */

    const parts = value.split(".");

    for (const part of parts) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(part)) {
            throw new Error(
                `Invalid SQL identifier: ${identifier}`
            );
        }
    }

    return parts
        .map((part) => `"${part}"`)
        .join(".");
}


function quoteTable(table, alias) {
    const quotedTable = quoteIdentifier(table);

    if (!alias) {
        return quotedTable;
    }

    return `${quotedTable} AS ${quoteIdentifier(alias)}`;
}


function validateOperator(operator) {
    const allowed = [
        "=",
        "!=",
        "<>",
        ">",
        ">=",
        "<",
        "<=",
        "LIKE",
        "ILIKE"
    ];

    const normalized = String(operator)
        .trim()
        .toUpperCase();

    if (!allowed.includes(normalized)) {
        throw new Error(
            `Unsupported SQL operator: ${operator}`
        );
    }

    return normalized;
}


function pushParameter(parameters, value) {
    parameters.push(value);

    return `$${parameters.length}`;
}


module.exports = {
    quoteIdentifier,
    quoteTable,
    validateOperator,
    pushParameter
};