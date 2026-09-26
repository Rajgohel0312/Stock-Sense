const env = require("./env");


function getAuthCookieOptions() {

    const isProduction =
        env.nodeEnv === "production";


    return {
        httpOnly: true,

        secure: isProduction,

        sameSite:
            isProduction
                ? "none"
                : "lax",

        maxAge:
            24 * 60 * 60 * 1000,

        path: "/"
    };
}


module.exports = {
    getAuthCookieOptions
};