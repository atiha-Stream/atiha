/**
 * Route API pour gérer les liens après paiement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

// GET - Obtenir tous les liens après paiement
export async function GET() {
  try {
    const links = await prisma.postPaymentLink.findMany({
      orderBy: { planType: 'asc' }
    })
    return NextResponse.json({ success: true, data: links })
  } catch (error) {
    logger.error('Error fetching post-payment links', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des liens' },
      { status: 500 }
    )
  }
}

// POST - Créer ou mettre à jour un lien après paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planType, url, isActive } = body

    if (!planType || !url) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const link = await prisma.postPaymentLink.upsert({
      where: { planType },
      update: {
        url,
        isActive: isActive !== false
      },
      create: {
        id: `post_payment_link_${planType}_${Date.now()}`,
        planType,
        url,
        isActive: isActive !== false
      }
    })

    return NextResponse.json({ success: true, data: link })
  } catch (error) {
    logger.error('Error upserting post-payment link', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la sauvegarde du lien' },
      { status: 500 }
    )
  }
}

