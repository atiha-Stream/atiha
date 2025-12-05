'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { useRouter } from 'next/navigation'
import { subscriptionNotificationsService } from '@/lib/subscription-notifications-service'

interface PremiumRequiredNotificationProps {
  isVisible: boolean
  onClose: () => void
}

export default function PremiumRequiredNotification({ 
  isVisible, 
  onClose 
}: PremiumRequiredNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const [contenuPremiumNotification, setContenuPremiumNotification] = useState(subscriptionNotificationsService.getContenuPremiumNotification())

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Charger les notifications d&apos;abonnement
    setContenuPremiumNotification(subscriptionNotificationsService.getContenuPremiumNotification())
  }, [])

  // Écouter les mises à jour des notifications
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      setContenuPremiumNotification(subscriptionNotificationsService.getContenuPremiumNotification())
    }

    window.addEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
    return () => window.removeEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
  }, [])

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Bloquer le scroll du body quand la notification est visible
      document.body.style.overflow = 'hidden'
    } else {
      // Rétablir le scroll quand la notification se ferme
      document.body.style.overflow = ''
    }

    // Cleanup function pour rétablir le scroll si le composant est démonté
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleSubscribe = () => {
    handleClose()
    router.push('/subscription')
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
        `}
        style={isClient ? {
          background: `linear-gradient(to right, ${content.appIdentity.colors.primary}85, ${content.appIdentity.colors.secondary}85)`,
          borderColor: `${content.appIdentity.colors.primary}30`
        } : {
          background: 'linear-gradient(to right, #3B82F685, #2563eb85)',
          borderColor: '#3B82F630'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🔒</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{contenuPremiumNotification.title}</h3>
                <p className="text-white/80 text-sm">{contenuPremiumNotification.subtitle}</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <LockClosedIcon 
                  className="w-5 h-5" 
                  style={isClient ? { color: content.appIdentity.colors.accent } : { color: '#F59E0B' }}
                />
                <span className="text-white font-semibold">{contenuPremiumNotification.sectionTitle}</span>
              </div>
              <p className="text-white/90 text-sm">
                {contenuPremiumNotification.sectionDescription}
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-white/90">
              {contenuPremiumNotification.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircleIcon 
                    className="w-4 h-4" 
                    style={isClient ? { color: content.appIdentity.colors.accent } : { color: '#F59E0B' }}
                  />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-white/20 flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {contenuPremiumNotification.cancelButton}
            </button>
            <button
              onClick={handleSubscribe}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {contenuPremiumNotification.subscribeButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
