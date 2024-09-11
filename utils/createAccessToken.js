const jwt = require("jsonwebtoken");

const createAccessToken = (_id) => {
    return jwt.sign({ _id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '6h' });
}

module.exports = createAccessToken