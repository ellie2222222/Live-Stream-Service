const express = require("express");
const AuthController = require("../controllers/AuthController");
const authController = new AuthController();
const authRoutes = express.Router();
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
});
authRoutes.post("/auth/login", authController.loginUser);

authRoutes.post(
  "/auth/signup",
  upload.single("avatar"),
  authController.signupUser
);

authRoutes.post("/logout", () => {});

module.exports = authRoutes;
