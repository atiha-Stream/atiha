/**
 * Endpoint API pour récupérer les informations de l'utilisateur connecté
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const TOKEN_COOKIE_NAME = 'atiha_auth_token'
const USER_COOKIE_NAME = 'atiha_user_data'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)
    const userData = cookieStore.get(USER_COOKIE_NAME)

    if (!token || !userData) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parser les données utilisateur
    const user = JSON.parse(userData.value)

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération des informations utilisateur', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

