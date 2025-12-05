'use client'

import React, { useState, useEffect } from 'react'
import UniversalVideoPlayer from './UniversalVideoPlayer'
import { detectVideoLink } from '@/lib/video-link-detector'
import { ContentService } from '@/lib/content-service'
import { WatchProgress } from '@/types/content'
import { logger } from '@/lib/logger'

interface EnhancedVideoPlayerProps {
  videoUrl: string
  contentId: string
  episodeId?: string
  title: string
  contentType?: 'movie' | 'series'
  onClose: () => void
  onProgressUpdate?: (progress: WatchProgress) => void
  className?: string
  posterUrl?: string
}

export default function EnhancedVideoPlayer({
  videoUrl,
  contentId,
  episodeId,
  title,
  contentType = 'movie',
  onClose,
  onProgressUpdate,
  className = "",
  posterUrl
}: EnhancedVideoPlayerProps) {
  const [savedProgress, setSavedProgress] = useState<WatchProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Charger le progrès sauvegardé
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await ContentService.getWatchProgress(contentId, episodeId)
        setSavedProgress(progress)
      } catch (error) {
        logger.error('Erreur lors du chargement du progrès', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [contentId, episodeId])

  const handleError = (error: string) => {
    setHasError(true)
    setErrorMessage(error)
    logger.error('Erreur de lecture vidéo', new Error(error))
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    setErrorMessage('')
  }
  const linkInfo = detectVideoLink(videoUrl)

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`} style={{ height: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de la vidéo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <UniversalVideoPlayer
        videoUrl={videoUrl}
        title={title}
        onClose={onClose}
        onError={handleError}
        onLoad={handleLoad}
        autoplay={true}
        height="100%"
        className="w-full h-full rounded-none"
        posterUrl={posterUrl}
      />

      {/* Gestion du progrès pour les vidéos directes */}
      {linkInfo.type === 'direct' && savedProgress && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progrès sauvegardé</span>
            <span>{Math.round((savedProgress.currentTime / savedProgress.duration) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(savedProgress.currentTime / savedProgress.duration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
