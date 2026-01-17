"use strict";
// creating product category
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const deleteFromCloudinary_1 = require("../../config/deleteFromCloudinary");
const client_1 = require("../../generated/client");
const AppError_1 = __importDefault(require("../../helper/AppError"));
const prisma_1 = require("../../lib/prisma");
const createCategory = async (name) => {
    const existing = await prisma_1.prisma.category.findUnique({
        where: { name }
    });
    if (existing) {
        throw new Error("Category already exists");
    }
    return prisma_1.prisma.category.create({
        data: { name }
    });
};
const updateCategory = async (id, payload) => {
    const result = await prisma_1.prisma.category.update({
        where: { id },
        data: payload
    });
    return result;
};
const getCategory = async () => {
    const categories = await prisma_1.prisma.category.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    products: true,
                },
            },
            products: {
                take: 1, // 👈 only ONE product
                orderBy: {
                    createdAt: 'desc', // latest product (or popular later)
                },
                select: {
                    productImages: {
                        take: 1, // 👈 only ONE image
                        select: {
                            imageUrl: true,
                        },
                    },
                },
            },
        },
    });
    return categories.map(category => ({
        id: category.id,
        name: category.name,
        productCount: category._count.products,
        image: category.products[0]?.productImages[0]?.imageUrl || null,
    }));
};
const deleteCategory = async (id) => {
    const result = await prisma_1.prisma.category.delete({
        where: { id }
    });
    return result;
};
const createProduct = async (sellerId, payload) => {
    // Generate slug from title/name
    const baseSlug = payload.name.toLowerCase().split(" ").join("-");
    const uniqueSlug = await generateUniqueSlug(baseSlug);
    // Extract necessary fields
    const { name, description, price, stock, categoryId, // Changed from 'category' to 'categoryId'
    averageRating, reviewCount, totalOrders, isFeatured, productImages, metaTitle, metaDescription, weight, width, height, length, variants, } = payload;
    // Create product with proper relations
    const product = await prisma_1.prisma.product.create({
        data: {
            name,
            slug: uniqueSlug,
            description,
            price: Number(price), // Ensure it's a number
            stock: Number(stock) || 0,
            categoryId: categoryId || null, // Set category relation
            averageRating: averageRating ? Number(averageRating) : 0,
            reviewCount: reviewCount ? Number(reviewCount) : 0,
            totalOrders: totalOrders ? Number(totalOrders) : 0,
            isFeatured: Boolean(isFeatured),
            isActive: true,
            userId: sellerId, // Use userId if your field is userId (original schema)
            metaTitle,
            metaDescription,
            weight: weight ? Number(weight) : null,
            width: width ? Number(width) : null,
            height: height ? Number(height) : null,
            length: length ? Number(length) : null,
            // Handle product images if provided
            productImages: productImages?.length ? {
                create: productImages.map((img) => ({
                    imageUrl: img.imageUrl,
                    imageId: img.imageId,
                }))
            } : undefined,
            // Handle variants if provided
            variants: variants?.length ? {
                create: variants.map((variant) => ({
                    color: variant.color || null,
                    size: variant.size || null,
                }))
            } : undefined,
        },
        include: {
            productImages: true,
            variants: true,
            category: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true
                },
            },
        },
    });
    return product;
};
// Helper function to generate unique slug
const generateUniqueSlug = async (baseSlug) => {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = await prisma_1.prisma.product.findUnique({
            where: { slug },
        });
        if (!existing) {
            return slug;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
};
const updateProduct = async (productId, sellerId, payload) => {
    const existingProduct = await prisma_1.prisma.product.findFirst({
        where: {
            id: productId,
            userId: sellerId, // ✅ FIXED (was userId ❌)
        },
        include: {
            productImages: true,
        },
    });
    if (!existingProduct) {
        throw new Error("Product not found or unauthorized");
    }
    // Handle slug
    let slug = existingProduct.slug;
    if (payload.name && payload.name !== existingProduct.name) {
        const baseSlug = payload.name.toLowerCase().split(" ").join("-");
        slug = await generateUniqueSlug(baseSlug);
    }
    /** -----------------------------
     *  BASE UPDATE DATA
     * ----------------------------- */
    const updateData = {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        isFeatured: payload.isFeatured,
        isActive: payload.isActive,
        metaTitle: payload.metaTitle,
        metaDescription: payload.metaDescription,
        weight: payload.weight,
        width: payload.width,
        height: payload.height,
        length: payload.length,
        slug,
    };
    // Remove undefined
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined)
            delete updateData[key];
    });
    /** -----------------------------
    *  PRODUCT IMAGES (REPLACE MODE)
    * ----------------------------- */
    if (payload.productImagesToAdd?.length) {
        // 1️⃣ Delete old images from Cloudinary
        for (const img of existingProduct.productImages) {
            try {
                await (0, deleteFromCloudinary_1.deleteFromCloudinary)(img.imageId);
            }
            catch (err) {
                console.error("Cloudinary delete failed:", err);
            }
        }
        // 2️⃣ Replace DB images
        updateData.productImages = {
            deleteMany: {}, // delete ALL old images
            createMany: {
                data: payload.productImagesToAdd.map((img) => ({
                    imageUrl: img.imageUrl,
                    imageId: img.imageId,
                })),
            },
        };
    }
    /** -----------------------------
     *  VARIANTS
     * ----------------------------- */
    if (payload.variants) {
        updateData.variants = {
            deleteMany: {},
            createMany: {
                data: payload.variants.map((v) => ({
                    color: v.color || null,
                    size: v.size || null,
                })),
            },
        };
    }
    /** -----------------------------
     *  UPDATE
     * ----------------------------- */
    const updatedProduct = await prisma_1.prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
            productImages: true,
            variants: true,
            category: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                },
            },
        },
    });
    return updatedProduct;
};
const getProduct = async ({ page, limit, searchTerm, category, minPrice, maxPrice, orderBy = "asc", sortBy = "createdAt", isFeatured, // ✅ NEW
 }) => {
    const skip = (page - 1) * limit;
    const where = {};
    // 🔍 Search by name
    if (searchTerm) {
        where.name = {
            contains: searchTerm,
            mode: "insensitive",
        };
    }
    // 🗂 Filter by category
    if (category) {
        where.category = {
            name: {
                contains: category,
                mode: "insensitive",
            },
        };
    }
    // 💰 Filter by price
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
            where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
            where.price.lte = maxPrice;
        }
    }
    // ⭐ Filter by featured products
    if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
    }
    const [products, total] = await Promise.all([
        prisma_1.prisma.product.findMany({
            skip,
            take: limit,
            where,
            orderBy: {
                [sortBy]: orderBy,
            },
            include: {
                user: { select: { name: true, profilePhoto: true, email: true } },
                productImages: true,
                category: true,
            },
        }),
        prisma_1.prisma.product.count({ where }),
    ]);
    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
