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

const getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 2
        const searchTerm = (req.query.searchTerm as string) || ""
        const category = (req.query.category as string) || ""
        const sortBy = (req.query.sortBy as string)
        const orderBy = (req.query.orderBy as string)

        console.log("from controller.....", orderBy, sortBy)

        const result = await productService.getProduct({ page, limit, searchTerm, category, sortBy, orderBy })
        res.json({
            success: true,
            data: result.products,
            pagination: result.pagination
        })
    } catch (err) {
        next(err)
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
    getProduct,
    getSingleProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory
}