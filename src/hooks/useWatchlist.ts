/**
 * Hook React pour gérer la watchlist d'un utilisateur
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { CSRFService } from '@/lib/csrf-service'

interface WatchlistItem {
  id: string
  userId: string
  contentId: string
  contentType: string
  addedAt: string
}

interface UseWatchlistReturn {
  watchlist: WatchlistItem[]
  loading: boolean
  error: string | null
  addToWatchlist: (contentId: string, contentType: string) => Promise<boolean>
  removeFromWatchlist: (contentId: string, contentType: string) => Promise<boolean>
  isInWatchlist: (contentId: string, contentType: string) => boolean
  refresh: () => Promise<void>
}

/**
 * Hook pour gérer la watchlist
 * @param userId - ID de l'utilisateur
 * @returns Objet avec watchlist, méthodes et états
 */
export function useWatchlist(userId: string | null): UseWatchlistReturn {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charger la watchlist depuis l'API
   */
  const loadWatchlist = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setWatchlist([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}/watchlist`, {
        credentials: 'include',
      })

      if (!response.ok) {
        // Si l'utilisateur n'est pas authentifié (401) ou non autorisé (403), 
        // c'est normal - on retourne une liste vide
        if (response.status === 401 || response.status === 403) {
          logger.debug('Utilisateur non authentifié pour la watchlist', { userId })
          setWatchlist([])
          return
        }

        // Pour les autres erreurs, on essaie de récupérer le message d'erreur
        let errorMessage = 'Erreur lors du chargement de la watchlist'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si on ne peut pas parser la réponse, on garde le message par défaut
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setWatchlist(data.watchlist || [])
    } catch (err) {
      // Ne logger que les erreurs non attendues (pas les 401/403)
      if (err instanceof Error && !err.message.includes('Non authentifié') && !err.message.includes('Non autorisé')) {
        logger.error('Erreur lors du chargement de la watchlist', err as Error)
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      // En cas d'erreur, on retourne une liste vide plutôt que de bloquer l'interface
      setWatchlist([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Ajouter un élément à la watchlist
   */
  const addToWatchlist = useCallback(
    async (contentId: string, contentType: string): Promise<boolean> => {
      if (!userId) {
        setError('Utilisateur non connecté')
        return false
      }

      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch(`/api/users/${userId}/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            contentId,
            contentType,
            csrfToken,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de l\'ajout')
        }

        const data = await response.json()
        
        // Ajouter à la liste locale (optimistic update)
        setWatchlist((prev) => {
          // Vérifier si l'élément existe déjà
          const exists = prev.some(
            (item) => item.contentId === contentId && item.contentType === contentType
          )
          if (exists) return prev
          return [...prev, data.item]
        })

        logger.info('Élément ajouté à la watchlist', { contentId, contentType })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de l\'ajout à la watchlist', err as Error)
        setError(errorMessage)
        return false
      }
    },
    [userId]
  )

  /**
   * Retirer un élément de la watchlist
   */
  const removeFromWatchlist = useCallback(
    async (contentId: string, contentType: string): Promise<boolean> => {
      if (!userId) {
        setError('Utilisateur non connecté')
        return false
      }

      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch(
          `/api/users/${userId}/watchlist?contentId=${encodeURIComponent(contentId)}&contentType=${encodeURIComponent(contentType)}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ csrfToken }),
          }
        )

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la suppression')
        }

        // Retirer de la liste locale (optimistic update)
        setWatchlist((prev) =>
          prev.filter(
            (item) => !(item.contentId === contentId && item.contentType === contentType)
          )
        )

        logger.info('Élément retiré de la watchlist', { contentId, contentType })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de la suppression de la watchlist', err as Error)
        setError(errorMessage)
        return false
      }
    },
    [userId]
  )

  /**
   * Vérifier si un élément est dans la watchlist
   */
  const isInWatchlist = useCallback(
    (contentId: string, contentType: string): boolean => {
      return watchlist.some(
        (item) => item.contentId === contentId && item.contentType === contentType
      )
    },
    [watchlist]
  )

  /**
   * Recharger la watchlist
   */
  const refresh = useCallback(async () => {
    await loadWatchlist()
  }, [loadWatchlist])

  // Charger la watchlist au montage et quand userId change
  useEffect(() => {
    loadWatchlist()
  }, [loadWatchlist])

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refresh,
  }
}

