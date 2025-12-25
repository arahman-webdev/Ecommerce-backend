// services/payment.service.ts

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';

export const PaymentService = {
  // Initialize payment for an order
  async initPayment(orderId: string, userId: string) {
    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        shippingAddress: true,
        payment: true,
      },
    });

    if (!order) {
      throw new Error('Order not found or not pending');
    }

    if (order.payment?.status === 'COMPLETED') {
      throw new Error('Payment already completed');
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create SSL transaction record
    const sslTransaction = await prisma.sSLCommerzTransaction.create({
      data: {
        transactionId,
        orderId,
        amount: order.totalAmount,
        currency: 'BDT',
        cusName: order.user.name,
        cusEmail: order.user.email,
        cusPhone: order.user.phone || '',
        cusAddress: order.shippingAddress?.addressLine1 || '',
      },
    });

    // Prepare SSL payload
    const sslPayload = {
      amount: order.totalAmount,
      transactionId,
      orderId,
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone || '',
      address: order.shippingAddress?.addressLine1 || '',
      product_name: 'Ecommerce Purchase',
      product_category: 'General Goods',
    };

    // Initialize SSL payment
    const sslResponse = await sslPaymentInit(sslPayload);

    // Update payment with transaction ID
    await prisma.payment.update({
      where: { orderId },
      data: { transactionId },
    });

    return {
      paymentUrl: sslResponse.GatewayPageURL,
      transactionId,
      orderId,
    };
  },

  // Verify payment (IPN/Webhook)
  async verifyPayment(transactionId: string, validationData: any) {
    const transaction = await prisma.sSLCommerzTransaction.findUnique({
      where: { transactionId },
      include: {
        order: {
          include: { payment: true }
        }
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction with validation data
    await prisma.sSLCommerzTransaction.update({
      where: { transactionId },
      data: {
        valId: validationData.val_id,
        bankTransaction: validationData.bank_tran_id,
        status: validationData.status === 'VALID' ? 'SUCCESS' : 'FAILED',
        updatedAt: new Date(),
      },
    });

    if (validationData.status === 'VALID') {
      // Update payment and order
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId: transaction.orderId },
          data: {
            status: 'COMPLETED',
            valId: validationData.val_id,
            bankTransaction: validationData.bank_tran_id,
            updatedAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: transaction.orderId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
        });
      });

      return { success: true, orderId: transaction.orderId };
    } else {
      await prisma.payment.update({
        where: { orderId: transaction.orderId },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      });

      return { success: false, reason: validationData.failedreason };
    }
  },
};