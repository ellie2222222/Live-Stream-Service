const express = require('express')
const AuthController = require('../controllers/AuthController');
const authController = new AuthController();
const authRoutes = express.Router();

authRoutes.post('/auth/login', authController.loginUser);

authRoutes.post('/auth/signup', authController.signupUser);

authRoutes.post('/logout', () => {});

module.exports = authRoutes;