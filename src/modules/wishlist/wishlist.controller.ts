import { Request, Response, NextFunction } from "express";
import AppError from "../../helper/AppError";
import { ProductWishlistService } from "./wishlist.service";




  const addToWishlist = async (req: Request & { user?: any }, res: Response, next: NextFunction)=> {
    try {
      const userId = req.user.userId;
      const { productId } = req.body;

      if (!productId) throw new AppError(400, "ProductId is required");

      const result = await ProductWishlistService.addToWishlist(userId, productId);

      res.status(201).json({
        success: true,
        message: "Added to wishlist",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

 const removeFromWishlist = async (req: Request & { user?: any }, res: Response, next: NextFunction)=> {
    try {
      const userId = req.user.userId;
      const { productId } = req.params;

      const result = await ProductWishlistService.removeFromWishlist(userId, productId);

      res.status(200).json({
        success: true,
        message: "Removed from wishlist",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

 const getWishlist = async (req: Request & { user?: any }, res: Response, next: NextFunction)=> {
    try {
      const userId = req.user.userId;

      const result = await ProductWishlistService.getWishlist(userId);

      res.status(200).json({
        success: true,
        message: "Wishlist fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }




  export const ProductWishlitController ={
    addToWishlist,
    removeFromWishlist,
    getWishlist
  }