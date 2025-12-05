'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Movie, Series } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { GenreService } from '@/lib/genre-service'
import { SecureStorage } from '@/lib/secure-storage'
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
import { PlayIcon, StarIcon, HeartIcon, ChevronDownIcon, ChevronLeftIcon, ChatBubbleLeftRightIcon, XMarkIcon, BellIcon, ArrowDownTrayIcon, UserIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'
import { logger } from '@/lib/logger'

export default function AnimesPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [showSubscriptionButton, setShowSubscriptionButton] = useState(true)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [columnsPerRow, setColumnsPerRow] = useState(9) // Par défaut PC (9 colonnes)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unseenFavoritesCount, setUnseenFavoritesCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    genre: 'all',
    year: 'all'
  })
  const [filteredContent, setFilteredContent] = useState<(Movie | Series)[]>([])
  
  // Hook de pagination
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    calculateTotalPages,
    getCurrentPageItems,
    resetToFirstPage
  } = usePagination({ itemsPerPage: 27 })

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

    // Track catalogue view
    AnalyticsService.trackCatalogueView('Animes', user?.id)
    
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

  const loadContent = async () => {
    try {
      setIsLoading(true)
      const [moviesData, seriesData] = await Promise.all([
        ContentService.getMovies(),
        ContentService.getSeries()
      ])
      
      // Filtrer pour ne garder que le contenu de catalogue "animes"
      const animesMovies = moviesData.filter(movie => 
        movie.catalogue === 'animes'
      )
      
      const animesSeries = seriesData.filter(serie => 
        serie.catalogue === 'animes'
      )
      
      setMovies(animesMovies)
      setSeries(animesSeries)
      setHomepageContent(HomepageContentService.getContent())
      // Initialiser filteredContent avec tous les contenus
      const allContent = [...animesMovies, ...animesSeries]
      setFilteredContent(allContent)
    } catch (error) {
      logger.error('Erreur lors du chargement', error as Error)
    } finally {
      setIsLoading(false)
    }
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
    const items = getCurrentPageItems(filteredContent)
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
    const items = getCurrentPageItems(filteredContent)
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

  const applyFilters = () => {
    let allContent = [...movies, ...series]

    // Filtrage par genre
    if (filters.genre !== 'all') {
      allContent = allContent.filter(item => 
        GenreService.contentMatchesGenre(item, filters.genre)
      )
    }

    // Filtrage par année
    if (filters.year !== 'all') {
      const year = parseInt(filters.year)
      allContent = allContent.filter(item => item.year === year)
    }

    // Calculer le nombre total de pages
    calculateTotalPages(allContent.length)
    
    // Réinitialiser à la page 1 si la page actuelle dépasse le nombre total de pages
    if (currentPage > Math.ceil(allContent.length / itemsPerPage) && allContent.length > 0) {
      resetToFirstPage()
    }

    setFilteredContent(allContent)
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
    resetToFirstPage()
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


  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin"
              style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
            >
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            <p className="text-white text-lg">Chargement du contenu d&apos;animes...</p>
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
                <span className="text-white text-lg sm:text-xl md:text-2xl">🎌</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Animes</h1>
            </div>

            {/* Grille des animes */}
            {getCurrentPageItems(filteredContent).length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 auto-rows-min">
                {getCurrentPageItems(filteredContent).map((item, index) => {
                  const clickedItem = expandedCardId ? getCurrentPageItems(filteredContent).find(m => m.id === expandedCardId) : null
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
                  className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mx-auto mb-4"
                  style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                >
                  <span className="text-white text-2xl">🎌</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun anime trouvé</h3>
                <p className="text-gray-400">
                  Aucun anime ne correspond à vos critères de recherche.
                </p>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredContent.length}
              itemsPerPage={itemsPerPage}
              itemName="anime"
            />
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