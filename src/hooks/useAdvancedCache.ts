'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdvancedCache } from '@/lib/advanced-cache'
import { logger } from '@/lib/logger'

interface UseCacheOptions<T> {
  cache: AdvancedCache<T>
  key: string
  fetcher: () => Promise<T>
  ttl?: number
  enabled?: boolean
  staleWhileRevalidate?: boolean
  onError?: (error: Error) => void
}

interface UseCacheResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
  isStale: boolean
}

/**
 * Hook personnalisé pour utiliser le cache avancé avec React
 */
export function useAdvancedCache<T>({
  cache,
  key,
  fetcher,
  ttl,
  enabled = true,
  staleWhileRevalidate = true,
  onError
}: UseCacheOptions<T>): UseCacheResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState(false)
  
  const fetcherRef = useRef(fetcher)
  const onErrorRef = useRef(onError)

  // Mettre à jour les refs
  useEffect(() => {
    fetcherRef.current = fetcher
    onErrorRef.current = onError
  }, [fetcher, onError])

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    try {
      setError(null)
      
      // Vérifier le cache d'abord
      const cachedData = cache.get(key)
      
      if (cachedData && !force) {
        setData(cachedData)
        setIsStale(false)
        
        // Si staleWhileRevalidate est activé, re-fetch en arrière-plan
        if (staleWhileRevalidate) {
          setIsStale(true)
          // Ne pas attendre le re-fetch
          fetcherRef.current()
            .then(newData => {
              cache.set(key, newData, ttl)
              setData(newData)
              setIsStale(false)
            })
            .catch(err => {
              logger.warn('Erreur lors du re-fetch en arrière-plan', err as Error)
              setIsStale(false)
            })
        }
        return
      }

      // Pas de cache ou force refresh
      setIsLoading(true)
      const newData = await fetcherRef.current()
      
      cache.set(key, newData, ttl)
      setData(newData)
      setIsStale(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue')
      setError(error)
      onErrorRef.current?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [cache, key, ttl, enabled, staleWhileRevalidate])

  const refetch = useCallback(() => fetchData(true), [fetchData])
  
  const invalidate = useCallback(() => {
    cache.delete(key)
    setData(null)
    setError(null)
    setIsStale(false)
  }, [cache, key])

  // Chargement initial
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isStale
  }
}

/**
 * Hook spécialisé pour le cache de contenu
 */
export function useContentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Partial<UseCacheOptions<T>> = {}
) {
  const [cacheInstance, setCacheInstance] = useState<AdvancedCache<T> | null>(null)
  const [isCacheLoading, setIsCacheLoading] = useState(true)
  
  useEffect(() => {
    if (!options.cache) {
      import('@/lib/advanced-cache').then(module => {
        setCacheInstance(module.contentCache as AdvancedCache<T>)
        setIsCacheLoading(false)
      })
    } else {
      setCacheInstance(options.cache)
      setIsCacheLoading(false)
    }
  }, [options.cache])
  
  // Créer un cache par défaut si nécessaire pour éviter l'erreur
  const defaultCache = new AdvancedCache<T>('content')
  const cacheResult = useAdvancedCache({
    cache: cacheInstance || defaultCache,
    key: `content_${key}`,
    fetcher,
    ttl: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: true,
    enabled: !isCacheLoading && !!cacheInstance,
    ...options
  })
  
  if (isCacheLoading || !cacheInstance) {
    return {
      data: null,
      isLoading: true,
      error: null,
      refetch: async () => {},
      invalidate: () => {},
      isStale: false
    }
  }
  
  return cacheResult
}

/**
 * Hook spécialisé pour le cache utilisateur
 */
export function useUserCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Partial<UseCacheOptions<T>> = {}
) {
  const [cacheInstance, setCacheInstance] = useState<AdvancedCache<T> | null>(null)
  const [isCacheLoading, setIsCacheLoading] = useState(true)
  
  useEffect(() => {
    if (!options.cache) {
      import('@/lib/advanced-cache').then(module => {
        setCacheInstance(module.userCache as AdvancedCache<T>)
        setIsCacheLoading(false)
      })
    } else {
      setCacheInstance(options.cache)
      setIsCacheLoading(false)
    }
  }, [options.cache])
  
  const defaultCache = new AdvancedCache<T>('user')
  const cacheResult = useAdvancedCache({
    cache: cacheInstance || defaultCache,
    key: `user_${key}`,
    fetcher,
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
    enabled: !isCacheLoading && !!cacheInstance,
    ...options
  })
  
  if (isCacheLoading || !cacheInstance) {
    return {
      data: null,
      isLoading: true,
      error: null,
      refetch: async () => {},
      invalidate: () => {},
      isStale: false
    }
  }
  
  return cacheResult
}

/**
 * Hook spécialisé pour le cache API
 */
export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Partial<UseCacheOptions<T>> = {}
) {
  const [cacheInstance, setCacheInstance] = useState<AdvancedCache<T> | null>(null)
  const [isCacheLoading, setIsCacheLoading] = useState(true)
  
  useEffect(() => {
    if (!options.cache) {
      import('@/lib/advanced-cache').then(module => {
        setCacheInstance(module.apiCache as AdvancedCache<T>)
        setIsCacheLoading(false)
      })
    } else {
      setCacheInstance(options.cache)
      setIsCacheLoading(false)
    }
  }, [options.cache])
  
  const defaultCache = new AdvancedCache<T>('api')
  const cacheResult = useAdvancedCache({
    cache: cacheInstance || defaultCache,
    key: `api_${key}`,
    fetcher,
    ttl: 2 * 60 * 1000, // 2 minutes
    staleWhileRevalidate: false,
    enabled: !isCacheLoading && !!cacheInstance,
    ...options
  })
  
  if (isCacheLoading || !cacheInstance) {
    return {
      data: null,
      isLoading: true,
      error: null,
      refetch: async () => {},
      invalidate: () => {},
      isStale: false
    }
  }
  
  return cacheResult
}

/**
 * Hook pour les statistiques de cache
 */
export function useCacheStats() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    import('@/lib/advanced-cache').then(module => {
      setStats(module.cacheUtils.getAllStats())
    })
  }, [])

  const refreshStats = useCallback(() => {
    import('@/lib/advanced-cache').then(module => {
      setStats(module.cacheUtils.getAllStats())
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshStats, 5000) // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval)
  }, [refreshStats])

  return { stats, refreshStats }
}

/**
 * Hook pour la gestion des erreurs de cache
 */
export function useCacheErrorHandler() {
  const handleError = useCallback((error: Error, context: string) => {
    logger.error(`Erreur de cache dans ${context}`, error)
    
    // Log l'erreur pour monitoring
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cache_error', {
        error_message: error.message,
        context: context
      })
    }
  }, [])

  return { handleError }
}
