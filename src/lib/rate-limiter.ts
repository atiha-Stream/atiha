/**
 * Rate Limiter utilisant Redis
 * Protège contre les attaques par force brute et les abus
 */

import { getRedisClient, isRedisAvailable } from './redis'
import { logger } from './logger'

interface RateLimitOptions {
  windowMs: number // Fenêtre de temps en millisecondes
  maxRequests: number // Nombre maximum de requêtes
  keyPrefix?: string // Préfixe pour la clé Redis
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Vérifie si une requête est autorisée selon les limites de taux
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, keyPrefix = 'rate_limit' } = options

  // Si Redis n'est pas disponible, autoriser la requête (fallback)
  if (!isRedisAvailable()) {
    logger.warn('Redis not available, rate limiting disabled')
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
    }
  }

  try {
    const redis = getRedisClient()
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - windowMs

    // Utiliser une transaction Redis pour garantir la cohérence
    const pipeline = redis.pipeline()
    
    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, 0, windowStart)
    
    // Compter les requêtes dans la fenêtre
    pipeline.zcard(key)
    
    // Ajouter la requête actuelle
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    
    // Définir l'expiration de la clé
    pipeline.expire(key, Math.ceil(windowMs / 1000))
    
    const results = await pipeline.exec()

    if (!results) {
      throw new Error('Redis pipeline execution failed')
    }

    const count = results[1]?.[1] as number || 0
    const allowed = count < maxRequests
    const remaining = Math.max(0, maxRequests - count - 1)
    const resetTime = now + windowMs

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count,
        maxRequests,
        windowMs,
      })
    }

    return {
      allowed,
      remaining,
      resetTime,
    }
  } catch (error) {
    logger.error('Erreur lors de la vérification du rate limit', error as Error)
    // En cas d'erreur, autoriser la requête (fail-open)
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
    }
  }
}

/**
 * Rate limiter pour les tentatives de connexion
 */
export async function checkLoginRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, {
    windowMs,
    maxRequests: maxAttempts,
    keyPrefix: 'login_rate_limit',
  })
}

/**
 * Rate limiter pour les API routes
 */
export async function checkAPIRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, {
    windowMs,
    maxRequests,
    keyPrefix: 'api_rate_limit',
  })
}

/**
 * Rate limiter pour les requêtes admin
 */
export async function checkAdminRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, {
    windowMs,
    maxRequests,
    keyPrefix: 'admin_rate_limit',
  })
}

