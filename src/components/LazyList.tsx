'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemsPerPage?: number
  threshold?: number
  className?: string
  loadingComponent?: React.ReactNode
  onLoadMore?: () => void
}

export default function LazyList<T>({
  items,
  renderItem,
  itemsPerPage = 10,
  threshold = 0.1,
  className = '',
  loadingComponent,
  onLoadMore
}: LazyListProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Calculer les éléments visibles
  useEffect(() => {
    const endIndex = currentPage * itemsPerPage
    const newVisibleItems = items.slice(0, endIndex)
    setVisibleItems(newVisibleItems)
    setHasMore(endIndex < items.length)
  }, [items, currentPage, itemsPerPage])

  // Observer pour le lazy loading
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading) {
            loadMore()
          }
        })
      },
      {
        threshold
      }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, threshold])

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    // Simuler un délai pour l&apos;effet de chargement
    setTimeout(() => {
      setCurrentPage(prev => prev + 1)
      setIsLoading(false)
      onLoadMore?.()
    }, 300)
  }, [isLoading, hasMore, onLoadMore])

  const defaultLoadingComponent = (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  )

  return (
    <div className={className}>
      {/* Éléments visibles */}
      {visibleItems.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}

      {/* Trigger pour charger plus */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-4">
          {isLoading && (loadingComponent || defaultLoadingComponent)}
        </div>
      )}

      {/* Message de fin */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>Tous les éléments ont été chargés</p>
        </div>
      )}

      {/* Message si pas d'éléments */}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>Aucun élément à afficher</p>
        </div>
      )}
    </div>
  )
}


