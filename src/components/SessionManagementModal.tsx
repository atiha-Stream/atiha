'use client'

import { useState } from 'react'
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, DeviceTabletIcon } from '@heroicons/react/24/outline'
import { sessionManager, UserSession } from '@/lib/session-manager'
import { logger } from '@/lib/logger'

interface SessionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  activeSessions: UserSession[]
  onSessionDisconnected: () => void
}

export default function SessionManagementModal({
  isOpen,
  onClose,
  userId,
  activeSessions,
  onSessionDisconnected
}: SessionManagementModalProps) {
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDisconnectSession = async (deviceId: string) => {
    setIsDisconnecting(deviceId)
    
    try {
      const success = sessionManager.removeSession(userId, deviceId)
      if (success) {
        onSessionDisconnected()
        // Si c'est la dernière session, fermer le modal
        if (activeSessions.length <= 1) {
          onClose()
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', error as Error)
    } finally {
      setIsDisconnecting(null)
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    const agent = userAgent.toLowerCase()
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return <DeviceTabletIcon className="w-5 h-5" />
    } else {
      return <ComputerDesktopIcon className="w-5 h-5" />
    }
  }

  const getDeviceType = (userAgent: string) => {
    const agent = userAgent.toLowerCase()
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return 'Mobile'
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return 'Tablette'
    } else {
      return 'Ordinateur'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-400 rounded-lg border border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-white">Gestion des Sessions</h3>
            <p className="text-gray-400 text-sm mt-1">
              Limite d&apos;appareils atteinte
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-400 font-medium">Attention</span>
            </div>
            <p className="text-gray-300 text-sm">
              Vous êtes connecté sur <span className="font-semibold text-white">{activeSessions.length}</span> appareil(s). 
              Déconnectez-vous d&apos;un appareil pour vous connecter ici.
            </p>
          </div>

          {/* Sessions List */}
          <div className="space-y-3 mb-6">
            {activeSessions.map((session, index) => (
              <div key={session.deviceId} className="flex items-center justify-between p-4 bg-dark-300 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-dark-200 rounded-lg flex items-center justify-center">
                    {getDeviceIcon(session.deviceInfo.userAgent)}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {getDeviceType(session.deviceInfo.userAgent)} #{index + 1}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {session.deviceInfo.platform}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Dernière activité: {new Date(session.lastActivity).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnectSession(session.deviceId)}
                  disabled={isDisconnecting === session.deviceId}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  {isDisconnecting === session.deviceId ? 'Déconnexion...' : 'Déconnecter'}
                </button>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-400 mt-0.5">💡</div>
              <div>
                <p className="text-blue-300 text-sm font-medium mb-1">
                  Comment ça fonctionne ?
                </p>
                <p className="text-blue-200 text-xs">
                  Chaque type d&apos;abonnement a une limite d&apos;appareils. Déconnectez-vous d&apos;un appareil 
                  pour libérer un emplacement et vous connecter sur un nouvel appareil.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  )
}
