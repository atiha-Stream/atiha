'use client'

import React, { useState, useRef, useEffect } from 'react'
import { PlayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { VideoService } from '@/lib/video-service'
import { logger } from '@/lib/logger'

interface SafeVideoPlayerProps {
  videoUrl: string
  title?: string
  posterUrl?: string
  className?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  controls?: boolean
  onError?: () => void
  onLoad?: () => void
  onPlay?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void
  onPause?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void
  fallbackMessage?: string
  showFallbackButton?: boolean
}

export default function SafeVideoPlayer({
  videoUrl,
  title = "Vidéo",
  posterUrl,
  className = "",
  width = "100%",
  height = "400px",
  autoplay = false,
  controls = true,
  onError,
  onLoad,
  onPlay,
  onPause,
  fallbackMessage = "Vidéo non disponible",
  showFallbackButton = true
}: SafeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Vérifier la disponibilité de la vidéo
  const checkVideoAvailability = async (url: string): Promise<boolean> => {
    return await VideoService.isValidVideoUrl(url)
  }

  useEffect(() => {
    const validateVideo = async () => {
      if (!videoUrl) {
        setHasError(true)
        setErrorMessage('URL vidéo manquante')
        setIsLoading(false)
        return
      }

      const isValid = await checkVideoAvailability(videoUrl)
      if (!isValid) {
        setHasError(true)
        setErrorMessage('URL vidéo invalide ou non accessible')
        setIsLoading(false)
        return
      }

      setIsLoading(false)
    }

    validateVideo()
  }, [videoUrl])

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    logger.warn(`🎥 Video failed to load: ${videoUrl}`)
    setHasError(true)
    const videoType = VideoService.detectVideoType(videoUrl)
    setErrorMessage(VideoService.getErrorMessage(videoType, 'Erreur de chargement de la vidéo'))
    setIsLoading(false)
    onError?.()
  }

  const handleVideoLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleVideoPlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsPlaying(true)
    onPlay?.(e)
  }

  const handleVideoPause = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsPlaying(false)
    onPause?.(e)
  }

  const handleRetry = () => {
    setHasError(false)
    setErrorMessage('')
    setIsLoading(true)
    
    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  // Si l'URL n&apos;est pas valide, afficher directement le fallback
  if (!videoUrl || VideoService.detectVideoType(videoUrl) === 'unknown') {
    return (
      <div className={`relative bg-gray-800 rounded-lg flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">Vidéo non disponible</h3>
          <p className="text-gray-400 text-sm mb-4">URL vidéo invalide</p>
          {showFallbackButton && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={`relative bg-gray-800 rounded-lg flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">{fallbackMessage}</h3>
          <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
          {showFallbackButton && (
            <div className="space-x-3">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Recharger
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm">Chargement de la vidéo...</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay={autoplay}
        controls={controls}
        className="w-full h-full object-contain"
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onCanPlay={handleVideoLoad}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onWaiting={() => setIsLoading(true)}
        onCanPlayThrough={() => setIsLoading(false)}
      >
        Votre navigateur ne supporte pas la lecture de cette vidéo.
      </video>
      
      {/* Indicateur de format de streaming */}
      {videoUrl.includes('.m3u8') && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          HLS
        </div>
      )}
      
      {/* Titre de la vidéo */}
      {title && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm max-w-[80%] truncate">
          {title}
        </div>
      )}
    </div>
  )
}
