'use client'

import { userDatabase } from './user-database'
import { AdminContentService } from './admin-content-service'
import { sessionManager } from './session-manager'
import { SecureStorage } from './secure-storage'
import { logger } from './logger'

export interface AnalyticsEvent {
  id: string
  type: 'page_view' | 'content_view' | 'search' | 'user_action' | 'error' | 'performance'
  category: string
  action: string
  label?: string
  value?: number
  timestamp: Date
  userId?: string
  sessionId: string
  metadata?: Record<string, any>
  // Nouvelles métriques
  country?: string
  device?: 'mobile' | 'tablet' | 'desktop'
  hour?: number
  catalogue?: string
}

export interface UserAnalytics {
  userId: string
  totalSessions: number
  totalWatchTime: number
  totalPageViews: number
  totalSearches: number
  favoriteGenres: string[]
  favoriteContent: string[]
  averageSessionDuration: number
  lastActive: Date
  deviceInfo: {
    userAgent: string
    platform: string
    language: string
  }
}

export interface ContentAnalytics {
  contentId: string
  contentType: 'movie' | 'series'
  title: string
  totalViews: number
  totalWatchTime: number
  averageRating: number
  totalRatings: number
  completionRate: number
  popularityScore: number
  lastViewed: Date
}

export interface SystemAnalytics {
  totalUsers: number
  totalContent: number
  totalSessions: number
  averageSessionDuration: number
  mostPopularContent: ContentAnalytics[]
  userEngagement: {
    totalUsers: number
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
  }
  popularContent: {
    popularCatalogues: { catalogue: string; views: number }[]
    popularMovies: ContentAnalytics[]
    popularSeries: ContentAnalytics[]
  }
  geographic: {
    countries: { country: string; users: number; percentage: number }[]
  }
  devices: {
    mobile: number
    tablet: number
    desktop: number
  }
  peakHours: {
    hour: number
    users: number
    percentage: number
  }[]
  performance: {
    averagePageLoadTime: number
    errorRate: number
    cacheHitRate: number
  }
}

export class AnalyticsService {
  private static readonly STORAGE_KEY = 'atiha_analytics'
  private static readonly USER_ANALYTICS_KEY = 'atiha_user_analytics'
  private static readonly CONTENT_ANALYTICS_KEY = 'atiha_content_analytics'
  private static readonly MAX_EVENTS = 1000
  private static sessionId: string = this.generateSessionId()

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Gestion des événements
  static trackEvent(
    type: AnalyticsEvent['type'],
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (typeof window === 'undefined') return

    const event: AnalyticsEvent = {
      id: Date.now().toString(),
      type,
      category,
      action,
      label,
      value,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata,
      // Détection automatique des métriques
      country: this.detectCountry(),
      device: this.detectDevice(),
      hour: new Date().getHours(),
      catalogue: metadata?.catalogue
    }

    this.storeEvent(event)
    this.updateAnalytics(event)
  }

  // Détection automatique du pays (simulation)
  private static detectCountry(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    // Simulation basée sur la langue du navigateur
    const language = navigator.language || navigator.languages?.[0] || 'en'
    const countryMap: { [key: string]: string } = {
      'fr': 'France',
      'en': 'États-Unis',
      'es': 'Espagne',
      'de': 'Allemagne',
      'it': 'Italie',
      'pt': 'Portugal',
      'ar': 'Maroc',
      'ja': 'Japon',
      'ko': 'Corée du Sud',
      'zh': 'Chine'
    }
    
    const langCode = language.split('-')[0].toLowerCase()
    return countryMap[langCode] || 'Autre'
  }

  // Détection automatique de l'appareil
  private static detectDevice(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'
    
    const userAgent = navigator.userAgent.toLowerCase()
    const width = window.innerWidth
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile'
    } else if (/tablet|ipad|playbook|silk/i.test(userAgent) || (width >= 768 && width <= 1024)) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  private static storeEvent(event: AnalyticsEvent): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const events = stored ? JSON.parse(stored) : []
      
      events.push(event)
      
