const express = require('express')
const AuthController = require('../controllers/AuthController');
const authController = new AuthController();
const authRoutes = express.Router();
const upload = require('../middlewares/UploadConfig');

authRoutes.post('/auth/login', authController.loginUser);

authRoutes.post('/auth/signup', upload.single('avatar'), authController.signupUser);

authRoutes.get('/auth/verify',authController.verifyUserEmail)

authRoutes.get('/auth/verify/resend',authController.resendVerificationEmail)

module.exports = authRoutes;