/**
 * Endpoint API pour la déconnexion admin
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const TOKEN_COOKIE_NAME = 'atiha_admin_token'
const ADMIN_COOKIE_NAME = 'atiha_admin_user'

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

    cookieStore.set(ADMIN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    logger.info('Admin logged out successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la déconnexion admin', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}

