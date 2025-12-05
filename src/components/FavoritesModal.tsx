'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline'
import { useWatchlist } from '@/hooks/useWatchlist'
import { ContentService } from '@/lib/content-service'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OptimizedImage from './OptimizedImage'
import { Movie, Series } from '@/types/content'
import { ReviewsService } from '@/lib/reviews-service'
import ExpandableCardSection from './ExpandableCardSection'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { logger } from '@/lib/logger'

interface FavoritesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FavoritesModal({ isOpen, onClose }: FavoritesModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const [favorites, setFavorites] = useState<(Movie | Series)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [columnsPerRow, setColumnsPerRow] = useState(8)
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const cardElementsRef = useRef<Map<string, HTMLElement>>(new Map())
  // Ref pour éviter le double déclenchement sur mobile (touch + click)
  const touchHandledRef = useRef<boolean>(false)
  
  // Utiliser le hook useWatchlist (les favoris sont la watchlist dans cette app)
  const { watchlist, loading: watchlistLoading } = useWatchlist(user?.id || null)

  useEffect(() => {
    setIsClient(true)
    setHomepageContent(HomepageContentService.getContent())
    
    // Calculer le nombre de colonnes selon la taille d'écran
    const checkColumns = () => {
      const width = window.innerWidth
      if (width >= 1280) setColumnsPerRow(8) // xl
      else if (width >= 1024) setColumnsPerRow(6) // lg
      else if (width >= 768) setColumnsPerRow(5)  // md
      else if (width >= 640) setColumnsPerRow(4)  // sm
      else setColumnsPerRow(3) // mobile
    }
    checkColumns()
    window.addEventListener('resize', checkColumns)
    
    return () => {
      window.removeEventListener('resize', checkColumns)
    }
  }, [])


  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Empêcher le scroll du body quand le modal est ouvert
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Charger les détails des contenus pour chaque élément de la watchlist
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user || watchlist.length === 0) {
        setFavorites([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Charger tous les films et séries en parallèle une seule fois
        const [movies, series] = await Promise.all([
          ContentService.getMovies(),
          ContentService.getSeries()
        ])
        
        // Créer des Maps pour une recherche rapide O(1) au lieu de O(n)
        const moviesMap = new Map(movies.map(m => [m.id, m]))
        const seriesMap = new Map(series.map(s => [s.id, s]))
        
        // Trouver les contenus favoris rapidement
        const favoritesData: (Movie | Series)[] = []
        
        for (const entry of watchlist) {
          const content = entry.contentType === 'movie' 
            ? moviesMap.get(entry.contentId)
            : seriesMap.get(entry.contentId)
          
          if (content) {
            favoritesData.push(content)
          }
        }
        
        setFavorites(favoritesData)
      } catch (error) {
        logger.error('Error loading favorites', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!watchlistLoading && watchlist.length >= 0) {
      loadFavorites()
    }
  }, [watchlist, watchlistLoading, user])

  const handleContentClick = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    // Si on vient d'un événement touch, ignorer le click
    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }
    
    if (content.trailerUrl) {
      e.preventDefault()
      e.stopPropagation()
      // Toggle: si la carte est déjà ouverte, la fermer, sinon l'ouvrir
      if (expandedCardId === content.id) {
        setExpandedCardId(null)
      } else {
        setExpandedCardId(content.id)
      }
    }
    // Si pas de trailerUrl, on laisse la navigation normale se faire
  }

  const handleContentTouch = (content: Movie | Series, e: React.TouchEvent<HTMLElement>) => {
    if (content.trailerUrl) {
      e.preventDefault()
      e.stopPropagation()
      // Marquer qu'on a géré le touch pour éviter le double déclenchement
      touchHandledRef.current = true
      // Toggle: si la carte est déjà ouverte, la fermer, sinon l'ouvrir
      if (expandedCardId === content.id) {
        setExpandedCardId(null)
      } else {
        setExpandedCardId(content.id)
      }
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        touchHandledRef.current = false
      }, 300)
    }
  }

  // Fonction pour calculer si on est à la fin d'une rangée
  const isEndOfRow = (index: number) => {
    return (index + 1) % columnsPerRow === 0
  }

  // Fonction pour calculer si on est au début d'une rangée
  const isStartOfRow = (index: number) => {
    return index % columnsPerRow === 0
  }

  // Fonction pour vérifier si on doit afficher la section extensible avant cette carte (en haut de la rangée)
  const shouldShowExpandableBefore = (index: number) => {
    if (!expandedCardId) return false
    const clickedIndex = favorites.findIndex(m => m.id === expandedCardId)
    if (clickedIndex === -1) return false
    
    const clickedRow = Math.floor(clickedIndex / columnsPerRow)
    const currentRow = Math.floor(index / columnsPerRow)
    const totalRows = Math.ceil(favorites.length / columnsPerRow)
    
    // Si la carte cliquée est dans la dernière rangée, afficher en haut de la rangée
    if (clickedRow === totalRows - 1 && currentRow === clickedRow && isStartOfRow(index)) {
      return true
    }
    return false
  }

  // Fonction pour vérifier si on doit afficher la section extensible après cette carte (en bas de la rangée)
  const shouldShowExpandableAfter = (index: number) => {
    if (!expandedCardId) return false
    const clickedIndex = favorites.findIndex(m => m.id === expandedCardId)
    if (clickedIndex === -1) return false
    
    const clickedRow = Math.floor(clickedIndex / columnsPerRow)
    const currentRow = Math.floor(index / columnsPerRow)
    const totalRows = Math.ceil(favorites.length / columnsPerRow)
    
    // Si la carte cliquée n'est pas dans la dernière rangée, afficher à la fin de la rangée
    if (clickedRow < totalRows - 1 && currentRow === clickedRow && isEndOfRow(index)) {
      return true
    }
    return false
  }

  const handleContentMouseEnter = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    cardElementsRef.current.set(content.id, e.currentTarget as HTMLElement)
  }

  const handleContentMouseLeave = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    cardElementsRef.current.delete(content.id)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Mes Favoris"
    >
      {/* Header avec bouton retour */}
      <div className="flex items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-800 bg-dark-300 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2.5 sm:p-3 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          aria-label="Fermer les favoris"
        >
          <ArrowLeftIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
        </button>
      </div>

      {/* Content avec scroll */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
          {/* Titre */}
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-5 md:mb-6">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
            >
              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Mes Favoris</h1>
            {favorites.length > 0 && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 text-gray-300 text-base sm:text-lg md:text-xl font-medium rounded-full">
                {favorites.length}
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-b-2 border-primary-500"></div>
              <p className="text-gray-400 ml-4 text-base sm:text-lg md:text-xl">Chargement de vos favoris...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 sm:py-24 md:py-32">
              <HeartIcon className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 text-gray-400 mx-auto mb-6 sm:mb-8" />
              <p className="text-gray-300 text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-5 font-medium">Votre liste de favoris est vide</p>
              <p className="text-gray-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-10">
                Ajoutez des contenus à vos favoris pour les retrouver facilement
              </p>
              <button
                onClick={onClose}
                className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg md:text-xl text-white rounded-lg transition-colors font-semibold min-h-[44px]"
                style={isClient ? { 
                  backgroundColor: homepageContent.appIdentity.colors.primary,
                  '--hover-color': homepageContent.appIdentity.colors.secondary
                } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
                onMouseEnter={(e) => {
                  if (isClient) {
                    e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.secondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClient) {
                    e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.primary
                  }
                }}
              >
                Découvrir du contenu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5 md:gap-6 lg:gap-6 auto-rows-min">
              {favorites.map((item, index) => {
                const clickedItem = expandedCardId ? favorites.find(m => m.id === expandedCardId) : null
                return (
                  <React.Fragment key={item.id}>
                    {/* Afficher la section extensible avant la première carte de la rangée si c'est la dernière rangée */}
                    {shouldShowExpandableBefore(index) && clickedItem && (
                      <ExpandableCardSection
                        content={clickedItem}
                        isOpen={expandedCardId === clickedItem.id}
                        onClose={() => setExpandedCardId(null)}
                      />
                    )}
                    <Link
                      href={`/content/${item.id}`}
                      className="group cursor-pointer"
                      style={isClient ? { 
                        outline: 'none'
                      } as React.CSSProperties : {}}
                      onMouseEnter={(e) => handleContentMouseEnter(item, e)}
                      onMouseLeave={(e) => handleContentMouseLeave(item, e)}
                      onClick={(e) => handleContentClick(item, e)}
                      onTouchEnd={(e) => handleContentTouch(item, e)}
                    >
                  <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <OptimizedImage
                      src={item.posterUrl || '/placeholder-video.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      width={200}
                      height={300}
                    />
                  </div>
                  <div className="mt-2 sm:mt-2.5">
                    <h3 className="text-white font-medium text-base sm:text-lg md:text-xl truncate mb-1">{item.title}</h3>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base text-gray-400">
                      <span>{item.year}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span>
                          {(() => {
                            const stats = ReviewsService.getReviewStats(item.id)
                            return stats.averageRating > 0
                              ? `${stats.averageRating.toFixed(1)}`
                              : 'N/A'
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Afficher la section extensible après la dernière carte de la rangée si ce n'est pas la dernière rangée */}
                {shouldShowExpandableAfter(index) && clickedItem && (
                  <ExpandableCardSection
                    content={clickedItem}
                    isOpen={expandedCardId === clickedItem.id}
                    onClose={() => setExpandedCardId(null)}
                  />
                )}
              </React.Fragment>
            )
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

