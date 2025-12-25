
// creating product category

import { deleteFromCloudinary } from "../../config/deleteFromCloudinary"
import { Prisma } from "../../generated/client"
import { prisma } from "../../lib/prisma"

const createCategory = async (name: string) => {
  const existing = await prisma.category.findUnique({
    where: { name }
  })

  if (existing) {
    throw new Error("Category already exists")
  }

  return prisma.category.create({
    data: { name }
  })
}

const updateCategory = async (id: string, payload: Partial<Prisma.CategoryCreateInput>) => {

    const result = await prisma.category.update({
        where: { id },
        data: payload
    })

    return result
}


const getCategory = async () => {

    const result = await prisma.category.findMany({
      include:{
        products:{
          select:{
            productImages:true 
          }
        }
      }
    })

    return result
}
const deleteCategory = async (id: string) => {

    const result = await prisma.category.delete({
        where: { id }
    })

    return result
}



const createProduct = async (sellerId: string, payload: any) => {
  // Generate slug from title/name
  const baseSlug = payload.name.toLowerCase().split(" ").join("-");
  const uniqueSlug = await generateUniqueSlug(baseSlug);
  
  // Extract necessary fields
  const {
    name,
    description,
    price,
    stock,
    categoryId, // Changed from 'category' to 'categoryId'
    averageRating,
    reviewCount,
    totalOrders,
    isFeatured,
    productImages,
    metaTitle,
    metaDescription,
    weight,
    width,
    height,
    length,
    variants,
  } = payload;

  // Create product with proper relations
  const product = await prisma.product.create({
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
        create: productImages.map((img: any) => ({
          imageUrl: img.imageUrl,
          imageId: img.imageId,
        }))
      } : undefined,
      // Handle variants if provided
      variants: variants?.length ? {
        create: variants.map((variant: any) => ({
          color: variant.color || null,
          size: variant.size || null,
        }))
      } : undefined,
    },
    include: {
      productImages: true,
      variants: true,
      category: true,
      user: { // Changed from seller to user if using original schema
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
const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};



const updateProduct = async (
  productId: string,
  sellerId: string,
  payload: any
) => {
  const existingProduct = await prisma.product.findFirst({
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
  const updateData: any = {
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
    if (updateData[key] === undefined) delete updateData[key];
  });

 /** -----------------------------
 *  PRODUCT IMAGES (REPLACE MODE)
 * ----------------------------- */
if (payload.productImagesToAdd?.length) {
  // 1️⃣ Delete old images from Cloudinary
  for (const img of existingProduct.productImages) {
    try {
      await deleteFromCloudinary(img.imageId);
    } catch (err) {
      console.error("Cloudinary delete failed:", err);
    }
  }

  // 2️⃣ Replace DB images
  updateData.productImages = {
    deleteMany: {}, // delete ALL old images
    createMany: {
      data: payload.productImagesToAdd.map((img: any) => ({
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
        data: payload.variants.map((v: any) => ({
          color: v.color || null,
          size: v.size || null,
        })),
      },
    };
  }

  /** -----------------------------
   *  UPDATE
   * ----------------------------- */
  const updatedProduct = await prisma.product.update({
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






const getProduct = async ({
  page,
  limit,
  searchTerm,
  category,
  minPrice,
  maxPrice,
  orderBy = "asc",
  sortBy = "createdAt",
}: {
  page: number
  limit: number
  searchTerm?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  orderBy?: "asc" | "desc"
  sortBy?: "price" | "averageRating" | "createdAt" | "name"
}) => {
  const skip = (page - 1) * limit

  const where: any = {}

  // 🔍 Search by name
  if (searchTerm) {
    where.name = {
      contains: searchTerm,
      mode: "insensitive",
    }
  }

  // 🗂 Filter by category
  if (category) {
    where.category = {
      name: {
        contains: category,
        mode: "insensitive",
      },
    }
  }

  // 💰 Filter by price
  if (minPrice || maxPrice) {
    where.price = {}

    if (minPrice) {
      where.price.gte = minPrice
    }

    if (maxPrice) {
      where.price.lte = maxPrice
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      where,
      orderBy: {
        [sortBy]: orderBy,
      },
      include: {
        productImages: true,
        category: true,
      },
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}



const getSingleProduct = async (slug: string) => {
    const product = await prisma.product.findUniqueOrThrow({
        where: { slug },
        include:{
            productImages: true
        }
    })

    return product
}


const deleteProduct = async(id:string)=>{
    const product = await prisma.product.findFirstOrThrow({
        where:{id},
        include:{
            productImages:true
        }
    })


    if(product.productImages.length > 0){
        for(const image of product.productImages){
            try {
                await deleteFromCloudinary(image.imageId as string)
                console.log(image.imageId)
            } catch (error) {
                console.log(error)
            }
        }
    }


    for(const image of product.productImages){
        const imageId = image.imageId
        try {
            await deleteFromCloudinary(imageId as string)
        } catch (error) {
            console.log(error)
        }
    }


    await prisma.productImage.deleteMany({
        where:{productId:id}
    })


    const result = await prisma.product.delete({where:{id}})



    return result
}



export const productService = {
  createProduct,
  updateProduct,
  getProduct,
  deleteProduct,
  getSingleProduct,
  createCategory,
  updateCategory,
  getCategory,
  deleteCategory
}