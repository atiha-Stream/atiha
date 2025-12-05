'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'

interface DeviceModalProps {
  isOpen: boolean
  onClose: () => void
  deviceType: string // Le type d'appareil (Mobile, Tablette, Ordinateur, Casque virtuel, Télévision)
  modalContent?: string // Le contenu du modal
}

export default function DeviceModal({ isOpen, onClose, deviceType, modalContent }: DeviceModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())

  useEffect(() => {
    setIsClient(true)
    setHomepageContent(HomepageContentService.getContent())
  }, [])

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Empêcher le scroll du body quand le modal est ouvert
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-modal-title"
    >
      {/* Header avec bouton retour */}
      <div className="flex items-center px-4 sm:px-6 py-2 border-b border-gray-800 bg-dark-300 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Fermer le modal"
        >
          <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
      </div>

      {/* Content avec scroll */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        <div className="px-4 sm:px-8 py-4 sm:py-6 max-w-4xl mx-auto">
          {/* Titre */}
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={isClient ? { backgroundColor: homepageContent.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
            >
              <span className="text-white text-lg font-bold">
                {isClient ? homepageContent.appIdentity.name.charAt(0) : 'A'}
              </span>
            </div>
            <h2 
              id="device-modal-title"
              className="text-xl sm:text-2xl font-bold text-white"
            >
              {deviceType}
            </h2>
          </div>

          {/* Contenu du modal */}
          <div className="bg-dark-400/50 rounded-lg p-6 border border-gray-700">
            {modalContent ? (
              <div className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap">
                {modalContent}
              </div>
            ) : (
              <p className="text-gray-300 text-sm sm:text-base">
                Contenu à définir pour {deviceType}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

