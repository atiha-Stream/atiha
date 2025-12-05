'use client'

import React, { useState, useEffect } from 'react'
import { UserRating } from '@/types/user-profile'
import { UserProfileService } from '@/lib/user-profile-service'
import { useAuth } from '@/lib/auth-context'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { 
  StarIcon, 
  HeartIcon, 
  PencilIcon, 
  ChatBubbleLeftIcon, 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  CheckIcon 
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

interface RatingSystemProps {
  contentId: string
  contentType: 'movie' | 'series'
  title: string
  className?: string
}

export default function RatingSystem({ contentId, contentType, title, className = '' }: RatingSystemProps) {
  const { user } = useAuth()
  const [userRating, setUserRating] = useState<UserRating | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [review, setReview] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserRating()
    }
  }, [user, contentId])

  const loadUserRating = async () => {
    if (!user) return

    try {
      const rating = await UserProfileService.getRating(user.id, contentId)
      setUserRating(rating)
      if (rating?.review) {
        setReview(rating.review)
      }
    } catch (error) {
      logger.error('Error loading user rating', error as Error)
    }
  }

  const handleStarClick = async (rating: number) => {
    if (!user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const success = await UserProfileService.addRating(
        user.id,
        contentId,
        contentType,
        rating,
        review || undefined
      )

      if (success) {
        setUserRating(prev => prev ? { ...prev, rating } : {
          id: Date.now().toString(),
          contentId,
          contentType,
          rating,
          review: review || undefined,
          ratedAt: new Date(),
          helpful: 0,
          notHelpful: 0
        })
        setIsEditing(false)
      }
    } catch (error) {
      logger.error('Error submitting rating', error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (!user || !userRating || isSubmitting) return

    setIsSubmitting(true)
    try {
      const success = await UserProfileService.addRating(
        user.id,
        contentId,
        contentType,
        userRating.rating,
        review
      )

      if (success) {
        setUserRating(prev => prev ? { ...prev, review } : null)
        setShowReviewForm(false)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddToWatchlist = async () => {
    if (!user) return

    try {
      await UserProfileService.addToWatchlist(
        user.id,
        contentId,
        contentType,
        title
      )
    } catch (error) {
      console.error('Error adding to watchlist:', error)
    }
  }

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && handleStarClick(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            disabled={!interactive || isSubmitting}
            className={`transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${isSubmitting ? 'opacity-50' : ''}`}
          >
            {star <= (hoveredStar || rating) ? (
              <StarIconSolid className="w-6 h-6 text-yellow-400" />
            ) : (
              <StarIcon className="w-6 h-6 text-gray-400" />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Votre avis</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddToWatchlist}
            className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
          >
            <HeartIcon className="w-4 h-4" />
            <span className="text-sm">À regarder</span>
          </button>
        </div>
      </div>

      {/* Note utilisateur */}
      <div className="bg-dark-300 rounded-lg p-4">
        {userRating ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {renderStars(userRating.rating)}
                <span className="text-white font-medium">
                  {userRating.rating}/5
                </span>
                <span className="text-gray-400 text-sm">
                  Noté le {new Date(userRating.ratedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Avis utilisateur */}
            {userRating.review && (
              <div className="bg-dark-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {userRating.review}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions sur l&apos;avis */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors">
                  <HandThumbUpIcon className="w-4 h-4" />
                  <span>Utile ({userRating.helpful})</span>
                </button>
                <button className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors">
                  <HandThumbDownIcon className="w-4 h-4" />
                  <span>Pas utile ({userRating.notHelpful})</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-4">Donnez votre avis sur {title}</p>
            <div className="flex items-center justify-center space-x-2">
              {renderStars(0, true)}
            </div>
          </div>
        )}

        {/* Édition de la note */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm">Modifier votre note :</span>
                {renderStars(userRating?.rating || 0, true)}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors"
                >
                  Ajouter un avis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire d&apos;avis */}
      {showReviewForm && (
        <div className="bg-dark-300 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Votre avis détaillé</h4>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full px-3 py-2 bg-dark-200 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Partagez votre avis sur ce contenu..."
            rows={4}
          />
          
          <div className="flex items-center justify-end space-x-2 mt-3">
            <button
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleReviewSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Publier</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Statistiques globales (simulées) */}
      <div className="bg-dark-300 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Avis de la communauté</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              {renderStars(4.2)}
            </div>
            <p className="text-2xl font-bold text-white">4.2</p>
            <p className="text-gray-400 text-sm">Note moyenne</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">1,234</p>
            <p className="text-gray-400 text-sm">Avis</p>
          </div>
        </div>
        
        {/* Répartition des notes */}
        <div className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm w-4">{star}</span>
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${Math.random() * 100}%` }}
                ></div>
              </div>
              <span className="text-gray-400 text-sm w-8">
                {Math.floor(Math.random() * 50)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
