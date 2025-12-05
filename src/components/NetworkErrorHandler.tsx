'use client'

import React, { useEffect, useState } from 'react'
import { ErrorLogger } from '@/lib/error-logger'
import { ErrorAlert } from '@/components/ErrorMessage'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface NetworkErrorHandlerProps {
  children: React.ReactNode
}

export function NetworkErrorHandler({ children }: NetworkErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [showReconnectMessage, setShowReconnectMessage] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      
      // Afficher le message de reconnexion seulement si on était déconnecté
      if (wasOffline) {
        setShowReconnectMessage(true)
        setWasOffline(false)
        
        // Auto-masquer après 3 secondes
        setTimeout(() => {
          setShowReconnectMessage(false)
        }, 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      setWasOffline(true)
      setShowReconnectMessage(false)
      
      // Logger l&apos;erreur de réseau
      ErrorLogger.log(
        new Error('Connexion réseau perdue'),
        'high',
        'network',
        { timestamp: new Date().toISOString() }
      )
    }

    // Vérifier l'état initial
    setIsOnline(navigator.onLine)

    // Écouter les changements d'état
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return (
    <>
      {children}
      
      {/* Message de déconnexion */}
      {showOfflineMessage && (
        <div className="fixed top-4 right-4 z-40 max-w-sm">
          <ErrorAlert
            title="Connexion perdue"
            message="Vérifiez votre connexion internet. Certaines fonctionnalités peuvent être limitées."
            onClose={() => setShowOfflineMessage(false)}
          />
        </div>
      )}
      
      {/* Message de reconnexion */}
      {showReconnectMessage && (
        <div className="fixed top-4 right-4 z-40 max-w-sm">
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connexion rétablie</span>
              </div>
              <button
                onClick={() => setShowReconnectMessage(false)}
                className="text-green-400 hover:text-green-300 ml-2"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Hook pour vérifier l'état de la connexion
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Détecter les connexions lentes
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    checkConnectionSpeed()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isSlowConnection }
}
