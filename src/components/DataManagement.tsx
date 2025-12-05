'use client'

import React, { useState, useRef } from 'react'
import { DataManagementService, DataImportResult, type SecurityCheck, type BackupInfo } from '@/lib/data-management-service'
import GeographicManager from '@/components/admin/GeographicManager'
import { logger } from '@/lib/logger'
import { 
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface DataManagementProps {
  className?: string
}

export default function DataManagement({ className = '' }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [importResult, setImportResult] = useState<DataImportResult | null>(null)
  const [dataStats, setDataStats] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'data' | 'geographic'>('data')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // États pour les sécurités
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null)
  const [confirmationStep, setConfirmationStep] = useState(0)
  const [confirmationText, setConfirmationText] = useState('')
  const [deletionReport, setDeletionReport] = useState<any>(null)
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [securityError, setSecurityError] = useState<string | null>(null)

  const loadDataStats = () => {
    const stats = DataManagementService.getDataStats()
    setDataStats(stats)
  }

  React.useEffect(() => {
    loadDataStats()
    checkSecurity()
  }, [])

  // Vérification de sécurité
  const checkSecurity = async () => {
    try {
      // Ne pas supprimer l'admin, laisser le système détecter automatiquement
      const security = await DataManagementService.performSecurityCheck('DATA_MANAGEMENT')
      setSecurityCheck(security)
      setSecurityError(null)
    } catch (error) {
      setSecurityError(`Erreur de sécurité: ${error}`)
      setSecurityCheck(null)
    }
  }

  const handleExport = async () => {
    try {
      // Vérification de sécurité
      if (!securityCheck) {
        setSecurityError('Vérification de sécurité requise')
        return
      }

      setIsExporting(true)
      setSecurityError(null)
      
      // Log de l'action
      await DataManagementService.logAuditAction('EXPORT_ALL_DATA', {
        admin: securityCheck.adminInfo.email,
        timestamp: new Date().toISOString()
      })
      
      const exportData = await DataManagementService.exportAllData()
      
      // Créer et télécharger le fichier
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `atiha-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      logger.info('✅ Export completed successfully')
    } catch (error) {
      logger.error('❌ Export failed', error as Error)
      setSecurityError(`Erreur lors de l&apos;export: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Vérification de sécurité
      if (!securityCheck) {
        setSecurityError('Vérification de sécurité requise')
        return
      }

      setIsImporting(true)
      setImportResult(null)
      setSecurityError(null)
      
      // Utiliser la méthode sécurisée
      const result = await DataManagementService.secureImportAllData(file)
      setImportResult(result)
      
      // Recharger les statistiques
      loadDataStats()
      
      if (result.success) {
        logger.info('✅ Import completed successfully')
      } else {
        logger.error('❌ Import completed with errors', new Error('Import errors'), { errors: result.errors })
      }
    } catch (error) {
      logger.error('❌ Import failed', error as Error)
      setSecurityError(`Erreur lors de l&apos;import: ${error}`)
      setImportResult({
        success: false,
        imported: {
          users: 0,
          admins: 0,
          movies: 0,
          series: 0,
          analytics: false,
          userProfiles: 0,
          notifications: 0,
          watchHistory: 0,
          watchlist: 0,
          ratings: 0,
          currentUser: false,
          adminUser: false,
          userSessions: false,
          bannedUsers: 0,
          userStats: false,
          userPremium: false,
          userAnalytics: false,
          userPreferences: false,
          userLocation: false,
          adminSettings: false,
          adminSecurity: false,
          adminErrors: false,
          adminPremium: false,
          adminHomepage: false,
          homepageContent: false,
          premiumCodes: 0,
          subscriptionPrice: false,
          subscriptionNotifications: false,
          subscriptionPlans: false,
          postPaymentLinks: false,
          postPaymentLinksActive: false,
          paymentLinks: false,
          paymentLinksActive: false,
          postPaymentCodes: false,
          postPaymentCodesActive: false,
          geographicRestrictions: false,
          systemSettings: false
        },
        errors: [`Erreur lors de l&apos;import: ${error}`]
      })
    } finally {
      setIsImporting(false)
      // Réinitialiser l&apos;input file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAll = async () => {
    try {
      // Vérification de sécurité
      if (!securityCheck) {
        setSecurityError('Vérification de sécurité requise')
        return
      }

      // Générer le rapport de suppression
      const report = await DataManagementService.generateDeletionReport()
      setDeletionReport(report)
      setConfirmationStep(1) // Commencer à l'étape 1
      setShowDeleteConfirm(true)
      setSecurityError(null) // Effacer les erreurs précédentes
    } catch (error) {
      logger.error('❌ Error generating deletion report', error as Error)
      setSecurityError(`Erreur lors de la génération du rapport: ${error}`)
    }
  }

  const handleConfirmation = async (step: number) => {
    if (step === 1) {
      // Confirmation 1: Êtes-vous sûr ?
      setConfirmationStep(2)
    } else if (step === 2) {
      // Confirmation 2: Cette action est IRRÉVERSIBLE !
      setConfirmationStep(3)
    } else if (step === 3) {
      // Confirmation 3: Tapez "SUPPRIMER"
      if (confirmationText === 'SUPPRIMER') {
        await executeDelete()
      } else {
        setSecurityError('Veuillez taper exactement "SUPPRIMER" pour confirmer')
      }
    }
  }

  const executeDelete = async () => {
    try {
      setIsDeleting(true)
      setSecurityError(null)
      
      // Utiliser la méthode sécurisée
      await DataManagementService.secureDeleteAllData()
      
      // Recharger les statistiques
      loadDataStats()
      
      logger.info('✅ All data deleted successfully')
      setConfirmationStep(0)
      setConfirmationText('')
      setDeletionReport(null)
      setShowDeleteConfirm(false)
    } catch (error) {
      logger.error('❌ Delete failed', error as Error)
      setSecurityError(`Erreur lors de la suppression: ${error}`)
      setConfirmationStep(0)
      setConfirmationText('')
      setDeletionReport(null)
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setConfirmationStep(0)
    setConfirmationText('')
    setDeletionReport(null)
    setSecurityError(null)
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <DocumentIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Données</h2>
        </div>
      </div>

      {/* Erreurs de sécurité uniquement */}
      {securityError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="font-medium text-red-300 text-sm sm:text-base break-words">{securityError}</span>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8 overflow-x-auto [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full scroll-smooth">
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors min-h-[44px] sm:min-h-0 whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Données</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('geographic')}
            className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors min-h-[44px] sm:min-h-0 whitespace-nowrap ${
              activeTab === 'geographic'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Restrictions Géographiques</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'data' && (
        <>
          {/* Statistiques des données */}
          {dataStats && (
            <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
              <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-2xl">Statistiques des Données</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(dataStats.users)}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Utilisateurs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(dataStats.movies)}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Films</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(dataStats.series)}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Séries</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(dataStats.admins)}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(dataStats.premiumCodes)}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Code Premium</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{dataStats.totalSize}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Taille totale</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions de gestion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Export */}
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg">Exporter les Données</h3>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
            Téléchargez toutes les données de l&apos;application dans un fichier JSON
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Export en cours...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Exporter</span>
              </>
            )}
          </button>
        </div>

        {/* Import */}
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowUpTrayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg">Importer les Données</h3>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
            Restaurez les données depuis un fichier JSON précédemment exporté
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Import en cours...</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Importer</span>
              </>
            )}
          </button>
        </div>

        {/* Suppression */}
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg">Supprimer Tout</h3>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
            ⚠️ Supprime définitivement toutes les données de l&apos;application
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="w-full flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Supprimer</span>
              </>
            )}
          </button>
        </div>
      </div>
        </>
      )}

      {/* Onglet Restrictions Géographiques */}
      {activeTab === 'geographic' && (
        <GeographicManager />
      )}

      {/* Résultat de l&apos;import - Affiché uniquement sur l&apos;onglet Données */}
      {activeTab === 'data' && importResult && (
        <div className={`rounded-lg p-3 sm:p-4 md:p-5 ${
          importResult.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-2.5 mb-3 sm:mb-4">
            {importResult.success ? (
              <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
            )}
            <h4 className={`font-semibold text-sm sm:text-base md:text-lg ${
              importResult.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {importResult.success ? 'Import Réussi' : 'Import Échoué'}
            </h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="text-center">
              <p className="text-white font-semibold text-base sm:text-lg md:text-xl">{importResult.imported.users}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Utilisateurs</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base sm:text-lg md:text-xl">{importResult.imported.movies}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Films</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base sm:text-lg md:text-xl">{importResult.imported.series}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Séries</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base sm:text-lg md:text-xl">{importResult.imported.admins}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Admins</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base sm:text-lg md:text-xl">{importResult.imported.premiumCodes}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Code Premium</p>
            </div>
          </div>
          
          {importResult.errors.length > 0 && (
            <div className="mt-3 sm:mt-4">
              <h5 className="text-red-400 font-medium mb-2 sm:mb-3 text-sm sm:text-base">Erreurs :</h5>
              <ul className="text-red-300 text-xs sm:text-sm space-y-1 sm:space-y-1.5">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression avec sécurités */}
      {activeTab === 'data' && showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-dark-200 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              {/* En-tête */}
              <div className="flex items-center mb-4 sm:mb-5 md:mb-6">
                <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  ⚠️ ATTENTION - ACTION CRITIQUE ⚠️
                </h2>
              </div>

              {/* Rapport de suppression */}
              {deletionReport && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
                  <h3 className="font-semibold text-red-300 mb-2 sm:mb-3 text-sm sm:text-base">
                    Cette action va supprimer TOUTES les données de l&apos;application :
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="font-medium text-red-200">👥 Utilisateurs :</span> {deletionReport.users}
                    </div>
                    <div>
                      <span className="font-medium text-red-200">🎬 Films :</span> {deletionReport.movies}
                    </div>
                    <div>
                      <span className="font-medium text-red-200">📺 Séries :</span> {deletionReport.series}
                    </div>
                    <div>
                      <span className="font-medium text-red-200">💾 Taille :</span> {deletionReport.totalSize}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <span className="font-medium text-red-400 text-xs sm:text-sm">Impact :</span> <span className="text-xs sm:text-sm">{deletionReport.impact}</span>
                  </div>
                </div>
              )}

              {/* Backup automatique */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="font-medium text-green-300 text-xs sm:text-sm break-words">
                    Backup automatique créé : backup_{new Date().toISOString().split('T')[0]}.json
                  </span>
                </div>
              </div>

              {/* Debug */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-blue-300 text-xs sm:text-sm">
                  Debug: confirmationStep = {confirmationStep}
                </p>
              </div>

              {/* Confirmations */}
              <div className="space-y-3 sm:space-y-4">
                {confirmationStep === 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-blue-300 mb-2 text-sm sm:text-base">
                      Prêt à commencer la suppression ?
                    </h3>
                    <p className="text-blue-200 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Cliquez sur &quot;Commencer&quot; pour lancer le processus de confirmation en 3 étapes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => setConfirmationStep(1)}
                        className="bg-blue-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        Commencer
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="bg-gray-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {confirmationStep === 1 && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-yellow-300 mb-2 text-sm sm:text-base">
                      Confirmation 1/3 : Êtes-vous sûr ?
                    </h3>
                    <p className="text-yellow-200 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Cette action va supprimer définitivement toutes les données de l&apos;application.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleConfirmation(1)}
                        className="bg-yellow-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-yellow-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        OUI, je suis sûr
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="bg-gray-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        NON, annuler
                      </button>
                    </div>
                  </div>
                )}

                {confirmationStep === 2 && (
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-orange-300 mb-2 text-sm sm:text-base">
                      Confirmation 2/3 : Cette action est IRRÉVERSIBLE !
                    </h3>
                    <p className="text-orange-200 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Une fois supprimées, ces données ne pourront pas être récupérées sans backup.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleConfirmation(2)}
                        className="bg-orange-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        OUI, je comprends
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="bg-gray-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        NON, annuler
                      </button>
                    </div>
                  </div>
                )}

                {confirmationStep === 3 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-red-300 mb-2 text-sm sm:text-base">
                      Confirmation 3/3 : Tapez &quot;SUPPRIMER&quot; pour confirmer
                    </h3>
                    <p className="text-red-200 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Tapez exactement le mot &quot;SUPPRIMER&quot; dans le champ ci-dessous pour finaliser l&apos;action.
                    </p>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="Tapez SUPPRIMER"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-300 border border-red-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white mb-3 sm:mb-4 text-sm sm:text-base min-h-[44px]"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleConfirmation(3)}
                        disabled={confirmationText !== 'SUPPRIMER'}
                        className="bg-red-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        SUPPRIMER DÉFINITIVEMENT
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="bg-gray-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Message de sécurité */}
              <div className="mt-4 sm:mt-5 md:mt-6 text-center">
                <p className="text-xs sm:text-sm text-gray-400">
                  🚀 Suppression immédiate après confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface de chargement */}
      {(isExporting || isImporting || isDeleting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 sm:mb-3">
                {isExporting && '🔄 Exportation en cours...'}
                {isImporting && '🔄 Importation en cours...'}
                {isDeleting && '🔄 Suppression en cours...'}
              </h3>
              <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                ⏰ Veuillez patienter...
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                📊 Traitement des données...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


