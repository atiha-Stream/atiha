'use client'

import { prisma } from './database'
import { logger } from './logger'

export interface PaymentData {
  userId: string
  planType: 'individuel' | 'famille'
  amount: string
  currency: string
  status?: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentUrl?: string
  transactionId?: string
  paymentProvider?: string
  metadata?: Record<string, any>
}

class PaymentService {
  /**
   * Créer une nouvelle transaction de paiement
   */
  static async createPayment(data: PaymentData) {
    try {
      const payment = await prisma.payment.create({
        data: {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.userId,
          planType: data.planType,
          amount: data.amount,
          currency: data.currency,
          status: data.status || 'pending',
          paymentUrl: data.paymentUrl,
          transactionId: data.transactionId,
          paymentProvider: data.paymentProvider,
          metadata: data.metadata as any
        }
      })
      logger.info(`Payment created: ${payment.id}`)
      return payment
    } catch (error) {
      logger.error('Error creating payment', error as Error)
      throw error
    }
  }

  /**
   * Obtenir un paiement par ID
   */
  static async getPaymentById(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true, name: true } } }
      })
      return payment
    } catch (error) {
      logger.error(`Error fetching payment ${id}`, error as Error)
      return null
    }
  }

  /**
   * Obtenir tous les paiements d'un utilisateur
   */
  static async getUserPayments(userId: string) {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      return payments
    } catch (error) {
      logger.error(`Error fetching payments for user ${userId}`, error as Error)
      return []
    }
  }

  /**
   * Mettre à jour le statut d'un paiement
   */
  static async updatePaymentStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'cancelled', transactionId?: string) {
    try {
      const payment = await prisma.payment.update({
        where: { id },
        data: {
          status,
          transactionId: transactionId || undefined
        }
      })
      logger.info(`Payment ${id} status updated to ${status}`)
      return payment
    } catch (error) {
      logger.error(`Error updating payment status for ${id}`, error as Error)
      throw error
    }
  }

  /**
   * Obtenir les statistiques de paiement
   */
  static async getPaymentStats() {
    try {
      const [total, completed, pending, failed] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'completed' } }),
        prisma.payment.count({ where: { status: 'pending' } }),
        prisma.payment.count({ where: { status: 'failed' } })
      ])

      return {
        total,
        completed,
        pending,
        failed,
        successRate: total > 0 ? (completed / total) * 100 : 0
      }
    } catch (error) {
      logger.error('Error fetching payment stats', error as Error)
      return {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        successRate: 0
      }
    }
  }

  /**
   * Obtenir les paiements récents
   */
  static async getRecentPayments(limit: number = 10) {
    try {
      const payments = await prisma.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, name: true } } }
      })
      return payments
    } catch (error) {
      logger.error('Error fetching recent payments', error as Error)
      return []
    }
  }
}

export default PaymentService

