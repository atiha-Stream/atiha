/**
 * Endpoint API pour vérifier un code 2FA et activer le 2FA
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify2FACode, enable2FA } from '@/lib/two-factor-auth'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code 2FA requis' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('atiha_user_data')
    
    if (!userCookie) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)
    const isAdmin = request.url.includes('/admin/')

    // Vérifier le code
    const { valid, isBackupCode } = await verify2FACode(
      user.id,
      code,
      isAdmin
    )

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Code 2FA invalide' },
        { status: 403 }
      )
    }

    // Activer le 2FA
    const enabled = await enable2FA(user.id, isAdmin)

    if (!enabled) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'activation' },
        { status: 500 }
      )
    }

    logger.info('2FA enabled', { userId: user.id, isAdmin, isBackupCode })

    return NextResponse.json({
      success: true,
      message: '2FA activé avec succès',
      isBackupCode,
    })
  } catch (error) {
    logger.error('Erreur lors de la vérification du code 2FA', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}

