'use client'

import { Movie, Series } from '@/types/content'

export class GenreService {
  // Fonction pour extraire tous les genres uniques des films et séries
  static getAllUniqueGenres(movies: Movie[], series: Series[]): string[] {
    const allGenres = new Set<string>()
    
    // Extraire les genres des films
    movies.forEach(movie => {
      movie.genre.forEach(genre => {
        // Si le genre contient "/", le diviser en genres individuels
        if (genre.includes('/')) {
          const splitGenres = genre.split('/').map(g => g.trim()).filter(g => g.length > 0)
          splitGenres.forEach(splitGenre => allGenres.add(splitGenre))
        } else {
          allGenres.add(genre.trim())
        }
      })
    })
    
    // Extraire les genres des séries
    series.forEach(serie => {
      serie.genre.forEach(genre => {
        // Si le genre contient "/", le diviser en genres individuels
        if (genre.includes('/')) {
          const splitGenres = genre.split('/').map(g => g.trim()).filter(g => g.length > 0)
          splitGenres.forEach(splitGenre => allGenres.add(splitGenre))
        } else {
          allGenres.add(genre.trim())
        }
      })
    })
    
    return Array.from(allGenres).sort()
  }
  
  // Fonction pour vérifier si un contenu correspond à un genre spécifique
  static contentMatchesGenre(content: Movie | Series, targetGenre: string): boolean {
    return content.genre.some(genre => {
      // Si le genre contient "/", vérifier chaque genre individuel
      if (genre.includes('/')) {
        const splitGenres = genre.split('/').map(g => g.trim())
        return splitGenres.includes(targetGenre)
      } else {
        return genre.trim() === targetGenre
      }
    })
  }
  
  // Fonction pour formater un genre pour l'affichage
  static formatGenreForDisplay(genre: string): string {
    return genre.trim()
  }
  
  // Fonction pour valider un genre
  static isValidGenre(genre: string): boolean {
    return genre.trim().length > 0
  }
}
