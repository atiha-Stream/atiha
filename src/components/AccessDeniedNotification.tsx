'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface AccessDeniedNotificationProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function AccessDeniedNotification({ 
  message, 
  isVisible, 
  onClose, 
  duration = 5000 
}: AccessDeniedNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // Attendre la fin de l'animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-lg p-4 shadow-lg max-w-md transform transition-all duration-300 ${
          isAnimating 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-red-200 mb-1">
              Accès refusé
            </h4>
            <p className="text-sm text-red-300">
              {message}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Barre de progression */}
        <div className="mt-3 w-full bg-red-800/50 rounded-full h-1">
          <div 
            className="bg-red-400 h-1 rounded-full transition-all duration-100 ease-linear"
            style={{
              width: isAnimating ? '100%' : '0%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  )
}
