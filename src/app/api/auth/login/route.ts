/**
 * Endpoint API pour la connexion utilisateur avec cookies httpOnly
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { userDatabase } from '@/lib/user-database'
import { logger } from '@/lib/logger'

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
    const userRecord = await userDatabase.loginUser(email, password)

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

