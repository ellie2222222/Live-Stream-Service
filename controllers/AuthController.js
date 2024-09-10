const { login, signup } = require("../services/UserService");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const createAccessToken = require("../utils/createAccessToken");

class AuthController {
    // login a user
    async loginUser(req, res) {
        const { email, password } = req.body;

        try {
            const user = await login(email, password);

            const accessToken = createAccessToken(user._id, user.email, user.username);

            res.status(200).json({ accessToken, message: "Login success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // signup a user
    async signupUser(req, res) {
        const { username, email, password } = req.body;

        try {
            const user = await signup(username, email, password);

            const accessToken = createAccessToken(user._id, user.email, user.username);

            res.status(201).json({ accessToken, message: "Signup success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = AuthController;