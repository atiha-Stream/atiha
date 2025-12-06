/**
 * Route API pour gérer les paiements
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

// GET - Obtenir les paiements (avec filtres optionnels)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const payments = await prisma.payment.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    logger.error('Error fetching payments', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planType, amount, currency, status, paymentUrl, transactionId, paymentProvider, metadata } = body

    if (!userId || !planType || !amount || !currency) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        planType,
        amount,
        currency,
        status: status || 'pending',
        paymentUrl,
        transactionId,
        paymentProvider,
        metadata: metadata || {}
      }
    })

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    logger.error('Error creating payment', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}

