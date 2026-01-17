"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductReviewController = void 0;
const review_service_1 = require("./review.service");
const createReview = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const productId = req.params.productId;
        const { rating, comment } = req.body;
        const review = await review_service_1.ProductReviewService.createReview(productId, userId, Number(rating), comment);
        res.status(201).json({
            success: true,
            message: "Review submitted",
            data: review,
        });
    }
    catch (error) {
        next(error);
    }
};
const getProductReviews = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const reviews = await review_service_1.ProductReviewService.getReviewsByProduct(productId);
        res.status(200).json({
            success: true,
            data: reviews,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.ProductReviewController = {
    createReview,
    getProductReviews,
};
