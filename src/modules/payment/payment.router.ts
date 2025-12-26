import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { PaymentController } from "./payment.controller";


const router = express.Router();

// Create order from cart
router.post("/create-order", checkAuth(UserRole.CUSTOMER), PaymentController.createOrderController);

// router.get("/my", checkAuth(UserRole.CUSTOMER), PaymentController.getMyBookings)
// router.get("/my-products-orders", checkAuth(UserRole.SELLER), BookingController.getMyTourBookings);
router.get("/orders", checkAuth(UserRole.ADMIN, UserRole.CUSTOMER), PaymentController.getAllOrders)

// Initialize payment for existing order
router.post("/initiate/:id", checkAuth(UserRole.CUSTOMER), PaymentController.initiatePaymentController);

router.post("/success", PaymentController.sslSuccessHandler);

// Get user orders
router.get("/my-orders", checkAuth(UserRole.CUSTOMER), PaymentController.getUserOrdersController);

// Get order by ID
router.get("/order/:id", checkAuth(UserRole.CUSTOMER), PaymentController.getOrderByIdController);


router.post("/ssl-fail", PaymentController.sslFailHandler);
router.post("/ssl-cancel", PaymentController.sslCancelHandler);

export const paymentRoutes = router;