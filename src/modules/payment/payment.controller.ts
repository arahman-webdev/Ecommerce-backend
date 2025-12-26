import { NextFunction, Request, Response } from "express";
import AppError from "../../helper/AppError";

import httpStatus from "http-status-codes";
import { prisma } from "../../lib/prisma";
import { OrderPaymentService } from "./payment.service";

const createOrderController = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User authentication required");
    }

    if (!req.body.items || req.body.items.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Cart items missing");
    }

    const order = await OrderPaymentService.createOrderFromCart(userId, req.body);

    if (req.body.paymentMethod === "CASH_ON_DELIVERY") {
      return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Order created successfully with Cash on Delivery",
        data: { order }
      });
    }

    const paymentResult = await OrderPaymentService.initOrderPayment(order.id, userId);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Order created and payment initialized",
      data: {
        order,
        payment: paymentResult.data
      }
    });

  } catch (error) {
    next(error);
  }
};

// Initialize payment for existing order
const initiatePaymentController = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.id;
        const userId = req.user?.id;

        if (!orderId) {
            throw new AppError(httpStatus.BAD_REQUEST, "Order ID is required");
        }

        if (!userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "User authentication required");
        }

        const result = await OrderPaymentService.initOrderPayment(orderId, userId);

        res.status(httpStatus.OK).json({
            success: true,
            message: "Payment initiated successfully",
            data: result.data
        });

    } catch (error) {
        next(error);
    }
};

// SSL Success Handler
const sslSuccessHandler = async (req: Request, res: Response, next: NextFunction) => {


    // Check BOTH naming conventions
    const transactionId = req.query.tran_id || req.query.transactionId;
    const orderId = req.query.value_a || req.query.orderId;



    if (!transactionId) {
        return res.redirect(`${process.env.SSL_FAIL_FRONTEND_URL}?error=Missing transaction ID`);
    }

    try {
        // 1️⃣ Find the transaction
        const transaction = await prisma.sSLCommerzTransaction.findUnique({
            where: {
                transactionId: transactionId as string
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
        const actualOrderId = orderId as string || transaction.orderId;

        console.log('🎯 Processing payment:', {
            transactionId,
            actualOrderId,
            hasPayment: !!transaction.order.payment
        });

        // 2️⃣ For sandbox testing, skip verification
        console.log('⚠️ Sandbox mode - processing without verification');

        // Process payment without verification
        await prisma.$transaction(async (tx) => {
            // Update transaction
            await tx.sSLCommerzTransaction.update({
                where: { transactionId: transactionId as string },
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
                    orderId: actualOrderId as string
                },
                data: {
                    status: "COMPLETED",
                    updatedAt: new Date()
                },
            });

            // Update booking
            await tx.order.update({
                where: { id: actualOrderId as string },
                data: {
                    status: "CONFIRMED",
                    updatedAt: new Date()
                },
            });
        });



        return res.redirect(
            `${process.env.SSL_SUCCESS_FRONTEND_URL}?transactionId=${transactionId}&orderId=${actualOrderId}`
        );

    } catch (error: any) {

        next(error)
        // Update as failed
        try {
            if (transactionId) {
                await prisma.sSLCommerzTransaction.update({
                    where: { transactionId: transactionId as string },
                    data: { status: "FAILED", updatedAt: new Date() },
                });

                // Try to find booking to update payment
                const transaction = await prisma.sSLCommerzTransaction.findUnique({
                    where: { transactionId: transactionId as string }
                });

                if (transaction?.orderId) {
                    await prisma.payment.update({
                        where: { orderId: transaction.orderId }, // Use bookingId
                        data: { status: "FAILED", updatedAt: new Date() },
                    });
                }
            }
        } catch (dbError) {
            console.error("Database update error:", dbError);
        }

        const errorMessage = encodeURIComponent(error.message || "Payment processing failed");
        return res.redirect(
            `${process.env.SSL_FAIL_FRONTEND_URL}?transactionId=${transactionId}&error=${errorMessage}`
        );
    }
};

// SSL Fail Handler
const sslFailHandler = async (req: Request, res: Response) => {
    console.log("❌ SSL Fail Callback:", req.query);

    const transactionId = req.query.tran_id || req.query.transactionId;
    const error = req.query.error;

    if (transactionId) {
        try {
            await prisma.sSLCommerzTransaction.update({
                where: { transactionId: transactionId as string },
                data: { status: "FAILED", updatedAt: new Date() },
            });

            const transaction = await prisma.sSLCommerzTransaction.findUnique({
                where: { transactionId: transactionId as string }
            });

            if (transaction?.orderId) {
                await prisma.payment.update({
                    where: { orderId: transaction.orderId },
                    data: { status: "FAILED", updatedAt: new Date() },
                });
            }
        } catch (dbError) {
            console.error("Database update error:", dbError);
        }
    }

    return res.redirect(
        `${process.env.SSL_FAIL_FRONTEND_URL}?transactionId=${transactionId}&error=${error || "Payment failed"}`
    );
};

// SSL Cancel Handler
const sslCancelHandler = async (req: Request, res: Response) => {
    console.log("SSL Cancel Callback:", req.query);

    const transactionId = req.query.tran_id || req.query.transactionId;

    if (transactionId) {
        await prisma.sSLCommerzTransaction.update({
            where: { transactionId: transactionId as string },
            data: { status: "CANCELLED" },
        });

        const transaction = await prisma.sSLCommerzTransaction.findUnique({
            where: { transactionId: transactionId as string }
        });
        
        if (transaction?.orderId) {
            await prisma.payment.update({
                where: { orderId: transaction.orderId },
                data: { status: "CANCELLED" },
            });
        }
    }

    return res.redirect(`${process.env.SSL_CANCEL_FRONTEND_URL}?transactionId=${transactionId}`);
};

// Get user orders
const getUserOrdersController = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "User authentication required");
        }

        const orders = await OrderPaymentService.getUserOrders(userId);

        res.status(httpStatus.OK).json({
            success: true,
            message: "Orders fetched successfully",
            data: orders
        });

    } catch (error) {
        next(error);
    }
};

// Get order by ID
const getOrderByIdController = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.id;
        const userId = req.user?.id;

        if (!orderId) {
            throw new AppError(httpStatus.BAD_REQUEST, "Order ID is required");
        }

        if (!userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "User authentication required");
        }

        const order = await OrderPaymentService.getOrderById(orderId, userId);

        res.status(httpStatus.OK).json({
            success: true,
            message: "Order fetched successfully",
            data: order
        });

    } catch (error) {
        next(error);
    }
};

export const PaymentController = {
    createOrderController,
    initiatePaymentController,
    sslSuccessHandler,
    sslCancelHandler,
    sslFailHandler,
    getUserOrdersController,
    getOrderByIdController
};