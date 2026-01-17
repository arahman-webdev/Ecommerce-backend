"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const enums_1 = require("../../generated/enums");
const order_controller_1 = require("./order.controller");
const router = express_1.default.Router();
/* ---------------- ADMIN ---------------- */
router.get("/", order_controller_1.OrderController.getAllOrders);
/* ---------------- SELLER ---------------- */
router.get("/seller-orders", (0, checkAuth_1.default)(enums_1.UserRole.SELLER), order_controller_1.OrderController.getSellerOrders);
/* ---------------- CUSTOMER ---------------- */
router.get("/my-orders", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), order_controller_1.OrderController.getUserOrdersController);
router.get("/:id", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), order_controller_1.OrderController.getOrderByIdController);
/* ---------------- DELETE ---------------- */
router.delete("/:id", (0, checkAuth_1.default)(enums_1.UserRole.SELLER, enums_1.UserRole.ADMIN), order_controller_1.OrderController.deleteOrder);
router.patch("/:id/status", (0, checkAuth_1.default)(enums_1.UserRole.SELLER, enums_1.UserRole.ADMIN), order_controller_1.OrderController.updateOrderStatus);
exports.orderRoutes = router;
