const { uploadToBunny, deleteFromBunny } = require("../middlewares/UploadToBunny");
const { login, signup } = require("../services/UserService");
const createAccessToken = require("../utils/createAccessToken");
require("dotenv").config();
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
    const avatarFile = req.file;

    if (!avatarFile) {
      return res.status(400).send({ message: "Avatar file is required" });
    }

    try {
      const user = await signup(name, email, password, bio, avatarFile);

      res.status(201).json({ message: "Signup success" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
module.exports = AuthController;
