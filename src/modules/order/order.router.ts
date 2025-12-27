import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { OrderController } from "./order.controller";

const router = express.Router();

/* ---------------- ADMIN ---------------- */
router.get(
  "/",
 
  OrderController.getAllOrders
);

/* ---------------- SELLER ---------------- */
router.get(
  "/seller-orders",
  checkAuth(UserRole.SELLER),
  OrderController.getSellerOrders
);

/* ---------------- CUSTOMER ---------------- */
router.get(
  "/my-orders",
  checkAuth(UserRole.CUSTOMER),
  OrderController.getUserOrdersController
);

router.get(
  "/:id",
  checkAuth(UserRole.CUSTOMER),
  OrderController.getOrderByIdController
);

/* ---------------- DELETE ---------------- */
router.delete(
  "/:id",
  checkAuth(UserRole.SELLER, UserRole.ADMIN),
  OrderController.deleteOrder
);

router.patch(
  "/:id/status",
  checkAuth(UserRole.SELLER, UserRole.ADMIN),
  OrderController.updateOrderStatus
);

export const orderRoutes = router;
