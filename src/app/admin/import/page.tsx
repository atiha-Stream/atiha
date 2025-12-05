'use client'

import { useState, useRef } from 'react'
import { useAdminAuth } from '@/lib/admin-auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { ArrowLeftIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { AdminContentService } from '@/lib/admin-content-service'
import { ImportResult } from '@/types/admin'
import ExcelJS from 'exceljs'
import { logger } from '@/lib/logger'

export default function ImportPage() {
  const { admin } = useAdminAuth()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fonction d&apos;export Excel pour les films
  const exportFilmsToExcel = async () => {
    try {
      setIsExporting(true)
      const movies = await AdminContentService.exportContent('films')
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Films')
      
      // En-têtes selon la structure des données
      worksheet.columns = [
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Titre', key: 'title', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Année', key: 'year', width: 10 },
        { header: 'Catalogue', key: 'catalogue', width: 15 },
        { header: 'Genres', key: 'genre', width: 20 },
        { header: 'Réalisateur', key: 'director', width: 25 },
        { header: 'Casting', key: 'cast', width: 30 },
        { header: 'URL Vidéo', key: 'videoUrl', width: 40 },
        { header: 'URL Affiche', key: 'posterUrl', width: 40 },
        { header: 'URL Bande Annonce', key: 'trailerUrl', width: 40 },
        { header: 'URL Aperçu', key: 'previewUrl', width: 40 },
        { header: 'Premium', key: 'isPremium', width: 15 }
      ]
      
      // Données
      movies.forEach((movie: any) => {
        worksheet.addRow({
          type: 'movie',
          title: movie.title || '',
          description: movie.description || '',
          year: movie.year || '',
          catalogue: movie.catalogue || 'collection',
          genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || '',
          director: movie.director || '',
          cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || '',
          videoUrl: movie.videoUrl || '',
          posterUrl: movie.posterUrl || '',
          trailerUrl: movie.trailerUrl || '',
          previewUrl: movie.previewUrl || '',
          isPremium: movie.isPremium ? 'true' : 'false'
        })
      })
      
      // Télécharger
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `export_films_atiha_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      logger.error('Erreur export films', error as Error)
    } finally {
      setIsExporting(false)
    }
  }

  // Fonction d&apos;export Excel pour les séries
  const exportSeriesToExcel = async () => {
    try {
      setIsExporting(true)
      const series = await AdminContentService.exportContent('series')
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Séries')
      
      // En-têtes selon la structure des données
      worksheet.columns = [
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Titre', key: 'title', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Année', key: 'year', width: 10 },
        { header: 'Catalogue', key: 'catalogue', width: 15 },
        { header: 'Genres', key: 'genre', width: 20 },
        { header: 'Réalisateur', key: 'director', width: 25 },
        { header: 'Casting', key: 'cast', width: 30 },
        { header: 'URL Vidéo', key: 'videoUrl', width: 40 },
        { header: 'URL Affiche', key: 'posterUrl', width: 40 },
        { header: 'URL Bande Annonce', key: 'trailerUrl', width: 40 },
        { header: 'URL Aperçu', key: 'previewUrl', width: 40 },
        { header: 'Premium', key: 'isPremium', width: 15 },
        { header: 'Numéro Saison', key: 'seasonNumber', width: 15 },
        { header: 'Numéro Épisode', key: 'episodeNumber', width: 15 },
        { header: 'Titre Épisode', key: 'episodeTitle', width: 30 },
        { header: 'Description Épisode', key: 'episodeDescription', width: 50 },
        { header: 'Durée Épisode', key: 'episodeDuration', width: 15 },
        { header: 'URL Vidéo Épisode', key: 'episodeVideoUrl', width: 40 },
        { header: 'URL Aperçu Épisode', key: 'episodePreviewUrl', width: 40 },
        { header: 'URL Miniature Épisode', key: 'episodeThumbnailUrl', width: 40 }
      ]
      
      // Données - Une ligne par série avec tous les épisodes groupés
      series.forEach((serie: any) => {
        if (serie.seasons && serie.seasons.length > 0) {
          // Créer une seule ligne par série avec tous les épisodes
          const allEpisodes = serie.seasons.flatMap((season: any) => 
            season.episodes.map((episode: any) => ({
              seasonNumber: season.seasonNumber,
              episodeNumber: episode.episodeNumber,
              episodeTitle: episode.title,
              episodeDescription: episode.description,
              episodeDuration: episode.duration,
              episodeVideoUrl: episode.videoUrl,
              episodePreviewUrl: episode.previewUrl,
              episodeThumbnailUrl: episode.thumbnailUrl
            }))
          )
          
          // Exporter chaque épisode sur une ligne séparée mais avec les mêmes données de série
          allEpisodes.forEach((episode: any) => {
            worksheet.addRow({
              type: 'series',
              title: serie.title || '',
              description: serie.description || '',
              year: serie.year || '',
              catalogue: serie.catalogue || 'collection',
              genre: Array.isArray(serie.genre) ? serie.genre.join(', ') : serie.genre || '',
              director: serie.director || '',
              cast: Array.isArray(serie.cast) ? serie.cast.join(', ') : serie.cast || '',
              videoUrl: serie.videoUrl || '',
              posterUrl: serie.posterUrl || '',
              trailerUrl: serie.trailerUrl || '',
              previewUrl: serie.previewUrl || '',
              isPremium: serie.isPremium ? 'true' : 'false',
              seasonNumber: episode.seasonNumber || 1,
              episodeNumber: episode.episodeNumber || 1,
              episodeTitle: episode.episodeTitle || '',
              episodeDescription: episode.episodeDescription || '',
              episodeDuration: episode.episodeDuration || 45,
              episodeVideoUrl: episode.episodeVideoUrl || '',
              episodePreviewUrl: episode.episodePreviewUrl || '',
              episodeThumbnailUrl: episode.episodeThumbnailUrl || ''
            })
          })
        } else {
          // Série sans épisodes
          worksheet.addRow({
            type: 'series',
            title: serie.title || '',
            description: serie.description || '',
            year: serie.year || '',
            catalogue: serie.catalogue || 'collection',
            genre: Array.isArray(serie.genre) ? serie.genre.join(', ') : serie.genre || '',
            director: serie.director || '',
            cast: Array.isArray(serie.cast) ? serie.cast.join(', ') : serie.cast || '',
            videoUrl: serie.videoUrl || '',
            posterUrl: serie.posterUrl || '',
            trailerUrl: serie.trailerUrl || '',
            previewUrl: serie.previewUrl || '',
            isPremium: serie.isPremium ? 'true' : 'false',
            seasonNumber: '',
            episodeNumber: '',
            episodeTitle: '',
            episodeDescription: '',
            episodeDuration: '',
            episodeVideoUrl: '',
            episodePreviewUrl: '',
            episodeThumbnailUrl: ''
          })
        }
      })
      
      // Télécharger
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `export_series_atiha_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      logger.error('Erreur export séries', error as Error)
    } finally {
      setIsExporting(false)
    }
  }

  // Fonction d&apos;import Excel
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const workbook = new ExcelJS.Workbook()
      const buffer = await selectedFile.arrayBuffer()
      await workbook.xlsx.load(buffer)
      
      const worksheet = workbook.worksheets[0]
      const rows = worksheet.getRows(2, worksheet.rowCount - 1) || []
      
      let importedCount = 0
      const errors: string[] = []
      
      // Grouper les données par série avant de les traiter
      const seriesMap = new Map<string, any>()
      const moviesData = []
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = i + 2
        
        try {
          // Déterminer le type de contenu basé sur la colonne "Type"
          const contentType = row.getCell(1).value?.toString()?.toLowerCase() || ''
          
          if (contentType === 'movie' || contentType === 'film') {
            const movieData = {
              type: 'movie' as const,
              title: row.getCell(2).value?.toString() || '',
              description: row.getCell(3).value?.toString() || '',
              year: parseInt(row.getCell(4).value?.toString() || '2024'),
              catalogue: row.getCell(5).value?.toString() || 'collection',
              genre: row.getCell(6).value?.toString()?.split(',').map((g: string) => g.trim()) || [],
              director: row.getCell(7).value?.toString() || '',
              cast: row.getCell(8).value?.toString()?.split(',').map((c: string) => c.trim()) || [],
              videoUrl: row.getCell(9).value?.toString() || '',
              posterUrl: row.getCell(10).value?.toString() || '',
              trailerUrl: row.getCell(11).value?.toString() || '',
              previewUrl: row.getCell(12).value?.toString() || '',
              isPremium: row.getCell(13).value?.toString()?.toLowerCase() === 'true' || row.getCell(13).value?.toString()?.toLowerCase() === 'premium'
            }
            
            moviesData.push(movieData)
          } else if (contentType === 'series' || contentType === 'serie') {
            // Pour les séries, grouper par titre
            const seriesTitle = row.getCell(2).value?.toString() || ''
            const seasonNumber = parseInt(row.getCell(14).value?.toString() || '1')
            const episodeNumber = parseInt(row.getCell(15).value?.toString() || '1')
            const episodeTitle = row.getCell(16).value?.toString()
            const episodeDescription = row.getCell(17).value?.toString()
            const episodeDuration = parseInt(row.getCell(18).value?.toString() || '45')
            const episodeVideoUrl = row.getCell(19).value?.toString()
            const episodePreviewUrl = row.getCell(20).value?.toString()
            const episodeThumbnailUrl = row.getCell(21).value?.toString()
            
            if (!seriesMap.has(seriesTitle)) {
              // Créer une nouvelle série
              seriesMap.set(seriesTitle, {
                type: 'series' as const,
                title: seriesTitle,
                description: row.getCell(3).value?.toString() || '',
                year: parseInt(row.getCell(4).value?.toString() || '2024'),
                catalogue: row.getCell(5).value?.toString() || 'collection',
                genre: row.getCell(6).value?.toString()?.split(',').map((g: string) => g.trim()) || [],
                director: row.getCell(7).value?.toString() || '',
                cast: row.getCell(8).value?.toString()?.split(',').map((c: string) => c.trim()) || [],
                videoUrl: row.getCell(9).value?.toString() || '',
                posterUrl: row.getCell(10).value?.toString() || '',
                trailerUrl: row.getCell(11).value?.toString() || '',
                previewUrl: row.getCell(12).value?.toString() || '',
                isPremium: row.getCell(13).value?.toString()?.toLowerCase() === 'true' || row.getCell(13).value?.toString()?.toLowerCase() === 'premium',
                seasons: []
              })
            }
            
            const series = seriesMap.get(seriesTitle)
            
            // Chercher si la saison existe déjà
            let existingSeason = series.seasons.find((s: any) => s.seasonNumber === seasonNumber)
            if (!existingSeason) {
              existingSeason = {
                seasonNumber: seasonNumber,
                title: `Saison ${seasonNumber}`,
                description: '',
                episodes: []
              }
              series.seasons.push(existingSeason)
            }
            
            // Ajouter l'épisode
            existingSeason.episodes.push({
              episodeNumber: episodeNumber,
              title: episodeTitle || `Épisode ${episodeNumber}`,
              description: episodeDescription || '',
              duration: episodeDuration,
              videoUrl: episodeVideoUrl || '',
              previewUrl: episodePreviewUrl || '',
              thumbnailUrl: episodeThumbnailUrl || series.posterUrl
            })
          } else {
            errors.push(`Ligne ${rowNumber}: Type de contenu non reconnu (${contentType})`)
          }
        } catch (error) {
          errors.push(`Ligne ${rowNumber}: Erreur lors du traitement - ${error}`)
        }
      }
      
      // Traiter les films
      for (const movieData of moviesData) {
        try {
          const movie = await AdminContentService.addMovie(movieData)
          if (movie) {
            importedCount++
          }
        } catch (error) {
          errors.push(`Erreur lors du traitement du film "${movieData.title}": ${error}`)
        }
      }
      
      // Traiter les séries groupées
      for (const [title, seriesData] of seriesMap) {
        try {
          const series = await AdminContentService.addSeries(seriesData)
          if (series) {
            importedCount++
          }
        } catch (error) {
          errors.push(`Erreur lors du traitement de la série "${title}": ${error}`)
        }
      }
      
      setImportResult({
        success: importedCount > 0,
        importedCount,
        errors: errors.length > 0 ? errors : []
      })
      
    } catch (error) {
      logger.error('Erreur import', error as Error)
      setImportResult({
        success: false,
        importedCount: 0,
        errors: ['Erreur lors de l\'import du fichier Excel']
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-800">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Retour</span>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ArrowUpTrayIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Import/Export</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section Export */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <DocumentArrowDownIcon className="w-6 h-6 mr-2 text-green-400" />
                Exporter les Données
              </h2>
              <p className="text-gray-400 mb-6">
                Téléchargez vos films et séries au format Excel pour sauvegarder ou partager vos données.
              </p>
              
              <div className="space-y-4">
                    <button
                  onClick={exportFilmsToExcel}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  {isExporting ? 'Export en cours...' : 'Télécharger les Films'}
                    </button>
                
                    <button
                  onClick={exportSeriesToExcel}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  {isExporting ? 'Export en cours...' : 'Télécharger les Séries'}
                    </button>
              </div>
            </div>

            {/* Section Import */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <DocumentArrowUpIcon className="w-6 h-6 mr-2 text-orange-400" />
                Importer des Données
              </h2>
              <p className="text-gray-400 mb-6">
                Importez des films et séries depuis un fichier Excel pour ajouter du contenu à votre galerie.
              </p>
              
              <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                  accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                
                    <button
                      onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                  <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                  {selectedFile ? selectedFile.name : 'Sélectionner un fichier Excel'}
                    </button>
                
                {selectedFile && (
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded-lg transition-colors"
                  >
                    <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                    {isImporting ? 'Import en cours...' : 'Importer le fichier'}
                  </button>
                )}
              </div>
              </div>
            </div>

          {/* Résultats d&apos;import */}
            {importResult && (
            <div className="mt-8">
              <div className={`p-6 rounded-lg ${
                importResult.success 
                  ? 'bg-green-900/20 border border-green-500/30' 
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  {importResult.success ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                  )}
                  <h3 className="text-lg font-semibold text-white">
                    {importResult.success ? 'Import réussi' : 'Erreur lors de l\'import'}
                  </h3>
                </div>
                
                {importResult.success ? (
                  <p className="text-green-300">
                      {importResult.importedCount} élément(s) importé(s) avec succès.
                    </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-300">Erreur lors de l&apos;import</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Erreurs :</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300">
                          {importResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
      </div>
    </AdminProtectedRoute>
  )
}