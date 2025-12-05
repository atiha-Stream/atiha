'use client'

import { useState } from 'react'
import { 
  XMarkIcon, 
  KeyIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { premiumCodesService } from '@/lib/premium-codes-service'
import { userDatabase, UserRecord } from '@/lib/user-database'
import { logger } from '@/lib/logger'

interface BulkSubscriptionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  selectedUserIds: string[]
  onSuccess: () => void
}

export default function BulkSubscriptionManagementModal({ 
  isOpen, 
  onClose, 
  selectedUserIds,
  onSuccess 
}: BulkSubscriptionManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'activate' | 'deactivate'>('activate')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // État pour l'activation de codes
  const [manualCode, setManualCode] = useState('')
  
  // Récupérer les utilisateurs sélectionnés
  const selectedUsers = selectedUserIds
    .map(id => userDatabase.findUserById(id))
    .filter((user): user is UserRecord => user !== null)

  const handleActivateCode = async () => {
    if (!manualCode.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un code premium' })
      return
    }

    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Aucun utilisateur sélectionné' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const user of selectedUsers) {
        try {
          const success = premiumCodesService.activateCodeForUser(manualCode.trim(), user.id)
          if (success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${user.email}: Code invalide ou déjà utilisé`)
          }
        } catch (error) {
          errorCount++
          errors.push(`${user.email}: Erreur lors de l'activation`)
        }
      }

      if (successCount > 0) {
        setMessage({ 
          type: 'success', 
          text: `Code activé avec succès pour ${successCount} utilisateur(s)${errorCount > 0 ? ` (${errorCount} erreur(s))` : ''}` 
        })
        setManualCode('')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setMessage({ 
          type: 'error', 
          text: `Aucun utilisateur n'a pu activer ce code. ${errors.length > 0 ? errors.slice(0, 3).join('; ') : ''}` 
        })
      }
    } catch (error) {
      logger.error('Erreur lors de l\'activation du code', error as Error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'activation du code' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateCode = async () => {
    if (!manualCode.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un code premium' })
      return
    }

    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Aucun utilisateur sélectionné' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const user of selectedUsers) {
        try {
          const success = premiumCodesService.deactivateCodeForUser(manualCode.trim(), user.id)
          if (success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${user.email}: Code non trouvé ou utilisateur ne l'utilise pas`)
          }
        } catch (error) {
          errorCount++
          errors.push(`${user.email}: Erreur lors de la désactivation`)
        }
      }

      if (successCount > 0) {
        setMessage({ 
          type: 'success', 
          text: `Code désactivé avec succès pour ${successCount} utilisateur(s)${errorCount > 0 ? ` (${errorCount} erreur(s))` : ''}` 
        })
        setManualCode('')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setMessage({ 
          type: 'error', 
          text: `Aucun utilisateur n'a pu désactiver ce code. ${errors.length > 0 ? errors.slice(0, 3).join('; ') : ''}` 
        })
      }
    } catch (error) {
      logger.error('Erreur lors de la désactivation du code', error as Error)
      setMessage({ type: 'error', text: 'Erreur lors de la désactivation du code' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Gérer l&apos;Abonnement</h2>
              <p className="text-sm text-gray-400">{selectedUsers.length} utilisateur(s) sélectionné(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-dark-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('activate')
              setMessage(null)
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'activate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Activer un Code</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('deactivate')
              setMessage(null)
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'deactivate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrashIcon className="w-4 h-4" />
              <span>Désactiver un Code</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div>
          {/* Liste des utilisateurs sélectionnés */}
          <div className="mb-6 p-4 bg-dark-100 rounded-lg border border-gray-600">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Utilisateurs sélectionnés :</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-2 text-sm text-gray-300">
                  <UserIcon className="w-4 h-4" />
                  <span>{user.name} ({user.email})</span>
                </div>
              ))}
            </div>
          </div>

          {activeTab === 'activate' ? (
            <div className="space-y-6">
              <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-4">Activer un Code pour Plusieurs Utilisateurs</h4>
                
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
                    disabled={isLoading}
                  />
                </div>
                
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Note:</strong> Le code sera activé pour tous les utilisateurs sélectionnés.
                  </p>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                    message.type === 'success' 
                      ? 'bg-green-900/50 border border-green-600 text-green-400' 
                      : 'bg-red-900/50 border border-red-600 text-red-400'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{message.text}</span>
                  </div>
                )}

                <button
                  onClick={handleActivateCode}
                  disabled={isLoading || !manualCode.trim()}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <KeyIcon className="w-5 h-5" />
                  )}
                  <span>Activer le Code pour {selectedUsers.length} utilisateur(s)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-dark-100 rounded-lg p-4 border border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-4">Désactiver un Code pour Plusieurs Utilisateurs</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Code Premium à désactiver
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Tapez le code premium ici..."
                    className="w-full p-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Note:</strong> Le code sera désactivé pour tous les utilisateurs sélectionnés qui l&apos;utilisent.
                  </p>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                    message.type === 'success' 
                      ? 'bg-green-900/50 border border-green-600 text-green-400' 
                      : 'bg-red-900/50 border border-red-600 text-red-400'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{message.text}</span>
                  </div>
                )}

                <button
                  onClick={handleDeactivateCode}
                  disabled={isLoading || !manualCode.trim()}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <TrashIcon className="w-5 h-5" />
                  )}
                  <span>Désactiver le Code pour {selectedUsers.length} utilisateur(s)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

