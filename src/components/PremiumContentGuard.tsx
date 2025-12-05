'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { premiumCodesService, UserPremiumStatus } from '@/lib/premium-codes-service'
import Link from 'next/link'
import { StarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface PremiumContentGuardProps {
  children: React.ReactNode
  contentTitle?: string
  contentType?: 'movie' | 'series'
  className?: string
  isPremium?: boolean
}

export default function PremiumContentGuard({ 
  children, 
  contentTitle = 'ce contenu',
  contentType = 'movie',
  className = '',
  isPremium = false
}: PremiumContentGuardProps) {
  const { user } = useAuth()
  const [premiumStatus, setPremiumStatus] = useState<UserPremiumStatus>({ isPremium: false })
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (user?.id) {
      const status = premiumCodesService.getUserPremiumStatus(user.id)
      setPremiumStatus(status)
    }
  }, [user?.id])

  // Si le contenu n&apos;est pas premium, afficher normalement
  if (!isPremium) {
    return <div className={className}>{children}</div>
  }

  // Si l&apos;utilisateur est premium, afficher le contenu normalement
  if (premiumStatus.isPremium) {
    return <div className={className}>{children}</div>
  }

  // Si l&apos;utilisateur n&apos;est pas premium, afficher le contenu normalement avec indicateurs premium
  return (
    <div className={`relative ${className}`}>
      {/* Contenu original (toujours visible) */}
      <div className="relative">
        {children}
        
        {/* Badge Premium en haut à droite */}
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
            <StarIcon className="w-3 h-3" />
            <span>PREMIUM</span>
          </div>
        </div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 rounded-lg shadow-xl border border-purple-400 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1">Contenu Premium</h4>
              <p className="text-purple-100 text-sm mb-3">
                Pour suivre {contentTitle}, activez votre code premium dans vos paramètres.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowNotification(false)}
              >
                <StarIcon className="w-4 h-4" />
                <span>Activer Premium</span>
              </Link>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
