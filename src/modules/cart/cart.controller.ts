// cart.controller.ts
import { Request, Response } from "express";
import { cartService } from "./cart.service";

const createCart = async (req: Request & {user:any}, res: Response) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    const cart = await cartService.createCart({
      userId,
      productId,
      quantity,
    });

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cartController = {
  createCart,
};
