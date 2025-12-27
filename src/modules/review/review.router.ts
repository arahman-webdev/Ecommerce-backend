import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { ProductReviewController } from "./review.controller";


const router = express.Router();

// Create product review
router.post(
  "/review/:productId",
  checkAuth(UserRole.CUSTOMER),
  ProductReviewController.createReview
);

// Get product reviews
router.get(
  "/review/:productId",
  ProductReviewController.getProductReviews
);

export const productReviewRoutes = router;
