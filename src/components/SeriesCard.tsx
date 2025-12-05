'use client'

import React, { useState, useEffect } from 'react'
import { Series } from '@/types/content'
import { useAuth } from '@/lib/auth-context'
import { premiumCodesService, UserPremiumStatus } from '@/lib/premium-codes-service'
import { PosterImage, ThumbnailImage } from '@/components/OptimizedImage'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { 
  PlayIcon, 
  ClockIcon, 
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface SeriesCardProps {
  series: Series
  className?: string
}

export default function SeriesCard({ series, className = '' }: SeriesCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [premiumStatus, setPremiumStatus] = useState<UserPremiumStatus>({ isPremium: false })
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    if (user?.id) {
      const status = premiumCodesService.getUserPremiumStatus(user.id)
      setPremiumStatus(status)
    }
  }, [user?.id])

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getTotalEpisodes = (): number => {
    return series.seasons.reduce((total, season) => total + season.episodes.length, 0)
  }

  const getTotalDuration = (): number => {
    return series.seasons.reduce((total, season) => 
      total + season.episodes.reduce((seasonTotal, episode) => seasonTotal + episode.duration, 0), 0
    )
  }

  const handleWatchSeries = () => {
    // Toujours permettre la navigation vers la page du contenu
    router.push(`/watch/${series.id}`)
  }

  const handleWatchEpisode = (episodeId: string) => {
    // Toujours permettre la navigation vers la page du contenu
    router.push(`/watch/${series.id}?episode=${episodeId}`)
  }

  const isPremiumLocked = series.isPremium && !premiumStatus.isPremium

  return (
    <div 
      className={`bg-dark-200 rounded-lg overflow-hidden border border-gray-700 transition-colors ${className}`}
      style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
      onMouseEnter={(e) => {
        if (isClient) {
          e.currentTarget.style.borderColor = content.appIdentity.colors.primary
        }
      }}
      onMouseLeave={(e) => {
        if (isClient) {
          e.currentTarget.style.borderColor = '#374151'
        }
      }}
    >
      {/* Affiche principale */}
      <div className="relative">
        <div className="w-full bg-gray-700 overflow-hidden relative">
          {series.posterUrl ? (
            <PosterImage
              src={series.posterUrl}
              alt={series.title}
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center">
              <PlayIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Overlay avec bouton play */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={handleWatchSeries}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors text-white"
            style={isClient ? { 
              backgroundColor: isPremiumLocked ? undefined : content.appIdentity.colors.primary,
              '--hover-color': isPremiumLocked ? undefined : content.appIdentity.colors.secondary
            } as React.CSSProperties : { 
              backgroundColor: isPremiumLocked ? undefined : '#3B82F6'
            }}
            onMouseEnter={(e) => {
              if (isClient && !isPremiumLocked) {
                e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
              }
            }}
            onMouseLeave={(e) => {
              if (isClient && !isPremiumLocked) {
                e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
              }
            }}
          >
            {isPremiumLocked ? (
              <>
                <LockClosedIcon className="w-5 h-5" />
                <span>Premium requis</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                <span>Regarder</span>
              </>
            )}
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <span className="bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
            Série
          </span>
          {series.isPremium && (
            <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
              <StarIcon className="w-3 h-3" />
              <span>VIP</span>
            </span>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="p-4">
                  <button
                    onClick={() => router.push(`/watch/${series.id}`)}
                    className="text-white font-semibold text-lg mb-2 line-clamp-2 text-left hover:text-primary-400 transition-colors"
                  >
                    {series.title}
                  </button>
        
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">{series.rating}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <CalendarIcon className="w-4 h-4" />
            <span>{series.year}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <PlayIcon className="w-4 h-4" />
            <span>{series.seasons.length} saison{series.seasons.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm line-clamp-3 mb-3">
          {series.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {series.genre.slice(0, 3).map((genre, index) => (
            <span
              key={index}
              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
            >
              {genre}
            </span>
          ))}
          {series.genre.length > 3 && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
              +{series.genre.length - 3}
            </span>
          )}
        </div>

        {/* Statistiques */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <div className="flex items-center space-x-1">
            <PlayIcon className="w-4 h-4" />
            <span>{getTotalEpisodes()} épisodes</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDuration(getTotalDuration())}</span>
          </div>
        </div>

        {/* Bouton pour voir les épisodes */}
        <button
          onClick={() => setShowEpisodes(!showEpisodes)}
          className="w-full flex items-center justify-between p-2 text-gray-400 hover:text-white transition-colors"
        >
          <span className="text-sm">Voir les épisodes</span>
          {showEpisodes ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Liste des épisodes (expandable) */}
      {showEpisodes && (
        <div className="border-t border-gray-700 max-h-64 overflow-y-auto">
          {series.seasons.map((season) => (
            <div key={season.id}>
              <div className="px-4 py-2 bg-dark-300 border-b border-gray-700">
                <h4 className="text-white font-medium text-sm">{season.title}</h4>
                <p className="text-gray-400 text-xs">{season.episodes.length} épisode{season.episodes.length > 1 ? 's' : ''}</p>
              </div>
              
              {season.episodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => handleWatchEpisode(episode.id)}
                  className="w-full p-2 text-left hover:bg-dark-100 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-gray-700 rounded flex-shrink-0 overflow-hidden relative">
                      {episode.thumbnailUrl ? (
                        <ThumbnailImage
                          src={episode.thumbnailUrl}
                          alt={episode.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlayIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-white font-medium text-sm">
                        Épisode {episode.episodeNumber}
                      </h5>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
