'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, DeviceTabletIcon, TrashIcon, ShieldCheckIcon, ClockIcon, KeyIcon } from '@heroicons/react/24/outline'
import { sessionManager, UserSession } from '@/lib/session-manager'
import { premiumCodesService, PremiumCode } from '@/lib/premium-codes-service'
import { userDatabase, UserRecord } from '@/lib/user-database'
import PremiumHistoryModal from './PremiumHistoryModal'
import SubscriptionManagementModal from './SubscriptionManagementModal'
import { logger } from '@/lib/logger'

// Fonction pour obtenir la limite réelle d'appareils selon le type de code
const getRealMaxDevicesForCode = (type: string): number => {
  // Pour les codes d'inscription (essai gratuit), le système de sessions ne gère pas de limite
  // Donc on retourne "Illimité" ou un nombre très élevé pour l'affichage
  if (type === 'inscription') {
    return 999 // Pas de limite pour l'essai gratuit
  }
  
  // Pour les autres types, utiliser la même logique que sessionManager
  switch(type) {
    case 'individuel':
    case 'individuel-annuel':
    case 'plan-premium':
    case 'post-payment-individuel':
    case 'post-payment-individuel-flexible':
      return 1
    case 'famille':
    case 'famille-annuel':
    case 'post-payment-famille':
    case 'post-payment-famille-flexible':
      return 5
    default:
      return 1
  }
}

interface UserSessionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserRecord | null
}

