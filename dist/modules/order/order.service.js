"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const enums_1 = require("../../generated/enums");
const AppError_1 = __importDefault(require("../../helper/AppError"));
const prisma_1 = require("../../lib/prisma");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
// Get user orders
const getUserOrders = async (userId) => {
    return await prisma_1.prisma.order.findMany({
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
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
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
const getOrderById = async (orderId, userId) => {
    const order = await prisma_1.prisma.order.findUnique({
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
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Order not found");
    }
    // Check if user owns this order or is admin
    if (order.userId !== userId) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Access denied");
    }
    return order;
};
const getAllOrders = async () => {
    return prisma_1.prisma.order.findMany({
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            productImages: true
                        }
                    },
                }
            },
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            payment: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
const deleteOrder = async (productId, requester) => {
    // find booking with tour + guide
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: productId },
        include: {
            items: {
                include: {
                    product: true
                }
            },
            user: true
        },
    });
    if (!order) {
        throw new AppError_1.default(404, "Order not found");
    }
    // Permission Check
    const isOwnerGuide = order.items[0]?.product.userId === requester.id;
    const isAdmin = requester.userRole === enums_1.UserRole.ADMIN;
    if (!isOwnerGuide && !isAdmin) {
        throw new AppError_1.default(403, "You are not allowed to delete this booking");
    }
    // delete booking
    const deleted = await prisma_1.prisma.order.delete({
        where: { id: productId },
    });
    return deleted;
};
// get order for seller
const getSellerOrders = async (userId) => {
    console.log("forn seller", userId);
    const orders = await prisma_1.prisma.order.findMany({
        where: {
            items: {
                some: {
                    product: {
                        userId: userId, // ✅ seller owns the product
                    },
                },
            },
        },
        include: {
            items: {
                where: {
                    product: {
                        userId: userId, // ✅ only seller’s items
                    },
                },
                include: {
                    product: {
                        include: {
                            productImages: true,
                        },
                    },
                    variant: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            payment: true,
            shippingAddress: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return orders;
};
const updateOrderStatus = async (orderId, status) => {
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
    });
    if (!order) {
        throw new AppError_1.default(404, "Order not found");
    }
    const current = order.status;
    // No change
    if (current === status)
        return order;
    // Final states
    if (current === "DELIVERED" || current === "CANCELLED") {
        throw new AppError_1.default(400, "Order status cannot be updated");
    }
    // PENDING rules
    if (current === "PENDING") {
        if (!["PROCESSING", "CANCELLED"].includes(status)) {
            throw new AppError_1.default(400, "Pending orders can go to PROCESSING or CANCELLED");
        }
    }
    // PROCESSING rules
    if (current === "PROCESSING") {
        if (!["SHIPPED", "CANCELLED"].includes(status)) {
            throw new AppError_1.default(400, "Processing orders can go to SHIPPED or CANCELLED");
        }
    }
    // SHIPPED rules
    if (current === "SHIPPED") {
        if (status !== "DELIVERED") {
            throw new AppError_1.default(400, "Shipped orders can only be DELIVERED");
        }
    }
    return prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status },
    });
};
exports.OrderService = {
    getAllOrders,
    deleteOrder,
    getUserOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus
};
