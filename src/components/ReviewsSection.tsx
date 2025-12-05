'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ReviewsService, Review, ReviewStats } from '@/lib/reviews-service'
import { StarIcon, HeartIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { logger } from '@/lib/logger'

interface ReviewsSectionProps {
  contentId: string
  contentType: 'movie' | 'series'
  contentTitle: string
}

export default function ReviewsSection({ contentId, contentType, contentTitle }: ReviewsSectionProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)

  useEffect(() => {
    loadReviews()
    loadUserReview()
  }, [contentId, user?.id])

  const loadReviews = () => {
    const contentReviews = ReviewsService.getReviewsForContent(contentId)
    setReviews(contentReviews)
    setStats(ReviewsService.getReviewStats(contentId))
  }

  const loadUserReview = () => {
    if (user?.id) {
      const existingReview = ReviewsService.hasUserReviewed(contentId, user.id)
      setUserReview(existingReview)
      if (existingReview) {
        setUserRating(existingReview.rating)
        setUserComment(existingReview.comment)
      }
    }
  }

  const handleRatingClick = (rating: number) => {
    setUserRating(rating)
  }

  const handleSubmitReview = async () => {
    if (!user || userRating === 0) return

    setIsSubmitting(true)
    try {
      if (userReview) {
        // Mettre à jour l&apos;avis existant
        ReviewsService.updateReview(userReview.id, {
          rating: userRating,
          comment: userComment
        })
      } else {
        // Créer un nouvel avis
        ReviewsService.addReview({
          contentId,
          userId: user.id,
          userName: user.name || 'Utilisateur',
          userEmail: user.email || '',
          rating: userRating,
          comment: userComment
        })
      }
      
      loadReviews()
      loadUserReview()
    } catch (error) {
      logger.error('Erreur lors de la soumission de l\'avis', error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = () => {
    if (userReview) {
      ReviewsService.deleteReview(userReview.id)
      setUserReview(null)
      setUserRating(0)
      setUserComment('')
      loadReviews()
    }
  }

  const toggleWishlist = () => {
    setIsInWishlist(!isInWishlist)
    // Note: Fonctionnalité wishlist à implémenter dans une future version
  }

  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            {star <= rating ? (
              <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClasses[size]} text-gray-400`} />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section Avis Utilisateur */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Votre avis</h3>
          <button
            onClick={toggleWishlist}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isInWishlist 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <HeartIcon className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            <span>À regarder</span>
          </button>
        </div>

        <p className="text-gray-300 mb-4">
          Donnez votre avis sur {contentTitle}
        </p>

        <div className="space-y-4">
          {/* Note avec étoiles */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Votre note
            </label>
            {renderStars(userRating, true, 'lg')}
            {userRating > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                {userRating} étoile{userRating > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Votre commentaire
            </label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Partagez votre opinion sur ce contenu..."
              className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Boutons d&apos;action */}
          <div className="flex space-x-3">
            <button
              onClick={handleSubmitReview}
              disabled={userRating === 0 || isSubmitting}
              className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm sm:text-base rounded-lg transition-colors"
            >
              {isSubmitting ? 'Envoi...' : userReview ? 'Modifier l\'avis' : 'Publier l\'avis'}
            </button>
            
            {userReview && (
              <button
                onClick={handleDeleteReview}
                className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-2 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base rounded-lg transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Avis Communauté */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Avis de la communauté</h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Statistiques générales */}
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.averageRating}</div>
                <div className="text-sm text-gray-400">Note moyenne</div>
              </div>
              <div>
                {renderStars(Math.round(stats.averageRating), false, 'lg')}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
              <div className="text-sm text-gray-400">Avis</div>
            </div>
          </div>

          {/* Distribution des notes */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Distribution des notes</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm text-gray-300">{rating}</span>
                      <StarIcon className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      {reviews.length > 0 && (
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Commentaires ({reviews.length})</h3>
          
          <div className="space-y-4">
            {reviews
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((review) => (
                <div key={review.id} className="bg-dark-100 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-white">{review.userName}</span>
                        {renderStars(review.rating, false, 'sm')}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
