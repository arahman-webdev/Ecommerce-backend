"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistRouter = void 0;
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const enums_1 = require("../../generated/enums");
const wishlist_controller_1 = require("./wishlist.controller");
const router = express_1.default.Router();
router.post("/wishlist/add", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), wishlist_controller_1.ProductWishlistController.addToWishlist);
router.delete("/remove/:productId", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), wishlist_controller_1.ProductWishlistController.removeFromWishlist);
router.get("/my-wishlist", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), wishlist_controller_1.ProductWishlistController.getWishlist);
exports.wishlistRouter = router;
