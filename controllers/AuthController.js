const { login, signup } = require("../services/UserService");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

      const accessToken = createAccessToken(
        user._id,
        user.email,
        user.username
      );

      res.status(200).json({ accessToken, message: "Login success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // signup a user
  async signupUser(req, res) {
    const { username, email, password } = req.body;
    const avatarFile = req.file;
    let avatarUrl = "";

    if (!avatarFile) {
      return res.status(400).send("Avatar file is required");
    }

    try {
      // Read the file
      const fileStream = fs.createReadStream(avatarFile.path);

      // Prepare headers for Bunny CDN
      const headers = {
        AccessKey: BUNNY_CDN_API_KEY,
        "Content-Type": avatarFile.mimetype,
      };

      const name = avatarFile.originalname.trim().replace(/\s+/g, "%20");
      const uniqueName = `${Date.now()}-${name}`;

      // Upload the file to Bunny CDN
      const bunnyCdnResponse = await axios.put(
        `${BUNNY_CDN_URL}${uniqueName}`, // Define the storage path and file name
        fileStream,
        { headers }
      );

      // Clean up the uploaded file from local server
      fs.unlinkSync(avatarFile.path);

      // Handle success
      console.log("File uploaded successfully:", bunnyCdnResponse.data);
      avatarUrl = `https://live-stream-service.b-cdn.net/${uniqueName}`;
      // res.status(200).json({
      //   message: "Form submitted successfully",
      //   email,
      //   username,
      //   bio,
      //   avatarUrl: `https://live-stream-service.b-cdn.net/${uniqueName}`,
      // });
    } catch (error) {
      console.error("Error uploading file to Bunny CDN:", error.message);
      res.status(500).json({ error: "Error uploading file" });
    }

    try {
      const user = await signup(username, email, password, avatarUrl);
      console.log(user);

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
  }
}
module.exports = AuthController;
