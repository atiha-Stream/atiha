/**
 * Client Redis pour rate limiting et stockage de sessions
 * Singleton pour réutiliser la connexion
 */

import './redis-config' // Configurer REDIS_URL avant utilisation
import Redis from 'ioredis'
import { logger } from './logger'

let redis: Redis | null = null

/**
 * Obtient ou crée l'instance Redis
 */
export function getRedisClient(): Redis {
  if (redis) {
    return redis
  }

  const redisUrl = process.env.REDIS_URL
  const redisPassword = process.env.REDIS_PASSWORD

  if (!redisUrl && typeof window === 'undefined') {
    logger.warn('REDIS_URL non configuré, Redis ne sera pas disponible')
    // Créer une instance mock pour le développement
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: redisPassword,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries')
          return null
        }
        return Math.min(times * 50, 2000)
      },
      maxRetriesPerRequest: 3,
    })

    redis.on('error', (error) => {
      logger.error('Redis connection error', error)
    })

    redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })
  } else if (redisUrl) {
    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries')
          return null
        }
        return Math.min(times * 50, 2000)
      },
      maxRetriesPerRequest: 3,
    })

    redis.on('error', (error) => {
      logger.error('Redis connection error', error)
    })

    redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })
  } else {
    // Côté client, Redis n'est pas disponible
    logger.debug('Redis not available on client side')
  }

  return redis!
}

/**
 * Vérifie si Redis est disponible
 */
export function isRedisAvailable(): boolean {
  try {
    const client = getRedisClient()
    return client.status === 'ready'
  } catch {
    return false
  }
}

/**
 * Ferme la connexion Redis
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    logger.info('Redis connection closed')
  }
}

