import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { OrderController } from "./order.controller";



const router = express.Router();



// router.get("/my", checkAuth(UserRole.CUSTOMER), PaymentController.getMyBookings)
// router.get("/my-products-orders", checkAuth(UserRole.SELLER), BookingController.getMyTourBookings);
router.get("/orders", checkAuth(UserRole.ADMIN), OrderController.getAllOrders)

router.delete("/order/:id", checkAuth(UserRole.SELLER, UserRole.ADMIN), OrderController.deleteOrder);


// Get user orders
router.get("/my-orders", checkAuth(UserRole.CUSTOMER, UserRole.SELLER), OrderController.getUserOrdersController);

// Get order by ID
router.get("/order/:id", checkAuth(UserRole.CUSTOMER), OrderController.getOrderByIdController);


export const orderRoutes = router;