/**
 * Routes API pour la gestion des utilisateurs
 * GET /api/users - Liste des utilisateurs (admin uniquement)
 * POST /api/users - Créer un utilisateur
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { EncryptionService } from '@/lib/encryption-service'
import { logger } from '@/lib/logger'
import { checkAPIRateLimit } from '@/lib/rate-limiter'

/**
 * GET /api/users - Récupérer la liste des utilisateurs (admin uniquement)
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkAPIRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      )
    }

    // Vérifier l'authentification admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_user')
    
    if (!adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Récupérer les utilisateurs
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ])

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération des utilisateurs', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users - Créer un nouvel utilisateur
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkAPIRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, name, phone, country } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    // Hacher le mot de passe
    const passwordHash = await EncryptionService.hashPassword(password)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        phone: phone || null,
        country: country || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        isActive: true,
        registrationDate: true,
        createdAt: true,
      },
    })

    logger.info('Utilisateur créé', { userId: user.id, email })

    return NextResponse.json({
      success: true,
      user,
    }, { status: 201 })
  } catch (error) {
    logger.error('Erreur lors de la création de l\'utilisateur', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

