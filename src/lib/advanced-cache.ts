/**
 * Système de cache avancé avec TTL, compression et invalidation intelligente
 */

import { logger } from './logger'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  compressed?: boolean
}

interface CacheOptions {
  ttl?: number // Time to live en millisecondes
  maxSize?: number // Taille maximale du cache
  compression?: boolean // Activer la compression
  persist?: boolean // Persister dans localStorage
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  memoryUsage: number
  hitRate: number
}

export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0
  }
  private options: Required<CacheOptions>
  private storageKey: string

  constructor(
    private name: string,
    options: CacheOptions = {}
  ) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes par défaut
      maxSize: options.maxSize || 100,
      compression: options.compression || false,
      persist: options.persist || false
    }
    
    this.storageKey = `atiha_cache_${name}`
    
    if (this.options.persist) {
      this.loadFromStorage()
    }
    
    // Nettoyage automatique toutes les minutes
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * Récupère une valeur du cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Vérifier si l&apos;item a expiré
    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Mettre à jour les statistiques d&apos;accès
    item.accessCount++
    item.lastAccessed = Date.now()
    this.stats.hits++
    this.updateHitRate()

    // Décompresser si nécessaire
    if (item.compressed) {
      try {
        return this.decompress(item.data as string) as T
      } catch (error) {
        logger.error('Erreur de décompression', error as Error)
        this.cache.delete(key)
        return null
      }
    }

    return item.data
  }

  /**
   * Stocke une valeur dans le cache
   */
  set(key: string, value: T, customTtl?: number): void {
    // Vérifier la taille maximale
    if (this.cache.size >= this.options.maxSize) {
      this.evictLeastUsed()
    }

    let dataToStore = value
    let compressed = false

    // Compression si activée
    if (this.options.compression && typeof value === 'string') {
      try {
        dataToStore = this.compress(value) as T
        compressed = true
      } catch (error) {
        logger.error('Erreur de compression', error as Error)
      }
    }

    const item: CacheItem<T> = {
      data: dataToStore,
      timestamp: Date.now(),
      ttl: customTtl || this.options.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      compressed
    }

    this.cache.set(key, item)
    this.updateStats()

    // Persister si activé
    if (this.options.persist) {
      this.saveToStorage()
    }
  }

  /**
   * Supprime une clé du cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateStats()
      if (this.options.persist) {
        this.saveToStorage()
      }
    }
    return deleted
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear()
    this.updateStats()
    if (this.options.persist) {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    return item ? !this.isExpired(item) : false
  }

  /**
   * Récupère ou calcule une valeur avec une fonction
   */
  async getOrSet(key: string, fetcher: () => Promise<T>, customTtl?: number): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    try {
      const value = await fetcher()
      this.set(key, value, customTtl)
      return value
    } catch (error) {
      logger.error('Erreur lors du fetch', error as Error)
      throw error
    }
  }

  /**
   * Invalide le cache basé sur un pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    if (count > 0) {
      this.updateStats()
      if (this.options.persist) {
        this.saveToStorage()
      }
    }

    return count
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Récupère les clés du cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Récupère la taille du cache
   */
  size(): number {
    return this.cache.size
  }

  // Méthodes privées

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl
  }

  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastUsedScore = Infinity

    for (const [key, item] of this.cache.entries()) {
      // Score basé sur l&apos;accès et l'âge
      const age = Date.now() - item.timestamp
      const score = item.accessCount / (age / 1000) // Accès par seconde

      if (score < leastUsedScore) {
        leastUsedScore = score
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.updateStats()
      if (this.options.persist) {
        this.saveToStorage()
      }
    }
  }

  private updateStats(): void {
    this.stats.size = this.cache.size
    this.stats.memoryUsage = this.estimateMemoryUsage()
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  private estimateMemoryUsage(): number {
    let usage = 0
    for (const [key, item] of this.cache.entries()) {
      usage += key.length * 2 // UTF-16
      usage += JSON.stringify(item).length * 2
    }
    return usage
  }

  private compress(data: string): string {
    // Compression simple avec LZ-string (vous pouvez utiliser une vraie librairie)
    return btoa(data)
  }

  private decompress(data: string): string {
    try {
      return atob(data)
    } catch {
      return data
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      logger.error('Erreur de sauvegarde du cache', error as Error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored) as [string, CacheItem<T>][]
        this.cache = new Map(data)
        this.updateStats()
      }
    } catch (error) {
      console.error('Erreur de chargement du cache:', error)
    }
  }
}

// Instances de cache spécialisées
export const apiCache = new AdvancedCache('api', {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  compression: true,
  persist: false
})

export const imageCache = new AdvancedCache('images', {
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 500,
  compression: false,
  persist: true
})

// Cache optimisé pour les données de contenu
export const contentCache = new AdvancedCache('content', {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 2000,
  compression: true,
  persist: true
})

// Cache pour les données utilisateur (plus long)
export const userCache = new AdvancedCache('user', {
  ttl: 60 * 60 * 1000, // 1 heure
  maxSize: 500,
  compression: true,
  persist: true
})

// Cache pour les données admin (très long)
export const adminCache = new AdvancedCache('admin', {
  ttl: 2 * 60 * 60 * 1000, // 2 heures
  maxSize: 1000,
  compression: true,
  persist: true
})

// Utilitaires de cache
export const cacheUtils = {
  /**
   * Invalide tous les caches liés à un utilisateur
   */
  invalidateUserCaches(userId: string): void {
    userCache.invalidatePattern(`user_${userId}`)
    contentCache.invalidatePattern(`user_${userId}`)
  },

  /**
   * Invalide tous les caches liés à un contenu
   */
  invalidateContentCaches(contentId: string): void {
    contentCache.invalidatePattern(`content_${contentId}`)
    imageCache.invalidatePattern(`content_${contentId}`)
  },

  /**
   * Nettoie tous les caches expirés
   */
  cleanupAllCaches(): void {
    contentCache.clear()
    userCache.clear()
    apiCache.clear()
    imageCache.clear()
  },

  /**
   * Récupère les statistiques de tous les caches
   */
  getAllStats(): Record<string, CacheStats> {
    return {
      content: contentCache.getStats(),
      user: userCache.getStats(),
      api: apiCache.getStats(),
      image: imageCache.getStats(),
      admin: adminCache.getStats()
    }
  },

  /**
   * Invalide tous les caches admin
   */
  invalidateAdminCaches(): void {
    adminCache.clear()
    apiCache.invalidatePattern('admin_')
  },

  /**
   * Préchauffe le cache avec des données importantes
   */
  async prewarmCache(): Promise<void> {
    try {
      // Précharger les données critiques
      const criticalData = [
        'homepage_content',
        'featured_movies',
        'featured_series',
        'user_preferences',
        'genres_list',
        'countries_list',
        'admin_permissions',
        'subscription_plans'
      ]

      for (const key of criticalData) {
        if (!contentCache.has(key)) {
          // Simuler le chargement des données critiques
          contentCache.set(key, { 
            preloaded: true, 
            timestamp: Date.now(),
            priority: 'high'
          })
        }
      }
      
      // Précharger les images critiques
      const criticalImages = [
        '/placeholder-video.jpg',
        '/placeholder-campaign.jpg'
      ]
      
      for (const imageUrl of criticalImages) {
        if (!imageCache.has(imageUrl)) {
          imageCache.set(imageUrl, { 
            preloaded: true, 
            timestamp: Date.now(),
            priority: 'high'
          })
        }
      }
    } catch (error) {
      console.warn('Erreur lors du préchauffage du cache:', error)
    }
  }
}
