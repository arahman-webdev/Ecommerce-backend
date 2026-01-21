"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = void 0;
// cart.service.ts
const prisma_1 = require("../../lib/prisma");
const createCart = async (payload) => {
    const { userId, productId, quantity } = payload;
    // Find cart
    let cart = await prisma_1.prisma.cart.findUnique({
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
        cart = await prisma_1.prisma.cart.create({
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
    const existingItem = cart.items.find((item) => item.productId === productId);
    // If exists → update quantity
    if (existingItem) {
        await prisma_1.prisma.cartItem.update({
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
        await prisma_1.prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
            },
        });
    }
    // Return updated cart with product images
    return prisma_1.prisma.cart.findUnique({
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
const getUserCart = async (userId) => {
    return prisma_1.prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            productImages: true // This is crucial!
                        }
                    },
                },
            },
        },
    });
};
exports.cartService = {
    createCart,
    getUserCart
};
