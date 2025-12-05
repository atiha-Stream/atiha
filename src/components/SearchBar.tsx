'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Movie, Series } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { ErrorLogger } from '@/lib/error-logger'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { ReviewsService } from '@/lib/reviews-service'
import OptimizedImage from './OptimizedImage'
import SearchResultsPopup from './SearchResultsPopup'
import { logger } from '@/lib/logger'

interface SearchResult {
  movies: Movie[]
  series: Series[]
  total: number
}

interface SearchBarProps {
  onSearchResults?: (results: SearchResult) => void
  onSearchChange?: (query: string) => void
  placeholder?: string
  className?: string
  onFocus?: () => void
  onBlur?: () => void
}

export default function SearchBar({ 
  onSearchResults, 
  onSearchChange,
  placeholder = "Rechercher des films, séries, acteurs...",
  className = "",
  onFocus,
  onBlur
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ movies: [], series: [], total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fonction pour obtenir le rating basé sur les avis
  const getContentRating = (contentId: string) => {
    const stats = ReviewsService.getReviewStats(contentId)
    return stats.averageRating || 0
  }

  // Fonction pour voir tous les résultats
  const handleViewAllResults = () => {
    if (query.trim()) {
      setShowPopup(true) // Ouvrir le popup
      setShowResults(false) // Fermer les résultats de recherche
    }
  }

  // Fermer les résultats quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cache pour les données de contenu (évite de recharger à chaque recherche)
  const contentCacheRef = useRef<{ movies: Movie[]; series: Series[]; timestamp: number } | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Vérifier le cache
      const now = Date.now()
      let allMovies: Movie[]
      let allSeries: Series[]
      
      if (contentCacheRef.current && (now - contentCacheRef.current.timestamp) < CACHE_DURATION) {
        // Utiliser le cache
        allMovies = contentCacheRef.current.movies
        allSeries = contentCacheRef.current.series
      } else {
        // Charger les données et mettre à jour le cache
        allMovies = await ContentService.getMovies()
        allSeries = await ContentService.getSeries()
        contentCacheRef.current = { movies: allMovies, series: allSeries, timestamp: now }
      }
      
      // Recherche par texte
      const searchLower = searchQuery.toLowerCase()
      
      const filteredMovies = allMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchLower) ||
        movie.description.toLowerCase().includes(searchLower) ||
        movie.director.toLowerCase().includes(searchLower) ||
        movie.cast.some(actor => actor.toLowerCase().includes(searchLower)) ||
        movie.genre.some(g => g.toLowerCase().includes(searchLower))
      )

      const filteredSeries = allSeries.filter(series => 
        series.title.toLowerCase().includes(searchLower) ||
        series.description.toLowerCase().includes(searchLower) ||
        series.director.toLowerCase().includes(searchLower) ||
        series.cast.some(actor => actor.toLowerCase().includes(searchLower)) ||
        series.genre.some(g => g.toLowerCase().includes(searchLower))
      )

      const searchResults = {
        movies: filteredMovies,
        series: filteredSeries,
        total: filteredMovies.length + filteredSeries.length
      }

      setResults(searchResults)
      setShowResults(true)
      onSearchResults?.(searchResults)

    } catch (error) {
      logger.error('Erreur lors de la recherche', error as Error)
      
      // Logger l&apos;erreur
      ErrorLogger.log(
        error instanceof Error ? error : new Error('Erreur de recherche'),
        'medium',
        'javascript',
        { query: searchQuery }
      )
      
      setError('Impossible d\'effectuer la recherche. Veuillez réessayer.')
      setResults({ movies: [], series: [], total: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [onSearchResults])

  // Recherche en temps réel optimisée
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim())
      } else {
        setResults({ movies: [], series: [], total: 0 })
        setShowResults(false)
      }
    }, 200) // Délai réduit à 200ms pour une meilleure réactivité

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  const handleInputFocus = () => {
    if (results.total > 0) {
      setShowResults(true)
    }
    onFocus?.()
  }

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur les résultats
    setTimeout(() => {
      onBlur?.()
    }, 200)
  }

  const clearSearch = () => {
    setQuery('')
    setResults({ movies: [], series: [], total: 0 })
    setShowResults(false)
    onSearchChange?.('')
    inputRef.current?.focus()
  }

  const handleContentClick = (content: Movie | Series) => {
    // Fermer les résultats de recherche
    setShowResults(false)
    setQuery('')
    
    // Naviguer vers la page de contenu
    router.push(`/content/${content.id}`)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onSearchChange?.(e.target.value)
          }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 md:py-3.5 lg:py-2.5 text-sm sm:text-base md:text-lg lg:text-base bg-dark-300 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
          placeholder={placeholder}
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-white min-w-[44px] min-h-[44px]"
            aria-label="Effacer la recherche"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5 border-b-2 border-red-500"></div>
          </div>
        )}
      </div>


      {/* Message d&apos;erreur */}
      {showResults && error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-200 border border-red-500/20 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {showResults && !error && results.total > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-200 border border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="text-sm text-gray-400 mb-3">
              {results.total} résultat{results.total > 1 ? 's' : ''} trouvé{results.total > 1 ? 's' : ''}
            </div>
            
            {/* Films */}
            {results.movies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-white font-medium mb-2">Films ({results.movies.length})</h3>
                <div className="space-y-2">
                  {results.movies.slice(0, 5).map((movie) => (
                    <div 
                      key={movie.id} 
                      className="flex items-center space-x-3 p-2 hover:bg-dark-300 rounded cursor-pointer"
                      onClick={() => handleContentClick(movie)}
                    >
                      <OptimizedImage
                        src={movie.posterUrl || '/placeholder-movie.jpg'}
                        alt={movie.title}
                        className="w-12 h-16 object-cover rounded"
                        width={48}
                        height={64}
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{movie.title}</h4>
                        <p className="text-gray-400 text-sm">{movie.year} • {movie.genre.join(', ')}</p>
                        <p className="text-gray-500 text-xs">{movie.director}</p>
                      </div>
                      <div className="text-yellow-400 text-sm">⭐ {getContentRating(movie.id)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Séries */}
            {results.series.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-2">Séries ({results.series.length})</h3>
                <div className="space-y-2">
                  {results.series.slice(0, 5).map((series) => (
                    <div 
                      key={series.id} 
                      className="flex items-center space-x-3 p-2 hover:bg-dark-300 rounded cursor-pointer"
                      onClick={() => handleContentClick(series)}
                    >
                      <OptimizedImage
                        src={series.posterUrl || '/placeholder-series.jpg'}
                        alt={series.title}
                        className="w-12 h-16 object-cover rounded"
                        width={48}
                        height={64}
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{series.title}</h4>
                        <p className="text-gray-400 text-sm">{series.year} • {series.genre.join(', ')}</p>
                        <p className="text-gray-500 text-xs">{series.director}</p>
                      </div>
                      <div className="text-yellow-400 text-sm">⭐ {getContentRating(series.id)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {results.total > 10 && (
              <div className="mt-3 pt-3 border-t border-gray-600 text-center">
                <button 
                  onClick={handleViewAllResults}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Voir tous les résultats ({results.total})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup des résultats de recherche */}
      <SearchResultsPopup
        query={query}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  )
}
