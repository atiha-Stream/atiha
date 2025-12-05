/**
 * Hook React pour gérer l'historique de visionnage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { CSRFService } from '@/lib/csrf-service'

interface WatchHistoryItem {
  id: string
  userId: string
  contentId: string
  contentType: string
  progress: number
  duration: number | null
  completed: boolean
  watchedAt: string
}

interface UseWatchHistoryReturn {
  history: WatchHistoryItem[]
  loading: boolean
  error: string | null
  saveProgress: (
    contentId: string,
    contentType: string,
    progress: number,
    duration?: number,
    completed?: boolean
  ) => Promise<boolean>
  getProgress: (contentId: string) => WatchHistoryItem | null
  refresh: (contentType?: string, limit?: number) => Promise<void>
}

/**
 * Hook pour gérer l'historique de visionnage
 * @param userId - ID de l'utilisateur
 */
export function useWatchHistory(userId: string | null): UseWatchHistoryReturn {
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charger l'historique depuis l'API
   */
  const loadHistory = useCallback(
    async (contentType?: string, limit: number = 50) => {
      if (!userId) {
        setLoading(false)
        setHistory([])
        return
      }

      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (contentType) params.set('contentType', contentType)
        params.set('limit', limit.toString())

        const response = await fetch(
          `/api/users/${userId}/watch-history?${params.toString()}`,
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          // Si l'utilisateur n'est pas authentifié (401) ou non autorisé (403), 
          // c'est normal - on retourne une liste vide
          if (response.status === 401 || response.status === 403) {
            logger.debug('Utilisateur non authentifié pour l\'historique', { userId })
            setHistory([])
            return
          }

          // Pour les autres erreurs, on essaie de récupérer le message d'erreur
          let errorMessage = 'Erreur lors du chargement de l\'historique'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // Si on ne peut pas parser la réponse, on garde le message par défaut
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        setHistory(data.history || [])
      } catch (err) {
        // Ne logger que les erreurs non attendues (pas les 401/403)
        if (err instanceof Error && !err.message.includes('Non authentifié') && !err.message.includes('Non autorisé')) {
          logger.error('Erreur lors du chargement de l\'historique', err as Error)
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(errorMessage)
        // En cas d'erreur, on retourne une liste vide plutôt que de bloquer l'interface
        setHistory([])
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  /**
   * Sauvegarder la progression
   */
  const saveProgress = useCallback(
    async (
      contentId: string,
      contentType: string,
      progress: number,
      duration?: number,
      completed: boolean = false
    ): Promise<boolean> => {
      if (!userId) {
        setError('Utilisateur non connecté')
        return false
      }

      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch(`/api/users/${userId}/watch-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            contentId,
            contentType,
            progress,
            duration,
            completed,
            csrfToken,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la sauvegarde')
        }

        const data = await response.json()

        // Mettre à jour la liste locale
        setHistory((prev) => {
          const existingIndex = prev.findIndex((item) => item.contentId === contentId)
          if (existingIndex >= 0) {
            // Mettre à jour l'élément existant
            const updated = [...prev]
            updated[existingIndex] = data.item
            return updated
          } else {
            // Ajouter le nouvel élément
            return [data.item, ...prev]
          }
        })

        logger.debug('Progression sauvegardée', { contentId, progress })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de la sauvegarde de la progression', err as Error)
        setError(errorMessage)
        return false
      }
    },
    [userId]
  )

  /**
   * Récupérer la progression d'un contenu spécifique
   */
  const getProgress = useCallback(
    (contentId: string): WatchHistoryItem | null => {
      return history.find((item) => item.contentId === contentId) || null
    },
    [history]
  )

  /**
   * Recharger l'historique
   */
  const refresh = useCallback(
    async (contentType?: string, limit?: number) => {
      await loadHistory(contentType, limit)
    },
    [loadHistory]
  )

  // Charger l'historique au montage
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    history,
    loading,
    error,
    saveProgress,
    getProgress,
    refresh,
  }
}

