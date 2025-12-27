import { OrderStatus, UserRole } from "../../generated/enums";
import AppError from "../../helper/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status-codes"




// Get user orders
const getUserOrders = async (userId: string) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              productImages: true
            }
          },
          variant: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: true,
      shippingAddress: true,
      billingAddress: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

// Get order by ID
const getOrderById = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              productImages: true
            }
          },
          variant: true
        }
      },
      payment: true,
      shippingAddress: true,
      billingAddress: true,
      user: true
    }
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Check if user owns this order or is admin
  if (order.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  return order;
};


const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {

      items: {
        include: {
          product: {
            include: {
              productImages: true
            }
          },

        }
      },
      user: {
        select: {
          name: true,
          email: true,
        },

      },
      payment: true,


    },
    orderBy: { createdAt: "desc" },
  });
};

const deleteOrder = async (
  productId: string,
  requester: { id: string; userRole: string }
) => {
  // find booking with tour + guide
  const order = await prisma.order.findUnique({
    where: { id: productId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: true
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  // Permission Check
  const isOwnerGuide = order.items[0]?.product.userId === requester.id;
  const isAdmin = requester.userRole === UserRole.ADMIN;

  if (!isOwnerGuide && !isAdmin) {
    throw new AppError(403, "You are not allowed to delete this booking");
  }

  // delete booking
  const deleted = await prisma.order.delete({
    where: { id: productId },
  });

  return deleted;
};

// get order for seller

const getSellerOrders = async (userId: string) => {
  console.log("forn seller", userId)
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          product: {
            userId: userId, // ✅ seller owns the product
          },
        },
      },
    },
    include: {
      items: {
        where: {
          product: {
            userId: userId, // ✅ only seller’s items
          },
        },
        include: {
          product: {
            include: {
              productImages: true,
            },
          },
          variant: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: true,
      shippingAddress: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};




const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  const current = order.status;

  // No change
  if (current === status) return order;

  // Final states
  if (current === "DELIVERED" || current === "CANCELLED") {
    throw new AppError(400, "Order status cannot be updated");
  }

  // PENDING rules
  if (current === "PENDING") {
    if (!["PROCESSING", "CANCELLED"].includes(status)) {
      throw new AppError(
        400,
        "Pending orders can go to PROCESSING or CANCELLED"
      );
    }
  }

  // PROCESSING rules
  if (current === "PROCESSING") {
    if (!["SHIPPED", "CANCELLED"].includes(status)) {
      throw new AppError(
        400,
        "Processing orders can go to SHIPPED or CANCELLED"
      );
    }
  }

  // SHIPPED rules
  if (current === "SHIPPED") {
    if (status !== "DELIVERED") {
      throw new AppError(
        400,
        "Shipped orders can only be DELIVERED"
      );
    }
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};




export const OrderService = {
  getAllOrders,
  deleteOrder,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus
};