/**
 * Routes API pour la gestion des administrateurs
 * GET /api/admins - Liste des admins (super admin uniquement)
 * POST /api/admins - Créer un admin (super admin uniquement)
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { EncryptionService } from '@/lib/encryption-service'
import { logger } from '@/lib/logger'
import { checkAdminRateLimit } from '@/lib/rate-limiter'

/**
 * GET /api/admins - Récupérer la liste des admins
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkAdminRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    // Vérifier l'authentification super admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const admin = JSON.parse(adminCookie.value)

    // Vérifier que c'est un super admin
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux super administrateurs' },
        { status: 403 }
      )
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      admins,
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération des admins', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admins - Créer un nouvel admin (super admin uniquement)
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkAdminRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    // Vérifier l'authentification super admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const admin = JSON.parse(adminCookie.value)

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux super administrateurs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, password, email, role, permissions } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username et password requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'admin existe déjà
    const existing = await prisma.admin.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur est déjà utilisé' },
        { status: 409 }
      )
    }

    // Hacher le mot de passe
    const passwordHash = await EncryptionService.hashPassword(password)

    // Créer l'admin
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        passwordHash,
        email: email || null,
        role: role || 'admin',
        permissions: permissions || [],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    })

    logger.info('Admin créé', { adminId: newAdmin.id, username, createdBy: admin.id })

    return NextResponse.json({
      success: true,
      admin: newAdmin,
    }, { status: 201 })
  } catch (error) {
    logger.error('Erreur lors de la création de l\'admin', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

