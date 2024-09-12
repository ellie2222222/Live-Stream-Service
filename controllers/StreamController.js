const { 
    getUrlStream, 
    createStream,
} = require("../services/StreamService");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const createAccessToken = require("../utils/createAccessToken");

class StreamController{
    async getUrlStream (req, res) {
        
        try {
            const { email } = req.body;

            const url = await getUrlStream(email);

            res.status(200).json({ url, message: 'Access granted to live stream' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // signup a user
    async createStream(req, res) {
        const { username, email, password } = req.body;

        try {
            const user = await signup(username, email, password);

            const accessToken = createAccessToken(user._id);

            res.status(201).json({ accessToken, message: "Signup success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = StreamController;