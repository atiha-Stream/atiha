'use client'

import React, { useState } from 'react'
import { Series, Episode } from '@/types/content'
import { useRouter } from 'next/navigation'
import { 
  PlayIcon, 
  ClockIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  StarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface SeriesPreviewProps {
  series: Series
  onEpisodeSelect?: (episode: Episode) => void
  className?: string
}

export default function SeriesPreview({ series, onEpisodeSelect, className = '' }: SeriesPreviewProps) {
  const router = useRouter()
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1])) // Saison 1 ouverte par défaut
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)

  const toggleSeason = (seasonNumber: number) => {
    setExpandedSeasons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(seasonNumber)) {
        newSet.delete(seasonNumber)
      } else {
        newSet.add(seasonNumber)
      }
      return newSet
    })
  }

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode)
    onEpisodeSelect?.(episode)
  }

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête de la série */}
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="flex items-start space-x-6">
          {/* Affiche */}
          <div className="w-48 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
            {series.posterUrl ? (
              <img
                src={series.posterUrl}
                alt={series.title}
                className="w-full h-auto object-cover"
                style={{ aspectRatio: 'auto' }}
              />
            ) : (
              <div className="w-full h-72 flex items-center justify-center">
                <PlayIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1">
            <button
              onClick={() => router.push(`/watch/${series.id}`)}
              className="text-3xl font-bold text-white mb-2 hover:text-primary-400 transition-colors text-left"
            >
              {series.title}
            </button>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                <StarIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">{series.rating}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{series.year}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <PlayIcon className="w-4 h-4" />
                <span>{series.seasons.length} saison{series.seasons.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>{getTotalEpisodes()} épisode{getTotalEpisodes() > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {series.genre.map((genre, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              {series.description}
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Réalisateur : </span>
                <span className="text-white">{series.director}</span>
              </div>
              <div>
                <span className="text-gray-400">Acteurs : </span>
                <span className="text-white">{series.cast.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des saisons et épisodes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Épisodes</h2>
        
        {series.seasons.map((season) => (
          <div key={season.id} className="bg-dark-200 rounded-lg border border-gray-700">
            {/* En-tête de saison */}
            <button
              onClick={() => toggleSeason(season.seasonNumber)}
              className="w-full p-4 text-left hover:bg-dark-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {expandedSeasons.has(season.seasonNumber) ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <h3 className="text-white font-semibold text-lg">{season.title}</h3>
                    <p className="text-gray-400 text-sm">{season.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">
                    {season.episodes.length} épisode{season.episodes.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDuration(season.episodes.reduce((total, ep) => total + ep.duration, 0))}
                  </p>
                </div>
              </div>
            </button>

            {/* Liste des épisodes */}
            {expandedSeasons.has(season.seasonNumber) && (
              <div className="border-t border-gray-700">
                {season.episodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => handleEpisodeClick(episode)}
                    className={`w-full p-4 text-left hover:bg-dark-100 transition-colors border-b border-gray-700 last:border-b-0 ${
                      selectedEpisode?.id === episode.id ? 'bg-primary-500/10 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Miniature */}
                      <div className="w-20 h-12 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                        {episode.thumbnailUrl ? (
                          <img
                            src={episode.thumbnailUrl}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informations de l'épisode */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">
                            Épisode {episode.episodeNumber}: {episode.title}
                          </h4>
                          {selectedEpisode?.id === episode.id && (
                            <span className="bg-primary-500 text-white px-2 py-1 rounded text-xs">
                              Sélectionné
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {episode.description}
                        </p>
                      </div>

                      {/* Durée */}
                      <div className="flex items-center space-x-1 text-gray-400 text-sm flex-shrink-0">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDuration(episode.duration)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Statistiques */}
      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Statistiques de la série</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">{series.seasons.length}</p>
            <p className="text-gray-400 text-sm">Saisons</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{getTotalEpisodes()}</p>
            <p className="text-gray-400 text-sm">Épisodes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{formatDuration(getTotalDuration())}</p>
            <p className="text-gray-400 text-sm">Durée totale</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{series.rating}</p>
            <p className="text-gray-400 text-sm">Note</p>
          </div>
        </div>
      </div>
    </div>
  )
}
