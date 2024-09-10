const jwt = require("jsonwebtoken");

const createAccessToken = (_id, email, username) => {
    return jwt.sign({ _id, email, username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '30m' });
}

module.exports = createAccessToken