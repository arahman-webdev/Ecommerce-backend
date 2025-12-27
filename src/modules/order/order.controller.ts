import AppError from "../../helper/AppError";
import httpStatus from "http-status-codes"
import { OrderService } from "./order.service";
import {Request,Response, NextFunction } from "express";
// Get user orders
const getUserOrdersController = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "User authentication required");
        }

        const orders = await OrderService.getUserOrders(userId);

        res.status(httpStatus.OK).json({
            success: true,
            message: "Orders fetched successfully",
            data: orders
        });

    } catch (error) {
        next(error);
    }
};


// Get order by ID
const getOrderByIdController = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.id;
        const userId = req.user?.id;

        if (!orderId) {
            throw new AppError(httpStatus.BAD_REQUEST, "Order ID is required");
        }

        if (!userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "User authentication required");
        }

        const order = await OrderService.getOrderById(orderId, userId);

        res.status(httpStatus.OK).json({
            success: true,
            message: "Order fetched successfully",
            data: order
        });

    } catch (error) {
        next(error);
    }
};



const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookings = await OrderService.getAllOrders();

        res.status(200).json({
            success: true,
            message: "All orders retrieved successfully",
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
}

const deleteOrder = async (
  req: Request & { user?: { userId: string; userRole: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id;
    const user = req.user;

    if (!user) throw new AppError(401, "Unauthorized");

    const result = await OrderService.deleteOrder(productId, {
      id: user.userId,
      userRole: user.userRole,
    });

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// for seller

const getMyProductOrders = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.user.userId; // from auth middleware

    const orders = await OrderService.getSellerOrders(sellerId);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const OrderController = {
    getUserOrdersController,
    getOrderByIdController,
    getAllOrders,
    deleteOrder,
    getMyProductOrders

};