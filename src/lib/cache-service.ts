'use client'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export class CacheService {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private static cache = new Map<string, CacheEntry<any>>()

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Vérifier si l&apos;entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  static has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Vérifier si l&apos;entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  static delete(key: string): boolean {
    return this.cache.delete(key)
  }

  static clear(): void {
    this.cache.clear()
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // Méthodes utilitaires pour des cas d&apos;usage spécifiques
  static async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  static invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Cache spécialisé pour les contenus
export class ContentCache {
  private static readonly MOVIES_KEY = 'movies'
  private static readonly SERIES_KEY = 'series'
  private static readonly CONTENT_TTL = 10 * 60 * 1000 // 10 minutes

  static async getMovies() {
    return CacheService.getOrSet(
      this.MOVIES_KEY,
      async () => {
        const { ContentService } = await import('@/lib/content-service')
        return ContentService.getMovies()
      },
      this.CONTENT_TTL
    )
  }

  static async getSeries() {
    return CacheService.getOrSet(
      this.SERIES_KEY,
      async () => {
        const { ContentService } = await import('@/lib/content-service')
        return ContentService.getSeries()
      },
      this.CONTENT_TTL
    )
  }

  static invalidateContent(): void {
    CacheService.delete(this.MOVIES_KEY)
    CacheService.delete(this.SERIES_KEY)
  }

  static invalidateContentById(id: string): void {
    // Invalider le cache général si un contenu spécifique est modifié
    this.invalidateContent()
  }
}

// Cache pour les profils utilisateur
export class UserCache {
  private static readonly PROFILE_PREFIX = 'user_profile_'
  private static readonly PROFILE_TTL = 15 * 60 * 1000 // 15 minutes

  static async getUserProfile(userId: string) {
    return CacheService.getOrSet(
      `${this.PROFILE_PREFIX}${userId}`,
      async () => {
        const { UserProfileService } = await import('@/lib/user-profile-service')
        return UserProfileService.getUserProfile(userId)
      },
      this.PROFILE_TTL
    )
  }

  static invalidateUserProfile(userId: string): void {
    CacheService.delete(`${this.PROFILE_PREFIX}${userId}`)
  }

  static invalidateAllUserProfiles(): void {
    CacheService.invalidatePattern(this.PROFILE_PREFIX)
  }
}

// Hook pour utiliser le cache dans les composants React
export function useCache<T>(key: string, fetcher: () => Promise<T>, ttl?: number) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await CacheService.getOrSet(key, fetcher, ttl)
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [key, ttl])

  const refetch = React.useCallback(async () => {
    CacheService.delete(key)
    const result = await CacheService.getOrSet(key, fetcher, ttl)
    setData(result)
  }, [key, fetcher, ttl])

  return { data, loading, error, refetch }
}

// Import React pour le hook
import React from 'react'


