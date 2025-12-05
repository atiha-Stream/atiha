/**
 * Hook React pour gérer les utilisateurs (admin uniquement)
 */

'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { CSRFService } from '@/lib/csrf-service'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  country: string | null
  isActive: boolean
  isBanned: boolean
  loginCount: number
  registrationDate: string
  lastLogin: string | null
  createdAt: string
}

interface UseUsersReturn {
  users: User[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  fetchUsers: (page?: number, limit?: number) => Promise<void>
  createUser: (userData: {
    email: string
    password: string
    name?: string
    phone?: string
    country?: string
  }) => Promise<User | null>
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
}

/**
 * Hook pour gérer les utilisateurs (admin uniquement)
 */
export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<UseUsersReturn['pagination']>(null)

  /**
   * Récupérer la liste des utilisateurs
   */
  const fetchUsers = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors du chargement des utilisateurs')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(data.pagination || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors du chargement des utilisateurs', err as Error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Créer un utilisateur
   */
  const createUser = useCallback(
    async (userData: {
      email: string
      password: string
      name?: string
      phone?: string
      country?: string
    }): Promise<User | null> => {
      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...userData,
            csrfToken,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la création')
        }

        const data = await response.json()

        // Ajouter à la liste locale
        setUsers((prev) => [data.user, ...prev])

        logger.info('Utilisateur créé', { userId: data.user.id })
        return data.user
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de la création de l\'utilisateur', err as Error)
        setError(errorMessage)
        return null
      }
    },
    []
  )

  /**
   * Mettre à jour un utilisateur
   */
  const updateUser = useCallback(
    async (userId: string, updates: Partial<User>): Promise<boolean> => {
      try {
        setError(null)
        const csrfToken = CSRFService.getToken()

        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...updates,
            csrfToken,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la mise à jour')
        }

        const data = await response.json()

        // Mettre à jour dans la liste locale
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? data.user : user))
        )

        logger.info('Utilisateur mis à jour', { userId })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        logger.error('Erreur lors de la mise à jour de l\'utilisateur', err as Error)
        setError(errorMessage)
        return false
      }
    },
    []
  )

  /**
   * Supprimer un utilisateur
   */
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setError(null)
      const csrfToken = CSRFService.getToken()

      const response = await fetch(`/api/users/${userId}`, {
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

      // Retirer de la liste locale
      setUsers((prev) => prev.filter((user) => user.id !== userId))

      logger.info('Utilisateur supprimé', { userId })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors de la suppression de l\'utilisateur', err as Error)
      setError(errorMessage)
      return false
    }
  }, [])

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}

