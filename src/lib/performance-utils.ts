// Utilitaires pour l'optimisation des performances

import { logger } from './logger'

// Préchargement des ressources critiques
export class ResourcePreloader {
  private static preloadedResources = new Set<string>()
  
  static async preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) return
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.preloadedResources.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }
  
  static async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.preloadImage(url))
    await Promise.allSettled(promises)
  }
  
  static async preloadRoute(route: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      // Précharger la route avec Next.js
      const { default: dynamicImport } = await import('next/dynamic')
      // Cette approche dépend de la structure de votre application
      logger.debug(`Préchargement de la route: ${route}`)
    } catch (error) {
      logger.warn(`Erreur lors du préchargement de ${route}`, { error })
    }
  }
  
  static async preloadCriticalData(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      // Précharger les données critiques
      const criticalData = [
        'homepage_content',
        'featured_movies',
        'featured_series',
        'user_preferences'
      ]
      
      // Simuler le chargement des données critiques
      for (const key of criticalData) {
        const cached = localStorage.getItem(key)
        if (!cached) {
          // Précharger les données si elles ne sont pas en cache
          localStorage.setItem(key, JSON.stringify({ preloaded: true, timestamp: Date.now() }))
        }
      }
    } catch (error) {
      logger.warn('Erreur lors du préchargement des données critiques', { error })
    }
  }
}

// Optimisation des bundles
export class BundleOptimizer {
  private static loadedChunks = new Set<string>()
  
  static async loadChunk(chunkName: string): Promise<any> {
    if (this.loadedChunks.has(chunkName)) {
      return Promise.resolve()
    }
    
    try {
      // Chargement dynamique du chunk
      const chunk = await import(`../components/${chunkName}`)
      this.loadedChunks.add(chunkName)
      return chunk
    } catch (error) {
      logger.warn(`Erreur lors du chargement du chunk ${chunkName}`, error as Error)
      throw error
    }
  }
  
  static async preloadChunks(chunkNames: string[]): Promise<void> {
    const promises = chunkNames.map(name => this.loadChunk(name))
    await Promise.allSettled(promises)
  }
  
  static getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks)
  }
}

// Optimisation des animations
export class AnimationOptimizer {
  private static animationFrameId: number | null = null
  private static pendingAnimations = new Set<() => void>()
  
  static scheduleAnimation(callback: () => void): void {
    this.pendingAnimations.add(callback)
    
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.pendingAnimations.forEach(animation => animation())
        this.pendingAnimations.clear()
        this.animationFrameId = null
      })
    }
  }
  
  static cancelAnimation(callback: () => void): void {
    this.pendingAnimations.delete(callback)
  }
  
  static cancelAllAnimations(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.pendingAnimations.clear()
  }
}

// Optimisation du localStorage
export class StorageOptimizer {
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly CLEANUP_THRESHOLD = 0.8 // 80% de la taille max
  
  static getStorageSize(): number {
    if (typeof window === 'undefined') return 0
    
    let totalSize = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    return totalSize
  }
  
  static needsCleanup(): boolean {
    const currentSize = this.getStorageSize()
    return currentSize > (this.MAX_STORAGE_SIZE * this.CLEANUP_THRESHOLD)
  }
  
  static cleanupOldData(): void {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage)
    const dataWithTimestamps = keys
      .map(key => ({
        key,
        data: localStorage.getItem(key),
        timestamp: this.extractTimestamp(localStorage.getItem(key))
      }))
      .filter(item => item.timestamp !== null)
      .sort((a, b) => (a.timestamp as number) - (b.timestamp as number))
    
    // Supprimer les 20% les plus anciens
    const itemsToRemove = Math.floor(dataWithTimestamps.length * 0.2)
    for (let i = 0; i < itemsToRemove; i++) {
      localStorage.removeItem(dataWithTimestamps[i].key)
    }
  }
  
  private static extractTimestamp(data: string | null): number | null {
    if (!data) return null
    
    try {
      const parsed = JSON.parse(data)
      return parsed.timestamp || parsed.createdAt || null
    } catch {
      return null
    }
  }
  
  static optimizeStorage(): void {
    if (this.needsCleanup()) {
      this.cleanupOldData()
    }
  }
}

// Optimisation des requêtes
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  
  static async optimizeQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    try {
      const data = await queryFn()
      this.queryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
      return data
    } catch (error) {
      logger.error(`Erreur lors de l'exécution de la requête ${key}`, error as Error)
      throw error
    }
  }
  
  static invalidateQuery(key: string): void {
    this.queryCache.delete(key)
  }
  
  static invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.queryCache.keys()) {
      if (regex.test(key)) {
        this.queryCache.delete(key)
      }
    }
  }
  
  static clearCache(): void {
    this.queryCache.clear()
  }
}

// Optimisation des composants React
export class ReactOptimizer {
  private static componentCache = new Map<string, any>()
  
  static memoizeComponent<T extends React.ComponentType<any>>(
    Component: T,
    displayName?: string
  ): T {
    const MemoizedComponent = React.memo(Component) as unknown as T
    if (displayName) {
      MemoizedComponent.displayName = displayName
    }
    return MemoizedComponent
  }
  
  // Note: Ces méthodes utilisent des hooks React qui ne peuvent pas être appelées dans des méthodes statiques de classe
  // Elles sont conservées pour compatibilité mais doivent être utilisées dans des composants fonctionnels React
  static createOptimizedCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ): T {
    // Ces méthodes ne doivent pas être utilisées dans des contextes statiques
    // Utilisez useCallback directement dans vos composants
    return callback as T
  }
  
  static createOptimizedMemo<T>(
    factory: () => T,
    deps: React.DependencyList
  ): T {
    // Ces méthodes ne doivent pas être utilisées dans des contextes statiques
    // Utilisez useMemo directement dans vos composants
    return factory() as T
  }
}

// Hook pour les performances
export function usePerformanceMetrics(componentName: string) {
  const [metrics, setMetrics] = React.useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  })
  
  const renderTimes = React.useRef<number[]>([])
  
  React.useEffect(() => {
    const now = Date.now()
    renderTimes.current.push(now)
    
    // Garder seulement les 10 derniers rendus
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10)
    }
    
    const averageTime = renderTimes.current.length > 1
      ? renderTimes.current.reduce((acc, time, index) => {
          if (index === 0) return 0
          return acc + (time - renderTimes.current[index - 1])
        }, 0) / (renderTimes.current.length - 1)
      : 0
    
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: now,
      averageRenderTime: averageTime
    }))
  })
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, metrics)
    }
  }, [componentName, metrics])
  
  return metrics
}

// Import React pour les hooks
import React from 'react'
