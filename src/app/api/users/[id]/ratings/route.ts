/**
 * Routes API pour les notes et avis d'un utilisateur
 * GET /api/users/[id]/ratings - Récupérer les notes
 * POST /api/users/[id]/ratings - Ajouter/mettre à jour une note
 * DELETE /api/users/[id]/ratings - Supprimer une note
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/users/[id]/ratings - Récupérer les notes
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
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
    if (contentId) {
      where.contentId = contentId
    }
    if (contentType) {
      where.contentType = contentType
    }

    // Vérifier si Prisma est disponible
    try {
      const ratings = await prisma.rating.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      return NextResponse.json({
        success: true,
        ratings,
      })
    } catch (dbError: any) {
      // Si la base de données n'est pas accessible, retourner une liste vide
      if (dbError.code === 'P1001' || dbError.message?.includes('Can\'t reach database')) {
        logger.warn('Base de données non accessible, retour d\'une liste de notes vide', { userId: id })
        return NextResponse.json({
          success: true,
          ratings: [],
        })
      }
      throw dbError
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération des notes', error as Error)
    
    // Si c'est une erreur de connexion à la base de données, retourner une liste vide
    if (error instanceof Error && (error.message.includes('Can\'t reach database') || error.message.includes('P1001'))) {
      return NextResponse.json({
        success: true,
        ratings: [],
      })
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[id]/ratings - Ajouter/mettre à jour une note
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { contentId, contentType, rating, review } = body

    if (!contentId || !contentType || !rating) {
      return NextResponse.json(
        { error: 'contentId, contentType et rating requis' },
        { status: 400 }
      )
    }

    // Valider la note (1-5)
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La note doit être entre 1 et 5' },
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

    // Créer ou mettre à jour la note (upsert)
    const ratingItem = await prisma.rating.upsert({
      where: {
        userId_contentId_contentType: {
          userId: id,
          contentId,
          contentType,
        },
      },
      update: {
        rating,
        review: review || null,
        updatedAt: new Date(),
      },
      create: {
        userId: id,
        contentId,
        contentType,
        rating,
        review: review || null,
      },
    })

    return NextResponse.json({
      success: true,
      rating: ratingItem,
    }, { status: 201 })
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de la note', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]/ratings - Supprimer une note
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

    // Supprimer la note
    await prisma.rating.deleteMany({
      where: {
        userId: id,
        contentId,
        contentType,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Note supprimée',
    })
  } catch (error) {
    logger.error('Erreur lors de la suppression de la note', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

