// cart.service.ts
import { prisma } from "../../lib/prisma";

interface CreateCartPayload {
  userId: string;
  productId: string;
  quantity: number;
}

const createCart = async (payload: CreateCartPayload) => {
  const { userId, productId, quantity } = payload;

  // Find cart
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              productImages: true
            }
          }
        }
      }
    },
  });

  // If cart does not exist → create
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
        items: {
          create: {
            productId,
            quantity,
          },
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                productImages: true
              }
            }
          }
        }
      },
    });

    return cart;
  }

  // Check if product already exists in cart
  const existingItem = cart.items.find(
    (item) => item.productId === productId
  );

  // If exists → update quantity
  if (existingItem) {
    await prisma.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  }
  // If not exists → create new item
  else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  // Return updated cart with product images
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              productImages: true
            }
          }
        },
      },
    },
  });
};

const getUserCart = async (userId: string) => {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include:{
              productImages:true
            }
          }
        },
      },
    },
  });
};

const updateQuantity = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  const cart = await prisma.cart.findUnique({
    where: { userId }
  });

  if (!cart) throw new Error("Cart not found");

  return prisma.cartItem.updateMany({
    where: {
      cartId: cart.id,
      productId
    },
    data: { quantity }
  });
};

const removeItem = async (userId: string, productId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId }
  });

  if (!cart) throw new Error("Cart not found");

  return prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId
    }
  });
};

const clearUserCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) return;

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return true;
};

export const cartService = {
  createCart,
  getUserCart,
  updateQuantity,
  removeItem,
  clearUserCart
};