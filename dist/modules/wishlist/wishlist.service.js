"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductWishlistService = void 0;
const AppError_1 = __importDefault(require("../../helper/AppError"));
const prisma_1 = require("../../lib/prisma");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
// Add tour to wishlist
const addToWishlist = async (userId, productId) => {
    // Check tour exists
    const tour = await prisma_1.prisma.product.findUnique({ where: { id: productId } });
    if (!tour)
        throw new AppError_1.default(404, "Product not found");
    const isTourWishlist = await prisma_1.prisma.wishlist.findUnique({
        where: { id: productId }
    });
    if (isTourWishlist) {
        throw new AppError_1.default(http_status_codes_1.default.CONFLICT, "This tour is already added to favorite");
    }
    // Create wishlist entry
    const favorite = await prisma_1.prisma.wishlist.create({
        data: { userId, productId },
        include: { product: true },
    });
    return favorite;
};
// Remove from wishlist
const removeFromWishlist = async (userId, productId) => {
    const existing = await prisma_1.prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } },
    });
    if (!existing)
        throw new AppError_1.default(400, "Tour not in wishlist");
    await prisma_1.prisma.wishlist.delete({
        where: { userId_productId: { userId, productId } },
    });
    return { message: "Removed from wishlist" };
};
// Get all wishlist items
const getWishlist = async (userId) => {
    const items = await prisma_1.prisma.wishlist.findMany({
        where: { userId },
        include: {
            product: {
                include: {
                    productImages: true,
                    user: { select: { name: true, profilePhoto: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return items;
};
exports.ProductWishlistService = {
    addToWishlist,
    removeFromWishlist,
    getWishlist
};
