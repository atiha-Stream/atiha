'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Movie } from '@/types/content'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { premiumCodesService, UserPremiumStatus } from '@/lib/premium-codes-service'
import { PosterImage } from '@/components/OptimizedImage'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { useCardModal } from '@/contexts/CardModalContext'
import { 
  PlayIcon, 
  ClockIcon, 
  StarIcon,
  CalendarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

interface MovieCardProps {
  movie: Movie
  className?: string
}

export default function MovieCard({ movie, className = '' }: MovieCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { showCardModal, hideCardModal } = useCardModal()
  const [premiumStatus, setPremiumStatus] = useState<UserPremiumStatus>({ isPremium: false })
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const cardModalTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleWatchMovie = () => {
    // Toujours permettre la navigation vers la page du contenu
    router.push(`/watch/${movie.id}`)
  }

  const isPremiumLocked = movie.isPremium && !premiumStatus.isPremium

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isClient) {
      e.currentTarget.style.borderColor = content.appIdentity.colors.primary
    }

    // Afficher le modal de carte (transformation de la carte en modal) si l'utilisateur est connecté et qu'il y a une bande-annonce
    if (user && movie.trailerUrl) {
      // Délai pour éviter d'afficher trop rapidement
      cardModalTimeoutRef.current = setTimeout(() => {
        if (cardRef.current) {
          showCardModal(movie, cardRef.current)
        }
      }, 200) // 200ms de délai
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isClient) {
      e.currentTarget.style.borderColor = '#374151'
    }

    // Annuler le timeout si la souris quitte la carte
    if (cardModalTimeoutRef.current) {
      clearTimeout(cardModalTimeoutRef.current)
      cardModalTimeoutRef.current = null
    }

    // Ne pas fermer le modal ici - il se fermera seulement quand la souris quitte le modal
    // Le modal gère sa propre fermeture via onMouseLeave
  }

  useEffect(() => {
    return () => {
      if (cardModalTimeoutRef.current) {
        clearTimeout(cardModalTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={cardRef}
      className={`bg-dark-200 rounded-lg overflow-hidden border border-gray-700 transition-colors ${className}`}
      style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Affiche principale */}
      <div className="relative">
        <div className="w-full bg-gray-700 overflow-hidden relative">
          {movie.posterUrl ? (
            <PosterImage
              src={movie.posterUrl}
              alt={movie.title}
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
            onClick={handleWatchMovie}
            className="flex items-center space-x-2 px-6 py-3 text-white rounded-lg transition-colors"
            style={isClient ? { 
              backgroundColor: content.appIdentity.colors.primary,
              '--hover-color': content.appIdentity.colors.secondary
            } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
            onMouseEnter={(e) => {
              if (isClient) {
                e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
              }
            }}
            onMouseLeave={(e) => {
              if (isClient) {
                e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
              }
            }}
          >
            <PlayIcon className="w-5 h-5" />
            <span>Regarder</span>
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            Film
          </span>
          {movie.isPremium && (
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
          onClick={handleWatchMovie}
          className="text-white font-semibold text-lg mb-2 line-clamp-2 text-left hover:text-primary-400 transition-colors w-full"
        >
          {movie.title}
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3">
          <div className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">{movie.rating}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <CalendarIcon className="w-4 h-4" />
            <span>{movie.year}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDuration(movie.duration)}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm line-clamp-3 mb-3">
          {movie.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {movie.genre.slice(0, 3).map((genre, index) => (
            <span
              key={index}
              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
            >
              {genre}
            </span>
          ))}
          {movie.genre.length > 3 && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
              +{movie.genre.length - 3}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center sm:justify-between">
          <button
            onClick={handleWatchMovie}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center ${
              isPremiumLocked 
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white' 
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {isPremiumLocked ? (
              <>
                <LockClosedIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Premium requis</span>
                <span className="xs:hidden">Premium</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Regarder</span>
                <span className="xs:hidden">Play</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


