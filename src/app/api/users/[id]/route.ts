/**
 * Routes API pour un utilisateur spécifique
 * GET /api/users/[id] - Récupérer un utilisateur
 * PUT /api/users/[id] - Mettre à jour un utilisateur
 * DELETE /api/users/[id] - Supprimer un utilisateur
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/users/[id] - Récupérer un utilisateur
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
    const adminCookie = cookieStore.get('atiha_admin_user')

    // Seul l'utilisateur lui-même ou un admin peut voir les détails
    if (!userCookie && !adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const user = userCookie ? JSON.parse(userCookie.value) : null
    const admin = adminCookie ? JSON.parse(adminCookie.value) : null

    // Vérifier les permissions
    if (user?.id !== id && !admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Récupérer l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        isActive: true,
        isBanned: true,
        loginCount: true,
        registrationDate: true,
        lastLogin: true,
        createdAt: true,
        profile: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'utilisateur', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id] - Mettre à jour un utilisateur
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Vérifier l'authentification
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('atiha_user_data')
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!userCookie && !adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const user = userCookie ? JSON.parse(userCookie.value) : null
    const admin = adminCookie ? JSON.parse(adminCookie.value) : null

    // Seul l'utilisateur lui-même ou un admin peut modifier
    if (user?.id !== id && !admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.country !== undefined) updateData.country = body.country
    if (body.isActive !== undefined && admin) updateData.isActive = body.isActive
    if (body.isBanned !== undefined && admin) updateData.isBanned = body.isBanned

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        isActive: true,
        isBanned: true,
        updatedAt: true,
      },
    })

    logger.info('Utilisateur mis à jour', { userId: id })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'utilisateur', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id] - Supprimer un utilisateur (admin uniquement)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier l'authentification admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Supprimer l'utilisateur (cascade supprime les relations)
    await prisma.user.delete({
      where: { id },
    })

    logger.info('Utilisateur supprimé', { userId: id })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    })
  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'utilisateur', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

