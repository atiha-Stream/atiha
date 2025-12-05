/**
 * Endpoint API pour désactiver le 2FA
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { disable2FA } from '@/lib/two-factor-auth'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
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

    // Désactiver le 2FA
    const disabled = await disable2FA(user.id, isAdmin)

    if (!disabled) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la désactivation' },
        { status: 500 }
      )
    }

    logger.info('2FA disabled', { userId: user.id, isAdmin })

    return NextResponse.json({
      success: true,
      message: '2FA désactivé avec succès',
    })
  } catch (error) {
    logger.error('Erreur lors de la désactivation du 2FA', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désactivation' },
      { status: 500 }
    )
  }
}

