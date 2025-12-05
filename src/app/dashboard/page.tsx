'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ContentService } from '@/lib/content-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { Movie, Series } from '@/types/content'
import { premiumCodesService } from '@/lib/premium-codes-service'
import { SecureStorage } from '@/lib/secure-storage'
import ProtectedRoute from '@/components/ProtectedRoute'
import ExpandableCardSection from '@/components/ExpandableCardSection'
import { logger } from '@/lib/logger'
import { 
  PlayIcon, 
  UserIcon,
  ArrowRightIcon, 
  ChevronDownIcon, 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  FilmIcon,
  TvIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  StarIcon,
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
  FireIcon,
  BookOpenIcon,
  SparklesIcon,
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OptimizedImage from '@/components/OptimizedImage'
import HeaderStatusIndicator from '@/components/HeaderStatusIndicator'
import SearchBar from '@/components/SearchBar'
import { UserPreferencesService } from '@/lib/user-preferences-service'
import { GenreService } from '@/lib/genre-service'
import { ReviewsService } from '@/lib/reviews-service'
import dynamic from 'next/dynamic'

// Lazy loading des modals et composants lourds
const WelcomeNotification = dynamic(() => import('@/components/WelcomeNotification'), { ssr: false })
const NotificationsModal = dynamic(() => import('@/components/NotificationsModal'), { ssr: false })
const FavoritesModal = dynamic(() => import('@/components/FavoritesModal'), { ssr: false })
import { NotificationsService } from '@/lib/notifications-service'
import { FavoritesNotificationService } from '@/lib/favorites-notification-service'

// Fonction pour extraire l'ID YouTube d'une URL
function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : ''
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'series' | 'wishlist'>('home')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unseenFavoritesCount, setUnseenFavoritesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [wishlist, setWishlist] = useState<(Movie | Series)[]>([])
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [showSubscriptionButton, setShowSubscriptionButton] = useState(true)
  const [showSoundNotification, setShowSoundNotification] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false)
  const [welcomeData, setWelcomeData] = useState<{ hasPremiumTrial: boolean; trialDays?: number } | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0)
  const [currentFeaturedPosterIndex, setCurrentFeaturedPosterIndex] = useState<Record<string, number>>({})
  // États pour le swipe du slider principal (format simple)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  // États pour le swipe des featured posters (format avec rowKey)
  const [featuredPosterTouchStart, setFeaturedPosterTouchStart] = useState<{rowKey: string, x: number} | null>(null)
  const [featuredPosterTouchEnd, setFeaturedPosterTouchEnd] = useState<{rowKey: string, x: number} | null>(null)
  const [mouseStart, setMouseStart] = useState<{rowKey: string, x: number} | null>(null)
  const [mouseEnd, setMouseEnd] = useState<{rowKey: string, x: number} | null>(null)
  const [videoFinished, setVideoFinished] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [columnsPerRow, setColumnsPerRow] = useState(9) // Par défaut PC (9 colonnes)
  // Ref pour éviter le double déclenchement sur mobile (touch + click)
  const touchHandledRef = useRef<boolean>(false)
  // Ref pour suivre quelle section a déjà affiché le modal pour un contenu donné
  const modalDisplayedSectionRef = useRef<string | null>(null)
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    contentType: 'all', // 'all', 'movies', 'series', 'collection'
    genre: 'all', // 'all', 'Action', 'Comédie', etc.
    year: 'all' // 'all', '2025', '2024', etc.
  })
  // Calcul mémorisé du contenu filtré pour éviter les recalculs inutiles
  const filteredContent = useMemo(() => {
    let content: (Movie | Series)[] = []

    // Filtrer par type de contenu
    if (filters.contentType === 'movies') {
      content = movies
    } else if (filters.contentType === 'series') {
      content = series
    } else if (filters.contentType === 'collection') {
      // Pour la collection, on utilise la logique d'alternance
      const allContent = [...movies, ...series].sort((a, b) => b.year - a.year)
      const moviesList = allContent.filter(item => 'duration' in item)
      const seriesList = allContent.filter(item => 'seasons' in item)
      
      const mixedCollection = []
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
      
      content = mixedCollection
    } else {
      content = [...movies, ...series]
    }

    // Filtrer par genre
    if (filters.genre !== 'all') {
      content = content.filter(item => 
        GenreService.contentMatchesGenre(item, filters.genre)
      )
    }

    // Filtrer par année
    if (filters.year !== 'all') {
      const year = parseInt(filters.year)
      content = content.filter(item => item.year === year)
    }

    return content
  }, [movies, series, filters.contentType, filters.genre, filters.year])

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
    
    // Charger le compteur de notifications existant immédiatement (sans vérification)
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
    
    // Charger le contenu en priorité
    loadContent()
    
    // Vérifier les notifications de manière asynchrone après le chargement du contenu
    setTimeout(() => {
      NotificationsService.checkForNewContent()
      setUnreadNotificationsCount(NotificationsService.getUnreadCount())
      
      // Vérifier les nouveaux favoris
      if (user) {
        FavoritesNotificationService.checkForNewFavorites(user.id)
        setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
      }
    }, 1000) // Délai de 1 seconde pour ne pas bloquer le chargement initial
    
    // Vérifier périodiquement (toutes les 5 minutes)
    const interval = setInterval(() => {
      NotificationsService.checkForNewContent()
      setUnreadNotificationsCount(NotificationsService.getUnreadCount())
      
      // Vérifier les nouveaux favoris périodiquement
      if (user) {
        FavoritesNotificationService.checkForNewFavorites(user.id)
        setUnseenFavoritesCount(FavoritesNotificationService.getUnseenCount())
      }
    }, 5 * 60 * 1000)
    
    // Détecter la taille d'écran pour mobile/desktop
    const checkMobile = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < 640)
      // Calculer le nombre de colonnes selon la taille d'écran
      // Correspond aux breakpoints Tailwind : grid-cols-3 md:grid-cols-5 lg:grid-cols-10
      if (width >= 1024) setColumnsPerRow(9) // lg: 9 colonnes (PC)
      else if (width >= 768) setColumnsPerRow(5)  // md: 5 colonnes (Tablette)
      else setColumnsPerRow(3) // mobile: 3 colonnes
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Vérifier si une notification de bienvenue doit être affichée
    const welcomeNotificationData = localStorage.getItem('show_welcome_notification')
    const hasSeenWelcomeNotification = localStorage.getItem('has_seen_welcome_notification')
    
    // Afficher la notification uniquement si elle n'a pas encore été vue
    if (welcomeNotificationData && !hasSeenWelcomeNotification) {
      try {
        const data = JSON.parse(welcomeNotificationData as string)
        // Vérifier que la notification n'est pas trop ancienne (max 5 minutes)
        const isRecent = data.timestamp && (Date.now() - data.timestamp) < 5 * 60 * 1000
        
        if (isRecent) {
          setWelcomeData({
            hasPremiumTrial: data.hasPremiumTrial || false,
            trialDays: data.trialDays || 5
          })
          setShowWelcomeNotification(true)
        } else {
          // Supprimer la notification si elle est trop ancienne
          localStorage.removeItem('show_welcome_notification')
        }
      } catch (error) {
        logger.error('Error parsing welcome notification data', error as Error)
        localStorage.removeItem('show_welcome_notification')
      }
    }
    
    // Nettoyer l'URL si on vient de l'inscription
    const urlParams = new URLSearchParams(window.location.search)
    const fromRegistration = urlParams.get('from') === 'registration'
    if (fromRegistration) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Appliquer les préférences utilisateur aux filtres
    const preferences = UserPreferencesService.getUserPreferences()
    if (preferences.favoriteGenres.length > 0) {
      // Si l&apos;utilisateur a des genres préférés, les appliquer automatiquement
      setFilters(prev => ({
        ...prev,
        genre: preferences.favoriteGenres[0] // Prendre le premier genre préféré
      }))
    }
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate)
      window.removeEventListener('resize', checkMobile)
      clearInterval(interval)
    }
  }, [])

  // filteredContent est maintenant calculé automatiquement avec useMemo, plus besoin de useEffect

  // Auto-play du carousel Affiche Mise en Avant - Géré par rangée individuellement
  useEffect(() => {
    if (!homepageContent.featuredPoster?.isVisible || !homepageContent.featuredPoster?.rows) return
    
    const intervals: NodeJS.Timeout[] = []
    const autoplaySpeed = (homepageContent.featuredPoster.autoplaySpeed || 5) * 1000
    
    homepageContent.featuredPoster.rows.forEach((row: any) => {
      const activeSlides = (row.slides || []).filter((s: any) => s.isActive)
    const slidesCount = activeSlides.length
    if (slidesCount === 0) return
    
      const rowsCount = row.rowsCount || 1
      const itemsPerRow = Math.ceil(slidesCount / rowsCount)
      
      // Créer un interval pour chaque rangée
      for (let i = 0; i < rowsCount; i++) {
        const rowKey = `${row.id}-${i}`
        
        // Initialiser l'index si nécessaire
        setCurrentFeaturedPosterIndex(prev => {
          if (!prev[rowKey] && itemsPerRow > 0) {
            return { ...prev, [rowKey]: itemsPerRow }
          }
          return prev
        })
        
        const interval = setInterval(() => {
          setCurrentFeaturedPosterIndex(prev => {
            const currentIndex = prev[rowKey] || itemsPerRow
            const rowSlidesCount = itemsPerRow
            
            // Si on est au dernier slide du troisième set, revenir au début du deuxième set
            if (currentIndex >= rowSlidesCount * 2) {
              const actualIndex = currentIndex % rowSlidesCount
              return { ...prev, [rowKey]: rowSlidesCount + actualIndex }
    }
    
            // Si on est avant le deuxième set, ajuster
            if (currentIndex < rowSlidesCount && currentIndex !== rowSlidesCount) {
              const actualIndex = ((currentIndex % rowSlidesCount) + rowSlidesCount) % rowSlidesCount
              return { ...prev, [rowKey]: rowSlidesCount + actualIndex }
            }
            
            return { ...prev, [rowKey]: currentIndex + 1 }
      })
        }, autoplaySpeed)
        
        intervals.push(interval)
      }
    })
    
    return () => {
      intervals.forEach(interval => clearInterval(interval))
    }
  }, [homepageContent.featuredPoster?.rows, homepageContent.featuredPoster?.autoplaySpeed])

  // La fonction applyFilters n'est plus nécessaire car filteredContent est calculé avec useMemo

  // Genres uniques (mémorisés)
  const uniqueGenres = useMemo(() => {
    return GenreService.getAllUniqueGenres(movies, series)
  }, [movies, series])

  // Années uniques (mémorisées)
  const uniqueYears = useMemo(() => {
    const allYears = new Set<number>()
    movies.forEach(movie => allYears.add(movie.year))
    series.forEach(serie => allYears.add(serie.year))
    return Array.from(allYears).sort((a, b) => b - a) // Tri décroissant
  }, [movies, series])

  // Fonction pour mettre à jour les filtres
  const updateFilter = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  // Afficher la notification pour désactiver le son (son activé par défaut)
  useEffect(() => {
    const videoSource = homepageContent.media?.videoUrl || homepageContent.media?.trailerUrl
    if (videoSource && !isVideoMuted) {
      setShowSoundNotification(true)
    } else {
      setShowSoundNotification(false)
    }
  }, [homepageContent.media?.trailerUrl, homepageContent.media?.videoUrl, isVideoMuted])

  // Activer automatiquement le son pour les fichiers .mp4
  useEffect(() => {
    if (homepageContent.media?.videoUrl && homepageContent.media.videoUrl.toLowerCase().endsWith('.mp4')) {
      setIsVideoMuted(false) // Activer le son automatiquement
      setShowSoundNotification(false) // Masquer la notification
    }
  }, [homepageContent.media?.videoUrl])

  // Vérifier si l'autoplay a échoué (bloqué par le navigateur)
  useEffect(() => {
    const videoSource = homepageContent.media?.videoUrl || homepageContent.media?.trailerUrl
    if (!videoSource || videoFinished) return

    const checkAutoplay = () => {
      const videoElement = document.getElementById('dashboard-media-video') as HTMLVideoElement | null
      if (videoElement && videoElement.tagName === 'VIDEO') {
        // Vérifier après un court délai si la vidéo joue vraiment
        setTimeout(() => {
          if (videoElement.paused && videoElement.readyState >= 2) {
            // La vidéo est chargée mais en pause = autoplay bloqué
            logger.warn('Autoplay bloqué par le navigateur. Affichage de l\'image de fallback.')
            if (homepageContent.media?.imageUrl) {
              setVideoFinished(true)
            }
          }
        }, 1000)
      }
    }

    checkAutoplay()
  }, [homepageContent.media?.videoUrl, homepageContent.media?.trailerUrl, videoFinished])

  // Fonction pour contrôler le son de la vidéo
  const toggleVideoSound = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la propagation vers le clic de la vidéo
    const mediaElement = document.getElementById('dashboard-media-video') as HTMLVideoElement | HTMLIFrameElement
    if (!mediaElement) return

    if (mediaElement.tagName === 'VIDEO') {
      // Pour les vidéos HTML5 directes
      const video = mediaElement as HTMLVideoElement
      video.muted = !video.muted
      setIsVideoMuted(video.muted)
      
      // Masquer la notification si l&apos;utilisateur active le son
      if (!video.muted) {
        setShowSoundNotification(false)
      }
    } else if (mediaElement.tagName === 'IFRAME') {
      // Pour les vidéos YouTube, on ne peut pas contrôler directement le son
      // Mais on masque la notification car l&apos;utilisateur a cliqué sur le bouton
      setShowSoundNotification(false)
    }
  }

  // Fonction pour contrôler la lecture/pause de la vidéo
  const toggleVideoPlayPause = () => {
    logger.debug('Bouton play/pause cliqué')
    const mediaElement = document.getElementById('dashboard-media-video') as HTMLVideoElement | HTMLIFrameElement
    if (!mediaElement) {
      logger.warn('Élément vidéo non trouvé')
      return
    }

    logger.debug('Type d\'élément', { tagName: mediaElement.tagName })

    if (mediaElement.tagName === 'VIDEO') {
      // Pour les vidéos HTML5 directes
      const video = mediaElement as HTMLVideoElement
      logger.debug('Vidéo en pause', { paused: video.paused })
      if (video.paused) {
        video.play().then(() => {
          setIsVideoPlaying(true)
          logger.debug('Lecture démarrée')
        }).catch((error) => {
          logger.warn('Impossible de lire la vidéo automatiquement', error as Error)
          // Si l'autoplay échoue, afficher l'image de fallback
          if (homepageContent.media?.imageUrl) {
            setVideoFinished(true)
          }
        })
      } else {
        video.pause()
        setIsVideoPlaying(false)
        logger.debug('Lecture mise en pause')
      }
    } else if (mediaElement.tagName === 'IFRAME') {
      // Pour les vidéos YouTube, on ne peut pas contrôler directement la lecture
      // Mais on peut afficher un message d'information
      logger.debug('Contrôles YouTube disponibles dans le lecteur')
    }
  }

  // Fonctions pour le slider principal
  const nextSlide = () => {
    if (homepageContent.featuredSlider?.slides) {
      setCurrentSlideIndex((prev) => 
        prev === homepageContent.featuredSlider.slides.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevSlide = () => {
    if (homepageContent.featuredSlider?.slides) {
      setCurrentSlideIndex((prev) => 
        prev === 0 ? homepageContent.featuredSlider.slides.length - 1 : prev - 1
      )
    }
  }

  // Fonctions pour le slider "À la une"
  const nextSpotlightSlide = (catalogueId: string) => {
    const spotlightSlides = homepageContent.spotlightSlider?.slideGroups
      ?.filter((group: any) => group.catalogue === catalogueId)
      ?.flatMap((group: any) => group.slides) || []
    
    if (spotlightSlides.length > 0) {
      setCurrentSpotlightIndex((prev) => 
        prev === spotlightSlides.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevSpotlightSlide = (catalogueId: string) => {
    const spotlightSlides = homepageContent.spotlightSlider?.slideGroups
      ?.filter((group: any) => group.catalogue === catalogueId)
      ?.flatMap((group: any) => group.slides) || []
    
    if (spotlightSlides.length > 0) {
      setCurrentSpotlightIndex((prev) => 
        prev === 0 ? spotlightSlides.length - 1 : prev - 1
      )
    }
  }

  const goToSpotlightSlide = (index: number) => {
    setCurrentSpotlightIndex(index)
  }

  // Fonctions pour le swipe du spotlightSlider - Améliorées pour tous les appareils
  const [spotlightTouchStart, setSpotlightTouchStart] = useState<{x: number, y: number, catalogueId: string} | null>(null)
  const [spotlightTouchEnd, setSpotlightTouchEnd] = useState<number | null>(null)
  const [spotlightIsDragging, setSpotlightIsDragging] = useState(false)

  const handleSpotlightTouchStart = (e: React.TouchEvent, catalogueId: string) => {
    setSpotlightTouchEnd(null)
    setSpotlightIsDragging(true)
    setSpotlightTouchStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY,
      catalogueId 
    })
  }

  const handleSpotlightTouchMove = (e: React.TouchEvent) => {
    if (spotlightTouchStart && spotlightIsDragging) {
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = Math.abs(currentX - spotlightTouchStart.x)
      const deltaY = Math.abs(currentY - spotlightTouchStart.y)
      
      // Si le mouvement horizontal est plus important que le vertical, empêcher le scroll vertical
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault()
      }
      
      setSpotlightTouchEnd(currentX)
    }
  }

  const handleSpotlightTouchEnd = () => {
    if (!spotlightTouchStart || !spotlightTouchEnd) {
      setSpotlightTouchStart(null)
      setSpotlightTouchEnd(null)
      setSpotlightIsDragging(false)
      return
    }
    
    const distance = spotlightTouchStart.x - spotlightTouchEnd
    const minSwipeDistance = 30 // Distance minimale réduite pour une meilleure réactivité
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSpotlightSlide(spotlightTouchStart.catalogueId)
    } else if (isRightSwipe) {
      prevSpotlightSlide(spotlightTouchStart.catalogueId)
    }
    
    setSpotlightTouchStart(null)
    setSpotlightTouchEnd(null)
    setSpotlightIsDragging(false)
  }

  // Fonctions pour le drag avec la souris
  const handleSpotlightMouseDown = (e: React.MouseEvent, catalogueId: string) => {
    setSpotlightTouchEnd(null)
    setSpotlightIsDragging(true)
    setSpotlightTouchStart({ x: e.clientX, y: e.clientY, catalogueId })
  }

  const handleSpotlightMouseMove = (e: React.MouseEvent) => {
    if (spotlightTouchStart && spotlightIsDragging) {
      setSpotlightTouchEnd(e.clientX)
    }
  }

  const handleSpotlightMouseUp = () => {
    if (!spotlightTouchStart || !spotlightTouchEnd) {
      setSpotlightTouchStart(null)
      setSpotlightTouchEnd(null)
      setSpotlightIsDragging(false)
      return
    }
    
    const distance = spotlightTouchStart.x - spotlightTouchEnd
    const minSwipeDistance = 30 // Distance minimale réduite pour une meilleure réactivité
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSpotlightSlide(spotlightTouchStart.catalogueId)
    } else if (isRightSwipe) {
      prevSpotlightSlide(spotlightTouchStart.catalogueId)
    }
    
    setSpotlightTouchStart(null)
    setSpotlightTouchEnd(null)
    setSpotlightIsDragging(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index)
  }

  // Handlers pour le défilement par rangée (chaque rangée a son propre index)
  const handleFeaturedPosterTouchStart = (e: React.TouchEvent, rowKey: string) => {
    setFeaturedPosterTouchStart({ rowKey, x: e.touches[0].clientX })
  }

  const handleFeaturedPosterTouchMove = (e: React.TouchEvent) => {
    if (featuredPosterTouchStart) {
      setFeaturedPosterTouchEnd({ rowKey: featuredPosterTouchStart.rowKey, x: e.touches[0].clientX })
    }
  }

  const handleFeaturedPosterTouchEnd = () => {
    if (!featuredPosterTouchStart || !featuredPosterTouchEnd || featuredPosterTouchStart.rowKey !== featuredPosterTouchEnd.rowKey) {
      setFeaturedPosterTouchStart(null)
      setFeaturedPosterTouchEnd(null)
      return
    }
    
    const distance = featuredPosterTouchStart.x - featuredPosterTouchEnd.x
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe || isRightSwipe) {
      setCurrentFeaturedPosterIndex((prev) => {
        const currentIndex = prev[featuredPosterTouchStart.rowKey] || 0
        return { ...prev, [featuredPosterTouchStart.rowKey]: isLeftSwipe ? currentIndex + 1 : currentIndex - 1 }
      })
    }
    
    setFeaturedPosterTouchStart(null)
    setFeaturedPosterTouchEnd(null)
  }

  const handleFeaturedPosterMouseDown = (e: React.MouseEvent, rowKey: string) => {
    setMouseStart({ rowKey, x: e.clientX })
  }

  const handleFeaturedPosterMouseMove = (e: React.MouseEvent) => {
    if (mouseStart) {
      setMouseEnd({ rowKey: mouseStart.rowKey, x: e.clientX })
    }
  }

  const handleFeaturedPosterMouseUp = () => {
    if (!mouseStart || !mouseEnd || mouseStart.rowKey !== mouseEnd.rowKey) {
      setMouseStart(null)
      setMouseEnd(null)
      return
    }
    
    const distance = mouseStart.x - mouseEnd.x
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe || isRightSwipe) {
      setCurrentFeaturedPosterIndex((prev) => {
        const currentIndex = prev[mouseStart.rowKey] || 0
        return { ...prev, [mouseStart.rowKey]: isLeftSwipe ? currentIndex + 1 : currentIndex - 1 }
      })
    }
    
    setMouseStart(null)
    setMouseEnd(null)
  }

  // Fonction pour extraire l'ID du contenu à partir de l'URL
  const extractContentIdFromUrl = (url: string): string | null => {
    if (!url) return null
    
    // Si l'URL contient /content/, extraire l'ID
    const contentMatch = url.match(/\/content\/([^\/\?]+)/)
    if (contentMatch) {
      return contentMatch[1]
    }
    
    // Si l'URL contient un ID de film ou série dans les paramètres
    const idMatch = url.match(/[?&]id=([^&]+)/)
    if (idMatch) {
      return idMatch[1]
    }
    
    return null
  }

  // Fonction pour récupérer l&apos;avis d&apos;un contenu
  const getContentRating = (url: string): number => {
    const contentId = extractContentIdFromUrl(url)
    if (!contentId) return 0
    
    const stats = ReviewsService.getReviewStats(contentId)
    return stats.averageRating
  }

  // Fonction pour récupérer le nombre d&apos;avis d&apos;un contenu

  // Fonctions pour le swipe du slider principal
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  // Fonctions pour le drag avec la souris (slider principal)
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(null)
    setTouchStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart !== null) {
      setTouchEnd(e.clientX)
    }
  }

  const handleMouseUp = () => {
    if (touchStart === null || touchEnd === null) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Auto-play du slider principal
  useEffect(() => {
    if (homepageContent.featuredSlider?.slides && homepageContent.featuredSlider.slides.length > 1) {
      const interval = setInterval(() => {
        nextSlide()
      }, (homepageContent.featuredSlider.autoplaySpeed || 5) * 1000)
      
      return () => clearInterval(interval)
    }
  }, [homepageContent.featuredSlider?.slides, homepageContent.featuredSlider?.autoplaySpeed])


  // Gestion de la pause/lecture automatique de la vidéo selon le scroll
  useEffect(() => {
    const handleScroll = () => {
      const mediaElement = document.getElementById('dashboard-media-video') as HTMLVideoElement | HTMLIFrameElement
      if (!mediaElement) return

      const mediaRect = mediaElement.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Si la vidéo est visible à plus de 50% dans la fenêtre
      const isVisible = mediaRect.top < windowHeight * 0.5 && mediaRect.bottom > windowHeight * 0.5
      
      // Pour les vidéos HTML5
      if (mediaElement.tagName === 'VIDEO') {
        const video = mediaElement as HTMLVideoElement
        if (isVisible) {
          if (video.paused) {
            video.play().catch((error) => logger.error('Erreur lors de la lecture', error as Error))
          }
        } else {
          if (!video.paused) {
            video.pause()
          }
        }
      }
      // Pour les iframes YouTube, on ne peut pas contrôler la lecture directement
      // L'autoplay est géré par les paramètres de l'iframe
    }

    // Écouter le scroll
    window.addEventListener('scroll', handleScroll)
    
    // Vérifier l'état initial
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [homepageContent])

  useEffect(() => {
    // Écouter les changements du contenu de la page d'accueil
    const handleStorageChange = () => {
      setHomepageContent(HomepageContentService.getContent())
    }
    
    const handleContentUpdate = () => {
      setHomepageContent(HomepageContentService.getContent())
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('homepageContentUpdated', handleContentUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('homepageContentUpdated', handleContentUpdate)
    }
  }, [])

  const loadContent = async () => {
    try {
      setIsLoading(true)
      const [moviesData, seriesData] = await Promise.all([
        ContentService.getMovies(),
        ContentService.getSeries()
      ])
      setMovies(moviesData)
      setSeries(seriesData)
    } catch (error) {
      logger.error('Erreur de chargement du contenu', error as Error)
    } finally {
      setIsLoading(false)
    }
  }


  // État pour la largeur de l'écran (pour réactivité)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  // Fonction pour obtenir le nombre d'items à afficher selon l'appareil
  const getItemsToShow = (catalogueItem: any): number => {
    // Utiliser window.innerWidth directement pour avoir la valeur actuelle
    if (typeof window === 'undefined') {
      // SSR: retourner la valeur par défaut pour PC
      return catalogueItem.itemsToShow ?? 12
    }
    
    const width = window.innerWidth
    // Mobile: < 768px
    if (width < 768) {
      return catalogueItem.itemsToShowMobile ?? 6
    }
    // Tablette: 768px - 1023px
    else if (width < 1024) {
      return catalogueItem.itemsToShowTablet ?? 9
    }
    // PC: >= 1024px
    else {
      return catalogueItem.itemsToShow ?? 12
    }
  }

  // Fonction pour rendre un catalogue spécifique
  const renderCatalogueSection = (catalogueItem: any) => {
    const { id, title, buttonText } = catalogueItem
    const itemsToShow = getItemsToShow(catalogueItem)
    
    // Note: Auto-play du slider géré dans le useEffect principal du composant
    
    // Configuration des catalogues avec leurs propriétés spécifiques
    const catalogueConfig = {
      'collection': {
        icon: '🎬',
        href: '/collection',
        condition: () => (movies.length > 0 || series.length > 0) && filters.contentType === 'all',
        content: () => {
          // Créer la collection alternée à partir des contenus filtrés (par genre/année)
          const moviesList = filteredContent.filter(item => 'duration' in item)
          const seriesList = filteredContent.filter(item => 'seasons' in item)
          
          const mixedCollection = []
          const maxLength = Math.max(moviesList.length, seriesList.length)
          
          for (let i = 0; i < Math.min(maxLength * 2, itemsToShow); i++) {
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
        },
        bgColor: 'bg-green-500'
      },
      'popular-movies': {
        icon: '🎭',
        href: '/films',
        condition: () => movies.length > 0 && (filters.contentType === 'all' || filters.contentType === 'movies'),
        content: () => filteredContent.filter(item => 'duration' in item),
        bgColor: 'bg-blue-500'
      },
      'popular-series': {
        icon: '📺',
        href: '/series',
        condition: () => series.length > 0 && (filters.contentType === 'all' || filters.contentType === 'series'),
        content: () => filteredContent.filter(item => 'seasons' in item),
        bgColor: 'bg-purple-500'
      },
      'jeux': {
        icon: '🎮',
        href: '/jeux',
        condition: () => true,
        content: () => filteredContent.filter(item => item.catalogue === 'jeux'),
        bgColor: 'bg-orange-500'
      },
      'sports': {
        icon: '⚽',
        href: '/sports',
        condition: () => true,
        content: () => filteredContent.filter(item => item.catalogue === 'sports'),
        bgColor: 'bg-green-500'
      },
      'animes': {
        icon: '🎌',
        href: '/animes',
        condition: () => true,
        content: () => filteredContent.filter(item => item.catalogue === 'animes'),
        bgColor: 'bg-pink-500'
      },
      'tendances': {
        icon: '🔥',
        href: '/tendances',
        condition: () => true,
        content: () => filteredContent.filter(item => item.catalogue === 'tendances'),
        bgColor: 'bg-red-500'
      },
      'documentaires': {
        icon: '📖',
        href: '/documentaires',
        condition: () => true,
        content: () => filteredContent.filter(item => item.catalogue === 'documentaires'),
        bgColor: 'bg-indigo-500'
      },
      'divertissements': {
        icon: '✨',
        href: '/divertissements',
        condition: () => true,
        content: () => filteredContent.filter(item => item.catalogue === 'divertissements'),
        bgColor: 'bg-yellow-500'
      }
    }

    const config = catalogueConfig[id as keyof typeof catalogueConfig]
    if (!config || !config.condition()) return null

    const content = config.content()
    if (!content || content.length === 0) return null

    // Vérifier si l'affiche à la une doit être affichée dans ce catalogue
    const shouldShowPosterSpotlight = homepageContent.posterSpotlight?.isVisible && 
                                     homepageContent.posterSpotlight?.posters && 
                                     homepageContent.posterSpotlight.posters.length > 0 &&
                                     homepageContent.posterSpotlight.posters.some((poster: any) => poster.catalogue === id)

    // Vérifier si le slider à la une doit être affiché dans ce catalogue
    const shouldShowSpotlightSlider = homepageContent.spotlightSlider?.isVisible && 
                                     homepageContent.spotlightSlider?.slideGroups && 
                                     homepageContent.spotlightSlider.slideGroups.length > 0 &&
                                     homepageContent.spotlightSlider.slideGroups.some((group: any) => group.catalogue === id)

    // Trouver les rangées qui correspondent à ce catalogue
    const featuredPosterRows = homepageContent.featuredPoster?.isVisible && homepageContent.featuredPoster?.rows
      ? homepageContent.featuredPoster.rows.filter((row: any) => 
          row.catalogue === id && 
          row.slides && 
          row.slides.length > 0 &&
          row.slides.some((slide: any) => slide.isActive)
        )
      : []

    return (
      <div key={id}>
        {/* Affiche à la une pour ce catalogue - Pleine largeur */}
        {shouldShowPosterSpotlight && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            {homepageContent.posterSpotlight.posters
              .filter((poster: any) => poster.catalogue === id)
              .map((poster: any, index: number) => (
                <div key={poster.id} className={index > 0 ? 'mt-4 sm:mt-6 md:mt-8' : ''}>
                  <Link href={poster.linkUrl || '/'}>
                    <div className="relative w-full aspect-video overflow-hidden cursor-pointer group">
                      <img
                        src={poster.imageUrl || '/placeholder-video.jpg'}
                        alt={poster.contentTitle || 'Affiche à la une'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                        }}
                      />
                      
                      {/* Overlay avec gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Contenu de l'affiche */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 lg:p-8">
                        {poster.contentTitle && (
                          <h3 
                            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 transition-colors"
                            style={isClient ? { color: homepageContent.appIdentity.colors.primary } : { color: 'white' }}
                          >
                            {poster.contentTitle}
                          </h3>
                        )}
                        {poster.description && (
                          <p className="text-gray-200 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl line-clamp-2 sm:line-clamp-3">
                            {poster.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Icône de lecture au centre */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div 
                          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-300"
                          style={isClient ? { 
                            backgroundColor: `${homepageContent.appIdentity.colors.primary}CC`,
                            '--hover-bg': homepageContent.appIdentity.colors.primary
                          } as React.CSSProperties : { backgroundColor: '#10B981CC' }}
                          onMouseEnter={(e) => {
                            if (isClient) {
                              e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.primary
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isClient) {
                              e.currentTarget.style.backgroundColor = `${homepageContent.appIdentity.colors.primary}CC`
                            }
                          }}
                        >
                          <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white ml-0.5 sm:ml-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        )}

        {/* Slider À la une pour ce catalogue - Pleine largeur */}
        {shouldShowSpotlightSlider && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            {/* Titre de la section */}
            {(homepageContent.spotlightSlider.title || homepageContent.spotlightSlider.subtitle) && (
              <div className="text-center mb-4 sm:mb-6 md:mb-8 px-3 sm:px-4">
                {homepageContent.spotlightSlider.title && (
                  <h2 
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3"
                    style={isClient ? { color: homepageContent.appIdentity.colors.primary } : { color: 'white' }}
                  >
                    {homepageContent.spotlightSlider.title}
                  </h2>
                )}
                {homepageContent.spotlightSlider.subtitle && (
                  <p className="text-gray-300 text-base sm:text-lg md:text-xl">
                    {homepageContent.spotlightSlider.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Slider animé avec carousel */}
            <div 
              className="relative w-full overflow-hidden px-2 sm:px-4 md:px-6 cursor-grab active:cursor-grabbing"
              onTouchStart={(e) => handleSpotlightTouchStart(e, id)}
              onTouchMove={handleSpotlightTouchMove}
              onTouchEnd={handleSpotlightTouchEnd}
              onTouchCancel={handleSpotlightTouchEnd}
              onMouseDown={(e) => handleSpotlightMouseDown(e, id)}
              onMouseMove={handleSpotlightMouseMove}
              onMouseUp={handleSpotlightMouseUp}
              onMouseLeave={handleSpotlightMouseUp}
              style={{ touchAction: 'pan-x pinch-zoom' }}
            >
              <div className="relative">
                {/* Conteneur des slides */}
                <div className="flex transition-transform duration-500 ease-in-out"
                     style={{ 
                       transform: `translateX(-${currentSpotlightIndex * 100}%)` 
                     }}>
                  {homepageContent.spotlightSlider.slideGroups
                    .filter((group: any) => group.catalogue === id)
                    .flatMap((group: any) => group.slides)
                    .map((slide: any, index: number) => (
                    <div key={slide.id} className="w-full flex-shrink-0 px-2">
                      <Link href={slide.linkUrl || '/'}>
                        <div className="relative cursor-pointer group rounded-xl overflow-hidden aspect-[16/9] sm:aspect-[21/9]">
                          <img
                            src={slide.imageUrl || '/placeholder-video.jpg'}
                            alt={slide.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                            }}
                          />
                          
                          {/* Overlay avec gradient plus sophistiqué */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          
                          {/* Effet de brillance au hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          
                          {/* Contenu du slide */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
                            <div className="max-w-2xl">
                              <h3 
                                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 transition-colors line-clamp-2"
                                style={isClient ? { color: homepageContent.appIdentity.colors.primary } : { color: 'white' }}
                              >
                                {slide.title}
                              </h3>
                              {slide.subtitle && (
                                <p className="text-gray-200 text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
                                  {slide.subtitle}
                                </p>
                              )}
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2.5 sm:px-6 sm:py-3 min-h-[44px] sm:min-h-0">
                                  <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  <span className="text-white text-sm sm:text-base font-medium">Regarder</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                                  <span className="text-white text-sm sm:text-base">
                                    {getContentRating(slide.linkUrl) > 0 
                                      ? getContentRating(slide.linkUrl).toFixed(1)
                                      : 'N/A'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Boutons de navigation - Centrés verticalement */}
                {homepageContent.spotlightSlider.slideGroups
                  .filter((group: any) => group.catalogue === id)
                  .flatMap((group: any) => group.slides).length > 1 && (
                  <>
                    <button
                      onClick={() => prevSpotlightSlide(id)}
                      className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2.5 sm:p-3 md:p-4 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm z-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      aria-label="Slide précédent"
                    >
                      <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </button>
                    <button
                      onClick={() => nextSpotlightSlide(id)}
                      className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2.5 sm:p-3 md:p-4 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm z-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      aria-label="Slide suivant"
                    >
                      <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section Affiche Mise en Avant pour ce catalogue */}
        {featuredPosterRows.map((row: any, rowIdx: number) => {
          const activeSlides = (row.slides || []).filter((s: any) => s.isActive)
          const slidesCount = activeSlides.length
          if (slidesCount === 0) return null
          
          const rowsCount = row.rowsCount || 1
          const itemsPerRow = Math.ceil(slidesCount / rowsCount)
          
          // Organiser les slides en rangées pour le défilement horizontal
          // Chaque slide garde son index global dans activeSlides pour les numéros
          const slidesInRows: Array<Array<{slide: any, globalIndex: number}>> = []
          for (let i = 0; i < rowsCount; i++) {
            const rowSlides = activeSlides.slice(i * itemsPerRow, (i + 1) * itemsPerRow)
            slidesInRows.push(
              rowSlides.map((slide: any, idx: number) => ({
                slide,
                globalIndex: i * itemsPerRow + idx + 1 // Numéro global de 1 à N
              }))
            )
          }
          
          return (
          <div key={row.id} className="mb-4 sm:mb-6 md:mb-8 px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Titre de la section avec le même style que les catalogues */}
            {homepageContent.featuredPoster?.title && (
              <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-2 sm:pb-3 md:pb-4">
                <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div 
                      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0"
                      style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#A855F7' }}
                    >
                      <span className="text-white text-lg sm:text-xl md:text-2xl">⭐</span>
                    </div>
                    <h2 
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
                      style={isClient ? { color: homepageContent.appIdentity.colors.primary } : { color: 'white' }}
                    >
                      {homepageContent.featuredPoster.title}
                    </h2>
                  </div>
                </div>
              </div>
            )}
            
            {/* Affichage des slides en carousel horizontal par rangée */}
            <div className="space-y-4">
              {slidesInRows.map((rowSlides: Array<{slide: any, globalIndex: number}>, rowIndex: number) => {
                const rowSlidesCount = rowSlides.length
                if (rowSlidesCount === 0) return null
                
                // Calculer l'index pour cette rangée (utiliser un index unique par rangée)
                const rowKey = `${row.id}-${rowIndex}`
                const rowCurrentIndex = currentFeaturedPosterIndex[rowKey] || rowSlidesCount
                const currentIndex = rowCurrentIndex % rowSlidesCount
                const adjustedIndex = rowSlidesCount + currentIndex
                const showNumbers = row.showNumbers !== false // Par défaut true
                
                // Dupliquer les slides pour la boucle infinie (en gardant les globalIndex)
                const duplicatedRowSlides = [...rowSlides, ...rowSlides, ...rowSlides]
                
                return (
                  <div key={rowKey} className="relative w-full overflow-hidden">
              {/* Container des slides - Mobile */}
              <div 
                className="flex md:hidden transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing"
                style={{ 
                        transform: `translateX(-${adjustedIndex * (100 / (row.itemsToShowMobile ?? homepageContent.featuredPoster?.itemsToShowMobile ?? 1))}%)` 
                }}
                      onTouchStart={(e) => handleFeaturedPosterTouchStart(e, rowKey)}
                onTouchMove={handleFeaturedPosterTouchMove}
                onTouchEnd={handleFeaturedPosterTouchEnd}
                      onMouseDown={(e) => handleFeaturedPosterMouseDown(e, rowKey)}
                onMouseMove={handleFeaturedPosterMouseMove}
                onMouseUp={handleFeaturedPosterMouseUp}
                onMouseLeave={handleFeaturedPosterMouseUp}
              >
                      {duplicatedRowSlides.map((slideData: {slide: any, globalIndex: number}, index: number) => {
                        const realIndex = index % rowSlidesCount
                        const slide = slideData.slide
                        const globalSlideNumber = slideData.globalIndex
                  return (
                    <div 
                            key={`${slide.id}-${rowKey}-${index}`} 
                      className="flex-shrink-0"
                            style={{ width: `${100 / (row.itemsToShowMobile ?? homepageContent.featuredPoster?.itemsToShowMobile ?? 1)}%` }}
                    >
                      <Link href={slide.linkUrl || '/'}>
                        <div className="relative aspect-[2/3] mx-1 rounded-lg overflow-hidden cursor-pointer group">
                          <img
                            src={slide.imageUrl || '/placeholder-video.jpg'}
                                  alt={`Affiche ${globalSlideNumber}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                            }}
                          />
                          
                          {/* Numéro seul sans fond - noir avec contour blanc */}
                                {showNumbers && (
                          <h1 
                            className="absolute bottom-0 left-0 font-bold" 
                            style={{ 
                              fontSize: '6.75rem',
                              color: 'black',
                              WebkitTextStroke: '2px white',
                              textShadow: 'none',
                              paddingLeft: '0.5rem',
                              paddingBottom: '0.25rem',
                              lineHeight: '1'
                            }}
                          >
                                    {globalSlideNumber}
                          </h1>
                                )}
                          
                          {/* Overlay au hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>

              {/* Container des slides - Tablette */}
              <div 
                className="hidden md:flex lg:hidden transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing"
                style={{ 
                        transform: `translateX(-${adjustedIndex * (100 / (row.itemsToShowTablet ?? homepageContent.featuredPoster?.itemsToShowTablet ?? 3))}%)` 
                }}
                      onTouchStart={(e) => handleFeaturedPosterTouchStart(e, rowKey)}
                onTouchMove={handleFeaturedPosterTouchMove}
                onTouchEnd={handleFeaturedPosterTouchEnd}
                      onMouseDown={(e) => handleFeaturedPosterMouseDown(e, rowKey)}
                onMouseMove={handleFeaturedPosterMouseMove}
                onMouseUp={handleFeaturedPosterMouseUp}
                onMouseLeave={handleFeaturedPosterMouseUp}
              >
                      {duplicatedRowSlides.map((slideData: {slide: any, globalIndex: number}, index: number) => {
                        const realIndex = index % rowSlidesCount
                        const slide = slideData.slide
                        const globalSlideNumber = slideData.globalIndex
                  return (
                    <div 
                            key={`${slide.id}-${rowKey}-${index}`} 
                      className="flex-shrink-0"
                            style={{ width: `${100 / (row.itemsToShowTablet ?? homepageContent.featuredPoster?.itemsToShowTablet ?? 3)}%` }}
                    >
                      <Link href={slide.linkUrl || '/'}>
                        <div className="relative aspect-[2/3] mx-1 rounded-lg overflow-hidden cursor-pointer group">
                          <img
                            src={slide.imageUrl || '/placeholder-video.jpg'}
                                  alt={`Affiche ${globalSlideNumber}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                            }}
                          />
                          
                          {/* Numéro seul sans fond - noir avec contour blanc */}
                                {showNumbers && (
                          <h1 
                            className="absolute bottom-0 left-0 font-bold" 
                            style={{ 
                              fontSize: '6.75rem',
                              color: 'black',
                              WebkitTextStroke: '2px white',
                              textShadow: 'none',
                              paddingLeft: '0.5rem',
                              paddingBottom: '0.25rem',
                              lineHeight: '1'
                            }}
                          >
                                    {globalSlideNumber}
                          </h1>
                                )}
                          
                          {/* Overlay au hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>

              {/* Container des slides - PC */}
              <div 
                className="hidden lg:flex transition-transform duration-500 ease-in-out"
                style={{ 
                        transform: `translateX(-${adjustedIndex * (100 / (row.itemsToShow ?? homepageContent.featuredPoster?.itemsToShow ?? 3))}%)` 
                }}
              >
                      {duplicatedRowSlides.map((slideData: {slide: any, globalIndex: number}, index: number) => {
                        const realIndex = index % rowSlidesCount
                        const slide = slideData.slide
                        const globalSlideNumber = slideData.globalIndex
                  return (
                    <div 
                            key={`${slide.id}-${rowKey}-${index}`} 
                      className="flex-shrink-0"
                            style={{ width: `${100 / (row.itemsToShow ?? homepageContent.featuredPoster?.itemsToShow ?? 3)}%` }}
                    >
                      <Link href={slide.linkUrl || '/'}>
                        <div className="relative aspect-[2/3] mx-1 rounded-lg overflow-hidden cursor-pointer group">
                          <img
                            src={slide.imageUrl || '/placeholder-video.jpg'}
                                  alt={`Affiche ${globalSlideNumber}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                            }}
                          />
                          
                          {/* Numéro seul sans fond - noir avec contour blanc */}
                                {showNumbers && (
                          <h1 
                            className="absolute bottom-0 left-0 font-bold" 
                            style={{ 
                              fontSize: '6.75rem',
                              color: 'black',
                              WebkitTextStroke: '2px white',
                              textShadow: 'none',
                              paddingLeft: '0.5rem',
                              paddingBottom: '0.25rem',
                              lineHeight: '1'
                            }}
                          >
                                    {globalSlideNumber}
                          </h1>
                                )}
                          
                          {/* Overlay au hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
                </div>
                )
              })}
            </div>
          </div>
          )
        })}

        {/* Contenu du catalogue avec padding */}
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 ${config.bgColor} rounded-full border-2 border-white flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-white text-lg sm:text-xl md:text-2xl">{config.icon}</span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">{title}</h2>
          </div>
          <Link
            href={config.href}
            className="transition-colors flex items-center space-x-1.5 sm:space-x-2 text-white hover:text-gray-300 text-base sm:text-lg md:text-xl px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-white/10"
          >
            <span className="hidden sm:inline">{buttonText}</span>
            <span className="sm:hidden">Voir</span>
            <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          </Link>
        </div>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3 md:gap-4 lg:gap-6 auto-rows-min">
          {content.slice(0, itemsToShow).map((item, index) => {
            const clickedItem = expandedCardId ? content.find(m => m.id === expandedCardId) : null
            const contentSlice = content.slice(0, itemsToShow)
            // Vérifier si c'est cette section qui doit afficher le modal
            const shouldDisplayModal = clickedItem && modalDisplayedSectionRef.current === id
            return (
              <React.Fragment key={item.id}>
                {/* Afficher la section extensible avant la première carte de la rangée si c'est la dernière rangée */}
                {shouldShowExpandableBefore(index, contentSlice) && clickedItem && shouldDisplayModal && (
                  <ExpandableCardSection
                    content={clickedItem}
                    isOpen={expandedCardId === clickedItem.id}
                    onClose={() => {
                      setExpandedCardId(null)
                      modalDisplayedSectionRef.current = null
                    }}
                  />
                )}
            <Link
              href={`/content/${item.id}`}
                    className={`group cursor-pointer ${index >= itemsToShow ? 'lg:hidden' : ''}`}
                  style={isClient ? { 
                    outline: 'none'
                  } as React.CSSProperties : {}}
              onMouseEnter={(e) => handleContentMouseEnter(item, e)}
              onMouseLeave={(e) => handleContentMouseLeave(item, e)}
                  onClick={(e) => handleContentClick(item, e, id)}
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
              <div className="mt-2">
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
                {shouldShowExpandableAfter(index, contentSlice) && clickedItem && shouldDisplayModal && (
                  <ExpandableCardSection
                    content={clickedItem}
                    isOpen={expandedCardId === clickedItem.id}
                    onClose={() => {
                      setExpandedCardId(null)
                      modalDisplayedSectionRef.current = null
                    }}
                  />
                )}
              </React.Fragment>
            )
          })}
          </div>
        </div>
      </div>
    )
  }

  // Fonction pour créer la collection alternée
  const getMixedCollection = () => {
    // Trier tous les contenus par année (plus récent en premier)
    const allContent = [...movies, ...series].sort((a, b) => b.year - a.year)
    
    // Créer une collection alternée : film, série, film, série...
    const mixedCollection = []
    const moviesList = allContent.filter(item => 'duration' in item)
    const seriesList = allContent.filter(item => 'seasons' in item)
    
    for (let i = 0; i < 9; i++) {
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
    
    return mixedCollection.slice(0, 9)
  }

  // Fonctions helper pour gérer la section dynamique
  const cardElementsRef = useRef<Map<string, HTMLElement>>(new Map())

  const handleContentMouseEnter = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    if (isClient) {
      e.currentTarget.style.borderColor = homepageContent.appIdentity.colors.primary
    }

    // Stocker la référence de l'élément de la carte
    cardElementsRef.current.set(content.id, e.currentTarget as HTMLElement)

    // Ne pas ouvrir automatiquement le modal au survol dans le dashboard utilisateur
    // Le modal peut être ouvert manuellement via un clic si nécessaire
  }

  const handleContentMouseLeave = (content: Movie | Series, e: React.MouseEvent<HTMLElement>) => {
    if (isClient) {
      e.currentTarget.style.borderColor = '#374151'
    }
    
    // Nettoyer la référence de l'élément
    cardElementsRef.current.delete(content.id)
  }

  const handleContentClick = (content: Movie | Series, e: React.MouseEvent<HTMLElement>, catalogueId?: string) => {
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
        modalDisplayedSectionRef.current = null
      } else {
        setExpandedCardId(content.id)
        // Enregistrer quelle section a affiché le modal
        if (catalogueId) {
          modalDisplayedSectionRef.current = catalogueId
        }
      }
    }
    // Si pas de trailerUrl, on laisse la navigation normale se faire
  }

  const handleContentTouch = (content: Movie | Series, e: React.TouchEvent<HTMLElement>, catalogueId?: string) => {
    if (user && content.trailerUrl) {
    e.preventDefault()
    e.stopPropagation()
      // Marquer qu'on a géré le touch pour éviter le double déclenchement
      touchHandledRef.current = true
      // Toggle: si la carte est déjà ouverte, la fermer, sinon l'ouvrir
      if (expandedCardId === content.id) {
        setExpandedCardId(null)
        modalDisplayedSectionRef.current = null
      } else {
        setExpandedCardId(content.id)
        // Enregistrer quelle section a affiché le modal
        if (catalogueId) {
          modalDisplayedSectionRef.current = catalogueId
        }
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
  const shouldShowExpandableBefore = (index: number, contentArray: (Movie | Series)[]) => {
    if (!expandedCardId) return false
    const clickedIndex = contentArray.findIndex(m => m.id === expandedCardId)
    if (clickedIndex === -1) return false
    
    const clickedRow = Math.floor(clickedIndex / columnsPerRow)
    const currentRow = Math.floor(index / columnsPerRow)
    const totalRows = Math.ceil(contentArray.length / columnsPerRow)
    
    // Si la carte cliquée est dans la dernière rangée, afficher en haut de la rangée
    if (clickedRow === totalRows - 1 && currentRow === clickedRow && isStartOfRow(index)) {
      return true
    }
    return false
  }

  // Fonction pour vérifier si on doit afficher la section extensible après cette carte (en bas de la rangée)
  const shouldShowExpandableAfter = (index: number, contentArray: (Movie | Series)[]) => {
    if (!expandedCardId) return false
    const clickedIndex = contentArray.findIndex(m => m.id === expandedCardId)
    if (clickedIndex === -1) return false
    
    const clickedRow = Math.floor(clickedIndex / columnsPerRow)
    const currentRow = Math.floor(index / columnsPerRow)
    const totalRows = Math.ceil(contentArray.length / columnsPerRow)
    
    // Si la carte cliquée n'est pas dans la dernière rangée, afficher à la fin de la rangée
    if (clickedRow < totalRows - 1 && currentRow === clickedRow && isEndOfRow(index)) {
      return true
    }
    return false
  }

  const renderHomeContent = () => (
    <div>



      {/* Slider de mise en avant */}
      {homepageContent.featuredSlider?.isVisible && homepageContent.featuredSlider?.slides && homepageContent.featuredSlider.slides.length > 0 && (
        <div>
          {/* Titre de la section */}
          {(homepageContent.featuredSlider.title || homepageContent.featuredSlider.subtitle) && (
          <div className="text-center">
              {homepageContent.featuredSlider.title && (
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-2"
                  style={isClient ? { color: homepageContent.appIdentity.colors.primary } : { color: 'white' }}
                >
                  {homepageContent.featuredSlider.title}
                </h2>
              )}
              {homepageContent.featuredSlider.subtitle && (
                <p className="text-gray-300 text-lg">
                  {homepageContent.featuredSlider.subtitle}
                </p>
              )}
          </div>
          )}

          {/* Slider */}
          <div 
            className="relative w-full aspect-video overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Slides */}
            <div className="relative w-full h-full">
              {homepageContent.featuredSlider.slides.map((slide: any, index: number) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlideIndex ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Link href={slide.linkUrl || '/'}>
                    <div className="relative w-full h-full cursor-pointer group">
                      <img
                        src={slide.imageUrl || '/placeholder-video.jpg'}
                        alt={slide.title}
                        className="w-full h-full object-cover select-none"
                        draggable={false}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                        }}
                      />
                      
                      {/* Overlay avec gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Contenu du slide */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <h3 
                          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 transition-colors"
                          style={isClient ? { color: homepageContent.appIdentity.colors.primary } : { color: 'white' }}
                        >
                          {slide.title}
                        </h3>
                        {slide.subtitle && (
                          <p className="text-gray-200 text-sm sm:text-base md:text-lg">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Boutons de navigation - Masqués sur mobile */}
            {homepageContent.featuredSlider.slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 md:p-4 rounded-full transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Slide précédent"
                >
                  <ChevronLeftIcon className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                <button
                  onClick={nextSlide}
                  className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 md:p-4 rounded-full transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Slide suivant"
                >
                  <ChevronRightIcon className="w-6 h-6 md:w-7 md:h-7" />
                </button>
              </>
            )}

            {/* Indicateurs de pagination */}
            {homepageContent.featuredSlider.slides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {homepageContent.featuredSlider.slides.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-200 ${
                      index === currentSlideIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Aller au slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Média de couverture si activé - Affichage automatique comme sur la page d'accueil */}
      {homepageContent.sectionsVisibility.media && homepageContent.media.isVisibleDashboard && (() => {
        // Utiliser videoUrl en priorité, sinon trailerUrl
        const videoSource = homepageContent.media?.videoUrl || homepageContent.media?.trailerUrl
        
        // Fonction pour extraire l'URL d'un code HTML embed (iframe)
        const extractEmbedUrl = (htmlString: string): string | null => {
          // Vérifier si c'est un code HTML contenant un iframe
          if (htmlString.includes('<iframe')) {
            const iframeMatch = htmlString.match(/<iframe[^>]+src=["']([^"']+)["']/i)
            if (iframeMatch && iframeMatch[1]) {
              return iframeMatch[1]
            }
          }
          return null
        }

        if (!videoSource) {
          // Si pas de vidéo, afficher l'image de fallback
          return (
            <div>
              <div className="relative w-full aspect-video bg-black overflow-hidden shadow-2xl">
                <div className="relative w-full h-full">
                  <img
                    src={homepageContent.media?.imageUrl || '/placeholder-campaign.jpg'}
                    alt="Campagne publicitaire"
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: '16/9' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-campaign.jpg'
                    }}
                  />
                  
                  {/* Overlay avec titre, sous-titre et bouton d'action pour les images */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end items-start text-left px-4 sm:px-6 md:px-12 pb-4 sm:pb-6 md:pb-12 z-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
                      {homepageContent.media.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-200 mb-3 sm:mb-4 md:mb-8 drop-shadow-lg max-w-2xl line-clamp-2 sm:line-clamp-3">
                      {homepageContent.media.subtitle}
                    </p>
                    
                    {/* Bouton d'action */}
                    {(homepageContent.media.watchNowText || homepageContent.media.contentUrl) && (
                      <a
                        href={homepageContent.media.contentUrl ? (homepageContent.media.contentUrl.startsWith('/') ? homepageContent.media.contentUrl : `/content/${homepageContent.media.contentUrl}`) : '/'}
                        onClick={(e) => e.stopPropagation()}
                        className="text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm bg-black/30 border border-white/20 text-base sm:text-lg md:text-xl"
                        style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                      >
                        <span>{homepageContent.media.watchNowText || 'Regarder maintenant'}</span>
                        <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // Vérifier si c'est un code HTML embed
        const embedUrl = extractEmbedUrl(videoSource)
        const finalUrl = embedUrl || videoSource
        
        return (
          <div>
            <div 
              className="relative w-full aspect-video bg-black overflow-hidden shadow-2xl cursor-pointer"
              onClick={toggleVideoPlayPause}
            >
              <div className="relative w-full h-full">
                {/* Image de fallback si la vidéo est terminée */}
                {videoFinished && homepageContent.media?.imageUrl && (
                  <img
                    src={homepageContent.media.imageUrl}
                    alt={homepageContent.media.title || 'Media'}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ aspectRatio: '16/9' }}
                  />
                )}
                
                {/* Détection des liens YouTube - affichée seulement si la vidéo n'est pas terminée */}
                {!videoFinished && finalUrl && (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) ? (
                  <iframe
                    id="dashboard-media-video"
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(finalUrl)}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : !videoFinished && (embedUrl || finalUrl.includes('embed') || finalUrl.includes('/e/') || finalUrl.includes('iframe') || finalUrl.includes('uqload') || finalUrl.includes('streamtape') || finalUrl.includes('doodstream') || finalUrl.includes('mixdrop')) ? (
                  // Code embed détecté (iframe, embed, etc.)
                  // Note: Pour les iframes, on ne peut pas détecter la fin de la vidéo facilement
                  <iframe
                    id="dashboard-media-video"
                    src={finalUrl}
                    className="w-full h-full"
                    title="Video player"
                    frameBorder="0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                  />
                ) : !videoFinished ? (
                  <video
                    id="dashboard-media-video"
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted={isVideoMuted}
                    playsInline
                    preload="metadata"
                    poster={homepageContent.media?.imageUrl || '/placeholder-video.jpg'}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => {
                      // Afficher l'image de fallback à la fin de la vidéo
                      setVideoFinished(true)
                    }}
                    onError={(e) => {
                      logger.error('Erreur de lecture vidéo', new Error('Erreur de lecture vidéo'))
                      // Fallback vers image si la vidéo ne peut pas être lue
                      const videoElement = e.target as HTMLVideoElement
                      const parent = videoElement.parentElement
                      if (parent && homepageContent.media?.imageUrl) {
                        parent.innerHTML = `
                          <img 
                            src="${homepageContent.media.imageUrl}" 
                            alt="Vidéo non disponible" 
                            class="w-full h-full object-cover"
                            style="aspect-ratio: 16/9"
                          />
                        `
                      } else if (parent) {
                        parent.innerHTML = `
                          <img 
                            src="/placeholder-campaign.jpg" 
                            alt="Vidéo non disponible" 
                            class="w-full h-full object-cover"
                          />
                        `
                      }
                    }}
                  >
                    <source src={finalUrl} type="video/mp4" />
                    <source src={finalUrl} type="video/webm" />
                    <source src={finalUrl} type="video/ogg" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                ) : null}

                 {/* Bouton de contrôle du son */}
                 {videoSource && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation()
                       toggleVideoSound(e)
                     }}
                     className="absolute top-4 right-2 sm:top-6 sm:right-4 md:top-8 md:right-6 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 z-30"
                     aria-label={isVideoMuted ? "Activer le son" : "Désactiver le son"}
                   >
                     {isVideoMuted ? (
                       <SpeakerXMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                     ) : (
                       <SpeakerWaveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                     )}
                   </button>
                 )}

                 {/* Bouton de lecture/pause au centre */}
                 {videoSource && (() => {
                   const embedUrl = extractEmbedUrl(videoSource)
                   const finalUrl = embedUrl || videoSource
                   const youtubeId = finalUrl ? extractYouTubeId(finalUrl) : null
                   return (
                     <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                       <div 
                         className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 pointer-events-auto cursor-pointer ${
                           isVideoPlaying ? 'opacity-80 hover:opacity-100' : 'opacity-0 hover:opacity-100'
                         }`}
                         onClick={(e) => {
                           e.stopPropagation()
                           toggleVideoPlayPause()
                         }}
                       >
                         {youtubeId ? (
                           <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                         ) : (
                           isVideoPlaying ? (
                             <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center">
                               <div className="w-2 h-6 sm:w-2.5 sm:h-7 md:w-3 md:h-8 bg-white rounded-sm mr-1"></div>
                               <div className="w-2 h-6 sm:w-2.5 sm:h-7 md:w-3 md:h-8 bg-white rounded-sm"></div>
                             </div>
                           ) : (
                             <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                           )
                         )}
                       </div>
                     </div>
                   )
                 })()}
                 
                 {/* Overlay avec titre, sous-titre et bouton d'action */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                 <div className="absolute inset-0 flex flex-col justify-end items-start text-left px-4 sm:px-6 md:px-12 pb-4 sm:pb-6 md:pb-12 z-10">
                   <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-4 drop-shadow-lg">
                     {homepageContent.media.title}
                   </h2>
                   <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-200 mb-3 sm:mb-4 md:mb-8 drop-shadow-lg max-w-2xl line-clamp-2 sm:line-clamp-3">
                     {homepageContent.media.subtitle}
                   </p>
                   
                   {/* Bouton d'action */}
                   {(homepageContent.media.watchNowText || homepageContent.media.contentUrl) && (
                     <a
                       href={homepageContent.media.contentUrl ? (homepageContent.media.contentUrl.startsWith('/') ? homepageContent.media.contentUrl : `/content/${homepageContent.media.contentUrl}`) : '/'}
                       onClick={(e) => e.stopPropagation()}
                       className="text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm bg-black/30 border border-white/20 text-base sm:text-lg md:text-xl"
                       style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                     >
                       <span>{homepageContent.media.watchNowText || 'Regarder maintenant'}</span>
                       <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                     </a>
                   )}
                  </div>
              </div>
            </div>
          </div>
        )
      })()}


      {/* Affichage de la collection complète quand le filtre est sur "collection" */}
      {filters.contentType === 'collection' && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Notre collection complète</h2>
            </div>
            <Link
              href="/collection"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 lg:gap-6 auto-rows-min">
            {filteredContent.map((item, index) => {
              const clickedItem = expandedCardId ? filteredContent.find(m => m.id === expandedCardId) : null
              // Vérifier si c'est cette section qui doit afficher le modal
              const shouldDisplayModal = clickedItem && modalDisplayedSectionRef.current === 'collection-full'
              return (
                <React.Fragment key={item.id}>
                  {/* Afficher la section extensible avant la première carte de la rangée si c'est la dernière rangée */}
                  {shouldShowExpandableBefore(index, filteredContent) && clickedItem && shouldDisplayModal && (
                    <ExpandableCardSection
                      content={clickedItem}
                      isOpen={expandedCardId === clickedItem.id}
                      onClose={() => {
                        setExpandedCardId(null)
                        modalDisplayedSectionRef.current = null
                      }}
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
                    onClick={(e) => handleContentClick(item, e, 'collection-full')}
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
                <div className="mt-2">
                  <h3 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{item.title}</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
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
                  {shouldShowExpandableAfter(index, filteredContent) && clickedItem && shouldDisplayModal && (
                    <ExpandableCardSection
                      content={clickedItem}
                      isOpen={expandedCardId === clickedItem.id}
                      onClose={() => {
                        setExpandedCardId(null)
                        modalDisplayedSectionRef.current = null
                      }}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}

      {/* Rendu des catalogues dans l'ordre défini */}
      {homepageContent.catalogue?.items
        ?.filter(item => item.isVisible)
        ?.map(renderCatalogueSection)}

      {/* Notre collection - REMPLACÉ PAR renderCatalogueSection */}
      {false && (movies.length > 0 || series.length > 0) && filters.contentType === 'all' && homepageContent.catalogue?.items?.find(item => item.id === 'collection')?.isVisible && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Notre collection</h2>
            </div>
            <Link
              href="/collection"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 lg:gap-6 auto-rows-min">
            {getMixedCollection().map((item, index) => {
              const clickedItem = expandedCardId ? getMixedCollection().find(m => m.id === expandedCardId) : null
              const mixedCollection = getMixedCollection()
              return (
                <React.Fragment key={item.id}>
                  {shouldShowExpandableBefore(index, mixedCollection) && clickedItem && (
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
                <div className="mt-2">
                  <h3 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{item.title}</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
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
                  {shouldShowExpandableAfter(index, mixedCollection) && clickedItem && (
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
        </div>
      )}

      {/* Films populaires - REMPLACÉ PAR renderCatalogueSection */}
      {false && movies.length > 0 && (filters.contentType === 'all' || filters.contentType === 'movies') && homepageContent.catalogue?.items?.find(item => item.id === 'popular-movies')?.isVisible && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">🎬</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Films Populaires</h2>
            </div>
            <Link
              href="/films"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => 'duration' in item).slice(0, 8).map((movie) => (
              <Link
                key={movie.id}
                href={`/content/${movie.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(movie, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(movie, e)}
                onClick={(e) => handleContentClick(movie, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={movie.posterUrl || '/placeholder-video.jpg'}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl mb-2 line-clamp-2">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm sm:text-base text-gray-400 min-h-[1.5rem]">
                    <span>{movie.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(movie.id) > 0 ? getContentRating(movie.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Séries populaires - REMPLACÉ PAR renderCatalogueSection */}
      {false && series.length > 0 && (filters.contentType === 'all' || filters.contentType === 'series') && homepageContent.catalogue?.items?.find(item => item.id === 'popular-series')?.isVisible && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">📺</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Séries Populaires</h2>
            </div>
            <Link
              href="/series"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => 'seasons' in item).slice(0, 8).map((serie) => (
              <Link
                key={serie.id}
                href={`/content/${serie.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(serie, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(serie, e)}
                onClick={(e) => handleContentClick(serie, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={serie.posterUrl || '/placeholder-video.jpg'}
                    alt={serie.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {serie.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{serie.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(serie.id) > 0 ? getContentRating(serie.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section Jeux - REMPLACÉ PAR renderCatalogueSection */}
      {false && homepageContent.catalogue?.items?.find(item => item.id === 'jeux')?.isVisible && (
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">🎮</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Jeux</h2>
            </div>
            <Link
              href="/jeux"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => item.catalogue === 'jeux').slice(0, 8).map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(content, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(content, e)}
                onClick={(e) => handleContentClick(content, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={content.posterUrl || '/placeholder-video.jpg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{content.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(content.id) > 0 ? getContentRating(content.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section Sports */}
      {false && homepageContent.catalogue?.items?.find(item => item.id === 'sports')?.isVisible && (
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">⚽</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Sports</h2>
            </div>
            <Link
              href="/sports"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => item.catalogue === 'sports').slice(0, 8).map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(content, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(content, e)}
                onClick={(e) => handleContentClick(content, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={content.posterUrl || '/placeholder-video.jpg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{content.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(content.id) > 0 ? getContentRating(content.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section Animes */}
      {false && homepageContent.catalogue?.items?.find(item => item.id === 'animes')?.isVisible && (
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">🎌</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Animes</h2>
            </div>
            <Link
              href="/animes"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => item.catalogue === 'animes').slice(0, 8).map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(content, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(content, e)}
                onClick={(e) => handleContentClick(content, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={content.posterUrl || '/placeholder-video.jpg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{content.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(content.id) > 0 ? getContentRating(content.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section Tendances */}
      {false && homepageContent.catalogue?.items?.find(item => item.id === 'tendances')?.isVisible && (
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">🔥</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Tendances</h2>
            </div>
            <Link
              href="/tendances"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => item.catalogue === 'tendances').slice(0, 8).map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(content, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(content, e)}
                onClick={(e) => handleContentClick(content, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={content.posterUrl || '/placeholder-video.jpg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{content.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(content.id) > 0 ? getContentRating(content.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section Documentaires */}
      {false && homepageContent.catalogue?.items?.find(item => item.id === 'documentaires')?.isVisible && (
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">📖</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Documentaires</h2>
            </div>
            <Link
              href="/documentaires"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => item.catalogue === 'documentaires').slice(0, 8).map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(content, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(content, e)}
                onClick={(e) => handleContentClick(content, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={content.posterUrl || '/placeholder-video.jpg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{content.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(content.id) > 0 ? getContentRating(content.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section Divertissements */}
      {false && homepageContent.catalogue?.items?.find(item => item.id === 'divertissements')?.isVisible && (
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <span className="text-white text-lg">✨</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Divertissements</h2>
            </div>
            <Link
              href="/divertissements"
              className="transition-colors flex items-center space-x-1 text-white hover:text-gray-300"
            >
              <span>Voir tout</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
            {filteredContent.filter(item => item.catalogue === 'divertissements').slice(0, 8).map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="group cursor-pointer"
                style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
                onMouseEnter={(e) => !isMobile && handleContentMouseEnter(content, e)}
                onMouseLeave={(e) => !isMobile && handleContentMouseLeave(content, e)}
                onClick={(e) => handleContentClick(content, e)}
              >
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <OptimizedImage
                    src={content.posterUrl || '/placeholder-video.jpg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={300}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 min-h-[1.5rem]">
                    <span>{content.year}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getContentRating(content.id) > 0 ? getContentRating(content.id).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de contenu */}
      {!isLoading && movies.length === 0 && series.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">Aucun contenu disponible</h3>
          <p className="text-gray-400 mb-6">
            Les films et séries seront bientôt disponibles. Revenez plus tard !
          </p>
        </div>
      )}
    </div>
  )

  // Composant de filtres
  const renderFilters = () => {
    // Déterminer le texte à afficher selon la taille d'écran
    const genreLabel = isMobile ? 'Genres' : 'Tous les genres'
    const yearLabel = isMobile ? 'Années' : 'Toutes les années'

    return (
      <div className="flex flex-row gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 items-center w-full">
        {/* Filtre Type de contenu */}
        <div className="relative flex-1 min-w-0">
          <select
            value={filters.contentType}
            onChange={(e) => updateFilter('contentType', e.target.value)}
            className="appearance-none bg-dark-300 border border-gray-600 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 lg:px-4 lg:py-2.5 pr-8 sm:pr-10 md:pr-12 lg:pr-10 text-sm sm:text-base md:text-lg lg:text-base text-white focus:outline-none focus:border-gray-600 w-full"
            style={{
              ...(isClient ? {
                '--tw-ring-color': homepageContent.appIdentity.colors.primary
              } as React.CSSProperties & { '--tw-ring-color': string } : {})
            }}
          >
            <option value="all">Tous</option>
            <option value="movies">Films</option>
            <option value="series">Séries</option>
            <option value="collection">Collection</option>
          </select>
          <ChevronDownIcon className="absolute right-2 sm:right-3 md:right-4 lg:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtre Genre */}
        <div className="relative flex-1 min-w-0">
          <select
            value={filters.genre}
            onChange={(e) => updateFilter('genre', e.target.value)}
            className="appearance-none bg-dark-300 border border-gray-600 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 lg:px-4 lg:py-2.5 pr-8 sm:pr-10 md:pr-12 lg:pr-10 text-sm sm:text-base md:text-lg lg:text-base text-white focus:outline-none focus:border-gray-600 w-full"
            style={{
              ...(isClient ? {
                '--tw-ring-color': homepageContent.appIdentity.colors.primary
              } as React.CSSProperties & { '--tw-ring-color': string } : {})
            }}
          >
            <option value="all">{genreLabel}</option>
            {uniqueGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 sm:right-3 md:right-4 lg:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtre Année */}
        <div className="relative flex-1 min-w-0">
          <select
            value={filters.year}
            onChange={(e) => updateFilter('year', e.target.value)}
            className="appearance-none bg-dark-300 border border-gray-600 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 lg:px-4 lg:py-2.5 pr-8 sm:pr-10 md:pr-12 lg:pr-10 text-sm sm:text-base md:text-lg lg:text-base text-white focus:outline-none focus:border-gray-600 w-full"
            style={{
              ...(isClient ? {
                '--tw-ring-color': homepageContent.appIdentity.colors.primary
              } as React.CSSProperties & { '--tw-ring-color': string } : {})
            }}
          >
            <option value="all">{yearLabel}</option>
            {uniqueYears.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 sm:right-3 md:right-4 lg:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Bouton Réinitialiser (X) - Afficher uniquement si un filtre est sélectionné */}
        {(filters.contentType !== 'all' || filters.genre !== 'all' || filters.year !== 'all') && (
        <button
          onClick={() => setFilters({ contentType: 'all', genre: 'all', year: 'all' })}
          className="p-2.5 sm:p-3 md:p-3.5 lg:p-2.5 bg-dark-300 border border-gray-600 rounded-lg hover:bg-dark-200 transition-colors flex-shrink-0"
          aria-label="Réinitialiser les filtres"
          title="Réinitialiser les filtres"
        >
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-5 lg:h-5 text-gray-400" />
        </button>
        )}
      </div>
    )
  }

  const renderMoviesContent = () => {
    // Filtrer seulement les films
    const moviesOnly = filteredContent.filter(item => 'duration' in item)
    
    return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Films</h2>
          <span className="text-gray-400 text-sm">
            {moviesOnly.length} résultat{moviesOnly.length > 1 ? 's' : ''}
          </span>
        </div>
        
        {renderFilters()}
        
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
          {moviesOnly.map((item) => (
          <Link
            key={item.id}
            href={`/content/${item.id}`}
            className="group relative bg-dark-200 rounded-xl overflow-hidden border border-gray-700 transition-all duration-300 hover:scale-105 shadow-lg"
            style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
            onMouseEnter={(e) => {
              if (isClient) {
                e.currentTarget.style.borderColor = homepageContent.appIdentity.colors.primary
              }
            }}
            onMouseLeave={(e) => {
              if (isClient) {
                e.currentTarget.style.borderColor = '#374151'
              }
            }}
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
            <div className="p-4">
              <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.year}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredContent.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">Aucun résultat trouvé</h3>
          <p className="text-gray-400 mb-6">
            Essayez de modifier vos filtres pour voir plus de contenu.
          </p>
          <button
            onClick={() => setFilters({ contentType: 'all', genre: 'all', year: 'all' })}
            className="px-6 py-3 text-white rounded-lg transition-colors"
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
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  )
  }

  const renderSeriesContent = () => {
    // Filtrer seulement les séries
    const seriesOnly = filteredContent.filter(item => 'seasons' in item)
    
    return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Séries</h2>
          <span className="text-gray-400 text-sm">
            {seriesOnly.length} résultat{seriesOnly.length > 1 ? 's' : ''}
          </span>
        </div>
        
        {renderFilters()}
        
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
          {seriesOnly.map((item) => (
          <Link
            key={item.id}
            href={`/content/${item.id}`}
            className="group relative bg-dark-200 rounded-xl overflow-hidden border border-gray-700 transition-all duration-300 hover:scale-105 shadow-lg"
            style={isClient ? { '--hover-border-color': homepageContent.appIdentity.colors.primary } as React.CSSProperties : {}}
            onMouseEnter={(e) => {
              if (isClient) {
                e.currentTarget.style.borderColor = homepageContent.appIdentity.colors.primary
              }
            }}
            onMouseLeave={(e) => {
              if (isClient) {
                e.currentTarget.style.borderColor = '#374151'
              }
            }}
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
            <div className="p-4">
              <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.year}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredContent.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">Aucun résultat trouvé</h3>
          <p className="text-gray-400 mb-6">
            Essayez de modifier vos filtres pour voir plus de contenu.
          </p>
          <button
            onClick={() => setFilters({ contentType: 'all', genre: 'all', year: 'all' })}
            className="px-6 py-3 text-white rounded-lg transition-colors"
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
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  )
  }

  const renderWishlistContent = () => (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Ma Liste de Souhaits</h2>
      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">Votre liste de souhaits est vide</p>
          <button
            onClick={() => setActiveTab('movies')}
            className="px-6 py-3 text-white rounded-lg transition-colors"
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
          {wishlist.map((item) => (
            <Link key={item.id} href={`/content/${item.id}`} className="group cursor-pointer">
              <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <OptimizedImage
                  src={item.posterUrl || '/placeholder-video.jpg'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  width={200}
                  height={300}
                />
              </div>
              <div className="mt-2">
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
          ))}
        </div>
      )}
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 pb-16 sm:pb-20 md:pb-24">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-dark-300 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 lg:py-2 border-b border-gray-800">
          <nav className="flex items-center justify-between w-full gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 h-full">
            {/* Logo à gauche */}
            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 flex-shrink-0 min-w-0 h-full">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-1.5 flex-shrink-0 h-full">
                <div 
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                >
                  <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-5 lg:h-5 text-white" />
                </div>
                <span className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-white whitespace-nowrap truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{isClient ? homepageContent.appIdentity.name : 'Atiha'}</span>
              </div>
              <div className="hidden sm:block">
              <HeaderStatusIndicator />
              </div>
            </div>
            
            {/* Barre de recherche - Mobile: icône à gauche, Desktop: barre au centre */}
            {isSearchFocused ? (
              <div className="flex items-center flex-1 min-w-0 transition-all duration-300 ease-in-out mx-1 sm:mx-2 h-full">
                <div className="flex-1 min-w-0 h-full flex items-center">
                  <SearchBar 
                    placeholder="Rechercher..." 
                    className="w-full h-full"
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
                  className="ml-1 sm:ml-2 p-2.5 sm:p-3 lg:p-2.5 bg-dark-300 border border-gray-600 rounded-lg hover:bg-dark-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center h-full"
                  aria-label="Fermer la recherche"
                  title="Fermer la recherche"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-gray-400" />
                </button>
              </div>
            ) : (
              <>
                {/* Espace flexible au centre sur desktop */}
                <div className="hidden sm:flex flex-1 min-w-0 ml-1 sm:ml-2 md:ml-4 lg:ml-2 mr-0.5 sm:mr-1 h-full">
                  <div className="flex-1 min-w-0 h-full flex items-center">
                    <SearchBar 
                      placeholder="Rechercher..." 
                      className="w-full h-full"
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Boutons à droite - Recherche, Notifications, Téléchargements, Favoris */}
            <div 
              className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 flex-shrink-0 transition-all duration-300 ease-in-out h-full ${
                isSearchFocused ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100 w-auto pointer-events-auto'
              }`}
            >
              {/* Icône de recherche sur mobile - à gauche des autres icônes */}
              <button
                onClick={() => setIsSearchFocused(true)}
                className="sm:hidden p-2.5 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0 h-full flex items-center"
                title="Rechercher"
                aria-label="Rechercher"
              >
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
              </button>
              {/* Bouton Notifications */}
              <button
                onClick={() => {
                  setShowNotificationsModal(true)
                  // Vérifier les nouveaux contenus quand on ouvre le modal
                  NotificationsService.checkForNewContent()
                  setUnreadNotificationsCount(NotificationsService.getUnreadCount())
                }}
                className="flex items-center space-x-1 sm:space-x-2 p-2.5 sm:p-3 md:p-3.5 lg:p-2.5 rounded-lg hover:bg-gray-700 transition-colors relative flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 justify-center h-full"
                title="Notifications"
                aria-label="Notifications"
              >
                <BellIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-6 lg:h-6 text-gray-400" />
                {/* Badge de notification */}
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-dark-300"></span>
                )}
                <span className="hidden lg:inline text-sm lg:text-base text-gray-400 ml-1">Notification</span>
              </button>

              {/* Bouton Favoris */}
              <button
                onClick={() => {
                  setShowFavoritesModal(true)
                  // Marquer les favoris comme vus quand on ouvre le modal
                  FavoritesNotificationService.markAllAsSeen()
                  setUnseenFavoritesCount(0)
                }}
                className="flex items-center space-x-1 sm:space-x-2 p-2.5 sm:p-3 md:p-3.5 lg:p-2.5 rounded-lg hover:bg-gray-700 transition-colors relative flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 justify-center h-full"
                title="Mes favoris"
                aria-label="Mes favoris"
              >
                <HeartIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-6 lg:h-6 text-gray-400" />
                <span className="hidden lg:inline text-sm lg:text-base text-gray-400 ml-1">Favori</span>
                {/* Badge de favoris non vus */}
                {unseenFavoritesCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-dark-300"></span>
                )}
              </button>

              {/* User Profile Menu */}
              <div className="relative user-menu-container h-full flex items-center">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-2.5 lg:space-x-1.5 p-2 sm:p-2.5 md:p-3 lg:p-2.5 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 h-full"
                  aria-label="Menu utilisateur"
                >
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                  >
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <span className="text-white font-medium hidden xl:block text-sm sm:text-base whitespace-nowrap truncate max-w-[100px] sm:max-w-none">{user?.name}</span>
                  <ChevronDownIcon className={`w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 text-gray-400 transition-transform flex-shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 mr-2 sm:mr-4 md:mr-6 w-48 sm:w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-[60]">
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
                        <StarIcon className="w-5 h-5" />
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
                    {isClient && homepageContent.appIdentity.socialLinks.telegram?.isVisible && (
                    <a
                        href={homepageContent.appIdentity.socialLinks.telegram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 px-4 py-3 mx-2 my-1 text-white rounded-lg border shadow-lg transition-all duration-300 transform hover:scale-105"
                      style={isClient ? {
                        background: `linear-gradient(to right, ${homepageContent.appIdentity.colors.primary}, ${homepageContent.appIdentity.colors.secondary})`,
                        borderColor: homepageContent.appIdentity.colors.primary,
                        boxShadow: `0 4px 6px -1px ${homepageContent.appIdentity.colors.primary}25`
                      } : {
                        background: 'linear-gradient(to right, #3B82F6, #1E40AF)',
                        borderColor: '#3B82F6',
                        boxShadow: '0 4px 6px -1px #3B82F625'
                      }}
                      onMouseEnter={(e) => {
                        if (isClient) {
                          e.currentTarget.style.background = `linear-gradient(to right, ${homepageContent.appIdentity.colors.secondary}, ${homepageContent.appIdentity.colors.primary})`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient) {
                          e.currentTarget.style.background = `linear-gradient(to right, ${homepageContent.appIdentity.colors.primary}, ${homepageContent.appIdentity.colors.secondary})`
                        }
                      }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span className="font-medium">{homepageContent.appIdentity.socialLinks.telegram.description} {homepageContent.appIdentity.socialLinks.telegram.text}</span>
                    </a>
                    )}

                    {/* Séparateur */}
                    <div className="border-t border-gray-700 my-2"></div>

                    {/* Déconnexion */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout()
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors w-full text-left"
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
        <main id="main-content" className="pt-14 sm:pt-18 md:pt-20 lg:pt-14">
          <div>
            {/* Tab Content */}
            {activeTab === 'home' && renderHomeContent()}
            {activeTab === 'movies' && renderMoviesContent()}
            {activeTab === 'series' && renderSeriesContent()}
            {activeTab === 'wishlist' && renderWishlistContent()}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Chargement du contenu...</p>
              </div>
            )}

            {/* Footer du dashboard */}
            <footer className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 mt-2 mb-0">
              <div className="text-center">
                <p className="text-gray-400 text-sm sm:text-base">
                  {isClient ? homepageContent.appIdentity.footer.copyright : '© 2025 Atiha. Tous droits réservés.'}
                </p>
              </div>
            </footer>
          </div>
        </main>
        
        {/* Barre de filtres fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-dark-300 border-t border-gray-800">
          <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 lg:py-2 w-full">
            {renderFilters()}
          </div>
        </div>



        {/* Notification de bienvenue */}
        {welcomeData && (
          <WelcomeNotification
            isVisible={showWelcomeNotification}
            onClose={() => {
              setShowWelcomeNotification(false)
              // Marquer que la notification a été vue pour ne plus l'afficher
              localStorage.setItem('has_seen_welcome_notification', 'true')
              localStorage.removeItem('show_welcome_notification')
            }}
            hasPremiumTrial={welcomeData.hasPremiumTrial}
            trialDays={welcomeData.trialDays}
          />
        )}

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
