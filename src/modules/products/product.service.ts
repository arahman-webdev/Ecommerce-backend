
// creating product category

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



// creating product ----------------
const createProduct = async (payload: Prisma.ProductCreateInput) => {
  const slug = payload.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")

  return prisma.product.create({
    data: {
      ...payload,
      slug
    },
    include: {
      images: true,
      category: true
    }
  })
}


const updateProduct = async (
  id: string,
  payload: Prisma.ProductUpdateInput
) => {
  const product = await prisma.product.findUnique({ where: { id } })

  if (!product) {
    throw new Error("Product not found")
  }



  return prisma.product.update({
    where: { id },
    data: payload,
    include: {
      images: true,
      category: true
    }
  })
}




const getProduct = async ({
  page,
  limit,
  searchTerm,
  category,
  sortBy = "createdAt",
  orderBy = "desc"
}: {
  page: number
  limit: number
  searchTerm?: string
  category?: string
  sortBy?: "price" | "createdAt"
  orderBy?: "asc" | "desc"
}) => {
  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = {
    ...(searchTerm && {
      name: { contains: searchTerm, mode: "insensitive" }
    }),
    ...(category && {
      category: { name: category }
    })
  }

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: orderBy },
      include: {
        images: true,
        category: true
      }
    }),
    prisma.product.count({ where })
  ])

  return {
    meta: {
      page,
      limit,
      total
    },
    data
  }
}




export const productService = {
    createProduct,
    updateProduct,
    getProduct,
    createCategory
}