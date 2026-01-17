"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productReviewRoutes = void 0;
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const enums_1 = require("../../generated/enums");
const review_controller_1 = require("./review.controller");
const router = express_1.default.Router();
// Create product review
router.post("/review/:productId", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), review_controller_1.ProductReviewController.createReview);
// Get product reviews
router.get("/review/:productId", review_controller_1.ProductReviewController.getProductReviews);
exports.productReviewRoutes = router;
