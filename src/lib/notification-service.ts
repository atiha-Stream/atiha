'use client'

import { logger } from './logger'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
  persistent?: boolean
  autoClose?: boolean
  duration?: number // en millisecondes
}

export interface NotificationPreferences {
  newContentNotifications: boolean
  watchlistReminders: boolean
  systemUpdates: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
}

export class NotificationService {
  private static readonly STORAGE_KEY = 'atiha_notifications'
  private static readonly PREFERENCES_KEY = 'atiha_notification_preferences'
  private static readonly MAX_NOTIFICATIONS = 100

  // Gestion des notifications
  static getNotifications(): Notification[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const notifications = JSON.parse(stored)
      return notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
    } catch (error) {
      logger.error('Error loading notifications', error as Error)
      return []
    }
  }

  static addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    if (typeof window === 'undefined') return

    try {
      const notifications = this.getNotifications()
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false
      }

      // Ajouter en début de liste
      notifications.unshift(newNotification)

      // Limiter le nombre de notifications
      if (notifications.length > this.MAX_NOTIFICATIONS) {
        notifications.splice(this.MAX_NOTIFICATIONS)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications))

      // Déclencher l'événement personnalisé
      window.dispatchEvent(new CustomEvent('notificationAdded', { 
        detail: newNotification 
      }))
    } catch (error) {
      logger.error('Error adding notification', error as Error)
    }
  }

  static markAsRead(notificationId: string): void {
    if (typeof window === 'undefined') return

    try {
      const notifications = this.getNotifications()
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedNotifications))

      // Déclencher l'événement personnalisé
      window.dispatchEvent(new CustomEvent('notificationRead', { 
        detail: { notificationId } 
      }))
    } catch (error) {
      logger.error('Error marking notification as read', error as Error)
    }
  }

  static markAllAsRead(): void {
    if (typeof window === 'undefined') return

    try {
      const notifications = this.getNotifications()
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }))

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedNotifications))

      // Déclencher l'événement personnalisé
      window.dispatchEvent(new CustomEvent('allNotificationsRead'))
    } catch (error) {
      logger.error('Error marking all notifications as read', error as Error)
    }
  }

  static deleteNotification(notificationId: string): void {
    if (typeof window === 'undefined') return

    try {
      const notifications = this.getNotifications()
      const updatedNotifications = notifications.filter(n => n.id !== notificationId)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedNotifications))

      // Déclencher l'événement personnalisé
      window.dispatchEvent(new CustomEvent('notificationDeleted', { 
        detail: { notificationId } 
      }))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  static clearAllNotifications(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)

      // Déclencher l'événement personnalisé
      window.dispatchEvent(new CustomEvent('notificationsCleared'))
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  static getUnreadCount(): number {
    const notifications = this.getNotifications()
    return notifications.filter(n => !n.read).length
  }

  // Gestion des préférences
  static getPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return {
        newContentNotifications: true,
        watchlistReminders: true,
        systemUpdates: true,
        emailNotifications: false,
        pushNotifications: true,
        soundEnabled: true
      }
    }

    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY)
      if (!stored) {
        return {
          newContentNotifications: true,
          watchlistReminders: true,
          systemUpdates: true,
          emailNotifications: false,
          pushNotifications: true,
          soundEnabled: true
        }
      }

      return JSON.parse(stored)
    } catch (error) {
      console.error('Error loading notification preferences:', error)
      return {
        newContentNotifications: true,
        watchlistReminders: true,
        systemUpdates: true,
        emailNotifications: false,
        pushNotifications: true,
        soundEnabled: true
      }
    }
  }

  static updatePreferences(preferences: Partial<NotificationPreferences>): void {
    if (typeof window === 'undefined') return

    try {
      const currentPreferences = this.getPreferences()
      const updatedPreferences = { ...currentPreferences, ...preferences }

      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updatedPreferences))

      // Déclencher l'événement personnalisé
      window.dispatchEvent(new CustomEvent('notificationPreferencesUpdated', { 
        detail: updatedPreferences 
      }))
    } catch (error) {
      console.error('Error updating notification preferences:', error)
    }
  }

  // Notifications automatiques
  static notifyNewContent(content: { title: string; type: 'movie' | 'series' }): void {
    const preferences = this.getPreferences()
    
    if (!preferences.newContentNotifications) return

    this.addNotification({
      type: 'info',
      title: 'Nouveau contenu disponible',
      message: `&quot;${content.title}&quot; (${content.type === 'movie' ? 'Film' : 'Série'}) a été ajouté`,
      actionUrl: '/dashboard',
      actionText: 'Voir',
      autoClose: true,
      duration: 5000
    })
  }

  static notifyWatchlistReminder(content: { title: string; type: 'movie' | 'series' }): void {
    const preferences = this.getPreferences()
    
    if (!preferences.watchlistReminders) return

    this.addNotification({
      type: 'warning',
      title: 'Rappel de votre liste de souhaits',
      message: `"${content.title}" est toujours dans votre liste de souhaits`,
      actionUrl: '/profile',
      actionText: 'Voir ma liste',
      persistent: true
    })
  }

  static notifySystemUpdate(message: string): void {
    const preferences = this.getPreferences()
    
    if (!preferences.systemUpdates) return

    this.addNotification({
      type: 'info',
      title: 'Mise à jour du système',
      message,
      autoClose: true,
      duration: 7000
    })
  }

  // Notifications de succès/erreur
  static notifySuccess(title: string, message: string): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      autoClose: true,
      duration: 3000
    })
  }

  static notifyError(title: string, message: string): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      persistent: true
    })
  }

  static notifyWarning(title: string, message: string): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      autoClose: true,
      duration: 5000
    })
  }

  static notifyInfo(title: string, message: string): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      autoClose: true,
      duration: 4000
    })
  }

  // Nettoyage automatique des anciennes notifications
  static cleanupOldNotifications(): void {
    if (typeof window === 'undefined') return

    try {
      const notifications = this.getNotifications()
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const recentNotifications = notifications.filter(n => 
        n.timestamp > oneWeekAgo || n.persistent
      )

      if (recentNotifications.length !== notifications.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentNotifications))
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
    }
  }
}

// Nettoyage automatique au chargement
if (typeof window !== 'undefined') {
  // Nettoyer les anciennes notifications au chargement
  NotificationService.cleanupOldNotifications()

  // Nettoyer toutes les 24 heures
  setInterval(() => {
    NotificationService.cleanupOldNotifications()
  }, 24 * 60 * 60 * 1000)
}


