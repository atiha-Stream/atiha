'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAdminAuth } from '@/lib/admin-auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { userDatabase, UserRecord } from '@/lib/user-database'
import { usersExportService } from '@/lib/users-export-service'
import { premiumCodesService, PremiumCodeType } from '@/lib/premium-codes-service'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  UserIcon, 
  CheckCircleIcon, 
  NoSymbolIcon, 
  ChartBarIcon, 
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  XCircleIcon,
  TrashIcon,
  Cog6ToothIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import UserSessionManagementModal from '@/components/UserSessionManagementModal'
import BulkSubscriptionManagementModal from '@/components/BulkSubscriptionManagementModal'
import { logger } from '@/lib/logger'
const UserSecurityLogs = dynamic(() => import('@/components/UserSecurityLogs'), { ssr: false })
export default function AdminUsersPage() {
  const { admin } = useAdminAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deactivated' | 'unbanned' | 'banned'>('all')
  const [codeTypeFilter, setCodeTypeFilter] = useState<string>('all')
  const [availableCodeTypes, setAvailableCodeTypes] = useState<Array<{ type: PremiumCodeType; label: string }>>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showBulkSubscriptionModal, setShowBulkSubscriptionModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('logs')

  const loadAvailableCodeTypes = useCallback(() => {
    const codes = premiumCodesService.getAllCodes()
    const uniqueTypes = new Set<PremiumCodeType>()
    
    codes.forEach(code => {
      if (code.isActive) {
        uniqueTypes.add(code.type)
      }
    })
    
    const codeTypeLabels: Record<PremiumCodeType, string> = {
      'inscription': 'Inscription (5 jours)',
      'inscription-flexible': 'Inscription flexible (durée personnalisée)',
      'individuel': 'Individuel (30 jours)',
      'famille': 'Famille (30 jours)',
      'individuel-annuel': 'Individuel Annuel (365 jours)',
      'famille-annuel': 'Famille Annuel (365 jours)',
      'plan-premium': 'Plan Premium (30 jours)',
      'post-payment-individuel': 'Post-paiement Individuel (30 jours)',
      'post-payment-famille': 'Post-paiement Famille (30 jours)',
      'post-payment-individuel-annuel': 'Post-paiement Individuel (1 an)',
      'post-payment-famille-annuel': 'Post-paiement Famille (1 an)',
      'post-payment-individuel-flexible': 'Post-paiement Individuel flexible (30 jours)',
      'post-payment-famille-flexible': 'Post-paiement Famille flexible (30 jours)'
    }
    
    const typesArray = Array.from(uniqueTypes).map(type => ({
      type,
      label: codeTypeLabels[type] || type
    }))
    
    setAvailableCodeTypes(typesArray)
  }, [])

  const loadUsers = useCallback(() => {
    const normalUsers = userDatabase.getNormalUsers()
    setUsers(normalUsers)
    setIsLoading(false)
    // Recharger les types de codes disponibles après le chargement des utilisateurs
    loadAvailableCodeTypes()
  }, [loadAvailableCodeTypes])

  useEffect(() => {
    loadUsers()
    loadAvailableCodeTypes()
  }, [loadUsers, loadAvailableCodeTypes])

  // Optimiser le filtrage avec useMemo
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchTerm) ||
        (user.country && user.country.toLowerCase().includes(searchLower))
      )
    }

    // Filtre par statut
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter(user => user.isActive && !user.isBanned)
        break
      case 'inactive':
        filtered = filtered.filter(user => !user.isActive)
        break
      case 'deactivated':
        filtered = filtered.filter(user => !user.isActive && !user.isBanned)
        break
      case 'unbanned':
        filtered = filtered.filter(user => !user.isBanned)
        break
      case 'banned':
        filtered = filtered.filter(user => user.isBanned)
        break
    }

    // Filtre par type de code premium
    if (codeTypeFilter !== 'all') {
      const allCodes = premiumCodesService.getAllCodes()
      const now = new Date()
      
      filtered = filtered.filter(user => {
        // Vérifier le statut premium actuel de l'utilisateur
        const userPremiumStatus = premiumCodesService.getUserPremiumStatus(user.id)
        
        // Si l'utilisateur n'a pas de premium actif, il ne correspond pas au filtre
        if (!userPremiumStatus.isPremium || !userPremiumStatus.codeId) {
          return false
        }
        
        // Trouver le code utilisé par l'utilisateur
        const userCode = allCodes.find(code => code.id === userPremiumStatus.codeId)
        
        // Vérifier que le code existe et correspond au type sélectionné
        if (!userCode || userCode.type !== codeTypeFilter) {
          return false
        }
        
        // Vérifier que le code n'est pas expiré
        const expiresAt = new Date(userCode.expiresAt)
        if (expiresAt <= now) {
          return false
        }
        
        return true
      })
    }

    return filtered
  }, [users, searchTerm, statusFilter, codeTypeFilter])

  const handleUserAction = (userId: string, action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'delete') => {
    let success = false
    let message = ''

    switch (action) {
      case 'ban':
        success = userDatabase.banUser(userId, 'Banni par l\'administrateur')
        message = success ? 'Utilisateur banni' : 'Erreur lors du bannissement'
        break
      case 'unban':
        success = userDatabase.unbanUser(userId)
        message = success ? 'Utilisateur débanni' : 'Erreur lors du débannissement'
        break
      case 'activate':
        success = userDatabase.activateUser(userId)
        message = success ? 'Utilisateur activé' : 'Erreur lors de l\'activation'
        break
      case 'deactivate':
        success = userDatabase.deactivateUser(userId)
        message = success ? 'Utilisateur désactivé' : 'Erreur lors de la désactivation'
        break
      case 'delete':
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
          success = userDatabase.deleteUser(userId)
          message = success ? 'Utilisateur supprimé' : 'Erreur lors de la suppression'
        }
        break
    }

    if (success) {
      loadUsers()
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }

    alert(message)
  }

  const handleManageUser = (user: UserRecord) => {
    setSelectedUser(user)
    setShowSessionModal(true)
  }

  const handleCloseSessionModal = () => {
    setShowSessionModal(false)
    setSelectedUser(null)
  }

  const handleBulkAction = (action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur')
      return
    }

    const actionText = {
      ban: 'bannir',
      unban: 'débannir',
      activate: 'activer',
      deactivate: 'désactiver',
      delete: 'supprimer'
    }[action]

    if (!confirm(`Êtes-vous sûr de vouloir ${actionText} ${selectedUsers.length} utilisateur(s) ?`)) {
      return
    }

    let successCount = 0
    selectedUsers.forEach(userId => {
      let success = false
      switch (action) {
        case 'ban':
          success = userDatabase.banUser(userId, 'Banni en masse par l\'administrateur')
          break
        case 'unban':
          success = userDatabase.unbanUser(userId)
          break
        case 'activate':
          success = userDatabase.activateUser(userId)
          break
        case 'deactivate':
          success = userDatabase.deactivateUser(userId)
          break
        case 'delete':
          success = userDatabase.deleteUser(userId)
          break
      }
      if (success) successCount++
    })

    alert(`${successCount}/${selectedUsers.length} utilisateur(s) ${actionText} avec succès`)
    loadUsers()
    setSelectedUsers([])
  }


  const getStatusColor = (user: UserRecord) => {
    if (user.isBanned) return 'text-red-400 bg-red-900/30'
    if (!user.isActive) return 'text-yellow-400 bg-yellow-900/30'
    return 'text-green-400 bg-green-900/30'
  }

  // Nouvelles fonctions d&apos;export/import
  const handleExportUsers = () => {
    const csvContent = usersExportService.exportUsersToCSV(filteredUsers)
    const filename = `utilisateurs_atiha_${new Date().toISOString().split('T')[0]}.csv`
    usersExportService.downloadCSV(csvContent, filename)
  }

  const handleImportUsers = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string
        const result = await usersExportService.importUsersFromCSV(csvContent)
        
        let message = `Import terminé : ${result.success} utilisateur(s) ajouté(s), ${result.errors.length} erreur(s)`
        
        if (result.errors.length > 0) {
          message += '\n\nErreurs détaillées :\n' + result.errors.join('\n')
        }
        
        alert(message)
        loadUsers()
      } catch (error) {
        logger.error('Erreur import CSV', error as Error)
        alert('Erreur lors de l\'import : ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
      }
    }
    
    reader.readAsText(file, 'utf-8')
    event.target.value = ''
  }

  const handleDownloadTemplate = () => {
    const template = usersExportService.createCSVTemplate()
    usersExportService.downloadCSV(template, 'template_utilisateurs.csv')
  }

  const getStatusText = (user: UserRecord) => {
    if (user.isBanned) return 'Banni'
    if (!user.isActive) return 'Inactif'
    return 'Actif'
  }

  const stats = userDatabase.getStats()

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
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Utilisateurs</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="border-b border-gray-700 mb-4 sm:mb-6">
              <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8 overflow-x-auto [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full scroll-smooth">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors min-h-[44px] sm:min-h-0 whitespace-nowrap ${
                    activeTab === 'logs'
                      ? 'border-primary-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Logs de Sécurité Utilisateurs
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors min-h-[44px] sm:min-h-0 whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'border-primary-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Gestion des Utilisateurs
                </button>
              </nav>
            </div>
            {activeTab === 'users' && (
            <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Total Utilisateurs</p>
                    <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Actifs</p>
                    <p className="text-white text-xl sm:text-2xl font-bold">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <NoSymbolIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Bannis</p>
                    <p className="text-white text-xl sm:text-2xl font-bold">{stats.bannedUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Désactivés</p>
                    <p className="text-white text-xl sm:text-2xl font-bold">{stats.inactiveUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Débannis</p>
                    <p className="text-white text-xl sm:text-2xl font-bold">{stats.unbannedUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Nouveaux (mois)</p>
                    <p className="text-white text-xl sm:text-2xl font-bold">{stats.newUsersThisMonth}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                {/* Search */}
                <div className="relative flex-grow w-full sm:w-auto min-w-0">
                  <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email, téléphone..."
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <select
                  className="bg-dark-100 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="deactivated">Désactivé</option>
                  <option value="unbanned">Débannis</option>
                  <option value="banned">Bannis</option>
                </select>

                {/* Code Type Filter */}
                {availableCodeTypes.length > 0 && (
                  <select
                    className="bg-dark-100 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
                    value={codeTypeFilter}
                    onChange={(e) => setCodeTypeFilter(e.target.value)}
                  >
                    <option value="all">Tous les codes</option>
                    {availableCodeTypes.map(({ type, label }) => (
                      <option key={type} value={type}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    <span className="text-gray-300 text-xs sm:text-sm py-2 sm:py-0">{selectedUsers.length} sélectionné(s)</span>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <button
                        onClick={() => handleBulkAction('ban')}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        Bannir
                      </button>
                      <button
                        onClick={() => handleBulkAction('unban')}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        Débannir
                      </button>
                      <button
                        onClick={() => handleBulkAction('activate')}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        Activer
                      </button>
                      <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        Désactiver
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        Supprimer
                      </button>
                      <button
                        onClick={() => setShowBulkSubscriptionModal(true)}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm flex items-center justify-center space-x-1 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Abonnement</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export/Import Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={handleExportUsers}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  title="Exporter les utilisateurs visibles vers CSV"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Exporter CSV</span>
                </button>

                <label className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  title="Importer des utilisateurs depuis un fichier CSV"
                >
                  <DocumentArrowUpIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Importer CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportUsers}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  title="Télécharger le modèle CSV"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Modèle CSV</span>
                </button>
              </div>
            </div>


            {/* Users Table */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">
                Liste des Utilisateurs ({filteredUsers.length})
              </h3>
              
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-400">
                  <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base">Aucun utilisateur trouvé pour les filtres sélectionnés.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
                  <table className="w-full text-xs sm:text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 sm:py-3 px-2">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(filteredUsers.map(u => u.id))
                              } else {
                                setSelectedUsers([])
                              }
                            }}
                            className="rounded border-gray-600 bg-dark-100 text-red-500 focus:ring-red-500 w-4 h-4 sm:w-5 sm:h-5"
                          />
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Utilisateur</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Contact</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Mot de passe</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Statut</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Inscription</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Dernière connexion</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-dark-100/50">
                          <td className="py-2 sm:py-3 px-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id])
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                }
                              }}
                              className="rounded border-gray-600 bg-dark-100 text-red-500 focus:ring-red-500 w-4 h-4 sm:w-5 sm:h-5"
                            />
                          </td>
                          <td className="py-2 sm:py-3 px-2">
                            <div>
                              <div className="font-medium text-white text-xs sm:text-sm">{user.name}</div>
                              <div className="text-gray-400 text-xs break-all">ID: {user.id}</div>
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2">
                            <div>
                              <div className="text-white text-xs sm:text-sm break-all">{user.email}</div>
                              <div className="text-gray-400 text-xs">{user.phone}</div>
                              {user.country && (
                                <div className="text-gray-400 text-xs">{user.country}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2">
                            <div className="text-white font-mono text-xs sm:text-sm break-all">
                              {user.password || 'N/A'}
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                              {getStatusText(user)}
                            </span>
                            {user.isBanned && user.bannedReason && (
                              <div className="text-red-400 text-xs mt-1 break-words">{user.bannedReason}</div>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">
                            {new Date(user.registrationDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-2 sm:py-3 px-2 text-gray-300 text-xs sm:text-sm">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                          </td>
                          <td className="py-2 sm:py-3 px-2">
                            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                              {user.isBanned ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'unban')}
                                  className="text-green-400 hover:text-green-300 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                  title="Débannir"
                                  aria-label={`Débannir l&apos;utilisateur ${user.name}`}
                                >
                                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'ban')}
                                  className="text-red-400 hover:text-red-300 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                  title="Bannir"
                                  aria-label={`Bannir l&apos;utilisateur ${user.name}`}
                                >
                                  <NoSymbolIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                </button>
                              )}
                              
                              {user.isActive ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'deactivate')}
                                  className="text-yellow-400 hover:text-yellow-300 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                  title="Désactiver"
                                  aria-label={`Désactiver l&apos;utilisateur ${user.name}`}
                                >
                                  <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="text-green-400 hover:text-green-300 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                  title="Activer"
                                  aria-label={`Activer l&apos;utilisateur ${user.name}`}
                                >
                                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleManageUser(user)}
                                className="text-blue-400 hover:text-blue-300 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                title="Gérer les sessions"
                                aria-label={`Gérer les sessions de l&apos;utilisateur ${user.name}`}
                              >
                                <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                              </button>
                              
                              <button
                                onClick={() => handleUserAction(user.id, 'delete')}
                                className="text-red-600 hover:text-red-500 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                title="Supprimer"
                                aria-label={`Supprimer l&apos;utilisateur ${user.name}`}
                              >
                                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </>
            )}

            {activeTab === 'logs' && (
              <div className="mb-8">
                <UserSecurityLogs />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de gestion des sessions */}
      <UserSessionManagementModal
        isOpen={showSessionModal}
        onClose={handleCloseSessionModal}
        user={selectedUser}
      />

      {/* Modal de gestion des abonnements groupés */}
      <BulkSubscriptionManagementModal
        isOpen={showBulkSubscriptionModal}
        onClose={() => {
          setShowBulkSubscriptionModal(false)
        }}
        selectedUserIds={selectedUsers}
        onSuccess={() => {
          loadUsers()
          setSelectedUsers([])
          setShowBulkSubscriptionModal(false)
        }}
      />
    </AdminProtectedRoute>
  )
}
