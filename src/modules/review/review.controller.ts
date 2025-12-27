import { Request, Response, NextFunction } from "express";
import { ProductReviewService } from "./review.service";


const createReview = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.productId;
    const { rating, comment } = req.body;

    const review = await ProductReviewService.createReview(
      productId,
      userId,
      Number(rating),
      comment
    );

    res.status(201).json({
      success: true,
      message: "Review submitted",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.productId;

    const reviews =
      await ProductReviewService.getReviewsByProduct(productId);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const ProductReviewController = {
  createReview,
  getProductReviews,
};
