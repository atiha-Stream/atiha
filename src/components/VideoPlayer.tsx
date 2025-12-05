'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { VideoPlayerState, WatchProgress } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { ErrorLogger } from '@/lib/error-logger'
import { AnalyticsService } from '@/lib/analytics-service'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { useAuth } from '@/lib/auth-context'
import { logger } from '@/lib/logger'

interface VideoPlayerProps {
  videoUrl: string
  contentId: string
  episodeId?: string
  title: string
  contentType?: 'movie' | 'series'
  onClose: () => void
  onProgressUpdate?: (progress: WatchProgress) => void
  posterUrl?: string
}

const VideoPlayer = ({
  videoUrl,
  contentId,
  episodeId,
  title,
  contentType = 'movie',
  onClose,
  onProgressUpdate,
  posterUrl
}: VideoPlayerProps) => {
  const { user } = useAuth()
  const { saveProgress: saveWatchProgress, getProgress } = useWatchHistory(user?.id || null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isFullscreen: false,
    showControls: true,
    buffering: false
  })

  const [savedProgress, setSavedProgress] = useState<WatchProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastSavedTimeRef = useRef<number>(0) // Temps de visionnage déjà sauvegardé (en secondes)
  const watchStartTimeRef = useRef<number | null>(null) // Temps de début de visionnage de la session actuelle

  // Charger le progrès sauvegardé depuis l'API
  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        // Utiliser le hook pour récupérer la progression
        const progressItem = getProgress(contentId)
        if (progressItem && videoRef.current) {
          const progress: WatchProgress = {
            contentId,
            episodeId,
            currentTime: progressItem.progress,
            duration: progressItem.duration || 0,
            completed: progressItem.completed,
            lastWatched: new Date(progressItem.watchedAt)
          }
          setSavedProgress(progress)
          videoRef.current.currentTime = progressItem.progress
          lastSavedTimeRef.current = progressItem.progress
        }
      } else {
        // Fallback vers ContentService si pas d'utilisateur
        const progress = await ContentService.getWatchProgress(contentId, episodeId)
        setSavedProgress(progress)
        
        if (progress && videoRef.current) {
          videoRef.current.currentTime = progress.currentTime
          lastSavedTimeRef.current = progress.currentTime
        }
      }
    }
    
    loadProgress()
  }, [contentId, episodeId, user, getProgress])

  // Gestion des événements vidéo
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setPlayerState(prev => ({
        ...prev,
        duration: videoRef.current?.duration || 0,
        buffering: false
      }))
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlayerState(prev => ({
        ...prev,
        currentTime: videoRef.current?.currentTime || 0
      }))
    }
  }

  const handlePlay = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: true, buffering: false }))
    
    // Enregistrer le temps de début de visionnage (ou reprendre après une pause)
    if (videoRef.current) {
      // Toujours réinitialiser le temps de début quand on lance/reprend la lecture
      // Cela permet de tracker correctement chaque période de visionnage
      watchStartTimeRef.current = videoRef.current.currentTime
    }
    
    // Lancer automatiquement en plein écran
    if (videoRef.current && !document.fullscreenElement) {
      videoRef.current.requestFullscreen().then(() => {
        setPlayerState(prev => ({ ...prev, isFullscreen: true }))
      }).catch((error) => {
        logger.warn('Impossible de lancer en plein écran', { error })
      })
    }
  }

  const handlePause = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: false }))
    
    // Enregistrer le temps de visionnage accumulé lors de la pause
    if (videoRef.current && watchStartTimeRef.current !== null) {
      recordWatchTime()
    }
  }

  const handleWaiting = () => {
    setPlayerState(prev => ({ ...prev, buffering: true }))
  }

  const handleCanPlay = () => {
    setPlayerState(prev => ({ ...prev, buffering: false }))
  }

  // Contrôles du lecteur
  const togglePlay = () => {
    if (videoRef.current) {
      if (playerState.isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      const newTime = percentage * playerState.duration
      
      videoRef.current.currentTime = newTime
      setPlayerState(prev => ({ ...prev, currentTime: newTime }))
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setPlayerState(prev => ({ 
        ...prev, 
        volume: newVolume,
        isMuted: newVolume === 0
      }))
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (playerState.isMuted) {
        videoRef.current.volume = playerState.volume
        setPlayerState(prev => ({ ...prev, isMuted: false }))
      } else {
        videoRef.current.volume = 0
        setPlayerState(prev => ({ ...prev, isMuted: true }))
      }
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlayerState(prev => ({ ...prev, playbackRate: rate }))
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setPlayerState(prev => ({ ...prev, isFullscreen: true }))
    } else {
      document.exitFullscreen()
      setPlayerState(prev => ({ ...prev, isFullscreen: false }))
    }
  }

  // Fonction pour enregistrer le temps de visionnage accumulé
  const recordWatchTime = useCallback(() => {
    if (videoRef.current && watchStartTimeRef.current !== null) {
      const currentTime = videoRef.current.currentTime
      const watchTimeSeconds = currentTime - watchStartTimeRef.current
      
      // Enregistrer seulement si au moins 5 secondes ont été visionnées
      if (watchTimeSeconds >= 5) {
        const watchTimeMinutes = watchTimeSeconds / 60
        AnalyticsService.updateContentWatchTime(contentId, watchTimeMinutes)
        // Réinitialiser le temps de début pour la prochaine période de visionnage
        watchStartTimeRef.current = currentTime
      }
    }
  }, [contentId])

  // Sauvegarder le progrès
  const saveProgress = useCallback(async () => {
    if (videoRef.current && playerState.duration > 0) {
      // Enregistrer le temps de visionnage accumulé toutes les 10 secondes si la vidéo est en cours de lecture
      if (playerState.isPlaying && watchStartTimeRef.current !== null) {
        recordWatchTime()
      }

      const progress: WatchProgress = {
        contentId,
        episodeId,
        currentTime: playerState.currentTime,
        duration: playerState.duration,
        completed: playerState.currentTime / playerState.duration > 0.9,
        lastWatched: new Date()
      }

      // Utiliser le hook pour sauvegarder la progression si l'utilisateur est connecté
      if (user) {
        await saveWatchProgress(
          contentId,
          contentType,
          Math.floor(playerState.currentTime),
          Math.floor(playerState.duration),
          progress.completed
        )
      } else {
        // Fallback vers ContentService si pas d'utilisateur
        await ContentService.saveWatchProgress(progress)
      }
      
      await ContentService.addToRecentlyWatched(contentId)
      
      if (onProgressUpdate) {
        onProgressUpdate(progress)
      }
    }
  }, [contentId, contentType, episodeId, playerState.currentTime, playerState.duration, playerState.isPlaying, onProgressUpdate, recordWatchTime, user, saveWatchProgress])

  // Sauvegarder le progrès toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(saveProgress, 10000)
    return () => clearInterval(interval)
  }, [saveProgress])

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              playerState.duration,
              videoRef.current.currentTime + 10
            )
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [playerState.duration])

  // Formatage du temps
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calcul du pourcentage de progression
  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Vidéo */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onEnded={() => {
            // Enregistrer le temps de visionnage final quand la vidéo se termine
            recordWatchTime()
            handlePause()
          }}
          onError={(e) => {
            const errorMessage = 'Erreur lors du chargement de la vidéo'
            ErrorLogger.log(
              new Error(errorMessage),
              'high',
              'video',
              {
                videoUrl,
                contentId,
                episodeId,
                userAgent: navigator.userAgent,
                error: e.currentTarget.error
              }
            )
          }}
          onClick={togglePlay}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Buffering Indicator */}
        {playerState.buffering && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white">Chargement...</span>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Barre de progression */}
          <div 
            ref={progressRef}
            className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-4"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Contrôles principaux */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {playerState.isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Temps */}
              <span className="text-white text-sm">
                {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
              </span>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {playerState.isMuted || playerState.volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={playerState.volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Vitesse de lecture */}
              <select
                value={playerState.playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black/50 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Plein écran */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>

              {/* Fermer */}
              <button
                onClick={() => {
                  // Enregistrer le temps de visionnage avant de fermer
                  recordWatchTime()
                  onClose()
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Titre */}
        <div className="absolute top-4 left-4">
          <h1 className="text-white text-xl font-semibold bg-black/50 px-3 py-1 rounded">
            {title}
          </h1>
        </div>
      </div>
    </div>
  )
}

// Optimiser le composant avec React.memo
export default React.memo(VideoPlayer)
