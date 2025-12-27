import AppError from "../../helper/AppError";
import { prisma } from "../../lib/prisma";

// ================= CREATE PRODUCT REVIEW =================
const createReview = async (
  productId: string,
  userId: string,
  rating: number,
  comment?: string
) => {
  // 1️⃣ Check user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new AppError(404, "User not found");
  if (user.role !== "CUSTOMER") {
    throw new AppError(403, "Only customers can review products");
  }

  // 2️⃣ Check product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new AppError(404, "Product not found");

  // 3️⃣ Check if user purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: "DELIVERED",
      },
    },
  });

  if (!purchased) {
    throw new AppError(
      403,
      "You can only review products you have purchased"
    );
  }

  // 4️⃣ Check existing review
  const existingReview = await prisma.review.findFirst({
    where: { productId, userId },
  });

  if (existingReview) {
    throw new AppError(400, "You already reviewed this product");
  }

  // 5️⃣ Create review
  const review = await prisma.review.create({
    data: {
      productId,
      userId,
      rating,
      comment: comment?.trim(),
    },
    include: {
      user: {
        select: { name: true, profilePhoto: true },
      },
    },
  });

  // 6️⃣ Update product rating
  await updateProductRating(productId);

  return review;
};

// ================= UPDATE PRODUCT RATING =================
const updateProductRating = async (productId: string) => {
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = total / reviews.length;

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: Number(average.toFixed(1)),
      reviewCount: reviews.length,
    },
  });
};

// ================= GET PRODUCT REVIEWS =================
const getReviewsByProduct = async (productId: string) => {
  return prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const ProductReviewService = {
  createReview,
  getReviewsByProduct,
};
