'use client'

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import { Movie, Series, WatchProgress } from '@/types/content'
import { useAuth } from '@/lib/auth-context'
import { premiumCodesService, UserPremiumStatus } from '@/lib/premium-codes-service'
import { logger } from '@/lib/logger'
import { PlayIcon, FilmIcon, StarIcon, ShareIcon, ChatBubbleLeftRightIcon, VideoCameraIcon, SparklesIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import VideoPlayer from './VideoPlayer'
import EnhancedVideoPlayer from './EnhancedVideoPlayer'
import YouTubePlayer from './YouTubePlayer'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { AnalyticsService } from '@/lib/analytics-service'
import PremiumRequiredNotification from './PremiumRequiredNotification'
import { XMarkIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { subscriptionNotificationsService } from '@/lib/subscription-notifications-service'
import { ContentService } from '@/lib/content-service'
import { ReviewsService, Review, ReviewStats } from '@/lib/reviews-service'
import { GenreService } from '@/lib/genre-service'
import Link from 'next/link'
import { PosterImage } from './OptimizedImage'
import { HeartIcon, CalendarIcon, ClockIcon, UserGroupIcon, HandThumbUpIcon, HandThumbDownIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpIconSolid, HandThumbDownIcon as HandThumbDownIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import ShareButton from './ShareButton'
import { useWatchlist } from '@/hooks/useWatchlist'
import { FavoritesNotificationService } from '@/lib/favorites-notification-service'
import { extractYouTubeId } from '@/lib/video-link-detector'

interface VideoPlayerSectionProps {
  content: Movie | Series
  selectedEpisode?: string
  watchProgress?: WatchProgress | null
  onProgressUpdate?: (progress: WatchProgress) => void
  onEpisodeSelect?: (episodeId: string) => void
  autoPlay?: boolean
}

export default function VideoPlayerSection({ 
  content, 
  selectedEpisode, 
  watchProgress, 
  onProgressUpdate, 
  onEpisodeSelect,
  autoPlay = false
}: VideoPlayerSectionProps) {
  const { user } = useAuth()
  const [premiumStatus, setPremiumStatus] = useState<UserPremiumStatus>({ isPremium: false })
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  // Fonction pour obtenir la clé de stockage pour la saison sélectionnée
  const getSeasonStorageKey = (contentId: string) => `selected_season_${contentId}`
  
  // Fonction pour obtenir la clé de stockage pour l'épisode sélectionné
  const getEpisodeStorageKey = (contentId: string) => `selected_episode_${contentId}`
  
  // Charger la saison sauvegardée ou utiliser la saison 1 par défaut
  const loadSavedSeason = (): number => {
    if (typeof window === 'undefined') return 1
    const saved = localStorage.getItem(getSeasonStorageKey(content.id))
    const savedSeason = saved ? parseInt(saved, 10) : null
    // Vérifier que la saison existe dans le contenu
    if (savedSeason && 'seasons' in content && Array.isArray(content.seasons)) {
      const seasonExists = content.seasons.some(s => s.seasonNumber === savedSeason)
      if (seasonExists) return savedSeason
    }
    return 1
  }
  
  // Charger l'épisode sauvegardé
  const loadSavedEpisode = (): string | undefined => {
    if (typeof window === 'undefined' || isMovie) return undefined
    const saved = localStorage.getItem(getEpisodeStorageKey(content.id))
    if (saved && 'seasons' in content && Array.isArray(content.seasons)) {
      // Vérifier que l'épisode existe dans le contenu
      for (const season of content.seasons) {
        const episodeExists = season.episodes.some(ep => ep.id === saved)
        if (episodeExists) return saved
      }
    }
    return undefined
  }
  
  // Déterminer si c'est un film ou une série (doit être défini avant les useCallback qui l'utilisent)
  const isMovie = useMemo(() => !('seasons' in content) || !Array.isArray(content.seasons) || content.seasons.length === 0, [content])

  const [selectedSeason, setSelectedSeason] = useState<number>(loadSavedSeason())
  const [showEpisodes, setShowEpisodes] = useState(true)
  const [showPremiumNotification, setShowPremiumNotification] = useState(false)
  const premiumNotificationRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [contenuPremiumNotification, setContenuPremiumNotification] = useState(subscriptionNotificationsService.getContenuPremiumNotification())
  const [activeTab, setActiveTab] = useState<'avis' | 'bandes-annonces' | 'titres-similaires'>('avis')
  const [similarContent, setSimilarContent] = useState<(Movie | Series)[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false)
  const [relatedTrailers, setRelatedTrailers] = useState<(Movie | Series)[]>([])
  const [selectedTrailer, setSelectedTrailer] = useState<{ videoId: string; title: string; contentId?: string } | null>(null)
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLike, setUserLike] = useState<'like' | 'dislike' | null>(null)
  const [likesCount, setLikesCount] = useState(0)
  const [dislikesCount, setDislikesCount] = useState(0)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSeasons, setShowSeasons] = useState(false)
  
  // Refs pour les onglets (pour le scroll automatique)
  const avisTabRef = useRef<HTMLButtonElement>(null)
  const bandesAnnoncesTabRef = useRef<HTMLButtonElement>(null)
  const titresSimilairesTabRef = useRef<HTMLButtonElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  
  // Utiliser le hook useWatchlist pour les favoris
  const contentType = content ? ('duration' in content ? 'movie' : 'series') : null
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, loading: isLoadingWatchlist } = useWatchlist(user?.id || null)
  const isInList = content ? isInWatchlist(content.id, contentType || 'movie') : false

  React.useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setHomepageContent(loadedContent)
    setContenuPremiumNotification(subscriptionNotificationsService.getContenuPremiumNotification())
    
    if (user?.id) {
      const status = premiumCodesService.getUserPremiumStatus(user.id)
      setPremiumStatus(status)
    }

    // Charger les avis
    loadReviews()

    // Charger les titres similaires
    loadSimilarContent()

    // Charger les bandes-annonces liées
    loadRelatedTrailers()

    // Charger les likes/dislikes
    loadLikesDislikes()
    
    // Recharger la saison et l'épisode sauvegardés quand le contenu change
    if (!isMovie && 'seasons' in content && content.seasons.length > 0) {
      // ÉTAPE 1 : Charger d'abord la saison sauvegardée
      const saved = typeof window !== 'undefined' ? localStorage.getItem(getSeasonStorageKey(content.id)) : null
      const savedSeason = saved ? parseInt(saved, 10) : null
      
      if (savedSeason) {
        const seasonExists = content.seasons.some(s => s.seasonNumber === savedSeason)
        if (seasonExists) {
          // Charger la saison sauvegardée
          setSelectedSeason(savedSeason)
          setShowEpisodes(true)
          
          // ÉTAPE 2 : Ensuite, charger l'épisode sauvegardé de cette saison
          const savedEpisode = typeof window !== 'undefined' ? localStorage.getItem(getEpisodeStorageKey(content.id)) : null
          const season = content.seasons.find(s => s.seasonNumber === savedSeason)
          
          if (savedEpisode && onEpisodeSelect) {
            // Vérifier si l'épisode appartient à la saison sauvegardée
            if (season && season.episodes.some(ep => ep.id === savedEpisode)) {
              // L'épisode appartient à la saison sauvegardée, le charger
              setTimeout(() => {
                onEpisodeSelect(savedEpisode)
              }, 150)
            } else {
              // L'épisode n'appartient pas à la saison sauvegardée, chercher dans toutes les saisons
              for (const s of content.seasons) {
                if (s.episodes.some(ep => ep.id === savedEpisode)) {
                  // Trouver la saison de l'épisode et la charger
                  setSelectedSeason(s.seasonNumber)
                  setTimeout(() => {
                    onEpisodeSelect(savedEpisode)
                  }, 150)
                  break
                }
              }
            }
          } else if (onEpisodeSelect && season && season.episodes.length > 0) {
            // Pas d'épisode sauvegardé, sélectionner le premier de la saison sauvegardée
            setTimeout(() => {
              onEpisodeSelect(season.episodes[0].id)
            }, 150)
          }
        }
      } else {
        // Pas de saison sauvegardée, vérifier s'il y a un épisode sauvegardé
        const savedEpisode = typeof window !== 'undefined' ? localStorage.getItem(getEpisodeStorageKey(content.id)) : null
        if (savedEpisode && onEpisodeSelect) {
          // Chercher la saison de l'épisode sauvegardé
          for (const s of content.seasons) {
            if (s.episodes.some(ep => ep.id === savedEpisode)) {
              setSelectedSeason(s.seasonNumber)
              setShowEpisodes(true)
              setTimeout(() => {
                onEpisodeSelect(savedEpisode)
              }, 150)
              break
            }
          }
        } else {
          // Aucune sauvegarde : sélectionner la première saison et le premier épisode
          const firstSeason = content.seasons[0]
          if (firstSeason) {
            setSelectedSeason(firstSeason.seasonNumber)
            setShowEpisodes(true)
            if (firstSeason.episodes.length > 0 && onEpisodeSelect) {
              setTimeout(() => {
                onEpisodeSelect(firstSeason.episodes[0].id)
              }, 150)
            }
          }
        }
      }
    }
  }, [user?.id, content.id])

  const loadReviews = useCallback(() => {
    const contentReviews = ReviewsService.getReviewsForContent(content.id)
    setReviews(contentReviews)
    setStats(ReviewsService.getReviewStats(content.id))
    
    // Charger l'avis de l'utilisateur s'il existe
    if (user?.id) {
      const existingReview = ReviewsService.hasUserReviewed(content.id, user.id)
      setUserReview(existingReview)
      if (existingReview) {
        setUserRating(existingReview.rating)
        setUserComment(existingReview.comment || '')
        // Charger le sentiment si disponible
        if (existingReview.sentiment) {
          setUserLike(existingReview.sentiment)
        }
      }
    }
  }, [content.id, user?.id])

  const loadSimilarContent = useCallback(async () => {
    setIsLoadingSimilar(true)
    try {
      // Déterminer si le contenu actuel est un film ou une série
      const isCurrentMovie = isMovie
      
      // Récupérer uniquement les films ou les séries selon le type de contenu
      const allContent = isCurrentMovie 
        ? ContentService.getMoviesSync() 
        : ContentService.getSeriesSync()
      
      const currentGenres = Array.isArray(content.genre) ? content.genre : [content.genre]
      
      // Trouver des contenus similaires par genre (exclure le contenu actuel)
      const similar = allContent
        .filter(item => item.id !== content.id)
        .filter(item => {
          const itemGenres = Array.isArray(item.genre) ? item.genre : [item.genre]
          return currentGenres.some(genre => 
            itemGenres.some(itemGenre => 
              GenreService.contentMatchesGenre(item, genre) || 
              itemGenre.toLowerCase().includes(genre.toLowerCase()) ||
              genre.toLowerCase().includes(itemGenre.toLowerCase())
            )
          )
        })
        .slice(0, 12) // Limiter à 12 résultats
      
      setSimilarContent(similar)
    } catch (error) {
      logger.error('Erreur lors du chargement des titres similaires', error as Error)
    } finally {
      setIsLoadingSimilar(false)
    }
  }, [content.id, content.genre, isMovie])

  const loadRelatedTrailers = () => {
    try {
      // Extraire le nom de base du contenu (sans les numéros de suite)
      const baseName = extractBaseName(content.title)
      
      // Récupérer tous les contenus
      const allContent = ContentService.getAllContent()
      
      // Trouver les contenus avec des noms similaires qui ont une bande-annonce
      const related = allContent
        .filter(item => {
          // Exclure le contenu actuel
          if (item.id === content.id) return false
          
          // Vérifier si le nom est similaire
          const itemBaseName = extractBaseName(item.title)
          const isSimilar = baseName.toLowerCase() === itemBaseName.toLowerCase()
          
          // Vérifier si le contenu a une bande-annonce
          const hasTrailer = item.trailerUrl && item.trailerUrl.trim() !== ''
          
          return isSimilar && hasTrailer
        })
        .slice(0, 10) // Limiter à 10 résultats
      
      setRelatedTrailers(related)
    } catch (error) {
      logger.error('Erreur lors du chargement des bandes-annonces liées', error as Error)
    }
  }

  // Fonction pour extraire le nom de base (sans les numéros de suite)
  const extractBaseName = (title: string): string => {
    // Retirer les numéros à la fin (ex: "Nobody 2" -> "Nobody", "Fast & Furious 9" -> "Fast & Furious")
    // Patterns: " 2", " 3", " II", " III", " Part 2", etc.
    const cleaned = title
      .replace(/\s+(?:Part\s+)?\d+$/, '') // "Part 2", " 2", " 3"
      .replace(/\s+(?:II|III|IV|V|VI|VII|VIII|IX|X)+$/, '') // "II", "III", etc.
      .replace(/\s*\(.*\)$/, '') // Retirer les parenthèses à la fin
      .trim()
    
    return cleaned
  }

  // Fonction pour rendre les étoiles
  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-5 h-5 sm:w-6 sm:h-6',
      md: 'w-6 h-6 sm:w-7 sm:h-7',
      lg: 'w-7 h-7 sm:w-8 sm:h-8'
    }

    return (
      <div className="flex space-x-1.5 sm:space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setUserRating(star) : undefined}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform p-1 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center' : 'cursor-default p-1 sm:p-1.5'}
          >
            {star <= rating ? (
              <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClasses[size]} text-gray-400`} />
            )}
          </button>
        ))}
      </div>
    )
  }

  // Gérer la soumission d'avis
  const handleSubmitReview = useCallback(async () => {
    if (!user || userRating === 0) return

    setIsSubmitting(true)
    try {
      if (userReview) {
        // Mettre à jour l'avis existant
        ReviewsService.updateReview(userReview.id, {
          rating: userRating,
          comment: userComment,
          sentiment: userLike || undefined
        })
      } else {
        // Créer un nouvel avis
        ReviewsService.addReview({
          contentId: content.id,
          userId: user.id,
          userName: user.name || 'Utilisateur',
          userEmail: user.email || '',
          rating: userRating,
          comment: userComment,
          sentiment: userLike || undefined
        })
      }
      
      setIsEditing(false)
      loadReviews()
    } catch (error) {
      logger.error('Erreur lors de la soumission de l\'avis', error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }, [user, userRating, userReview, userComment, userLike, content.id, loadReviews])

  // Gérer la suppression d'avis
  const handleDeleteReview = useCallback(() => {
    if (userReview) {
      ReviewsService.deleteReview(userReview.id)
      setUserReview(null)
      setUserRating(0)
      setUserComment('')
      setUserLike(null)
      setIsEditing(false)
      loadReviews()
    }
  }, [userReview, loadReviews])

  // Gérer l'édition d'avis
  const handleEditReview = useCallback((review?: Review) => {
    const reviewToEdit = review || userReview
    if (reviewToEdit) {
      setUserReview(reviewToEdit)
      setUserRating(reviewToEdit.rating)
      setUserComment(reviewToEdit.comment || '')
      setUserLike(reviewToEdit.sentiment || null)
      setIsEditing(true)
    }
  }, [userReview])

  // Charger les likes/dislikes
  const loadLikesDislikes = () => {
    if (typeof window === 'undefined' || !user?.id) return

    try {
      const key = `content_likes_${content.id}_${user.id}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        setUserLike(data.like || null)
      }

      // Charger les totaux (tous les utilisateurs)
      const totalKey = `content_likes_total_${content.id}`
      const totalStored = localStorage.getItem(totalKey)
      if (totalStored) {
        const totals = JSON.parse(totalStored)
        setLikesCount(totals.likes || 0)
        setDislikesCount(totals.dislikes || 0)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des likes/dislikes', error as Error)
    }
  }

  // Sauvegarder un like/dislike
  const handleLikeDislike = (type: 'like' | 'dislike') => {
    if (!user?.id || typeof window === 'undefined') return

    try {
      const key = `content_likes_${content.id}_${user.id}`
      const totalKey = `content_likes_total_${content.id}`

      // Récupérer l'ancien état
      const oldStored = localStorage.getItem(key)
      const oldData = oldStored ? JSON.parse(oldStored) : { like: null }
      const oldLike = oldData.like

      // Récupérer les totaux actuels
      const totalStored = localStorage.getItem(totalKey)
      const totals = totalStored ? JSON.parse(totalStored) : { likes: 0, dislikes: 0 }

      // Si l'utilisateur clique sur le même bouton, annuler
      if (oldLike === type) {
        setUserLike(null)
        localStorage.removeItem(key)
        
        // Décrémenter le total
        if (type === 'like') {
          totals.likes = Math.max(0, totals.likes - 1)
        } else {
          totals.dislikes = Math.max(0, totals.dislikes - 1)
        }

        // Mettre à jour l'avis existant si l'utilisateur a déjà posté un commentaire
        if (userReview) {
          ReviewsService.updateReview(userReview.id, {
            sentiment: undefined
          })
          loadReviews()
        }
      } else {
        // Nouveau like/dislike ou changement
        setUserLike(type)
        localStorage.setItem(key, JSON.stringify({ like: type }))

        // Si l'utilisateur avait déjà un like/dislike, décrémenter l'ancien
        if (oldLike === 'like') {
          totals.likes = Math.max(0, totals.likes - 1)
        } else if (oldLike === 'dislike') {
          totals.dislikes = Math.max(0, totals.dislikes - 1)
        }

        // Incrémenter le nouveau
        if (type === 'like') {
          totals.likes = (totals.likes || 0) + 1
        } else {
          totals.dislikes = (totals.dislikes || 0) + 1
        }

        // Mettre à jour l'avis existant si l'utilisateur a déjà posté un commentaire
        if (userReview) {
          ReviewsService.updateReview(userReview.id, {
            sentiment: type
          })
          loadReviews()
        }
      }

      // Sauvegarder les totaux
      localStorage.setItem(totalKey, JSON.stringify(totals))
      setLikesCount(totals.likes || 0)
      setDislikesCount(totals.dislikes || 0)
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du like/dislike', error as Error)
    }
  }

  // Formater le nombre (ex: 12000 -> "12 k")
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)} k`.replace('.0', '')
    }
    return count.toString()
  }

  // Fonction pour formater la durée
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Écouter les mises à jour des notifications
  React.useEffect(() => {
    const handleNotificationsUpdate = () => {
      setContenuPremiumNotification(subscriptionNotificationsService.getContenuPremiumNotification())
    }

    window.addEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
    return () => window.removeEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
  }, [])

  // isMovie est déjà défini plus haut (ligne 87)
  
  // Debug logs
  logger.debug('VideoPlayerSection Debug', {
    isMovie,
    hasSeasons: 'seasons' in content,
    seasonsLength: 'seasons' in content ? content.seasons.length : 0,
    contentType: isMovie ? 'movie' : 'series',
    contentTitle: content.title,
    hasVideoUrl: 'videoUrl' in content,
    videoUrl: 'videoUrl' in content ? content.videoUrl : 'N/A'
  })

  // Initialiser automatiquement la saison et l'épisode pour les séries (seulement si aucune sauvegarde n'existe)
  // Ce useEffect s'exécute après le chargement initial pour gérer le cas où il n'y a pas de sauvegarde
  React.useEffect(() => {
    // Attendre un peu pour laisser le temps au useEffect principal de charger la sauvegarde
    const timer = setTimeout(() => {
    if (!isMovie && 'seasons' in content && content.seasons.length > 0) {
        // Vérifier s'il y a une sauvegarde
        const savedSeason = typeof window !== 'undefined' ? localStorage.getItem(getSeasonStorageKey(content.id)) : null
        const savedEpisode = typeof window !== 'undefined' ? localStorage.getItem(getEpisodeStorageKey(content.id)) : null
        
        // Si aucune sauvegarde n'existe ET qu'aucun épisode n'est déjà sélectionné, sélectionner la première saison et le premier épisode
        if (!savedSeason && !savedEpisode && !selectedEpisode) {
      const firstSeason = content.seasons[0]
      setSelectedSeason(firstSeason.seasonNumber)
      setShowEpisodes(true)
      
          // Sélectionner le premier épisode
          if (firstSeason.episodes.length > 0 && onEpisodeSelect) {
        onEpisodeSelect(firstSeason.episodes[0].id)
      }
    }
      }
    }, 200) // Délai pour laisser le temps au useEffect principal de charger la sauvegarde
    
    return () => clearTimeout(timer)
  }, [content, isMovie, selectedEpisode, onEpisodeSelect])

  // Ajuster automatiquement la hauteur du textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [userComment])

  // Forcer la mise à jour de l&apos;interface quand selectedEpisode change
  React.useEffect(() => {
    // Force un re-render pour s'assurer que l&apos;interface se met à jour
    if (selectedEpisode && !isMovie && 'seasons' in content) {
      // Trouver la saison de l'épisode sélectionné
      for (const season of content.seasons) {
        const episode = season.episodes.find(ep => ep.id === selectedEpisode)
        if (episode) {
          setSelectedSeason(season.seasonNumber)
          setShowEpisodes(true)
          break
        }
      }
    }
  }, [selectedEpisode, content, isMovie])

  // Scroll automatique vers l'onglet actif sur mobile
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    
    // Seulement sur mobile/tablette (écrans < 1024px)
    if (window.innerWidth < 1024) {
      let tabRef: React.RefObject<HTMLButtonElement> | null = null
      
      switch (activeTab) {
        case 'avis':
          tabRef = avisTabRef
          break
        case 'bandes-annonces':
          tabRef = bandesAnnoncesTabRef
          break
        case 'titres-similaires':
          tabRef = titresSimilairesTabRef
          break
      }
      
      if (tabRef?.current && tabsContainerRef.current) {
        // Petit délai pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
          tabRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          })
        }, 100)
      }
    }
  }, [activeTab])

  const getVideoUrl = (): string => {
    if (isMovie && 'videoUrl' in content) {
      return content.videoUrl
    } else {
      // Pour les séries, récupérer l'URL de l'épisode sélectionné
      if (selectedEpisode && 'seasons' in content) {
        logger.debug('Recherche de l\'épisode sélectionné', { selectedEpisode, seasons: content.seasons })
        
        for (const season of content.seasons) {
          const episode = season.episodes.find(ep => ep.id === selectedEpisode)
          if (episode) {
            logger.debug('Épisode trouvé', {
              id: episode.id,
              title: episode.title,
              videoUrl: episode.videoUrl
            })
            return episode.videoUrl
          }
        }
        logger.debug('Aucun épisode trouvé avec l\'ID', { selectedEpisode })
      } else {
        logger.debug('Pas d\'épisode sélectionné ou pas de seasons', { selectedEpisode, hasSeasons: 'seasons' in content })
      }
    }
    return ''
  }

  const getTrailerUrl = useCallback((): string => {
    return content.trailerUrl || ''
  }, [content.trailerUrl])

  // Extraire l'ID vidéo YouTube depuis l'URL
  const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    // Patterns pour extraire l'ID YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // Si c'est déjà un ID (11 caractères)
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
      return url
    }
    
    return null
  }

  // Obtenir l'URL de la miniature YouTube
  const getYouTubeThumbnail = (trailerUrl: string): string | null => {
    const videoId = extractYouTubeVideoId(trailerUrl)
    if (!videoId) return null
    
    // Essayer maxresdefault d'abord (haute qualité), puis hqdefault en fallback
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  }

  const getPreviewUrl = (): string | null => {
    if (isMovie) {
      return content.previewUrl || null
    } else {
      // Pour les séries, utiliser l'aperçu de l'épisode sélectionné
      if (selectedEpisode && 'seasons' in content) {
        for (const season of content.seasons) {
          const episode = season.episodes.find(ep => ep.id === selectedEpisode)
          if (episode && episode.previewUrl) {
            return episode.previewUrl
          }
        }
      }
    }
    return null
  }

  const getTitle = (): string => {
    if (isMovie) {
      return content.title
    } else {
      // Pour les séries, inclure le nom de l'épisode sélectionné
      if (selectedEpisode && 'seasons' in content) {
        for (const season of content.seasons) {
          const episode = season.episodes.find(ep => ep.id === selectedEpisode)
          if (episode) {
            return `${content.title} - ${episode.title}`
          }
        }
      }
      return content.title
    }
  }

  const handlePlay = useCallback(() => {
    // Vérifier le statut premium de l&apos;utilisateur
    const userPremiumStatus = user ? premiumCodesService.getUserPremiumStatus(user.id) : { isPremium: false }
    
    // Si le contenu est premium et l&apos;utilisateur n'a pas d'accès premium, afficher la notification
    if (content.isPremium && !userPremiumStatus.isPremium) {
      setShowPremiumNotification(true)
      // Scroll vers la notification après un court délai pour laisser le temps au DOM de se mettre à jour
      setTimeout(() => {
        premiumNotificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }
    
    // Track content view (le temps de visionnage sera mis à jour par le VideoPlayer)
    const isMovie = 'videoUrl' in content
    const catalogue = (content as any).catalogue || 'collection'
    AnalyticsService.trackContentView(
      content.id,
      isMovie ? 'movie' : 'series',
      content.title,
      undefined, // Le temps de visionnage sera tracké en temps réel par le VideoPlayer
      user?.id,
      catalogue
    )
    
    // Arrêter la bande-annonce s'elle est en cours
    setShowTrailer(false)
    // Lancer le lecteur principal
    setShowPlayer(true)
  }, [content, user])

  const handlePlayTrailer = useCallback(() => {
    if (getTrailerUrl()) {
      // Arrêter le lecteur principal s'il est en cours
      setShowPlayer(false)
      // Lancer la bande-annonce
      setShowTrailer(true)
    }
  }, [])

  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false)
  }, [])

  const handleCloseTrailer = useCallback(() => {
    setShowTrailer(false)
  }, [])



  const handleSeasonSelect = useCallback((seasonNumber: number) => {
    // Arrêter la vidéo et la bande-annonce en cours
    setShowPlayer(false)
    setShowTrailer(false)
    
    setSelectedSeason(seasonNumber)
    // Sauvegarder la saison sélectionnée dans localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(getSeasonStorageKey(content.id), seasonNumber.toString())
    }
    setShowEpisodes(true)
    // Sélectionner l'épisode sauvegardé de cette saison, ou le premier épisode
    if (!isMovie && 'seasons' in content) {
      const season = content.seasons.find(s => s.seasonNumber === seasonNumber)
      if (season && season.episodes.length > 0 && onEpisodeSelect) {
        // Vérifier s'il y a un épisode sauvegardé pour cette saison
        const savedEpisode = typeof window !== 'undefined' ? localStorage.getItem(getEpisodeStorageKey(content.id)) : null
        let episodeToSelect = season.episodes[0].id
        
        if (savedEpisode) {
          // Vérifier si l'épisode sauvegardé appartient à cette saison
          const savedEpisodeInSeason = season.episodes.find(ep => ep.id === savedEpisode)
          if (savedEpisodeInSeason) {
            episodeToSelect = savedEpisode
          }
        }
        
        // Petit délai pour s'assurer que l&apos;interface se met à jour
        setTimeout(() => {
          onEpisodeSelect(episodeToSelect)
        }, 50)
      }
    }
  }, [content.id, isMovie, onEpisodeSelect, getSeasonStorageKey])

  const handleEpisodeSelect = useCallback((episodeId: string) => {
    // Arrêter la vidéo et la bande-annonce en cours
    setShowPlayer(false)
    setShowTrailer(false)
    
    // Vérifier le statut premium de l'épisode sélectionné
    let episodeIsPremium = false
    if (!isMovie && 'seasons' in content) {
      for (const season of content.seasons) {
        const episode = season.episodes.find(ep => ep.id === episodeId)
        if (episode) {
          episodeIsPremium = ('isPremium' in episode && Boolean(episode.isPremium)) || false
          break
        }
      }
    }
    
    // Vérifier le statut premium de l'utilisateur
    const userPremiumStatus = user ? premiumCodesService.getUserPremiumStatus(user.id) : { isPremium: false }
    
    // Si l'épisode est premium et l'utilisateur n'a pas d'accès premium, afficher la notification
    if (episodeIsPremium && !userPremiumStatus.isPremium) {
      setShowPremiumNotification(true)
      // Scroll vers la notification après un court délai pour laisser le temps au DOM de se mettre à jour
      setTimeout(() => {
        premiumNotificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }
    
    if (onEpisodeSelect) {
      onEpisodeSelect(episodeId)
    }
    
    // Sauvegarder l'épisode sélectionné dans localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(getEpisodeStorageKey(content.id), episodeId)
    }
    
    // Vérifier le statut premium avant de lancer la vidéo
    const isPremiumLocked = content.isPremium && !userPremiumStatus.isPremium
    
    // Lancer automatiquement la vidéo si autoPlay est activé ET si l'utilisateur a l'accès premium
    if (autoPlay && !isPremiumLocked) {
      setTimeout(() => {
        setShowPlayer(true)
      }, 200)
    }
  }, [content, isMovie, user, autoPlay, onEpisodeSelect])
  useEffect(() => {
    if (typeof window !== 'undefined' && content) {
      const urlParams = new URLSearchParams(window.location.search)
      const autoplayParam = urlParams.get('autoplay')
      
      if (autoplayParam === 'true') {
        // Attendre un peu que le composant soit complètement monté
        setTimeout(() => {
          // Vérifier le statut premium de l'utilisateur
          const userPremiumStatus = user ? premiumCodesService.getUserPremiumStatus(user.id) : { isPremium: false }
          
          // Si le contenu est premium et l'utilisateur n'a pas d'accès premium, ne pas lancer
          if (content.isPremium && !userPremiumStatus.isPremium) {
            setShowPremiumNotification(true)
            setTimeout(() => {
              premiumNotificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          } else {
            // Track content view
            const isMovie = 'videoUrl' in content
            const catalogue = (content as any).catalogue || 'collection'
            AnalyticsService.trackContentView(
    content.id, 
              isMovie ? 'movie' : 'series',
              content.title,
              undefined,
              user?.id,
              catalogue
            )
            
            // Arrêter la bande-annonce s'elle est en cours
            setShowTrailer(false)
            // Lancer le lecteur principal
            setShowPlayer(true)
            
            // Détecter si c'est un embed et cliquer sur son bouton play
            setTimeout(async () => {
              const videoUrl = getVideoUrl()
              if (videoUrl) {
                const { detectVideoLink } = await import('@/lib/video-link-detector')
                const linkInfo = detectVideoLink(videoUrl)
                
                // Si c'est un embed (iframe, vimeo, dailymotion, etc.)
                if (linkInfo.type === 'iframe' || linkInfo.type === 'vimeo' || linkInfo.type === 'dailymotion') {
                  // Attendre que l'iframe soit chargée
                  setTimeout(() => {
                    const iframe = document.querySelector('#video-player-container iframe') as HTMLIFrameElement
                    if (iframe) {
                      try {
                        // Essayer de cliquer sur le bouton play de l'embed
                        // Note: Cela ne fonctionnera que si l'iframe est same-origin
                        // Sinon, on doit utiliser autoplay dans l'URL (ce qui est déjà fait dans UniversalVideoPlayer)
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                        if (iframeDoc) {
                          // Chercher le bouton play dans l'iframe
                          const playButton = iframeDoc.querySelector('button[aria-label*="play" i], button[aria-label*="Play" i], .play-button, [class*="play"]') as HTMLElement
                          if (playButton) {
                            playButton.click()
                          }
                        }
                      } catch (e) {
                        // Si on ne peut pas accéder à l'iframe (cross-origin), c'est normal
                        // L'autoplay dans l'URL devrait fonctionner
                        logger.debug('Impossible d\'accéder à l\'iframe (cross-origin), autoplay via URL devrait fonctionner')
                      }
                    }
                  }, 1000) // Attendre 1 seconde que l'iframe soit chargée
                }
              }
            }, 100) // Attendre 100ms après avoir lancé le lecteur
          }
          
          // Nettoyer l'URL en retirant le paramètre autoplay
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('autoplay')
          window.history.replaceState({}, '', newUrl.toString())
        }, 500)
      }
    }
  }, [content.id, content, user])

  const isPremiumLocked = content.isPremium && !(user ? premiumCodesService.getUserPremiumStatus(user.id).isPremium : false)

  return (
    <div className="relative overflow-x-hidden w-full">
      {/* Lecteur vidéo */}
      <div className="aspect-video bg-black overflow-hidden relative lg:mt-4 xl:mt-5 2xl:mt-6 lg:mx-auto lg:max-w-[85%] xl:max-w-[80%] 2xl:max-w-[75%] rounded-none lg:rounded-xl lg:shadow-2xl" id="video-player-container">
        {showPlayer ? (
          <EnhancedVideoPlayer
            videoUrl={getVideoUrl()}
            contentId={content.id}
            episodeId={selectedEpisode || undefined}
            title={getTitle()}
            contentType={isMovie ? 'movie' : 'series'}
            onClose={handleClosePlayer}
            onProgressUpdate={onProgressUpdate}
            posterUrl={getPreviewUrl() || undefined}
          />
        ) : showTrailer ? (
          <YouTubePlayer
            videoId={getTrailerUrl()}
            title={`${content.title} - Bande d&apos;Annonce`}
            onClose={handleCloseTrailer}
            autoplay={true}
            height="100%"
          />
        ) : (
          <>
            {getPreviewUrl() ? (
              <div className="w-full h-full relative">
                <img
                  src={getPreviewUrl() ?? undefined}
                  alt={`Aperçu de ${content.title}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback vers l'icône play si l'image ne charge pas
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center hidden">
                  <PlayIcon className="w-20 h-20 text-gray-400" />
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900"
              >
              </div>
            )}
            
            {/* Overlay avec icône play et texte toujours visibles */}
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer group"
              onClick={handlePlay}
              title="Cliquer pour regarder"
            >
              <div className="flex flex-col items-center justify-center">
                {/* Bouton play avec design moderne */}
                <div className="relative mb-3 sm:mb-4">
                  {/* Cercle extérieur avec animation */}
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75"></div>
                  {/* Cercle principal avec gradient - Responsive pour tous les écrans */}
                  <div 
                    className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-24 lg:h-24 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
                    style={isClient ? {
                      background: `linear-gradient(135deg, ${homepageContent.appIdentity.colors.primary}CC, ${homepageContent.appIdentity.colors.secondary}CC)`,
                      boxShadow: `0 0 30px ${homepageContent.appIdentity.colors.primary}80, inset 0 0 20px rgba(255,255,255,0.1)`,
                      border: `2px solid ${homepageContent.appIdentity.colors.primary}`
                    } : {
                      background: 'linear-gradient(135deg, #3B82F6CC, #2563ebCC)',
                      boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(255,255,255,0.1)',
                      border: '2px solid #3B82F6'
                    }}
                  >
                    {/* Icône play centrée - Responsive */}
                    <PlayIcon 
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12 text-white transition-transform duration-300 group-hover:scale-110" 
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))', marginLeft: '2px' }}
                    />
                  </div>
                </div>
                <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mt-2 drop-shadow-md font-medium text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>Cliquer pour regarder</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Boutons d&apos;action */}
      <div className="mt-6 space-y-4 px-4 sm:px-6 md:px-8 lg:px-0">
        {/* Notification Premium Requis - Section dynamique en haut de "Contenu Premium" */}
        {showPremiumNotification && (
          <div 
            ref={premiumNotificationRef}
            className="backdrop-blur-sm rounded-xl shadow-2xl w-full transform transition-all duration-300 ease-out mb-4 lg:mx-auto lg:max-w-[85%] xl:max-w-[80%] 2xl:max-w-[75%]"
            style={isClient ? {
              background: `linear-gradient(to right, ${homepageContent.appIdentity.colors.primary}85, ${homepageContent.appIdentity.colors.secondary}85)`,
              borderColor: `${homepageContent.appIdentity.colors.primary}30`,
              borderWidth: '1px'
            } : {
              background: 'linear-gradient(to right, #3B82F685, #2563eb85)',
              borderColor: '#3B82F630',
              borderWidth: '1px'
            }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <LockClosedIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{contenuPremiumNotification.title}</h3>
                    <p className="text-white/80 text-xs sm:text-sm">{contenuPremiumNotification.subtitle}</p>
                  </div>
                </div>
                <button onClick={() => setShowPremiumNotification(false)} className="text-white/70 hover:text-white transition-colors">
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <LockClosedIcon 
                      className="w-4 h-4 sm:w-5 sm:h-5" 
                      style={isClient ? { color: homepageContent.appIdentity.colors.accent } : { color: '#F59E0B' }}
                    />
                    <span className="text-white font-semibold text-sm sm:text-base">{contenuPremiumNotification.sectionTitle}</span>
                  </div>
                  <p className="text-white/90 text-xs sm:text-sm">
                    {contenuPremiumNotification.sectionDescription}
                  </p>
                </div>
                
                <div className="space-y-2 text-xs sm:text-sm text-white/90">
                  {contenuPremiumNotification.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon 
                        className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" 
                        style={isClient ? { color: homepageContent.appIdentity.colors.accent } : { color: '#F59E0B' }}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowPremiumNotification(false)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                >
                  {contenuPremiumNotification.cancelButton}
                </button>
                <button
                  onClick={() => {
                    setShowPremiumNotification(false)
                    router.push('/subscription')
                  }}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                >
                  {contenuPremiumNotification.subscribeButton}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Badge Contenu Premium */}
        {isPremiumLocked && (
          <div className="px-4 py-2 bg-purple-600 rounded-lg mb-2 flex items-center justify-center space-x-2 w-fit">
            <StarIcon className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-white text-sm font-semibold">Contenu Premium</span>
          </div>
        )}

        {/* Boutons Regarder, Bande d'Annonce et Partager - Côte à côte sur tous les écrans */}
        <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 px-4 sm:px-6 md:px-8">
          {/* Bouton Regarder */}
          <div className="flex-[0.4] group">
            <button
              onClick={handlePlay}
              className="w-full min-h-[44px] sm:min-h-[48px] md:min-h-[52px] px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-white bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/50 hover:border-gray-600/70 backdrop-blur-sm"
              aria-label="Regarder le contenu"
            >
              <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              <span className="hidden sm:inline">Regarder</span>
            </button>
          </div>

        {/* Bouton Bande d'Annonce */}
          <div className="group flex-1">
          <button
            onClick={handlePlayTrailer}
            disabled={!getTrailerUrl()}
              className={`w-full min-h-[44px] sm:min-h-[48px] md:min-h-[52px] px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border backdrop-blur-sm whitespace-nowrap ${
              getTrailerUrl() 
                  ? 'text-white bg-gray-800/80 hover:bg-gray-700/90 border-gray-700/50 hover:border-gray-600/70' 
                  : 'bg-gray-900/50 text-gray-500 cursor-not-allowed border-gray-800/50'
            }`}
            aria-label={getTrailerUrl() ? "Regarder la bande d'annonce" : "Bande d'annonce non disponible"}
          >
              <FilmIcon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-transform duration-200 ${getTrailerUrl() ? 'group-hover:translate-x-0.5' : ''}`} aria-hidden="true" />
            <span>Bande d&apos;Annonce</span>
          </button>
        </div>

          {/* Bouton Partager */}
          <div className="flex-[0.4] group">
            <div className="w-full">
              <ShareButton 
                contentId={content.id} 
                contentTitle={content.title}
                className="w-full"
              />
          </div>
        </div>
      </div>

      {/* Sélection de saison et d'épisode pour les séries */}
      {!isMovie && 'seasons' in content && content.seasons.length > 0 && (
          <div className="mt-6 space-y-4 px-4 sm:px-6 md:px-8 overflow-x-hidden w-full">
            {/* Bouton de sélection de saison */}
          <div>
              <button
                onClick={() => setShowSeasons(!showSeasons)}
                className="w-full md:w-auto min-h-[44px] sm:min-h-[48px] px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-white bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/50 hover:border-gray-600/70 backdrop-blur-sm"
              >
                <span>Saison {selectedSeason}</span>
                <ChevronDownIcon className={`w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200 ${showSeasons ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Liste des saisons en horizontal */}
            {showSeasons && (
              <div className="w-full overflow-x-auto gap-2 pb-2 md:scrollbar-thin md:scrollbar-thumb-gray-600 md:scrollbar-track-gray-800 md:[&::-webkit-scrollbar]:h-2 md:[&::-webkit-scrollbar-thumb]:h-2 [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block">
                <div className="flex gap-2">
              {content.seasons.map((season) => (
                  <button
                  key={season.id || `season-${season.seasonNumber}`}
                    onClick={() => {
                      handleSeasonSelect(season.seasonNumber)
                      setShowSeasons(false)
                    }}
                    className={`flex-shrink-0 min-h-[44px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-lg transition-all duration-200 font-medium text-base sm:text-lg ${
                      selectedSeason === season.seasonNumber
                        ? 'bg-gray-700/90 text-white border-2'
                        : 'bg-gray-800/80 text-white border border-gray-700/50 hover:bg-gray-700/90 hover:border-gray-600/70'
                    }`}
                    style={selectedSeason === season.seasonNumber && isClient ? {
                      borderColor: homepageContent.appIdentity.colors.primary
                    } : {}}
                >
                  Saison {season.seasonNumber}
                  </button>
              ))}
          </div>
              </div>
            )}

          {/* Sélection d'épisode */}
          {showEpisodes && (
            <div>
                <div className="w-full overflow-x-auto gap-2 pb-2 md:scrollbar-thin md:scrollbar-thumb-gray-600 md:scrollbar-track-gray-800 md:[&::-webkit-scrollbar]:h-2 md:[&::-webkit-scrollbar-thumb]:h-2 [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block">
                  <div className="flex gap-2">
                {content.seasons
                  .find(s => s.seasonNumber === selectedSeason)
                  ?.episodes.map((episode, episodeIndex) => (
                    <button
                      key={episode.id || `episode-${selectedSeason}-${episodeIndex}`}
                      onClick={() => handleEpisodeSelect(episode.id)}
                        className={`flex-shrink-0 w-24 rounded-lg overflow-hidden transition-colors ${
                        selectedEpisode === episode.id
                            ? 'border-2'
                            : 'border border-gray-600 hover:border-gray-500'
                      }`}
                      style={selectedEpisode === episode.id && isClient ? {
                        borderColor: homepageContent.appIdentity.colors.primary
                      } : {}}
                    >
                        <div className="flex flex-col">
                        {/* Image d'aperçu de l'épisode */}
                          {episode.previewUrl ? (
                            <div className="w-full aspect-video bg-gray-800 relative">
                            <img
                              src={episode.previewUrl}
                              alt={`Aperçu de ${episode.title}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                              {episode.videoUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <PlayIcon className="w-4 h-4 text-green-400" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                              {episode.videoUrl && (
                                <PlayIcon className="w-4 h-4 text-green-400" />
                              )}
                          </div>
                        )}
                        
                          {/* Titre de l'épisode */}
                          <div className={`p-1 ${selectedEpisode === episode.id && isClient ? 'bg-gray-800/80' : 'bg-gray-700'}`}>
                            <h4 className="text-white font-medium text-xs text-center">
                            Épisode {episode.episodeNumber}
                          </h4>
                        </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section Titre, Description et Informations */}
        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
            {/* Titre et informations principales */}
            <div className="mb-4">
              <div className="mb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{content.title}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-400 text-sm sm:text-base mb-3">
                <span className="flex items-center space-x-1.5 sm:space-x-2">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>{content.year}</span>
                </span>
                <span className="flex items-center space-x-1.5 sm:space-x-2">
                  <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  <span>
                    {stats.averageRating > 0 
                      ? `${stats.averageRating.toFixed(1)} (${stats.totalReviews})` 
                      : 'N/A'
                    }
                  </span>
                </span>
                <span className="flex items-center space-x-1.5 sm:space-x-2">
                  <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>{Array.isArray(content.genre) ? content.genre.join(', ') : content.genre}</span>
                </span>
              </div>
            </div>

            {/* Description avec limite de 18 mots */}
            {!isDescriptionExpanded && (
              <div className="mb-3">
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  {content.description.split(' ').slice(0, 18).join(' ')}
                  {content.description.split(' ').length > 18 && '...'}
                </p>
            <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="mt-2 text-gray-400 hover:text-white text-base sm:text-lg font-medium transition-colors min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5"
            >
                  Voir plus
            </button>
              </div>
            )}

            {/* Description complète et informations détaillées (affichées quand développé) */}
            {isDescriptionExpanded && (
              <>
                <div className="mb-4">
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{content.description}</p>
                </div>

                {/* Informations détaillées */}
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h3 className="text-white font-medium mb-1.5 flex items-center space-x-2 text-base sm:text-lg">
                      <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Acteurs</span>
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base">{Array.isArray(content.cast) ? content.cast.join(', ') : content.cast}</p>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1.5 flex items-center space-x-2 text-base sm:text-lg">
                      <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Réalisateur</span>
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base">{content.director}</p>
                  </div>
                </div>

                {/* Bouton Voir moins en bas */}
                <div>
                  <button
                    onClick={() => setIsDescriptionExpanded(false)}
                    className="text-gray-400 hover:text-white text-base sm:text-lg font-medium transition-colors min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5"
                  >
                    Voir moins
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Onglets dynamiques */}
        <div className="mt-8 px-4 sm:px-6 md:px-8">
          {/* Navigation des onglets */}
          <div 
            ref={tabsContainerRef}
            className="flex space-x-1 border-b border-gray-700/50 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full scroll-smooth"
          >
            <button
              ref={avisTabRef}
              onClick={() => setActiveTab('avis')}
              className={`px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-[48px] ${
                activeTab === 'avis'
                  ? 'text-white border-gray-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
                        <div className="flex items-center space-x-2 sm:space-x-2.5">
                <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                <span>Avis et notes</span>
                {reviews.length > 0 && (
                  <span className="text-sm sm:text-base bg-gray-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    {reviews.length}
              </span>
                          )}
                        </div>
            </button>
            <button
              ref={bandesAnnoncesTabRef}
              onClick={() => setActiveTab('bandes-annonces')}
              className={`px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-[48px] ${
                activeTab === 'bandes-annonces'
                  ? 'text-white border-gray-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                <span>Bandes annonces</span>
                      </div>
                    </button>
            <button
              ref={titresSimilairesTabRef}
              onClick={() => setActiveTab('titres-similaires')}
              className={`px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-[48px] ${
                activeTab === 'titres-similaires'
                  ? 'text-white border-gray-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                <span>Titres similaires</span>
              </div>
            </button>
          </div>

          {/* Contenu des onglets */}
          <div className="mt-6">
            {/* Onglet Avis */}
            {activeTab === 'avis' && (
              <div className="space-y-4">
                {/* Section Votre avis - Masquée si un avis existe et qu'on n'est pas en mode édition */}
                {(!userReview || isEditing) && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Votre avis</h3>
                    <div className="flex items-center space-x-2 sm:space-x-2.5 bg-gray-700/50 rounded-lg p-2 sm:p-2.5 border border-gray-600/50">
                      <button
                        onClick={() => handleLikeDislike('like')}
                        className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md transition-colors min-h-[44px] ${
                          userLike === 'like'
                            ? 'bg-gray-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                        }`}
                      >
                        {userLike === 'like' ? (
                          <HandThumbUpIconSolid className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : (
                          <HandThumbUpIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        )}
                        <span className="text-base sm:text-lg font-medium">{formatCount(likesCount)}</span>
                      </button>
                      <div className="w-px h-7 sm:h-8 bg-gray-600"></div>
            <button
                        onClick={() => handleLikeDislike('dislike')}
                        className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md transition-colors min-h-[44px] ${
                          userLike === 'dislike'
                            ? 'bg-gray-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                        }`}
                      >
                        {userLike === 'dislike' ? (
                          <HandThumbDownIconSolid className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : (
                          <HandThumbDownIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        )}
                        <span className="text-base sm:text-lg font-medium">{formatCount(dislikesCount)}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 sm:mb-5 text-base sm:text-lg">
                    Donnez votre avis sur {content.title}
                  </p>

                  <div className="space-y-4 sm:space-y-5">
                    {/* Note avec étoiles */}
                    <div>
                      <label className="block text-base sm:text-lg font-medium text-gray-300 mb-3 sm:mb-3.5">
                        Votre note
                      </label>
                      {renderStars(userRating, true, 'lg')}
                      {userRating > 0 && (
                        <p className="text-base sm:text-lg text-gray-400 mt-3">
                          {userRating} étoile{userRating > 1 ? 's' : ''}
                        </p>
          )}
          </div>

                    {/* Commentaire */}
                    <div>
                      <label className="block text-base sm:text-lg font-medium text-gray-300 mb-3 sm:mb-3.5">
                        Votre commentaire
                      </label>
                      <textarea
                        ref={textareaRef}
                        value={userComment}
                        onChange={(e) => {
                          setUserComment(e.target.value)
                          // Ajuster la hauteur immédiatement
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto'
                            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
                          }
                        }}
                        placeholder="Partagez votre opinion sur ce contenu..."
                        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none overflow-hidden min-h-[44px]"
                        rows={1}
                        style={{ minHeight: '44px' }}
                      />
        </div>

                    {/* Boutons d'action */}
                    <div className="flex space-x-3 sm:space-x-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={userRating === 0 || isSubmitting}
                        className="px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl rounded-lg transition-colors min-h-[44px] sm:min-h-[48px] font-medium"
                      >
                        {isSubmitting ? 'Envoi...' : userReview ? 'Modifier l\'avis' : 'Publier l\'avis'}
                      </button>
                      
                      {userReview && (
                        <button
                          onClick={handleDeleteReview}
                          className="px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 bg-red-600 hover:bg-red-700 text-white text-base sm:text-lg md:text-xl rounded-lg transition-colors min-h-[44px] sm:min-h-[48px] font-medium"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Liste des commentaires */}
                {reviews.length > 0 && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 border border-gray-700/50">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5">Commentaires ({reviews.length})</h3>
                    
                    <div className="space-y-4 sm:space-y-5">
                      {reviews
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((review) => (
                          <div key={review.id} className="bg-gray-900/50 rounded-lg p-4 sm:p-5">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3 sm:mb-4 gap-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 sm:space-x-2.5 mb-2">
                                  <span className="font-medium text-white text-base sm:text-lg">{review.userName}</span>
                                  {renderStars(review.rating, false, 'md')}
                                </div>
                                <span className="text-base sm:text-lg text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              {/* Boutons Modifier et Supprimer pour le commentaire de l'utilisateur */}
                              {user?.id && review.userId === user.id && (
                                <div className="flex items-center space-x-3 sm:space-x-4 md:ml-3 flex-shrink-0">
                                  <button
                                    onClick={() => handleEditReview(review)}
                                    className="px-4 sm:px-5 py-3 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg rounded-lg transition-colors min-h-[44px] font-medium"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Êtes-vous sûr de vouloir supprimer votre avis ?')) {
                                        ReviewsService.deleteReview(review.id)
                                        setUserReview(null)
                                        setUserRating(0)
                                        setUserComment('')
                                        setUserLike(null)
                                        setIsEditing(false)
                                        loadReviews()
                                      }
                                    }}
                                    className="px-4 sm:px-5 py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white text-base sm:text-lg rounded-lg transition-colors min-h-[44px] font-medium"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {review.comment && (
                              <div className="flex items-start space-x-2 sm:space-x-2.5">
                                {review.sentiment && (
                                  <div className="flex-shrink-0 mt-1">
                                    {review.sentiment === 'like' ? (
                                      <HandThumbUpIconSolid className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                    ) : (
                                      <HandThumbDownIconSolid className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                    )}
                                  </div>
                                )}
                                <p className="text-gray-300 leading-relaxed flex-1 text-base sm:text-lg">{review.comment}</p>
                              </div>
                            )}
                          </div>
                  ))}
              </div>
            </div>
          )}

                {/* Section Avis de la communauté */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 border border-gray-700/50">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5">Avis de la communauté</h3>

                  {/* Statistiques principales sur une ligne */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-5 mb-4 sm:mb-5">
                    {/* Nombre d'avis */}
                    <div className="text-left">
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stats.totalReviews}</div>
                      <div className="text-base sm:text-lg text-gray-400">Avis</div>
                    </div>
                    
                    {/* Note moyenne */}
                    <div className="text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stats.averageRating.toFixed(1)}</div>
                      <div className="text-base sm:text-lg text-gray-400">Note moyenne</div>
                    </div>
                    
                    {/* Étoiles */}
                    <div>
                      {renderStars(Math.round(stats.averageRating), false, 'sm')}
                    </div>
                  </div>

                  {/* Distribution des notes */}
                  <div>
                    <h4 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4">Distribution des notes</h4>
                    <div className="space-y-3 sm:space-y-4">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                        
                        return (
                          <div key={rating} className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex items-center space-x-2 sm:space-x-2.5 w-16 sm:w-20">
                              <span className="text-base sm:text-lg text-gray-300">{rating}</span>
                              <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                            </div>
                            <div className="flex-1 bg-gray-700 rounded-full h-2.5 sm:h-3">
                              <div 
                                className="bg-yellow-400 h-2.5 sm:h-3 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-base sm:text-lg text-gray-400 w-14 sm:w-16 text-right">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
        </div>
      )}

            {/* Onglet Bandes annonces */}
            {activeTab === 'bandes-annonces' && (
              <div 
                className="space-y-6 sm:space-y-8"
                onClick={(e) => {
                  // Fermer le modal si on clique en dehors (sur le conteneur parent)
                  if (selectedTrailer && e.target === e.currentTarget) {
                    setSelectedTrailer(null)
                  }
                }}
              >
                {/* Grille de bandes-annonces */}
                {(getTrailerUrl() || relatedTrailers.length > 0) ? (
                  <div>
                    <h3 className="text-white font-semibold mb-4 sm:mb-5 text-lg sm:text-xl md:text-2xl">
                      Bandes annonces disponibles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                      {/* Bande-annonce du contenu actuel */}
                      {getTrailerUrl() && (
                        <>
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              // Toggle: si déjà sélectionné, fermer, sinon ouvrir
                              if (selectedTrailer && selectedTrailer.contentId === content.id) {
                                setSelectedTrailer(null)
                              } else {
                                setSelectedTrailer({ videoId: getTrailerUrl(), title: `${content.title} - Bande d'Annonce`, contentId: content.id })
                              }
                            }}
                            className="group cursor-pointer"
                          >
                          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50 hover:border-gray-600 transition-all duration-200 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              {getYouTubeThumbnail(getTrailerUrl()) ? (
                                <img
                                  src={getYouTubeThumbnail(getTrailerUrl()) || ''}
                                  alt={`${content.title} - Bande d'Annonce`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback vers l'affiche du contenu si la miniature YouTube ne charge pas
                                    if (content.posterUrl) {
                                      e.currentTarget.src = content.posterUrl
                                    } else {
                                      e.currentTarget.style.display = 'none'
                                    }
                                  }}
                                />
                              ) : content.posterUrl ? (
                                <PosterImage
                                  src={content.posterUrl}
                                  alt={content.title}
                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <VideoCameraIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-500" />
                              )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-lg">
                                <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white ml-1" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 sm:p-5">
                              <p className="text-white font-semibold text-base sm:text-lg line-clamp-2">{content.title}</p>
                            </div>
                          </div>
                        </div>
                        {/* Modal pour la bande d'annonce du contenu actuel - affiché après la carte sur mobile */}
                        {selectedTrailer && selectedTrailer.contentId === content.id && (() => {
                          const trailerContent = content
                          const trailerContentType = 'duration' in trailerContent ? 'movie' : 'series'
                          const isTrailerInList = isInWatchlist(trailerContent.id, trailerContentType)
                          
                          return (
                            <div 
                              className="col-span-full lg:col-span-3 lg:col-start-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="bg-dark-200 rounded-lg border border-gray-700 w-full">
                                {/* Lecteur vidéo */}
                                <div className="w-full aspect-video bg-black relative flex-shrink-0">
                                  {extractYouTubeId(selectedTrailer.videoId) && (
                                    <iframe
                                      key={`youtube-${extractYouTubeId(selectedTrailer.videoId)}-${selectedTrailer.videoId}`}
                                      width="100%"
                                      height="100%"
                                      src={`https://www.youtube.com/embed/${extractYouTubeId(selectedTrailer.videoId)}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&playsinline=1`}
                                      title={selectedTrailer.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                      className="w-full h-full"
                                      style={{ aspectRatio: '16/9' }}
                                    />
                                  )}
                                </div>
                                {/* Barre d'actions */}
                                <div className="w-full bg-black/50 border-t-2 border-gray-600 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 flex-shrink-0">
                                  <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
                                    <div className="flex items-center justify-center space-x-3 sm:space-x-4 md:space-x-6 flex-shrink-0">
                                      <button
                                        onClick={() => {
                                          setSelectedTrailer(null)
                                          router.push(`/content/${trailerContent.id}?autoplay=true`)
                                        }}
                                        className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                                        aria-label="Regarder le contenu"
                                      >
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                          <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                        </div>
                                        <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Regarder</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (!user || !trailerContent || isLoadingWatchlist || !trailerContentType) return
                                          try {
                                            if (isTrailerInList) {
                                              const success = await removeFromWatchlist(trailerContent.id, trailerContentType)
                                              if (success) logger.debug('Contenu retiré de la watchlist', { title: trailerContent.title })
                                            } else {
                                              const success = await addToWatchlist(trailerContent.id, trailerContentType)
                                              if (success) {
                                                logger.debug('Contenu ajouté à la watchlist', { title: trailerContent.title })
                                                FavoritesNotificationService.checkForNewFavorites(user.id)
                                              }
                                            }
                                          } catch (error) {
                                            logger.error('Erreur lors du toggle watchlist', error as Error)
                                          }
                                        }}
                                        disabled={!user || isLoadingWatchlist}
                                        className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-0"
                                        aria-label={isTrailerInList ? "Retirer des favoris" : "Ajouter aux favoris"}
                                      >
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                          {isTrailerInList ? (
                                            <HeartIconSolid className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-500" />
                                          ) : (
                                            <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                          )}
                                        </div>
                                        <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Favoris</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedTrailer(null)
                                          router.push(`/content/${trailerContent.id}`)
                                        }}
                                        className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                                        aria-label="Afficher la page du contenu"
                                      >
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                          <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                        </div>
                                        <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Afficher</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (!trailerContent) return
                                          const url = `${window.location.origin}/content/${trailerContent.id}`
                                          const title = trailerContent.title
                                          try {
                                            if (navigator.share) {
                                              await navigator.share({ title, text: `Découvrez "${title}" sur Atiha`, url })
                                            } else {
                                              await navigator.clipboard.writeText(url)
                                              alert('Lien copié dans le presse-papiers !')
                                            }
                                          } catch (error) {
                                            if (error instanceof Error && error.name !== 'AbortError') {
                                              logger.error('Erreur lors du partage', error)
                                              try {
                                                await navigator.clipboard.writeText(url)
                                                alert('Lien copié dans le presse-papiers !')
                                              } catch (clipboardError) {
                                                logger.error('Erreur lors de la copie', clipboardError as Error)
                                              }
                                            }
                                          }
                                        }}
                                        className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                                        aria-label="Partager le contenu"
                                      >
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                          <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                        </div>
                                        <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Partager</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                        </>
                      )}

                      {/* Bandes annonces des contenus avec des noms similaires */}
                      {relatedTrailers.map((item, index) => {
                        const trailerUrl = item.trailerUrl || ''
                        const thumbnailUrl = getYouTubeThumbnail(trailerUrl)
                        
                        return (
                          <React.Fragment key={item.id}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                // Toggle: si déjà sélectionné, fermer, sinon ouvrir
                                if (selectedTrailer && selectedTrailer.contentId === item.id) {
                                  setSelectedTrailer(null)
                                } else {
                                  setSelectedTrailer({ videoId: trailerUrl, title: `${item.title} - Bande d'Annonce`, contentId: item.id })
                                }
                              }}
                              className="group cursor-pointer"
                            >
                            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50 hover:border-gray-600 transition-all duration-200 hover:scale-105">
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                {thumbnailUrl ? (
                                  <img
                                    src={thumbnailUrl}
                                    alt={`${item.title} - Bande d'Annonce`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback vers l'affiche du contenu si la miniature YouTube ne charge pas
                                      if (item.posterUrl) {
                                        e.currentTarget.src = item.posterUrl
                                      } else {
                                        e.currentTarget.style.display = 'none'
                                      }
                                    }}
                                  />
                                ) : item.posterUrl ? (
                                  <PosterImage
                                    src={item.posterUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                  />
                                ) : (
                                  <VideoCameraIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-500" />
          )}
          </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-lg">
                                  <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white ml-1" />
        </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 sm:p-5">
                                <p className="text-white font-semibold text-base sm:text-lg line-clamp-2">{item.title}</p>
                              </div>
                            </div>
                          </div>
                          {/* Modal pour cette bande d'annonce - affiché après la carte sur mobile */}
                          {selectedTrailer && selectedTrailer.contentId === item.id && (() => {
                            const trailerContent = item
                            const trailerContentType = 'duration' in trailerContent ? 'movie' : 'series'
                            const isTrailerInList = isInWatchlist(trailerContent.id, trailerContentType)
                            
                            return (
                              <div 
                                className="col-span-full lg:col-span-3 lg:col-start-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="bg-dark-200 rounded-lg border border-gray-700 w-full">
                                  {/* Lecteur vidéo */}
                                  <div className="w-full aspect-video bg-black relative flex-shrink-0">
                                    {extractYouTubeId(selectedTrailer.videoId) && (
                                      <iframe
                                        key={`youtube-${extractYouTubeId(selectedTrailer.videoId)}-${selectedTrailer.videoId}`}
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${extractYouTubeId(selectedTrailer.videoId)}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&playsinline=1`}
                                        title={selectedTrailer.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="w-full h-full"
                                        style={{ aspectRatio: '16/9' }}
                                      />
                                    )}
                                  </div>
                                  {/* Barre d'actions */}
                                  <div className="w-full bg-black/50 border-t-2 border-gray-600 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 flex-shrink-0">
                                    <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
                                      <div className="flex items-center justify-center space-x-3 sm:space-x-4 md:space-x-6 flex-shrink-0">
                                        <button
                                          onClick={() => {
                                            setSelectedTrailer(null)
                                            router.push(`/content/${trailerContent.id}?autoplay=true`)
                                          }}
                                          className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                                          aria-label="Regarder le contenu"
                                        >
                                          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                            <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                          </div>
                                          <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Regarder</span>
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!user || !trailerContent || isLoadingWatchlist || !trailerContentType) return
                                            try {
                                              if (isTrailerInList) {
                                                const success = await removeFromWatchlist(trailerContent.id, trailerContentType)
                                                if (success) logger.debug('Contenu retiré de la watchlist', { title: trailerContent.title })
                                              } else {
                                                const success = await addToWatchlist(trailerContent.id, trailerContentType)
                                                if (success) {
                                                  logger.debug('Contenu ajouté à la watchlist', { title: trailerContent.title })
                                                  FavoritesNotificationService.checkForNewFavorites(user.id)
                                                }
                                              }
                                            } catch (error) {
                                              logger.error('Erreur lors du toggle watchlist', error as Error)
                                            }
                                          }}
                                          disabled={!user || isLoadingWatchlist}
                                          className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-0"
                                          aria-label={isTrailerInList ? "Retirer des favoris" : "Ajouter aux favoris"}
                                        >
                                          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                            {isTrailerInList ? (
                                              <HeartIconSolid className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-500" />
                                            ) : (
                                              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                            )}
                                          </div>
                                          <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Favoris</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedTrailer(null)
                                            router.push(`/content/${trailerContent.id}`)
                                          }}
                                          className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                                          aria-label="Afficher la page du contenu"
                                        >
                                          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                            <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                          </div>
                                          <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Afficher</span>
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!trailerContent) return
                                            const url = `${window.location.origin}/content/${trailerContent.id}`
                                            const title = trailerContent.title
                                            try {
                                              if (navigator.share) {
                                                await navigator.share({ title, text: `Découvrez "${title}" sur Atiha`, url })
                                              } else {
                                                await navigator.clipboard.writeText(url)
                                                alert('Lien copié dans le presse-papiers !')
                                              }
                                            } catch (error) {
                                              if (error instanceof Error && error.name !== 'AbortError') {
                                                logger.error('Erreur lors du partage', error)
                                                try {
                                                  await navigator.clipboard.writeText(url)
                                                  alert('Lien copié dans le presse-papiers !')
                                                } catch (clipboardError) {
                                                  logger.error('Erreur lors de la copie', clipboardError as Error)
                                                }
                                              }
                                            }
                                          }}
                                          className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                                          aria-label="Partager le contenu"
                                        >
                                          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                                            <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                          </div>
                                          <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Partager</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </React.Fragment>
                      )
                    })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 md:py-20 bg-gray-800/30 rounded-lg border border-gray-700/50 p-4 sm:p-5 md:p-6">
                    <VideoCameraIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-500 mx-auto mb-4 sm:mb-5" />
                    <p className="text-gray-400 text-base sm:text-lg md:text-xl">Aucune bande-annonce disponible</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Titres similaires */}
            {activeTab === 'titres-similaires' && (
              <div>
                {isLoadingSimilar ? (
                  <div className="text-center py-12 sm:py-16 md:py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-gray-400"></div>
                    <p className="text-gray-400 mt-4 sm:mt-5 text-base sm:text-lg md:text-xl">Chargement des titres similaires...</p>
            </div>
                ) : similarContent.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6">
                    {similarContent.map((item) => {
                      const itemStats = ReviewsService.getReviewStats(item.id)
                      const itemRating = itemStats.averageRating > 0 ? itemStats.averageRating.toFixed(1) : 'N/A'
                      
                      return (
                        <Link
                          key={item.id}
                          href={`/content/${item.id}`}
                          className="group cursor-pointer"
                        >
                          <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            <PosterImage
                              src={item.posterUrl || '/placeholder-video.jpg'}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-white text-base sm:text-lg mb-2 line-clamp-2">
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between text-sm sm:text-base text-gray-400 min-h-[1.5rem]">
                              <span>{item.year}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                                <span className="whitespace-nowrap">{itemRating}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 md:py-20 bg-gray-800/30 rounded-lg border border-gray-700/50 p-4 sm:p-5 md:p-6">
                    <SparklesIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-500 mx-auto mb-4 sm:mb-5" />
                    <p className="text-gray-400 text-base sm:text-lg md:text-xl">Aucun titre similaire trouvé</p>
          </div>
        )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Progrès de visionnage */}
      {watchProgress && watchProgress.currentTime > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progression</span>
            <span>{Math.round((watchProgress.currentTime / watchProgress.duration) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${(watchProgress.currentTime / watchProgress.duration) * 100}%` }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
