/**
 * Endpoint API pour la connexion utilisateur avec cookies httpOnly
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { userDatabase } from '@/lib/user-database'
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

const TOKEN_COOKIE_NAME = 'atiha_auth_token'
const USER_COOKIE_NAME = 'atiha_user_data'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 jours

export async function POST(request: Request) {
  try {
    // Vérifier le token CSRF
    const body = await request.json()
    const { email, password, csrfToken } = body

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: 'Token CSRF manquant' },
        { status: 400 }
      )
    }

    // Valider le token CSRF (côté serveur via cookie)
    const cookieStore = await cookies()
    const csrfCookie = cookieStore.get('atiha_csrf_token')
    
    if (!csrfCookie || !timingSafeEqual(csrfCookie.value, csrfToken)) {
      logger.warn('CSRF token validation failed for login', { email })
      return NextResponse.json(
        { success: false, error: 'Token CSRF invalide' },
        { status: 403 }
      )
    }

    // Authentifier l'utilisateur
    // Chercher d'abord dans Prisma (base de données PostgreSQL)
    let userRecord = null
    
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email }
      })

      if (dbUser) {
        // Vérifier le mot de passe avec bcrypt
        const passwordValid = await bcrypt.compare(password, dbUser.passwordHash)
        
        if (passwordValid) {
          // Vérifier si l'utilisateur est actif et non banni
          if (dbUser.isBanned) {
            return NextResponse.json(
              { success: false, error: 'Votre compte a été suspendu. Contactez l\'administrateur.' },
              { status: 403 }
            )
          }
          
          if (!dbUser.isActive) {
            return NextResponse.json(
              { success: false, error: 'Votre compte est désactivé. Contactez l\'administrateur.' },
              { status: 403 }
            )
          }

          // Mettre à jour les informations de connexion dans Prisma
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              lastLogin: new Date(),
              loginCount: { increment: 1 }
            }
          })

          // Convertir en format UserRecord pour compatibilité
          userRecord = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || '',
            phone: dbUser.phone || '',
            country: dbUser.country || '',
            password: dbUser.passwordHash, // Pour compatibilité, mais ne sera pas utilisé
            isActive: dbUser.isActive,
            isBanned: dbUser.isBanned,
            registrationDate: dbUser.registrationDate.toISOString(),
            lastLogin: dbUser.lastLogin?.toISOString() || new Date().toISOString(),
            loginCount: dbUser.loginCount + 1,
            avatar: null
          }
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la recherche de l\'utilisateur dans Prisma', error as Error)
      // Continuer avec localStorage en cas d'erreur
    }

    // Si l'utilisateur n'a pas été trouvé dans Prisma, chercher dans localStorage
    if (!userRecord) {
      try {
        userRecord = await userDatabase.loginUser(email, password)
      } catch (error) {
        logger.warn('Erreur lors de la connexion via localStorage', error as Error)
      }
    }

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Générer un token JWT (simplifié pour l'exemple)
    const token = `user_jwt_token_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        // Ne pas envoyer le mot de passe
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

    cookieStore.set(USER_COOKIE_NAME, JSON.stringify({
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    })

    logger.info('User logged in successfully', { userId: userRecord.id, email })

    return response
  } catch (error) {
    logger.error('Erreur lors de la connexion', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}

