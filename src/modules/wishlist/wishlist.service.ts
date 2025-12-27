import AppError from "../../helper/AppError";
import { prisma } from "../../lib/prisma";
import statusCode from "http-status-codes";

const addToWishlist = async (userId: string, productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    throw new AppError(
      statusCode.CONFLICT,
      "Product already in wishlist"
    );
  }

  return prisma.wishlist.create({
    data: { userId, productId },
    include: {
      product: {
        include: {
          productImages: true,
        },
      },
    },
  });
};

const removeFromWishlist = async (userId: string, productId: string) => {
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (!existing) {
    throw new AppError(400, "Product not in wishlist");
  }

  await prisma.wishlist.delete({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  return { message: "Removed from wishlist" };
};

const getWishlist = async (userId: string) => {
  return prisma.wishlist.findMany({
    where: {
      userId,
      product: {
        isActive: true, // ✅ only active products
      },
    },
    include: {
      product: {
        include: {
          productImages: true,
          user: {
            select: {
              name: true,
              profilePhoto: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};


export const ProductWishlistService = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
