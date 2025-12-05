/**
 * Routes API pour la watchlist d'un utilisateur
 * GET /api/users/[id]/watchlist - Récupérer la watchlist
 * POST /api/users/[id]/watchlist - Ajouter un élément
 * DELETE /api/users/[id]/watchlist - Retirer un élément
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/users/[id]/watchlist - Récupérer la watchlist
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Vérifier si Prisma est disponible
    try {
      const watchlist = await prisma.watchlist.findMany({
        where: { userId: id },
        orderBy: { addedAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        watchlist,
      })
    } catch (dbError: any) {
      // Si la base de données n'est pas accessible, retourner une liste vide
      if (dbError.code === 'P1001' || dbError.message?.includes('Can\'t reach database')) {
        logger.warn('Base de données non accessible, retour d\'une watchlist vide', { userId: id })
        return NextResponse.json({
          success: true,
          watchlist: [],
        })
      }
      throw dbError
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération de la watchlist', error as Error)
    
    // Si c'est une erreur de connexion à la base de données, retourner une liste vide
    if (error instanceof Error && (error.message.includes('Can\'t reach database') || error.message.includes('P1001'))) {
      return NextResponse.json({
        success: true,
        watchlist: [],
      })
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[id]/watchlist - Ajouter un élément
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { contentId, contentType } = body

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

    // Ajouter ou mettre à jour (upsert)
    const watchlistItem = await prisma.watchlist.upsert({
      where: {
        userId_contentId_contentType: {
          userId: id,
          contentId,
          contentType,
        },
      },
      update: {
        addedAt: new Date(),
      },
      create: {
        userId: id,
        contentId,
        contentType,
      },
    })

    return NextResponse.json({
      success: true,
      item: watchlistItem,
    }, { status: 201 })
  } catch (error) {
    logger.error('Erreur lors de l\'ajout à la watchlist', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]/watchlist - Retirer un élément
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('contentType')

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

    // Supprimer l'élément
    await prisma.watchlist.deleteMany({
      where: {
        userId: id,
        contentId,
        contentType,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Élément retiré de la watchlist',
    })
  } catch (error) {
    logger.error('Erreur lors de la suppression de la watchlist', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

