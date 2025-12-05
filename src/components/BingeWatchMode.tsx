'use client'

import React, { useState, useEffect } from 'react'
import { Series, Episode, WatchProgress } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { 
  PlayIcon, 
  TrophyIcon, 
  FireIcon, 
  EyeIcon, 
  StopIcon, 
  ClockIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'
interface BingeWatchModeProps {
  series: Series
  currentEpisodeId: string | null
  onEpisodeSelect: (episodeId: string) => void
  className?: string
}

interface BingeSession {
  startTime: Date
  episodesWatched: number
  totalWatchTime: number // en minutes
  currentStreak: number
  longestStreak: number
}

export default function BingeWatchMode({
  series,
  currentEpisodeId,
  onEpisodeSelect,
  className = ''
}: BingeWatchModeProps) {
  const [isBingeMode, setIsBingeMode] = useState(false)
  const [bingeSession, setBingeSession] = useState<BingeSession | null>(null)
  const [episodeProgress, setEpisodeProgress] = useState<Map<string, WatchProgress>>(new Map())
  const [showStats, setShowStats] = useState(false)

  // Charger les statistiques de binge-watching
  useEffect(() => {
    const loadBingeStats = async () => {
      const sessionKey = `binge_session_${series.id}`
      const savedSession = localStorage.getItem(sessionKey)
      
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession)
          setBingeSession({
            ...session,
            startTime: new Date(session.startTime)
          })
        } catch (error) {
          logger.error('Error loading binge session', error as Error)
        }
      }

      // Charger le progrès de tous les épisodes
      const progressMap = new Map<string, WatchProgress>()
      for (const season of series.seasons) {
        for (const episode of season.episodes) {
          try {
            const progress = await ContentService.getWatchProgress(series.id, episode.id)
            if (progress) {
              progressMap.set(episode.id, progress)
            }
          } catch (error) {
            logger.error(`Error loading progress for episode ${episode.id}`, error as Error)
          }
        }
      }
      setEpisodeProgress(progressMap)
    }

    loadBingeStats()
  }, [series.id, series.seasons])

  const startBingeMode = () => {
    const newSession: BingeSession = {
      startTime: new Date(),
      episodesWatched: 0,
      totalWatchTime: 0,
      currentStreak: 0,
      longestStreak: 0
    }
    
    setBingeSession(newSession)
    setIsBingeMode(true)
    
    // Sauvegarder la session
    const sessionKey = `binge_session_${series.id}`
    localStorage.setItem(sessionKey, JSON.stringify(newSession))
  }

  const stopBingeMode = () => {
    if (bingeSession) {
      // Sauvegarder les statistiques finales
      const sessionKey = `binge_session_${series.id}`
      const statsKey = `binge_stats_${series.id}`
      
      const finalSession = {
        ...bingeSession,
        endTime: new Date()
      }
      
      localStorage.setItem(sessionKey, JSON.stringify(finalSession))
      
      // Mettre à jour les statistiques globales
      const existingStats = localStorage.getItem(statsKey)
      const stats = existingStats ? JSON.parse(existingStats) : {
        totalSessions: 0,
        totalEpisodesWatched: 0,
        totalWatchTime: 0,
        longestStreak: 0
      }
      
      stats.totalSessions += 1
      stats.totalEpisodesWatched += bingeSession.episodesWatched
      stats.totalWatchTime += bingeSession.totalWatchTime
      stats.longestStreak = Math.max(stats.longestStreak, bingeSession.longestStreak)
      
      localStorage.setItem(statsKey, JSON.stringify(stats))
    }
    
    setIsBingeMode(false)
    setBingeSession(null)
  }

  const getWatchedEpisodes = (): Episode[] => {
    const watchedEpisodes: Episode[] = []
    
    for (const season of series.seasons) {
      for (const episode of season.episodes) {
        const progress = episodeProgress.get(episode.id)
        if (progress && (progress.currentTime / progress.duration) >= 0.9) {
          watchedEpisodes.push(episode)
        }
      }
    }
    
    return watchedEpisodes
  }

  const getNextUnwatchedEpisode = (): Episode | null => {
    const watchedEpisodes = getWatchedEpisodes()
    const watchedIds = new Set(watchedEpisodes.map(ep => ep.id))
    
    for (const season of series.seasons) {
      for (const episode of season.episodes) {
        if (!watchedIds.has(episode.id)) {
          return episode
        }
      }
    }
    
    return null
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getSessionDuration = (): number => {
    if (!bingeSession) return 0
    return Math.floor((new Date().getTime() - bingeSession.startTime.getTime()) / (1000 * 60))
  }

  const getBingeLevel = (): { level: string; icon: React.ReactNode; color: string } => {
    if (!bingeSession) return { level: 'Débutant', icon: <PlayIcon className="w-4 h-4" />, color: 'text-gray-400' }
    
    const episodes = bingeSession.episodesWatched
    
    if (episodes >= 10) return { level: 'Binge Master', icon: <TrophyIcon className="w-4 h-4" />, color: 'text-yellow-400' }
    if (episodes >= 6) return { level: 'Binge Expert', icon: <FireIcon className="w-4 h-4" />, color: 'text-orange-400' }
    if (episodes >= 3) return { level: 'Binge Enthousiaste', icon: <EyeIcon className="w-4 h-4" />, color: 'text-blue-400' }
    
    return { level: 'Binge Débutant', icon: <PlayIcon className="w-4 h-4" />, color: 'text-green-400' }
  }

  const bingeLevel = getBingeLevel()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Contrôles de binge-watching */}
      <div className="bg-dark-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Mode Binge-Watching</h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${bingeLevel.color}`}>
              {bingeLevel.icon}
              <span className="ml-1">{bingeLevel.level}</span>
            </span>
          </div>
        </div>

        {!isBingeMode ? (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Activez le mode binge-watching pour suivre votre session de visionnage et débloquer des achievements !
            </p>
            <button
              onClick={startBingeMode}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Commencer une session binge</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Statistiques de session */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-300 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <ClockIcon className="w-4 h-4 text-primary-400" />
                  <span className="text-white text-sm font-medium">Durée de session</span>
                </div>
                <p className="text-primary-400 text-lg font-bold">
                  {formatDuration(getSessionDuration())}
                </p>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <EyeIcon className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm font-medium">Épisodes regardés</span>
                </div>
                <p className="text-green-400 text-lg font-bold">
                  {bingeSession?.episodesWatched || 0}
                </p>
              </div>
            </div>

            {/* Prochain épisode */}
            {getNextUnwatchedEpisode() && (
              <div className="bg-dark-300 rounded-lg p-3">
                <p className="text-gray-400 text-sm mb-2">Prochain épisode à regarder :</p>
                <button
                  onClick={() => onEpisodeSelect(getNextUnwatchedEpisode()!.id)}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  {getNextUnwatchedEpisode()!.title}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={stopBingeMode}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <StopIcon className="w-4 h-4" />
                <span>Terminer la session</span>
              </button>
              
              <button
                onClick={() => setShowStats(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <TrophyIcon className="w-4 h-4" />
                <span>Statistiques</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal des statistiques */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Statistiques de binge-watching</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-300 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Sessions totales</p>
                  <p className="text-white text-lg font-bold">0</p>
                </div>
                <div className="bg-dark-300 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Épisodes regardés</p>
                  <p className="text-white text-lg font-bold">0</p>
                </div>
                <div className="bg-dark-300 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Temps total</p>
                  <p className="text-white text-lg font-bold">0h 0m</p>
                </div>
                <div className="bg-dark-300 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Plus longue série</p>
                  <p className="text-white text-lg font-bold">0 épisodes</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-6">
              <button
                onClick={() => setShowStats(false)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
