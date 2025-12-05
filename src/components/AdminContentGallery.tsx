'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Movie, Series } from '@/types/content'
import { AdminContentService } from '@/lib/admin-content-service'
import { FilmIcon, TvIcon, CalendarIcon, TagIcon, TrashIcon, CheckIcon, XMarkIcon, PencilIcon, BookOpenIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import EditContentModal from './EditContentModal'
import Image from 'next/image'
import { logger } from '@/lib/logger'

export default function AdminContentGallery() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [activeTab, setActiveTab] = useState<'movies' | 'series' | 'delete' | 'add-import-export'>('movies')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedCatalogue, setSelectedCatalogue] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingItem, setEditingItem] = useState<Movie | Series | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        
        // Pas d'initialisation automatique des données de test
        
        const [moviesData, seriesData] = await Promise.all([
          AdminContentService.getStoredMovies(),
          AdminContentService.getStoredSeries()
        ])
        
        setMovies(moviesData)
        setSeries(seriesData)
      } catch (error) {
        logger.error('Error loading content', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [])

  // Obtenir toutes les années disponibles
  const availableYears = useMemo(() => {
    const content = (activeTab === 'delete' || activeTab === 'add-import-export') ? [...movies, ...series] : (activeTab === 'movies' ? movies : series)
    const yearsSet = new Set(content.map(item => item.year))
    const years = Array.from(yearsSet).sort((a, b) => b - a)
    return years
  }, [activeTab, movies, series])

  // Obtenir tous les genres disponibles
  const availableGenres = useMemo(() => {
    const content = (activeTab === 'delete' || activeTab === 'add-import-export') ? [...movies, ...series] : (activeTab === 'movies' ? movies : series)
    const genresSet = new Set(content.flatMap(item => item.genre))
    const genres = Array.from(genresSet).sort()
    return genres
  }, [activeTab, movies, series])

  // Obtenir tous les catalogues disponibles
  const availableCatalogues = useMemo(() => {
    // Utiliser la liste prédéfinie des catalogues (même que dans add-content)
    const catalogues = [
      { value: 'collection', label: 'Notre collection' },
      { value: 'popular-movies', label: 'Films Populaires' },
      { value: 'popular-series', label: 'Séries Populaires' },
      { value: 'jeux', label: 'Jeux' },
      { value: 'sports', label: 'Sports' },
      { value: 'animes', label: 'Animes' },
      { value: 'tendances', label: 'Tendances' },
      { value: 'documentaires', label: 'Documentaires' },
      { value: 'divertissements', label: 'Divertissements' }
    ]
    
    return catalogues
  }, [])

  // Filtrer le contenu
  const filteredContent = useMemo(() => {
    const content = (activeTab === 'delete' || activeTab === 'add-import-export') ? [...movies, ...series] : (activeTab === 'movies' ? movies : series)
    
    // Supprimer les doublons par ID (protection contre les collisions)
    const uniqueContent = content.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )
    
    return uniqueContent.filter(item => {
      const yearMatch = selectedYear === 'all' || item.year.toString() === selectedYear
      const genreMatch = selectedGenre === 'all' || item.genre.includes(selectedGenre)
      const catalogueMatch = selectedCatalogue === 'all' || item.catalogue === selectedCatalogue
      return yearMatch && genreMatch && catalogueMatch
    })
  }, [activeTab, movies, series, selectedYear, selectedGenre, selectedCatalogue])

  // Fonctions de gestion de la sélection
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const selectAllFiltered = useCallback(() => {
    const filteredIds = filteredContent.map(item => item.id)
    setSelectedItems(new Set(filteredIds))
  }, [filteredContent])

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  // Fonctions de gestion de l'édition
  const selectItemForEdit = (item: Movie | Series) => {
    setEditingItem(item)
    setIsEditMode(true)
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setIsEditMode(false)
  }

  const saveEdit = async (updatedData: Partial<Movie | Series>) => {
    if (!editingItem) return

    try {
      // Déterminer le type de contenu basé sur la présence de 'seasons'
      const isMovie = !('seasons' in updatedData) || !Array.isArray(updatedData.seasons)
      
      await AdminContentService.updateContent(
        editingItem.id, 
        isMovie ? 'movie' : 'series', 
        updatedData
      )
      
      // Recharger les données
      const [moviesData, seriesData] = await Promise.all([
        AdminContentService.getStoredMovies(),
        AdminContentService.getStoredSeries()
      ])
      
      setMovies(moviesData)
      setSeries(seriesData)
      setEditingItem(null)
      setIsEditMode(false)
      
      alert('Contenu modifié avec succès !')
    } catch (error) {
      logger.error('Error updating content', error as Error)
      alert('Erreur lors de la modification')
    }
  }

  // Fonction de suppression
  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return

    setIsDeleting(true)
    try {
      const selectedArray = Array.from(selectedItems)
      for (const itemId of selectedArray) {
        // Vérifier dans les deux listes pour déterminer le type
        const isMovie = movies.some(movie => movie.id === itemId)
        const isSeries = series.some(serie => serie.id === itemId)
        
        if (isMovie) {
          await AdminContentService.deleteContent(itemId, 'movie')
        } else if (isSeries) {
          await AdminContentService.deleteContent(itemId, 'series')
        }
      }
      
      // Recharger les données
      const [moviesData, seriesData] = await Promise.all([
        AdminContentService.getStoredMovies(),
        AdminContentService.getStoredSeries()
      ])
      
      setMovies(moviesData)
      setSeries(seriesData)
      setSelectedItems(new Set())
      
      alert(`${selectedItems.size} élément(s) supprimé(s) avec succès !`)
    } catch (error) {
      logger.error('Error deleting items', error as Error)
      alert('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  // Fonction d&apos;export multiple
  const exportSelectedItems = async () => {
    if (selectedItems.size === 0) return

    setIsExporting(true)
    setErrors([])
    setSuccess('')

    try {
      const allContent = [...movies, ...series]
      const selectedContent = allContent.filter(item => selectedItems.has(item.id))
      
      let exportedCount = 0
      for (const item of selectedContent) {
        const isMovie = movies.some(movie => movie.id === item.id)
        const exportData = {
          formData: {
            title: item.title,
            description: item.description,
            year: item.year,
            catalogue: 'catalogue' in item ? item.catalogue || 'collection' : 'collection',
            genre: item.genre,
            director: item.director,
            cast: item.cast,
            videoUrl: 'videoUrl' in item ? item.videoUrl : '',
            posterUrl: item.posterUrl,
            trailerUrl: 'trailerUrl' in item ? item.trailerUrl || '' : '',
            previewUrl: 'previewUrl' in item ? item.previewUrl || '' : '',
            isPremium: 'isPremium' in item ? item.isPremium || false : false
          },
          seasons: isMovie ? undefined : ('seasons' in item ? item.seasons : undefined),
          exportDate: new Date().toISOString(),
          exportType: isMovie ? 'movie' : 'series',
          originalId: item.id
        }
        
        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `${isMovie ? 'film' : 'serie'}_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        exportedCount++
      }
      
      setSuccess(`${exportedCount} fichier(s) exporté(s) avec succès !`)
      setSelectedItems(new Set())
    } catch (error) {
      logger.error('Error exporting items', error as Error)
      setErrors(['Erreur lors de l\'exportation des fichiers'])
    } finally {
      setIsExporting(false)
    }
  }

  // Fonction d&apos;import multiple (ajout et mise à jour)
  const importMultipleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsImporting(true)
    setErrors([])
    setSuccess('')

    try {
      const allContent = [...movies, ...series]
      let importedCount = 0
      let addedCount = 0
      let updatedCount = 0
      const importErrors: string[] = []

      // Traitement par batch pour améliorer les performances
      const BATCH_SIZE = 10 // Traiter 10 fichiers à la fois
      
      for (let batchStart = 0; batchStart < files.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, files.length)
        const batch = Array.from(files).slice(batchStart, batchEnd)
        
        // Traiter le batch en parallèle
        await Promise.all(batch.map(async (file) => {
          const reader = new FileReader()
          
          return new Promise<void>((resolve) => {
          reader.onload = async (e) => {
            try {
              const importData = JSON.parse(e.target?.result as string)
              
              // Vérifier la structure des données
              if (!importData.formData || !importData.exportType) {
                importErrors.push(`${file.name}: Format de fichier invalide`)
                resolve()
                return
              }

              const isMovie = importData.exportType === 'movie'
              
              // Si originalId existe, essayer de mettre à jour
              if (importData.originalId) {
                const existingItem = allContent.find(item => item.id === importData.originalId)
                if (!existingItem) {
                  // Contenu non trouvé avec originalId → Ajouter comme nouveau contenu
                  const newContentData = {
                    ...importData.formData,
                    ...(isMovie ? {} : { seasons: importData.seasons || [] })
                  }

                  if (isMovie) {
                    await AdminContentService.addMovie(newContentData)
                  } else {
                    await AdminContentService.addSeries(newContentData)
                  }

                  addedCount++
                } else {
                  // Vérifier que le type correspond
                  const existingIsMovie = movies.some(movie => movie.id === importData.originalId)
                  if (importData.exportType !== (existingIsMovie ? 'movie' : 'series')) {
                    importErrors.push(`${file.name}: Type de contenu incorrect`)
                    resolve()
                    return
                  }

                  // Mettre à jour le contenu existant
                  const updatedData = {
                    ...existingItem,
                    ...importData.formData,
                    ...(isMovie ? {} : { seasons: importData.seasons || ('seasons' in existingItem ? existingItem.seasons : []) })
                  }

                  await AdminContentService.updateContent(
                    importData.originalId,
                    isMovie ? 'movie' : 'series',
                    updatedData
                  )

                  updatedCount++
                }
              } else {
                // C'est un nouveau contenu à ajouter
                const newContentData = {
                  ...importData.formData,
                  ...(isMovie ? {} : { seasons: importData.seasons || [] })
                }

                if (isMovie) {
                  await AdminContentService.addMovie(newContentData)
                } else {
                  await AdminContentService.addSeries(newContentData)
                }

                addedCount++
              }

              importedCount++
              resolve()
            } catch (error) {
              importErrors.push(`${file.name}: Erreur de lecture du fichier`)
              resolve()
            }
          }
          
          reader.onerror = () => {
            importErrors.push(`${file.name}: Erreur de lecture du fichier`)
            resolve()
          }
          
          reader.readAsText(file)
          })
        }))
        
        // Mettre à jour le message de progression
        if (batchStart + BATCH_SIZE < files.length) {
          setSuccess(`Traitement en cours... ${Math.min(batchStart + BATCH_SIZE, files.length)}/${files.length} fichiers`)
        }
      }

      // Recharger les données
      const [moviesData, seriesData] = await Promise.all([
        AdminContentService.getStoredMovies(),
        AdminContentService.getStoredSeries()
      ])
      
      setMovies(moviesData)
      setSeries(seriesData)

      if (importedCount > 0) {
        let successMessage = `${importedCount} fichier(s) traité(s) avec succès !`
        if (addedCount > 0) successMessage += ` (${addedCount} ajouté(s))`
        if (updatedCount > 0) successMessage += ` (${updatedCount} mis à jour)`
        setSuccess(successMessage)
      }
      
      if (importErrors.length > 0) {
        setErrors(importErrors)
      }
      
      // Réinitialiser l'input file
      event.target.value = ''
    } catch (error) {
      console.error('Error importing files:', error)
      setErrors(['Erreur lors de l\'importation des fichiers'])
    } finally {
      setIsImporting(false)
    }
  }

  // Obtenir le contenu filtré (sans groupement par année)
  // Les valeurs sont déjà calculées avec useMemo ci-dessus

  // Effacer les messages après 5 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 8000)
      return () => clearTimeout(timer)
    }
  }, [errors])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Onglets Films/Séries/Supprimer */}
      {/* Version Mobile : Films et Séries en haut, Ajout/Import/Export et Supprimer en bas */}
      <div className="flex flex-col md:flex-row md:space-x-1 space-y-2 md:space-y-0 bg-dark-100 p-1 rounded-lg">
        {/* Rangée 1 : Films et Séries */}
        <div className="flex space-x-1">
          <button
            onClick={() => { setActiveTab('movies'); clearSelection(); cancelEdit() }}
            className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md transition-colors flex-1 md:flex-none min-h-[44px] ${
              activeTab === 'movies'
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base">Films ({movies.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('series'); clearSelection(); cancelEdit() }}
            className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md transition-colors flex-1 md:flex-none min-h-[44px] ${
              activeTab === 'series'
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TvIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base">Séries ({series.length})</span>
          </button>
        </div>
        
        {/* Séparateur sur mobile */}
        <div className="md:hidden h-px bg-gray-600"></div>
        
        {/* Rangée 2 : Ajout/Import/Export et Supprimer */}
        <div className="flex space-x-1">
          <button
            onClick={() => { setActiveTab('add-import-export'); clearSelection(); cancelEdit() }}
            className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md transition-colors flex-1 md:flex-none min-h-[44px] ${
              activeTab === 'add-import-export'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base">Ajout/Import/Export</span>
          </button>
          <button
            onClick={() => { setActiveTab('delete'); clearSelection(); cancelEdit() }}
            className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md transition-colors flex-1 md:flex-none min-h-[44px] ${
              activeTab === 'delete'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base">Supprimer</span>
          </button>
        </div>
      </div>

      {/* Messages d'erreur et de succès */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        {/* Filtre par année */}
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Toutes les années</option>
            {availableYears.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>

        {/* Filtre par genre */}
        <div className="flex items-center space-x-2">
          <TagIcon className="w-5 h-5 text-gray-400" />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les genres</option>
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Filtre par catalogue */}
        <div className="flex items-center space-x-2">
          <BookOpenIcon className="w-5 h-5 text-gray-400" />
          <select
            value={selectedCatalogue}
            onChange={(e) => setSelectedCatalogue(e.target.value)}
            className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les catalogues</option>
            {availableCatalogues.map(catalogue => (
              <option key={catalogue.value} value={catalogue.value}>{catalogue.label}</option>
            ))}
          </select>
        </div>

        {/* Contrôles pour les onglets Films et Séries */}
        {(activeTab === 'movies' || activeTab === 'series') && (
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-gray-400 text-sm">
              Cliquez sur un élément pour le modifier
            </span>
          </div>
        )}


        {/* Contrôles de sélection pour l'onglet Supprimer */}
        {activeTab === 'delete' && (
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={selectAllFiltered}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Tout sélectionner</span>
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Désélectionner</span>
            </button>
            {selectedItems.size > 0 && (
              <button
                onClick={deleteSelectedItems}
                disabled={isDeleting}
                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                <span>{isDeleting ? 'Suppression...' : `Supprimer (${selectedItems.size})`}</span>
              </button>
            )}
          </div>
        )}

        {/* Contrôles de sélection pour l'onglet Ajout/Import/Export */}
        {activeTab === 'add-import-export' && (
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={selectAllFiltered}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Tout sélectionner</span>
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Désélectionner</span>
            </button>
            {selectedItems.size > 0 && (
              <button
                onClick={exportSelectedItems}
                disabled={isExporting}
                className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>{isExporting ? 'Export...' : `Exporter (${selectedItems.size})`}</span>
              </button>
            )}
            <label className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50">
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>{isImporting ? 'Import...' : 'Importer'}</span>
              <input
                type="file"
                accept=".json"
                multiple
                onChange={importMultipleFiles}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        )}
      </div>

      {/* Galerie en grille horizontale */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'movies' ? (
              <FilmIcon className="w-8 h-8 text-gray-400" />
            ) : (
              <TvIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">
            Aucun {activeTab === 'movies' ? 'film' : 'série'} trouvé
          </h3>
          <p className="text-gray-400">
            Aucun contenu ne correspond aux filtres sélectionnés
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Compteur de résultats */}
          <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {filteredContent.length} {activeTab === 'delete' || activeTab === 'add-import-export' ? 'élément(s)' : (activeTab === 'movies' ? 'film(s)' : 'série(s)')} trouvé(s)
          </h3>
            <div className="flex items-center space-x-2">
              {(activeTab === 'delete' || activeTab === 'add-import-export') && selectedItems.size > 0 && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  activeTab === 'delete' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {selectedItems.size} sélectionné(s)
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                  Année {selectedYear}
                </span>
              )}
              {selectedGenre !== 'all' && (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                  Genre {selectedGenre}
                </span>
              )}
              {selectedCatalogue !== 'all' && (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                  Catalogue {selectedCatalogue}
                </span>
              )}
            </div>
          </div>

          {/* Grille responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
            {filteredContent.map((item) => {
              const isMovie = movies.some(movie => movie.id === item.id)
              const isSelected = selectedItems.has(item.id)
              
              return (
                <div key={item.id} className={`group flex flex-col ${activeTab === 'delete' || activeTab === 'movies' || activeTab === 'series' ? 'cursor-pointer' : ''}`}>
                  <div 
                    className={`aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden transition-all duration-300 relative ${
                      activeTab === 'delete' 
                        ? `cursor-pointer ${isSelected ? 'ring-4 ring-red-500' : 'hover:scale-105'}` 
                        : activeTab === 'add-import-export'
                        ? `cursor-pointer ${isSelected ? 'ring-4 ring-blue-500' : 'hover:scale-105'}`
                        : activeTab === 'movies' || activeTab === 'series'
                        ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-500'
                        : 'group-hover:scale-105'
                    }`}
                    onClick={
                      activeTab === 'delete' 
                        ? () => toggleItemSelection(item.id)
                        : activeTab === 'add-import-export'
                        ? () => toggleItemSelection(item.id)
                        : (activeTab === 'movies' || activeTab === 'series')
                        ? () => selectItemForEdit(item)
                        : undefined
                    }
                  >
                    {item.posterUrl ? (
                      <Image
                        src={item.posterUrl}
                        alt={`Affiche de ${item.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        unoptimized={item.posterUrl.includes('serversicuro.cc') || item.posterUrl.includes('cpasbienfr.fr')}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                        {isMovie ? (
                          <FilmIcon className="w-12 h-12 text-gray-400" />
                        ) : (
                          <TvIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    )}
                    
                    {/* Case à cocher pour l'onglet Supprimer */}
                    {activeTab === 'delete' && (
                      <div className="absolute top-2 left-2">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-red-500 border-red-500' 
                            : 'bg-black/60 border-white'
                        }`}>
                          {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    )}

                    {/* Case à cocher pour l'onglet Ajout/Import/Export */}
                    {activeTab === 'add-import-export' && (
                      <div className="absolute top-2 left-2">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-black/60 border-white'
                        }`}>
                          {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    )}

                    {/* Indicateur d'édition pour les onglets Films et Séries */}
                    {(activeTab === 'movies' || activeTab === 'series') && (
                      <div className="absolute top-2 left-2">
                        <div className="w-6 h-6 bg-blue-500/80 rounded flex items-center justify-center">
                          <PencilIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    
                    {/* Badge du type */}
                    <div className={`absolute ${
                      activeTab === 'delete' 
                        ? 'top-2 right-2' 
                        : (activeTab === 'movies' || activeTab === 'series')
                        ? 'top-2 right-2'
                        : 'top-2 left-2'
                    }`}>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isMovie 
                          ? 'bg-blue-500/80 text-white' 
                          : 'bg-green-500/80 text-white'
                      }`}>
                        {isMovie ? 'Film' : 'Série'}
                      </span>
                    </div>

                    {/* Note */}
                    <div className={`absolute ${
                      activeTab === 'delete' 
                        ? 'top-10 right-2' 
                        : (activeTab === 'movies' || activeTab === 'series')
                        ? 'top-10 right-2'
                        : 'top-2 right-2'
                    }`}>
                      <span className="bg-yellow-500/80 text-white px-2 py-1 rounded text-xs font-medium">
                        ⭐ {item.rating}
                      </span>
                    </div>

                    {/* Année */}
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                        {item.year}
                      </span>
                    </div>
                  </div>
                
                  <div className="mt-2 flex-1 flex flex-col">
                    <h4 className="text-white font-medium text-sm line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-xs mt-1">
                      {item.director}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.genre.slice(0, 2).map((genre, index) => (
                        <span
                          key={index}
                          className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                      {item.genre.length > 2 && (
                        <span className="text-gray-500 text-xs">
                          +{item.genre.length - 2}
                        </span>
                      )}
                    </div>
                    {/* Catalogue */}
                    <div className="mt-1">
                      <span className="bg-purple-600/80 text-white px-2 py-1 rounded text-xs font-medium">
                        📚 {item.catalogue}
                      </span>
                    </div>
                    {/* Indicateur de sélection */}
                    {activeTab === 'delete' && isSelected && (
                      <div className="mt-2 text-center">
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          ✓ Sélectionné
                        </span>
                      </div>
                    )}
                    {activeTab === 'add-import-export' && isSelected && (
                      <div className="mt-2 text-center">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                          ✓ Sélectionné
                        </span>
                      </div>
                    )}
                    
                    {/* Boutons d'action */}
                    {(activeTab === 'movies' || activeTab === 'series') && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/content/${item.id}`, '_blank')
                          }}
                          className="flex-1 min-w-[80px] bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                          title="Voir l&apos;aperçu"
                        >
                          <span>👁️</span>
                          <span className="hidden sm:inline">Aperçu</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            selectItemForEdit(item)
                          }}
                          className="flex-1 min-w-[80px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                          title="Modifier le contenu"
                        >
                          <span>✏️</span>
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/content/${item.id}/p`, '_blank')
                          }}
                          className="flex-1 min-w-[80px] bg-purple-500 hover:bg-purple-600 text-white px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                          title="Partager le contenu"
                        >
                          <span>🔗</span>
                          <span className="hidden sm:inline">Partager</span>
                        </button>
                      </div>
                    )}
                    
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* Modal d'édition */}
      <EditContentModal
        item={editingItem}
        isOpen={isEditMode}
        onClose={cancelEdit}
        onSave={saveEdit}
      />
    </div>
  )
}
