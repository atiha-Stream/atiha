'use client'

import { useState, useEffect } from 'react'
import { Movie, Series } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { ReviewsService } from '@/lib/reviews-service'
import OptimizedImage from './OptimizedImage'
import Link from 'next/link'
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

interface SearchResultsPopupProps {
  query: string
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  movies: Movie[]
  series: Series[]
  total: number
}

export default function SearchResultsPopup({ query, isOpen, onClose }: SearchResultsPopupProps) {
  const [results, setResults] = useState<SearchResult>({ movies: [], series: [], total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fonction pour obtenir le rating basé sur les avis
  const getContentRating = (contentId: string) => {
    const stats = ReviewsService.getReviewStats(contentId)
    return stats.averageRating || 0
  }

  // Effectuer la recherche
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim() || !isOpen) {
        setResults({ movies: [], series: [], total: 0 })
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const [movies, series] = await Promise.all([
          ContentService.getMovies(),
          ContentService.getSeries()
        ])

        const searchTerm = query.toLowerCase()
        
        const filteredMovies = movies.filter(movie => 
          movie.title.toLowerCase().includes(searchTerm) ||
          movie.director.toLowerCase().includes(searchTerm) ||
          movie.cast.some(actor => actor.toLowerCase().includes(searchTerm)) ||
          movie.genre.some(genre => genre.toLowerCase().includes(searchTerm))
        )

        const filteredSeries = series.filter(serie => 
          serie.title.toLowerCase().includes(searchTerm) ||
          serie.director.toLowerCase().includes(searchTerm) ||
          serie.cast.some(actor => actor.toLowerCase().includes(searchTerm)) ||
          serie.genre.some(genre => genre.toLowerCase().includes(searchTerm))
        )

        setResults({
          movies: filteredMovies,
          series: filteredSeries,
          total: filteredMovies.length + filteredSeries.length
        })
      } catch (error) {
        logger.error('Erreur de recherche', error as Error)
        setError('Erreur lors de la recherche')
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [query, isOpen])

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative bg-dark-200 rounded-xl shadow-2xl border border-gray-600 w-[98vw] max-w-none max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Résultats de recherche
            </h2>
            <p className="text-gray-400 mt-1">
              {query ? `Recherche pour &quot;${query}&quot;` : 'Aucune recherche effectuée'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">Veuillez entrer un terme de recherche</p>
            </div>
          ) : results.total === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">Aucun résultat trouvé pour &quot;{query}&quot;</p>
              <p className="text-gray-500 text-sm mt-2">Essayez avec d&apos;autres mots-clés</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Films */}
              {results.movies.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Films ({results.movies.length})
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {results.movies.map((movie) => (
                      <Link 
                        key={movie.id} 
                        href={`/content/${movie.id}`}
                        className="group cursor-pointer"
                        onClick={onClose}
                      >
                        <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          <OptimizedImage
                            src={movie.posterUrl || '/placeholder-movie.jpg'}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            width={200}
                            height={300}
                          />
                        </div>
                        <div className="mt-2">
                          <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                            <span>{movie.year}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-3 h-3 text-yellow-400" />
                              <span>{getContentRating(movie.id)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Séries */}
              {results.series.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Séries ({results.series.length})
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {results.series.map((serie) => (
                      <Link 
                        key={serie.id} 
                        href={`/content/${serie.id}`}
                        className="group cursor-pointer"
                        onClick={onClose}
                      >
                        <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          <OptimizedImage
                            src={serie.posterUrl || '/placeholder-series.jpg'}
                            alt={serie.title}
                            className="w-full h-full object-cover"
                            width={200}
                            height={300}
                          />
                        </div>
                        <div className="mt-2">
                          <h4 className="text-white font-medium text-sm truncate">{serie.title}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                            <span>{serie.year}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-3 h-3 text-yellow-400" />
                              <span>{getContentRating(serie.id)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
