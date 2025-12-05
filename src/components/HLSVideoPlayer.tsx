'use client'

import React, { useRef, useEffect, useState } from 'react'
import { HLSTranscoderService, HLSStreamingConfig } from '@/lib/hls-transcoder-service'
import { logger } from '@/lib/logger'

interface HLSVideoPlayerProps {
  videoUrl: string
  posterUrl?: string
  className?: string
  autoPlay?: boolean
  controls?: boolean
  config?: Partial<HLSStreamingConfig>
  onLoadStart?: () => void
  onLoadEnd?: () => void
  onError?: (error: string) => void
  onTranscodingStatusChange?: (status: 'pending' | 'transcoding' | 'completed' | 'failed') => void
}

export const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  className = '',
  autoPlay = false,
  controls = true,
  config = {},
  onLoadStart,
  onLoadEnd,
  onError,
  onTranscodingStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transcodingStatus, setTranscodingStatus] = useState<'pending' | 'transcoding' | 'completed' | 'failed'>('pending')
  const [hlsUrl, setHlsUrl] = useState<string | null>(null)

  // Charger HLS.js dynamiquement
  useEffect(() => {
    const loadHLS = async () => {
      try {
        // Vérifier si HLS.js est déjà chargé
        if (typeof window !== 'undefined' && (window as any).Hls) {
          return (window as any).Hls
        }

        // Charger HLS.js depuis CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
        script.async = true
        
        return new Promise((resolve, reject) => {
          script.onload = () => resolve((window as any).Hls)
          script.onerror = reject
          document.head.appendChild(script)
        })
      } catch (error) {
        logger.error('Erreur lors du chargement de HLS.js', error as Error)
        throw error
      }
    }

    const initializePlayer = async () => {
      try {
        setIsLoading(true)
        setError(null)
        onLoadStart?.()

        // Vérifier si l'URL est compatible avec le transcodage HLS
        if (!HLSTranscoderService.isCompatibleUrl(videoUrl)) {
          throw new Error('URL non compatible avec le transcodage HLS')
        }

        // Démarrer le transcodage
        const transcodeResult = await HLSTranscoderService.startTranscoding(videoUrl, config)
        
        if (!transcodeResult.success) {
          throw new Error(transcodeResult.error || 'Erreur lors du démarrage du transcodage')
        }

        setHlsUrl(transcodeResult.masterPlaylistUrl || '')
        setTranscodingStatus('transcoding')
        onTranscodingStatusChange?.('transcoding')

        // Charger HLS.js
        const Hls = await loadHLS() as any

        if (!videoRef.current) return

        const video = videoRef.current

        if (Hls.isSupported()) {
          // Utiliser HLS.js natif
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          })

          hlsRef.current = hls

          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            logger.debug('HLS: Media attached')
          })

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            logger.debug('HLS: Manifest parsed')
            setIsLoading(false)
            setTranscodingStatus('completed')
            onTranscodingStatusChange?.('completed')
            onLoadEnd?.()
          })

          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            logger.error('HLS Error', new Error(String(data)), { event, data })
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError('Erreur réseau lors du chargement de la vidéo')
                  setTranscodingStatus('failed')
                  onTranscodingStatusChange?.('failed')
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError('Erreur de décodage vidéo')
                  setTranscodingStatus('failed')
                  onTranscodingStatusChange?.('failed')
                  break
                default:
                  setError('Erreur de lecture vidéo')
                  setTranscodingStatus('failed')
                  onTranscodingStatusChange?.('failed')
                  break
              }
              onError?.(error || 'Erreur de lecture vidéo')
            }
          })

          hls.loadSource(transcodeResult.masterPlaylistUrl || '')
          hls.attachMedia(video)

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Support natif HLS (Safari)
          video.src = transcodeResult.masterPlaylistUrl || ''
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false)
            setTranscodingStatus('completed')
            onTranscodingStatusChange?.('completed')
            onLoadEnd?.()
          })
        } else {
          throw new Error('HLS non supporté par ce navigateur')
        }

        // Gestion des erreurs vidéo
        video.addEventListener('error', (e) => {
          const error = video.error
          if (error) {
            let errorMessage = 'Erreur de lecture vidéo'
            switch (error.code) {
              case 1:
                errorMessage = 'Erreur d\'abandon de la lecture'
                break
              case 2:
                errorMessage = 'Erreur réseau'
                break
              case 3:
                errorMessage = 'Erreur de décodage'
                break
              case 4:
                errorMessage = 'Format non supporté'
                break
            }
            setError(errorMessage)
            setTranscodingStatus('failed')
            onTranscodingStatusChange?.('failed')
            onError?.(errorMessage)
          }
        })

        // Auto-play si demandé
        if (autoPlay) {
          video.play().catch(console.error)
        }

      } catch (error) {
        console.error('Erreur lors de l\'initialisation du lecteur HLS:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        setError(errorMessage)
        setTranscodingStatus('failed')
        onTranscodingStatusChange?.('failed')
        onError?.(errorMessage)
        setIsLoading(false)
      }
    }

    initializePlayer()

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [videoUrl, config, autoPlay, onLoadStart, onLoadEnd, onError, onTranscodingStatusChange])

  // Vérifier le statut du transcodage périodiquement
  useEffect(() => {
    if (transcodingStatus === 'transcoding') {
      const checkStatus = async () => {
        const status = await HLSTranscoderService.getTranscodingStatus(videoUrl, config)
        if (status.success && status.transcodingStatus === 'completed') {
          setTranscodingStatus('completed')
          onTranscodingStatusChange?.('completed')
        }
      }

      const interval = setInterval(checkStatus, 2000) // Vérifier toutes les 2 secondes
      return () => clearInterval(interval)
    }
  }, [transcodingStatus, videoUrl, config, onTranscodingStatusChange])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-white text-lg font-semibold mb-2">Erreur de lecture</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-sm">
              {transcodingStatus === 'pending' && 'Démarrage du transcodage...'}
              {transcodingStatus === 'transcoding' && 'Transcodage en cours...'}
              {transcodingStatus === 'completed' && 'Chargement de la vidéo...'}
            </p>
          </div>
        </div>
      )}

      {/* Lecteur vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full rounded-lg"
        poster={posterUrl}
        controls={controls}
        playsInline
        preload="metadata"
      >
        <p className="text-white p-4">
          Votre navigateur ne supporte pas la lecture de vidéos HLS.
        </p>
      </video>

      {/* Indicateur de statut du transcodage */}
      {transcodingStatus === 'transcoding' && !isLoading && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
          🔄 Transcodage en cours
        </div>
      )}
    </div>
  )
}

export default HLSVideoPlayer
