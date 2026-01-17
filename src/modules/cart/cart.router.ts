// cart.route.ts
import express from "express";
import { cartController } from "./cart.controller";

const router = express.Router();

router.post("/cart", cartController.createCart);

export const cartRoutes = router;
