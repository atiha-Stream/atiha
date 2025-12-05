'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { UserRecord } from '@/lib/user-database'
import { premiumCodesService, PremiumCode, PremiumCodeType } from '@/lib/premium-codes-service'
import { logger } from '@/lib/logger'

interface SubscriptionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserRecord | null
  onSuccess: () => void
}

export default function SubscriptionManagementModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess 
}: SubscriptionManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'activate' | 'manage'>('activate')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // État pour l&apos;activation manuelle de codes
  const [manualCode, setManualCode] = useState('')
  
  // État pour la gestion de l&apos;abonnement actuel
  const [currentSubscription, setCurrentSubscription] = useState<{
    isPremium: boolean
    codeId?: string
    activatedAt?: string
    expiresAt?: string
  } | null>(null)
  
  // État pour les codes activés par l&apos;utilisateur
  const [userActivatedCodes, setUserActivatedCodes] = useState<Array<{
    code: PremiumCode
    usedAt: string
    index: number
  }>>([])
  const [selectedCodeToDeactivate, setSelectedCodeToDeactivate] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      loadData()
    }
  }, [isOpen, user])

  const loadData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Charger l&apos;abonnement actuel
      const premiumStatus = premiumCodesService.getUserPremiumStatus(user.id)
      setCurrentSubscription(premiumStatus)
      
      // Charger tous les codes activés par l&apos;utilisateur
      const userHistory = premiumCodesService.getUserCompletePremiumHistory(user.id)
      setUserActivatedCodes(userHistory)
      
    } catch (error) {
      logger.error('Erreur lors du chargement des données', error as Error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateManualCode = async () => {
    if (!user || !manualCode.trim()) return
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      const success = premiumCodesService.activateCodeForUser(manualCode.trim(), user.id)
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: `Code activé avec succès pour ${user.name}` 
        })
        setManualCode('') // Vider le champ
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: 'Code invalide ou déjà utilisé' })
      }
      
    } catch (error) {
      logger.error('Erreur lors de l\'activation du code', error as Error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'activation du code' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateSpecificCode = async () => {
    if (!user || !selectedCodeToDeactivate || !confirm('Êtes-vous sûr de vouloir désactiver ce code pour cet utilisateur ?')) return
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      // Trouver le code sélectionné
      const selectedEntry = userActivatedCodes.find(entry => entry.code.id === selectedCodeToDeactivate)
      if (!selectedEntry) {
        setMessage({ type: 'error', text: 'Code sélectionné introuvable' })
        return
      }
      
      // Désactiver le code pour cet utilisateur spécifiquement
      const success = premiumCodesService.deactivateCodeForUser(selectedEntry.code.code, user.id)
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: `Code ${selectedEntry.code.type} désactivé avec succès pour ${user.name}` 
        })
        setSelectedCodeToDeactivate('') // Réinitialiser la sélection
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la désactivation du code' })
      }
      
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la désactivation' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateAllSubscription = async () => {
    if (!user || !confirm('Êtes-vous sûr de vouloir désactiver TOUS les abonnements de cet utilisateur ?')) return
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      // Nettoyage complet: retirer l&apos;utilisateur de tous les codes + statut premium
      premiumCodesService.deactivateAllCodesForUser(user.id)
      setMessage({ 
        type: 'success', 
        text: `Tous les abonnements désactivés avec succès pour ${user.name}` 
      })
      setTimeout(() => {
        onSuccess()
      }, 1500)
      
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la désactivation' })
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: PremiumCodeType) => {
    const typeLabels: { [key: string]: string } = {
      'inscription': '🎁 Inscription (5j)',
      'individuel': '👤 Individuel (30j)',
      'famille': '👨‍👩‍👧‍👦 Famille (30j)',
      'individuel-annuel': '👤 Individuel (1an)',
      'famille-annuel': '👨‍👩‍👧‍👦 Famille (1an)',
      'plan-premium': '⭐ Plan Premium'
    }
    return typeLabels[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-4xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <KeyIcon className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">
              Gérer l&apos;Abonnement - {user.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Message de feedback */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-600 text-green-400' 
              : 'bg-red-900/50 border border-red-600 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Onglets */}
        <div className="flex space-x-1 mb-6 bg-dark-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('activate')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'activate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <KeyIcon className="w-4 h-4 inline mr-2" />
            Activer un Code
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manage'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4 inline mr-2" />
            Gérer l&apos;Abonnement
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'activate' && (
          <div className="space-y-6">
            <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
              <h4 className="text-lg font-semibold text-white mb-4">Activer un Code Manuellement</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Code Premium
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Tapez le code premium ici..."
                  className="w-full p-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
                />
              </div>
              
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Note:</strong> Le code doit être créé manuellement dans le générateur de codes avant d&apos;être activé ici.
                </p>
              </div>
              
              <button
                onClick={handleActivateManualCode}
                disabled={isLoading || !manualCode.trim()}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <KeyIcon className="w-5 h-5" />
                )}
                <span>Activer le Code</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
              <h4 className="text-lg font-semibold text-white mb-4">Codes Activés par l&apos;Utilisateur</h4>
              
              {userActivatedCodes.length === 0 ? (
                <div className="text-center py-8">
                  <KeyIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Aucun code activé</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Cet utilisateur n&apos;a activé aucun code premium
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sélection du code à désactiver */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sélectionner un code à désactiver
                    </label>
                    <select
                      value={selectedCodeToDeactivate}
                      onChange={(e) => setSelectedCodeToDeactivate(e.target.value)}
                      className="w-full p-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Choisir un code à désactiver...</option>
                      {userActivatedCodes.map(entry => (
                        <option key={entry.code.id} value={entry.code.id}>
                          {getTypeLabel(entry.code.type)} - {entry.code.code} (Activé: {formatDate(entry.usedAt)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Liste des codes activés */}
                  <div className="space-y-3">
                    {userActivatedCodes.map((entry, index) => (
                      <div
                        key={entry.code.id}
                        className={`p-4 rounded-lg border ${
                          selectedCodeToDeactivate === entry.code.id
                            ? 'bg-red-900/20 border-red-600'
                            : 'bg-dark-200 border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              new Date(entry.code.expiresAt) > new Date() ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            <div>
                              <p className="text-white font-medium">
                                {getTypeLabel(entry.code.type)}
                              </p>
                              <p className="text-sm text-gray-400 font-mono">
                                {entry.code.code}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-400">Activé le</p>
                            <p className="text-white">{formatDate(entry.usedAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={handleDeactivateSpecificCode}
                      disabled={isLoading || !selectedCodeToDeactivate}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <XCircleIcon className="w-5 h-5" />
                      )}
                      <span>Désactiver le Code Sélectionné</span>
                    </button>
                    
                    <button
                      onClick={handleDeactivateAllSubscription}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                      <span>Désactiver Tout</span>
                    </button>
                  </div>
                </div>
              )}
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
  )
}
