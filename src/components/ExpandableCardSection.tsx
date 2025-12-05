'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractYouTubeId } from '@/lib/video-link-detector'
import { PlayIcon, HeartIcon, EyeIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useAuth } from '@/lib/auth-context'
import { useWatchlist } from '@/hooks/useWatchlist'
import { FavoritesNotificationService } from '@/lib/favorites-notification-service'
import { Movie, Series } from '@/types/content'
import { logger } from '@/lib/logger'

interface ExpandableCardSectionProps {
  content: Movie | Series
  isOpen: boolean
  onClose: () => void
}

export default function ExpandableCardSection({ content, isOpen, onClose }: ExpandableCardSectionProps) {
  const { user } = useAuth()
  const router = useRouter()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [isIframeReady, setIsIframeReady] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Utiliser le hook useWatchlist
  const contentType = content ? ('duration' in content ? 'movie' : 'series') : null
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, loading: isLoadingWatchlist } = useWatchlist(user?.id || null)
  
  // Vérifier si le contenu est dans la watchlist
  const isInList = content 
    ? isInWatchlist(content.id, contentType || 'movie')
    : false

  useEffect(() => {
    if (content?.trailerUrl) {
      const id = extractYouTubeId(content.trailerUrl)
      setYoutubeId(id || null)
      setIsIframeReady(false)
    }
  }, [content?.trailerUrl])

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (isOpen && content) {
      // Animation d'ouverture
      setTimeout(() => setIsExpanded(true), 10)
    } else {
      setIsExpanded(false)
    }
  }, [isOpen, content?.id])

  // Actions
  const handlePlay = () => {
    if (content) {
      onClose()
      router.push(`/content/${content.id}?autoplay=true`)
    }
  }

  const handleToggleWatchlist = async () => {
    if (!user || !content || isLoadingWatchlist || !contentType) return

    try {
      if (isInList) {
        const success = await removeFromWatchlist(content.id, contentType)
        if (success) {
          logger.debug('Contenu retiré de la watchlist', { title: content.title })
        }
      } else {
        const success = await addToWatchlist(content.id, contentType)
        if (success) {
          logger.debug('Contenu ajouté à la watchlist', { title: content.title })
          // Déclencher la vérification des nouveaux favoris
          FavoritesNotificationService.checkForNewFavorites(user.id)
        }
      }
    } catch (error) {
      logger.error('Erreur lors du toggle watchlist', error as Error)
    }
  }

  const handleViewContent = () => {
    if (content) {
      onClose()
      router.push(`/content/${content.id}`)
    }
  }

  const handleShare = async () => {
    if (!content) return

    const url = `${window.location.origin}/content/${content.id}`
    const title = content.title

    try {
      // Vérifier si l'API Web Share est disponible (mobile)
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Découvrez "${title}" sur Atiha`,
          url: url,
        })
      } else {
        // Fallback : copier le lien dans le presse-papiers
        await navigator.clipboard.writeText(url)
        // Optionnel : afficher une notification de succès
        alert('Lien copié dans le presse-papiers !')
      }
    } catch (error) {
      // L'utilisateur a annulé le partage ou une erreur s'est produite
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Erreur lors du partage', error)
        // Fallback : copier le lien dans le presse-papiers
        try {
          await navigator.clipboard.writeText(url)
          alert('Lien copié dans le presse-papiers !')
        } catch (clipboardError) {
          logger.error('Erreur lors de la copie', clipboardError as Error)
        }
      }
    }
  }

  if (!isOpen || !content || !youtubeId) {
    return null
  }

  return (
    <div
      ref={sectionRef}
      className={`col-span-full w-full transition-all duration-300 ease-in-out ${
        isExpanded ? 'h-auto opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
      }`}
      style={{
        overflow: 'hidden',
        minHeight: isExpanded ? 'auto' : '0'
      }}
    >
      <div className="bg-dark-200 rounded-lg border border-gray-700 w-full lg:w-[62.5%] lg:mx-auto">
        {/* Lecteur vidéo */}
        <div className="w-full aspect-video bg-black relative flex-shrink-0">
          {youtubeId && (
            <iframe
              key={`youtube-${youtubeId}-${isOpen}`}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&playsinline=1`}
              title={content.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              style={{
                aspectRatio: '16/9',
                opacity: isIframeReady ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoad={() => setIsIframeReady(true)}
            />
          )}
          {!isIframeReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-base sm:text-lg font-medium">Chargement...</div>
            </div>
          )}
        </div>

        {/* Barre d'actions */}
        <div className="w-full bg-black/50 border-t-2 border-gray-600 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
            {/* Boutons d'action */}
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 md:space-x-6 flex-shrink-0">
              {/* Bouton Play */}
              <button
                onClick={handlePlay}
                className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                aria-label="Regarder le contenu"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                  <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Regarder</span>
              </button>

              {/* Bouton Favoris */}
              <button
                onClick={handleToggleWatchlist}
                disabled={!user || isLoadingWatchlist}
                className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-0"
                aria-label={isInList ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                  {isInList ? (
                    <HeartIconSolid className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  )}
                </div>
                <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Favoris</span>
              </button>

              {/* Bouton Afficher */}
              <button
                onClick={handleViewContent}
                className="flex flex-col items-center space-y-1 sm:space-y-1.5 group hover:scale-110 transition-transform min-w-[60px] sm:min-w-0"
                aria-label="Afficher la page du contenu"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]">
                  <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Afficher</span>
              </button>

              {/* Bouton Partager */}
              <button
                onClick={handleShare}
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
}

