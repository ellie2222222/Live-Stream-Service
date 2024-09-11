const express = require('express')
const UserController = require('../controllers/UserController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const userController = new UserController();

const userRoutes = express.Router();

userRoutes.get('/users/', AuthMiddleware, userController.getUsers);

userRoutes.patch('/users/:userId', AuthMiddleware, userController.updateUser);

userRoutes.get('/users/:userId', AuthMiddleware, userController.getUser);

userRoutes.delete('/users/:userId', AuthMiddleware, userController.deleteUser);

module.exports = userRoutes;