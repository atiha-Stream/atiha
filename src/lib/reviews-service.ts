import { logger } from './logger'

export interface Review {
  id: string
  contentId: string
  userId: string
  userName: string
  userEmail: string
  rating: number // 1-5 étoiles
  comment: string
  sentiment?: 'like' | 'dislike' // Sentiment de l'utilisateur (j'aime/je n'aime pas)
  createdAt: Date
  updatedAt?: Date
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export class ReviewsService {
  private static readonly STORAGE_KEY = 'atiha_reviews'

  // Récupérer tous les avis
  static getAllReviews(): Review[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      const reviews = JSON.parse(stored)
      return reviews.map((review: any) => ({
        ...review,
        createdAt: new Date(review.createdAt),
        updatedAt: review.updatedAt ? new Date(review.updatedAt) : undefined
      }))
    }
    return []
  }

  // Récupérer les avis pour un contenu spécifique
  static getReviewsForContent(contentId: string): Review[] {
    return this.getAllReviews().filter(review => review.contentId === contentId)
  }

  // Ajouter un nouvel avis
  static addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const newReview: Review = {
      ...review,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    }

    const allReviews = this.getAllReviews()
    allReviews.push(newReview)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allReviews))
    }

    return newReview
  }

  // Mettre à jour un avis existant
  static updateReview(reviewId: string, updates: Partial<Pick<Review, 'rating' | 'comment' | 'sentiment'>>): Review | null {
    const allReviews = this.getAllReviews()
    const reviewIndex = allReviews.findIndex(review => review.id === reviewId)
    
    if (reviewIndex === -1) return null

    allReviews[reviewIndex] = {
      ...allReviews[reviewIndex],
      ...updates,
      updatedAt: new Date()
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allReviews))
    }

    return allReviews[reviewIndex]
  }

  // Supprimer un avis
  static deleteReview(reviewId: string): boolean {
    const allReviews = this.getAllReviews()
    const filteredReviews = allReviews.filter(review => review.id !== reviewId)
    
    if (filteredReviews.length === allReviews.length) return false

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredReviews))
    }

    return true
  }

  // Récupérer les statistiques d&apos;avis pour un contenu
  static getReviewStats(contentId: string): ReviewStats {
    const reviews = this.getReviewsForContent(contentId)
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating as keyof typeof dist]++
      return dist
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution
    }
  }

  // Vérifier si un utilisateur a déjà laissé un avis
  static hasUserReviewed(contentId: string, userId: string): Review | null {
    return this.getReviewsForContent(contentId).find(review => review.userId === userId) || null
  }

  // Exporter les données (pour les gestionnaires)
  static exportReviews(): string {
    return JSON.stringify(this.getAllReviews(), null, 2)
  }

  // Importer les données (pour les gestionnaires)
  static importReviews(jsonData: string): boolean {
    try {
      const reviews = JSON.parse(jsonData)
      if (Array.isArray(reviews)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reviews))
        }
        return true
      }
    } catch (error) {
      logger.error('Erreur lors de l\'import des avis', error as Error)
    }
    return false
  }
}
