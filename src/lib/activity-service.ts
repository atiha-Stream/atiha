'use client'

import { logger } from './logger'

export interface Activity {
  id: string
  type: 'user' | 'content' | 'system' | 'security' | 'admin'
  severity: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: Date
  metadata?: {
    userId?: string
    userName?: string
    userEmail?: string
    contentId?: string
    contentTitle?: string
    ipAddress?: string
    userAgent?: string
    url?: string
    [key: string]: any
  }
}

export class ActivityService {
  private static readonly STORAGE_KEY = 'atiha_activities'
  private static readonly MAX_ACTIVITIES = 100

  // Enregistrer une nouvelle activité
  static logActivity(
    type: Activity['type'],
    severity: Activity['severity'],
    message: string,
    metadata?: Activity['metadata']
  ): void {
    if (typeof window === 'undefined') return

    const activity: Activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata
    }

    this.storeActivity(activity)
  }

  // Méthodes de logging spécifiques
  static logUserActivity(
    severity: Activity['severity'],
    message: string,
    metadata?: Activity['metadata']
  ): void {
    this.logActivity('user', severity, message, metadata)
  }

  static logContentActivity(
    severity: Activity['severity'],
    message: string,
    metadata?: Activity['metadata']
  ): void {
    this.logActivity('content', severity, message, metadata)
  }

  static logSystemActivity(
    severity: Activity['severity'],
    message: string,
    metadata?: Activity['metadata']
  ): void {
    this.logActivity('system', severity, message, metadata)
  }

  static logSecurityActivity(
    severity: Activity['severity'],
    message: string,
    metadata?: Activity['metadata']
  ): void {
    this.logActivity('security', severity, message, metadata)
  }

  static logAdminActivity(
    severity: Activity['severity'],
    message: string,
    metadata?: Activity['metadata']
  ): void {
    this.logActivity('admin', severity, message, metadata)
  }

  // Récupérer les activités récentes
  static getRecentActivities(limit: number = 20): Activity[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const activities = stored ? JSON.parse(stored) : []
      
      // Convertir les timestamps en Date
      const parsedActivities = activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }))
      
      // Trier par timestamp (plus récent en premier)
      return parsedActivities
        .sort((a: Activity, b: Activity) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    } catch (error) {
      logger.error('Error loading activities', error as Error)
      return []
    }
  }

  // Récupérer les activités par type
  static getActivitiesByType(type: Activity['type'], limit: number = 20): Activity[] {
    const allActivities = this.getRecentActivities(100)
    return allActivities
      .filter(activity => activity.type === type)
      .slice(0, limit)
  }

  // Récupérer les activités par gravité
  static getActivitiesBySeverity(severity: Activity['severity'], limit: number = 20): Activity[] {
    const allActivities = this.getRecentActivities(100)
    return allActivities
      .filter(activity => activity.severity === severity)
      .slice(0, limit)
  }

  // Supprimer une activité
  static deleteActivity(activityId: string): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const activities = stored ? JSON.parse(stored) : []
      
      const filteredActivities = activities.filter((activity: Activity) => activity.id !== activityId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredActivities))
    } catch (error) {
      logger.error('Error deleting activity', error as Error)
    }
  }

  // Vider toutes les activités
  static clearAllActivities(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      logger.error('Error clearing activities', error as Error)
    }
  }

  // Stocker une activité
  private static storeActivity(activity: Activity): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const activities = stored ? JSON.parse(stored) : []
      
      activities.push(activity)
      
      // Limiter le nombre d'activités
      if (activities.length > this.MAX_ACTIVITIES) {
        activities.splice(0, activities.length - this.MAX_ACTIVITIES)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities))
    } catch (error) {
      logger.error('Error storing activity', error as Error)
    }
  }

  // Nettoyer les anciennes activités (plus de 30 jours)
  static cleanupOldActivities(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const activities = stored ? JSON.parse(stored) : []
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const recentActivities = activities.filter((activity: any) => 
        new Date(activity.timestamp) > thirtyDaysAgo
      )
      
      if (recentActivities.length !== activities.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentActivities))
      }
    } catch (error) {
      console.error('Error cleaning up old activities:', error)
    }
  }

  // Obtenir les statistiques d'activité
  static getActivityStats(): {
    total: number
    byType: { [key in Activity['type']]: number }
    bySeverity: { [key in Activity['severity']]: number }
    recent: number // Activités des dernières 24h
  } {
    const activities = this.getRecentActivities(1000)
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const byType: { [key in Activity['type']]: number } = {
      user: 0,
      content: 0,
      system: 0,
      security: 0,
      admin: 0
    }

    const bySeverity: { [key in Activity['severity']]: number } = {
      info: 0,
      warning: 0,
      error: 0,
      success: 0
    }

    let recent = 0

    activities.forEach(activity => {
      byType[activity.type]++
      bySeverity[activity.severity]++
      
      if (activity.timestamp > oneDayAgo) {
        recent++
      }
    })

    return {
      total: activities.length,
      byType,
      bySeverity,
      recent
    }
  }
}

// Nettoyage automatique des anciennes activités
if (typeof window !== 'undefined') {
  // Nettoyer au chargement
  ActivityService.cleanupOldActivities()

  // Nettoyer toutes les 24 heures
  setInterval(() => {
    ActivityService.cleanupOldActivities()
  }, 24 * 60 * 60 * 1000)
}
