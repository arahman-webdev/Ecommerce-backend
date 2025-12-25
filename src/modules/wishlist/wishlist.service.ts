import AppError from "../../helper/AppError";
import { prisma } from "../../lib/prisma";
import statusCode from "http-status-codes"


    // Add tour to wishlist
  const addToWishlist =  async (userId: string, productId: string)=> {
        // Check tour exists
        const tour = await prisma.product.findUnique({ where: { id: productId } });
        if (!tour) throw new AppError(404, "Product not found");

        const isTourWishlist = await prisma.wishlist.findUnique({
            where:{id:productId}
        })

        if(isTourWishlist){
            throw new AppError(statusCode.CONFLICT, "This tour is already added to favorite")
        }

        // Create wishlist entry
        const favorite = await prisma.wishlist.create({
            data: { userId, productId },
            include: { product: true },
        });

        return favorite;
    }

    // Remove from wishlist
   const removeFromWishlist=  async (userId: string, productId: string)=> {
        const existing = await prisma.wishlist.findUnique({
            where: { userId_productId: { userId, productId } },
        });

        if (!existing) throw new AppError(400, "Tour not in wishlist");

        await prisma.wishlist.delete({
            where: { userId_productId: { userId, productId } },
        });

        return { message: "Removed from wishlist" };
    }

    // Get all wishlist items
 const getWishlist = async (userId: string)=> {
        const items = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        productImages: true,
                        user: { select: { name: true, profilePhoto: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return items;
    }


export const ProductWishlistService = {
    addToWishlist,
    removeFromWishlist,
    getWishlist
}