'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ClockIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { UserRecord } from '@/lib/user-database'
import { premiumCodesService, PremiumCode } from '@/lib/premium-codes-service'
import { logger } from '@/lib/logger'

interface PremiumHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserRecord | null
}

interface PremiumHistoryEntry {
  code: PremiumCode
  usedAt: string
  index: number
}

export default function PremiumHistoryModal({ isOpen, onClose, user }: PremiumHistoryModalProps) {
  const [history, setHistory] = useState<PremiumHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadHistory()
    }
  }, [isOpen, user])

  const loadHistory = () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userHistory = premiumCodesService.getUserPremiumHistory(user.id)
      setHistory(userHistory)
    } catch (error) {
      logger.error('Erreur lors du chargement de l\'historique', error as Error)
    } finally {
      setIsLoading(false)
    }
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

  const getTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'inscription': '🎁 Inscription',
      'individuel': '👤 Individuel (30j)',
      'famille': '👨‍👩‍👧‍👦 Famille (30j)',
      'individuel-annuel': '👤 Individuel (1an)',
      'famille-annuel': '👨‍👩‍👧‍👦 Famille (1an)',
      'plan-premium': '⭐ Plan Premium'
    }
    return typeLabels[type] || type
  }

  const getStatusIcon = (code: PremiumCode, usedAt: string) => {
    const now = new Date()
    const usedDate = new Date(usedAt)
    const expiresDate = new Date(code.expiresAt)
    
    if (expiresDate < now) {
      return <XCircleIcon className="w-5 h-5 text-red-400" />
    } else {
      return <CheckCircleIcon className="w-5 h-5 text-green-400" />
    }
  }

  const getStatusText = (code: PremiumCode, usedAt: string) => {
    const now = new Date()
    const usedDate = new Date(usedAt)
    const expiresDate = new Date(code.expiresAt)
    
    if (expiresDate < now) {
      return 'Expiré'
    } else {
      return 'Actif'
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-4xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="text-xl font-bold text-white">
                Historique des Codes Premium - {user.name}
              </h3>
              <p className="text-sm text-gray-400">
                Mois en cours ({new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Chargement de l&apos;historique...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <KeyIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun code premium utilisé ce mois</p>
            <p className="text-gray-500 text-sm mt-1">
              Cet utilisateur n&apos;a activé aucun code premium en {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div
                key={`${entry.code.id}-${entry.index}`}
                className="bg-dark-100 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(entry.code, entry.usedAt)}
                    <div>
                      <h4 className="text-white font-medium">
                        {getTypeLabel(entry.code.type)}
                      </h4>
                      <p className="text-sm text-gray-400">
                        Code: <span className="font-mono text-blue-400">{entry.code.code}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Statut</p>
                    <p className={`text-sm font-medium ${
                      getStatusText(entry.code, entry.usedAt) === 'Actif' 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {getStatusText(entry.code, entry.usedAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Activé le</p>
                    <p className="text-white">{formatDate(entry.usedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Début du code</p>
                    <p className="text-white">{formatDate(entry.code.startsAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Expire le</p>
                    <p className="text-white">{formatDate(entry.code.expiresAt)}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <p>Généré par: {entry.code.generatedBy}</p>
                    <p>ID: {entry.code.id.substring(0, 8)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques */}
        {history.length > 0 && (
          <div className="mt-6 p-4 bg-dark-100 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-3">Statistiques</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-400">{history.length}</p>
                <p className="text-sm text-gray-400">Codes utilisés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {history.filter(entry => getStatusText(entry.code, entry.usedAt) === 'Actif').length}
                </p>
                <p className="text-sm text-gray-400">Actuellement actifs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {history.filter(entry => getStatusText(entry.code, entry.usedAt) === 'Expiré').length}
                </p>
                <p className="text-sm text-gray-400">Expirés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {new Set(history.map(entry => entry.code.type)).size}
                </p>
                <p className="text-sm text-gray-400">Types différents</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir nettoyer l\'historique des mois précédents ? Cette action est irréversible.')) {
                const result = premiumCodesService.cleanupOldHistory()
                if (result.success) {
                  alert(result.message)
                  loadHistory() // Recharger l&apos;historique
                } else {
                  alert('Erreur: ' + result.message)
                }
              }
            }}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            title="Nettoyer l&apos;historique des mois précédents"
          >
            🗑️ Nettoyer l&apos;historique
          </button>
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
