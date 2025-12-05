'use client'

import React, { useState, useEffect } from 'react'
import { 
  WifiIcon, 
  SignalSlashIcon
} from '@heroicons/react/24/outline'

interface OfflineData {
  isOnline: boolean
  lastOnline: Date | null
  offlineCount: number
}

export default function HeaderStatusIndicator() {
  const [offlineData, setOfflineData] = useState<OfflineData>({
    isOnline: true,
    lastOnline: null,
    offlineCount: 0
  })

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
    }

    const handleOffline = () => {
      setOfflineData(prev => ({
        isOnline: false,
        lastOnline: prev.lastOnline,
        offlineCount: prev.offlineCount + 1
      }))
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

  // Indicateur compact pour le header - ne s&apos;affiche que si hors ligne
  if (offlineData.isOnline) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded-md text-xs">
        <SignalSlashIcon className="w-3 h-3" />
        <span className="font-medium">Hors ligne</span>
      </div>
    </div>
  )
}
