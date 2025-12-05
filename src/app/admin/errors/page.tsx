'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAdminAuth } from '@/lib/admin-auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { ErrorLogger } from '@/lib/error-logger'
import { ErrorLog, ErrorStats, ErrorFilter } from '@/types/errors'
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { logger } from '@/lib/logger'
const AdminTestsPanel = dynamic(() => import('@/components/AdminTestsPanel'), { ssr: false })

export default function AdminErrorsPage() {
  const { admin } = useAdminAuth()
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [filter, setFilter] = useState<ErrorFilter>({})
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = () => {
    setIsLoading(true)
    try {
      const filteredLogs = ErrorLogger.getFilteredLogs(filter)
      const errorStats = ErrorLogger.getStats()
      
      setLogs(filteredLogs)
      setStats(errorStats)
    } catch (error) {
      logger.error('Error loading error logs', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveError = (logId: string) => {
    ErrorLogger.resolveError(logId, admin?.username || 'admin')
    loadData()
  }

  const handleDeleteLog = (logId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce log d\'erreur ?')) {
      ErrorLogger.deleteLog(logId)
      loadData()
    }
  }

  const handleClearAllLogs = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer TOUS les logs d\'erreur ? Cette action est irréversible.')) {
      ErrorLogger.clearAllLogs()
      loadData()
    }
  }

  const handleDownloadLogs = () => {
    try {
      // Récupérer tous les logs (y compris les non filtrés pour avoir un rapport complet)
      const allLogs = ErrorLogger.getLogs()
      const filteredLogs = ErrorLogger.getFilteredLogs(filter)
      const errorStats = ErrorLogger.getStats()
      
      // Créer un objet avec les données complètes
      const report = {
        generatedAt: new Date().toISOString(),
        generatedBy: admin?.username || 'admin',
        summary: {
          totalLogs: allLogs.length,
          filteredLogs: filteredLogs.length,
          stats: errorStats
        },
        filters: filter,
        logs: filteredLogs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
          resolvedAt: log.resolvedAt ? log.resolvedAt.toISOString() : undefined
        }))
      }
      
      // Créer le blob et télécharger
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Erreur lors du téléchargement des logs', error as Error)
      alert('Une erreur est survenue lors du téléchargement des logs.')
    }
  }

  const handleDownloadSingleLog = (log: ErrorLog) => {
    try {
      // Créer un rapport pour un seul log
      const report = {
        generatedAt: new Date().toISOString(),
        generatedBy: admin?.username || 'admin',
        log: {
          ...log,
          timestamp: log.timestamp.toISOString(),
          resolvedAt: log.resolvedAt ? log.resolvedAt.toISOString() : undefined
        }
      }
      
      // Créer le blob et télécharger
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0]
      link.href = url
      link.download = `error-log-${log.id}-${dateStr}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Erreur lors du téléchargement du log', error as Error)
      alert('Une erreur est survenue lors du téléchargement du log.')
    }
  }

  const getSeverityColor = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityIcon = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'low': return <InformationCircleIcon className="w-4 h-4" />
      case 'medium': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'high': return <ExclamationCircleIcon className="w-4 h-4" />
      case 'critical': return <XCircleIcon className="w-4 h-4" />
      default: return <InformationCircleIcon className="w-4 h-4" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
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
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Erreurs</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{stats.total}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Total Erreurs</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{stats.unresolved}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Non Résolues</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{stats.bySeverity.critical}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Critiques</p>
                    {stats.bySeverity.critical > 0 && (
                      <p className="text-red-400 text-xs sm:text-sm mt-1">⚠️ Attention requise</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{stats.byCategory.javascript}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">JavaScript</p>
                    {stats.byCategory.javascript > 0 && (
                      <p className="text-blue-400 text-xs sm:text-sm mt-1">🔧 Code à vérifier</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques détaillées */}
          {stats && (
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 mb-6 sm:mb-8">
              <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl mb-4 sm:mb-5 md:mb-6 flex items-center space-x-2 sm:space-x-2.5">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                <span>Répartition des Erreurs</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Par Gravité */}
                <div>
                  <h4 className="text-white font-medium mb-3 sm:mb-4 text-base sm:text-lg">Par Gravité</h4>
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Critiques</span>
                      </div>
                      <span className="text-white font-semibold bg-red-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.bySeverity.critical}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <ExclamationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Élevées</span>
                      </div>
                      <span className="text-white font-semibold bg-orange-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.bySeverity.high}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Moyennes</span>
                      </div>
                      <span className="text-white font-semibold bg-yellow-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.bySeverity.medium}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Faibles</span>
                      </div>
                      <span className="text-white font-semibold bg-blue-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.bySeverity.low}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Par Catégorie */}
                <div>
                  <h4 className="text-white font-medium mb-3 sm:mb-4 text-base sm:text-lg">Par Catégorie</h4>
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <span className="text-gray-300 text-sm sm:text-base">JavaScript</span>
                      </div>
                      <span className="text-white font-semibold bg-blue-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.byCategory.javascript}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <ComputerDesktopIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Réseau</span>
                      </div>
                      <span className="text-white font-semibold bg-green-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.byCategory.network}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Authentification</span>
                      </div>
                      <span className="text-white font-semibold bg-purple-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.byCategory.authentication}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        <span className="text-gray-300 text-sm sm:text-base">Autres</span>
                      </div>
                      <span className="text-white font-semibold bg-gray-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm sm:text-base">
                        {stats.byCategory.other}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-2.5 mb-4 sm:mb-5">
              <FunnelIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white">Filtres</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Recherche */}
              <div>
                <label htmlFor="error-search" className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6 absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="text"
                    id="error-search"
                    value={filter.search || ''}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Rechercher..."
                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3 bg-dark-300 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px]"
                    aria-label="Rechercher dans les logs d&apos;erreurs"
                  />
                </div>
              </div>

              {/* Gravité */}
              <div>
                <label htmlFor="error-severity" className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Gravité
                </label>
                <select
                  id="error-severity"
                  value={filter.severity || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value || undefined }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px]"
                  aria-label="Filtrer par gravité"
                >
                  <option value="">Toutes</option>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                  <option value="critical">Critique</option>
                </select>
              </div>

              {/* Catégorie */}
              <div>
                <label htmlFor="error-category" className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Catégorie
                </label>
                <select
                  id="error-category"
                  value={filter.category || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value || undefined }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px]"
                  aria-label="Filtrer par catégorie"
                >
                  <option value="">Toutes</option>
                  <option value="javascript">JavaScript</option>
                  <option value="network">Réseau</option>
                  <option value="authentication">Authentification</option>
                  <option value="video">Vidéo</option>
                  <option value="admin">Admin</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Statut */}
              <div>
                <label htmlFor="error-status" className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  id="error-status"
                  value={filter.resolved === undefined ? '' : filter.resolved.toString()}
                  onChange={(e) => setFilter(prev => ({ 
                    ...prev, 
                    resolved: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base min-h-[44px]"
                  aria-label="Filtrer par statut"
                >
                  <option value="">Tous</option>
                  <option value="false">Non résolues</option>
                  <option value="true">Résolues</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-5">
              <button
                onClick={() => setFilter({})}
                className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                aria-label="Réinitialiser les filtres"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleClearAllLogs}
                className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto flex items-center justify-center"
                aria-label="Supprimer tous les logs d&apos;erreurs"
              >
                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-6 inline mr-2" aria-hidden="true" />
                Vider tout
              </button>
            </div>
          </div>

          {/* Liste des erreurs */}
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <div className="p-4 sm:p-5 md:p-6 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white">
                Logs d&apos;Erreurs ({logs.length})
              </h2>
              <button
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
                className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                title="Télécharger les logs d&apos;erreurs au format JSON"
                aria-label="Télécharger les logs d&apos;erreurs au format JSON"
                aria-disabled={logs.length === 0}
              >
                <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                <span>Télécharger les logs</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 sm:py-16" role="status" aria-live="polite">
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"
                  aria-label="Chargement des logs d&apos;erreurs"
                ></div>
                <span className="sr-only">Chargement des logs d&apos;erreurs</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 sm:py-16" role="status" aria-live="polite">
                <ExclamationTriangleIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400 mx-auto mb-4 sm:mb-5" aria-hidden="true" />
                <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3">
                  Aucune erreur trouvée
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Aucun log d&apos;erreur ne correspond aux filtres sélectionnés
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 md:p-6 hover:bg-dark-300/50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getSeverityColor(log.severity)}`}>
                            {getSeverityIcon(log.severity)}
                            <span className="ml-1 capitalize">{log.severity}</span>
                          </span>
                          <span className="bg-gray-700 text-gray-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm">
                            {log.category}
                          </span>
                          {log.resolved && (
                            <span className="bg-green-700 text-green-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm">
                              Résolu
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">
                          {log.error}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                          <div className="flex items-center space-x-1 sm:space-x-1.5">
                            <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                          {log.userEmail && (
                            <div className="flex items-center space-x-1 sm:space-x-1.5">
                              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                              <span className="truncate max-w-[200px] sm:max-w-xs">{log.userEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 sm:space-x-1.5">
                            <ComputerDesktopIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            <span className="truncate max-w-[200px] sm:max-w-xs">{log.url}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                          aria-label={`Voir les détails de l&apos;erreur: ${log.error.substring(0, 50)}`}
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => handleDownloadSingleLog(log)}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded text-xs sm:text-sm hover:bg-purple-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
                          title="Télécharger ce log d&apos;erreur"
                          aria-label={`Télécharger le log d&apos;erreur du ${formatDate(log.timestamp)}`}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                        </button>
                        {!log.resolved && (
                          <button
                            onClick={() => handleResolveError(log.id)}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
                            aria-label={`Marquer l&apos;erreur comme résolue: ${log.error.substring(0, 50)}`}
                          >
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1" aria-hidden="true" />
                            <span className="hidden sm:inline">Résoudre</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
                          aria-label={`Supprimer le log d&apos;erreur: ${log.error.substring(0, 50)}`}
                        >
                          <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1" aria-hidden="true" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Tests Automatisés */}
          <section className="mt-8 sm:mt-10 md:mt-12">
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Tests Automatisés</h2>
              <p className="text-gray-300 mb-4 sm:mb-5 text-sm sm:text-base">Exécutez rapidement une batterie de tests pour valider la configuration et les fonctionnalités critiques.</p>
              <AdminTestsPanel />
            </div>
          </section>
        </main>

        {/* Modal de détails */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-dark-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Détails de l&apos;Erreur</h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-white transition-colors p-2.5 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Fermer le modal"
                  >
                    <XCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                        ID
                      </label>
                      <p className="text-white text-sm sm:text-base font-mono break-all">{selectedLog.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                        Timestamp
                      </label>
                      <p className="text-white text-sm sm:text-base">{formatDate(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                        Gravité
                      </label>
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getSeverityColor(selectedLog.severity)}`}>
                        {getSeverityIcon(selectedLog.severity)}
                        <span className="ml-1 capitalize">{selectedLog.severity}</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                        Catégorie
                      </label>
                      <span className="bg-gray-700 text-gray-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm">
                        {selectedLog.category}
                      </span>
                    </div>
                  </div>

                  {/* Message d&apos;erreur */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                      Message d&apos;erreur
                    </label>
                    <div className="bg-dark-300 rounded-lg p-3 sm:p-4">
                      <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedLog.error}</p>
                    </div>
                  </div>

                  {/* Stack trace */}
                  {selectedLog.stack && (
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                        Stack Trace
                      </label>
                      <div className="bg-dark-300 rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto">
                        <pre className="text-white text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
                          {selectedLog.stack}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Contexte */}
                  {selectedLog.context && (
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                        Contexte
                      </label>
                      <div className="bg-dark-300 rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto">
                        <pre className="text-white text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
                          {selectedLog.context}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Informations utilisateur */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                        URL
                      </label>
                      <p className="text-white text-xs sm:text-sm break-all">{selectedLog.url}</p>
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                        User Agent
                      </label>
                      <p className="text-white text-xs sm:text-sm break-all">{selectedLog.userAgent}</p>
                    </div>
                    {selectedLog.userEmail && (
                      <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                          Utilisateur
                        </label>
                        <p className="text-white text-xs sm:text-sm break-all">{selectedLog.userEmail}</p>
                      </div>
                    )}
                    {selectedLog.resolved && (
                      <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 sm:mb-2">
                          Résolu par
                        </label>
                        <p className="text-white text-xs sm:text-sm break-all">{selectedLog.resolvedBy}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-5 md:mt-6">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    Fermer
                  </button>
                  {!selectedLog.resolved && (
                    <button
                      onClick={() => {
                        handleResolveError(selectedLog.id)
                        setSelectedLog(null)
                      }}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Marquer comme résolu
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  )
}
