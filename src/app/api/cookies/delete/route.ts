/**
 * Endpoint API pour supprimer un cookie httpOnly
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, path = '/' } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Cookie name is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    // Supprimer le cookie en définissant une date d'expiration passée
    cookieStore.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: path
    })

    logger.debug('Cookie deleted via API', { name, path })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la suppression du cookie', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du cookie' },
      { status: 500 }
    )
  }
}

