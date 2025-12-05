/**
 * Hook React pour gérer les sessions utilisateur
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { CSRFService } from '@/lib/csrf-service'

interface Session {
  id: string
  userId: string
  deviceId: string
  deviceInfo: any
  ipAddress: string | null
  userAgent: string | null
  lastActivity: string
  expiresAt: string
  createdAt: string
  user?: {
    id: string
    email: string
    name: string | null
  }
}

interface UseSessionsReturn {
  sessions: Session[]
  loading: boolean
  error: string | null
  deleteSession: (sessionId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

/**
 * Hook pour gérer les sessions
 * @param isAdmin - Si true, récupère toutes les sessions (admin uniquement)
 */
export function useSessions(isAdmin: boolean = false): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charger les sessions depuis l'API
   */
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des sessions')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors du chargement des sessions', err as Error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Supprimer une session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setError(null)
      const csrfToken = CSRFService.getToken()

      const response = await fetch(`/api/sessions?id=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ csrfToken }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      // Retirer de la liste locale (optimistic update)
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))

      logger.info('Session supprimée', { sessionId })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors de la suppression de la session', err as Error)
      setError(errorMessage)
      return false
    }
  }, [])

  /**
   * Recharger les sessions
   */
  const refresh = useCallback(async () => {
    await loadSessions()
  }, [loadSessions])

  // Charger les sessions au montage
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    sessions,
    loading,
    error,
    deleteSession,
    refresh,
  }
}

