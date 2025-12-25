import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { ProductWishlitController } from "./wishlist.controller";



const router = express.Router();

router.post(
  "/wishlist/add",
  checkAuth(UserRole.CUSTOMER),
  ProductWishlitController.addToWishlist
);

router.delete(
  "/wishlist/remove/:productId",
  checkAuth(UserRole.CUSTOMER),
  ProductWishlitController.removeFromWishlist
);

router.get(
  "/my-wishlist",
  checkAuth(UserRole.CUSTOMER),
  ProductWishlitController.getWishlist
);

export const wishlistRouter=  router;