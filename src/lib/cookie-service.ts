/**
 * Service pour gérer les cookies httpOnly via les API routes
 * Permet de stocker les tokens de manière sécurisée côté serveur
 */

'use client'

import { logger } from './logger'

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Service de gestion des cookies httpOnly
 */
export class CookieService {
  /**
   * Définit un cookie httpOnly via une API route
   * @param name - Nom du cookie
   * @param value - Valeur du cookie
   * @param options - Options du cookie (maxAge en secondes)
   */
  static async setCookie(
    name: string,
    value: string,
    options: { maxAge?: number; path?: string } = {}
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cookies/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important pour inclure les cookies
        body: JSON.stringify({
          name,
          value,
          maxAge: options.maxAge || 7 * 24 * 60 * 60, // 7 jours par défaut
          path: options.path || '/'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to set cookie: ${response.statusText}`)
      }

      logger.debug('Cookie set successfully', { name })
      return true
    } catch (error) {
      logger.error('Erreur lors de la définition du cookie', error as Error)
      return false
    }
  }

  /**
   * Récupère la valeur d'un cookie (via API si httpOnly)
   * Note: Les cookies httpOnly ne sont pas accessibles via JavaScript
   * Cette méthode appelle une API route pour récupérer la valeur
   * @param name - Nom du cookie
   * @returns La valeur du cookie ou null
   */
  static async getCookie(name: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cookies/get?name=${encodeURIComponent(name)}`, {
        method: 'GET',
        credentials: 'include' // Important pour inclure les cookies
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to get cookie: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value || null
    } catch (error) {
      logger.error('Erreur lors de la récupération du cookie', error as Error)
      return null
    }
  }

  /**
   * Supprime un cookie
   * @param name - Nom du cookie
   * @param path - Chemin du cookie (doit correspondre au chemin utilisé lors de la création)
   */
  static async deleteCookie(name: string, path: string = '/'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cookies/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, path })
      })

      if (!response.ok) {
        throw new Error(`Failed to delete cookie: ${response.statusText}`)
      }

      logger.debug('Cookie deleted successfully', { name })
      return true
    } catch (error) {
      logger.error('Erreur lors de la suppression du cookie', error as Error)
      return false
    }
  }

  /**
   * Vérifie si un cookie existe
   * @param name - Nom du cookie
   * @returns true si le cookie existe
   */
  static async hasCookie(name: string): Promise<boolean> {
    const value = await this.getCookie(name)
    return value !== null
  }
}

