"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const AppError_1 = __importDefault(require("../../helper/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const prisma_1 = require("../../lib/prisma");
const payment_service_1 = require("./payment.service");
// Create order from cart
const createOrderController = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User authentication required");
        }
        const order = await payment_service_1.OrderPaymentService.createOrderFromCart(userId, req.body);
        // If payment method is COD, return order directly
        if (req.body.paymentMethod === "CASH_ON_DELIVERY") {
            return res.status(http_status_codes_1.default.CREATED).json({
                success: true,
                message: "Order created successfully with Cash on Delivery",
                data: { order }
            });
        }
        // For online payments, initialize payment
        const paymentResult = await payment_service_1.OrderPaymentService.initOrderPayment(order.id, userId);
        res.status(http_status_codes_1.default.CREATED).json({
            success: true,
            message: "Order created and payment initialized",
            data: {
                order,
                payment: paymentResult.data
            }
        });
    }
    catch (error) {
        next(error);
    }
};
// Initialize payment for existing order
const initiatePaymentController = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user?.id;
        if (!orderId) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Order ID is required");
        }
        if (!userId) {
            throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User authentication required");
        }
        const result = await payment_service_1.OrderPaymentService.initOrderPayment(orderId, userId);
        res.status(http_status_codes_1.default.OK).json({
            success: true,
            message: "Payment initiated successfully",
            data: result.data
        });
    }
    catch (error) {
        next(error);
    }
};
// // SSL Success Handler
// const sslSuccessHandler = async (req: Request, res: Response, next: NextFunction) => {
//     const transactionId = req.query.tran_id || req.query.transactionId;
//     const orderId = req.query.value_a || req.query.orderId;
//     const valId = req.query.val_id as string;
//     const bankTransaction = req.query.bank_tran_id as string;
//     if (!transactionId) {
//         return res.redirect(`${process.env.SSL_FAIL_FRONTEND_URL}?error=Missing transaction ID`);
//     }
//     try {
//         await OrderPaymentService.processSuccessfulPayment(
//             transactionId as string,
//             valId,
//             bankTransaction
//         );
//         return res.redirect(
//             `${process.env.SSL_SUCCESS_FRONTEND_URL}?transactionId=${transactionId}&orderId=${orderId}`
//         );
//     } catch (error: any) {
//         next(error);
//         try {
//             if (transactionId) {
//                 await prisma.sSLCommerzTransaction.update({
//                     where: { transactionId: transactionId as string },
//                     data: { status: "FAILED", updatedAt: new Date() },
//                 });
//                 const transaction = await prisma.sSLCommerzTransaction.findUnique({
//                     where: { transactionId: transactionId as string }
//                 });
//                 if (transaction?.orderId) {
//                     await prisma.payment.update({
//                         where: { orderId: transaction.orderId },
//                         data: { status: "FAILED", updatedAt: new Date() },
//                     });
//                 }
//             }
//         } catch (dbError) {
//             console.error("Database update error:", dbError);
//         }
//         const errorMessage = encodeURIComponent(error.message || "Payment processing failed");
//         return res.redirect(
//             `${process.env.SSL_FAIL_FRONTEND_URL}?transactionId=${transactionId}&error=${errorMessage}`
//         );
//     }
// };
// SSL Fail Handler
const sslFailHandler = async (req, res) => {
    console.log("❌ SSL Fail Callback:", req.query);
    const transactionId = req.query.tran_id || req.query.transactionId;
    const error = req.query.error;
    if (transactionId) {
        try {
            await prisma_1.prisma.sSLCommerzTransaction.update({
                where: { transactionId: transactionId },
                data: { status: "FAILED", updatedAt: new Date() },
            });
            const transaction = await prisma_1.prisma.sSLCommerzTransaction.findUnique({
                where: { transactionId: transactionId }
            });
            if (transaction?.orderId) {
                await prisma_1.prisma.payment.update({
                    where: { orderId: transaction.orderId },
                    data: { status: "FAILED", updatedAt: new Date() },
                });
            }
        }
        catch (dbError) {
            console.error("Database update error:", dbError);
        }
    }
    return res.redirect(`${process.env.SSL_FAIL_FRONTEND_URL}?transactionId=${transactionId}&error=${error || "Payment failed"}`);
};
// SSL Cancel Handler
const sslCancelHandler = async (req, res) => {
    console.log("SSL Cancel Callback:", req.query);
    const transactionId = req.query.tran_id || req.query.transactionId;
    if (transactionId) {
        await prisma_1.prisma.sSLCommerzTransaction.update({
            where: { transactionId: transactionId },
            data: { status: "CANCELLED" },
        });
        const transaction = await prisma_1.prisma.sSLCommerzTransaction.findUnique({
            where: { transactionId: transactionId }
        });
        if (transaction?.orderId) {
            await prisma_1.prisma.payment.update({
                where: { orderId: transaction.orderId },
                data: { status: "CANCELLED" },
            });
        }
    }
    return res.redirect(`${process.env.SSL_CANCEL_FRONTEND_URL}?transactionId=${transactionId}`);
};
// Get user orders
const getUserOrdersController = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User authentication required");
        }
        const orders = await payment_service_1.OrderPaymentService.getUserOrders(userId);
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
        const order = await payment_service_1.OrderPaymentService.getOrderById(orderId, userId);
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
exports.PaymentController = {
    createOrderController,
    initiatePaymentController,
    // sslSuccessHandler,
    sslCancelHandler,
    sslFailHandler,
    getUserOrdersController,
    getOrderByIdController
};
