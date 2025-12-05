'use client'

import React, { useState } from 'react'
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  TrashIcon, 
  PlayIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'
interface Episode {
  episodeNumber: number
  title: string
  description: string
  duration: number
  videoUrl: string
  thumbnailUrl?: string
}

interface Season {
  seasonNumber: number
  title: string
  description: string
  episodes: Episode[]
}

interface SeriesManagerProps {
  seasons: Season[]
  onSeasonsChange: (seasons: Season[]) => void
}

export default function SeriesManager({ seasons, onSeasonsChange }: SeriesManagerProps) {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1]))
  const [editingSeason, setEditingSeason] = useState<number | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<{ seasonNumber: number; episodeNumber: number } | null>(null)

  const addSeason = () => {
    const newSeasonNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.seasonNumber)) + 1 : 1
    const newSeason: Season = {
      seasonNumber: newSeasonNumber,
      title: `Saison ${newSeasonNumber}`,
      description: '',
      episodes: []
    }
    
    onSeasonsChange([...seasons, newSeason])
    setExpandedSeasons(prev => new Set([...Array.from(prev), newSeasonNumber]))
  }

  const updateSeason = (seasonNumber: number, updates: Partial<Season>) => {
    onSeasonsChange(seasons.map(season => 
      season.seasonNumber === seasonNumber 
        ? { ...season, ...updates }
        : season
    ))
  }

  const removeSeason = (seasonNumber: number) => {
    onSeasonsChange(seasons.filter(season => season.seasonNumber !== seasonNumber))
    setExpandedSeasons(prev => {
      const newSet = new Set(prev)
      newSet.delete(seasonNumber)
      return newSet
    })
  }

  const addEpisode = (seasonNumber: number) => {
    const season = seasons.find(s => s.seasonNumber === seasonNumber)
    if (!season) return

    const newEpisodeNumber = season.episodes.length > 0 
      ? Math.max(...season.episodes.map(e => e.episodeNumber)) + 1 
      : 1

    const newEpisode: Episode = {
      episodeNumber: newEpisodeNumber,
      title: `Épisode ${newEpisodeNumber}`,
      description: '',
      duration: 45,
      videoUrl: '',
      thumbnailUrl: ''
    }

    updateSeason(seasonNumber, {
      episodes: [...season.episodes, newEpisode]
    })
  }

  const updateEpisode = (seasonNumber: number, episodeNumber: number, updates: Partial<Episode>) => {
    const season = seasons.find(s => s.seasonNumber === seasonNumber)
    if (!season) return

    const updatedEpisodes = season.episodes.map(episode =>
      episode.episodeNumber === episodeNumber
        ? { ...episode, ...updates }
        : episode
    )

    updateSeason(seasonNumber, { episodes: updatedEpisodes })
  }

  const removeEpisode = (seasonNumber: number, episodeNumber: number) => {
    const season = seasons.find(s => s.seasonNumber === seasonNumber)
    if (!season) return

    const updatedEpisodes = season.episodes.filter(episode => episode.episodeNumber !== episodeNumber)
    updateSeason(seasonNumber, { episodes: updatedEpisodes })
  }

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

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Gestion des saisons et épisodes</h3>
          <p className="text-gray-400 text-sm">
            {seasons.length} saison{seasons.length > 1 ? 's' : ''} • {seasons.reduce((total, season) => total + season.episodes.length, 0)} épisode{seasons.reduce((total, season) => total + season.episodes.length, 0) > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={addSeason}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Ajouter une saison</span>
        </button>
      </div>

      {/* Liste des saisons */}
      <div className="space-y-4">
        {seasons.map((season) => (
          <div key={season.seasonNumber} className="bg-dark-200 rounded-lg border border-gray-700">
            {/* En-tête de saison */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleSeason(season.seasonNumber)}
                  className="flex items-center space-x-3 flex-1 text-left"
                >
                  {expandedSeasons.has(season.seasonNumber) ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      {editingSeason === season.seasonNumber ? (
                        <input
                          type="text"
                          value={season.title}
                          onChange={(e) => updateSeason(season.seasonNumber, { title: e.target.value })}
                          onBlur={() => setEditingSeason(null)}
                          onKeyPress={(e) => e.key === 'Enter' && setEditingSeason(null)}
                          className="bg-dark-300 border border-gray-600 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                      ) : (
                        <span onClick={() => setEditingSeason(season.seasonNumber)}>
                          {season.title}
                        </span>
                      )}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {season.episodes.length} épisode{season.episodes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => addEpisode(season.seasonNumber)}
                    className="p-2 text-primary-400 hover:text-primary-300 transition-colors"
                    title="Ajouter un épisode"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeSeason(season.seasonNumber)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Supprimer la saison"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Description de saison */}
            {expandedSeasons.has(season.seasonNumber) && (
              <div className="p-4 border-b border-gray-700">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description de la saison
                </label>
                <textarea
                  value={season.description}
                  onChange={(e) => updateSeason(season.seasonNumber, { description: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-300 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Description de la saison..."
                  rows={2}
                />
              </div>
            )}

            {/* Liste des épisodes */}
            {expandedSeasons.has(season.seasonNumber) && (
              <div className="p-4">
                <div className="space-y-3">
                  {season.episodes.map((episode) => (
                    <div key={episode.episodeNumber} className="bg-dark-300 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {/* Miniature */}
                        <div className="w-16 h-12 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                          {episode.thumbnailUrl ? (
                            <img
                              src={episode.thumbnailUrl}
                              alt={episode.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <PlayIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        {/* Informations de l&apos;épisode */}
                        <div className="flex-1 space-y-3">
                          {/* Titre */}
                          <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">
                              Titre de l&apos;épisode
                            </label>
                            <input
                              type="text"
                              value={episode.title}
                              onChange={(e) => updateEpisode(season.seasonNumber, episode.episodeNumber, { title: e.target.value })}
                              className="w-full px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Titre de l&apos;épisode"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">
                              Description
                            </label>
                            <textarea
                              value={episode.description}
                              onChange={(e) => updateEpisode(season.seasonNumber, episode.episodeNumber, { description: e.target.value })}
                              className="w-full px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Description de l&apos;épisode..."
                              rows={2}
                            />
                          </div>

                          {/* Durée et URL */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-300 text-sm font-medium mb-1">
                                Durée (minutes)
                              </label>
                              <input
                                type="number"
                                value={episode.duration}
                                onChange={(e) => updateEpisode(season.seasonNumber, episode.episodeNumber, { duration: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm font-medium mb-1">
                                URL de la vidéo *
                              </label>
                              <input
                                type="url"
                                value={episode.videoUrl}
                                onChange={(e) => updateEpisode(season.seasonNumber, episode.episodeNumber, { videoUrl: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="https://example.com/episode.mp4"
                                required
                              />
                            </div>
                          </div>

                          {/* URL miniature */}
                          <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">
                              URL de la miniature
                            </label>
                            <input
                              type="url"
                              value={episode.thumbnailUrl || ''}
                              onChange={(e) => updateEpisode(season.seasonNumber, episode.episodeNumber, { thumbnailUrl: e.target.value })}
                              className="w-full px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="https://example.com/thumbnail.jpg"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-1 text-gray-400 text-sm">
                            <ClockIcon className="w-4 h-4" />
                            <span>{formatDuration(episode.duration)}</span>
                          </div>
                          <button
                            onClick={() => removeEpisode(season.seasonNumber, episode.episodeNumber)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Supprimer l&apos;épisode"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {season.episodes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <PlayIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun épisode dans cette saison</p>
                      <button
                        onClick={() => addEpisode(season.seasonNumber)}
                        className="mt-2 text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Ajouter le premier épisode
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {seasons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <PlayIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Aucune saison ajoutée</h3>
            <p className="mb-4">Commencez par ajouter une saison à votre série</p>
            <button
              onClick={addSeason}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors mx-auto"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Ajouter la première saison</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


