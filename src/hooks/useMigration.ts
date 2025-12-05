/**
 * Hook React pour migrer les données depuis localStorage vers PostgreSQL
 */

'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { CSRFService } from '@/lib/csrf-service'

interface MigrationResults {
  users: { migrated: number; skipped: number; errors: number }
  watchlist: { migrated: number; errors: number }
  watchHistory: { migrated: number; errors: number }
  favorites: { migrated: number; errors: number }
  ratings: { migrated: number; errors: number }
}

interface UseMigrationReturn {
  migrating: boolean
  error: string | null
  results: MigrationResults | null
  migrate: () => Promise<boolean>
  collectLocalStorageData: () => {
    users: any[]
    watchlist: any[]
    watchHistory: any[]
    favorites: any[]
    ratings: any[]
  }
}

/**
 * Hook pour migrer les données depuis localStorage
 */
export function useMigration(): UseMigrationReturn {
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MigrationResults | null>(null)

  /**
   * Collecter les données depuis localStorage
   */
  const collectLocalStorageData = useCallback(() => {
    try {
      const users = JSON.parse(localStorage.getItem('atiha_users_database') || '[]')
      
      // Collecter la watchlist (peut être stockée différemment)
      const watchlist: any[] = []
      const watchHistory: any[] = []
      const favorites: any[] = []
      const ratings: any[] = []

      // Parcourir les utilisateurs pour collecter leurs données
      users.forEach((user: any) => {
        const userId = user.id

        // Watchlist (peut être dans user.watchlist ou séparément)
        if (user.watchlist && Array.isArray(user.watchlist)) {
          watchlist.push(...user.watchlist.map((item: any) => ({
            userId,
            ...item,
          })))
        }

        // Historique (peut être dans user.history ou séparément)
        if (user.history && Array.isArray(user.history)) {
          watchHistory.push(...user.history.map((item: any) => ({
            userId,
            ...item,
          })))
        }

        // Favoris (peut être dans user.favorites ou séparément)
        if (user.favorites && Array.isArray(user.favorites)) {
          favorites.push(...user.favorites.map((item: any) => ({
            userId,
            ...item,
          })))
        }

        // Notes (peut être dans user.ratings ou séparément)
        if (user.ratings && Array.isArray(user.ratings)) {
          ratings.push(...user.ratings.map((item: any) => ({
            userId,
            ...item,
          })))
        }
      })

      // Vérifier aussi les clés globales
      const globalWatchlist = localStorage.getItem('atiha_watchlist')
      if (globalWatchlist) {
        try {
          const parsed = JSON.parse(globalWatchlist)
          if (Array.isArray(parsed)) {
            watchlist.push(...parsed)
          }
        } catch (e) {
          logger.warn('Erreur lors du parsing de la watchlist globale', e as Error)
        }
      }

      return {
        users,
        watchlist,
        watchHistory,
        favorites,
        ratings,
      }
    } catch (err) {
      logger.error('Erreur lors de la collecte des données localStorage', err as Error)
      return {
        users: [],
        watchlist: [],
        watchHistory: [],
        favorites: [],
        ratings: [],
      }
    }
  }, [])

  /**
   * Migrer les données
   */
  const migrate = useCallback(async (): Promise<boolean> => {
    try {
      setMigrating(true)
      setError(null)
      setResults(null)

      // Collecter les données
      const data = collectLocalStorageData()

      // Vérifier qu'il y a des données à migrer
      const hasData =
        data.users.length > 0 ||
        data.watchlist.length > 0 ||
        data.watchHistory.length > 0 ||
        data.favorites.length > 0 ||
        data.ratings.length > 0

      if (!hasData) {
        setError('Aucune donnée à migrer')
        return false
      }

      const csrfToken = CSRFService.getToken()

      // Envoyer à l'API
      const response = await fetch('/api/migration/localStorage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          csrfToken,
        }),
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || 'Erreur lors de la migration')
      }

      const responseData = await response.json()
      setResults(responseData.results)

      logger.info('Migration terminée avec succès', responseData.results)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors de la migration', err as Error)
      setError(errorMessage)
      return false
    } finally {
      setMigrating(false)
    }
  }, [collectLocalStorageData])

  return {
    migrating,
    error,
    results,
    migrate,
    collectLocalStorageData,
  }
}

