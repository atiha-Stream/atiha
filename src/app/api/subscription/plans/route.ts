/**
 * Route API pour gérer les plans d'abonnement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

// GET - Obtenir tous les plans
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { type: 'asc' }
    })
    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    logger.error('Error fetching subscription plans', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des plans' },
      { status: 500 }
    )
  }
}

// POST - Créer ou mettre à jour un plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, price, period, commitment, description, features, buttonText, buttonColor, paymentUrl, isActive } = body

    if (!type || !title || !price || !period || !commitment || !buttonText || !buttonColor) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.upsert({
      where: { type },
      update: {
        title,
        price,
        period,
        commitment,
        description,
        features: features || [],
        buttonText,
        buttonColor,
        paymentUrl,
        isActive: isActive !== false
      },
      create: {
        id: `plan_${type}_${Date.now()}`,
        type,
        title,
        price,
        period,
        commitment,
        description,
        features: features || [],
        buttonText,
        buttonColor,
        paymentUrl,
        isActive: isActive !== false
      }
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    logger.error('Error upserting subscription plan', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la sauvegarde du plan' },
      { status: 500 }
    )
  }
}

