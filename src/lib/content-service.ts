import { Movie, Series, WatchProgress } from '@/types/content'
import { AdminContentService } from './admin-content-service'
import { logger } from './logger'

// Service pour gérer les contenus
export class ContentService {
  // Récupérer tous les films (synchronisé avec l'admin)
  static async getMovies(): Promise<Movie[]> {
    // Simulation d'un appel API
    await new Promise(resolve => setTimeout(resolve, 200))
    return AdminContentService.getStoredMovies()
  }

  // Récupérer tous les séries (synchronisé avec l'admin)
  static async getSeries(): Promise<Series[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return AdminContentService.getStoredSeries()
  }

  // Récupérer tous les films (version synchrone pour les filtres)
  static getMoviesSync(): Movie[] {
    return AdminContentService.getStoredMovies()
  }

  // Récupérer toutes les séries (version synchrone pour les filtres)
  static getSeriesSync(): Series[] {
    return AdminContentService.getStoredSeries()
  }

  // Récupérer tous les contenus (films et séries) mélangés
  static getAllContent(): (Movie | Series)[] {
    const movies = AdminContentService.getStoredMovies()
    const series = AdminContentService.getStoredSeries()
    
    // Ajouter la propriété 'type' pour distinguer les films des séries
    const moviesWithType = movies.map(movie => ({ ...movie, type: 'movie' as const }))
    const seriesWithType = series.map(serie => ({ ...serie, type: 'series' as const }))
    
    return [...moviesWithType, ...seriesWithType]
  }

  // Récupérer un film par ID (synchronisé avec l'admin)
  static async getMovieById(id: string): Promise<Movie | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const movies = AdminContentService.getStoredMovies()
    return movies.find(movie => movie.id === id) || null
  }

  // Récupérer une série par ID (synchronisé avec l'admin)
  static async getSeriesById(id: string): Promise<Series | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const series = AdminContentService.getStoredSeries()
    return series.find(serie => serie.id === id) || null
  }

  // Récupérer le progrès de visionnage
  static async getWatchProgress(contentId: string, episodeId?: string): Promise<WatchProgress | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (typeof window === 'undefined') return null
    
    const key = episodeId ? `${contentId}-${episodeId}` : contentId
    const stored = localStorage.getItem(`watch_progress_${key}`)
    
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        logger.error('Error parsing watch progress', error)
      }
    }
    
    return null
  }

  // Sauvegarder le progrès de visionnage
  static async saveWatchProgress(progress: WatchProgress): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (typeof window === 'undefined') return
    
    const key = progress.episodeId ? `${progress.contentId}-${progress.episodeId}` : progress.contentId
    localStorage.setItem(`watch_progress_${key}`, JSON.stringify(progress))
  }

  // Récupérer les contenus récemment regardés (synchronisé avec l'admin)
  static async getRecentlyWatched(): Promise<(Movie | Series)[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Récupérer les IDs des contenus récemment regardés depuis localStorage
    const recentlyWatchedIds = this.getRecentlyWatchedIds()
    const allContent = [...AdminContentService.getStoredMovies(), ...AdminContentService.getStoredSeries()]
    
    return recentlyWatchedIds
      .map(id => allContent.find(content => content.id === id))
      .filter(Boolean) as (Movie | Series)[]
  }

  // Récupérer les IDs des contenus récemment regardés
  private static getRecentlyWatchedIds(): string[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem('recently_watched')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        logger.error('Error parsing recently watched', error)
      }
    }
    return []
  }

  // Ajouter un contenu aux récemment regardés
  static async addToRecentlyWatched(contentId: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    const recentlyWatched = this.getRecentlyWatchedIds()
    const updated = [contentId, ...recentlyWatched.filter(id => id !== contentId)].slice(0, 10)
    localStorage.setItem('recently_watched', JSON.stringify(updated))
  }

  // Méthodes d'instance pour faciliter l'utilisation
  getMovies(): Movie[] {
    return AdminContentService.getStoredMovies()
  }

  getSeries(): Series[] {
    return AdminContentService.getStoredSeries()
  }
}

// Instance exportée pour faciliter l'utilisation
export const contentService = new ContentService()
