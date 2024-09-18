const { 
    getStreamsByCategory, 
    likeStreamService,
} = require("../services/StreamService");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const createAccessToken = require("../utils/createAccessToken");

class StreamController{
    async getCate(req, res) {
        try {
            const token = req.userId;
    
            const categories = await getStreamsByCategory(token);
    
            res.status(200).json({ data: categories, message: 'Success' });
        } catch (error) {
            console.error('Error in getCate:', error.message);
            res.status(500).json({ error: error.message });
        }
    }

    async likeStreamControll(req, res) {
        try {

            const { streamId, action, email } = req.body;

            const likeStream = await likeStreamService(streamId, action, email);

            const accessToken = createAccessToken(likeStream._id);

            res.status(201).json({ accessToken, like: likeStream, message: "CreateStream success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
    
    async getTop10Stream(req, res) {
        try {

            const { email } = req.body;

            const user = await getTop10Stream(username, email, password);

            res.status(201).json({ accessToken, message: "Signup success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = StreamController;