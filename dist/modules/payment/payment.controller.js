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
const createOrderController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User authentication required");
        }
        if (!req.body.items || req.body.items.length === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cart items missing");
        }
        const order = await payment_service_1.OrderPaymentService.createOrderFromCart(userId, req.body);
        if (req.body.paymentMethod === "CASH_ON_DELIVERY") {
            return res.status(http_status_codes_1.default.CREATED).json({
                success: true,
                message: "Order created successfully with Cash on Delivery",
                data: { order }
            });
        }
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
// SSL Success Handler
const sslSuccessHandler = async (req, res, next) => {
    // Check BOTH naming conventions
    const transactionId = req.query.tran_id || req.query.transactionId;
    const orderId = req.query.value_a || req.query.orderId;
    if (!transactionId) {
        return res.redirect(`${process.env.SSL_FAIL_FRONTEND_URL}?error=Missing transaction ID`);
    }
    try {
        // 1️⃣ Find the transaction
        const transaction = await prisma_1.prisma.sSLCommerzTransaction.findUnique({
            where: {
                transactionId: transactionId
            },
            include: {
                order: {
                    include: {
                        payment: true
                    }
                }
            },
        });
        if (!transaction || !transaction.order) {
            console.log('❌ Transaction or booking not found:', transactionId);
            return res.redirect(`${process.env.SSL_FAIL_FRONTEND_URL}?transactionId=${transactionId}&error=Transaction not found`);
        }
        // Get bookingId from transaction if not in query
        const actualOrderId = orderId || transaction.orderId;
        console.log('🎯 Processing payment:', {
            transactionId,
            actualOrderId,
            hasPayment: !!transaction.order.payment
        });
        // 2️⃣ For sandbox testing, skip verification
        console.log('⚠️ Sandbox mode - processing without verification');
        // Process payment without verification
        await prisma_1.prisma.$transaction(async (tx) => {
            // Update transaction
            await tx.sSLCommerzTransaction.update({
                where: { transactionId: transactionId },
                data: {
                    status: "SUCCESS",
                    valId: "SANDBOX_TEST_" + Date.now(),
                    bankTransaction: "SANDBOX_TEST_" + Date.now(),
                    updatedAt: new Date()
                },
            });
            // Update payment USING bookingId (not transactionId)
            await tx.payment.update({
                where: {
                    orderId: actualOrderId
                },
                data: {
                    status: "COMPLETED",
                    updatedAt: new Date()
                },
            });
            // Update booking
            await tx.order.update({
                where: { id: actualOrderId },
                data: {
                    status: "CONFIRMED",
                    updatedAt: new Date()
                },
            });
        });
        return res.redirect(`${process.env.SSL_SUCCESS_FRONTEND_URL}?transactionId=${transactionId}&orderId=${actualOrderId}`);
    }
    catch (error) {
        next(error);
        // Update as failed
        try {
            if (transactionId) {
                await prisma_1.prisma.sSLCommerzTransaction.update({
                    where: { transactionId: transactionId },
                    data: { status: "FAILED", updatedAt: new Date() },
                });
                // Try to find booking to update payment
                const transaction = await prisma_1.prisma.sSLCommerzTransaction.findUnique({
                    where: { transactionId: transactionId }
                });
                if (transaction?.orderId) {
                    await prisma_1.prisma.payment.update({
                        where: { orderId: transaction.orderId }, // Use bookingId
                        data: { status: "FAILED", updatedAt: new Date() },
                    });
                }
            }
        }
        catch (dbError) {
            console.error("Database update error:", dbError);
        }
        const errorMessage = encodeURIComponent(error.message || "Payment processing failed");
        return res.redirect(`${process.env.SSL_FAIL_FRONTEND_URL}?transactionId=${transactionId}&error=${errorMessage}`);
    }
};
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
exports.PaymentController = {
    createOrderController,
    initiatePaymentController,
    sslSuccessHandler,
    sslCancelHandler,
    sslFailHandler,
};
