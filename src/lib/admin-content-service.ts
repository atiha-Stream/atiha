import { Movie, Series, Season } from '@/types/content'
import { ContentFormData, ImportResult } from '@/types/admin'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'
import { ActivityService } from './activity-service'
import { logger } from './logger'

// Service pour gérer le contenu côté admin
export class AdminContentService {
  // Ajouter ou mettre à jour un film
  static async addMovie(formData: ContentFormData): Promise<Movie> {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simuler un délai API
    
    if (typeof window !== 'undefined') {
      const existingMovies = this.getStoredMovies()
      
      // Vérifier si un film avec le même titre et la même année existe déjà
      const existingMovie = existingMovies.find(movie => 
        movie.title.toLowerCase() === formData.title.toLowerCase() && 
        movie.year === formData.year
      )
      
      if (existingMovie) {
        // Mettre à jour le film existant
        const updatedMovie: Movie = {
          ...existingMovie,
          title: formData.title,
          description: formData.description,
          year: formData.year,
          catalogue: formData.catalogue,
          genre: formData.genre,
          director: formData.director,
          cast: formData.cast,
          videoUrl: formData.videoUrl || existingMovie.videoUrl,
          posterUrl: formData.posterUrl || existingMovie.posterUrl,
          trailerUrl: formData.trailerUrl || existingMovie.trailerUrl,
          previewUrl: formData.previewUrl || existingMovie.previewUrl,
          isPremium: formData.isPremium !== undefined ? formData.isPremium : existingMovie.isPremium,
        }
        
        // Remplacer dans la liste
        const movieIndex = existingMovies.findIndex(movie => movie.id === existingMovie.id)
        existingMovies[movieIndex] = updatedMovie
        localStorage.setItem('admin_movies', JSON.stringify(existingMovies))
        
        // Enregistrer l'activité
        ActivityService.logContentActivity('success', `Film mis à jour: "${updatedMovie.title}"`, {
          contentId: updatedMovie.id,
          contentTitle: updatedMovie.title,
          catalogue: updatedMovie.catalogue,
          year: updatedMovie.year
        })
        
        return updatedMovie
      } else {
        // Créer un nouveau film
        const newMovie: Movie = {
          id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
          title: formData.title,
          description: formData.description,
          year: formData.year,
          catalogue: formData.catalogue,
          genre: formData.genre,
          rating: 0,
          director: formData.director,
          cast: formData.cast,
          duration: 0, // Valeur par défaut
          videoUrl: formData.videoUrl || '',
          posterUrl: formData.posterUrl || '',
          trailerUrl: formData.trailerUrl || '',
          previewUrl: formData.previewUrl || '',
          isPremium: formData.isPremium || false,
          createdAt: new Date()
        }

        existingMovies.push(newMovie)
        localStorage.setItem('admin_movies', JSON.stringify(existingMovies))

        // Enregistrer l'activité
        ActivityService.logContentActivity('success', `Nouveau film ajouté: "${newMovie.title}"`, {
          contentId: newMovie.id,
          contentTitle: newMovie.title,
          catalogue: newMovie.catalogue,
          year: newMovie.year
        })

        return newMovie
      }
    }
    
    // Fallback si localStorage n'est pas disponible
    const newMovie: Movie = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      title: formData.title,
      description: formData.description,
      year: formData.year,
      catalogue: formData.catalogue,
      genre: formData.genre,
      rating: 0,
      director: formData.director,
      cast: formData.cast,
      duration: 0,
      videoUrl: formData.videoUrl || '',
      posterUrl: formData.posterUrl || '',
      trailerUrl: formData.trailerUrl || '',
      previewUrl: formData.previewUrl || '',
      isPremium: formData.isPremium || false,
      createdAt: new Date()
    }
    
