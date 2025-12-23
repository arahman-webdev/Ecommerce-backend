import { NextFunction, Request, Response } from "express";
import { productService } from "./product.service";
import { uploadToCloudinary } from "../../config/uploadToCloudinary";

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



const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let data = req.body;
        console.log("before creating parse", data)
        if (data.data && typeof data.data === 'string') {
            data = JSON.parse(data.data)
            
        }

        const { name,slug, description, price, category,categoryId, stock } = data;



        const images = []

        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                try {
                    const uploaded = await uploadToCloudinary(file.buffer, "products");
                    // Here you can choose to store multiple image URLs/IDs as needed
                    // For simplicity, we're just assigning the last uploaded image
                    images.push({
                        imageUrl: uploaded.secure_url,
                        imageId: uploaded.public_id,
                    });
                } catch (uploadError: any) {
                   
                }
            }
        }

        const result = await productService.createProduct({
            name,slug, description, price: parseFloat(price), category,categoryId, stock: parseInt(stock), productImages: {
                create: images
            }, 

        })

        res.json({
            success: true,
            message: "Product created successfully",
            data: result
        })
    } catch (err) {
        next(err)
        console.log("from controller.....", err)
    }
}

const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const searchTerm =
      typeof req.query.searchTerm === "string"
        ? req.query.searchTerm
        : undefined

    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : undefined

    const sortBy =
      req.query.sortBy === "price" || req.query.sortBy === "createdAt"
        ? req.query.sortBy
        : undefined

    const orderBy =
      req.query.orderBy === "asc" || req.query.orderBy === "desc"
        ? req.query.orderBy
        : undefined

    const result = await productService.getProduct({
      page,
      limit,
      searchTerm,
      category,
      sortBy,
      orderBy
    })

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (err) {
    next(err)
  }
}




export const productController = {
    createProduct,
    getProduct,
    createCategory
}