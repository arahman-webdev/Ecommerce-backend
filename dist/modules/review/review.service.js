"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductReviewService = void 0;
const AppError_1 = __importDefault(require("../../helper/AppError"));
const prisma_1 = require("../../lib/prisma");
// ================= CREATE PRODUCT REVIEW =================
const createReview = async (productId, userId, rating, comment) => {
    // 1️⃣ Check user
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user)
        throw new AppError_1.default(404, "User not found");
    if (user.role !== "CUSTOMER") {
        throw new AppError_1.default(403, "Only customers can review products");
    }
    // 2️⃣ Check product exists
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: productId },
    });
    if (!product)
        throw new AppError_1.default(404, "Product not found");
    // 3️⃣ Check if user purchased this product
    const purchased = await prisma_1.prisma.orderItem.findFirst({
        where: {
            productId,
            order: {
                userId,
                status: "DELIVERED",
            },
        },
    });
    if (!purchased) {
        throw new AppError_1.default(403, "You can only review products you have purchased");
    }
    // 4️⃣ Check existing review
    const existingReview = await prisma_1.prisma.review.findFirst({
        where: { productId, userId },
    });
    if (existingReview) {
        throw new AppError_1.default(400, "You already reviewed this product");
    }
    // 5️⃣ Create review
    const review = await prisma_1.prisma.review.create({
        data: {
            productId,
            userId,
            rating,
            comment: comment?.trim(),
        },
        include: {
            user: {
                select: { name: true, profilePhoto: true },
            },
        },
    });
    // 6️⃣ Update product rating
    await updateProductRating(productId);
    return review;
};
// ================= UPDATE PRODUCT RATING =================
const updateProductRating = async (productId) => {
    const reviews = await prisma_1.prisma.review.findMany({
        where: { productId },
        select: { rating: true },
    });
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = total / reviews.length;
    await prisma_1.prisma.product.update({
        where: { id: productId },
        data: {
            averageRating: Number(average.toFixed(1)),
            reviewCount: reviews.length,
        },
    });
};
// ================= GET PRODUCT REVIEWS =================
const getReviewsByProduct = async (productId) => {
    return prisma_1.prisma.review.findMany({
        where: { productId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.ProductReviewService = {
    createReview,
    getReviewsByProduct,
};
