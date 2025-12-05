'use client'

import React, { useState, useEffect } from 'react'
import { 
  WifiIcon, 
  SignalSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface OfflineData {
  isOnline: boolean
  lastOnline: Date | null
  offlineCount: number
}

export default function OfflineIndicator() {
  const [offlineData, setOfflineData] = useState<OfflineData>({
    isOnline: true,
    lastOnline: null,
    offlineCount: 0
  })
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Charger les données offline depuis le localStorage
    const savedData = localStorage.getItem('atiha-offline-data')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setOfflineData({
        ...parsed,
        lastOnline: parsed.lastOnline ? new Date(parsed.lastOnline) : null
      })
    }

    // Écouter les changements de connectivité
    const handleOnline = () => {
      setOfflineData(prev => ({
        isOnline: true,
        lastOnline: new Date(),
        offlineCount: prev.offlineCount
      }))
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setOfflineData(prev => ({
        isOnline: false,
        lastOnline: prev.lastOnline,
        offlineCount: prev.offlineCount + 1
      }))
      setShowOfflineMessage(true)
    }

    // Vérifier l'état initial
    if (!navigator.onLine) {
      handleOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sauvegarder les données offline
  useEffect(() => {
    localStorage.setItem('atiha-offline-data', JSON.stringify(offlineData))
  }, [offlineData])

  const dismissOfflineMessage = () => {
    setShowOfflineMessage(false)
  }

  // Ne pas afficher l'indicateur "En ligne" (géré par HeaderStatusIndicator)
  if (offlineData.isOnline) {
    return null
  }

  // Message offline complet
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-dark-200 rounded-xl shadow-2xl max-w-md w-full border border-red-500/30">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <SignalSlashIcon className="w-8 h-8 text-red-400" />
              <div>
                <h2 className="text-white font-bold text-xl">Mode Hors Ligne</h2>
                <p className="text-gray-400 text-sm">
                  Vous n&apos;êtes pas connecté à Internet
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-400 font-semibold mb-2">Fonctionnalités limitées</h3>
                    <ul className="text-red-300 text-sm space-y-1">
                      <li>• Lecture des vidéos en cache uniquement</li>
                      <li>• Pas de nouveaux contenus</li>
                      <li>• Pas de synchronisation des données</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-2">Fonctionnalités disponibles</h3>
                    <ul className="text-blue-300 text-sm space-y-1">
                      <li>• Navigation dans l&apos;interface</li>
                      <li>• Consultation des contenus en cache</li>
                      <li>• Gestion des favoris locaux</li>
                    </ul>
                  </div>
                </div>
              </div>

              {offlineData.lastOnline && (
                <div className="text-center text-gray-400 text-sm">
                  <p>Dernière connexion : {offlineData.lastOnline.toLocaleString('fr-FR')}</p>
                  {offlineData.offlineCount > 1 && (
                    <p>Déconnexions totales : {offlineData.offlineCount}</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={dismissOfflineMessage}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Continuer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook pour gérer l'état offline
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineData, setOfflineData] = useState<OfflineData>({
    isOnline: true,
    lastOnline: null,
    offlineCount: 0
  })

  useEffect(() => {
    // Charger les données sauvegardées
    const savedData = localStorage.getItem('atiha-offline-data')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setOfflineData({
        ...parsed,
        lastOnline: parsed.lastOnline ? new Date(parsed.lastOnline) : null
      })
    }

    const handleOnline = () => {
      setIsOnline(true)
      setOfflineData(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date()
      }))
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOfflineData(prev => ({
        ...prev,
        isOnline: false,
        offlineCount: prev.offlineCount + 1
      }))
    }

    // État initial
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sauvegarder les données
  useEffect(() => {
    localStorage.setItem('atiha-offline-data', JSON.stringify(offlineData))
  }, [offlineData])

  return {
    isOnline,
    offlineData,
    isOffline: !isOnline
  }
}
