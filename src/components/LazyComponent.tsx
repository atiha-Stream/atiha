'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import { logger } from '@/lib/logger'

interface LazyComponentProps {
  fallback?: React.ReactNode
  delay?: number
}

// Composant de chargement par défaut optimisé
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
)

// HOC pour le lazy loading avec délai
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode,
  delay: number = 200
) {
  const LazyComponent = lazy(importFunc)
  
  return function LazyWrapper(props: T & LazyComponentProps) {
    const { fallback: propFallback, delay: propDelay, ...componentProps } = props
    
    return (
      <Suspense fallback={propFallback || fallback || <DefaultFallback />}>
        <LazyComponent {...(componentProps as any)} />
      </Suspense>
    )
  }
}

// Hook pour le lazy loading avec intersection observer
export function useLazyComponent<T>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: {
    threshold?: number
    rootMargin?: string
    delay?: number
  } = {}
) {
  const [Component, setComponent] = React.useState<ComponentType<T> | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const {
    threshold = 0.1,
    rootMargin = '50px',
    delay = 0
  } = options

  React.useEffect(() => {
    const element = ref.current
    if (!element || Component || isLoading) return

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsLoading(true)
          
          // Délai optionnel avant le chargement
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }

          try {
            const importedModule = await importFunc()
            setComponent(() => importedModule.default)
          } catch (error) {
            logger.error('Error loading component', error as Error)
            setHasError(true)
          } finally {
            setIsLoading(false)
          }
          
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [importFunc, Component, isLoading, threshold, rootMargin, delay])

  return {
    ref,
    Component,
    isLoading,
    hasError
  }
}

// Composant wrapper pour le lazy loading
export function LazyWrapper({ 
  children, 
  fallback = <DefaultFallback />,
  className = ''
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  )
}
