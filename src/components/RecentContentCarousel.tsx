'use client'

import { useState, useEffect, useRef } from 'react'
import { Movie, Series } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

interface RecentContentCarouselProps {
  excludeId?: string
  limit?: number
}

export default function RecentContentCarousel({ excludeId, limit = 10 }: RecentContentCarouselProps) {
  const [content, setContent] = useState<(Movie | Series)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        const allContent = ContentService.getAllContent()
        
        // Filtrer le contenu exclu et trier par date de création (plus récent en premier)
        const filtered = allContent
          .filter(item => item.id !== excludeId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
        
        setContent(filtered)
      } catch (error) {
        logger.error('Error loading recent content', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [excludeId, limit])

  const scroll = (direction: 'left' | 'right') => {
    const container = carouselRef.current
    if (!container) return

    const scrollAmount = 300
    const currentScroll = container.scrollLeft
    const newPosition = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount
    
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    })
  }

  // Mettre à jour la position du scroll et vérifier si on peut scroller
  useEffect(() => {
    const container = carouselRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScroll = container.scrollLeft
      const maxScroll = container.scrollWidth - container.clientWidth
      setScrollPosition(currentScroll)
      setCanScrollRight(currentScroll < maxScroll - 10)
    }

    // Vérifier au chargement
    handleScroll()

    container.addEventListener('scroll', handleScroll)
    // Vérifier aussi lors du redimensionnement
    window.addEventListener('resize', handleScroll)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [content])

  // Auto-scroll toutes les 3 secondes
  useEffect(() => {
    if (isLoading || content.length === 0) return

    const interval = setInterval(() => {
      const container = carouselRef.current
      if (!container) return

      const currentScroll = container.scrollLeft
      const maxScroll = container.scrollWidth - container.clientWidth

      if (currentScroll < maxScroll - 10) {
        // Scroller à droite
        const scrollAmount = 300
        const newPosition = currentScroll + scrollAmount
        container.scrollTo({
          left: newPosition,
          behavior: 'smooth'
        })
      } else {
        // Revenir au début
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        })
      }
    }, 3000) // 3 secondes

    return () => clearInterval(interval)
  }, [content, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Aucun contenu récent disponible</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Bouton gauche */}
      {scrollPosition > 0 && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
          aria-label="Faire défiler vers la gauche"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* Carrousel */}
      <div
        ref={carouselRef}
        id="recent-content-carousel"
        className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {content.map((item) => (
          <Link
            key={item.id}
            href={`/content/${item.id}/p`}
            className="flex-shrink-0 w-48 group"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <Image
                src={item.posterUrl || '/placeholder-poster.jpg'}
                alt={item.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-xs mt-1">{item.year}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bouton droit */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
          aria-label="Faire défiler vers la droite"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

