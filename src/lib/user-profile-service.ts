'use client'

import { UserProfile, UserPreferences, WatchHistoryEntry, WatchlistEntry, UserRating, UserStats, Recommendation } from '@/types/user-profile'
import { logger } from './logger'
import SyncService from './sync-service'

export class UserProfileService {
  private static readonly STORAGE_KEY = 'atiha_user_profiles'
  private static readonly WATCH_HISTORY_KEY = 'atiha_watch_history'
  private static readonly WATCHLIST_KEY = 'atiha_watchlist'
  private static readonly RATINGS_KEY = 'atiha_user_ratings'
  
  // Initialiser la synchronisation périodique
  private static syncInitialized = false
  
  private static initSync(userId: string) {
    if (this.syncInitialized || typeof window === 'undefined') return
    
    // Démarrer la synchronisation périodique pour l'historique
    SyncService.startPeriodicSync({
      cacheKey: `${this.WATCH_HISTORY_KEY}_${userId}`,
      apiEndpoint: `/api/users/${userId}/watch-history`,
      syncInterval: 30000 // 30 secondes
    })
    
    // Démarrer la synchronisation périodique pour la watchlist
    SyncService.startPeriodicSync({
      cacheKey: `${this.WATCHLIST_KEY}_${userId}`,
      apiEndpoint: `/api/users/${userId}/watchlist`,
      syncInterval: 30000
    })
    
    // Démarrer la synchronisation périodique pour les favoris
    SyncService.startPeriodicSync({
      cacheKey: `atiha_favorites_${userId}`,
      apiEndpoint: `/api/users/${userId}/favorites`,
      syncInterval: 30000
    })
    
    // Démarrer la synchronisation périodique pour les notes
    SyncService.startPeriodicSync({
      cacheKey: `${this.RATINGS_KEY}_${userId}`,
      apiEndpoint: `/api/users/${userId}/ratings`,
      syncInterval: 30000
    })
    
    this.syncInitialized = true
  }

  // Gestion des profils
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (typeof window === 'undefined') return null

