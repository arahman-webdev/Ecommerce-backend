"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const enums_1 = require("../../generated/enums");
const payment_controller_1 = require("./payment.controller");
const router = express_1.default.Router();
// Create order from cart
router.post("/create-order", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), payment_controller_1.PaymentController.createOrderController);
// router.get("/my", checkAuth(UserRole.CUSTOMER), PaymentController.getMyBookings)
// router.get("/my-products-orders", checkAuth(UserRole.SELLER), BookingController.getMyTourBookings);
// Initialize payment for existing order
router.post("/initiate/:id", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), payment_controller_1.PaymentController.initiatePaymentController);
router.post("/success", payment_controller_1.PaymentController.sslSuccessHandler);
router.post("/ssl-fail", payment_controller_1.PaymentController.sslFailHandler);
router.post("/ssl-cancel", payment_controller_1.PaymentController.sslCancelHandler);
exports.paymentRoutes = router;
