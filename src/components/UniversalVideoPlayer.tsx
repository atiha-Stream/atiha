'use client'

import React, { useState, useEffect } from 'react'
import { detectVideoLink, VideoLinkInfo, generateEmbedUrl, checkVideoAccessibility } from '@/lib/video-link-detector'
import YouTubePlayer from './YouTubePlayer'
import SafeVideoPlayer from './SafeVideoPlayer'
import HLSVideoPlayer from './HLSVideoPlayer'
import { HLSTranscoderService } from '@/lib/hls-transcoder-service'
import { logger } from '@/lib/logger'

interface UniversalVideoPlayerProps {
  videoUrl: string
  title?: string
  onClose?: () => void
  onError?: (error: string) => void
  onLoad?: () => void
  autoplay?: boolean
  width?: string | number
  height?: string | number
  className?: string
  posterUrl?: string
  videoType?: 'mp4' | 'youtube' | 'vimeo' | 'iframe' | 'hls' | 'auto'
  hlsConfig?: {
    enabled: boolean
    quality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p'
    preset: 'ultrafast' | 'fast' | 'medium' | 'slow'
    serverUrl?: string
  }
}

export default function UniversalVideoPlayer({
  videoUrl,
  title = "Vidéo",
  onClose,
  onError,
  onLoad,
  autoplay = false,
  width = "100%",
  height = "400px",
  className = "",
  posterUrl,
  videoType = 'auto',
  hlsConfig
}: UniversalVideoPlayerProps) {
  const [linkInfo, setLinkInfo] = useState<VideoLinkInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null)

  useEffect(() => {
    if (!videoUrl) {
      setHasError(true)
      setErrorMessage('URL vidéo manquante')
      setIsLoading(false)
      return
    }

    // Si le type est spécifié explicitement, l'utiliser
    if (videoType !== 'auto') {
      const manualLinkInfo: VideoLinkInfo = {
        type: videoType === 'hls' ? 'hls' : 
              videoType === 'mp4' ? 'direct' : videoType,
        url: videoUrl,
        id: videoUrl
      }
      setLinkInfo(manualLinkInfo)
      setIsLoading(false)
      return
    }

    // Détecter le type de lien automatiquement
    const detectedInfo = detectVideoLink(videoUrl)
    logger.debug('UniversalVideoPlayer - URL détectée', { url: videoUrl, type: detectedInfo.type })
    
    setLinkInfo(detectedInfo)

    // Vérifier l'accessibilité pour les liens directs
    if (detectedInfo.type === 'direct') {
      checkVideoAccessibility(videoUrl).then(accessible => {
        setIsAccessible(accessible)
        if (!accessible) {
          setHasError(true)
          setErrorMessage('Contenu vidéo non accessible')
          onError?.('Contenu vidéo non accessible')
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [videoUrl, videoType, onError])

  const handleError = (error: string) => {
    setHasError(true)
    setErrorMessage(error)
    onError?.(error)
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleRetry = () => {
    setHasError(false)
    setErrorMessage('')
    setIsLoading(true)
    setIsAccessible(null)
    
    // Re-vérifier l&apos;accessibilité
    if (linkInfo?.type === 'direct') {
      checkVideoAccessibility(videoUrl).then(accessible => {
        setIsAccessible(accessible)
        if (!accessible) {
          setHasError(true)
          setErrorMessage('Contenu vidéo non accessible')
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de la vidéo...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={`bg-gray-800 rounded-lg p-8 text-center ${className}`} style={{ height }}>
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xl font-semibold">Erreur de Lecture</p>
        </div>
        <p className="text-gray-400 mb-4">{errorMessage}</p>
        <div className="space-x-4">
          <button 
            onClick={handleRetry}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!linkInfo) {
    return (
      <div className={`bg-gray-800 rounded-lg p-8 text-center ${className}`} style={{ height }}>
        <p className="text-gray-400">Type de lien vidéo non reconnu</p>
      </div>
    )
  }

  // Rendu selon le type de lien
  switch (linkInfo.type) {
    case 'youtube':
      return (
        <YouTubePlayer
          videoId={linkInfo.id || videoUrl}
          title={title}
          onClose={onClose}
          autoplay={autoplay}
          width={width}
          height={height}
        />
      )

    case 'vimeo':
    case 'dailymotion':
    case 'iframe':
      // Pour les iframes/embeds : laisser la plateforme gérer ses propres contrôles
      // Pas de contrôles personnalisés pour éviter les conflits
      const embedUrl = generateEmbedUrl(linkInfo)
      if (!embedUrl) {
        handleError('URL d\'embed non disponible')
        return null
      }
      
      // Normaliser l'URL (ajouter https:// si manquant)
      let normalizedUrl = embedUrl.startsWith('http') ? embedUrl : `https://${embedUrl}`
      
      // Ajouter autoplay dans l'URL si autoplay est activé et que ce n'est pas déjà présent
      if (autoplay && !normalizedUrl.includes('autoplay')) {
        try {
          const url = new URL(normalizedUrl)
          url.searchParams.set('autoplay', '1')
          normalizedUrl = url.toString()
        } catch (e) {
          // Si l'URL n'est pas valide pour URL(), ajouter autoplay manuellement
          const separator = normalizedUrl.includes('?') ? '&' : '?'
          normalizedUrl = `${normalizedUrl}${separator}autoplay=1`
        }
      }
      
      return (
        <div className={`relative bg-black rounded-none overflow-hidden w-full h-full video-player-container ${className}`}>
          {/* Bouton fermer uniquement (optionnel) */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-30 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
              aria-label="Fermer le lecteur"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Iframe en plein écran - la plateforme gère ses propres contrôles */}
          <iframe
            src={normalizedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{
              border: 'none',
              display: 'block'
            }}
            onLoad={handleLoad}
          />
          {/* Pas de contrôles personnalisés ici - la plateforme gère tout */}
        </div>
      )

    case 'direct':
      // Vérifier si HLS est activé et l'URL est compatible
      if (hlsConfig?.enabled && HLSTranscoderService.isCompatibleUrl(videoUrl)) {
        return (
          <div className={`relative w-full h-full video-player-container ${className}`}>
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <HLSVideoPlayer
              videoUrl={videoUrl}
              posterUrl={posterUrl}
              className="w-full h-full"
              autoPlay={autoplay}
              controls={true}
              config={hlsConfig}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={handleLoad}
              onError={handleError}
              onTranscodingStatusChange={(status) => {
                logger.debug('Statut transcodage HLS', { status })
              }}
            />
          </div>
        )
      }

      // Fallback vers le lecteur vidéo standard
      return (
        <div className={`relative w-full h-full video-player-container ${className}`}>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <SafeVideoPlayer
            videoUrl={videoUrl}
            title={title}
            posterUrl={posterUrl}
            autoplay={autoplay}
            width={width}
            height={height}
            onError={() => handleError('Erreur de lecture vidéo')}
            onLoad={handleLoad}
            onPlay={(e) => {
              // Lancer automatiquement en plein écran
              if (autoplay && !document.fullscreenElement) {
                e.currentTarget.requestFullscreen().catch((error) => {
                  logger.warn('Impossible de lancer en plein écran', { error })
                })
              }
            }}
            fallbackMessage="Vidéo non disponible"
            showFallbackButton={true}
          />
        </div>
      )

    case 'hls':
      // Utiliser le lecteur HLS pour les URLs .m3u8
      return (
        <div className={`relative w-full h-full video-player-container ${className}`}>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <HLSVideoPlayer
            videoUrl={videoUrl}
            posterUrl={posterUrl}
            className="w-full h-full"
            autoPlay={autoplay}
            controls={true}
            config={hlsConfig}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={handleLoad}
            onError={handleError}
            onTranscodingStatusChange={(status) => {
              logger.debug('Statut transcodage HLS', { status })
            }}
          />
        </div>
      )

    default:
      return (
        <div className={`bg-gray-800 rounded-lg p-8 text-center ${className}`} style={{ height }}>
          <div className="text-yellow-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xl font-semibold">Format non supporté</p>
          </div>
          <p className="text-gray-400 mb-4">
            Ce format vidéo n&apos;est pas supporté.
            <br />
            Veuillez utiliser MP4, HLS, YouTube, Vimeo ou Dailymotion.
          </p>
          {onClose && (
            <button 
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      )
  }
}
