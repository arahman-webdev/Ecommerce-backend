"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = void 0;
const cart_service_1 = require("./cart.service");
const createCart = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items must be an array",
            });
        }
        for (const item of items) {
            await cart_service_1.cartService.createCart({
                userId,
                productId: item.productId,
                quantity: item.quantity,
            });
        }
        const cart = await cart_service_1.cartService.getUserCart(userId);
        res.status(200).json({
            success: true,
            message: "Cart merged successfully",
            data: cart,
        });
    }
    catch (error) {
        next(error);
    }
};
const getCart = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await cart_service_1.cartService.getUserCart(userId);
        res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cartController = {
    createCart,
    getCart
};
