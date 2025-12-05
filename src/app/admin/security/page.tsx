'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { adminSecurity, AdminSecurityLog } from '@/lib/admin-security'
import AdminManagement from '@/components/AdminManagement'
import { CreateAdminModal } from '@/components/CreateAdminModal'
import { DeleteAdminModal } from '@/components/AdminModals'
import { EditAdminModal } from '@/components/EditAdminModal'
import { Admin } from '@/types/admin'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  ArrowPathIcon,
  TrashIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

export default function AdminSecurityPage() {
  const { admin } = useAdminAuth()
  const [logs, setLogs] = useState<AdminSecurityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  
  // États pour les onglets
  const [activeTab, setActiveTab] = useState<'logs' | 'admins'>('logs')
  
  // États pour la gestion des administrateurs
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  useEffect(() => {
    loadSecurityLogs()
  }, [])


  const loadSecurityLogs = () => {
    const securityLogs = adminSecurity.getSecurityLogs()
    setLogs(securityLogs)
    setIsLoading(false)
  }

  const handleUnlockAccount = () => {
    // ⚠️ SÉCURITÉ: Utiliser le mot de passe admin actuel au lieu d'une valeur hardcodée
    const result = adminSecurity.unlockAccount(unlockPassword)
    
    if (result.success) {
      setShowUnlockModal(false)
      setUnlockPassword('')
      loadSecurityLogs()
      alert(result.message)
    } else {
      alert(result.message)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login_success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'login_failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'login_attempt':
        return <KeyIcon className="w-5 h-5 text-blue-500" />
      case 'password_reset':
        return <ShieldCheckIcon className="w-5 h-5 text-purple-500" />
      case 'security_code_used':
        return <LockClosedIcon className="w-5 h-5 text-orange-500" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getActionColor = (action: string, success: boolean) => {
    if (success) {
      return 'bg-green-900/30 text-green-400 border-green-700'
    }
    
    switch (action) {
      case 'login_failed':
        return 'bg-red-900/30 text-red-400 border-red-700'
      case 'login_attempt':
        return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'password_reset':
        return 'bg-purple-900/30 text-purple-400 border-purple-700'
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login_success':
        return 'Connexion réussie'
      case 'login_failed':
        return 'Connexion échouée'
      case 'login_attempt':
        return 'Tentative de connexion'
      case 'password_reset':
        return 'Réinitialisation mot de passe'
      case 'security_code_used':
        return 'Code de sécurité utilisé'
      case 'auto_reset_triggered':
        return 'Auto-reset déclenché'
      case 'backup_restored':
        return 'Sauvegarde restaurée'
      default:
        return action
    }
  }

  const handleRestoreBackup = () => {
    // Confirmation avant restauration
    if (!confirm('⚠️ ATTENTION ! Cette action va restaurer la base de données depuis la sauvegarde et écraser toutes les données actuelles. Êtes-vous sûr de vouloir continuer ?')) {
      return
    }

    // Double confirmation pour les données critiques
    if (!confirm('🚨 DERNIÈRE CHANCE ! Cette action est IRRÉVERSIBLE et va supprimer toutes les données actuelles. Continuer ?')) {
      return
    }

    try {
      setIsRestoring(true)
      const result = adminSecurity.restoreFromBackup()
      
      if (result.success) {
        logger.info('✅ ' + result.message)
        alert('✅ ' + result.message)
        loadSecurityLogs()
      } else {
        logger.error('❌ ' + result.message)
        alert('❌ ' + result.message)
      }
    } catch (error) {
      logger.error('Erreur lors de la restauration', error as Error)
      alert('❌ Erreur inattendue lors de la restauration')
    } finally {
      setIsRestoring(false)
    }
  }

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRecentLogs = () => logs.slice(0, 10)
  const getFailedLogs = () => logs.filter(log => !log.success)
  const getSuccessLogs = () => logs.filter(log => log.success)

  // Handlers pour la gestion des administrateurs
  const handleCreateAdmin = () => {
    setShowCreateModal(true)
  }

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setShowEditModal(true)
  }

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setShowDeleteModal(true)
  }

  const handleAdminSuccess = () => {
    // Recharger les données si nécessaire
    // Les modaux se ferment automatiquement
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDeleteModal(false)
    setSelectedAdmin(null)
  }

  if (isLoading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-white text-base sm:text-lg md:text-xl">Chargement...</div>
        </div>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-800">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-1.5 sm:space-x-2 text-gray-400 hover:text-white transition-colors text-base sm:text-lg min-h-[44px] sm:min-h-0"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Retour</span>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Sécurité Admin</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            
            {/* Système d'onglets */}
            <div className="mb-6 sm:mb-8">
              <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8 overflow-x-auto [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full scroll-smooth">
            
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors duration-200 min-h-[44px] sm:min-h-0 whitespace-nowrap ${
                      activeTab === 'logs'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Logs de Sécurité Administrateurs</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('admins')}
                    className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors duration-200 min-h-[44px] sm:min-h-0 whitespace-nowrap ${
                      activeTab === 'admins'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Gestion des Administrateurs</span>
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Contenu des onglets */}

            {activeTab === 'logs' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm">Total Logs</p>
                        <p className="text-white text-xl sm:text-2xl font-bold">{logs.length}</p>
                      </div>
                    </div>
                  </div>

                <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs sm:text-sm">Connexions Réussies</p>
                      <p className="text-white text-xl sm:text-2xl font-bold">{getSuccessLogs().length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs sm:text-sm">Tentatives Échouées</p>
                      <p className="text-white text-xl sm:text-2xl font-bold">{getFailedLogs().length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs sm:text-sm">Réinitialisations</p>
                      <p className="text-white text-xl sm:text-2xl font-bold">
                        {logs.filter(log => log.action === 'password_reset' && log.success).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

                {/* Actions */}
                <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <button
                      onClick={loadSecurityLogs}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Actualiser</span>
                    </button>

                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      <LockClosedIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Déverrouiller le compte</span>
                    </button>

                    <Link
                      href="/admin/reset-password"
                      className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Réinitialiser le mot de passe</span>
                    </Link>
                  </div>
                </div>

                {/* Information sur la sauvegarde manuelle */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mb-2 sm:mb-3">⚠️ Sauvegarde Manuelle Requise</h3>
                      <p className="text-gray-300 mb-2 sm:mb-3 text-sm sm:text-base">
                        <strong>Important :</strong> Le système d&apos;auto-reset ne crée plus de sauvegarde automatique.
                      </p>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                        <p>• <strong>Avant chaque déconnexion :</strong> Exportez la base de données via &quot;Gestion des Utilisateurs&quot;</p>
                        <p>• <strong>En cas de verrouillage :</strong> La base de données sera effacée automatiquement</p>
                        <p>• <strong>Après reconnexion :</strong> Importez votre fichier Excel pour restaurer les utilisateurs</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Logs de Sécurité Récents</h3>
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Êtes-vous sûr de vouloir vider tous les logs de sécurité ? Cette action est irréversible.')) {
                          adminSecurity.clearSecurityLogs()
                          loadSecurityLogs()
                          alert('✅ Logs de sécurité vidés avec succès')
                        }
                      }}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Vider les logs</span>
                    </button>
                  </div>
                  
                  {getRecentLogs().length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-400">
                      <ShieldCheckIcon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base">Aucun log de sécurité trouvé.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {getRecentLogs().map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 sm:p-4 rounded-lg border ${getActionColor(log.action, log.success)}`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">{getActionIcon(log.action)}</div>
                              <span className="font-medium text-sm sm:text-base">{getActionLabel(log.action)}</span>
                              <span className="text-xs sm:text-sm opacity-75">par {log.username}</span>
                            </div>
                            <span className="text-xs sm:text-sm opacity-75">{formatTimestamp(log.timestamp)}</span>
                          </div>
                          
                          {log.details && (
                            <p className="text-xs sm:text-sm opacity-90 ml-0 sm:ml-8 mt-1 sm:mt-0 break-words">{log.details}</p>
                          )}
                          
                          {log.userAgent && (
                            <p className="text-xs opacity-60 ml-0 sm:ml-8 mt-1 break-words">
                              {log.userAgent.split(' ')[0]} • {log.ip || 'IP non disponible'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Gestion des Administrateurs */}
            {activeTab === 'admins' && (
              <AdminManagement
                onCreateAdmin={handleCreateAdmin}
                onEditAdmin={handleEditAdmin}
                onDeleteAdmin={handleDeleteAdmin}
              />
            )}

          </div>
        </main>

        {/* Unlock Modal */}
        {showUnlockModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-dark-200 rounded-xl max-w-md w-full p-4 sm:p-5 md:p-6 border border-gray-700">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Déverrouiller le compte</h3>
              <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                Entrez votre mot de passe actuel pour déverrouiller le compte administrateur.
              </p>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px]"
                    placeholder="Entrez votre mot de passe"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => {
                      setShowUnlockModal(false)
                      setUnlockPassword('')
                    }}
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUnlockAccount}
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    Déverrouiller
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modaux pour la gestion des administrateurs */}
        <CreateAdminModal
          isOpen={showCreateModal}
          onClose={closeModals}
          onSuccess={handleAdminSuccess}
        />

        <EditAdminModal
          isOpen={showEditModal}
          onClose={closeModals}
          onSuccess={handleAdminSuccess}
          admin={selectedAdmin}
        />

        <DeleteAdminModal
          isOpen={showDeleteModal}
          onClose={closeModals}
          onSuccess={handleAdminSuccess}
          admin={selectedAdmin}
        />

      </div>
    </AdminProtectedRoute>
  )
}
