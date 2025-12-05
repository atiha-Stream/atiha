/**
 * Routes API pour la gestion des sessions
 * GET /api/sessions - Récupérer les sessions actives
 * DELETE /api/sessions - Supprimer une session
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/sessions - Récupérer les sessions actives de l'utilisateur
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('atiha_user_data')
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!userCookie && !adminCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = userCookie ? JSON.parse(userCookie.value) : null
    const admin = adminCookie ? JSON.parse(adminCookie.value) : null

    if (admin) {
      // Admin peut voir toutes les sessions
      const sessions = await prisma.userSession.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { lastActivity: 'desc' },
      })

      return NextResponse.json({
        success: true,
        sessions,
      })
    }

    if (user) {
      // Utilisateur voit seulement ses sessions
      const sessions = await prisma.userSession.findMany({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastActivity: 'desc' },
      })

      return NextResponse.json({
        success: true,
        sessions,
      })
    }

    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 403 }
    )
  } catch (error) {
    logger.error('Erreur lors de la récupération des sessions', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessions - Supprimer une session
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de session requis' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('atiha_user_data')
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!userCookie && !adminCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = userCookie ? JSON.parse(userCookie.value) : null
    const admin = adminCookie ? JSON.parse(adminCookie.value) : null

    // Récupérer la session
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier les permissions
    if (!admin && session.userId !== user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Supprimer la session
    await prisma.userSession.delete({
      where: { id: sessionId },
    })

    logger.info('Session supprimée', { sessionId })

    return NextResponse.json({
      success: true,
      message: 'Session supprimée',
    })
  } catch (error) {
    logger.error('Erreur lors de la suppression de la session', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

