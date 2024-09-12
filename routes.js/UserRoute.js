const express = require("express");
const UserController = require("../controllers/UserController");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const userController = new UserController();
const multer = require("multer");

// import multer from "multer";

const userRoutes = express.Router();

userRoutes.get("/users/", AuthMiddleware, userController.getUsers);

userRoutes.patch("/users/:userId", AuthMiddleware, userController.updateUser);

userRoutes.get("/users/:userId", AuthMiddleware, userController.getUser);

userRoutes.delete("/users/:userId", AuthMiddleware, userController.deleteUser);

// userRoutes.post("/upload", upload.single("avatar"), async (req, res) => {
//   console.log(req.avatar.fileList);
//   const avatar = req.avatar?.fileList[0];

//   if (!avatar) {
//     res.status(400).json({ message: "No file upload" });
//   }

//   const uploadResponse = await handleFileUpload(avatar);
//   if (uploadResponse) {
//     res.status(201).json({
//       message: "File uploaded",
//       url: uploadResponse,
//     });
//   } else {
//     res.status(500).json({
//       message: "File upload failed",
//     });
//   }
// });
module.exports = userRoutes;