      // Limiter le nombre d'événements
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events))
    } catch (error) {
      logger.error('Error storing analytics event', error as Error)
    }
  }

  private static updateAnalytics(event: AnalyticsEvent): void {
    switch (event.type) {
      case 'page_view':
        this.updatePageViewAnalytics(event)
        break
      case 'content_view':
        this.updateContentViewAnalytics(event)
        break
      case 'user_action':
        this.updateUserActionAnalytics(event)
        break
      case 'performance':
        this.updatePerformanceAnalytics(event)
        break
    }
  }

  private static updatePageViewAnalytics(event: AnalyticsEvent): void {
    // Mise à jour des analytics de page
    const userAnalytics = this.getUserAnalytics()
    if (userAnalytics) {
      userAnalytics.totalPageViews++
      userAnalytics.lastActive = new Date()
      this.saveUserAnalytics(userAnalytics)
    }
  }

  private static updateContentViewAnalytics(event: AnalyticsEvent): void {
    if (!event.metadata?.contentId) return

    const contentAnalytics = this.getContentAnalytics(event.metadata.contentId)
    if (contentAnalytics) {
      contentAnalytics.totalViews++
      contentAnalytics.lastViewed = new Date()
      if (event.metadata.watchTime) {
        contentAnalytics.totalWatchTime += event.metadata.watchTime
      }
      // Recalculer le score de popularité
      contentAnalytics.popularityScore = this.calculatePopularityScore(contentAnalytics)
      this.saveContentAnalytics(contentAnalytics)
    } else {
      // Créer de nouveaux analytics pour ce contenu
      const newContentAnalytics: ContentAnalytics = {
        contentId: event.metadata.contentId,
        contentType: event.metadata.contentType || 'movie',
        title: event.metadata.title || 'Unknown',
        totalViews: 1,
        totalWatchTime: event.metadata.watchTime || 0,
        averageRating: 0,
        totalRatings: 0,
        completionRate: 0,
        popularityScore: 1,
        lastViewed: new Date()
      }
      // Calculer le score de popularité initial
      newContentAnalytics.popularityScore = this.calculatePopularityScore(newContentAnalytics)
      this.saveContentAnalytics(newContentAnalytics)
    }
  }

  private static updateUserActionAnalytics(event: AnalyticsEvent): void {
    // Mise à jour des analytics utilisateur basés sur les actions
    const userAnalytics = this.getUserAnalytics()
    if (userAnalytics) {
      userAnalytics.lastActive = new Date()
      
      if (event.category === 'search') {
        userAnalytics.totalSearches++
      }
      
      this.saveUserAnalytics(userAnalytics)
    }
  }

  private static updatePerformanceAnalytics(event: AnalyticsEvent): void {
    // Mise à jour des métriques de performance
    // Cette méthode peut être étendue pour collecter des métriques spécifiques
  }

  // Méthodes de tracking spécifiques
  static trackPageView(page: string, userId?: string): void {
    this.trackEvent('page_view', 'navigation', 'page_view', page, undefined, {
      page,
      userId,
      referrer: document.referrer,
      url: window.location.href
    })
  }

  static trackContentView(
    contentId: string,
    contentType: 'movie' | 'series',
    title: string,
    watchTime?: number,
    userId?: string,
    catalogue?: string
  ): void {
    this.trackEvent('content_view', 'content', 'view', title, watchTime, {
      contentId,
      contentType,
      title,
      watchTime,
      userId,
      catalogue
    })
  }

  static trackCatalogueView(catalogue: string, userId?: string): void {
    this.trackEvent('page_view', 'catalogue', 'view', catalogue, undefined, {
      catalogue,
      userId
    })
  }

  static trackSearch(query: string, resultsCount: number, userId?: string): void {
    this.trackEvent('search', 'search', 'query', query, resultsCount, {
      query,
      resultsCount,
      userId
    })
  }

  static trackUserAction(
    action: string,
    category: string,
    label?: string,
    value?: number,
    userId?: string
  ): void {
    this.trackEvent('user_action', category, action, label, value, {
      userId
    })
  }

  static trackError(error: string, context: string, userId?: string): void {
    this.trackEvent('error', 'error', 'occurred', error, undefined, {
      error,
      context,
      userId,
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  static trackPerformance(
    metric: string,
    value: number,
    context?: string
  ): void {
    this.trackEvent('performance', 'performance', metric, context, value, {
      metric,
      value,
      context
    })
  }

  // Gestion des analytics utilisateur
  static initializeUserAnalytics(userId: string): void {
    const existing = this.getUserAnalytics()
    if (existing) return

    const userAnalytics: UserAnalytics = {
      userId,
      totalSessions: 1,
      totalWatchTime: 0,
      totalPageViews: 0,
      totalSearches: 0,
      favoriteGenres: [],
      favoriteContent: [],
      averageSessionDuration: 0,
      lastActive: new Date(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    }

    this.saveUserAnalytics(userAnalytics)
  }

  static getUserAnalytics(): UserAnalytics | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.USER_ANALYTICS_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      logger.error('Error loading user analytics', error as Error)
      return null
    }
  }

  private static saveUserAnalytics(analytics: UserAnalytics): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.USER_ANALYTICS_KEY, JSON.stringify(analytics))
    } catch (error) {
      logger.error('Error saving user analytics', error as Error)
    }
  }

  // Gestion des analytics de contenu
  static getContentAnalytics(contentId: string): ContentAnalytics | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.CONTENT_ANALYTICS_KEY)
      const allContentAnalytics = stored ? JSON.parse(stored) : {}
      return allContentAnalytics[contentId] || null
    } catch (error) {
      logger.error('Error loading content analytics', error as Error)
      return null
    }
  }

  private static saveContentAnalytics(analytics: ContentAnalytics): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.CONTENT_ANALYTICS_KEY)
      const allContentAnalytics = stored ? JSON.parse(stored) : {}
      allContentAnalytics[analytics.contentId] = analytics
      localStorage.setItem(this.CONTENT_ANALYTICS_KEY, JSON.stringify(allContentAnalytics))
    } catch (error) {
      logger.error('Error saving content analytics', error as Error)
    }
  }

  static getAllContentAnalytics(): ContentAnalytics[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.CONTENT_ANALYTICS_KEY)
      const allContentAnalytics = stored ? JSON.parse(stored) : {}
      return Object.values(allContentAnalytics)
    } catch (error) {
      logger.error('Error loading all content analytics', error as Error)
      return []
    }
  }

  // Mettre à jour le temps de visionnage d'un contenu
  static updateContentWatchTime(contentId: string, watchTimeMinutes: number): void {
    if (typeof window === 'undefined' || !contentId || watchTimeMinutes <= 0) return

    try {
      const contentAnalytics = this.getContentAnalytics(contentId)
      
      if (contentAnalytics) {
        // Mettre à jour le temps de visionnage total
        contentAnalytics.totalWatchTime += watchTimeMinutes
        contentAnalytics.lastViewed = new Date()
        // Recalculer le score de popularité basé sur les vues et le temps de visionnage
        contentAnalytics.popularityScore = this.calculatePopularityScore(contentAnalytics)
        this.saveContentAnalytics(contentAnalytics)
      } else {
        // Si les analytics n'existent pas encore, on ne peut pas créer sans connaître le type et le titre
        // L'analytics sera créé lors de la première vue via trackContentView
      }
    } catch (error) {
      logger.error('Error updating content watch time', error as Error)
    }
  }

  // Calculer le score de popularité
  private static calculatePopularityScore(analytics: ContentAnalytics): number {
    // Score basé sur les vues, le temps de visionnage et les notes
    const viewsScore = analytics.totalViews * 1
    const watchTimeScore = analytics.totalWatchTime / 10 // Chaque 10 minutes = 1 point
    const ratingScore = analytics.averageRating > 0 ? analytics.averageRating * 2 : 0
    return viewsScore + watchTimeScore + ratingScore
  }

  // Obtenir le nombre d'utilisateurs normaux actuellement en ligne
  static getOnlineNormalUsersCount(): number {
    if (typeof window === 'undefined') return 0

    try {
      const normalUsers = userDatabase.getNormalUsers()
      const now = new Date()
      const onlineThreshold = 60 * 60 * 1000 // 1 heure en millisecondes (plus souple)
      const onlineUserIds = new Set<string>()

      // Méthode 1: Vérifier les utilisateurs actuellement connectés (localStorage)
      const currentUser = SecureStorage.getItemJSON<any>('atiha_user')
      if (currentUser) {
        try {
          // Vérifier que c'est un utilisateur normal (pas un admin)
          if (currentUser.id && !currentUser.isAdmin) {
            onlineUserIds.add(currentUser.id)
          }
        } catch (error) {
          logger.error('Error parsing current user data', error as Error)
        }
      }

      // Méthode 2: Vérifier les sessions actives pour tous les utilisateurs normaux
      normalUsers.forEach(user => {
        // Vérifier si l'utilisateur a déjà été compté (méthode 1)
        if (onlineUserIds.has(user.id)) {
          return
        }

        // Récupérer les sessions actives de l'utilisateur
        const activeSessions = sessionManager.getUserActiveSessions(user.id)
        
        // Si l'utilisateur a des sessions actives, vérifier l'activité récente
        if (activeSessions.length > 0) {
          const hasRecentActivity = activeSessions.some(session => {
            const lastActivity = new Date(session.lastActivity)
            const timeSinceActivity = now.getTime() - lastActivity.getTime()
            return timeSinceActivity <= onlineThreshold
          })

          if (hasRecentActivity) {
            onlineUserIds.add(user.id)
          }
        }

        // Méthode 3: Vérifier aussi la dernière connexion si elle est récente
        if (user.lastLogin) {
          const lastLogin = new Date(user.lastLogin)
          const timeSinceLogin = now.getTime() - lastLogin.getTime()
          // Si la dernière connexion est récente (dans les 30 minutes), considérer comme en ligne
          if (timeSinceLogin <= 30 * 60 * 1000) {
            onlineUserIds.add(user.id)
          }
        }
      })

      return onlineUserIds.size
    } catch (error) {
      logger.error('Error counting online users', error as Error)
      return 0
    }
  }

  // Analytics système
  static getSystemAnalytics(): SystemAnalytics {
    const userAnalytics = this.getUserAnalytics()
    const allContentAnalytics = this.getAllContentAnalytics()
    const events = this.getEvents()
    
    // Récupérer les vraies données de l'application
    const normalUsers = userDatabase.getNormalUsers()
    const movies = AdminContentService.getStoredMovies()
    const series = AdminContentService.getStoredSeries()
    
    // Calculer les métriques système avec les vraies données
    const totalUsers = normalUsers ? normalUsers.length : 0
    const totalContent = movies.length + series.length
    
    // Calculer le nombre d'utilisateurs normaux actuellement en ligne
    // Un utilisateur est considéré en ligne s'il a au moins une session active avec une activité récente (15 dernières minutes)
    const onlineUsersCount = this.getOnlineNormalUsersCount()
    const totalSessions = onlineUsersCount // Utiliser le nombre d'utilisateurs en ligne au lieu du nombre de sessions
    
    // Calculer la durée moyenne des sessions (en minutes)
    // Pour chaque session, calculer la durée entre le premier et dernier événement
    const uniqueSessions = new Set<string>()
    events.forEach(event => {
      if (event.sessionId) {
        uniqueSessions.add(event.sessionId)
      }
    })
    const sessionDurations: number[] = []
    uniqueSessions.forEach(sessionId => {
      const sessionEvents = events.filter(e => e.sessionId === sessionId)
      if (sessionEvents.length > 0) {
        const firstEvent = sessionEvents[0]
        const lastEvent = sessionEvents[sessionEvents.length - 1]
        const duration = (new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()) / (1000 * 60) // en minutes
        if (duration > 0) {
          sessionDurations.push(duration)
        }
      }
    })
    // Calculer la durée moyenne et arrondir à l'entier le plus proche (en minutes)
    const averageSessionDuration = sessionDurations.length > 0 
      ? Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length)
      : 0

    // Trier le contenu par popularité
    const mostPopularContent = allContentAnalytics
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 10)

    // Calculer les métriques d'engagement utilisateur
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyActiveUsers = events.filter(e => e.timestamp >= oneDayAgo).length
    const weeklyActiveUsers = events.filter(e => e.timestamp >= oneWeekAgo).length
    const monthlyActiveUsers = events.filter(e => e.timestamp >= oneMonthAgo).length

    // Calculer les catalogues populaires
    const catalogueViews: { [key: string]: number } = {}
    events.forEach(event => {
      if (event.catalogue) {
        catalogueViews[event.catalogue] = (catalogueViews[event.catalogue] || 0) + 1
      }
    })
    const popularCatalogues = Object.entries(catalogueViews)
      .map(([catalogue, views]) => ({ catalogue, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Séparer films et séries populaires
    // Merger les analytics trackés avec les vrais contenus de l'application
    const moviesWithAnalytics = movies.map(movie => {
      const analytics = allContentAnalytics.find(a => a.contentId === movie.id)
      return {
        contentId: movie.id,
        contentType: 'movie' as const,
        title: movie.title,
        totalViews: analytics?.totalViews || 0,
        totalWatchTime: analytics?.totalWatchTime || 0,
        averageRating: analytics?.averageRating || 0,
        totalRatings: analytics?.totalRatings || 0,
        completionRate: analytics?.completionRate || 0,
        popularityScore: analytics?.popularityScore || 0,
        lastViewed: analytics?.lastViewed || new Date(movie.year ? movie.year : Date.now())
      }
    })
    
    const seriesWithAnalytics = series.map(serie => {
      const analytics = allContentAnalytics.find(a => a.contentId === serie.id)
      return {
        contentId: serie.id,
        contentType: 'series' as const,
        title: serie.title,
        totalViews: analytics?.totalViews || 0,
        totalWatchTime: analytics?.totalWatchTime || 0,
        averageRating: analytics?.averageRating || 0,
        totalRatings: analytics?.totalRatings || 0,
        completionRate: analytics?.completionRate || 0,
        popularityScore: analytics?.popularityScore || 0,
        lastViewed: analytics?.lastViewed || new Date(serie.year ? serie.year : Date.now())
      }
    })

    // Trier par nombre de vues (les plus regardés en premier), puis par popularité score
    const popularMovies = moviesWithAnalytics
      .sort((a, b) => {
        // D'abord trier par nombre de vues (décroissant)
        if (b.totalViews !== a.totalViews) {
          return b.totalViews - a.totalViews
        }
        // Si égalité, trier par popularité score
        return b.popularityScore - a.popularityScore
      })
      .slice(0, 10) // Top 10 des films les plus regardés

    const popularSeries = seriesWithAnalytics
      .sort((a, b) => {
        // D'abord trier par nombre de vues (décroissant)
        if (b.totalViews !== a.totalViews) {
          return b.totalViews - a.totalViews
        }
        // Si égalité, trier par popularité score
        return b.popularityScore - a.popularityScore
      })
      .slice(0, 10) // Top 10 des séries les plus regardées

    // Calculer les métriques géographiques
    const countryUsers: { [key: string]: number } = {}
    events.forEach(event => {
      if (event.country) {
        countryUsers[event.country] = (countryUsers[event.country] || 0) + 1
      }
    })
    const totalCountryUsers = Object.values(countryUsers).reduce((sum, count) => sum + count, 0)
    const countries = Object.entries(countryUsers)
      .map(([country, users]) => ({
        country,
        users,
        percentage: totalCountryUsers > 0 ? Math.round((users / totalCountryUsers) * 100) : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)

    // Calculer les métriques d'appareils
    const deviceCounts: { [key: string]: number } = { mobile: 0, tablet: 0, desktop: 0 }
    events.forEach(event => {
      if (event.device) {
        deviceCounts[event.device]++
      }
    })

    // Calculer les heures de pointe
    const hourCounts: { [key: number]: number } = {}
    events.forEach(event => {
      if (event.hour !== undefined) {
        hourCounts[event.hour] = (hourCounts[event.hour] || 0) + 1
      }
    })
    const totalHourUsers = Object.values(hourCounts).reduce((sum, count) => sum + count, 0)
    const peakHours = Object.entries(hourCounts)
      .map(([hour, users]) => ({
        hour: parseInt(hour),
        users,
        percentage: totalHourUsers > 0 ? Math.round((users / totalHourUsers) * 100) : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 24)

    return {
      totalUsers,
      totalContent,
      totalSessions,
      averageSessionDuration,
      mostPopularContent,
      userEngagement: {
        totalUsers,
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers
      },
      popularContent: {
        popularCatalogues,
        popularMovies,
        popularSeries
      },
      geographic: {
        countries
      },
      devices: {
        mobile: deviceCounts.mobile,
        tablet: deviceCounts.tablet,
        desktop: deviceCounts.desktop
      },
      peakHours,
      performance: {
        averagePageLoadTime: 0, // À implémenter
        errorRate: 0, // À implémenter
        cacheHitRate: 0 // À implémenter
      }
    }
  }

  // Export des données
  static exportAnalytics(): string {
    const events = this.getEvents()
    const userAnalytics = this.getUserAnalytics()
    const contentAnalytics = this.getAllContentAnalytics()
    const systemAnalytics = this.getSystemAnalytics()

    return JSON.stringify({
      events,
      userAnalytics,
      contentAnalytics,
      systemAnalytics,
      exportDate: new Date().toISOString()
    }, null, 2)
  }

  private static getEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const events = stored ? JSON.parse(stored) : []
      return events.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }))
    } catch (error) {
      logger.error('Error loading events', error as Error)
      return []
    }
  }

  // Import des données analytics
  static importAnalytics(jsonData: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Fonction non disponible côté serveur' }
    }

    try {
      const data = JSON.parse(jsonData)
      
      // Vérifier la structure des données
      if (!data.events && !data.userAnalytics && !data.contentAnalytics && !data.systemAnalytics) {
        return { success: false, message: 'Format de données invalide' }
      }

      // Importer les événements
      if (data.events && Array.isArray(data.events)) {
        const existingEvents = this.getEvents()
        const mergedEvents = [...existingEvents, ...data.events]
        
        // Limiter le nombre d'événements
        const limitedEvents = mergedEvents.slice(-this.MAX_EVENTS)
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedEvents))
      }

      // Importer les analytics utilisateur
      if (data.userAnalytics) {
        localStorage.setItem(this.USER_ANALYTICS_KEY, JSON.stringify(data.userAnalytics))
      }

      // Importer les analytics de contenu
      if (data.contentAnalytics && Array.isArray(data.contentAnalytics)) {
        const existingContent = this.getAllContentAnalytics()
        const contentMap: { [key: string]: ContentAnalytics } = {}
        
        // Merger les analytics existants
        existingContent.forEach(content => {
          contentMap[content.contentId] = content
        })
        
        // Ajouter les nouveaux analytics
        data.contentAnalytics.forEach((content: ContentAnalytics) => {
          contentMap[content.contentId] = content
        })
        
        localStorage.setItem(this.CONTENT_ANALYTICS_KEY, JSON.stringify(contentMap))
      }

      logger.info('Analytics importés avec succès')
      return { success: true, message: 'Analytics importés avec succès' }
    } catch (error) {
      logger.error('Erreur lors de l\'import des analytics', error as Error)
      return { success: false, message: `Erreur lors de l&apos;import: ${error}` }
    }
  }

  // Nettoyage des données
  static cleanupOldData(): void {
    if (typeof window === 'undefined') return

    try {
      const events = this.getEvents()
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const recentEvents = events.filter((e: AnalyticsEvent) => e.timestamp > oneMonthAgo)
      
      if (recentEvents.length !== events.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentEvents))
      }
    } catch (error) {
      logger.error('Error cleaning up old analytics data', error as Error)
    }
  }
}

// Nettoyage automatique
if (typeof window !== 'undefined') {
  // Nettoyer les anciennes données au chargement
  AnalyticsService.cleanupOldData()

  // Nettoyer toutes les 24 heures
  setInterval(() => {
    AnalyticsService.cleanupOldData()
  }, 24 * 60 * 60 * 1000)
}


