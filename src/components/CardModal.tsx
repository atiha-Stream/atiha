'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCardModal } from '@/contexts/CardModalContext'
import { extractYouTubeId } from '@/lib/video-link-detector'
import { XMarkIcon, PlayIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useAuth } from '@/lib/auth-context'
import { useWatchlist } from '@/hooks/useWatchlist'
import { logger } from '@/lib/logger'

export default function CardModal() {
  const { cardModal, hideCardModal, setHoveringModal } = useCardModal()
  const { user } = useAuth()
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isIframeReady, setIsIframeReady] = useState(false)
  
  // Utiliser le hook useWatchlist
  const contentType = cardModal.content ? ('duration' in cardModal.content ? 'movie' : 'series') : null
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, loading: isLoadingWatchlist } = useWatchlist(user?.id || null)
  
  // Vérifier si le contenu est dans la watchlist
  const isInList = cardModal.content 
    ? isInWatchlist(cardModal.content.id, contentType || 'movie')
    : false

  useEffect(() => {
    if (cardModal.content?.trailerUrl) {
      const id = extractYouTubeId(cardModal.content.trailerUrl)
      setYoutubeId(id || null)
      setIsIframeReady(false) // Réinitialiser l'état de chargement quand le contenu change
    }
  }, [cardModal.content?.trailerUrl])


  // Actions
  const handlePlay = () => {
    if (cardModal.content) {
      hideCardModal()
      // Ajouter un paramètre de requête pour déclencher la lecture automatique
      router.push(`/content/${cardModal.content.id}?autoplay=true`)
    }
  }

  const handleToggleWatchlist = async () => {
    if (!user || !cardModal.content || isLoadingWatchlist || !contentType) return

    try {
      if (isInList) {
        // Retirer de la watchlist
        const success = await removeFromWatchlist(cardModal.content.id, contentType)
        if (success) {
          logger.debug('Contenu retiré de la watchlist', { title: cardModal.content.title })
        } else {
          logger.error('Échec de la suppression de la watchlist')
        }
      } else {
        // Ajouter à la watchlist
        const success = await addToWatchlist(cardModal.content.id, contentType)
        if (success) {
          logger.debug('Contenu ajouté à la watchlist', { title: cardModal.content.title })
        } else {
          logger.error('Échec de l\'ajout à la watchlist')
        }
      }
    } catch (error) {
      logger.error('Erreur lors du toggle watchlist', error as Error)
    }
  }

  const handleViewContent = () => {
    if (cardModal.content) {
      hideCardModal()
      router.push(`/content/${cardModal.content.id}`)
    }
  }

  useEffect(() => {
    if (cardModal.isVisible && cardModal.cardElement && modalRef.current) {
      setIsAnimating(true)
      // L'iframe sera créée immédiatement mais invisible jusqu'à ce qu'elle soit prête
      setIsIframeReady(false)
      
      // Obtenir la position et taille de la carte originale
      const cardRect = cardModal.cardElement.getBoundingClientRect()
      const modal = modalRef.current
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      // Calculer la taille finale du modal (agrandi mais pas trop grand)
      const maxWidth = Math.min(800, windowWidth * 0.9)
      const videoHeight = (maxWidth * 9) / 16 // Ratio 16:9
      // Hauteur de la barre d'actions : plus petite sur mobile
      const actionBarHeight = windowWidth < 768 ? 80 : 100
      const maxHeight = videoHeight + actionBarHeight
      
      // Calculer le centre de la carte originale
      const cardCenterX = cardRect.left + cardRect.width / 2
      const cardCenterY = cardRect.top + cardRect.height / 2
      
      // Position initiale (même position que la carte)
      modal.style.position = 'fixed'
      modal.style.left = `${cardRect.left}px`
      modal.style.top = `${cardRect.top}px`
      modal.style.width = `${cardRect.width}px`
      modal.style.height = `${cardRect.height}px`
      modal.style.transform = 'scale(1)'
      modal.style.opacity = '1'
      modal.style.transition = 'none'
      modal.style.zIndex = '9999'
      modal.style.transformOrigin = 'center center'
      
      // Forcer un reflow
      void modal.offsetHeight
      
      // Animer vers la taille agrandie, centré sur la carte
      requestAnimationFrame(() => {
        if (modal) {
          // Calculer le centre de la carte
          const cardCenterX = cardRect.left + cardRect.width / 2
          const cardCenterY = cardRect.top + cardRect.height / 2
          
          // Centrer le modal sur la carte
          const newLeft = cardCenterX - maxWidth / 2
          const newTop = cardCenterY - maxHeight / 2
          
          // S'assurer que le modal ne sorte pas de l'écran
          const finalLeft = Math.max(20, Math.min(newLeft, windowWidth - maxWidth - 20))
          const finalTop = Math.max(20, Math.min(newTop, windowHeight - maxHeight - 20))
          
          modal.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          modal.style.left = `${finalLeft}px`
          modal.style.top = `${finalTop}px`
          modal.style.width = `${maxWidth}px`
          modal.style.height = `${maxHeight}px`
          modal.style.transform = 'scale(1)'
          
          // Attendre que l'animation soit terminée, puis rendre l'iframe visible
          // L'iframe est déjà créée et en train de charger pendant ce temps
          setTimeout(() => {
            setIsIframeReady(true)
          }, 250) // Délai légèrement supérieur à l'animation pour laisser YouTube charger
        }
      })
    } else if (!cardModal.isVisible && modalRef.current) {
      // Animation de fermeture
      const modal = modalRef.current
      if (cardModal.cardElement) {
        const cardRect = cardModal.cardElement.getBoundingClientRect()
        modal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        modal.style.left = `${cardRect.left}px`
        modal.style.top = `${cardRect.top}px`
        modal.style.width = `${cardRect.width}px`
        modal.style.height = `${cardRect.height}px`
        modal.style.opacity = '0'
        
        // Réinitialiser l'état de l'iframe quand le modal se ferme
        setIsIframeReady(false)
        
        setTimeout(() => {
          setIsAnimating(false)
        }, 300)
      }
    }
  }, [cardModal.isVisible, cardModal.cardElement])

  if (!cardModal.isVisible || !cardModal.content || !youtubeId) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 z-[9998] transition-opacity duration-300"
        onClick={hideCardModal}
        style={{ opacity: cardModal.isVisible ? 1 : 0 }}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-[9999] bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-700"
        style={{
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setHoveringModal(true)}
        onMouseLeave={() => {
          setHoveringModal(false)
          hideCardModal()
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={hideCardModal}
          className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
          aria-label="Fermer"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Contenu du modal */}
        <div className="w-full h-full relative flex flex-col">
          {/* Lecteur vidéo */}
          <div className="w-full flex-shrink-0 aspect-video bg-black relative">
            {youtubeId && (
              <iframe
                key={`youtube-${youtubeId}-${cardModal.isVisible}`}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&playsinline=1`}
                title={cardModal.content.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
                style={{ 
                  aspectRatio: '16/9',
                  opacity: isIframeReady ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              />
            )}
            {!isIframeReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-white text-sm">Chargement...</div>
              </div>
            )}
          </div>

          {/* Barre d'actions */}
          <div className="w-full bg-black/50 border-t-2 border-gray-600 px-3 md:px-6 py-2 md:py-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              {/* Partie gauche : Titre et Genre */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Titre du contenu */}
                <div className="text-left mb-0.5 md:mb-1">
                  <h3 className="text-xs md:text-base font-semibold text-white truncate">
                    {cardModal.content.title}
                  </h3>
                </div>

                {/* Genre du contenu */}
                {cardModal.content.genre && cardModal.content.genre.length > 0 && (
                  <div className="text-left">
                    <div className="flex items-center justify-start flex-wrap gap-1 md:gap-2">
                      {cardModal.content.genre.map((genre, index) => (
                        <span
                          key={index}
                          className="text-[9px] md:text-xs text-white"
                        >
                          {genre}{cardModal.content && index < cardModal.content.genre.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Partie droite : Boutons d'action */}
              <div className="flex items-center justify-end space-x-2 md:space-x-6 flex-shrink-0">
                {/* Bouton Play */}
                <button
                  onClick={handlePlay}
                  className="flex flex-col items-center space-y-0.5 md:space-y-1 group hover:scale-110 transition-transform"
                  aria-label="Regarder le contenu"
                >
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <PlayIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className="text-[9px] md:text-xs text-gray-300 group-hover:text-white transition-colors">Regarder</span>
                </button>

                {/* Bouton Favoris */}
                <button
                  onClick={handleToggleWatchlist}
                  disabled={!user || isLoadingWatchlist}
                  className="flex flex-col items-center space-y-0.5 md:space-y-1 group hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isInList ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    {isInList ? (
                      <HeartIconSolid className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                    )}
                  </div>
                  <span className="text-[9px] md:text-xs text-gray-300 group-hover:text-white transition-colors">Favoris</span>
                </button>

                {/* Bouton Voir */}
                <button
                  onClick={handleViewContent}
                  className="flex flex-col items-center space-y-0.5 md:space-y-1 group hover:scale-110 transition-transform"
                  aria-label="Voir la page du contenu"
                >
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <EyeIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className="text-[9px] md:text-xs text-gray-300 group-hover:text-white transition-colors">Voir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

