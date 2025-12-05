'use client'

import { logger } from './logger'

export interface UserPreferences {
  favoriteGenres: string[]
  lastUpdated: Date
}

export class UserPreferencesService {
  private static readonly PREFERENCES_KEY = 'atiha_user_preferences'

  // Obtenir les préférences utilisateur
  static getUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return { favoriteGenres: [], lastUpdated: new Date() }
    }

    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          favoriteGenres: parsed.favoriteGenres || [],
          lastUpdated: new Date(parsed.lastUpdated || new Date())
        }
      }
    } catch (error) {
      logger.error('Error loading user preferences', error as Error)
    }

    return { favoriteGenres: [], lastUpdated: new Date() }
  }

  // Sauvegarder les préférences utilisateur
  static saveUserPreferences(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return

    try {
      const toSave = {
        ...preferences,
        lastUpdated: new Date()
      }
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(toSave))
    } catch (error) {
      logger.error('Error saving user preferences', error as Error)
    }
  }

  // Mettre à jour les genres préférés
  static updateFavoriteGenres(genres: string[]): void {
    const preferences = this.getUserPreferences()
    preferences.favoriteGenres = genres
    this.saveUserPreferences(preferences)
  }

  // Ajouter un genre aux préférences
  static addFavoriteGenre(genre: string): void {
    const preferences = this.getUserPreferences()
    if (!preferences.favoriteGenres.includes(genre)) {
      preferences.favoriteGenres.push(genre)
      this.saveUserPreferences(preferences)
    }
  }

  // Supprimer un genre des préférences
  static removeFavoriteGenre(genre: string): void {
    const preferences = this.getUserPreferences()
    preferences.favoriteGenres = preferences.favoriteGenres.filter(g => g !== genre)
    this.saveUserPreferences(preferences)
  }

  // Vérifier si un genre est dans les préférences
  static isGenreFavorite(genre: string): boolean {
    const preferences = this.getUserPreferences()
    return preferences.favoriteGenres.includes(genre)
  }

  // Obtenir les genres préférés
  static getFavoriteGenres(): string[] {
    const preferences = this.getUserPreferences()
    return preferences.favoriteGenres
  }

  // Réinitialiser les préférences
  static resetPreferences(): void {
    this.saveUserPreferences({ favoriteGenres: [], lastUpdated: new Date() })
  }
}
