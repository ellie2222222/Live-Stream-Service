const express = require('express')
const UserController = require('../controllers/UserController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const userController = new UserController();
const upload = require('../middlewares/UploadConfig');

const userRoutes = express.Router();

userRoutes.get('/users/getAllUser', AuthMiddleware, userController.getAllUser);

userRoutes.get('/users/getUser', AuthMiddleware, userController.getUser);

userRoutes.put('/users/update', upload.single('img'), AuthMiddleware, userController.updateUser);

userRoutes.delete('/users/delete', AuthMiddleware, userController.deleteUser);

module.exports = userRoutes;