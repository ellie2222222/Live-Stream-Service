const {
  uploadToBunny,
  deleteFromBunny,
} = require("../middlewares/UploadToBunny");
const {
  login,
  signup,
  sendVerificationEmail,
  verifyUserEmail,
} = require("../services/UserService");
const mailer = require("../utils/mailer");
const createAccessToken = require("../utils/createAccessToken");
const bcrypt = require("bcrypt");
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
      if (user) {
        await sendVerificationEmail(user.email);
      }
      res.status(201).json({ message: "Signup success" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // verify user email
  async verifyUserEmail(req, res) {
    const { token } = req.query;
    try {
      await verifyUserEmail(token, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // resend verification email
  async resendVerificationEmail(req, res) {
    const { email } = req.query;
    try {
      await sendVerificationEmail(email);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
module.exports = AuthController;
