/**
 * Middleware de rate limiting pour Next.js
 * Utilise Redis pour un rate limiting distribué
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkAPIRateLimit, checkLoginRateLimit, checkAdminRateLimit } from '@/lib/rate-limiter'

/**
 * Obtient l'identifiant unique pour le rate limiting
 */
function getRateLimitIdentifier(request: NextRequest): string {
  // Utiliser l'IP comme identifiant principal
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Pour les routes authentifiées, on pourrait utiliser l'ID utilisateur
  // Pour l'instant, on utilise l'IP
  return ip
}

/**
 * Middleware de rate limiting
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname
  const method = request.method

  // Ne pas limiter les requêtes GET pour les ressources statiques
  if (method === 'GET' && (
    path.startsWith('/_next/') ||
    path.startsWith('/api/health') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2)$/)
  )) {
    return null
  }

  const identifier = getRateLimitIdentifier(request)
  let rateLimitResult

  // Rate limiting spécifique selon la route
  if (path === '/api/auth/login' || path === '/api/admin/login') {
    // Limite stricte pour les connexions : 5 tentatives / 15 minutes
    rateLimitResult = await checkLoginRateLimit(identifier, 5, 15 * 60 * 1000)
  } else if (path.startsWith('/api/admin/')) {
    // Limite pour les routes admin : 30 requêtes / minute
    rateLimitResult = await checkAdminRateLimit(identifier, 30, 60 * 1000)
  } else if (path.startsWith('/api/')) {
    // Limite générale pour les API : 60 requêtes / minute
    rateLimitResult = await checkAPIRateLimit(identifier, 60, 60 * 1000)
  } else {
    // Pas de rate limiting pour les autres routes
    return null
  }

  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      {
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    )

    // Ajouter les headers de rate limiting
    response.headers.set('X-RateLimit-Limit', '60')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())

    return response
  }

  // Ajouter les headers de rate limiting même si la requête est autorisée
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', '60')
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

  return response
}

