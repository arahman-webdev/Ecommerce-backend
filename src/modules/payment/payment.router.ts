import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { PaymentController } from "./payment.controller";


const router = express.Router();

// Create order from cart
router.post("/create-order", checkAuth(UserRole.CUSTOMER), PaymentController.createOrderController);

// Initialize payment for existing order
router.post("/initiate/:id", checkAuth(UserRole.CUSTOMER), PaymentController.initiatePaymentController);

// Get user orders
router.get("/my-orders", checkAuth(UserRole.CUSTOMER), PaymentController.getUserOrdersController);

// Get order by ID
router.get("/order/:id", checkAuth(UserRole.CUSTOMER), PaymentController.getOrderByIdController);


router.post("/ssl-fail", PaymentController.sslFailHandler);
router.post("/ssl-cancel", PaymentController.sslCancelHandler);

export const paymentRoutes = router;