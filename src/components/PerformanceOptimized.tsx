'use client'

import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react'
// @ts-expect-error - lodash types not available
import { debounce, throttle } from 'lodash'
import { logger } from '@/lib/logger'

// Composant optimisé pour les listes longues
interface VirtualizedListProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
}

export const VirtualizedList = memo<VirtualizedListProps>(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  }, [items, itemHeight, containerHeight, scrollTop])
  
  const totalHeight = items.length * itemHeight
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight
  
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }, 16), // 60fps
    []
  )
  
  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// Hook pour le debouncing des recherches
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        const data = await searchFn(searchQuery)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de recherche')
      } finally {
        setIsLoading(false)
      }
    }, delay),
    [searchFn, delay]
  )
  
  useEffect(() => {
    debouncedSearch(query)
    return () => {
      debouncedSearch.cancel()
    }
  }, [query, debouncedSearch])
  
  return {
    query,
    setQuery,
    results,
    isLoading,
    error
  }
}

// Composant optimisé pour les images
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: string
}

export const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  width = 400,
  height = 600,
  className = '',
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PC9zdmc+'
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])
  
  const handleError = useCallback(() => {
    setHasError(true)
  }, [])
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-700 animate-pulse"
          style={{ width, height }}
        />
      )}
      <img
        src={hasError ? placeholder : src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// Hook pour la mémorisation des calculs coûteux
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps)
}

// Hook pour le throttling des événements
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 16
): T {
  return useCallback(
    throttle(callback, delay) as T,
    [callback, delay]
  )
}

// Composant pour le lazy loading avec intersection observer
interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
}

export const LazyLoad = memo<LazyLoadProps>(({
  children,
  fallback = <div className="animate-pulse bg-gray-700 h-32 rounded" />,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    
    observer.observe(element)
    
    return () => observer.disconnect()
  }, [threshold, rootMargin, hasLoaded])
  
  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  )
})

LazyLoad.displayName = 'LazyLoad'

// Hook pour la gestion des performances
export function usePerformanceMonitor(componentName: string) {
  const [renderCount, setRenderCount] = useState(0)
  const [lastRenderTime, setLastRenderTime] = useState<number | null>(null)
  
  useEffect(() => {
    setRenderCount(prev => prev + 1)
    setLastRenderTime(Date.now())
  })
  
  useEffect(() => {
    logger.debug(`[Performance] ${componentName} rendered ${renderCount} times`)
  }, [componentName, renderCount])
  
  return {
    renderCount,
    lastRenderTime
  }
}

// Composant wrapper pour les optimisations de performance
interface PerformanceWrapperProps {
  children: React.ReactNode
  enableVirtualization?: boolean
  enableMemoization?: boolean
  enableLazyLoading?: boolean
  className?: string
}

export const PerformanceWrapper = memo<PerformanceWrapperProps>(({
  children,
  enableVirtualization = false,
  enableMemoization = true,
  enableLazyLoading = false,
  className = ''
}) => {
  const performance = usePerformanceMonitor('PerformanceWrapper')
  
  const memoizedChildren = useMemo(() => {
    if (enableMemoization) {
      return React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { key: `optimized-${index}` })
        }
        return child
      })
    }
    return children
  }, [children, enableMemoization])
  
  if (enableLazyLoading) {
    return (
      <LazyLoad className={className}>
        {memoizedChildren}
      </LazyLoad>
    )
  }
  
  return (
    <div className={className}>
      {memoizedChildren}
    </div>
  )
})

PerformanceWrapper.displayName = 'PerformanceWrapper'
