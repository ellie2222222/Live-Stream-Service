import express from "express";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import IngressController from "../controllers/ingressController.js";

const ingressController = new IngressController();
const ingressRoute = express.Router();

ingressRoute.post("/ingress/:streamId", AuthMiddleware, ingressController.updateStream);

export default ingressRoute;
