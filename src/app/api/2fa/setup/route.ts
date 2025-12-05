/**
 * Endpoint API pour configurer le 2FA
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generate2FASecret } from '@/lib/two-factor-auth'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification (à implémenter selon votre système)
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

    // Générer le secret 2FA
    const { secret, qrCodeUrl, backupCodes } = await generate2FASecret(
      user.id,
      isAdmin
    )

    logger.info('2FA setup initiated', { userId: user.id, isAdmin })

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      backupCodes, // ⚠️ À afficher une seule fois à l'utilisateur
      message: 'Scannez le QR code avec votre application d\'authentification',
    })
  } catch (error) {
    logger.error('Erreur lors de la configuration du 2FA', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la configuration' },
      { status: 500 }
    )
  }
}

