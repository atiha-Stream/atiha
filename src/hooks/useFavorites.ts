/**
 * Hook React pour gérer les favoris
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { CSRFService } from '@/lib/csrf-service'

interface FavoriteItem {
  id: string
  userId: string
  contentId: string
  contentType: string
  addedAt: string
}

interface UseFavoritesReturn {
  favorites: FavoriteItem[]
  loading: boolean
  error: string | null
  addFavorite: (contentId: string, contentType: string) => Promise<boolean>
  removeFavorite: (contentId: string, contentType: string) => Promise<boolean>
  isFavorite: (contentId: string, contentType: string) => boolean
  toggleFavorite: (contentId: string, contentType: string) => Promise<boolean>
  refresh: () => Promise<void>
}

/**
 * Hook pour gérer les favoris
 * @param userId - ID de l'utilisateur
 */
export function useFavorites(userId: string | null): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charger les favoris depuis l'API
   */
  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setFavorites([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}/favorites`, {
        credentials: 'include',
      })

      if (!response.ok) {
        // Si l'utilisateur n'est pas authentifié (401) ou non autorisé (403), 
        // c'est normal - on retourne une liste vide
        if (response.status === 401 || response.status === 403) {
          logger.debug('Utilisateur non authentifié pour les favoris', { userId })
          setFavorites([])
          return
        }

        // Pour les autres erreurs, on essaie de récupérer le message d'erreur
        let errorMessage = 'Erreur lors du chargement des favoris'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si on ne peut pas parser la réponse, on garde le message par défaut
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (err) {
      // Ne logger que les erreurs non attendues (pas les 401/403)
      if (err instanceof Error && !err.message.includes('Non authentifié') && !err.message.includes('Non autorisé')) {
        logger.error('Erreur lors du chargement des favoris', err as Error)
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      // En cas d'erreur, on retourne une liste vide plutôt que de bloquer l'interface
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Ajouter un favori
   */
  const addFavorite = useCallback(
    async (contentId: string, contentType: string): Promise<boolean> => {
      if (!userId) {
        setError('Utilisateur non connecté')
        return false
      }

      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch(`/api/users/${userId}/favorites`, {
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
        setFavorites((prev) => {
          const exists = prev.some(
            (item) => item.contentId === contentId && item.contentType === contentType
          )
          if (exists) return prev
          return [...prev, data.favorite]
        })

        logger.info('Favori ajouté', { contentId, contentType })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de l\'ajout du favori', err as Error)
        setError(errorMessage)
        return false
      }
    },
    [userId]
  )

  /**
   * Retirer un favori
   */
  const removeFavorite = useCallback(
    async (contentId: string, contentType: string): Promise<boolean> => {
      if (!userId) {
        setError('Utilisateur non connecté')
        return false
      }

      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch(
          `/api/users/${userId}/favorites?contentId=${encodeURIComponent(contentId)}&contentType=${encodeURIComponent(contentType)}`,
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
        setFavorites((prev) =>
          prev.filter(
            (item) => !(item.contentId === contentId && item.contentType === contentType)
          )
        )

        logger.info('Favori retiré', { contentId, contentType })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de la suppression du favori', err as Error)
        setError(errorMessage)
        return false
      }
    },
    [userId]
  )

  /**
   * Vérifier si un élément est en favori
   */
  const isFavorite = useCallback(
    (contentId: string, contentType: string): boolean => {
      return favorites.some(
        (item) => item.contentId === contentId && item.contentType === contentType
      )
    },
    [favorites]
  )

  /**
   * Toggle favori (ajouter si absent, retirer si présent)
   */
  const toggleFavorite = useCallback(
    async (contentId: string, contentType: string): Promise<boolean> => {
      const isFav = isFavorite(contentId, contentType)
      if (isFav) {
        return await removeFavorite(contentId, contentType)
      } else {
        return await addFavorite(contentId, contentType)
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  )

  /**
   * Recharger les favoris
   */
  const refresh = useCallback(async () => {
    await loadFavorites()
  }, [loadFavorites])

  // Charger les favoris au montage
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refresh,
  }
}

