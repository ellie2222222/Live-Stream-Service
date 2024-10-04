import express from "express";
import UserController from "../controllers/UserController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import upload from "../middlewares/UploadConfig.js";

const userController = new UserController();
const userRoutes = express.Router();

userRoutes.get("/users/all", AuthMiddleware, userController.getUsers);

userRoutes.get(
  "/users/totalLikes",
  AuthMiddleware,
  userController.userTotalLikes
);

userRoutes.get(
  "/users/topUser",
  AuthMiddleware,
  userController.getTopLikedUser
);

userRoutes.put(
  "/users/follow/:userId/:streamerId",
  userController.followAStreamerById
);

userRoutes.put(
  "/users/unfollow/:userId/:streamerId",
  userController.unfollowAStreamerById
);

userRoutes.patch(
  "/users/:userId",
  AuthMiddleware,
  upload.single("avatar"),
  userController.updateUser
);

userRoutes.get("/users/:userId", AuthMiddleware, userController.getUser);

userRoutes.delete("/users/:userId", AuthMiddleware, userController.deleteUser);

userRoutes.put(
  "/users/:userId/changePassword",
  AuthMiddleware,
  userController.changeUserPassword
);

userRoutes.post(
  "/users/resetPassword",
  AuthMiddleware,
  userController.generateResetUserPasswordToken
);

userRoutes.post(
  "/users/resetPassword/:token",
  AuthMiddleware,
  userController.resetUserPassword
);

export default userRoutes;
