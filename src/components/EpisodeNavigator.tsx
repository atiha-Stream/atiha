'use client'

import React, { useState, useEffect } from 'react'
import { ContentService } from '@/lib/content-service'
import { Series, WatchProgress, Episode } from '@/types/content'
import { logger } from '@/lib/logger'
import { 
  PlayIcon, 
  ClockIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface EpisodeNavigatorProps {
  series: Series
  selectedEpisodeId: string | null
  onEpisodeSelect: (episodeId: string) => void
  watchProgress?: WatchProgress | null
  className?: string
}

export default function EpisodeNavigator({
  series,
  selectedEpisodeId,
  onEpisodeSelect,
  watchProgress,
  className = ''
}: EpisodeNavigatorProps) {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1])) // Saison 1 ouverte par défaut
  const [episodeProgress, setEpisodeProgress] = useState<Map<string, WatchProgress>>(new Map())

  // Charger le progrès de tous les épisodes
  useEffect(() => {
    const loadEpisodeProgress = async () => {
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

    loadEpisodeProgress()
  }, [series.id, series.seasons])

  const toggleSeason = (seasonNumber: number) => {
    const newExpanded = new Set(expandedSeasons)
    if (newExpanded.has(seasonNumber)) {
      newExpanded.delete(seasonNumber)
    } else {
      newExpanded.add(seasonNumber)
    }
    setExpandedSeasons(newExpanded)
  }

  const getEpisodeProgress = (episodeId: string): WatchProgress | null => {
    return episodeProgress.get(episodeId) || null
  }

  const isEpisodeWatched = (episodeId: string): boolean => {
    const progress = getEpisodeProgress(episodeId)
    return progress ? (progress.currentTime / progress.duration) >= 0.9 : false // 90% = regardé
  }

  const getProgressPercentage = (episodeId: string): number => {
    const progress = getEpisodeProgress(episodeId)
    return progress ? Math.round((progress.currentTime / progress.duration) * 100) : 0
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getNextEpisode = (currentEpisodeId: string): Episode | null => {
    for (const season of series.seasons) {
      const episodeIndex = season.episodes.findIndex(ep => ep.id === currentEpisodeId)
      if (episodeIndex !== -1) {
        // Épisode suivant dans la même saison
        if (episodeIndex < season.episodes.length - 1) {
          return season.episodes[episodeIndex + 1]
        }
        // Premier épisode de la saison suivante
        const nextSeasonIndex = series.seasons.findIndex(s => s.seasonNumber === season.seasonNumber + 1)
        if (nextSeasonIndex !== -1 && series.seasons[nextSeasonIndex].episodes.length > 0) {
          return series.seasons[nextSeasonIndex].episodes[0]
        }
      }
    }
    return null
  }

  const getPreviousEpisode = (currentEpisodeId: string): Episode | null => {
    for (const season of series.seasons) {
      const episodeIndex = season.episodes.findIndex(ep => ep.id === currentEpisodeId)
      if (episodeIndex !== -1) {
        // Épisode précédent dans la même saison
        if (episodeIndex > 0) {
          return season.episodes[episodeIndex - 1]
        }
        // Dernier épisode de la saison précédente
        const prevSeasonIndex = series.seasons.findIndex(s => s.seasonNumber === season.seasonNumber - 1)
        if (prevSeasonIndex !== -1 && series.seasons[prevSeasonIndex].episodes.length > 0) {
          const prevSeason = series.seasons[prevSeasonIndex]
          return prevSeason.episodes[prevSeason.episodes.length - 1]
        }
      }
    }
    return null
  }

  const currentEpisode = series.seasons
    .flatMap(s => s.episodes)
    .find(ep => ep.id === selectedEpisodeId)

  const nextEpisode = currentEpisode ? getNextEpisode(currentEpisode.id) : null
  const previousEpisode = currentEpisode ? getPreviousEpisode(currentEpisode.id) : null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation rapide */}
      {currentEpisode && (
        <div className="bg-dark-200 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Navigation</h3>
          <div className="flex items-center justify-between">
            <button
              onClick={() => previousEpisode && onEpisodeSelect(previousEpisode.id)}
              disabled={!previousEpisode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                previousEpisode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <div className="text-center">
              <p className="text-white font-medium">
                {currentEpisode.title}
              </p>
              <p className="text-gray-400 text-sm">
                Saison {series.seasons.find(s => s.episodes.some(e => e.id === currentEpisode.id))?.seasonNumber} • 
                Épisode {currentEpisode.episodeNumber}
              </p>
            </div>

            <button
              onClick={() => nextEpisode && onEpisodeSelect(nextEpisode.id)}
              disabled={!nextEpisode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                nextEpisode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Suivant</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Liste des épisodes */}
      <div>
        <h3 className="text-white font-semibold mb-4">Épisodes</h3>
        <div className="space-y-4">
          {series.seasons.map((season) => (
            <div key={season.id} className="bg-dark-200 rounded-lg overflow-hidden">
              {/* En-tête de saison */}
              <button
                onClick={() => toggleSeason(season.seasonNumber)}
                className="w-full flex items-center justify-between p-4 bg-dark-300 hover:bg-dark-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{season.seasonNumber}</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">{season.title}</h4>
                    <p className="text-gray-400 text-sm">{season.episodes.length} épisodes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">
                    {season.episodes.filter(ep => isEpisodeWatched(ep.id)).length} / {season.episodes.length} regardés
                  </span>
                  {expandedSeasons.has(season.seasonNumber) ? (
                    <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Liste des épisodes */}
              {expandedSeasons.has(season.seasonNumber) && (
                <div className="divide-y divide-gray-700">
                  {season.episodes.map((episode) => {
                    const isSelected = selectedEpisodeId === episode.id
                    const isWatched = isEpisodeWatched(episode.id)
                    const progress = getProgressPercentage(episode.id)
                    const episodeProgress = getEpisodeProgress(episode.id)

                    return (
                      <button
                        key={episode.id}
                        onClick={() => onEpisodeSelect(episode.id)}
                        className={`w-full text-left p-2 hover:bg-dark-100 transition-colors ${
                          isSelected ? 'bg-primary-500/10 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Miniature et statut */}
                          <div className="relative w-16 h-12 bg-gray-700 rounded flex-shrink-0">
                            {episode.thumbnailUrl ? (
                              <img
                                src={episode.thumbnailUrl}
                                alt={episode.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlayIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Indicateur de statut */}
                            <div className="absolute -top-1 -right-1">
                              {isWatched ? (
                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                              ) : episodeProgress && episodeProgress.currentTime > 0 ? (
                                <EyeIcon className="w-4 h-4 text-yellow-400" />
                              ) : (
                                <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>

                          {/* Informations de l'épisode */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h5 className="text-white font-medium">
                                Épisode {episode.episodeNumber}
                              </h5>
                              {isWatched && (
                                <span className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded">
                                  Regardé
                                </span>
                              )}
                            </div>
                            
                            {/* Barre de progression */}
                            {episodeProgress && episodeProgress.currentTime > 0 && (
                              <div className="space-y-1 mt-1">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Progression</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-700 rounded-full">
                                  <div 
                                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


