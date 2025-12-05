'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { AdminContentService } from '@/lib/admin-content-service'
import { ContentFormData } from '@/types/admin'
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  FilmIcon, 
  TvIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
  StarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'

export default function AddContentPage() {
  const { admin } = useAdminAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    catalogue: 'collection',
    genre: [],
    director: '',
    cast: [],
    videoUrl: '',
    posterUrl: '',
    trailerUrl: '',
    previewUrl: '',
    type: 'movie'
  })

  const [newGenre, setNewGenre] = useState('')
  const [newCast, setNewCast] = useState('')

  // États pour le scraper
  const [scraperUrl, setScraperUrl] = useState('http://localhost:3001')
  const [isScraperUrlActive, setIsScraperUrlActive] = useState(false)

  // États pour la gestion des séries
  const [seasons, setSeasons] = useState<Array<{
    seasonNumber: number
    title: string
    description: string
    episodes: Array<{
      episodeNumber: number
      title: string
      description: string
      duration: number
      videoUrl: string
      previewUrl?: string
      thumbnailUrl?: string
    }>
  }>>([])
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set())
  const [editingEpisode, setEditingEpisode] = useState<{
    seasonNumber: number
    episodeNumber: number
  } | null>(null)
  const [episodeFormData, setEpisodeFormData] = useState({
    title: '',
    videoUrl: '',
    previewUrl: ''
  })

  const handleInputChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors([])
    setSuccess('')
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

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.filter(g => g !== genre)
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

  const removeCast = (cast: string) => {
    setFormData(prev => ({
      ...prev,
      cast: prev.cast.filter(c => c !== cast)
    }))
  }

  // Fonctions pour gérer les saisons
  const addSeason = () => {
    const newSeasonNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.seasonNumber)) + 1 : 1
    const newSeason = {
      seasonNumber: newSeasonNumber,
      title: `Saison ${newSeasonNumber}`,
      description: '',
      episodes: []
    }
    
    setSeasons([...seasons, newSeason])
    setExpandedSeasons(prev => new Set([...Array.from(prev), newSeasonNumber]))
  }

  const updateSeason = (seasonNumber: number, updates: Partial<typeof seasons[0]>) => {
    setSeasons(seasons.map(season => 
      season.seasonNumber === seasonNumber 
        ? { ...season, ...updates }
        : season
    ))
  }

  const removeSeason = (seasonNumber: number) => {
    setSeasons(seasons.filter(season => season.seasonNumber !== seasonNumber))
    setExpandedSeasons(prev => {
      const newSet = new Set(prev)
      newSet.delete(seasonNumber)
      return newSet
    })
  }

  const toggleSeason = (seasonNumber: number) => {
    setExpandedSeasons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(seasonNumber)) {
        newSet.delete(seasonNumber)
      } else {
        newSet.add(seasonNumber)
      }
      return newSet
    })
  }

  // Fonctions pour gérer les épisodes
  const addEpisode = (seasonNumber: number) => {
    const season = seasons.find(s => s.seasonNumber === seasonNumber)
    if (!season) return

    const newEpisodeNumber = season.episodes.length > 0 
      ? Math.max(...season.episodes.map(e => e.episodeNumber)) + 1 
      : 1

    const newEpisode = {
      episodeNumber: newEpisodeNumber,
      title: `Épisode ${newEpisodeNumber}`,
      description: '',
      duration: 45,
      videoUrl: '',
      thumbnailUrl: '',
      previewUrl: ''
    }

    updateSeason(seasonNumber, {
      episodes: [...season.episodes, newEpisode]
    })

    // Ouvrir le formulaire d'épisode
    setEditingEpisode({ seasonNumber, episodeNumber: newEpisodeNumber })
    setEpisodeFormData({
      title: newEpisode.title,
      videoUrl: newEpisode.videoUrl,
      previewUrl: ''
    })
  }

  const saveEpisode = () => {
    if (!editingEpisode) return

    const season = seasons.find(s => s.seasonNumber === editingEpisode.seasonNumber)
    if (!season) return

    const updatedEpisodes = season.episodes.map(episode =>
      episode.episodeNumber === editingEpisode.episodeNumber
        ? { ...episode, title: episodeFormData.title, videoUrl: episodeFormData.videoUrl, previewUrl: episodeFormData.previewUrl }
        : episode
    )

    updateSeason(editingEpisode.seasonNumber, { episodes: updatedEpisodes })
    setEditingEpisode(null)
    setEpisodeFormData({
      title: '',
      videoUrl: '',
      previewUrl: ''
    })
  }

  const cancelEpisodeEdit = () => {
    setEditingEpisode(null)
    setEpisodeFormData({
      title: '',
      videoUrl: '',
      previewUrl: ''
    })
  }

  // Fonctions d&apos;export/import JSON
  const exportFormData = () => {
    const exportData = {
      formData: formData,
      seasons: formData.type === 'series' ? seasons : undefined,
      exportDate: new Date().toISOString(),
      exportType: formData.type
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${formData.type === 'movie' ? 'film' : 'serie'}_${formData.title || 'sans_titre'}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setSuccess(`Données ${formData.type === 'movie' ? 'du film' : 'de la série'} exportées avec succès !`)
  }

  const importFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
        if (importData.exportType !== formData.type) {
          setErrors([`Ce fichier contient des données pour un ${importData.exportType === 'movie' ? 'film' : 'série'}, mais vous avez sélectionné ${formData.type === 'movie' ? 'film' : 'série'}.`])
          return
        }

        // Importer les données du formulaire (ignorer l'originalId si présent)
        const cleanFormData = { ...importData.formData }
        // Supprimer l'originalId s'il existe (pour éviter les conflits)
        delete cleanFormData.originalId
        
        setFormData(cleanFormData)
        
        // Importer les saisons si c'est une série
        if (formData.type === 'series' && importData.seasons) {
          setSeasons(importData.seasons)
          setExpandedSeasons(new Set())
        }

        setSuccess(`Données ${formData.type === 'movie' ? 'du film' : 'de la série'} importées avec succès !`)
        setErrors([])
        
        // Réinitialiser l'input file
        event.target.value = ''
      } catch (error) {
        setErrors(['Erreur lors de la lecture du fichier. Vérifiez que le fichier est un JSON valide.'])
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSuccess('')

    // Validation
    const dataToValidate = formData.type === 'series' 
      ? { ...formData, seasons: seasons }
      : formData
    const validationResult = AdminContentService.validateContentData(dataToValidate)
    if (!validationResult.isValid) {
      setErrors(validationResult.errors)
      return
    }

    setIsLoading(true)
    try {
      if (formData.type === 'movie') {
        await AdminContentService.addMovie(formData)
        setSuccess('Film ajouté avec succès !')
      } else {
        // Pour les séries, inclure les saisons
        const seriesData = {
          ...formData,
          seasons: seasons.map(season => ({
            seasonNumber: season.seasonNumber,
            title: season.title,
            description: season.description,
            episodes: season.episodes.map(episode => ({
              episodeNumber: episode.episodeNumber,
              title: episode.title,
              description: episode.description,
              duration: episode.duration,
              videoUrl: episode.videoUrl,
              previewUrl: (episode as any).previewUrl || '',
              thumbnailUrl: episode.thumbnailUrl
            }))
          }))
        }
        await AdminContentService.addSeries(seriesData)
        setSuccess('Série ajoutée avec succès !')
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        year: new Date().getFullYear(),
        catalogue: 'collection',
        genre: [],
        director: '',
        cast: [],
        videoUrl: '',
        posterUrl: '',
        trailerUrl: '',
        previewUrl: '',
        type: 'movie'
      })
      setSeasons([])
      setExpandedSeasons(new Set())
      setEditingEpisode(null)
    } catch (error) {
      setErrors(['Erreur lors de l\'ajout du contenu'])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-800">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-1.5 sm:space-x-2 text-gray-400 hover:text-white transition-colors text-base sm:text-lg min-h-[44px] sm:min-h-0"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Retour</span>
              </button>
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Ajouter du contenu</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-gray-700">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Nouveau contenu</h1>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-5 md:mb-6">
                Créez et ajoutez de nouveaux films ou séries à votre plateforme avec tous les détails nécessaires.
              </p>

              {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-5 md:mb-6">
                  <ul className="list-disc list-inside space-y-1 text-sm sm:text-base">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2 sm:mb-3">Type de contenu</label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange('type', 'movie')}
                      className={`flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg border transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
                        formData.type === 'movie'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-gray-600 bg-dark-100 text-gray-400 hover:text-white'
                      }`}
                    >
                      <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Film</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('type', 'series')}
                      className={`flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg border transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
                        formData.type === 'series'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-gray-600 bg-dark-100 text-gray-400 hover:text-white'
                      }`}
                    >
                      <TvIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Série</span>
                    </button>
                  </div>
                </div>

                {/* Export/Import Section */}
                <div className="bg-dark-300/50 rounded-lg p-3 sm:p-4 border border-gray-600">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Gestion des données</h3>
                    <span className="text-xs sm:text-sm text-gray-400">
                      {formData.type === 'movie' ? 'Film' : 'Série'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={exportFormData}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Exporter JSON</span>
                    </button>
                    <label className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto">
                      <ArrowUpTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Importer JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importFormData}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    Exportez vos données pour les sauvegarder ou importez un fichier JSON pour remplir automatiquement le formulaire.
                  </p>
                </div>

                {/* Titre */}
                <div>
                  <label htmlFor="title" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    placeholder="Titre du film/série"
                    required
                  />
                </div>

                {/* Année */}
                <div>
                  <label htmlFor="year" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Année *
                  </label>
                  <input
                    type="number"
                    id="year"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                    placeholder="Description du contenu"
                    required
                  />
                </div>

                {/* Catalogue */}
                <div>
                  <label htmlFor="catalogue" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Catalogue
                  </label>
                  <select
                    id="catalogue"
                    value={formData.catalogue}
                    onChange={(e) => handleInputChange('catalogue', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
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




                {/* Genre */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Genres
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                    {formData.genre.map((genre, index) => (
                      <span
                        key={index}
                        className="bg-red-500/20 text-red-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2"
                      >
                        <span>{genre}</span>
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="hover:text-red-300 p-0.5 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                        >
                          <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                      placeholder="Ajouter un genre"
                    />
                    <button
                      type="button"
                      onClick={addGenre}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Director */}
                <div>
                  <label htmlFor="director" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Réalisateur
                  </label>
                  <input
                    type="text"
                    id="director"
                    value={formData.director}
                    onChange={(e) => handleInputChange('director', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    placeholder="Nom du réalisateur"
                  />
                </div>

                {/* Cast */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Acteurs
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                    {formData.cast.map((actor, index) => (
                      <span
                        key={index}
                        className="bg-blue-500/20 text-blue-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2"
                      >
                        <span>{actor}</span>
                        <button
                          type="button"
                          onClick={() => removeCast(actor)}
                          className="hover:text-blue-300 p-0.5 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                        >
                          <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={newCast}
                      onChange={(e) => setNewCast(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCast())}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                      placeholder="Ajouter un acteur"
                    />
                    <button
                      type="button"
                      onClick={addCast}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>


                {/* URLs pour les films */}
                {formData.type === 'movie' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label htmlFor="videoUrl" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        URL de la vidéo *
                      </label>
                      <input
                        type="url"
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        placeholder="https://example.com/video.mp4"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="posterUrl" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        URL de l&apos;affiche
                      </label>
                      <input
                        type="url"
                        id="posterUrl"
                        value={formData.posterUrl}
                        onChange={(e) => handleInputChange('posterUrl', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        placeholder="https://example.com/poster.jpg"
                      />
                    </div>

                    <div>
                      <label htmlFor="trailerUrl" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        URL YouTube de la bande-annonce
                      </label>
                      <input
                        type="url"
                        id="trailerUrl"
                        value={formData.trailerUrl}
                        onChange={(e) => handleInputChange('trailerUrl', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID"
                      />
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Formats supportés : MP4, WebM, YouTube, Vimeo, Dailymotion
                      </p>
                    </div>

                    <div>
                      <label htmlFor="previewUrl" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        URL d&apos;aperçu vidéo (optionnel)
                      </label>
                      <input
                        type="url"
                        id="previewUrl"
                        value={formData.previewUrl || ''}
                        onChange={(e) => handleInputChange('previewUrl', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        placeholder="https://example.com/preview.jpg ou https://example.com/preview.mp4"
                      />
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Image ou vidéo courte qui s&apos;affichera avant la lecture (ex: capture d&apos;écran à 10min du film)
                      </p>
                    </div>
                  </div>
                )}

                {/* Type de contenu - Films seulement */}
                {formData.type === 'movie' && (
                  <div>
                    <label htmlFor="contentType" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Type de contenu
                    </label>
                    <select
                      id="contentType"
                      value={formData.isPremium ? 'premium' : 'gratuit'}
                      onChange={(e) => handleInputChange('isPremium', e.target.value === 'premium')}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    >
                      <option value="gratuit">Gratuit</option>
                      <option value="premium">Premium</option>
                    </select>
                    {formData.isPremium && (
                      <div className="flex items-center space-x-2 mt-2">
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        <span className="text-xs sm:text-sm text-purple-400">Réservé aux abonnés premium</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Gestion des séries */}
                {formData.type === 'series' && (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    {/* URL de l'affiche */}
                    <div>
                      <label htmlFor="posterUrl" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        URL de l&apos;affiche
                      </label>
                      <input
                        type="url"
                        id="posterUrl"
                        value={formData.posterUrl}
                        onChange={(e) => handleInputChange('posterUrl', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        placeholder="https://example.com/poster.jpg"
                      />
                    </div>

                    {/* URL YouTube de la bande-annonce */}
                    <div>
                      <label htmlFor="trailerUrl" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        URL YouTube de la bande-annonce
                      </label>
                      <input
                        type="url"
                        id="trailerUrl"
                        value={formData.trailerUrl}
                        onChange={(e) => handleInputChange('trailerUrl', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID"
                      />
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Formats supportés : MP4, WebM, YouTube, Vimeo, Dailymotion
                      </p>
                    </div>


                    {/* Bouton pour créer une saison */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Saisons</h3>
                      <button
                        type="button"
                        onClick={addSeason}
                        className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      >
                        <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Créer une saison</span>
                      </button>
                    </div>

                    {/* Liste des saisons */}
                    {seasons.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        {seasons.map((season) => (
                          <div key={season.seasonNumber} className="bg-dark-200 rounded-lg border border-gray-700">
                            {/* En-tête de saison */}
                            <div className="p-3 sm:p-4 border-b border-gray-700">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => toggleSeason(season.seasonNumber)}
                                    className="text-gray-400 hover:text-white p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                  >
                                    {expandedSeasons.has(season.seasonNumber) ? (
                                      <ChevronDownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    ) : (
                                      <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    )}
                                  </button>
                                  <div className="flex-1 sm:flex-initial">
                                    <input
                                      type="text"
                                      value={season.title}
                                      onChange={(e) => updateSeason(season.seasonNumber, { title: e.target.value })}
                                      className="bg-transparent text-white font-semibold text-base sm:text-lg border-none outline-none w-full"
                                      placeholder="Titre de la saison"
                                    />
                                    <input
                                      type="text"
                                      value={season.description}
                                      onChange={(e) => updateSeason(season.seasonNumber, { description: e.target.value })}
                                      className="bg-transparent text-gray-400 text-xs sm:text-sm border-none outline-none w-full mt-1"
                                      placeholder="Description de la saison"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-2.5 w-full sm:w-auto justify-end">
                                  <span className="text-gray-400 text-xs sm:text-sm">
                                    {season.episodes.length} épisode{season.episodes.length > 1 ? 's' : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeSeason(season.seasonNumber)}
                                    className="text-red-400 hover:text-red-300 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                  >
                                    <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Contenu de la saison */}
                            {expandedSeasons.has(season.seasonNumber) && (
                              <div className="p-3 sm:p-4">
                                {/* Bouton pour créer un épisode */}
                                <div className="mb-3 sm:mb-4">
                                  <button
                                    type="button"
                                    onClick={() => addEpisode(season.seasonNumber)}
                                    className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                                  >
                                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Créer un épisode</span>
                                  </button>
                                </div>

                                {/* Liste des épisodes */}
                                {season.episodes.length > 0 && (
                                  <div className="space-y-2 sm:space-y-3">
                                    {season.episodes.map((episode) => (
                                      <div key={episode.episodeNumber} className="bg-dark-100 rounded-lg p-3 sm:p-4 border border-gray-600">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                                          <div className="flex-1">
                                            <h4 className="text-white font-medium text-sm sm:text-base">Épisode {episode.episodeNumber}</h4>
                                            <p className="text-gray-400 text-xs sm:text-sm">{episode.title}</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingEpisode({ seasonNumber: season.seasonNumber, episodeNumber: episode.episodeNumber })
                                              setEpisodeFormData({
                                                title: episode.title,
                                                videoUrl: episode.videoUrl,
                                                previewUrl: (episode as any).previewUrl || ''
                                              })
                                            }}
                                            className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 min-h-[44px] sm:min-h-0"
                                          >
                                            Modifier
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Type de contenu */}
                    <div>
                      <label htmlFor="contentTypeSeries" className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                        Type de contenu
                      </label>
                      <select
                        id="contentTypeSeries"
                        value={formData.isPremium ? 'premium' : 'gratuit'}
                        onChange={(e) => handleInputChange('isPremium', e.target.value === 'premium')}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                      >
                        <option value="gratuit">Gratuit</option>
                        <option value="premium">Premium</option>
                      </select>
                      {formData.isPremium && (
                        <div className="flex items-center space-x-2 mt-2">
                          <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                          <span className="text-xs sm:text-sm text-purple-400">Réservé aux abonnés premium</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/dashboard')}
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 border border-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    {isLoading ? 'Ajout en cours...' : 'Ajouter le contenu'}
                  </button>
                </div>
              </form>
            </div>

            {/* Section Scraper de contenu */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-gray-700 mt-6 sm:mt-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Scraper de contenu</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-5 md:mb-6">
                Utilisez l&apos;outil de scraping pour extraire automatiquement les informations des contenus depuis une URL.
              </p>
              
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Champ pour le lien du scraper */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Lien du scraper
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <input
                      type="url"
                      value={scraperUrl}
                      onChange={(e) => setScraperUrl(e.target.value)}
                      placeholder="http://localhost:3001"
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    />
                    <button
                      type="button"
                      onClick={() => setIsScraperUrlActive(!isScraperUrlActive)}
                      className={`px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto ${
                        isScraperUrlActive
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      {isScraperUrlActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                  {isScraperUrlActive && (
                    <p className="text-xs sm:text-sm text-green-400 mt-2">
                      ✓ Lien activé : {scraperUrl}
                    </p>
                  )}
                </div>

                {/* Bouton pour ouvrir le scraper */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const urlToOpen = isScraperUrlActive ? scraperUrl : 'http://localhost:3001'
                      window.open(urlToOpen, '_blank')
                    }}
                    className="w-full px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base min-h-[44px] sm:min-h-0"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Ouvrir Scrapper</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal pour le formulaire d'épisode */}
        {editingEpisode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                  {editingEpisode.episodeNumber === 1 ? 'Créer un épisode' : `Modifier l'épisode ${editingEpisode.episodeNumber}`}
                </h3>
                <button
                  type="button"
                  onClick={cancelEpisodeEdit}
                  className="text-gray-400 hover:text-white p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); saveEpisode(); }} className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Titre */}
                <div>
                  <label className="block text-gray-300 text-sm sm:text-base font-medium mb-1.5 sm:mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={episodeFormData.title}
                    onChange={(e) => setEpisodeFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    placeholder="Titre de l&apos;épisode"
                    required
                  />
                </div>

                {/* URL de la vidéo */}
                <div>
                  <label className="block text-gray-300 text-sm sm:text-base font-medium mb-1.5 sm:mb-2">
                    URL de la vidéo *
                  </label>
                  <input
                    type="url"
                    value={episodeFormData.videoUrl}
                    onChange={(e) => setEpisodeFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    placeholder="https://example.com/episode.mp4"
                    required
                  />
                </div>

                {/* URL d'aperçu vidéo */}
                <div>
                  <label className="block text-gray-300 text-sm sm:text-base font-medium mb-1.5 sm:mb-2">
                    URL d&apos;aperçu vidéo
                  </label>
                  <input
                    type="url"
                    value={episodeFormData.previewUrl || ''}
                    onChange={(e) => setEpisodeFormData(prev => ({ ...prev, previewUrl: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-100 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    placeholder="https://example.com/preview.jpg ou https://example.com/preview.mp4"
                  />
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Image ou vidéo courte qui s&apos;affichera avant la lecture (optionnel)
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={cancelEpisodeEdit}
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 border border-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    {editingEpisode.episodeNumber === 1 ? 'Créer l\'épisode' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  )
}