    try {
      const profiles = this.getStoredProfiles()
      return profiles.find(profile => profile.userId === userId) || null
    } catch (error) {
      logger.error('Error getting user profile', error as Error)
      return null
    }
  }

  static async createUserProfile(userId: string, displayName: string): Promise<UserProfile> {
    const defaultPreferences: UserPreferences = {
      favoriteGenres: [],
      favoriteActors: [],
      favoriteDirectors: [],
      preferredLanguages: ['fr'],
      autoPlay: true,
      autoPlayDelay: 10,
      subtitlesEnabled: false,
      preferredSubtitleLanguage: 'fr',
      videoQuality: 'auto',
      emailNotifications: true,
      pushNotifications: true,
      newContentNotifications: true,
      recommendationNotifications: true,
      theme: 'dark',
      language: 'fr',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    const newProfile: UserProfile = {
      id: Date.now().toString(),
      userId,
      displayName,
      preferences: defaultPreferences,
      watchHistory: [],
      watchlist: [],
      ratings: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const profiles = this.getStoredProfiles()
    profiles.push(newProfile)
    this.saveProfiles(profiles)

    return newProfile
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const profiles = this.getStoredProfiles()
    const profileIndex = profiles.findIndex(profile => profile.userId === userId)
    
    if (profileIndex === -1) return null

    profiles[profileIndex] = {
      ...profiles[profileIndex],
      ...updates,
      updatedAt: new Date()
    }

    this.saveProfiles(profiles)
    return profiles[profileIndex]
  }

  // Gestion des préférences
  static async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    const updatedProfile = await this.updateUserProfile(userId, {
      preferences: { ...profile.preferences, ...preferences }
    })

    return updatedProfile !== null
  }

  // Gestion de l&apos;historique de visionnage
  static async addToWatchHistory(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    title: string,
    posterUrl?: string,
    episodeId?: string,
    watchDuration?: number,
    totalDuration?: number
  ): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    const progress = watchDuration && totalDuration ? (watchDuration / totalDuration) * 100 : 0
    const completed = progress >= 90

    const newEntry: WatchHistoryEntry = {
      id: Date.now().toString(),
      contentId,
      contentType,
      episodeId,
      title,
      posterUrl,
      watchedAt: new Date(),
      watchDuration: watchDuration || 0,
      totalDuration: totalDuration || 0,
      progress,
      completed
    }

    // 1. Ajouter à l'historique local (limiter à 1000 entrées)
    const updatedHistory = [newEntry, ...profile.watchHistory].slice(0, 1000)

    // 2. Mettre à jour le profil local (UX rapide)
    const updatedProfile = await this.updateUserProfile(userId, {
      watchHistory: updatedHistory
    })

    if (!updatedProfile) return false

    // 3. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'update',
        `/api/users/${userId}/watch-history`,
        {
          contentId,
          contentType,
          progress: Math.round(progress),
          duration: watchDuration || 0,
          completed
        }
      )

      await SyncService.save(
        {
          cacheKey: `${this.WATCH_HISTORY_KEY}_${userId}`,
          apiEndpoint: `/api/users/${userId}/watch-history`
        },
        updatedHistory,
        operation
      )
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation de l\'historique, données sauvegardées localement', error as Error)
    }

    return true
  }

  static async getWatchHistory(userId: string, limit: number = 50): Promise<WatchHistoryEntry[]> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    try {
      // 1. Essayer de charger depuis PostgreSQL avec cache
      const history = await SyncService.load<WatchHistoryEntry>({
        cacheKey: `${this.WATCH_HISTORY_KEY}_${userId}`,
        apiEndpoint: `/api/users/${userId}/watch-history?limit=${limit}`
      })

      // 2. Convertir le format Prisma vers WatchHistoryEntry si nécessaire
      const convertedHistory = history.map((item: any) => ({
        id: item.id || Date.now().toString(),
        contentId: item.contentId,
        contentType: item.contentType,
        episodeId: item.episodeId || undefined,
        title: item.title || '',
        posterUrl: item.posterUrl || undefined,
        watchedAt: item.watchedAt ? new Date(item.watchedAt) : new Date(),
        watchDuration: item.duration || item.watchDuration || 0,
        totalDuration: item.totalDuration || 0,
        progress: item.progress || 0,
        completed: item.completed || false
      }))

      // 3. Mettre à jour le profil local avec les données synchronisées
      if (convertedHistory.length > 0) {
        const profile = await this.getUserProfile(userId)
        if (profile) {
          await this.updateUserProfile(userId, {
            watchHistory: convertedHistory
          })
        }
      }

      return convertedHistory.slice(0, limit)
    } catch (error) {
      logger.warn('Erreur lors du chargement de l\'historique depuis PostgreSQL, utilisation du cache local', error as Error)
      
      // Fallback : charger depuis le profil local
      const profile = await this.getUserProfile(userId)
      return profile?.watchHistory.slice(0, limit) || []
    }
  }

  static async clearWatchHistory(userId: string): Promise<boolean> {
    return await this.updateUserProfile(userId, { watchHistory: [] }) !== null
  }

  // Gestion de la liste de souhaits
  static async addToWatchlist(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    title: string,
    posterUrl?: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    notes?: string
  ): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    // Vérifier si déjà dans la liste
    const exists = profile.watchlist.some(entry => entry.contentId === contentId)
    if (exists) return false

    const newEntry: WatchlistEntry = {
      id: Date.now().toString(),
      contentId,
      contentType,
      title,
      posterUrl,
      addedAt: new Date(),
      priority,
      notes
    }

    // 1. Mettre à jour localement (UX rapide)
    const updatedWatchlist = [...profile.watchlist, newEntry]
    const updatedProfile = await this.updateUserProfile(userId, {
      watchlist: updatedWatchlist
    })

    if (!updatedProfile) return false

    // 2. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'create',
        `/api/users/${userId}/watchlist`,
        {
          contentId,
          contentType
        }
      )

      await SyncService.save(
        {
          cacheKey: `${this.WATCHLIST_KEY}_${userId}`,
          apiEndpoint: `/api/users/${userId}/watchlist`
        },
        updatedWatchlist,
        operation
      )
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation de la watchlist, données sauvegardées localement', error as Error)
    }

    return true
  }

  static async removeFromWatchlist(userId: string, contentId: string): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    const entryToRemove = profile.watchlist.find(entry => entry.contentId === contentId)
    if (!entryToRemove) return false

    // 1. Retirer localement (UX rapide)
    const updatedWatchlist = profile.watchlist.filter(entry => entry.contentId !== contentId)
    const updatedProfile = await this.updateUserProfile(userId, {
      watchlist: updatedWatchlist
    })

    if (!updatedProfile) return false

    // 2. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'delete',
        `/api/users/${userId}/watchlist`,
        {
          contentId,
          contentType: entryToRemove.contentType
        }
      )

      await SyncService.save(
        {
          cacheKey: `${this.WATCHLIST_KEY}_${userId}`,
          apiEndpoint: `/api/users/${userId}/watchlist`
        },
        updatedWatchlist,
        operation
      )
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation de la suppression, données sauvegardées localement', error as Error)
    }

    return true
  }

  static async getWatchlist(userId: string): Promise<WatchlistEntry[]> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    try {
      // 1. Essayer de charger depuis PostgreSQL avec cache
      const watchlist = await SyncService.load<WatchlistEntry>({
        cacheKey: `${this.WATCHLIST_KEY}_${userId}`,
        apiEndpoint: `/api/users/${userId}/watchlist`
      })

      // 2. Convertir le format Prisma vers WatchlistEntry si nécessaire
      const convertedWatchlist = watchlist.map((item: any) => ({
        id: item.id || Date.now().toString(),
        contentId: item.contentId,
        contentType: item.contentType,
        title: item.title || '',
        posterUrl: item.posterUrl || undefined,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
        priority: item.priority || 'medium' as 'low' | 'medium' | 'high',
        notes: item.notes || undefined
      }))

      // 3. Mettre à jour le profil local avec les données synchronisées
      if (convertedWatchlist.length > 0) {
        const profile = await this.getUserProfile(userId)
        if (profile) {
          await this.updateUserProfile(userId, {
            watchlist: convertedWatchlist
          })
        }
      }

      return convertedWatchlist
    } catch (error) {
      logger.warn('Erreur lors du chargement de la watchlist depuis PostgreSQL, utilisation du cache local', error as Error)
      
      // Fallback : charger depuis le profil local
      const profile = await this.getUserProfile(userId)
      return profile?.watchlist || []
    }
  }

  // Version synchrone pour les notifications (utilise localStorage directement)
  static getWatchlistSync(userId: string): WatchlistEntry[] {
    if (typeof window === 'undefined') return []

    try {
      const profiles = this.getStoredProfiles()
      const profile = profiles.find(p => p.userId === userId)
      return profile?.watchlist || []
    } catch (error) {
      logger.error('Error getting watchlist sync', error as Error)
      return []
    }
  }

  static async updateWatchlistEntry(
    userId: string,
    contentId: string,
    updates: Partial<WatchlistEntry>
  ): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    const updatedWatchlist = profile.watchlist.map(entry =>
      entry.contentId === contentId ? { ...entry, ...updates } : entry
    )

    const updatedProfile = await this.updateUserProfile(userId, {
      watchlist: updatedWatchlist
    })

    return updatedProfile !== null
  }

  // Gestion des favoris
  static async addFavorite(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series'
  ): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    // 1. Vérifier si déjà dans les favoris (via API)
    try {
      const favorites = await this.getFavorites(userId)
      const exists = favorites.some(f => f.contentId === contentId && f.contentType === contentType)
      if (exists) return true
    } catch (error) {
      logger.warn('Erreur lors de la vérification des favoris', error as Error)
    }

    // 2. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'create',
        `/api/users/${userId}/favorites`,
        {
          contentId,
          contentType
        }
      )

      await SyncService.save(
        {
          cacheKey: `atiha_favorites_${userId}`,
          apiEndpoint: `/api/users/${userId}/favorites`
        },
        [], // Les données seront rechargées depuis l'API
        operation
      )

      return true
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation du favori, opération ajoutée à la queue', error as Error)
      return false
    }
  }

  static async removeFavorite(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series'
  ): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    // 1. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'delete',
        `/api/users/${userId}/favorites`,
        {
          contentId,
          contentType
        }
      )

      await SyncService.save(
        {
          cacheKey: `atiha_favorites_${userId}`,
          apiEndpoint: `/api/users/${userId}/favorites`
        },
        [], // Les données seront rechargées depuis l'API
        operation
      )

      return true
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation de la suppression, opération ajoutée à la queue', error as Error)
      return false
    }
  }

  static async getFavorites(userId: string): Promise<Array<{ id: string; contentId: string; contentType: string; addedAt: Date }>> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    try {
      // 1. Essayer de charger depuis PostgreSQL avec cache
      const favorites = await SyncService.load<{ id: string; contentId: string; contentType: string; addedAt: string }>({
        cacheKey: `atiha_favorites_${userId}`,
        apiEndpoint: `/api/users/${userId}/favorites`
      })

      // 2. Convertir le format Prisma vers le format attendu
      const convertedFavorites = favorites.map((item: any) => ({
        id: item.id || Date.now().toString(),
        contentId: item.contentId,
        contentType: item.contentType,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date()
      }))

      return convertedFavorites
    } catch (error) {
      logger.warn('Erreur lors du chargement des favoris depuis PostgreSQL, utilisation du cache local', error as Error)
      
      // Fallback : retourner une liste vide (les favoris ne sont pas stockés dans le profil local)
      return []
    }
  }

  static async isFavorite(userId: string, contentId: string, contentType: 'movie' | 'series'): Promise<boolean> {
    const favorites = await this.getFavorites(userId)
    return favorites.some(f => f.contentId === contentId && f.contentType === contentType)
  }

  // Gestion des notes et avis
  static async addRating(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    rating: number,
    review?: string
  ): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    // Valider la note (1-5)
    if (rating < 1 || rating > 5) {
      logger.warn('Note invalide, doit être entre 1 et 5', { rating })
      return false
    }

    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    // Vérifier si déjà noté
    const existingRatingIndex = profile.ratings.findIndex(r => r.contentId === contentId)
    
    const newRating: UserRating = {
      id: Date.now().toString(),
      contentId,
      contentType,
      rating,
      review,
      ratedAt: new Date(),
      helpful: 0,
      notHelpful: 0
    }

    let updatedRatings: UserRating[]
    if (existingRatingIndex !== -1) {
      // Mettre à jour la note existante
      updatedRatings = [...profile.ratings]
      updatedRatings[existingRatingIndex] = newRating
    } else {
      // Ajouter une nouvelle note
      updatedRatings = [...profile.ratings, newRating]
    }

    // 1. Mettre à jour localement (UX rapide)
    const updatedProfile = await this.updateUserProfile(userId, {
      ratings: updatedRatings
    })

    if (!updatedProfile) return false

    // 2. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'update',
        `/api/users/${userId}/ratings`,
        {
          contentId,
          contentType,
          rating,
          review: review || null
        }
      )

      await SyncService.save(
        {
          cacheKey: `${this.RATINGS_KEY}_${userId}`,
          apiEndpoint: `/api/users/${userId}/ratings`
        },
        updatedRatings,
        operation
      )
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation de la note, données sauvegardées localement', error as Error)
    }

    return true
  }

  static async removeRating(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series'
  ): Promise<boolean> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    // 1. Retirer localement (UX rapide)
    const updatedRatings = profile.ratings.filter(r => !(r.contentId === contentId && r.contentType === contentType))
    const updatedProfile = await this.updateUserProfile(userId, {
      ratings: updatedRatings
    })

    if (!updatedProfile) return false

    // 2. Synchroniser avec PostgreSQL en arrière-plan
    try {
      const operation = SyncService.createOperation(
        'delete',
        `/api/users/${userId}/ratings`,
        {
          contentId,
          contentType
        }
      )

      await SyncService.save(
        {
          cacheKey: `${this.RATINGS_KEY}_${userId}`,
          apiEndpoint: `/api/users/${userId}/ratings`
        },
        updatedRatings,
        operation
      )
    } catch (error) {
      logger.warn('Erreur lors de la synchronisation de la suppression, données sauvegardées localement', error as Error)
    }

    return true
  }

  static async getRatings(userId: string): Promise<UserRating[]> {
    // Initialiser la synchronisation si nécessaire
    this.initSync(userId)

    try {
      // 1. Essayer de charger depuis PostgreSQL avec cache
      const ratings = await SyncService.load<{ id: string; contentId: string; contentType: string; rating: number; review: string | null; createdAt: string; updatedAt: string }>({
        cacheKey: `${this.RATINGS_KEY}_${userId}`,
        apiEndpoint: `/api/users/${userId}/ratings`
      })

      // 2. Convertir le format Prisma vers UserRating
      const convertedRatings: UserRating[] = ratings.map((item: any) => ({
        id: item.id || Date.now().toString(),
        contentId: item.contentId,
        contentType: item.contentType,
        rating: item.rating,
        review: item.review || undefined,
        ratedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        helpful: 0, // Non stocké dans Prisma pour l'instant
        notHelpful: 0 // Non stocké dans Prisma pour l'instant
      }))

      // 3. Mettre à jour le profil local avec les données synchronisées
      if (convertedRatings.length > 0) {
        const profile = await this.getUserProfile(userId)
        if (profile) {
          await this.updateUserProfile(userId, {
            ratings: convertedRatings
          })
        }
      }

      return convertedRatings
    } catch (error) {
      logger.warn('Erreur lors du chargement des notes depuis PostgreSQL, utilisation du cache local', error as Error)
      
      // Fallback : charger depuis le profil local
      const profile = await this.getUserProfile(userId)
      return profile?.ratings || []
    }
  }

  static async getRating(userId: string, contentId: string): Promise<UserRating | null> {
    const ratings = await this.getRatings(userId)
    return ratings.find(rating => rating.contentId === contentId) || null
  }

  // Statistiques utilisateur
  static async getUserStats(userId: string): Promise<UserStats | null> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return null

    const watchHistory = profile.watchHistory
    const ratings = profile.ratings

    // Calculer les statistiques
    const totalWatchTime = watchHistory.reduce((total, entry) => total + entry.watchDuration, 0)
    const moviesWatched = watchHistory.filter(entry => entry.contentType === 'movie' && entry.completed).length
    const seriesWatched = new Set(watchHistory.filter(entry => entry.contentType === 'series').map(entry => entry.contentId)).size
    const episodesWatched = watchHistory.filter(entry => entry.contentType === 'series' && entry.completed).length

    // Calculer la note moyenne
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0

    // Trouver les genres, acteurs et réalisateurs favoris
    const genreCounts: { [key: string]: number } = {}
    const actorCounts: { [key: string]: number } = {}
    const directorCounts: { [key: string]: number } = {}

    // Analyser l&apos;historique pour les préférences
    watchHistory.forEach(entry => {
      // Ici, on devrait analyser le contenu pour extraire les genres, acteurs, etc.
      // Pour l&apos;instant, on utilise les préférences du profil
    })

    const favoriteGenre = Object.keys(genreCounts).reduce((a, b) => 
      genreCounts[a] > genreCounts[b] ? a : b, 'Action'
    )

    const mostWatchedActor = Object.keys(actorCounts).reduce((a, b) => 
      actorCounts[a] > actorCounts[b] ? a : b, 'Inconnu'
    )

    const mostWatchedDirector = Object.keys(directorCounts).reduce((a, b) => 
      directorCounts[a] > directorCounts[b] ? a : b, 'Inconnu'
    )

    // Calculer la série de visionnage (simplifié)
    const watchStreak = this.calculateWatchStreak(watchHistory)

    // Session de visionnage la plus longue
    const longestWatchSession = Math.max(...watchHistory.map(entry => entry.watchDuration), 0)

    return {
      totalWatchTime,
      moviesWatched,
      seriesWatched,
      episodesWatched,
      averageRating,
      favoriteGenre,
      mostWatchedActor,
      mostWatchedDirector,
      watchStreak,
      longestWatchSession
    }
  }

  // Recommandations
  static async getRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return []

    // Algorithme de recommandation simple basé sur les préférences
    const recommendations: Recommendation[] = []

    // Recommandations basées sur les genres favoris
    profile.preferences.favoriteGenres.forEach(genre => {
      recommendations.push({
        id: `genre_${genre}_${Date.now()}`,
        contentId: `recommended_${genre}`,
        contentType: 'movie',
        title: `Recommandation basée sur ${genre}`,
        reason: `Basé sur votre intérêt pour ${genre}`,
        confidence: 75,
        algorithm: 'content-based',
        createdAt: new Date()
      })
    })

    return recommendations.slice(0, limit)
  }

  // Méthodes utilitaires
  private static getStoredProfiles(): UserProfile[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      // Convertir les dates ISO string en objets Date
      return parsed.map((profile: any) => ({
        ...profile,
        createdAt: profile.createdAt ? new Date(profile.createdAt) : new Date(),
        updatedAt: profile.updatedAt ? new Date(profile.updatedAt) : new Date(),
        watchlist: (profile.watchlist || []).map((entry: any) => ({
          ...entry,
          addedAt: entry.addedAt ? new Date(entry.addedAt) : new Date()
        })),
        watchHistory: (profile.watchHistory || []).map((entry: any) => ({
          ...entry,
          watchedAt: entry.watchedAt ? new Date(entry.watchedAt) : new Date()
        })),
        ratings: (profile.ratings || []).map((rating: any) => ({
          ...rating,
          ratedAt: rating.ratedAt ? new Date(rating.ratedAt) : new Date()
        }))
      }))
    } catch (error) {
      logger.error('Error parsing stored profiles', error as Error)
      return []
    }
  }

  private static saveProfiles(profiles: UserProfile[]): void {
    if (typeof window === 'undefined') return
    
    try {
      // Sérialiser les dates en ISO string pour le localStorage
      const serialized = profiles.map(profile => ({
        ...profile,
        createdAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : profile.createdAt,
        updatedAt: profile.updatedAt instanceof Date ? profile.updatedAt.toISOString() : profile.updatedAt,
        watchlist: profile.watchlist.map(entry => ({
          ...entry,
          addedAt: entry.addedAt instanceof Date ? entry.addedAt.toISOString() : entry.addedAt
        })),
        watchHistory: profile.watchHistory.map(entry => ({
          ...entry,
          watchedAt: entry.watchedAt instanceof Date ? entry.watchedAt.toISOString() : entry.watchedAt
        })),
        ratings: profile.ratings.map(rating => ({
          ...rating,
          ratedAt: rating.ratedAt instanceof Date ? rating.ratedAt.toISOString() : rating.ratedAt
        }))
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized))
      logger.debug('Profils sauvegardés dans localStorage', { count: serialized.length })
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des profils', error as Error)
    }
  }

  private static calculateWatchStreak(watchHistory: WatchHistoryEntry[]): number {
    if (watchHistory.length === 0) return 0

    // Trier par date (plus récent en premier)
    const sortedHistory = [...watchHistory].sort((a, b) => 
      new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    )

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Vérifier chaque jour depuis aujourd&apos;hui
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      checkDate.setHours(0, 0, 0, 0)

      const hasWatchedOnDate = sortedHistory.some(entry => {
        const entryDate = new Date(entry.watchedAt)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === checkDate.getTime()
      })

      if (hasWatchedOnDate) {
        streak++
      } else {
        break
      }
    }

    return streak
  }
}

// Utiliser directement la classe avec ses méthodes statiques


