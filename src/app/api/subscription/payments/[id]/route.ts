/**
 * Route API pour gérer un paiement spécifique
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

// GET - Obtenir un paiement par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
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

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    logger.error('Error fetching payment', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du paiement' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour le statut d'un paiement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, transactionId } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Statut manquant' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        transactionId: transactionId || undefined
      }
    })

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    logger.error('Error updating payment', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du paiement' },
      { status: 500 }
    )
  }
}

