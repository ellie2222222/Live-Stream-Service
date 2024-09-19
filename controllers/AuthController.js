const { login, signup } = require("../services/UserService");

const createAccessToken = require("../utils/createAccessToken");
const axios = require("axios");
const fs = require("fs");
const BUNNY_CDN_URL = "https://sg.storage.bunnycdn.com/live-stream-service/";
const BUNNY_CDN_API_KEY = "e68740b8-e7b2-4df2-82b616b8ab35-77e2-42d6";
class AuthController {
  // login a user
  async loginUser(req, res) {
    const { email, password } = req.body;

    try {
      const user = await login(email, password);

      const accessToken = createAccessToken(user._id);

      res.status(200).json({ accessToken, message: "Login success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // signup a user
  async signupUser(req, res) {
    const { name, email, password, bio } = req.body;
    const img = req.file ? req.file : null;

    try {
      const user = await signup(name, email, password, bio, img);

      const accessToken = createAccessToken(
        user._id,
        user.email,
        user.username,
        user.avatarUrl
      );

      res.status(201).json({ accessToken, message: "Signup success" });
    } catch (error) {

      res.status(500).json({ error: error.message });
    }
  };
}
module.exports = AuthController;
