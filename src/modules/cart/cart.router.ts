// cart.route.ts
import express from "express";
import { cartController } from "./cart.controller";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";

const router = express.Router();

router.post("/merge", checkAuth(UserRole.CUSTOMER), cartController.createCart);
router.get("/", checkAuth(UserRole.CUSTOMER), cartController.getCart);
router.patch(
  "/quantity",
  checkAuth(UserRole.CUSTOMER),
  cartController.updateQuantity
);
router.delete(
  "/:productId",
  checkAuth(UserRole.CUSTOMER),
  cartController.removeItem
);

router.delete(
  "/clear",
  checkAuth(UserRole.CUSTOMER),
  cartController.clearCart
);


export const cartRoutes = router;
