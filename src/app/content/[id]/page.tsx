'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Movie, Series, WatchProgress } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import VideoPlayerSection from '@/components/VideoPlayerSection'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ArrowLeftIcon, BellIcon, XMarkIcon, MagnifyingGlassIcon, HeartIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import { premiumCodesService } from '@/lib/premium-codes-service'
import SearchBar from '@/components/SearchBar'
import NotificationsModal from '@/components/NotificationsModal'
import FavoritesModal from '@/components/FavoritesModal'
import { NotificationsService } from '@/lib/notifications-service'
import { FavoritesNotificationService } from '@/lib/favorites-notification-service'
import { logger } from '@/lib/logger'

export default function ContentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [content, setContent] = useState<Movie | Series | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unseenFavoritesCount, setUnseenFavoritesCount] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(48)

  const contentId = params.id as string

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setHomepageContent(loadedContent)
    
    // Charger le compteur de notifications
    setUnreadNotificationsCount(NotificationsService.getUnreadCount())
    
    // Vérifier les nouveaux favoris
    if (user) {
      FavoritesNotificationService.checkForNewFavorites(user.id)
      setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
    }
    
    // Écouter les mises à jour des notifications
    const handleNotificationsUpdate = () => {
      setUnreadNotificationsCount(NotificationsService.getUnreadCount())
    }
    
    // Écouter les événements de mise à jour des favoris
    const handleFavoritesUpdate = () => {
      if (user) {
        setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
      }
    }
    
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate)
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate)
    
    // Vérifier les nouveaux favoris périodiquement
    const interval = setInterval(() => {
      if (user) {
        FavoritesNotificationService.checkForNewFavorites(user.id)
        setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
      }
    }, 5 * 60 * 1000)
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate)
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate)
      clearInterval(interval)
    }
  }, [user])

  // Calculer dynamiquement la hauteur du header
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header')
      if (header) {
        setHeaderHeight(header.offsetHeight)
      }
    }

    // Calculer au montage et après chaque rendu
    updateHeaderHeight()
    
    // Recalculer lors du redimensionnement de la fenêtre
    window.addEventListener('resize', updateHeaderHeight)
    
    // Recalculer quand la barre de recherche change d'état
    const observer = new MutationObserver(updateHeaderHeight)
    const header = document.querySelector('header')
    if (header) {
      observer.observe(header, { childList: true, subtree: true, attributes: true })
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight)
      observer.disconnect()
    }
  }, [isSearchFocused])

  // Charger le statut premium de l&apos;utilisateur
  useEffect(() => {
    if (user) {
      const premiumStatus = premiumCodesService.getUserPremiumStatus(user.id)
      setHasPremiumAccess(premiumStatus.isPremium)
    } else {
      setHasPremiumAccess(false)
    }
  }, [user])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        
        // Essayer de charger comme un film d'abord
        const movie = await ContentService.getMovieById(contentId)
        if (movie) {
          setContent(movie)
          // Charger le progrès de visionnage
          const progress = await ContentService.getWatchProgress(contentId)
          setWatchProgress(progress)
        } else {
          // Si ce n&apos;est pas un film, essayer comme une série
          const series = await ContentService.getSeriesById(contentId)
          if (series) {
            setContent(series)
            // Pour les séries, on charge le progrès du premier épisode par défaut
            if (series.seasons.length > 0 && series.seasons[0].episodes.length > 0) {
              const firstEpisode = series.seasons[0].episodes[0]
              setSelectedEpisode(firstEpisode.id)
              const progress = await ContentService.getWatchProgress(contentId, firstEpisode.id)
              setWatchProgress(progress)
            }
          }
        }
      } catch (error) {
        logger.error('Error loading content', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    if (contentId) {
      loadContent()
    }
  }, [contentId])

  const handleProgressUpdate = (progress: WatchProgress) => {
    setWatchProgress(progress)
  }

  const handleEpisodeSelect = async (episodeId: string) => {
    setSelectedEpisode(episodeId)
    const progress = await ContentService.getWatchProgress(contentId, episodeId)
    setWatchProgress(progress)
  }

  // Raccourcis clavier
  useKeyboardShortcuts({
    onPlayPause: () => {
      logger.debug('Play/Pause')
    },
    onNextEpisode: () => {
      if (content && !('videoUrl' in content) && content.seasons.length > 0) {
        const allEpisodes = content.seasons.flatMap(s => s.episodes)
        const currentIndex = allEpisodes.findIndex(ep => ep.id === selectedEpisode)
        if (currentIndex < allEpisodes.length - 1) {
          handleEpisodeSelect(allEpisodes[currentIndex + 1].id)
        }
      }
    },
    onPreviousEpisode: () => {
      if (content && !('videoUrl' in content) && content.seasons.length > 0) {
        const allEpisodes = content.seasons.flatMap(s => s.episodes)
        const currentIndex = allEpisodes.findIndex(ep => ep.id === selectedEpisode)
        if (currentIndex > 0) {
          handleEpisodeSelect(allEpisodes[currentIndex - 1].id)
        }
      }
    },
    onToggleFullscreen: () => {
      logger.debug('Toggle Fullscreen')
    },
    onToggleMute: () => {
      logger.debug('Toggle Mute')
    }
  })

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={isClient ? { borderColor: homepageContent.appIdentity.colors.primary } : { borderColor: '#3B82F6' }}
            ></div>
            <p className="text-white text-lg">Chargement...</p>
          </div>
        </div>
      ) : !content ? (
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Contenu non trouvé</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center space-x-2 p-2.5 sm:p-3 text-gray-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              aria-label="Retour au tableau de bord"
            >
              <ArrowLeftIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300 hover:text-white" />
              <span className="text-base sm:text-lg">Retour</span>
            </button>
          </div>
        </div>
      ) : (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-300 px-4 sm:px-6 py-2 border-b border-gray-800">
        <nav className="flex items-center gap-2 sm:gap-4">
          {/* Bouton Retour à gauche */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center space-x-1.5 sm:space-x-2 p-2.5 sm:p-3 text-gray-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              aria-label="Retour au tableau de bord"
          >
            <ArrowLeftIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300 hover:text-white" />
              <span className="text-base sm:text-lg">Retour</span>
          </button>
          </div>
          
          {/* Barre de recherche ou icône de recherche */}
          {isSearchFocused ? (
            <div className="flex items-center flex-1 min-w-0 ml-2 sm:ml-4 transition-all duration-300 ease-in-out">
              <div className="flex-1">
                <SearchBar 
                  placeholder="Rechercher..." 
                  className="w-full"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </div>
              {/* Icône X pour fermer la barre de recherche */}
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
                className="ml-2 p-2.5 sm:p-3 bg-dark-300 border border-gray-600 rounded-lg hover:bg-dark-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Fermer la recherche"
                title="Fermer la recherche"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </button>
            </div>
          ) : (
            <>
              {/* Espace flexible au centre */}
              <div className="flex-1"></div>
              
              {/* Boutons à droite */}
              <div className="flex items-center gap-0 flex-shrink-0">
                {/* Bouton Recherche */}
                <button
                  onClick={() => setIsSearchFocused(true)}
                  className="p-2.5 sm:p-3 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  title="Rechercher"
                  aria-label="Rechercher"
                >
                  <MagnifyingGlassIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400" />
                </button>
                
                {/* Bouton Notifications */}
                <button
                  onClick={() => {
                    setShowNotificationsModal(true)
                    // Vérifier les nouveaux contenus quand on ouvre le modal
                    NotificationsService.checkForNewContent()
                    setUnreadNotificationsCount(NotificationsService.getUnreadCount())
                  }}
                  className="p-2.5 sm:p-3 rounded-lg hover:bg-gray-700 transition-colors relative flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <BellIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400" />
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
                  className="flex items-center space-x-1.5 sm:space-x-2 p-2.5 sm:p-3 rounded-lg hover:bg-gray-700 transition-colors relative flex-shrink-0 min-h-[44px] sm:min-h-0"
                  title="Mes favoris"
                  aria-label="Mes favoris"
          >
                  <HeartIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400" />
                  <span className="text-base sm:text-lg text-gray-400">Mes favoris</span>
                  {/* Badge de favoris non vus */}
                  {unseenFavoritesCount > 0 && (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full"></span>
                  )}
          </button>
        </div>
            </>
          )}
        </nav>
      </header>

      <main className="pb-8">
        <div className="space-y-8">
          
          {/* Partie 1: Lecteur vidéo */}
          <section style={{ paddingTop: `${headerHeight}px` }}>
            <VideoPlayerSection
              content={content}
              selectedEpisode={selectedEpisode || undefined}
              watchProgress={watchProgress}
              onProgressUpdate={handleProgressUpdate}
              onEpisodeSelect={handleEpisodeSelect}
              autoPlay={true}
            />
          </section>


        </div>
      </main>

      {/* Aide des raccourcis clavier */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
      
      {/* Modal des notifications */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => {
          setShowNotificationsModal(false)
          setUnreadNotificationsCount(NotificationsService.getUnreadCount())
        }}
      />

      {/* Modal des favoris */}
      <FavoritesModal
        isOpen={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
      />

    </div>
      )}
    </ProtectedRoute>
  )
}
