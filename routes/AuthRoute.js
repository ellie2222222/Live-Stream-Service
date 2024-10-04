import express from 'express';
import AuthController from '../controllers/AuthController.js';
import upload from '../middlewares/UploadConfig.js';

const authController = new AuthController();
const authRoutes = express.Router();

authRoutes.post('/auth/login', authController.loginUser);

authRoutes.post('/auth/signup', upload.single('avatar'), authController.signupUser);

authRoutes.get('/auth/verify', authController.verifyUserEmail);

authRoutes.get('/auth/verify/resend', authController.resendVerificationEmail);

authRoutes.post('/auth/stream-verify', (req, res) => {
    const streamkey = req.body.key;
    console.log(streamkey);

    if (streamkey === "supersecret") {
        res.status(200).send();
        return;
    }

    res.status(403).send();
});

export default authRoutes;
