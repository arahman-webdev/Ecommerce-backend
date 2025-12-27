import express from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/enums";
import { ProductWishlistController } from "./wishlist.controller";



const router = express.Router();

router.post(
  "/wishlist/add",
  checkAuth(UserRole.CUSTOMER),
  ProductWishlistController.addToWishlist
);


router.delete(
  "/remove/:productId",
  checkAuth(UserRole.CUSTOMER),
  ProductWishlistController.removeFromWishlist
);



router.get(
  "/my-wishlist",
  checkAuth(UserRole.CUSTOMER),
  ProductWishlistController.getWishlist
);


export const wishlistRouter=  router;