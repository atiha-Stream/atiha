'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, BellIcon, TrashIcon, PlayIcon, HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { NotificationsService, ContentNotification } from '@/lib/notifications-service'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OptimizedImage from './OptimizedImage'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { ContentService } from '@/lib/content-service'
import { Movie, Series } from '@/types/content'
import ExpandableCardSection from './ExpandableCardSection'
import { useAuth } from '@/lib/auth-context'
import { useWatchlist } from '@/hooks/useWatchlist'
import { logger } from '@/lib/logger'

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const cardElementsRef = useRef<Map<string, HTMLElement>>(new Map())
  const [notificationsByDay, setNotificationsByDay] = useState<Array<{
    date: Date
    label: string
    notifications: ContentNotification[]
  }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [contentDetails, setContentDetails] = useState<Map<string, Movie | Series>>(new Map())
  // Ref pour éviter le double déclenchement sur mobile (touch + click)
  const touchHandledRef = useRef<boolean>(false)
  
  // Utiliser le hook useWatchlist
  const { watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist, loading: isLoadingFavorites } = useWatchlist(user?.id || null)

  useEffect(() => {
    setIsClient(true)
    setHomepageContent(HomepageContentService.getContent())
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Charger les notifications existantes immédiatement
      loadNotifications()
      // Vérifier les nouveaux contenus de manière asynchrone
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        NotificationsService.checkForNewContent()
        loadNotifications()
      })
    }
  }, [isOpen])


  // Charger les détails complets des contenus
  useEffect(() => {
    if (isOpen && notificationsByDay.length > 0) {
      const loadDetails = async () => {
        const detailsMap = new Map<string, Movie | Series>()
        
        // Récupérer tous les IDs de contenu uniques
        const contentIds = new Set<string>()
        notificationsByDay.forEach(({ notifications }) => {
          notifications.forEach(notification => {
            contentIds.add(notification.contentId)
          })
        })

        // Charger les détails de chaque contenu
        try {
          const [movies, series] = await Promise.all([
            ContentService.getMovies(),
            ContentService.getSeries()
          ])

          // Créer des Maps pour une recherche rapide O(1) au lieu de O(n)
          const moviesMap = new Map(movies.map(m => [m.id, m]))
          const seriesMap = new Map(series.map(s => [s.id, s]))

          contentIds.forEach(contentId => {
            const movie = moviesMap.get(contentId)
            const serie = seriesMap.get(contentId)
            
            if (movie) {
              detailsMap.set(contentId, movie)
            } else if (serie) {
              detailsMap.set(contentId, serie)
            }
          })

          setContentDetails(detailsMap)
        } catch (error) {
          logger.error('Error loading content details', error as Error)
        }
      }
      
      loadDetails()
    }
  }, [isOpen, notificationsByDay])

  // Helper pour vérifier si un contenu est dans les favoris
  const isFavorite = (contentId: string, contentType: string) => {
    return isInWatchlist(contentId, contentType)
  }

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  const loadNotifications = () => {
    const grouped = NotificationsService.getNotificationsByDay()
    setNotificationsByDay(grouped)
    setUnreadCount(NotificationsService.getUnreadCount())
  }

  const handleNotificationClick = (notification: ContentNotification) => {
    // Marquer comme lue
    NotificationsService.markAsRead(notification.id)
    // Recharger les notifications pour mettre à jour l'UI
    loadNotifications()
    
    // Naviguer vers le contenu
    const contentUrl = `/content/${notification.contentId}`
    onClose()
    router.push(contentUrl)
  }

  const handleMarkAllAsRead = () => {
    NotificationsService.markAllAsRead()
    loadNotifications()
  }

  const handleDeleteNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    NotificationsService.deleteNotification(notificationId)
    loadNotifications()
  }

  const handlePlayTrailer = (notification: ContentNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const content = contentDetails.get(notification.contentId)
    if (content && content.trailerUrl) {
      // Toggle: si la carte est déjà ouverte, la fermer, sinon l'ouvrir
      if (expandedCardId === notification.contentId) {
        setExpandedCardId(null)
      } else {
        setExpandedCardId(notification.contentId)
      }
    }
  }

  const handleNotificationCardClick = (notification: ContentNotification, e: React.MouseEvent) => {
    // Si on vient d'un événement touch, ignorer le click
    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }
    
    const content = contentDetails.get(notification.contentId)
    if (content && content.trailerUrl) {
      e.preventDefault()
      e.stopPropagation()
      // Toggle: si la carte est déjà ouverte, la fermer, sinon l'ouvrir
      if (expandedCardId === notification.contentId) {
        setExpandedCardId(null)
      } else {
        setExpandedCardId(notification.contentId)
      }
    } else {
      // Si pas de trailerUrl, navigation normale
      handleNotificationClick(notification)
    }
  }

  const handleNotificationCardTouch = (notification: ContentNotification, e: React.TouchEvent) => {
    const content = contentDetails.get(notification.contentId)
    if (content && content.trailerUrl) {
      e.preventDefault()
      e.stopPropagation()
      // Marquer qu'on a géré le touch pour éviter le double déclenchement
      touchHandledRef.current = true
      // Toggle: si la carte est déjà ouverte, la fermer, sinon l'ouvrir
      if (expandedCardId === notification.contentId) {
        setExpandedCardId(null)
      } else {
        setExpandedCardId(notification.contentId)
      }
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        touchHandledRef.current = false
      }, 300)
    }
  }

  const handleToggleFavorite = async (notification: ContentNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!user || isLoadingFavorites) return

    const content = contentDetails.get(notification.contentId)
    if (!content) return

    try {
      const contentType = 'duration' in content ? 'movie' : 'series'
      const isInFavorites = isInWatchlist(notification.contentId, contentType)

      if (isInFavorites) {
        await removeFromWatchlist(notification.contentId, contentType)
      } else {
        await addToWatchlist(notification.contentId, contentType)
      }
    } catch (error) {
      logger.error('Erreur lors du toggle favoris', error as Error)
    }
  }

  const modalId = useRef(`notifications-modal-${Date.now()}`).current
  const titleId = `${modalId}-title`
  const descriptionId = `${modalId}-description`

  // Gérer la fermeture avec Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-800 bg-dark-300 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2.5 sm:p-3 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          aria-label="Fermer les notifications"
        >
          <ArrowLeftIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
        </button>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base md:text-lg bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium min-h-[44px] sm:min-h-0"
            aria-label="Tout marquer comme lu"
          >
            <span className="hidden sm:inline">Tout marquer comme lu</span>
            <span className="sm:hidden">Tout lu</span>
          </button>
        )}
      </div>

      {/* Content avec scroll */}
      <div 
        id={descriptionId}
        className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100"
        role="region"
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
          {/* Titre */}
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-5 md:mb-6">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
            >
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h1 id={titleId} className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="sr-only">, {unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
              )}
            </h1>
            {unreadCount > 0 && (
              <span 
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-sm sm:text-base md:text-lg font-bold rounded-full"
                aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {notificationsByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BellIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-600 mb-4 sm:mb-6" aria-hidden="true" />
              <p className="text-gray-400 text-lg sm:text-xl md:text-2xl font-medium">Aucune notification</p>
              <p className="text-gray-500 text-base sm:text-lg mt-2 sm:mt-3">Les nouveaux contenus apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {notificationsByDay.map(({ date, label, notifications }) => (
                <div key={date.toISOString()}>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-400 mb-3 sm:mb-4">{label}</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {notifications
                      .filter(notification => notification.type === 'new_arrival')
                      .map((notification, index) => {
                        const content = contentDetails.get(notification.contentId)
                        return (
                          <React.Fragment key={`${notification.id}-${index}`}>
                            {/* Afficher la section extensible avant la carte de notification */}
                            {content && content.trailerUrl && expandedCardId === notification.contentId && (
                              <div className="mb-3">
                                <ExpandableCardSection
                                  content={content}
                                  isOpen={expandedCardId === notification.contentId}
                                  onClose={() => setExpandedCardId(null)}
                                />
                              </div>
                            )}
                            <div
                              onClick={(e) => handleNotificationCardClick(notification, e)}
                              onTouchEnd={(e) => handleNotificationCardTouch(notification, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                                  handleNotificationCardClick(notification, e as any)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Notification pour ${notification.contentTitle}, ${notification.type === 'new_arrival' ? 'nouveau contenu' : 'maintenant disponible'}`}
                        className={`p-4 sm:p-5 md:p-6 rounded-lg border cursor-pointer transition-all hover:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          notification.isRead 
                            ? 'bg-dark-100/50 border-gray-700' 
                            : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
                          {/* Poster */}
                          <div 
                            className="w-full sm:flex-shrink-0 sm:w-[180px] sm:h-[252px] aspect-[2/3] sm:aspect-auto rounded-lg overflow-hidden bg-gray-700 relative group"
                            ref={(el) => {
                              if (el) {
                                cardElementsRef.current.set(notification.id, el)
                              } else {
                                cardElementsRef.current.delete(notification.id)
                              }
                            }}
                          >
                            {(() => {
                              const content = contentDetails.get(notification.contentId)
                              const trailerUrl = content?.trailerUrl
                              
                              // Essayer d'utiliser previewUrl, sinon posterUrl, sinon placeholder
                              let imageSrc = '/placeholder-video.jpg'
                              if (content) {
                                if (content.previewUrl && content.previewUrl.trim() !== '') {
                                  imageSrc = content.previewUrl
                                } else if (content.posterUrl && content.posterUrl.trim() !== '') {
                                  imageSrc = content.posterUrl
                                }
                              } else if (notification.posterUrl && notification.posterUrl.trim() !== '') {
                                imageSrc = notification.posterUrl
                              }
                              
                              return (
                                <>
                            <OptimizedImage
                                    src={imageSrc}
                              alt={notification.contentTitle}
                                    width={180}
                                    height={252}
                              className="w-full h-full object-cover"
                            />
                                  {trailerUrl && (
                                    <button
                                      onClick={(e) => handlePlayTrailer(notification, e)}
                                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors min-w-[44px] min-h-[44px]"
                                      aria-label="Lire la bande d'annonce"
                                    >
                                      <div className="bg-black/60 hover:bg-black/80 rounded-full p-4 sm:p-5 md:p-6 transition-colors">
                                        <PlayIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" />
                                      </div>
                                    </button>
                                  )}
                                </>
                              )
                            })()}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 flex flex-col h-full">
                            <div className="flex items-start justify-between flex-1">
                              <div className="flex-1 flex flex-col h-full">
                                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                                  <span className={`text-sm sm:text-base md:text-lg font-semibold px-3 py-1 sm:px-4 sm:py-1.5 rounded ${
                                    notification.type === 'new_arrival'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {notification.type === 'new_arrival' ? 'New Arrival' : 'Now Available'}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-500 rounded-full"></span>
                                  )}
                                </div>
                                <h4 className="text-white font-semibold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">
                                  {notification.contentTitle}
                                </h4>
                                {(() => {
                                  const content = contentDetails.get(notification.contentId)
                                  if (!content) return null
                                  
                                  return (
                                    <div className="flex-1 flex flex-col space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-400">
                                      {/* Année */}
                                      {content.year && (
                                        <p className="text-gray-300 font-medium text-base sm:text-lg">{content.year}</p>
                                      )}
                                      
                                      {/* Description - occupe l'espace restant */}
                                      {content.description && (
                                        <p className="text-gray-400 flex-1 line-clamp-6 sm:line-clamp-8 text-sm sm:text-base">
                                          {content.description}
                                        </p>
                                      )}
                                      
                                      {/* Genre */}
                                      {content.genre && content.genre.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 mt-auto">
                                          <span className="text-gray-500 font-medium">Genre:</span>
                                          {content.genre.map((g, idx) => (
                                            <span key={idx} className="text-gray-300">
                                              {g}{idx < content.genre.length - 1 ? ',' : ''}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Acteurs */}
                                      {content.cast && content.cast.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-gray-500 font-medium">Acteurs:</span>
                                          {content.cast.slice(0, 3).map((actor, idx) => (
                                            <span key={idx} className="text-gray-300">
                                              {actor}{idx < Math.min(content.cast.length, 3) - 1 ? ',' : ''}
                                            </span>
                                          ))}
                                          {content.cast.length > 3 && (
                                            <span className="text-gray-500">+{content.cast.length - 3} autres</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                                {user && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      handleToggleFavorite(notification, e)
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    disabled={isLoadingFavorites}
                                    className="p-2.5 sm:p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors relative z-10 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                    aria-label={(() => {
                                      const content = contentDetails.get(notification.contentId)
                                      const contentType = content ? ('duration' in content ? 'movie' : 'series') : 'movie'
                                      return isInWatchlist(notification.contentId, contentType) ? "Retirer des favoris" : "Ajouter aux favoris"
                                    })()}
                                    title={(() => {
                                      const content = contentDetails.get(notification.contentId)
                                      const contentType = content ? ('duration' in content ? 'movie' : 'series') : 'movie'
                                      return isInWatchlist(notification.contentId, contentType) ? "Retirer des favoris" : "Ajouter aux favoris"
                                    })()}
                                  >
                                    {(() => {
                                      const content = contentDetails.get(notification.contentId)
                                      const contentType = content ? ('duration' in content ? 'movie' : 'series') : 'movie'
                                      return isInWatchlist(notification.contentId, contentType) ? (
                                        <HeartIconSolid className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" aria-hidden="true" />
                                      ) : (
                                        <HeartIcon className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                                      )
                                    })()}
                                  </button>
                                )}
                              <button
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                  className="p-2.5 sm:p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                aria-label={`Supprimer la notification pour ${notification.contentTitle}`}
                                title="Supprimer"
                              >
                                <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </React.Fragment>
                    )
                  })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

