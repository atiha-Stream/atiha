'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Movie, Series } from '@/types/content'
import { XMarkIcon, PlayIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import VideoPlayer from './VideoPlayer'
import { logger } from '@/lib/logger'

interface EditContentModalProps {
  item: Movie | Series | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedData: Partial<Movie | Series>) => void
}

export default function EditContentModal({ item, isOpen, onClose, onSave }: EditContentModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    catalogue: 'collection',
    genre: [] as string[],
    director: '',
    cast: [] as string[],
    videoUrl: '',
    posterUrl: '',
    trailerUrl: '',
    previewUrl: '',
    isPremium: false
  })

  const [newGenre, setNewGenre] = useState('')
  const [newCast, setNewCast] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'player'>('edit')
  const [selectedEpisode, setSelectedEpisode] = useState<{
    seasonNumber: number
    episodeNumber: number
    title: string
    videoUrl: string
    previewUrl?: string
  } | null>(null)
  const [showAddSeason, setShowAddSeason] = useState(false)
  const [newSeasonData, setNewSeasonData] = useState({
    title: ''
  })
  const [showAddEpisode, setShowAddEpisode] = useState(false)
  const [selectedSeasonForEpisode, setSelectedSeasonForEpisode] = useState<number | null>(null)
  const [newEpisodeData, setNewEpisodeData] = useState({
    title: '',
    videoUrl: '',
    previewUrl: ''
  })
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<number>>(new Set())
  const [localSeasons, setLocalSeasons] = useState<any[]>([])
  const [showEditEpisode, setShowEditEpisode] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<{
    seasonNumber: number
    episodeNumber: number
    episodeId: string
  } | null>(null)
  const [editEpisodeData, setEditEpisodeData] = useState({
    title: '',
    videoUrl: '',
    previewUrl: ''
  })
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  // Vérifier si c&apos;est une série
  const isSeries = item && 'seasons' in item && Array.isArray(item.seasons)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Gestion de la touche Échap et du scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      // Empêcher le scroll de la page principale
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      // Restaurer le scroll de la page principale
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (item) {
      setFormData({
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
      })

      // Si c&apos;est une série, sélectionner le premier épisode par défaut
      if (isSeries && item.seasons) {
        setLocalSeasons(item.seasons)
        const firstSeason = item.seasons && item.seasons.length > 0 ? item.seasons[0] : null
        
        // S&apos;assurer que la première saison est ouverte (pas dans collapsedSeasons)
        if (firstSeason) {
          setCollapsedSeasons(prev => {
            const newSet = new Set(prev)
            newSet.delete(firstSeason.seasonNumber) // S&apos;assurer que la première saison est ouverte
            return newSet
          })
        }
        
        if (firstSeason && firstSeason.episodes && firstSeason.episodes.length > 0) {
          const firstEpisode = firstSeason.episodes[0]
          setSelectedEpisode({
            seasonNumber: firstSeason.seasonNumber,
            episodeNumber: firstEpisode.episodeNumber,
            title: firstEpisode.title,
            videoUrl: firstEpisode.videoUrl,
            previewUrl: firstEpisode.previewUrl
          })
        }
      }
    }
  }, [item, isSeries])

  // Effet séparé pour s&apos;assurer que la première saison est ouverte
  useEffect(() => {
    if (isSeries && localSeasons.length > 0) {
      const firstSeason = localSeasons[0]
      // Créer un nouveau Set avec toutes les saisons fermées SAUF la première
      const newCollapsedSet = new Set<number>()
      localSeasons.forEach(season => {
        if (season.seasonNumber !== firstSeason.seasonNumber) {
          newCollapsedSet.add(season.seasonNumber)
        }
      })
      setCollapsedSeasons(newCollapsedSet)
    }
  }, [isSeries, localSeasons])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier si des modifications ont été apportées
    if (!item) return
    const hasFormChanges = Object.keys(formData).some(key => {
      const originalValue = item[key as keyof typeof item]
      const newValue = formData[key as keyof typeof formData]
      return originalValue !== newValue
    })
    
    const hasSeasonChanges = isSeries && 
      JSON.stringify(localSeasons) !== JSON.stringify(item.seasons)
    
    if (!hasFormChanges && !hasSeasonChanges) {
      logger.debug('Aucune modification détectée, sauvegarde annulée')
      onClose() // Fermer le modal sans sauvegarder
      return
    }
    
    const updatedData = {
      ...item,
      ...formData,
      // Pour les séries, utiliser localSeasons qui contient les saisons existantes ou modifiées
      ...(isSeries && { 
        seasons: localSeasons
      })
    }
    
    logger.debug('Sauvegarde des données', {
      isSeries,
      hasFormChanges,
      hasSeasonChanges,
      localSeasonsLength: localSeasons.length,
      originalSeasonsLength: ('seasons' in item && item.seasons) ? item.seasons.length : 0,
      updatedData
    })
    
    onSave(updatedData)
  }

  const addGenre = () => {
    if (newGenre.trim()) {
      // Séparer par virgules, nettoyer et filtrer les doublons
      const genresToAdd = newGenre
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0 && !formData.genre.includes(g))
      
      if (genresToAdd.length > 0) {
      setFormData(prev => ({
        ...prev,
          genre: [...prev.genre, ...genresToAdd]
      }))
      setNewGenre('')
      }
    }
  }

  const removeGenre = (genreToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.filter(genre => genre !== genreToRemove)
    }))
  }

  const addCast = () => {
    if (newCast.trim()) {
      // Séparer par virgules, nettoyer et filtrer les doublons
      const castToAdd = newCast
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0 && !formData.cast.includes(c))
      
      if (castToAdd.length > 0) {
      setFormData(prev => ({
        ...prev,
          cast: [...prev.cast, ...castToAdd]
      }))
      setNewCast('')
      }
    }
  }

  const removeCast = (castToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      cast: prev.cast.filter(cast => cast !== castToRemove)
    }))
  }

  const handleAddSeason = () => {
    if (!isSeries || !item) return

    const newSeasonNumber = Math.max(...localSeasons.map(s => s.seasonNumber), 0) + 1
    const newSeason = {
      seasonNumber: newSeasonNumber,
      title: newSeasonData.title || `Saison ${newSeasonNumber}`,
      description: `Description de la saison ${newSeasonNumber}`,
      episodes: []
    }

    setLocalSeasons(prev => [...prev, newSeason])
    setShowAddSeason(false)
    setNewSeasonData({ title: '' })
  }

  const handleAddEpisode = (seasonNumber: number) => {
    setSelectedSeasonForEpisode(seasonNumber)
    setShowAddEpisode(true)
  }

  const handleCreateEpisode = () => {
    if (!isSeries || !item || selectedSeasonForEpisode === null) return

    const season = localSeasons.find(s => s.seasonNumber === selectedSeasonForEpisode)
    if (!season) return

    const newEpisodeNumber = Math.max(...season.episodes.map((e: { episodeNumber: number }) => e.episodeNumber), 0) + 1
    const newEpisode = {
      id: `${selectedSeasonForEpisode}-${newEpisodeNumber}-${Date.now()}`,
      episodeNumber: newEpisodeNumber,
      title: newEpisodeData.title || `Épisode ${newEpisodeNumber}`,
      description: `Description de l'épisode ${newEpisodeNumber}`,
      duration: 45,
      videoUrl: newEpisodeData.videoUrl,
      previewUrl: newEpisodeData.previewUrl,
      videoType: 'mp4' as const,
      thumbnailUrl: '',
      airDate: new Date()
    }

    setLocalSeasons(prev => prev.map(s => 
      s.seasonNumber === selectedSeasonForEpisode
        ? { ...s, episodes: [...s.episodes, newEpisode] }
        : s
    ))

    setShowAddEpisode(false)
    setSelectedSeasonForEpisode(null)
    setNewEpisodeData({ title: '', videoUrl: '', previewUrl: '' })
  }

  const toggleSeasonCollapse = (seasonNumber: number) => {
    setCollapsedSeasons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(seasonNumber)) {
        newSet.delete(seasonNumber)
      } else {
        newSet.add(seasonNumber)
      }
      return newSet
    })
  }

  const handleDeleteSeason = (seasonNumber: number) => {
    if (!isSeries || !item) return

    setLocalSeasons(prev => prev.filter(s => s.seasonNumber !== seasonNumber))
  }

  const handleSelectEpisode = (seasonNumber: number, episodeNumber: number) => {
    const season = localSeasons.find(s => s.seasonNumber === seasonNumber)
    if (!season) return

    const episode = season.episodes.find((e: { episodeNumber: number }) => e.episodeNumber === episodeNumber)
    if (!episode) return

    setSelectedEpisode({
      seasonNumber: seasonNumber,
      episodeNumber: episodeNumber,
      title: episode.title,
      videoUrl: episode.videoUrl,
      previewUrl: episode.previewUrl
    })
  }

  const handleEditEpisode = (seasonNumber: number, episodeNumber: number, episodeId: string) => {
    const season = localSeasons.find(s => s.seasonNumber === seasonNumber)
    if (!season) return

    const episode = season.episodes.find((e: { episodeNumber: number }) => e.episodeNumber === episodeNumber)
    if (!episode) return

    setEditingEpisode({ seasonNumber, episodeNumber, episodeId })
    setEditEpisodeData({
      title: episode.title,
      videoUrl: episode.videoUrl,
      previewUrl: episode.previewUrl || ''
    })
    setShowEditEpisode(true)
  }

  const handleSaveEpisodeEdit = () => {
    if (!editingEpisode) return

    setLocalSeasons(prev => prev.map(season => 
      season.seasonNumber === editingEpisode.seasonNumber
        ? {
            ...season,
            episodes: season.episodes.map((episode: { episodeNumber: number; title: string; description: string; videoUrl: string; previewUrl?: string; id?: string; duration?: number }) =>
              episode.episodeNumber === editingEpisode.episodeNumber
                ? { ...episode, title: editEpisodeData.title, videoUrl: editEpisodeData.videoUrl, previewUrl: editEpisodeData.previewUrl }
                : episode
            )
          }
        : season
    ))

    setShowEditEpisode(false)
    setEditingEpisode(null)
    setEditEpisodeData({ title: '', videoUrl: '', previewUrl: '' })
  }

  // Fonctions d&apos;export/import JSON
  const exportFormData = () => {
    if (!item) return

    const exportData = {
      formData: formData,
      seasons: isSeries ? localSeasons : undefined,
      exportDate: new Date().toISOString(),
      exportType: isSeries ? 'series' : 'movie',
      originalId: item.id
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${isSeries ? 'serie' : 'film'}_${formData.title || 'sans_titre'}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setSuccess(`Données ${isSeries ? 'de la série' : 'du film'} exportées avec succès !`)
    setErrors([])
  }

  const importFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !item) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        
        // Vérifier la structure des données
        if (!importData.formData || !importData.exportType) {
          setErrors(['Format de fichier invalide. Veuillez sélectionner un fichier JSON valide.'])
          return
        }

        // Vérifier que le type correspond
        if (importData.exportType !== (isSeries ? 'series' : 'movie')) {
          setErrors([`Ce fichier contient des données pour un ${importData.exportType === 'movie' ? 'film' : 'série'}, mais vous modifiez un ${isSeries ? 'série' : 'film'}.`])
          return
        }

        // Importer les données du formulaire (ignorer l'originalId si présent)
        const cleanFormData = { ...importData.formData }
        // Supprimer l'originalId s'il existe (pour éviter les conflits)
        delete cleanFormData.originalId
        
        setFormData(cleanFormData)
        
        // Importer les saisons si c'est une série
        if (isSeries && importData.seasons) {
          setLocalSeasons(importData.seasons)
          setCollapsedSeasons(new Set())
        }

        setSuccess(`Données ${isSeries ? 'de la série' : 'du film'} importées avec succès !`)
        setErrors([])
        
        // Réinitialiser l'input file
        event.target.value = ''
      } catch (error) {
        setErrors(['Erreur lors de la lecture du fichier. Vérifiez que le fichier est un JSON valide.'])
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen || !item) return null

  const isMovie = !isSeries

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/73 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-dark-200 rounded-xl w-[90vw] h-[85vh] overflow-y-auto shadow-2xl border border-gray-700">
        <div className="p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Modifier {isMovie ? 'le film' : 'la série'} : {item.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Fermer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Onglets */}
          <div className="flex space-x-1 bg-dark-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'edit'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PencilIcon className="w-5 h-5" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => setActiveTab('player')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'player'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PlayIcon className="w-5 h-5" />
              <span>Player</span>
            </button>
          </div>

          {/* Contenu selon l&apos;onglet actif */}
          {activeTab === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Export/Import Section */}
              <div className="bg-dark-300/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Gestion des données</h3>
                  <span className="text-sm text-gray-400">
                    {isSeries ? 'Série' : 'Film'}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={exportFormData}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Exporter JSON</span>
                  </button>
                  <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    <span>Importer JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importFormData}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Exportez les données pour les sauvegarder ou importez un fichier JSON pour remplir automatiquement le formulaire.
                </p>
              </div>
            {/* Titre */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Catalogue */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Catalogue
              </label>
              <select
                value={formData.catalogue}
                onChange={(e) => setFormData(prev => ({ ...prev, catalogue: e.target.value }))}
                className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="collection">Notre collection</option>
                <option value="popular-movies">Films Populaires</option>
                <option value="popular-series">Séries Populaires</option>
                <option value="jeux">Jeux</option>
                <option value="sports">Sports</option>
                <option value="animes">Animes</option>
                <option value="tendances">Tendances</option>
                <option value="documentaires">Documentaires</option>
                <option value="divertissements">Divertissements</option>
              </select>
            </div>

            {/* Année et Note */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Année *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            {/* Réalisateur */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Réalisateur *
              </label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => setFormData(prev => ({ ...prev, director: e.target.value }))}
                className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Genres
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.genre.map((genre, index) => (
                  <span
                    key={index}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={() => removeGenre(genre)}
                      className="text-red-200 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  placeholder="Ajouter un genre"
                  className="flex-1 bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={addGenre}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Cast */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Acteurs
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.cast.map((cast, index) => (
                  <span
                    key={index}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {cast}
                    <button
                      type="button"
                      onClick={() => removeCast(cast)}
                      className="text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCast}
                  onChange={(e) => setNewCast(e.target.value)}
                  placeholder="Ajouter un acteur"
                  className="flex-1 bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={addCast}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>


            {/* Champs spécifiques aux séries */}
            {isSeries && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL de l&apos;affiche
                  </label>
                  <input
                    type="url"
                    value={formData.posterUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL YouTube de la bande-annonce
                  </label>
                  <input
                    type="url"
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, trailerUrl: e.target.value }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Collez l&apos;URL complète de la vidéo YouTube (ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                  </p>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Type de contenu
                  </label>
                  <select
                    value={formData.isPremium ? 'premium' : 'gratuit'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPremium: e.target.value === 'premium' }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gratuit">Gratuit</option>
                    <option value="premium">Premium</option>
                  </select>
                  {formData.isPremium && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-purple-400">Réservé aux abonnés premium</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Champs spécifiques aux films */}
            {isMovie && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL de la vidéo *
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://example.com/video.mp4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL de l&apos;affiche
                  </label>
                  <input
                    type="url"
                    value={formData.posterUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL YouTube de la bande-annonce
                  </label>
                  <input
                    type="url"
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, trailerUrl: e.target.value }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Collez l&apos;URL complète de la vidéo YouTube (ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                  </p>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL d&apos;aperçu vidéo (optionnel)
                  </label>
                  <input
                    type="url"
                    value={formData.previewUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, previewUrl: e.target.value }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://example.com/preview.jpg ou https://example.com/preview.mp4"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Image ou vidéo courte qui s&apos;affichera avant la lecture (ex: capture d&apos;écran à 10min du film)
                  </p>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Type de contenu
                  </label>
                  <select
                    value={formData.isPremium ? 'premium' : 'gratuit'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPremium: e.target.value === 'premium' }))}
                    className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gratuit">Gratuit</option>
                    <option value="premium">Premium</option>
                  </select>
                  {formData.isPremium && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-purple-400">Réservé aux abonnés premium</span>
                    </div>
                  )}
                </div>
              </>
            )}

              {/* Boutons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          ) : (
            /* Onglet Player */
            <div className="space-y-6">
              {/* Player vidéo */}
              {(() => {
                const videoUrl = isSeries ? selectedEpisode?.videoUrl : formData.videoUrl
                const videoTitle = isSeries ? selectedEpisode?.title : formData.title
                // Supprimer l'aperçu du modal d'édition pour éviter les conflits
                const posterUrl = isSeries ? undefined : formData.posterUrl
                
                return videoUrl ? (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <div className="relative w-full aspect-video">
                      <video
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        controls
                        poster={posterUrl}
                      >
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                      <div className="absolute top-4 left-4">
                        <h3 className="text-white text-lg font-semibold bg-black bg-opacity-50 px-3 py-1 rounded">
                          {videoTitle}
                        </h3>
                        {isSeries && selectedEpisode && (
                          <p className="text-gray-300 text-sm bg-black bg-opacity-50 px-3 py-1 rounded mt-1">
                            Saison {selectedEpisode.seasonNumber} - Épisode {selectedEpisode.episodeNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <PlayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucune vidéo disponible</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {isSeries 
                        ? "Sélectionnez un épisode dans la liste ci-dessous"
                        : "Ajoutez une URL vidéo dans l&apos;onglet \"Modifier\" pour voir le player"
                      }
                    </p>
                  </div>
                )
              })()}
              
              {/* Liste des épisodes pour les séries */}
              {isSeries && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold">Épisodes</h3>
                    <button
                      onClick={() => setShowAddSeason(true)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <span>+</span>
                      <span>Ajouter une saison</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {localSeasons.map((season) => {
                      const isCollapsed = collapsedSeasons.has(season.seasonNumber)
                      const episodeCount = season.episodes.length
                      
                      return (
                        <div key={season.seasonNumber} className="border border-gray-600 rounded-lg p-4">
                          {/* En-tête de la saison */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleSeasonCollapse(season.seasonNumber)}
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                {isCollapsed ? (
                                  <ChevronRightIcon className="w-5 h-5" />
                                ) : (
                                  <ChevronDownIcon className="w-5 h-5" />
                                )}
                              </button>
                              <h4 className="text-white font-bold text-lg">
                                {season.title}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-400 text-sm">
                                {episodeCount} épisode{episodeCount > 1 ? 's' : ''}
                              </span>
                              <button
                                onClick={() => handleDeleteSeason(season.seasonNumber)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Supprimer la saison"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Description de la saison */}
                          <p className="text-gray-400 text-sm mb-4 ml-8">
                            {season.description}
                          </p>

                          {/* Contenu de la saison (épisodes ou bouton d'ajout) */}
                          {!isCollapsed && (
                            <div className="ml-8">
                              {episodeCount > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                  {season.episodes.map((episode: { episodeNumber: number; title: string; description: string; videoUrl: string; previewUrl?: string; id?: string; duration?: number }) => (
                                    <button
                                      key={`${season.seasonNumber}-${episode.episodeNumber}`}
                                                onClick={() => episode.episodeNumber !== undefined && handleSelectEpisode(season.seasonNumber, episode.episodeNumber)}
                                      className={`p-3 rounded-lg border transition-all duration-200 text-left cursor-pointer hover:scale-105 ${
                                        selectedEpisode?.seasonNumber === season.seasonNumber && 
                                        selectedEpisode?.episodeNumber === episode.episodeNumber
                                          ? 'border-blue-500 bg-blue-500/10'
                                          : 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                                      }`}
                                      title="Cliquer pour sélectionner l&apos;épisode dans le player"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                          selectedEpisode?.seasonNumber === season.seasonNumber && 
                                          selectedEpisode?.episodeNumber === episode.episodeNumber
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-600 text-gray-300'
                                        }`}>
                                          {episode.episodeNumber}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-medium truncate ${
                                            selectedEpisode?.seasonNumber === season.seasonNumber && 
                                            selectedEpisode?.episodeNumber === episode.episodeNumber
                                              ? 'text-blue-400'
                                              : 'text-white'
                                          }`}>
                                            {episode.title}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {episode.duration} min
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          {episode.videoUrl && (
                                            <PlayIcon className="w-4 h-4 text-green-400" title="Vidéo disponible" />
                                          )}
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditEpisode(season.seasonNumber, episode.episodeNumber, episode.id || '')
                                            }}
                                            className="p-1 hover:bg-gray-600 rounded transition-colors cursor-pointer"
                                            title="Cliquer pour modifier l&apos;épisode"
                                          >
                                            <PencilIcon className="w-4 h-4 text-blue-400" />
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-400">
                                  <p className="mb-4">Aucun épisode dans cette saison</p>
                                </div>
                              )}
                              
                              {/* Bouton d'ajout d'épisode */}
                              <button
                                onClick={() => handleAddEpisode(season.seasonNumber)}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <span className="text-xl">+</span>
                                <span>Créer un épisode</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Informations du contenu */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Réalisateur:</span>
                  <span className="text-white ml-2">{formData.director}</span>
                </div>
                <div>
                  <span className="text-gray-400">Année:</span>
                  <span className="text-white ml-2">{formData.year}</span>
                </div>
                <div>
                  <span className="text-gray-400">Note:</span>
                  <span className="text-white ml-2">⭐ {item && 'rating' in item ? item.rating : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white ml-2">{isSeries ? 'Série' : 'Film'}</span>
                </div>
                {!isSeries && (
                  <div>
                    <span className="text-gray-400">Durée:</span>
                    <span className="text-white ml-2">{item && 'duration' in item ? item.duration : 'N/A'} min</span>
                  </div>
                )}
              </div>
              
              {/* Genres */}
              <div>
                <span className="text-gray-400">Genres:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.genre.map((genre, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Description */}
              <div>
                <span className="text-gray-400">Description:</span>
                <p className="text-white mt-2 leading-relaxed">
                  {formData.description}
                </p>
              </div>
              
              {/* Bouton retour à l'édition */}
              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setActiveTab('edit')}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Retour à l&apos;édition
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour ajouter une nouvelle saison */}
      {showAddSeason && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Ajouter une nouvelle saison</h3>
              <button
                onClick={() => setShowAddSeason(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Fermer"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de la saison (optionnel)
                </label>
                <input
                  type="text"
                  value={newSeasonData.title}
                  onChange={(e) => setNewSeasonData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: Saison 2"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddSeason(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSeason}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Créer la saison
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un épisode */}
      {showAddEpisode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Ajouter un épisode à la Saison {selectedSeasonForEpisode}
              </h3>
              <button
                onClick={() => setShowAddEpisode(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Fermer"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de l&apos;épisode (optionnel)
                </label>
                <input
                  type="text"
                  value={newEpisodeData.title}
                  onChange={(e) => setNewEpisodeData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: Épisode 1"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL de la vidéo *
                </label>
                <input
                  type="url"
                  value={newEpisodeData.videoUrl}
                  onChange={(e) => setNewEpisodeData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="https://example.com/video.mp4"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL d&apos;aperçu vidéo
                </label>
                <input
                  type="url"
                  value={newEpisodeData.previewUrl}
                  onChange={(e) => setNewEpisodeData(prev => ({ ...prev, previewUrl: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="https://example.com/preview.jpg ou https://example.com/preview.mp4"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Image ou vidéo courte qui s&apos;affichera avant la lecture (optionnel)
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddEpisode(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateEpisode}
                  disabled={!newEpisodeData.videoUrl.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Créer l&apos;épisode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'épisode */}
      {showEditEpisode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Modifier l&apos;épisode {editingEpisode?.episodeNumber}
              </h3>
              <button
                onClick={() => setShowEditEpisode(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Fermer"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de l&apos;épisode (optionnel)
                </label>
                <input
                  type="text"
                  value={editEpisodeData.title}
                  onChange={(e) => setEditEpisodeData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: Épisode 1"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL de la vidéo *
                </label>
                <input
                  type="url"
                  value={editEpisodeData.videoUrl}
                  onChange={(e) => setEditEpisodeData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="https://example.com/video.mp4"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL d&apos;aperçu vidéo
                </label>
                <input
                  type="url"
                  value={editEpisodeData.previewUrl}
                  onChange={(e) => setEditEpisodeData(prev => ({ ...prev, previewUrl: e.target.value }))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="https://example.com/preview.jpg ou https://example.com/preview.mp4"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Image ou vidéo courte qui s&apos;affichera avant la lecture (optionnel)
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditEpisode(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEpisodeEdit}
                  disabled={!editEpisodeData.videoUrl.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return isClient ? createPortal(modalContent, document.body) : null
}
