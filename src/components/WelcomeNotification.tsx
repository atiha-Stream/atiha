'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, GiftIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { subscriptionNotificationsService } from '@/lib/subscription-notifications-service'

interface WelcomeNotificationProps {
  isVisible: boolean
  onClose: () => void
  hasPremiumTrial: boolean
  trialDays?: number
}

export default function WelcomeNotification({ 
  isVisible, 
  onClose, 
  hasPremiumTrial, 
  trialDays = 5 
}: WelcomeNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [bienvenueNotification, setBienvenueNotification] = useState(subscriptionNotificationsService.getBienvenueNotification())
  const [inscriptionReussieNotification, setInscriptionReussieNotification] = useState(subscriptionNotificationsService.getInscriptionReussieNotification())

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Charger les notifications d&apos;abonnement
    setBienvenueNotification(subscriptionNotificationsService.getBienvenueNotification())
    setInscriptionReussieNotification(subscriptionNotificationsService.getInscriptionReussieNotification())
  }, [])

  // Écouter les mises à jour des notifications
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      setBienvenueNotification(subscriptionNotificationsService.getBienvenueNotification())
      setInscriptionReussieNotification(subscriptionNotificationsService.getInscriptionReussieNotification())
    }

    window.addEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
    return () => window.removeEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
  }, [])

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Bloquer le scroll du body quand la notification est visible
      document.body.style.overflow = 'hidden'
      // Pas d'auto-close, l&apos;utilisateur doit cliquer pour fermer
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

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full
          transform transition-all duration-300 ease-out overflow-hidden
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
        `}
        style={isClient ? {
          borderColor: `${content.appIdentity.colors.primary}30`
        } : {
          borderColor: '#3B82F630'
        }}
      >
        {/* Fond noir à 50% */}
        <div className="absolute inset-0 bg-black/50 rounded-xl"></div>
        
        {/* Fond avec gradient réduit en transparence */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={isClient ? {
            background: `linear-gradient(to right, ${content.appIdentity.colors.primary}98, ${content.appIdentity.colors.secondary}98)`
          } : {
            background: 'linear-gradient(to right, #3B82F698, #2563eb98)'
          }}
        ></div>
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {hasPremiumTrial ? (
                  <GiftIcon className="w-6 h-6 text-white" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {hasPremiumTrial ? bienvenueNotification.title : inscriptionReussieNotification.title}
                </h3>
                <p className="text-green-100 text-sm">
                  {hasPremiumTrial ? bienvenueNotification.subtitle : inscriptionReussieNotification.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {hasPremiumTrial ? (
              <>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <GiftIcon 
                      className="w-5 h-5" 
                      style={isClient ? { color: content.appIdentity.colors.accent } : { color: '#F59E0B' }}
                    />
                    <span className="text-white font-semibold">{bienvenueNotification.sectionTitle}</span>
                  </div>
                  <p className="text-white/90 text-sm">
                    {bienvenueNotification.sectionDescription.replace('5 jours', `${trialDays} jours`)}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-white/90">
                  {bienvenueNotification.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon 
                        className="w-4 h-4" 
                        style={isClient ? { color: content.appIdentity.colors.accent } : { color: '#F59E0B' }}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-white/90 text-sm">
                {inscriptionReussieNotification.description}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <button
              onClick={handleClose}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {hasPremiumTrial ? bienvenueNotification.buttonText : inscriptionReussieNotification.buttonText}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