const getSingleProduct = async (slug) => {
    const product = await prisma_1.prisma.product.findUniqueOrThrow({
        where: { slug },
        include: {
            productImages: true,
            category: true
        }
    });
    return product;
};
const deleteProduct = async (productId, requester) => {
    const tour = await prisma_1.prisma.product.findUnique({
        where: { id: productId },
        include: { productImages: true }
    });
    if (!tour)
        throw new AppError_1.default(404, "Product not found");
    // ROLE BASED ACCESS
    const isOwner = tour.userId === requester.id;
    const isAdmin = requester.userRole === client_1.UserRole.ADMIN;
    console.log("request role", requester.userRole);
    if (!isOwner && !isAdmin) {
        throw new AppError_1.default(403, "You are not allowed to delete this tour");
    }
    // delete cloudinary images
    for (const image of tour.productImages) {
        try {
            await (0, deleteFromCloudinary_1.deleteFromCloudinary)(image.imageId);
        }
        catch { }
    }
    await prisma_1.prisma.review.deleteMany({ where: { productId } });
    await prisma_1.prisma.wishlist.deleteMany({ where: { productId } });
    await prisma_1.prisma.orderItem.deleteMany({ where: { productId } });
    await prisma_1.prisma.productImage.deleteMany({ where: { productId } });
    return prisma_1.prisma.product.delete({ where: { id: productId } });
};
const getMyProducts = async (productId) => {
    const product = await prisma_1.prisma.product.findMany({
        where: { userId: productId },
        include: {
            productImages: true,
            user: true,
            orderItems: true,
            category: true
        },
        orderBy: { createdAt: "desc" }
    });
    return product;
};
const togglePorductStatus = async (productId, requester) => {
    const product = await prisma_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new AppError_1.default(404, "Tour not found");
    console.log("request role", product.userId);
    console.log("request role", requester.id);
    const isOwner = product.userId === requester.id;
    const isAdmin = requester.userRole === client_1.UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
        throw new AppError_1.default(403, "You are not allowed to update this tour");
    }
    const newStatus = product.isActive === true ? false : true;
    const updatedProduct = await prisma_1.prisma.product.update({
        where: { id: productId },
        data: { isActive: newStatus },
    });
    return updatedProduct;
};
exports.productService = {
    createProduct,
    updateProduct,
    getProduct,
    deleteProduct,
    getSingleProduct,
    getMyProducts,
    togglePorductStatus,
    createCategory,
    updateCategory,
    getCategory,
    deleteCategory
};
