// cart.controller.ts
import { NextFunction, Request, Response } from "express";
import { cartService } from "./cart.service";

const createCart = async (
  req: Request & { user: any },
  res: Response,
  next: NextFunction
) => {
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
      await cartService.createCart({
        userId,
        productId: item.productId,
        quantity: item.quantity,

      });
    }

    const cart = await cartService.getUserCart(userId);

    res.status(200).json({
      success: true,
      message: "Cart merged successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const getCart = async (
  req: Request & { user: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.userId;

    const result = await cartService.getUserCart(userId);

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuantity = async (req: Request & { user: any }, res: Response, next: NextFunction) => {
  const userId = req.user.userId;
  const { productId, quantity } = req.body;

  await cartService.updateQuantity(userId, productId, quantity);
  res.status(200).json({
    success: true,
    message: "Cart quantity updated successfully",
    
  });

};

export const cartController = {
  createCart,
  getCart,
  updateQuantity
};
