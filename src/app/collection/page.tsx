'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Movie, Series } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { SecureStorage } from '@/lib/secure-storage'
import { GenreService } from '@/lib/genre-service'
import { UserPreferencesService } from '@/lib/user-preferences-service'
import { AnalyticsService } from '@/lib/analytics-service'
import { ReviewsService } from '@/lib/reviews-service'
import ProtectedRoute from '@/components/ProtectedRoute'
import OptimizedImage from '@/components/OptimizedImage'
import SearchBar from '@/components/SearchBar'
import NotificationsModal from '@/components/NotificationsModal'
import FavoritesModal from '@/components/FavoritesModal'
import { NotificationsService } from '@/lib/notifications-service'
import { FavoritesNotificationService } from '@/lib/favorites-notification-service'
import ExpandableCardSection from '@/components/ExpandableCardSection'
import { PlayIcon, StarIcon, ChevronDownIcon, ArrowDownTrayIcon, UserIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

export default function CollectionPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [showSubscriptionButton, setShowSubscriptionButton] = useState(true)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [columnsPerRow, setColumnsPerRow] = useState(9) // Par défaut PC (9 colonnes)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unseenFavoritesCount, setUnseenFavoritesCount] = useState(0)
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    genre: 'all',
    year: 'all'
  })
  const [filteredCollection, setFilteredCollection] = useState<(Movie | Series)[]>([])
  
  const [collection, setCollection] = useState<(Movie | Series)[]>([])
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(27)
  const [totalPages, setTotalPages] = useState(1)

  // Refs pour gérer le modal de carte
  const cardElementsRef = useRef<Map<string, HTMLElement>>(new Map())
  // Ref pour éviter le double déclenchement sur mobile (touch + click)
  const touchHandledRef = useRef<boolean>(false)

  useEffect(() => {
    setIsClient(true)
    
    // Charger l'option d'affichage du bouton Abonnement
    try {
      const savedOption = SecureStorage.getItem('atiha_show_subscription_button')
      if (savedOption !== null) {
        setShowSubscriptionButton(savedOption === 'true')
      } else {
        // Par défaut, le bouton est visible
        setShowSubscriptionButton(true)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de l\'option d\'affichage du bouton Abonnement', error as Error)
      setShowSubscriptionButton(true)
    }
    
    loadContent()
    
    // Détecter la taille d'écran pour mobile/desktop
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
      // Calculer le nombre de colonnes selon la taille d'écran
      const width = window.innerWidth
      if (width >= 1024) setColumnsPerRow(9) // lg: 9 colonnes (PC)
      else if (width >= 768) setColumnsPerRow(5)  // md: 5 colonnes (Tablette)
      else setColumnsPerRow(3) // mobile: 3 colonnes
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Lire les paramètres URL pour la pagination
    const urlParams = new URLSearchParams(window.location.search)
    const pageParam = urlParams.get('page')
    if (pageParam) {
      const page = parseInt(pageParam)
      if (page > 0) {
        setCurrentPage(page)
      }
    }

    // Track catalogue view
    AnalyticsService.trackCatalogueView('Notre collection', user?.id)
    
    // Charger le compteur de notifications
    setUnreadNotificationsCount(NotificationsService.getUnreadCount())
    
    // Vérifier les nouveaux favoris
    if (user) {
      FavoritesNotificationService.checkForNewFavorites(user.id)
      setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
    }
    
    // Écouter les événements de mise à jour des favoris
    const handleFavoritesUpdate = () => {
      if (user) {
        setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
      }
    }
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate)
    
    // Vérifier les notifications périodiquement
    const interval = setInterval(() => {
      NotificationsService.checkForNewContent()
      setUnreadNotificationsCount(NotificationsService.getUnreadCount())
      
      // Vérifier les nouveaux favoris périodiquement
      if (user) {
        FavoritesNotificationService.checkForNewFavorites(user.id)
        setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
      }
    }, 5 * 60 * 1000)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate)
      clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [movies, series, filters])

  const applyFilters = () => {
    let mixedCollection = createMixedCollection(movies, series)

    // Filtrage par genre
    if (filters.genre !== 'all') {
      mixedCollection = mixedCollection.filter(item => 
        GenreService.contentMatchesGenre(item, filters.genre)
      )
    }

    // Filtrage par année
    if (filters.year !== 'all') {
      const year = parseInt(filters.year)
      mixedCollection = mixedCollection.filter(item => item.year === year)
    }

    setCollection(mixedCollection)
    setFilteredCollection(mixedCollection)
    
    // Calculer le nombre total de pages
    const totalPagesCount = Math.ceil(mixedCollection.length / itemsPerPage)
    setTotalPages(totalPagesCount)
    
    // Réinitialiser à la page 1 si la page actuelle dépasse le nombre total de pages
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(1)
      updateURL(1)
    }
  }

  const getUniqueGenres = () => {
    return GenreService.getAllUniqueGenres(movies, series)
  }

  const getUniqueYears = () => {
    const allContent = [...movies, ...series]
    const years = Array.from(new Set(allContent.map(item => item.year)))
      .sort((a, b) => b - a)
    return years
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Réinitialiser à la page 1 lors du changement de filtre
  }

  // Composant de filtres
  const renderFilters = () => {
    // Déterminer le texte à afficher selon la taille d'écran
    const genreLabel = isMobile ? 'Genres' : 'Tous les genres'
    const yearLabel = isMobile ? 'Années' : 'Toutes les années'

    return (
      <div className="flex flex-row gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 items-center w-full">
        {/* Filtre Genre */}
        <div className="relative flex-1">
          <select
            value={filters.genre}
            onChange={(e) => updateFilter('genre', e.target.value)}
            className="appearance-none bg-dark-300 border border-gray-600 rounded-lg px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 lg:px-4 lg:py-2.5 pr-8 sm:pr-10 lg:pr-10 text-sm sm:text-base md:text-lg lg:text-base text-white focus:outline-none focus:border-gray-600 w-full min-h-[44px]"
            style={isClient ? {
              '--tw-ring-color': homepageContent.appIdentity.colors.primary
            } as React.CSSProperties & { '--tw-ring-color': string } : {}}
          >
            <option value="all">{genreLabel}</option>
            {getUniqueGenres().map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 sm:right-3 lg:right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtre Année */}
        <div className="relative flex-1">
          <select
            value={filters.year}
            onChange={(e) => updateFilter('year', e.target.value)}
            className="appearance-none bg-dark-300 border border-gray-600 rounded-lg px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 lg:px-4 lg:py-2.5 pr-8 sm:pr-10 lg:pr-10 text-sm sm:text-base md:text-lg lg:text-base text-white focus:outline-none focus:border-gray-600 w-full min-h-[44px]"
            style={isClient ? {
              '--tw-ring-color': homepageContent.appIdentity.colors.primary
            } as React.CSSProperties & { '--tw-ring-color': string } : {}}
          >
            <option value="all">{yearLabel}</option>
            {getUniqueYears().map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 sm:right-3 lg:right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Bouton Réinitialiser (X) - Afficher uniquement si un filtre est sélectionné */}
        {(filters.genre !== 'all' || filters.year !== 'all') && (
          <button
            onClick={() => setFilters({ genre: 'all', year: 'all' })}
            className="p-2.5 sm:p-3 lg:p-2.5 bg-dark-300 border border-gray-600 rounded-lg hover:bg-dark-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Réinitialiser les filtres"
            title="Réinitialiser les filtres"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-gray-400" />
          </button>
        )}
      </div>
    )
  }

  const loadContent = async () => {
    try {
      setIsLoading(true)
      const [moviesData, seriesData, homepageData] = await Promise.all([
        ContentService.getMovies(),
        ContentService.getSeries(),
        HomepageContentService.getContent()
      ])
      
      setMovies(moviesData)
      setSeries(seriesData)
      setHomepageContent(homepageData)
      
    } catch (error) {
      logger.error('Erreur lors du chargement', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour créer la collection alternée
  const createMixedCollection = (allMovies: Movie[], allSeries: Series[]) => {
    // Trier tous les contenus par année (plus récent en premier)
    const allContent = [...allMovies, ...allSeries].sort((a, b) => b.year - a.year)
    
    // Créer une collection alternée : film, série, film, série...
    const mixedCollection = []
    const moviesList = allContent.filter(item => 'duration' in item)
    const seriesList = allContent.filter(item => 'seasons' in item)
    
    const maxLength = Math.max(moviesList.length, seriesList.length)
    
    for (let i = 0; i < maxLength * 2; i++) {
      if (i % 2 === 0) {
        // Position paire : film
        if (moviesList[Math.floor(i / 2)]) {
          mixedCollection.push(moviesList[Math.floor(i / 2)])
        }
      } else {
        // Position impaire : série
        if (seriesList[Math.floor(i / 2)]) {
          mixedCollection.push(seriesList[Math.floor(i / 2)])
        }
      }
    }
    
    return mixedCollection
  }


  // Fonction pour mettre à jour l'URL
  const updateURL = (page: number) => {
    const url = new URL(window.location.href)
    if (page === 1) {
      url.searchParams.delete('page')
    } else {
      url.searchParams.set('page', page.toString())
    }
    window.history.pushState({}, '', url.toString())
  }

  // Fonction pour changer de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      updateURL(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Fonction pour obtenir les éléments de la page actuelle
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return collection.slice(startIndex, endIndex)
  }

  // Handlers pour le modal de carte
  const handleContentMouseEnter = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    cardElementsRef.current.set(content.id, e.currentTarget as HTMLElement)
    // Ne pas ouvrir automatiquement le modal au survol
    // Le modal peut être ouvert manuellement via un clic si nécessaire
  }

  const handleContentMouseLeave = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    // Nettoyer la référence de l'élément
    cardElementsRef.current.delete(content.id)
  }

  const handleContentClick = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    // Si on vient d'un événement touch, ignorer le click
    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }
    
    if (user && content.trailerUrl) {
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
    if (user && content.trailerUrl) {
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
    const items = getCurrentPageItems()
    const clickedIndex = items.findIndex(m => m.id === expandedCardId)
    if (clickedIndex === -1) return false
    
    const clickedRow = Math.floor(clickedIndex / columnsPerRow)
    const currentRow = Math.floor(index / columnsPerRow)
    const totalRows = Math.ceil(items.length / columnsPerRow)
    
    // Si la carte cliquée est dans la dernière rangée, afficher en haut de la rangée
    if (clickedRow === totalRows - 1 && currentRow === clickedRow && isStartOfRow(index)) {
      return true
    }
    return false
  }

  // Fonction pour vérifier si on doit afficher la section extensible après cette carte (en bas de la rangée)
  const shouldShowExpandableAfter = (index: number) => {
    if (!expandedCardId) return false
    const items = getCurrentPageItems()
    const clickedIndex = items.findIndex(m => m.id === expandedCardId)
    if (clickedIndex === -1) return false
    
    const clickedRow = Math.floor(clickedIndex / columnsPerRow)
    const currentRow = Math.floor(index / columnsPerRow)
    const totalRows = Math.ceil(items.length / columnsPerRow)
    
    // Si la carte cliquée n'est pas dans la dernière rangée, afficher à la fin de la rangée
    if (clickedRow < totalRows - 1 && currentRow === clickedRow && isEndOfRow(index)) {
      return true
    }
    return false
  }


  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 10
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si le total est petit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Logique pour afficher les pages avec ellipses
      if (currentPage <= 6) {
        // Début de la liste
        for (let i = 1; i <= 9; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 5) {
        // Fin de la liste
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 8; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Milieu de la liste
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 3; i <= currentPage + 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={isClient ? { borderColor: homepageContent.appIdentity.colors.primary } : { borderColor: '#3B82F6' }}
            ></div>
            <p className="text-gray-400">Chargement de la collection...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 pb-20 sm:pb-24">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-dark-300 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 lg:py-2 border-b border-gray-800">
          <nav className="flex items-center justify-between w-full gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 h-full">
            {/* Bouton Retour à gauche */}
            <div className="flex items-center flex-shrink-0 h-full">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center p-2.5 sm:p-3 lg:p-2.5 text-gray-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 h-full"
                aria-label="Retour au tableau de bord"
              >
                <ChevronLeftIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-6 lg:h-6 text-gray-300 hover:text-white" />
              </button>
            </div>
            
            {/* Barre de recherche au centre */}
            <div 
              className={`flex items-center transition-all duration-300 ease-in-out h-full ${
                isSearchFocused 
                  ? 'flex-1 min-w-0 ml-1 sm:ml-2 md:ml-4 lg:ml-2 mr-0 sm:mr-0 max-w-none' 
                  : 'flex-1 min-w-0 ml-1 sm:ml-2 md:ml-4 lg:ml-2 mr-0.5 sm:mr-1 max-w-none'
              }`}
            >
              <div className="flex-1 h-full flex items-center">
                <SearchBar 
                  placeholder="Rechercher..." 
                  className="w-full h-full"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </div>
              {/* Icône X pour fermer la barre de recherche */}
              {isSearchFocused && (
                <button
                  onClick={() => {
                    setIsSearchFocused(false)
                    // Réinitialiser le focus de l'input
                    const searchInput = document.querySelector('input[type="search"], input[placeholder="Rechercher..."]') as HTMLInputElement
                    if (searchInput) {
                      searchInput.blur()
                      searchInput.value = ''
                    }
                  }}
                  className="ml-1 sm:ml-2 p-2.5 sm:p-3 lg:p-2.5 bg-dark-300 border border-gray-600 rounded-lg hover:bg-dark-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center h-full"
                  aria-label="Fermer la recherche"
                  title="Fermer la recherche"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Boutons à droite */}
            <div 
              className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 flex-shrink-0 transition-all duration-300 ease-in-out h-full ${
                isSearchFocused ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100 w-auto pointer-events-auto'
              }`}
            >
              {/* Bouton Notifications */}
              <button
                onClick={() => {
                  setShowNotificationsModal(true)
                  // Vérifier les nouveaux contenus quand on ouvre le modal
                  NotificationsService.checkForNewContent()
                  setUnreadNotificationsCount(NotificationsService.getUnreadCount())
                }}
                className="p-2.5 sm:p-3 lg:p-2.5 rounded-lg hover:bg-gray-700 transition-colors relative flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center h-full"
                title="Notifications"
                aria-label="Notifications"
              >
                <BellIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-6 lg:h-6 text-gray-400" />
                {/* Badge de notification */}
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full"></span>
                )}
              </button>


              {/* Bouton Favoris */}
              <button
                onClick={() => {
                  setShowFavoritesModal(true)
                  // Marquer les favoris comme vus quand on ouvre le modal
                  FavoritesNotificationService.markAllAsSeen()
                  setUnseenFavoritesCount(0)
                }}
                className="p-2.5 sm:p-3 lg:p-2.5 rounded-lg hover:bg-gray-700 transition-colors relative flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center h-full"
                title="Mes favoris"
                aria-label="Mes favoris"
              >
                <HeartIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-6 lg:h-6 text-gray-400" />
                {/* Badge de favoris non vus */}
                {unseenFavoritesCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* User Profile Menu */}
              <div className="relative user-menu-container h-full flex items-center">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-1.5 p-2.5 sm:p-3 lg:p-2.5 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0 min-h-[44px] sm:min-h-0 h-full"
                >
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                  >
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <span className="text-white font-medium hidden lg:block text-sm lg:text-base whitespace-nowrap">{user?.name}</span>
                  <ChevronDownIcon className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-gray-400 transition-transform flex-shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 mr-2 sm:mr-4 md:mr-6 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-[60]">
                    {/* Mon Profil */}
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>Mon Profil</span>
                    </Link>

                    {/* Abonnement */}
                    {showSubscriptionButton && (
                      <Link
                        href="/subscription"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <HeartIcon className="w-5 h-5" />
                        <span>Abonnement</span>
                      </Link>
                    )}

                    {/* Paramètres */}
                    <Link
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      <span>Paramètres</span>
                    </Link>

                    {/* Télécharger l'app */}
                    <Link
                      href="/download"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      <span>Télécharger l&apos;app</span>
                    </Link>

                    {/* Nous suivre sur Telegram */}
                    {isClient && homepageContent.appIdentity.socialLinks.telegram.isVisible && (
                      <a
                        href={homepageContent.appIdentity.socialLinks.telegram.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 px-4 py-3 mx-2 my-1 text-white rounded-lg border shadow-lg transition-all duration-300 transform hover:scale-105"
                        style={isClient ? {
                          backgroundColor: homepageContent.appIdentity.colors.primary,
                          borderColor: homepageContent.appIdentity.colors.primary
                        } : {
                          backgroundColor: '#3B82F6',
                          borderColor: '#3B82F6'
                        }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        <span>{homepageContent.appIdentity.socialLinks.telegram.description} {homepageContent.appIdentity.socialLinks.telegram.text}</span>
                      </a>
                    )}

                    {/* Séparateur */}
                    <div className="border-t border-gray-700 my-2"></div>

                    {/* Me Déconnecter */}
                    <button
                      onClick={() => {
                        logout()
                        setIsUserMenuOpen(false)
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors w-full text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span>Me Déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="px-8 py-4 pt-14 sm:pt-18 md:pt-20 lg:pt-14">
          <div>
            {/* Titre */}
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-5 md:mb-6">
              <div 
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Notre Collection</h1>
            </div>

            {/* Grille de la collection */}
            {getCurrentPageItems().length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 auto-rows-min">
                {getCurrentPageItems().map((item, index) => {
                  const clickedItem = expandedCardId ? getCurrentPageItems().find(m => m.id === expandedCardId) : null
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
            ) : (
              <div className="text-center py-12">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                >
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun contenu trouvé</h3>
                <p className="text-gray-400">
                  Aucun contenu ne correspond à vos critères de recherche.
                </p>
              </div>
            )}

            {/* Pagination */}
            {(filteredCollection.length > 0 ? filteredCollection : collection).length > itemsPerPage && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2 bg-dark-200 rounded-lg p-2 border border-gray-700">
                  {/* Bouton Précédent */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2.5 sm:p-3 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${
                      currentPage === 1
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    title="Page précédente"
                    aria-label="Page précédente"
                  >
                    <ChevronLeftIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>

                  {/* Numéros de page */}
                  {getPageNumbers().map((page, index) => (
                    <div key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-2 text-gray-500">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page as number)}
                          className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded transition-colors min-h-[44px] sm:min-h-0 text-sm sm:text-base md:text-lg ${
                            currentPage === page
                              ? 'bg-yellow-500 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Bouton Suivant */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2.5 sm:p-3 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${
                      currentPage === totalPages
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    title="Page suivante"
                    aria-label="Page suivante"
                  >
                    <ChevronRightIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                </div>
              </div>
            )}

            {/* Informations de pagination */}
            {(filteredCollection.length > 0 ? filteredCollection : collection).length > 0 && (
              <div className="mt-4 sm:mt-5 text-center text-gray-400 text-base sm:text-lg">
                Page {currentPage} sur {totalPages} • {(filteredCollection.length > 0 ? filteredCollection : collection).length} contenu{(filteredCollection.length > 0 ? filteredCollection : collection).length > 1 ? 's' : ''} au total
              </div>
            )}
          </div>
        </main>

        {/* Barre de filtres fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-dark-300 border-t border-gray-800">
          <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 lg:py-2 w-full">
            {renderFilters()}
          </div>
        </div>


        {/* Modal de notifications */}
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => {
            setShowNotificationsModal(false)
            // Mettre à jour le compteur après fermeture du modal
            setUnreadNotificationsCount(NotificationsService.getUnreadCount())
          }}
        />

        {/* Modal des favoris */}
        <FavoritesModal
          isOpen={showFavoritesModal}
          onClose={() => setShowFavoritesModal(false)}
        />
      </div>
    </ProtectedRoute>
  )
}
