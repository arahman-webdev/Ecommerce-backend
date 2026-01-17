"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductWishlistController = void 0;
const AppError_1 = __importDefault(require("../../helper/AppError"));
const wishlist_service_1 = require("./wishlist.service");
const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;
        if (!productId) {
            throw new AppError_1.default(400, "ProductId is required");
        }
        const result = await wishlist_service_1.ProductWishlistService.addToWishlist(userId, productId);
        res.status(201).json({
            success: true,
            message: "Added to wishlist",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;
        const result = await wishlist_service_1.ProductWishlistService.removeFromWishlist(userId, productId);
        res.status(200).json({
            success: true,
            message: "Removed from wishlist",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await wishlist_service_1.ProductWishlistService.getWishlist(userId);
        res.status(200).json({
            success: true,
            message: "Wishlist fetched successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.ProductWishlistController = {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
};