    return newMovie
  }

  // Ajouter ou mettre à jour une série
  static async addSeries(formData: ContentFormData): Promise<Series> {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simuler un délai API
    
    if (typeof window !== 'undefined') {
      const existingSeries = this.getStoredSeries()
      
      // Vérifier si une série avec le même titre et la même année existe déjà
      const existingSerie = existingSeries.find(serie => 
        serie.title.toLowerCase() === formData.title.toLowerCase() && 
        serie.year === formData.year
      )
      
      if (existingSerie) {
        // Mettre à jour la série existante
        const updatedSeries: Series = {
          ...existingSerie,
          title: formData.title,
          description: formData.description,
          year: formData.year,
          catalogue: formData.catalogue,
          genre: formData.genre,
          director: formData.director,
          cast: formData.cast,
          posterUrl: formData.posterUrl || existingSerie.posterUrl,
          trailerUrl: formData.trailerUrl || existingSerie.trailerUrl,
          isPremium: formData.isPremium !== undefined ? formData.isPremium : existingSerie.isPremium,
          seasons: formData.seasons?.map((season: any) => ({
            id: (season as any).id || Date.now().toString() + Math.random(),
            seasonNumber: season.seasonNumber,
            title: season.title,
            description: season.description,
            year: formData.year,
            posterUrl: formData.posterUrl || '',
            episodes: season.episodes.map((episode: any) => ({
              id: (episode as any).id || Date.now().toString() + Math.random(),
              episodeNumber: episode.episodeNumber,
              title: episode.title,
              description: episode.description,
              duration: episode.duration,
              videoUrl: episode.videoUrl,
              previewUrl: episode.previewUrl || '',
              thumbnailUrl: episode.thumbnailUrl || formData.posterUrl || '',
              airDate: episode.airDate || new Date()
            }))
          })) || existingSerie.seasons,
        }
        
        // Remplacer dans la liste
        const seriesIndex = existingSeries.findIndex(serie => serie.id === existingSerie.id)
        existingSeries[seriesIndex] = updatedSeries
        localStorage.setItem('admin_series', JSON.stringify(existingSeries))
        
        // Enregistrer l'activité
        ActivityService.logContentActivity('success', `Série mise à jour: "${updatedSeries.title}"`, {
          contentId: updatedSeries.id,
          contentTitle: updatedSeries.title,
          catalogue: updatedSeries.catalogue,
          year: updatedSeries.year,
          seasonsCount: updatedSeries.seasons.length
        })
        
        return updatedSeries
      } else {
        // Créer une nouvelle série
        const newSeries: Series = {
          id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
          title: formData.title,
          description: formData.description,
          year: formData.year,
          catalogue: formData.catalogue,
          genre: formData.genre,
          rating: 0,
          director: formData.director,
          cast: formData.cast,
          posterUrl: formData.posterUrl || '',
          trailerUrl: formData.trailerUrl || '',
          isPremium: formData.isPremium || false,
          seasons: formData.seasons?.map(season => ({
            id: Date.now().toString() + Math.random(),
            seasonNumber: season.seasonNumber,
            title: season.title,
            description: season.description,
            year: formData.year,
            posterUrl: formData.posterUrl || '',
            episodes: season.episodes.map(episode => ({
              id: Date.now().toString() + Math.random(),
              episodeNumber: episode.episodeNumber,
              title: episode.title,
              description: episode.description,
              duration: episode.duration,
              videoUrl: episode.videoUrl,
              previewUrl: episode.previewUrl || '',
              thumbnailUrl: episode.thumbnailUrl || formData.posterUrl || '',
              airDate: new Date()
            }))
          })) || [],
          createdAt: new Date()
        }

        existingSeries.push(newSeries)
        localStorage.setItem('admin_series', JSON.stringify(existingSeries))

        // Enregistrer l'activité
        ActivityService.logContentActivity('success', `Nouvelle série ajoutée: "${newSeries.title}"`, {
          contentId: newSeries.id,
          contentTitle: newSeries.title,
          catalogue: newSeries.catalogue,
          year: newSeries.year,
          seasonsCount: newSeries.seasons.length
        })

        return newSeries
      }
    }
    
    // Fallback si localStorage n'est pas disponible
    const newSeries: Series = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      title: formData.title,
      description: formData.description,
      year: formData.year,
      catalogue: formData.catalogue,
      genre: formData.genre,
      rating: 0,
      director: formData.director,
      cast: formData.cast,
      posterUrl: formData.posterUrl || '',
      trailerUrl: formData.trailerUrl || '',
      isPremium: formData.isPremium || false,
      seasons: formData.seasons?.map(season => ({
        id: Date.now().toString() + Math.random(),
        seasonNumber: season.seasonNumber,
        title: season.title,
        description: season.description,
        year: formData.year,
        posterUrl: formData.posterUrl || '',
        episodes: season.episodes.map(episode => ({
          id: Date.now().toString() + Math.random(),
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          description: episode.description,
          duration: episode.duration,
          videoUrl: episode.videoUrl,
          previewUrl: episode.previewUrl || '',
          thumbnailUrl: episode.thumbnailUrl || formData.posterUrl || '',
          airDate: new Date()
        }))
      })) || [],
      createdAt: new Date()
    }
    
    return newSeries
  }

  // Supprimer un contenu
  static async deleteContent(id: string, type: 'movie' | 'series'): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simuler un délai API
    
    if (typeof window !== 'undefined') {
      if (type === 'movie') {
        const movies = this.getStoredMovies()
        const filteredMovies = movies.filter(movie => movie.id !== id)
        localStorage.setItem('admin_movies', JSON.stringify(filteredMovies))
      } else {
        const series = this.getStoredSeries()
        const filteredSeries = series.filter(serie => serie.id !== id)
        localStorage.setItem('admin_series', JSON.stringify(filteredSeries))
      }
    }
  }

  // Mettre à jour du contenu
  static async updateContent(id: string, type: 'movie' | 'series', updates: Partial<ContentFormData>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simuler un délai API
    
    logger.debug('AdminContentService.updateContent Debug', {
      id,
      type,
      hasSeasons: 'seasons' in updates,
      seasonsLength: 'seasons' in updates ? updates.seasons?.length : 0
    })
    
    if (typeof window !== 'undefined') {
      if (type === 'movie') {
        const movies = this.getStoredMovies()
        const movieIndex = movies.findIndex(movie => movie.id === id)
        if (movieIndex !== -1) {
          const updatedMovie: Movie = {
            ...movies[movieIndex],
            title: updates.title || movies[movieIndex].title,
            description: updates.description || movies[movieIndex].description,
            year: updates.year || movies[movieIndex].year,
            catalogue: updates.catalogue || movies[movieIndex].catalogue,
            genre: updates.genre || movies[movieIndex].genre,
            director: updates.director || movies[movieIndex].director,
            cast: updates.cast || movies[movieIndex].cast,
            videoUrl: updates.videoUrl !== undefined ? updates.videoUrl : movies[movieIndex].videoUrl,
            posterUrl: updates.posterUrl !== undefined ? updates.posterUrl : movies[movieIndex].posterUrl,
            trailerUrl: updates.trailerUrl !== undefined ? updates.trailerUrl : movies[movieIndex].trailerUrl,
            previewUrl: updates.previewUrl !== undefined ? updates.previewUrl : movies[movieIndex].previewUrl,
            isPremium: updates.isPremium !== undefined ? updates.isPremium : movies[movieIndex].isPremium,
          }
          movies[movieIndex] = updatedMovie
          localStorage.setItem('admin_movies', JSON.stringify(movies))
          
          // Enregistrer l'activité
          ActivityService.logContentActivity('success', `Film modifié: "${updatedMovie.title}"`, {
            contentId: updatedMovie.id,
            contentTitle: updatedMovie.title,
            catalogue: updatedMovie.catalogue,
            year: updatedMovie.year
          })
        }
      } else {
        const series = this.getStoredSeries()
        const seriesIndex = series.findIndex(serie => serie.id === id)
        if (seriesIndex !== -1) {
          const finalSeasons: Season[] = (updates.seasons && Array.isArray(updates.seasons) && updates.seasons.length > 0) 
            ? updates.seasons.map((season: any) => ({
                id: (season as any).id || Date.now().toString() + Math.random(),
                seasonNumber: season.seasonNumber,
                title: season.title,
                description: season.description,
                year: updates.year || series[seriesIndex].year,
                posterUrl: updates.posterUrl || series[seriesIndex].posterUrl || '',
                episodes: season.episodes.map((episode: any) => ({
                  id: (episode as any).id || Date.now().toString() + Math.random(),
                  episodeNumber: episode.episodeNumber,
                  title: episode.title,
                  description: episode.description,
                  duration: episode.duration,
                  videoUrl: episode.videoUrl,
                  previewUrl: episode.previewUrl || '',
                  thumbnailUrl: episode.thumbnailUrl || '',
                  airDate: episode.airDate ? new Date(episode.airDate) : new Date()
                }))
              }))
            : series[seriesIndex].seasons
            
          logger.debug('Séries update debug', {
            originalSeasonsLength: series[seriesIndex].seasons.length,
            updatesSeasonsLength: updates.seasons?.length || 0,
            finalSeasonsLength: finalSeasons.length,
            hasUpdatesSeasons: 'seasons' in updates,
            updatesSeasons: updates.seasons
          })
          
          const updatedSeries: Series = {
            ...series[seriesIndex],
            title: updates.title || series[seriesIndex].title,
            description: updates.description || series[seriesIndex].description,
            year: updates.year || series[seriesIndex].year,
            catalogue: updates.catalogue || series[seriesIndex].catalogue,
            genre: updates.genre || series[seriesIndex].genre,
            director: updates.director || series[seriesIndex].director,
            cast: updates.cast || series[seriesIndex].cast,
            posterUrl: updates.posterUrl !== undefined ? updates.posterUrl : series[seriesIndex].posterUrl,
            trailerUrl: updates.trailerUrl !== undefined ? updates.trailerUrl : series[seriesIndex].trailerUrl,
            previewUrl: updates.previewUrl !== undefined ? updates.previewUrl : series[seriesIndex].previewUrl,
            isPremium: updates.isPremium !== undefined ? updates.isPremium : series[seriesIndex].isPremium,
            // Préserver les saisons existantes si aucune nouvelle saison n'est fournie
            seasons: finalSeasons,
          }
          series[seriesIndex] = updatedSeries
          localStorage.setItem('admin_series', JSON.stringify(series))
          
          // Enregistrer l'activité
          ActivityService.logContentActivity('success', `Série modifiée: "${updatedSeries.title}"`, {
            contentId: updatedSeries.id,
            contentTitle: updatedSeries.title,
            catalogue: updatedSeries.catalogue,
            year: updatedSeries.year,
            seasonsCount: updatedSeries.seasons.length
          })
        }
      }
    }
  }

  // Récupérer les films stockés
  static getStoredMovies(): Movie[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('admin_movies')
      const movies = stored ? JSON.parse(stored) : []
      
      // Supprimer les doublons par ID
      const uniqueMovies = movies.filter((item: Movie, index: number, self: Movie[]) => 
        index === self.findIndex(t => t.id === item.id)
      )
      
      // Si des doublons ont été trouvés, sauvegarder la version nettoyée
      if (uniqueMovies.length !== movies.length) {
        localStorage.setItem('admin_movies', JSON.stringify(uniqueMovies))
        logger.debug(`Nettoyé ${movies.length - uniqueMovies.length} doublons de films`)
      }
      
      return uniqueMovies
    } catch (error) {
      logger.error('Error loading movies', error as Error)
      return []
    }
  }

  // Récupérer les séries stockées
  static getStoredSeries(): Series[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('admin_series')
      const series = stored ? JSON.parse(stored) : []
      
      // Supprimer les doublons par ID
      const uniqueSeries = series.filter((item: Series, index: number, self: Series[]) => 
        index === self.findIndex(t => t.id === item.id)
      )
      
      // Si des doublons ont été trouvés, sauvegarder la version nettoyée
      if (uniqueSeries.length !== series.length) {
        localStorage.setItem('admin_series', JSON.stringify(uniqueSeries))
        logger.info('Doublons de séries nettoyés', { count: series.length - uniqueSeries.length })
      }
      
      return uniqueSeries
    } catch (error) {
      logger.error('Error loading series', error as Error)
      return []
    }
  }

  // Initialiser avec des données de test si aucune donnée n'existe
  static initializeWithTestData(): void {
    if (typeof window === 'undefined') return

    const existingMovies = this.getStoredMovies()
    const existingSeries = this.getStoredSeries()

    if (existingMovies.length === 0 && existingSeries.length === 0) {
      // Ajouter quelques films de test
      const testMovies: Movie[] = [
        {
          id: 'test_movie_1',
          title: 'Film de Test 1',
          description: 'Description du film de test 1',
          year: 2024,
          catalogue: 'collection',
          genre: ['Action', 'Aventure'],
          rating: 0,
          director: 'Réalisateur Test',
          cast: ['Acteur 1', 'Actrice 1'],
          duration: 120,
          videoUrl: '',
          posterUrl: '',
          trailerUrl: '',
          previewUrl: '',
          isPremium: false,
          createdAt: new Date()
        }
      ]

      // Ajouter quelques séries de test
      const testSeries: Series[] = [
        {
          id: 'test_series_1',
          title: 'Série de Test 1',
          description: 'Description de la série de test 1',
          year: 2024,
          catalogue: 'collection',
          genre: ['Drame', 'Thriller'],
          rating: 0,
          director: 'Réalisateur Test',
          cast: ['Acteur 2', 'Actrice 2'],
          posterUrl: '',
          trailerUrl: '',
          isPremium: false,
          seasons: [
            {
              id: 'test_season_1',
              seasonNumber: 1,
              title: 'Saison 1',
              description: 'Description de la saison 1',
              year: 2024,
              posterUrl: '',
              episodes: [
                {
                  id: 'test_episode_1',
                  episodeNumber: 1,
                  title: 'Épisode 1',
                  description: 'Description de l\'épisode 1',
                  duration: 45,
                  videoUrl: '',
                  previewUrl: '',
                  thumbnailUrl: '',
                  airDate: new Date()
                }
              ]
            }
          ],
          createdAt: new Date()
        }
      ]

      localStorage.setItem('admin_movies', JSON.stringify(testMovies))
      localStorage.setItem('admin_series', JSON.stringify(testSeries))
    }
  }

  // Exporter le contenu par type
  static async exportContent(type: 'films' | 'series'): Promise<any[]> {
    if (type === 'films') {
      return this.getStoredMovies()
    } else {
      return this.getStoredSeries()
    }
  }

  // Exporter les données en Excel
  static async exportToExcel(): Promise<Blob> {
    const movies = this.getStoredMovies()
    const series = this.getStoredSeries()
    
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Contenu')
    
    // En-têtes
    worksheet.columns = [
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Titre', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Année', key: 'year', width: 10 },
      { header: 'Catalogue', key: 'catalogue', width: 15 },
      { header: 'Genre', key: 'genre', width: 20 },
      { header: 'Réalisateur', key: 'director', width: 20 },
      { header: 'Casting', key: 'cast', width: 30 },
      { header: 'URL Vidéo', key: 'videoUrl', width: 30 },
      { header: 'URL Affiche', key: 'posterUrl', width: 30 },
      { header: 'Premium', key: 'isPremium', width: 10 }
    ]
    
    // Ajouter les films
    movies.forEach(movie => {
      worksheet.addRow({
        type: 'Film',
        title: movie.title,
        description: movie.description,
        year: movie.year,
        catalogue: movie.catalogue,
        genre: movie.genre.join(', '),
        director: movie.director,
        cast: movie.cast.join(', '),
        videoUrl: movie.videoUrl,
        posterUrl: movie.posterUrl,
        isPremium: movie.isPremium ? 'Oui' : 'Non'
      })
    })
    
    // Ajouter les séries
    series.forEach(serie => {
      worksheet.addRow({
        type: 'Série',
        title: serie.title,
        description: serie.description,
        year: serie.year,
        catalogue: serie.catalogue,
        genre: serie.genre.join(', '),
        director: serie.director,
        cast: serie.cast.join(', '),
        videoUrl: '',
        posterUrl: serie.posterUrl,
        isPremium: serie.isPremium ? 'Oui' : 'Non'
      })
    })
    
    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Importer depuis Excel
  static async importFromExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const data = results.data as any[]
          const result = await this.processImportData(data)
          resolve(result)
        },
        error: (error) => {
          resolve({
            success: false,
            importedCount: 0,
            errors: [error.message]
          })
        }
      })
    })
  }

  // Traiter les données d'import
  private static async processImportData(data: any[]): Promise<ImportResult> {
    const movies: ContentFormData[] = []
    const series: ContentFormData[] = []
    const errors: string[] = []
    let importedCount = 0

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 car l'en-tête est la ligne 1 et l'index commence à 0

      try {
        if (row.type_contenu?.toLowerCase() === 'série' || row.type_contenu?.toLowerCase() === 'serie') {
          // C'est une série
          const contentData: ContentFormData = {
                title: row.titre?.trim(),
                description: row.description?.trim(),
                videoUrl: '', // Les séries n'ont pas de videoUrl direct, seulement dans les épisodes
                year: parseInt(row.annee),
                catalogue: row.catalogue?.trim() || 'collection',
                genre: row.genre?.split(',').map((g: string) => g.trim()).filter(Boolean) || [],
                director: row.realisateur?.trim(),
                cast: row.casting?.split(',').map((c: string) => c.trim()).filter(Boolean) || [],
                posterUrl: row.url_affiche?.trim(),
                trailerUrl: row.url_bande_annonce?.trim(),
                isPremium: row.type_contenu?.toLowerCase() === 'premium',
            type: 'series' as const,
            seasons: [
              {
                seasonNumber: 1,
                title: 'Saison 1',
                description: 'Description de la saison 1',
                episodes: [
                  {
                    episodeNumber: 1,
                    title: 'Épisode 1',
                    description: 'Description de l\'épisode 1',
                    duration: 45,
                    videoUrl: row.url_video?.trim() || '',
                    previewUrl: row.url_aperçu?.trim() || '',
                    thumbnailUrl: row.url_affiche?.trim() || ''
                  }
                ]
              }
            ]
          }
          series.push(contentData)
        } else {
          // C'est un film
          const contentData: ContentFormData = {
            title: row.titre?.trim(),
            description: row.description?.trim(),
            year: parseInt(row.annee),
            catalogue: row.catalogue?.trim() || 'collection',
            genre: row.genre?.split(',').map((g: string) => g.trim()).filter(Boolean) || [],
            director: row.realisateur?.trim(),
            cast: row.casting?.split(',').map((c: string) => c.trim()).filter(Boolean) || [],
            videoUrl: row.url_video?.trim(),
            posterUrl: row.url_affiche?.trim(),
            trailerUrl: row.url_bande_annonce?.trim(),
            previewUrl: row.url_aperçu?.trim(),
            isPremium: row.type_contenu?.toLowerCase() === 'premium',
            type: 'movie' as const
          }
          movies.push(contentData)
        }
      } catch (error) {
        errors.push(`Ligne ${rowNumber}: Erreur lors du traitement - ${error}`)
      }
    }

    // Traiter les films
    for (const movieData of movies) {
      try {
        await this.addMovie(movieData)
        importedCount++
      } catch (error) {
        errors.push(`Erreur lors de l'ajout du film "${movieData.title}": ${error}`)
      }
    }

    // Traiter les séries
    for (const seriesData of series) {
      try {
        await this.addSeries(seriesData)
        importedCount++
      } catch (error) {
        errors.push(`Erreur lors de l'ajout de la série "${seriesData.title}": ${error}`)
      }
    }

    return {
      success: importedCount > 0,
      importedCount,
      errors
    }
  }

  // Obtenir les statistiques
  static getStats(): { movies: number; series: number; total: number } {
    const movies = this.getStoredMovies()
    const series = this.getStoredSeries()

    return {
      movies: movies.length,
      series: series.length,
      total: movies.length + series.length
    }
  }

  // Vérifier l'intégrité des données
  static verifyDataIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    
    try {
      const movies = this.getStoredMovies()
      const series = this.getStoredSeries()
      
      // Vérifier les films
      movies.forEach((movie, index) => {
        if (!movie.id) issues.push(`Film ${index + 1}: ID manquant`)
        if (!movie.title) issues.push(`Film ${index + 1}: Titre manquant`)
        if (!movie.year || movie.year < 1900 || movie.year > 2030) {
          issues.push(`Film ${index + 1}: Année invalide (${movie.year})`)
        }
      })
      
      // Vérifier les séries
      series.forEach((serie, index) => {
        if (!serie.id) issues.push(`Série ${index + 1}: ID manquant`)
        if (!serie.title) issues.push(`Série ${index + 1}: Titre manquant`)
        if (!serie.year || serie.year < 1900 || serie.year > 2030) {
          issues.push(`Série ${index + 1}: Année invalide (${serie.year})`)
        }
      })
      
      return {
        isValid: issues.length === 0,
        issues
      }
    } catch (error) {
      return {
        isValid: false,
        issues: [`Erreur lors de la vérification: ${error}`]
      }
    }
  }

  // Nettoyer les données
  static cleanupData(): { cleaned: number; message: string } {
    try {
      const movies = this.getStoredMovies()
      const series = this.getStoredSeries()
      
      // Les fonctions getStoredMovies et getStoredSeries nettoient déjà les doublons
      // Cette fonction peut être étendue pour d'autres nettoyages
      
      return {
        cleaned: 0,
        message: 'Données déjà nettoyées'
      }
    } catch (error) {
    return {
        cleaned: 0,
        message: `Erreur lors du nettoyage: ${error}`
      }
    }
  }

  // Obtenir tous les contenus
  static getAllContent(): (Movie | Series)[] {
    return [...this.getStoredMovies(), ...this.getStoredSeries()]
  }

  // Rechercher du contenu
  static searchContent(query: string): (Movie | Series)[] {
    const allContent = this.getAllContent()
    const lowercaseQuery = query.toLowerCase()
    
    return allContent.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.director.toLowerCase().includes(lowercaseQuery) ||
      item.cast.some(actor => actor.toLowerCase().includes(lowercaseQuery))
    )
  }

  // Valider les données de contenu
  static validateContentData(data: ContentFormData | (ContentFormData & { seasons?: any[] })): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Validation des champs obligatoires
    if (!data.title || data.title.trim() === '') {
      errors.push('Le titre est obligatoire')
    }

    if (!data.description || data.description.trim() === '') {
      errors.push('La description est obligatoire')
    }

    if (!data.year || data.year < 1900 || data.year > 2030) {
      errors.push('L\'année doit être entre 1900 et 2030')
    }

    if (!data.director || data.director.trim() === '') {
      errors.push('Le réalisateur est obligatoire')
    }

    if (!data.genre || data.genre.length === 0) {
      errors.push('Au moins un genre doit être sélectionné')
    }

    if (!data.cast || data.cast.length === 0) {
      errors.push('Au moins un acteur doit être ajouté')
    }

    // Validation spécifique aux séries
    if (data.type === 'series') {
      const seriesData = data as ContentFormData & { seasons?: any[] }
      if (!seriesData.seasons || seriesData.seasons.length === 0) {
        errors.push('Au moins une saison doit être ajoutée pour une série')
      } else {
        seriesData.seasons.forEach((season, seasonIndex) => {
          if (!season.title || season.title.trim() === '') {
            errors.push(`La saison ${seasonIndex + 1} doit avoir un titre`)
          }
          if (!season.episodes || season.episodes.length === 0) {
            errors.push(`La saison ${seasonIndex + 1} doit avoir au moins un épisode`)
          } else {
            season.episodes.forEach((episode: any, episodeIndex: number) => {
              if (!episode.title || episode.title.trim() === '') {
                errors.push(`L'épisode ${episodeIndex + 1} de la saison ${seasonIndex + 1} doit avoir un titre`)
              }
              if (!episode.videoUrl || episode.videoUrl.trim() === '') {
                errors.push(`L'épisode ${episodeIndex + 1} de la saison ${seasonIndex + 1} doit avoir une URL vidéo`)
              }
            })
          }
        })
      }
    }

    // Validation spécifique aux films
    if (data.type === 'movie') {
      const movieData = data as ContentFormData
      if (!movieData.videoUrl || movieData.videoUrl.trim() === '') {
        errors.push('L\'URL vidéo est obligatoire pour un film')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Importer du contenu depuis un fichier
  static async importFromFile(file: File, type: 'films' | 'series'): Promise<ImportResult> {
    logger.info('Début de l\'import', { fileName: file.name, type })
    return new Promise(async (resolve) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          logger.debug('Contenu du fichier', { preview: content.substring(0, 200) + '...' })
          const lines = content.split('\n').filter(line => line.trim())
          logger.debug('Nombre de lignes', { count: lines.length })
          
          if (lines.length === 0) {
            resolve({
              success: false,
              importedCount: 0,
              errors: ['Le fichier est vide']
            })
            return
          }

          // Parser le CSV
          const results = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.toLowerCase().trim()
          })

          if (results.errors.length > 0) {
            resolve({
              success: false,
              importedCount: 0,
              errors: results.errors.map(error => `Erreur de parsing: ${error.message}`)
            })
            return
          }

          const data = results.data as any[]
          let importedCount = 0
          const errors: string[] = []

          // Traiter chaque ligne
          for (let i = 0; i < data.length; i++) {
            const row = data[i]
            const rowNumber = i + 2 // +2 car on commence à la ligne 2 (après l'en-tête)

            try {
              if (type === 'films') {
                const movieData: ContentFormData = {
                  type: 'movie',
                  title: row.titre || '',
                  description: row.description || '',
                  year: parseInt(row.annee) || new Date().getFullYear(),
                  catalogue: row.catalogue || 'collection',
                  genre: row.genre ? row.genre.split(',').map((g: string) => g.trim()) : [],
                  director: row.realisateur || '',
                  cast: row.casting ? row.casting.split(',').map((c: string) => c.trim()) : [],
                  videoUrl: row.url_video || '',
                  posterUrl: row.url_affiche || '',
                  trailerUrl: row.url_bande_annonce || '',
                  previewUrl: row.url_apercu || '',
                  isPremium: row.type_contenu === 'premium'
                }

                // Valider les données
                const validation = this.validateContentData(movieData)
                if (!validation.isValid) {
                  errors.push(`Ligne ${rowNumber}: ${validation.errors.join(', ')}`)
                  continue
                }

                // Créer le film
                try {
                  const movie = await this.addMovie(movieData)
                  if (movie) {
                    importedCount++
                    logger.info('Film importé avec succès', { title: movie.title })
                  }
                } catch (error) {
                  errors.push(`Ligne ${rowNumber}: Erreur lors de la création du film - ${error}`)
                }
              } else if (type === 'series') {
                const seriesData: ContentFormData = {
                  type: 'series',
                  title: row.titre || '',
                  description: row.description || '',
                  videoUrl: '', // Les séries n'ont pas de videoUrl direct, seulement dans les épisodes
                  year: parseInt(row.annee) || new Date().getFullYear(),
                  catalogue: row.catalogue || 'collection',
                  genre: row.genre ? row.genre.split(',').map((g: string) => g.trim()) : [],
                  director: row.realisateur || '',
                  cast: row.casting ? row.casting.split(',').map((c: string) => c.trim()) : [],
                  posterUrl: row.url_affiche || '',
                  trailerUrl: row.url_bande_annonce || '',
                  isPremium: row.type_contenu === 'premium',
                  seasons: [{
                    seasonNumber: parseInt(row.saison) || 1,
                    title: row.titre_saison?.trim() || `Saison ${parseInt(row.saison) || 1}`,
                    description: row.description_saison?.trim() || '',
                    episodes: [{
                      episodeNumber: parseInt(row.episode) || 1,
                      title: row.titre_episode || '',
                      description: row.description_episode?.trim() || '',
                      duration: parseInt(row.duree_episode) || 45,
                      videoUrl: row.url_video_episode || '',
                      previewUrl: row.url_apercu_episode || '',
                      thumbnailUrl: row.url_thumbnail?.trim() || ''
                    }]
                  }]
                }

                // Valider les données
                const validation = this.validateContentData(seriesData)
                if (!validation.isValid) {
                  errors.push(`Ligne ${rowNumber}: ${validation.errors.join(', ')}`)
                  continue
                }

                // Créer la série
                try {
                  const series = await this.addSeries(seriesData)
                  if (series) {
                    importedCount++
                    logger.info('Série importée avec succès', { title: series.title })
                  }
                } catch (error) {
                  errors.push(`Ligne ${rowNumber}: Erreur lors de la création de la série - ${error}`)
                }
              }
            } catch (error) {
              errors.push(`Ligne ${rowNumber}: Erreur lors du traitement - ${error}`)
            }
          }

          resolve({
            success: importedCount > 0,
            importedCount,
            errors: errors.length > 0 ? errors : []
          })

        } catch (error) {
          resolve({
            success: false,
            importedCount: 0,
            errors: [`Erreur lors du traitement du fichier: ${error}`]
          })
        }
      }

      reader.onerror = () => {
        resolve({
          success: false,
          importedCount: 0,
          errors: ['Erreur lors de la lecture du fichier']
        })
      }

      reader.readAsText(file)
    })
  }
}
