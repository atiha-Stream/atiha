'use client'

import React, { useState, useEffect } from 'react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { 
  FunnelIcon, 
  BarsArrowUpIcon, 
  HeartIcon, 
  PlayIcon, 
  CheckIcon, 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline'
import { ContentService } from '@/lib/content-service'
import { Movie, Series } from '@/types/content'
import { logger } from '@/lib/logger'

interface WatchlistProps {
  className?: string
}

interface WatchlistEntryWithContent {
  id: string
  contentId: string
  contentType: string
  addedAt: string
  content?: Movie | Series
}

export default function Watchlist({ className = '' }: WatchlistProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { watchlist, loading, removeFromWatchlist, refresh } = useWatchlist(user?.id || null)
  const [watchlistEntries, setWatchlistEntries] = useState<WatchlistEntryWithContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'movies' | 'series'>('all')
  const [sortBy, setSortBy] = useState<'added' | 'priority' | 'title'>('added')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Charger les détails des contenus pour chaque élément de la watchlist
  useEffect(() => {
    const loadContentDetails = async () => {
      if (!user || watchlist.length === 0) {
        setWatchlistEntries([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [movies, series] = await Promise.all([
          ContentService.getMovies(),
          ContentService.getSeries()
        ])

        const moviesMap = new Map(movies.map(m => [m.id, m]))
        const seriesMap = new Map(series.map(s => [s.id, s]))

        const entriesWithContent: WatchlistEntryWithContent[] = watchlist.map(item => {
          const content = item.contentType === 'movie' 
            ? moviesMap.get(item.contentId)
            : seriesMap.get(item.contentId)
          
          return {
            ...item,
            content
          }
        })

        setWatchlistEntries(entriesWithContent)
      } catch (error) {
        logger.error('Error loading watchlist content details', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading && watchlist.length >= 0) {
      loadContentDetails()
    }
  }, [watchlist, loading, user])

  const handleRemoveFromWatchlist = async (contentId: string, contentType: string) => {
    if (!user) return

    try {
      const success = await removeFromWatchlist(contentId, contentType)
      if (success) {
        await refresh()
      }
    } catch (error) {
      logger.error('Error removing from watchlist', error as Error)
    }
  }

  const handleUpdateNotes = async (contentId: string) => {
    // Note: La fonctionnalité de notes n'est pas encore implémentée dans l'API
    // Pour l'instant, on garde juste l'interface mais sans sauvegarder
    setEditingEntry(null)
    setEditNotes('')
    logger.info('Notes update not yet implemented in API')
  }

  const handleWatchContent = (entry: WatchlistEntryWithContent) => {
    router.push(`/watch/${entry.contentId}`)
  }

  const filteredAndSortedWatchlist = watchlistEntries
    .filter(entry => {
      if (filter === 'all') return true
      return entry.contentType === filter
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'added':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
          break
        case 'title':
          const titleA = a.content?.title || ''
          const titleB = b.content?.title || ''
          comparison = titleA.localeCompare(titleB)
          break
        case 'priority':
          // Priorité non disponible dans l'API actuelle, utiliser la date d'ajout
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (isLoading) {
    return (
      <div className={`bg-dark-200 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-200 rounded-lg ${className}`}>
      {/* En-tête */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HeartIconSolid className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-white">Ma liste de souhaits</h2>
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm">
              {watchlistEntries.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filtres et tri */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtre par type */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-dark-300 border border-gray-600 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="movies">Films</option>
              <option value="series">Séries</option>
            </select>
          </div>

          {/* Tri */}
          <div className="flex items-center space-x-2">
            <BarsArrowUpIcon className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-dark-300 border border-gray-600 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="added">Date d&apos;ajout</option>
              <option value="priority">Priorité</option>
              <option value="title">Titre</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="p-4">
        {filteredAndSortedWatchlist.length === 0 ? (
          <div className="text-center py-12">
            <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Liste vide</h3>
            <p className="text-gray-400 mb-4">
              {filter === 'all' 
                ? "Vous n&apos;avez encore rien ajouté à votre liste de souhaits"
                : `Aucun ${filter === 'movies' ? 'film' : 'série'} dans votre liste`
              }
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Découvrir du contenu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedWatchlist.map((entry) => (
              <div key={entry.id} className="bg-dark-300 rounded-lg p-4 hover:bg-dark-100 transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Miniature */}
                  <div className="w-16 h-12 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                    {entry.content?.posterUrl ? (
                      <img
                        src={entry.content.posterUrl}
                        alt={entry.content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-medium truncate">{entry.content?.title || entry.contentId}</h3>
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                        {entry.contentType === 'movie' ? 'Film' : 'Série'}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">
                      Ajouté le {new Date(entry.addedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {entry.content && (
                      <button
                        onClick={() => handleWatchContent(entry)}
                        className="flex items-center space-x-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        <PlayIcon className="w-4 h-4" />
                        <span>Regarder</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveFromWatchlist(entry.contentId, entry.contentType)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Retirer de la liste"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
