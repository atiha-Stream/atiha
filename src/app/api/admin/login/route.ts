/**
 * Endpoint API pour la connexion admin avec cookies httpOnly et protection CSRF
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminSecurity } from '@/lib/admin-security'
import { adminManagement } from '@/lib/admin-management'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'

/**
 * Comparaison sécurisée contre les attaques par timing
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

const TOKEN_COOKIE_NAME = 'atiha_admin_token'
const ADMIN_COOKIE_NAME = 'atiha_admin_user'
const COOKIE_MAX_AGE = 24 * 60 * 60 // 24 heures pour admin

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, csrfToken } = body

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: 'Token CSRF manquant' },
        { status: 400 }
      )
    }

    // Valider le token CSRF
    const cookieStore = await cookies()
    const csrfCookie = cookieStore.get('atiha_csrf_token')
    
    if (!csrfCookie || !timingSafeEqual(csrfCookie.value, csrfToken)) {
      logger.warn('CSRF token validation failed for admin login', { username })
      return NextResponse.json(
        { success: false, error: 'Token CSRF invalide' },
        { status: 403 }
      )
    }

    // Authentifier l'admin
    // IDENTIFIANTS CODÉS EN DUR POUR TEST (TEMPORAIRE)
    const HARDCODED_ADMIN = {
      username: 'leGenny',
      password: 'Atiasekbaby@89#2025!',
      id: 'hardcoded_admin_leGenny',
      email: 'leGenny@atiha.com',
      role: 'super_admin' as const,
      permissions: ['*']
    }

    let adminData: any = null

    // Vérifier d'abord les identifiants codés en dur
    if (username === HARDCODED_ADMIN.username && password === HARDCODED_ADMIN.password) {
      logger.info('Connexion admin réussie (identifiants codés en dur)', { username })
      adminData = {
        id: HARDCODED_ADMIN.id,
        username: HARDCODED_ADMIN.username,
        email: HARDCODED_ADMIN.email,
        role: HARDCODED_ADMIN.role,
        permissions: HARDCODED_ADMIN.permissions
      }
    } else {
      // Chercher dans Prisma (base de données PostgreSQL)
      
      try {
        logger.info('Tentative de connexion admin', { username })
        const dbAdmin = await prisma.admin.findUnique({
          where: { username }
        })
      
        logger.info('Résultat recherche admin Prisma', { 
          found: !!dbAdmin, 
          username,
          adminId: dbAdmin?.id 
        })

        if (dbAdmin) {
          // Vérifier le mot de passe avec bcrypt
          const passwordValid = await bcrypt.compare(password, dbAdmin.passwordHash)
          
          if (passwordValid) {
            // Vérifier si l'admin est actif
            if (!dbAdmin.isActive) {
              return NextResponse.json(
                { success: false, error: 'Votre compte administrateur est désactivé.' },
                { status: 403 }
              )
            }

            // Mettre à jour les informations de connexion dans Prisma
            await prisma.admin.update({
              where: { id: dbAdmin.id },
              data: {
                lastLogin: new Date()
              }
            })

            // Convertir en format AdminData pour compatibilité
            adminData = {
              id: dbAdmin.id,
              username: dbAdmin.username,
              email: dbAdmin.email || 'admin@user.com',
              role: dbAdmin.role as 'admin' | 'super_admin',
              permissions: (dbAdmin.permissions as any) || []
            }
          }
        }
      } catch (error) {
        logger.error('Erreur lors de la recherche de l\'admin dans Prisma', error as Error)
        // Continuer avec l'authentification fallback en cas d'erreur
      }

      // Si l'admin n'a pas été trouvé dans Prisma, utiliser l'authentification fallback
      if (!adminData) {
      const result = await adminSecurity.authenticate(username, password)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.message, remainingAttempts: result.remainingAttempts },
          { status: 401 }
        )
      }

      // Récupérer les données admin depuis adminManagement
      adminData = adminManagement.getAdminByUsername(username)
      
        if (!adminData) {
          return NextResponse.json(
            { success: false, error: 'Données administrateur non trouvées' },
            { status: 500 }
          )
        }
      }
    }

    // Générer un token
    const token = `admin_jwt_token_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminData.id,
        username: adminData.username,
        email: 'admin@user.com',
        role: adminData.role,
        permissions: adminData.permissions
      }
    })

    // Définir les cookies httpOnly
    cookieStore.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    })

    cookieStore.set(ADMIN_COOKIE_NAME, JSON.stringify({
      id: adminData.id,
      username: adminData.username,
      email: 'admin@user.com',
      role: adminData.role,
      permissions: adminData.permissions
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    })

    logger.info('Admin logged in successfully', { adminId: adminData.id, username })

    return response
  } catch (error) {
    logger.error('Erreur lors de la connexion admin', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}

