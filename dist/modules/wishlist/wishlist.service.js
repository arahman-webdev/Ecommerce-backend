"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductWishlistService = void 0;
const AppError_1 = __importDefault(require("../../helper/AppError"));
const prisma_1 = require("../../lib/prisma");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const addToWishlist = async (userId, productId) => {
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: productId },
    });
    if (!product) {
        throw new AppError_1.default(404, "Product not found");
    }
    const existing = await prisma_1.prisma.wishlist.findUnique({
        where: {
            userId_productId: {
                userId,
                productId,
            },
        },
    });
    if (existing) {
        throw new AppError_1.default(http_status_codes_1.default.CONFLICT, "Product already in wishlist");
    }
    return prisma_1.prisma.wishlist.create({
        data: { userId, productId },
        include: {
            product: {
                include: {
                    productImages: true,
                },
            },
        },
    });
};
const removeFromWishlist = async (userId, productId) => {
    const existing = await prisma_1.prisma.wishlist.findUnique({
        where: {
            userId_productId: {
                userId,
                productId,
            },
        },
    });
    if (!existing) {
        throw new AppError_1.default(400, "Product not in wishlist");
    }
    await prisma_1.prisma.wishlist.delete({
        where: {
            userId_productId: {
                userId,
                productId,
            },
        },
    });
    return { message: "Removed from wishlist" };
};
const getWishlist = async (userId) => {
    return prisma_1.prisma.wishlist.findMany({
        where: {
            userId,
            product: {
                isActive: true, // ✅ only active products
            },
        },
        include: {
            product: {
                include: {
                    productImages: true,
                    user: {
                        select: {
                            name: true,
                            profilePhoto: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.ProductWishlistService = {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
};
