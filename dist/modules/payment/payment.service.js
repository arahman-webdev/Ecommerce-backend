"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPaymentService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const prisma_1 = require("../../lib/prisma");
const AppError_1 = __importDefault(require("../../helper/AppError"));
const sslPayment_service_1 = require("../sslPayment/sslPayment.service");
// Generate unique order number
const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}${month}${day}-${random}`;
};
// Create order from frontend cart items
const createOrderFromCart = async (userId, payload) => {
    const { items, shippingAddressId, billingAddressId, customerNotes, shippingMethod = "STANDARD", paymentMethod = "SSL_COMMERZ" } = payload;
    if (!items || items.length === 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cart items are required");
    }
    return await prisma_1.prisma.$transaction(async (tx) => {
        /* --------------------------------
           1. Validate products & stock
        ----------------------------------*/
        for (const item of items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId }
            });
            if (!product) {
                throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Product not found`);
            }
            if (product.stock < item.quantity) {
                throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Insufficient stock for ${product.name}. Available: ${product.stock}`);
            }
        }
        /* --------------------------------
           2. Addresses
        ----------------------------------*/
        let shippingAddress = null;
        let billingAddress = null;
        if (shippingAddressId) {
            shippingAddress = await tx.address.findFirst({
                where: { id: shippingAddressId, userId }
            });
        }
        if (billingAddressId) {
            billingAddress = await tx.address.findFirst({
                where: { id: billingAddressId, userId }
            });
        }
        if (!billingAddress && shippingAddress) {
            billingAddress = shippingAddress;
        }
        /* --------------------------------
           3. Totals calculation
        ----------------------------------*/
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let shippingFee = 0;
        if (shippingMethod === "EXPRESS")
            shippingFee = 120;
        if (shippingMethod === "STANDARD")
            shippingFee = 60;
        const tax = subtotal * 0.05; // 5%
        const totalAmount = subtotal + shippingFee + tax;
        /* --------------------------------
           4. Create order
        ----------------------------------*/
        const order = await tx.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId,
                shippingAddressId: shippingAddress?.id || null,
                billingAddressId: billingAddress?.id || null,
                subtotal,
                shippingFee,
                tax,
                discount: 0,
                totalAmount,
                status: "PENDING",
                shippingMethod,
                customerNotes,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        product: item.product,
                        quantity: item.quantity,
                        price: item.price,
                        name: item.name
                    }))
                },
                payment: {
                    create: {
                        amount: totalAmount,
                        method: paymentMethod,
                        status: "PENDING",
                        transactionId: `PAY_${Date.now()}_${Math.random().toString(36).slice(2)}`
                    }
                }
            },
            include: {
                items: true,
                payment: true
            }
        });
        /* --------------------------------
           5. Update stock
        ----------------------------------*/
        for (const item of items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: { decrement: item.quantity },
                    totalOrders: { increment: 1 }
                }
            });
        }
        /* --------------------------------
           6. COD handling
        ----------------------------------*/
        if (paymentMethod === "CASH_ON_DELIVERY") {
            await tx.payment.update({
                where: { orderId: order.id },
                data: { status: "COMPLETED" }
            });
            await tx.order.update({
                where: { id: order.id },
                data: { status: "CONFIRMED" }
            });
        }
        return order;
    });
};
// Initialize SSL payment for an order
const initOrderPayment = async (orderId, userId) => {
    // Find order with relations
    const order = await prisma_1.prisma.order.findUnique({
        where: {
            id: orderId,
            userId: userId
        },
        include: {
            payment: true,
            user: true,
            items: {
                include: {
                    product: true
                }
            },
            shippingAddress: true,
            billingAddress: true
        }
    });
    if (!order) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Order not found");
    }
    if (!order.payment) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Payment record not found");
    }
    // Check if payment is already completed
    if (order.payment.status === 'COMPLETED') {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment already completed");
    }
    // Check if payment is pending
    if (order.payment.status !== 'PENDING') {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment cannot be initiated");
    }
    // Get address for SSL payload
    const address = order.shippingAddress || order.billingAddress;
    // Calculate product name for SSL payload
    const productNames = order.items.map(item => item.product.name);
    const mainProductName = productNames.length > 0
        ? productNames[0]
        : "E-commerce Products";
    const productCategory = productNames.length > 1
        ? `${mainProductName} & ${productNames.length - 1} more`
        : mainProductName;
    // Prepare SSLCommerz payload
    const sslPayload = {
        amount: order.payment.amount,
        transactionId: order.payment.transactionId,
        orderId: order.id,
        name: order.user.name || order.user.email.split("@")[0],
        email: order.user.email,
        phone: order.user.phone || "01700000000",
        address: address ? `${address.addressLine1}, ${address.city}` : "Not provided",
        city: address?.city || "Dhaka",
        state: address?.state || "Dhaka",
        postalCode: address?.postalCode || "1200",
        productName: mainProductName,
        productCategory: productCategory
    };
    // Initialize SSLCommerz payment
    let sslResponse;
    try {
        sslResponse = await (0, sslPayment_service_1.sslPaymentInit)(sslPayload);
        if (!sslResponse || sslResponse.status !== 'SUCCESS') {
            throw new Error(`SSLCommerz initialization failed: ${sslResponse?.failedreason || 'Unknown error'}`);
        }
    }
    catch (error) {
        console.error("SSL Payment Init Error:", error);
        // Update payment status to failed
        await prisma_1.prisma.payment.update({
            where: { id: order.payment.id },
            data: { status: 'FAILED' }
        });
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Payment initialization failed: ${error.message}`);
    }
    // Create SSL transaction record
    await prisma_1.prisma.sSLCommerzTransaction.create({
        data: {
            transactionId: order.payment.transactionId,
            orderId: order.id,
            amount: order.payment.amount,
            currency: "BDT",
            sessionKey: sslResponse.sessionkey,
            gatewayUrl: sslResponse.GatewayPageURL || sslResponse.redirectGatewayURL,
            status: 'INITIATED',
            cusName: order.user.name,
            cusEmail: order.user.email,
            cusPhone: order.user.phone,
            cusAddress: sslPayload.address
        }
    });
    return {
        success: true,
        message: "Payment initialized successfully",
        data: {
            paymentUrl: sslResponse.GatewayPageURL || sslResponse.redirectGatewayURL,
            transactionId: order.payment.transactionId,
            orderId: order.id,
            amount: order.payment.amount,
            currency: "BDT",
            orderNumber: order.orderNumber
        }
    };
};
// // Process successful payment callback
// const processSuccessfulPayment = async (transactionId: string, valId: string, bankTransaction: string) => {
//     return await prisma.$transaction(async (tx) => {
//         // 1. Find SSL transaction
//         const sslTransaction = await tx.sSLCommerzTransaction.findUnique({
//             where: { transactionId },
//             // include: {
//             //     order: {
//             //         include: {
//             //             payment: true
//             //         }
//             //     }
//             // }
//         });
//         if (!sslTransaction || !sslTransaction.order) {
//             throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");
//         }
//         // 2. Update SSL transaction
//         await tx.sSLCommerzTransaction.update({
//             where: { transactionId },
//             data: {
//                 status: "SUCCESS",
//                 valId,
//                 bankTransaction,
//                 updatedAt: new Date()
//             }
//         });
//         // 3. Update payment
//         await tx.payment.update({
//             where: { orderId: sslTransaction.orderId as string },
//             data: {
//                 status: "COMPLETED",
//                 valId,
//                 bankTransaction,
//                 updatedAt: new Date()
//             }
//         });
//         // 4. Update order status
//         await tx.order.update({
//             where: { id: sslTransaction.orderId as string },
//             data: {
//                 status: "CONFIRMED",
//                 updatedAt: new Date()
//             }
//         });
//         return {
//             success: true,
//             message: "Payment processed successfully",
//             orderId: sslTransaction.orderId
//         };
//     });
// };
exports.OrderPaymentService = {
    createOrderFromCart,
    initOrderPayment,
};
