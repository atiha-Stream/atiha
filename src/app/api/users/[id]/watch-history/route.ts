/**
 * Routes API pour l'historique de visionnage
 * GET /api/users/[id]/watch-history - Récupérer l'historique
 * POST /api/users/[id]/watch-history - Ajouter/mettre à jour un élément
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/users/[id]/watch-history - Récupérer l'historique
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Vérifier l'authentification
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('atiha_user_data')

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    let user
    try {
      user = JSON.parse(userCookie.value)
    } catch (parseError) {
      logger.warn('Erreur lors du parsing du cookie utilisateur', parseError as Error)
      return NextResponse.json(
        { error: 'Cookie invalide' },
        { status: 401 }
      )
    }

    if (user.id !== id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    const where: any = { userId: id }
    if (contentType) {
      where.contentType = contentType
    }

    // Vérifier si Prisma est disponible
    try {
      const history = await prisma.watchHistory.findMany({
        where,
        orderBy: { watchedAt: 'desc' },
        take: limit,
      })

      return NextResponse.json({
        success: true,
        history,
      })
    } catch (dbError: any) {
      // Si la base de données n'est pas accessible, retourner une liste vide
      if (dbError.code === 'P1001' || dbError.message?.includes('Can\'t reach database')) {
        logger.warn('Base de données non accessible, retour d\'un historique vide', { userId: id })
        return NextResponse.json({
          success: true,
          history: [],
        })
      }
      throw dbError
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'historique', error as Error)
    
    // Si c'est une erreur de connexion à la base de données, retourner une liste vide
    if (error instanceof Error && (error.message.includes('Can\'t reach database') || error.message.includes('P1001'))) {
      return NextResponse.json({
        success: true,
        history: [],
      })
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[id]/watch-history - Ajouter/mettre à jour un élément
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { contentId, contentType, progress, duration, completed } = body

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'contentId et contentType requis' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('atiha_user_data')

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)

    if (user.id !== id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Créer ou mettre à jour l'historique
    // Utiliser findFirst + create/update car Prisma nécessite un unique constraint pour upsert
    const existing = await prisma.watchHistory.findFirst({
      where: {
        userId: id,
        contentId,
      },
    })

    const historyItem = existing
      ? await prisma.watchHistory.update({
          where: { id: existing.id },
          data: {
            progress: progress ?? existing.progress,
            duration: duration ?? existing.duration,
            completed: completed ?? existing.completed,
            watchedAt: new Date(),
          },
        })
      : await prisma.watchHistory.create({
          data: {
            userId: id,
            contentId,
            contentType,
            progress: progress ?? 0,
            duration: duration ?? null,
            completed: completed ?? false,
          },
        })

    return NextResponse.json({
      success: true,
      item: historyItem,
    })
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de l\'historique', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

