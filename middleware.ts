import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimitMiddleware } from '@/middleware-rate-limit'

// Rate limit simple en mémoire (fallback si Redis n'est pas disponible)
const ipBuckets = new Map<string, { count: number; resetAt: number }>()

function allowRequest(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = ipBuckets.get(ip)
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count < limit) {
    bucket.count += 1
    return true
  }
  return false
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname
  
  // Utiliser le rate limiting Redis si disponible
  try {
    const rateLimitResponse = await rateLimitMiddleware(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  } catch (error) {
    // Si Redis n'est pas disponible, continuer avec le fallback en mémoire
    console.warn('Rate limiting Redis non disponible, utilisation du fallback en mémoire')
  }

  // Extraire l'IP depuis les headers (NextRequest n'a pas de propriété .ip)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             'unknown'

  // 🔒 Redirection HTTPS forcée (uniquement en production)
  const isProduction = process.env.NODE_ENV === 'production'
  const isHttps = req.headers.get('x-forwarded-proto') === 'https' || 
                  req.url.startsWith('https://') ||
                  req.headers.get('x-forwarded-ssl') === 'on'
  
  // Si en production et pas HTTPS, rediriger vers HTTPS
  if (isProduction && !isHttps && url.hostname !== 'localhost' && !url.hostname.startsWith('127.0.0.1')) {
    const httpsUrl = url.clone()
    httpsUrl.protocol = 'https:'
    httpsUrl.port = ''
    return NextResponse.redirect(httpsUrl, 301) // 301 = Permanent Redirect
  }

  // Règle générale API: 60 req/min par IP
  if (path.startsWith('/api/')) {
    if (!allowRequest(ip, 60, 60_000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Règle stricte pour login admin: 5 tentatives / 5 min
  if (path === '/admin/login' && req.method === 'POST') {
    if (!allowRequest(`login:${ip}`, 5, 5 * 60_000)) {
      return NextResponse.json({ error: 'Trop de tentatives, réessayez plus tard.' }, { status: 429 })
    }
  }

  // Headers de sécurité HTTPS
  const response = NextResponse.next()
  
  // Headers de sécurité (ajoutés à toutes les réponses)
  if (isProduction && isHttps) {
    // HSTS (HTTP Strict Transport Security) - Force HTTPS pendant 1 an
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    
    // Content Security Policy (renforcée)
    // Note: 'unsafe-inline' et 'unsafe-eval' sont nécessaires pour Next.js en développement
    // En production, considérer l'utilisation de nonces pour les scripts inline
    const csp = process.env.NODE_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    
    response.headers.set('Content-Security-Policy', csp)
    
    // X-Content-Type-Options - Empêche le MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // X-Frame-Options - Protection contre le clickjacking
    response.headers.set('X-Frame-Options', 'DENY')
    
    // X-XSS-Protection (legacy mais toujours utile)
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Referrer-Policy - Contrôle des informations de référent
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Permissions-Policy - Désactive certaines fonctionnalités non nécessaires
    response.headers.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
    )
  }

  return response
}

export const config = {
  // Matcher pour toutes les routes (nécessaire pour la redirection HTTPS)
  // Sauf les fichiers statiques (.ico, .png, .jpg, etc.)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}


