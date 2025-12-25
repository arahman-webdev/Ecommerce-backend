import httpStatus from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../helper/AppError";
import { sslPaymentInit } from "../sslPayment/sslPayment.service";

// Generate unique order number
const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}${month}${day}-${random}`;
};

// Create order from cart
const createOrderFromCart = async (userId: string, payload: any) => {
    const { 
        shippingAddressId, 
        billingAddressId, 
        customerNotes, 
        shippingMethod,
        paymentMethod 
    } = payload;

    return await prisma.$transaction(async (tx) => {
        // 1. Get user cart with items
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                        cart: true
                    }
                }
            }
        });

        if (!cart || cart.items.length === 0) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cart is empty");
        }

        // 2. Validate products stock
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                throw new AppError(httpStatus.BAD_REQUEST, 
                    `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`);
            }
        }

        // 3. Get address details
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

        // Use shipping address as billing address if not provided
        if (!billingAddress && shippingAddress) {
            billingAddress = shippingAddress;
        }

        // 4. Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        // Shipping calculation
        let shippingFee = 0;
        if (shippingMethod === 'EXPRESS') {
            shippingFee = 120;
        } else if (shippingMethod === 'STANDARD') {
            shippingFee = 60;
        } else if (shippingMethod === 'FREE') {
            shippingFee = 0;
        }

        const tax = subtotal * 0.05; // 5% tax for Bangladesh
        const totalAmount = subtotal + shippingFee + tax;

        // 5. Create order
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
                shippingMethod: shippingMethod || "STANDARD",
                customerNotes,
                items: {
                    create: cart.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.product.price,
                        name: item.product.name,
                        // Add variant support if needed
                    }))
                },
                payment: {
                    create: {
                        amount: totalAmount,
                        method: paymentMethod || "SSL_COMMERZ",
                        status: "PENDING",
                        transactionId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    }
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: true,
                payment: true,
                shippingAddress: true,
                billingAddress: true
            }
        });

        // 6. Update product stock and order counts
        for (const item of cart.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: { decrement: item.quantity },
                    totalOrders: { increment: 1 }
                }
            });
        }

        // 7. Clear cart
        await tx.cartItem.deleteMany({
            where: { cartId: cart.id }
        });

        // 8. If payment method is not online, mark as confirmed
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
const initOrderPayment = async (orderId: string, userId: string) => {
    // Find order with relations
    const order = await prisma.order.findUnique({
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
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (!order.payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    // Check if payment is already completed
    if (order.payment.status === 'COMPLETED') {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment already completed");
    }

    // Check if payment is pending
    if (order.payment.status !== 'PENDING') {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment cannot be initiated");
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
    const sslPayload: any = {
        amount: order.payment.amount,
        transactionId: order.payment.transactionId as string,
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
        sslResponse = await sslPaymentInit(sslPayload);
        
        if (!sslResponse || sslResponse.status !== 'SUCCESS') {
            throw new Error(`SSLCommerz initialization failed: ${sslResponse?.failedreason || 'Unknown error'}`);
        }

    } catch (error: any) {
        console.error("SSL Payment Init Error:", error);
        
        // Update payment status to failed
        await prisma.payment.update({
            where: { id: order.payment.id },
            data: { status: 'FAILED' }
        });

        throw new AppError(httpStatus.BAD_REQUEST, `Payment initialization failed: ${error.message}`);
    }

    // Create SSL transaction record
    await prisma.sSLCommerzTransaction.create({
        data: {
            transactionId: order.payment.transactionId as string,
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

// Get user orders
const getUserOrders = async (userId: string) => {
    return await prisma.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            productImages: true
                        }
                    },
                    variant: true
                }
            },
            payment: true,
            shippingAddress: true,
            billingAddress: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

// Get order by ID
const getOrderById = async (orderId: string, userId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            productImages: true
                        }
                    },
                    variant: true
                }
            },
            payment: true,
            shippingAddress: true,
            billingAddress: true,
            user: true
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Check if user owns this order or is admin
    if (order.userId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    return order;
};

export const OrderPaymentService = {
    createOrderFromCart,
    initOrderPayment,
    // processSuccessfulPayment,
    getUserOrders,
    getOrderById
};