export default function UserSessionManagementModal({
  isOpen,
  onClose,
  user
}: UserSessionManagementModalProps) {
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([])
  const [premiumCode, setPremiumCode] = useState<PremiumCode | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadUserData()
      
      // Rafraîchir les données toutes les 5 secondes
      const interval = setInterval(loadUserData, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, user])

  const loadUserData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Charger les sessions actives
      const activeSessions = sessionManager.getUserActiveSessions(user.id)
      setActiveSessions(activeSessions)

      // Charger le code premium utilisé
      const userPremiumStatus = premiumCodesService.getUserPremiumStatus(user.id)
      if (userPremiumStatus.isPremium && userPremiumStatus.codeId) {
        const allCodes = premiumCodesService.getAllCodes()
        const usedCode = allCodes.find(code => code.id === userPremiumStatus.codeId)
        setPremiumCode(usedCode || null)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des données utilisateur', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnectSession = async (deviceId: string) => {
    if (!user) return
    
    setIsDisconnecting(deviceId)
    try {
      const success = sessionManager.removeSession(user.id, deviceId)
      if (success) {
        // Recharger les sessions
        await loadUserData()
      }
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', error as Error)
    } finally {
      setIsDisconnecting(null)
    }
  }

  const handleDisconnectAllSessions = async () => {
    if (!user) return
    
    setIsDisconnecting('all')
    try {
      // Déconnecter toutes les sessions
      activeSessions.forEach(session => {
        sessionManager.removeSession(user.id, session.deviceId)
      })
      
      // Recharger les sessions
      await loadUserData()
    } catch (error) {
      logger.error('Erreur lors de la déconnexion de toutes les sessions', error as Error)
    } finally {
      setIsDisconnecting(null)
    }
  }

  const handleShowHistory = () => {
    setShowHistoryModal(true)
  }

  const handleManageSubscription = () => {
    setShowSubscriptionModal(true)
  }

  const getDeviceIcon = (userAgent: string) => {
    const agent = userAgent.toLowerCase()
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <DevicePhoneMobileIcon className="w-5 h-5 text-blue-400" />
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return <DeviceTabletIcon className="w-5 h-5 text-green-400" />
    } else {
      return <ComputerDesktopIcon className="w-5 h-5 text-purple-400" />
    }
  }

  const getDeviceType = (userAgent: string) => {
    const agent = userAgent.toLowerCase()
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return '📱 Téléphone'
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return '📱 Tablette'
    } else {
      return '💻 Ordinateur'
    }
  }

  const getBrowserInfo = (userAgent: string) => {
    const agent = userAgent.toLowerCase()
    if (agent.includes('chrome')) return 'Chrome'
    if (agent.includes('firefox')) return 'Firefox'
    if (agent.includes('safari')) return 'Safari'
    if (agent.includes('edge')) return 'Edge'
    return 'Navigateur inconnu'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'inscription': 'Essai Gratuit (5 jours)',
      'inscription-flexible': 'Essai Gratuit flexible (durée personnalisée)',
      'individuel': 'Individuel (30 jours)',
      'famille': 'Famille (30 jours)',
      'individuel-annuel': 'Individuel Annuel (1 an)',
      'famille-annuel': 'Famille Annuel (1 an)',
      'plan-premium': 'Plan Premium (30 jours)',
      'post-payment-individuel': 'Post-paiement Individuel (30 jours)',
      'post-payment-famille': 'Post-paiement Famille (30 jours)',
      'post-payment-individuel-annuel': 'Post-paiement Individuel (1 an)',
      'post-payment-famille-annuel': 'Post-paiement Famille (1 an)',
      'post-payment-individuel-flexible': 'Post-paiement Individuel flexible (30 jours)',
      'post-payment-famille-flexible': 'Post-paiement Famille flexible (30 jours)'
    }
    return labels[type] || type
  }

  // Utiliser la fonction globale pour obtenir la limite réelle
  const getMaxDevicesForCode = getRealMaxDevicesForCode

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide border border-gray-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">Gestion des Sessions</h3>
              <p className="text-gray-400 mt-1">{user.name} ({user.email})</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Chargement...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informations Premium */}
              <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center space-x-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Statut Premium</h4>
                </div>
                
                {premiumCode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Code utilisé</p>
                      <p className="text-white font-mono bg-dark-200 px-3 py-1 rounded text-sm">
                        {premiumCode.code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Type d&apos;abonnement</p>
                      <p className="text-white">{getCodeTypeLabel(premiumCode.type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Limite d&apos;appareils</p>
                      <p className="text-white">
                        {getMaxDevicesForCode(premiumCode.type) >= 999 
                          ? 'Illimité' 
                          : `${getMaxDevicesForCode(premiumCode.type)} appareil(s) simultané(s)`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Expire le</p>
                      <p className="text-white">{formatDate(premiumCode.expiresAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Aucun abonnement premium actif</p>
                  </div>
                )}
              </div>

              {/* Sessions Actives */}
              <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-green-400" />
                    <h4 className="text-lg font-semibold text-white">
                      Sessions Actives ({activeSessions.length})
                    </h4>
                  </div>
                  
                  {activeSessions.length > 0 && (
                    <button
                      onClick={handleDisconnectAllSessions}
                      disabled={isDisconnecting === 'all'}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isDisconnecting === 'all' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                      <span>Déconnecter tout</span>
                    </button>
                  )}
                </div>

                {activeSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <DevicePhoneMobileIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Aucune session active</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div
                        key={session.deviceId}
                        className="bg-dark-200 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {getDeviceIcon(session.deviceInfo.userAgent)}
                            <div>
                              <p className="text-white font-medium">
                                {getDeviceType(session.deviceInfo.userAgent)}
                              </p>
                              <p className="text-sm text-gray-400">
                                {session.deviceInfo.platform} • {getBrowserInfo(session.deviceInfo.userAgent)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Dernière activité: {formatDate(session.lastActivity)}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDisconnectSession(session.deviceId)}
                            disabled={isDisconnecting === session.deviceId}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            {isDisconnecting === session.deviceId ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                            <span>Déconnecter</span>
                          </button>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            <p>ID: {session.deviceId.substring(0, 8)}...</p>
                            <p>Navigateur: {getBrowserInfo(session.deviceInfo.userAgent)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-400">En ligne</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Admin */}
              <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-4">Actions Administrateur</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={handleManageSubscription}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-3"
                  >
                    <KeyIcon className="w-5 h-5" />
                    <span>Gérer l&apos;abonnement</span>
                  </button>
                  <button 
                    onClick={handleShowHistory}
                    className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-3"
                  >
                    <ClockIcon className="w-5 h-5" />
                    <span>Voir l&apos;historique</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modal d&apos;historique des codes premium */}
      {showHistoryModal && (
        <PremiumHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          user={user}
        />
      )}

      {/* Modal de gestion d&apos;abonnement */}
      {showSubscriptionModal && (
        <SubscriptionManagementModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          user={user}
          onSuccess={() => {
            setShowSubscriptionModal(false)
            loadUserData() // Recharger les données utilisateur
          }}
        />
      )}
    </div>
  )
}
