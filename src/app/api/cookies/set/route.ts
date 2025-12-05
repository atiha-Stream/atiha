/**
 * Endpoint API pour définir des cookies httpOnly
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, value, maxAge = 7 * 24 * 60 * 60, path = '/' } = body

    if (!name || !value) {
      return NextResponse.json(
        { success: false, error: 'Name and value are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    // Définir le cookie httpOnly, secure, sameSite
    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
      path: path
    })

    logger.debug('Cookie set via API', { name, maxAge, path })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la définition du cookie', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la définition du cookie' },
      { status: 500 }
    )
  }
}

