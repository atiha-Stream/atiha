'use client'

import React, { useState, useEffect } from 'react'
import { 
  BellIcon, 
  BellSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { logger } from '@/lib/logger'

interface NotificationState {
  permission: NotificationPermission
  isSupported: boolean
}

export default function PushNotifications() {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default' as NotificationPermission,
    isSupported: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Vérifier le support des notifications
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator
    const permission = (isSupported ? Notification.permission : 'denied') as NotificationPermission
    
    setNotificationState({ permission, isSupported })
  }, [])

  const requestNotificationPermission = async () => {
    if (!notificationState.isSupported) {
      setMessage('Les notifications ne sont pas supportées sur votre navigateur')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const permission = (await Notification.requestPermission()) as NotificationPermission
      setNotificationState(prev => ({ ...prev, permission }))

      if (permission === 'granted') {
        setMessage('✅ Notifications activées ! Vous recevrez des alertes pour les nouveaux contenus.')
        
        // Enregistrer le service worker pour les notifications
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            logger.info('Service Worker enregistré', { registration })
          } catch (error) {
            logger.error('Erreur d\'enregistrement du Service Worker', error as Error)
          }
        }

        // Envoyer une notification de test
        setTimeout(() => {
          const appName = isClient ? content.appIdentity.name : 'Atiha'
          new Notification(`${appName} - Notifications activées`, {
            body: 'Vous recevrez maintenant des notifications pour les nouveaux films et séries !',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'atiha-notifications',
            requireInteraction: false
          })
        }, 1000)

      } else if (permission === 'denied') {
        setMessage('❌ Notifications refusées. Vous pouvez les activer dans les paramètres de votre navigateur.')
      } else {
        setMessage('⏳ Notifications en attente. Veuillez autoriser les notifications dans votre navigateur.')
      }
    } catch (error) {
      logger.error('Erreur lors de la demande de permission', error as Error)
      setMessage('❌ Erreur lors de l\'activation des notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestNotification = () => {
    if (notificationState.permission === 'granted') {
      const appName = isClient ? content.appIdentity.name : 'Atiha'
      new Notification(`${appName} - Test de notification`, {
        body: 'Ceci est une notification de test pour vérifier que tout fonctionne correctement !',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'atiha-test',
        requireInteraction: false
      })
    }
  }

  if (!notificationState.isSupported) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
          <div>
            <h3 className="text-yellow-400 font-semibold">Notifications non supportées</h3>
            <p className="text-yellow-300 text-sm">
              Votre navigateur ne supporte pas les notifications push.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-4">
            {notificationState.permission === 'granted' ? (
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
            ) : (
              <BellIcon className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <h3 className="text-white font-semibold text-lg">Notifications Push</h3>
              <p className="text-gray-400 text-sm">
                Recevez des alertes pour les nouveaux films et séries
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {notificationState.permission === 'granted' && (
              <button
                onClick={sendTestNotification}
                className="w-full sm:w-auto px-3 py-1.5 sm:py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs sm:text-sm transition-colors"
              >
                Test
              </button>
            )}
            
            <button
              onClick={requestNotificationPermission}
              disabled={isLoading || notificationState.permission === 'granted'}
              className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              style={isClient ? { 
                backgroundColor: content.appIdentity.colors.primary,
                '--hover-color': content.appIdentity.colors.secondary
              } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
              onMouseEnter={(e) => {
                if (isClient && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                }
              }}
              onMouseLeave={(e) => {
                if (isClient && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                }
              }}
            >
              {isLoading ? 'Chargement...' : 
               notificationState.permission === 'granted' ? 'Activées' :
               notificationState.permission === 'denied' ? 'Réactiver' : 'Activer'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 text-green-300' :
            message.includes('❌') ? 'bg-red-900/20 text-red-300' :
            'bg-blue-900/20 text-blue-300'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-4 space-y-2 text-sm text-gray-400">
          <p><strong>Statut actuel :</strong> {
            notificationState.permission === 'granted' ? '✅ Autorisées' :
            notificationState.permission === 'denied' ? '❌ Refusées' :
            '⏳ En attente'
          }</p>
          
          {notificationState.permission === 'granted' && (
            <div className="space-y-1">
              <p><strong>Vous recevrez des notifications pour :</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nouveaux films ajoutés</li>
                <li>Nouvelles séries disponibles</li>
                <li>Nouveaux épisodes de vos séries suivies</li>
                <li>Mises à jour importantes de l&apos;application</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {notificationState.permission === 'denied' && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <BellSlashIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-semibold">Notifications refusées</h4>
              <p className="text-red-300 text-sm mt-1">
                Pour réactiver les notifications :
              </p>
              <ol className="text-red-300 text-sm mt-2 space-y-1 list-decimal list-inside">
                <li>Cliquez sur l&apos;icône de cadenas dans la barre d&apos;adresse</li>
                <li>Sélectionnez &quot;Autoriser&quot; pour les notifications</li>
                <li>Rechargez la page</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook pour gérer les notifications
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const supported = 'Notification' in window
    setIsSupported(supported)
    
    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'atiha-notification',
        ...options
      })
    }
  }

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied'
    
    const newPermission = await Notification.requestPermission()
    setPermission(newPermission)
    return newPermission
  }

  return {
    permission,
    isSupported,
    sendNotification,
    requestPermission,
    canSend: permission === 'granted'
  }
}
