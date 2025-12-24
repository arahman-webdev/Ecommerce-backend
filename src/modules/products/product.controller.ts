import { NextFunction, Request, Response } from "express";
import { productService } from "./product.service";
import { uploadToCloudinary } from "../../config/uploadToCloudinary";
import HTTP_STATUS from "http-status-codes"
// Creating product category

const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      })
    }

    const result = await productService.createCategory(name)

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result
    })
  } catch (err) {
    next(err)
  }
}


const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.updateCategory(req.params.id, req.body)

        res.status(201).json({
            success: true,
            message: "Updated Successfully",
            data: result
        })
    } catch (err) {
        console.log(err)
        next(err)
    }
}


const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.deleteCategory(req.params.id)

        res.status(201).json({
            success: true,
            message: "Deleted Successfully",
            data: result
        })
    } catch (err) {
        console.log(err)
        next(err)
    }
}
const getCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.getCategory()

        res.status(201).json({
            success: true,
            message: "Retrived Successfully",
            data: result
        })
    } catch (err) {
        console.log(err)
        next(err)
    }
}



const createProduct = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user.userId;
    const data = JSON.parse(req.body.data);

    // Upload images
    const images: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const uploaded = await uploadToCloudinary(file.buffer, "product-images");
          images.push({
            imageUrl: uploaded.secure_url,
            imageId: uploaded.public_id,
          });
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }
    }

    // Handle variants from frontend
    let variants = [];
    if (data.variants && typeof data.variants === 'string') {
      try {
        variants = JSON.parse(data.variants);
      } catch (e) {
        variants = [];
      }
    } else if (Array.isArray(data.variants)) {
      variants = data.variants;
    }

    // Build payload for service
    const payload = {
      ...data,
      name: data.name || data.title, // Support both name and title
      price: Number(data.price || data.fee || 0),
      stock: Number(data.stock || 0),
      categoryId: data.categoryId || data.category, // Accept both
      averageRating: data.averageRating ? Number(data.averageRating) : 0,
      reviewCount: data.reviewCount ? Number(data.reviewCount) : 0,
      totalOrders: data.totalOrders ? Number(data.totalOrders) : 0,
      isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
      weight: data.weight ? Number(data.weight) : null,
      width: data.width ? Number(data.width) : null,
      height: data.height ? Number(data.height) : null,
      length: data.length ? Number(data.length) : null,
      metaTitle: data.metaTitle || data.name || data.title,
      metaDescription: data.metaDescription || data.description?.substring(0, 160),
      productImages: images.length ? images : undefined,
      variants: variants.length ? variants : undefined,
    };

    // Remove undefined fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const result = await productService.createProduct(sellerId, payload);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Product creation error:", error);
    
    // Handle Prisma unique constraint error (duplicate slug)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A product with similar details already exists",
      });
    }
    
    next(error);
  }
};

// Update product
const updateProduct = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user.userId;
    const productId = req.params.id;
    
    // Parse form data
    const data = req.body.data ? JSON.parse(req.body.data) : {};
    
    // Handle new image uploads
    const newImages: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const uploaded = await uploadToCloudinary(file.buffer, "product-images");
          newImages.push({
            imageUrl: uploaded.secure_url,
            imageId: uploaded.public_id,
          });
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }
    }

    // Parse variants if provided
    let variants = [];
    if (data.variants) {
      try {
        variants = typeof data.variants === 'string' 
          ? JSON.parse(data.variants) 
          : data.variants;
      } catch (e) {
        variants = [];
      }
    }

    // Parse images to delete
    let imagesToDelete: string[] = [];
    if (data.imagesToDelete) {
      try {
        imagesToDelete = typeof data.imagesToDelete === 'string'
          ? JSON.parse(data.imagesToDelete)
          : data.imagesToDelete;
      } catch (e) {
        imagesToDelete = [];
      }
    }

    // Build payload
    const payload = {
      ...data,
      // Convert numeric fields
      price: data.price ? Number(data.price) : undefined,
      stock: data.stock ? Number(data.stock) : undefined,
      averageRating: data.averageRating ? Number(data.averageRating) : undefined,
      reviewCount: data.reviewCount ? Number(data.reviewCount) : undefined,
      totalOrders: data.totalOrders ? Number(data.totalOrders) : undefined,
      
      // Handle dimensions
      weight: data.weight !== undefined ? (data.weight ? Number(data.weight) : null) : undefined,
      width: data.width !== undefined ? (data.width ? Number(data.width) : null) : undefined,
      height: data.height !== undefined ? (data.height ? Number(data.height) : null) : undefined,
      length: data.length !== undefined ? (data.length ? Number(data.length) : null) : undefined,
      
      // Handle images
      productImagesToAdd: newImages.length > 0 ? newImages : undefined,
      productImagesToDelete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
      
      // Handle variants
      variants: variants.length > 0 ? variants : undefined,
    };

    // Remove undefined fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const result = await productService.updateProduct(productId, sellerId, payload);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Product update error:", error);
    
    if (error.message === 'Product not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A product with similar details already exists",
      });
    }
    
    next(error);
  }
};

const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const searchTerm = req.query.searchTerm as string
    const category = req.query.category as string
    const sortBy = req.query.sortBy as any
    const orderBy = req.query.orderBy as any

    // 💰 Price filters
    const minPrice = req.query.minPrice
      ? Number(req.query.minPrice)
      : undefined

    const maxPrice = req.query.maxPrice
      ? Number(req.query.maxPrice)
      : undefined

    const result = await productService.getProduct({
      page,
      limit,
      searchTerm,
      category,
      minPrice,
      maxPrice,
      sortBy,
      orderBy,
    })

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}



const getSingleProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.getSingleProduct(req.params.slug)
        console.log(result)
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Product retrieved successfully",
            data: result,
        })
    } catch (error) {
        next(error)
    }
}


const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.deleteProduct(req.params.id)
        console.log(result)
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Product deleted successfully",
            data: result,
        })
    } catch (error) {
        next(error)
    }
}

export const productController = {
    createProduct,
    updateProduct,
    getProduct,
    getSingleProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory
}