/**
 * Endpoint API pour gérer les tokens CSRF côté serveur
 * Génère et valide les tokens CSRF pour les requêtes sensibles
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const CSRF_COOKIE_NAME = 'atiha_csrf_token'
const CSRF_COOKIE_MAX_AGE = 24 * 60 * 60 // 24 heures en secondes

/**
 * Génère un token CSRF sécurisé
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback pour les environnements sans crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * GET /api/csrf - Génère un nouveau token CSRF
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const existingToken = cookieStore.get(CSRF_COOKIE_NAME)

    // Si un token valide existe déjà, le retourner
    if (existingToken?.value) {
      return NextResponse.json({ 
        success: true, 
        token: existingToken.value 
      })
    }

    // Générer un nouveau token
    const token = generateCSRFToken()

    // Créer la réponse avec le cookie httpOnly
    const response = NextResponse.json({ 
      success: true, 
      token 
    })

    // Définir le cookie httpOnly, secure, sameSite
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_COOKIE_MAX_AGE,
      path: '/'
    })

    logger.debug('CSRF token generated', { token: token.substring(0, 8) + '...' })

    return response
  } catch (error) {
    logger.error('Erreur lors de la génération du token CSRF', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du token' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/csrf/validate - Valide un token CSRF
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

    if (!cookieToken) {
      return NextResponse.json(
        { success: false, error: 'Token CSRF manquant' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const providedToken = body.token

    if (!providedToken || typeof providedToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token CSRF invalide' },
        { status: 400 }
      )
    }

    // Comparaison sécurisée contre les attaques par timing
    const isValid = timingSafeEqual(providedToken, cookieToken)

    if (!isValid) {
      logger.warn('CSRF token validation failed', {
        provided: providedToken.substring(0, 8) + '...',
        expected: cookieToken.substring(0, 8) + '...'
      })
      return NextResponse.json(
        { success: false, error: 'Token CSRF invalide' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la validation du token CSRF', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}

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

