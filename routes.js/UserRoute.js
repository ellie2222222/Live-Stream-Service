const express = require('express')
const UserController = require('../controllers/UserController');
const userController = new UserController();
const authRoutes = express.Router();

authRoutes.patch('/users/:userId/profile-update', userController.updateUser);

authRoutes.get('/users/:userId', userController.getUser);

authRoutes.delete('/users/:userId', userController.deleteUser);

module.exports = authRoutes;