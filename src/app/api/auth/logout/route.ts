/**
 * Endpoint API pour la déconnexion utilisateur
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const TOKEN_COOKIE_NAME = 'atiha_auth_token'
const USER_COOKIE_NAME = 'atiha_user_data'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Supprimer les cookies
    cookieStore.set(TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    cookieStore.set(USER_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    logger.info('User logged out successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la déconnexion', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}

