/**
 * Endpoint API pour récupérer la valeur d'un cookie httpOnly
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Cookie name is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const cookie = cookieStore.get(name)

    if (!cookie) {
      return NextResponse.json(
        { success: false, error: 'Cookie not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      value: cookie.value 
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération du cookie', error as Error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du cookie' },
      { status: 500 }
    )
  }
}

