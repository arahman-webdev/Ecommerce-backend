"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const AppError_1 = __importDefault(require("../../helper/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const order_service_1 = require("./order.service");
// Get user orders
const getUserOrdersController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User authentication required");
        }
        const orders = await order_service_1.OrderService.getUserOrders(userId);
        res.status(http_status_codes_1.default.OK).json({
            success: true,
            message: "Orders fetched successfully",
            data: orders
        });
    }
    catch (error) {
        next(error);
    }
};
// Get order by ID
const getOrderByIdController = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user?.id;
        if (!orderId) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Order ID is required");
        }
        if (!userId) {
            throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User authentication required");
        }
        const order = await order_service_1.OrderService.getOrderById(orderId, userId);
        res.status(http_status_codes_1.default.OK).json({
            success: true,
            message: "Order fetched successfully",
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
const getAllOrders = async (req, res, next) => {
    try {
        const bookings = await order_service_1.OrderService.getAllOrders();
        res.status(200).json({
            success: true,
            message: "All orders retrieved successfully",
            data: bookings,
        });
    }
    catch (error) {
        next(error);
    }
};
const deleteOrder = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const user = req.user;
        if (!user)
            throw new AppError_1.default(401, "Unauthorized");
        const result = await order_service_1.OrderService.deleteOrder(productId, {
            id: user.userId,
            userRole: user.userRole,
        });
        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// for seller
const getSellerOrders = async (req, res, next) => {
    try {
        const sellerId = req.user.userId; // from auth middleware
        console.log("SELLERID", sellerId);
        const orders = await order_service_1.OrderService.getSellerOrders(sellerId);
        res.status(200).json({
            success: true,
            data: orders,
        });
    }
    catch (error) {
        next(error);
    }
};
const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        const updated = await order_service_1.OrderService.updateOrderStatus(orderId, status);
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.OrderController = {
    getUserOrdersController,
    getOrderByIdController,
    getAllOrders,
    deleteOrder,
    getSellerOrders,
    updateOrderStatus
};
