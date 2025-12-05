'use client'

import React, { useState, useEffect } from 'react'
import { Notification, NotificationService } from '@/lib/notification-service'
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'

interface NotificationCenterProps {
  className?: string
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Charger les notifications initiales
    loadNotifications()

    // Écouter les événements de notifications
    const handleNotificationAdded = () => loadNotifications()
    const handleNotificationRead = () => loadNotifications()
    const handleNotificationDeleted = () => loadNotifications()
    const handleAllNotificationsRead = () => loadNotifications()
    const handleNotificationsCleared = () => loadNotifications()

    window.addEventListener('notificationAdded', handleNotificationAdded)
    window.addEventListener('notificationRead', handleNotificationRead)
    window.addEventListener('notificationDeleted', handleNotificationDeleted)
    window.addEventListener('allNotificationsRead', handleAllNotificationsRead)
    window.addEventListener('notificationsCleared', handleNotificationsCleared)

    return () => {
      window.removeEventListener('notificationAdded', handleNotificationAdded)
      window.removeEventListener('notificationRead', handleNotificationRead)
      window.removeEventListener('notificationDeleted', handleNotificationDeleted)
      window.removeEventListener('allNotificationsRead', handleAllNotificationsRead)
      window.removeEventListener('notificationsCleared', handleNotificationsCleared)
    }
  }, [])

  const loadNotifications = () => {
    const allNotifications = NotificationService.getNotifications()
    setNotifications(allNotifications)
    setUnreadCount(NotificationService.getUnreadCount())
  }

  const handleMarkAsRead = (notificationId: string) => {
    NotificationService.markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead()
  }

  const handleDeleteNotification = (notificationId: string) => {
    NotificationService.deleteNotification(notificationId)
  }

  const handleClearAll = () => {
    NotificationService.clearAllNotifications()
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-500/10'
      case 'error':
        return 'border-l-red-500 bg-red-500/10'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/10'
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-500/10'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    return timestamp.toLocaleDateString('fr-FR')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="w-6 h-6 text-primary-400" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        
        {/* Badge de notification */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-dark-200 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* En-tête */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Tout effacer
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'bg-dark-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium text-sm">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title="Marquer comme lu"
                              >
                                <CheckIcon className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-500 text-xs">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          {notification.actionUrl && notification.actionText && (
                            <a
                              href={notification.actionUrl}
                              className="text-primary-400 hover:text-primary-300 text-xs font-medium transition-colors"
                            >
                              {notification.actionText}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay pour fermer le panneau */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}


