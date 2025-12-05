'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PhotoIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { VideoService } from '@/lib/video-service'
import { ImageService } from '@/lib/image-service'
import SafeImage from './SafeImage'
import SafeVideoPlayer from './SafeVideoPlayer'
import UniversalVideoPlayer from './UniversalVideoPlayer'

interface UniversalMediaPlayerProps {
  mediaUrl: string
  title?: string
  posterUrl?: string
  className?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  controls?: boolean
  onError?: (error: string) => void
  onLoad?: () => void
  onPlay?: () => void
  onPause?: () => void
  showTitle?: boolean
  showControls?: boolean
  allowFullscreen?: boolean
}

type MediaType = 'image' | 'video' | 'stream' | 'youtube' | 'vimeo' | 'dailymotion' | 'unknown'

export default function UniversalMediaPlayer({
  mediaUrl,
  title = "Média",
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
  showTitle = true,
  showControls = true,
  allowFullscreen = true
}: UniversalMediaPlayerProps) {
  const [mediaType, setMediaType] = useState<MediaType>('unknown')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Détecter le type de média
  const detectMediaType = (url: string): MediaType => {
    if (!url || typeof url !== 'string') return 'unknown'

    const lowerUrl = url.toLowerCase()

    // Images
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || 
        lowerUrl.includes('.png') || lowerUrl.includes('.gif') || 
        lowerUrl.includes('.webp') || lowerUrl.includes('.avif') || 
        lowerUrl.includes('.svg') || lowerUrl.includes('.bmp')) {
      return 'image'
    }

    // Vidéos directes
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || 
        lowerUrl.includes('.ogg') || lowerUrl.includes('.avi') || 
        lowerUrl.includes('.mov') || lowerUrl.includes('.mkv') || 
        lowerUrl.includes('.flv') || lowerUrl.includes('.wmv')) {
      return 'video'
    }

    // Streams
    if (lowerUrl.includes('.m3u8')) {
      return 'stream'
    }

    // Plateformes
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'youtube'
    }
    
    if (lowerUrl.includes('vimeo.com')) {
      return 'vimeo'
    }
    
    if (lowerUrl.includes('dailymotion.com')) {
      return 'dailymotion'
    }

    return 'unknown'
  }

  useEffect(() => {
    const type = detectMediaType(mediaUrl)
    setMediaType(type)
    setIsLoading(false)
    
    if (type === 'unknown') {
      setHasError(true)
      setErrorMessage('Format de média non supporté')
      onError?.('Format de média non supporté')
    }
  }, [mediaUrl, onError])

  const handleError = (error: string) => {
    setHasError(true)
    setErrorMessage(error)
    setIsLoading(false)
    onError?.(error)
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handlePlay = () => {
    setIsPlaying(true)
    onPlay?.()
  }

  const handlePause = () => {
    setIsPlaying(false)
    onPause?.()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  // Rendu des contrôles
  const renderControls = () => {
    if (!showControls || mediaType === 'image') return null

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-5 h-5" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
              )}
            </button>

            {/* Volume Slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Fullscreen */}
            {allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-5 h-5" />
                ) : (
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Rendu du titre
  const renderTitle = () => {
    if (!showTitle || !title) return null

    return (
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm max-w-[80%] truncate">
        {title}
      </div>
    )
  }

  // Rendu de l'indicateur de type
  const renderTypeIndicator = () => {
    const typeLabels = {
      image: 'IMAGE',
      video: 'VIDÉO',
      stream: 'HLS',
      youtube: 'YOUTUBE',
      vimeo: 'VIMEO',
      dailymotion: 'DAILYMOTION'
    }

    const typeColors = {
      image: 'bg-green-500',
      video: 'bg-blue-500',
      stream: 'bg-purple-500',
      youtube: 'bg-red-500',
      vimeo: 'bg-blue-600',
      dailymotion: 'bg-orange-500'
    }

    if (mediaType === 'unknown') return null

    return (
      <div className={`absolute top-2 right-2 ${typeColors[mediaType]} text-white px-2 py-1 rounded text-xs font-semibold`}>
        {typeLabels[mediaType]}
      </div>
    )
  }

  // Rendu du loading
  const renderLoading = () => {
    if (!isLoading) return null

    return (
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Chargement du média...</p>
        </div>
      </div>
    )
  }

  // Rendu de l'erreur
  const renderError = () => {
    if (!hasError) return null

    return (
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">Média non disponible</h3>
          <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Rendu du contenu selon le type
  const renderContent = () => {
    if (hasError) return null

    switch (mediaType) {
      case 'image':
        return (
          <SafeImage
            src={mediaUrl}
            alt={title}
            fill
            className="object-contain"
            onError={() => handleError('Erreur de chargement de l\'image')}
            onLoad={handleLoad}
            fallbackSrc="/placeholder-image.jpg"
          />
        )

      case 'video':
        return (
          <SafeVideoPlayer
            videoUrl={mediaUrl}
            title={title}
            posterUrl={posterUrl}
            autoplay={autoplay}
            controls={false} // On gère les contrôles nous-mêmes
            width="100%"
            height="100%"
            onError={() => handleError('Erreur de lecture vidéo')}
            onLoad={handleLoad}
            onPlay={handlePlay}
            onPause={handlePause}
            fallbackMessage="Vidéo non disponible"
            showFallbackButton={false}
          />
        )

      case 'stream':
      case 'youtube':
      case 'vimeo':
      case 'dailymotion':
        return (
          <UniversalVideoPlayer
            videoUrl={mediaUrl}
            title={title}
            posterUrl={posterUrl}
            autoplay={autoplay}
            width="100%"
            height="100%"
            onError={handleError}
            onLoad={handleLoad}
          />
        )

      default:
        return null
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`} 
      style={{ width, height }}
    >
      {renderLoading()}
      {renderError()}
      {renderContent()}
      {renderTitle()}
      {renderTypeIndicator()}
      {renderControls()}
    </div>
  )
}
