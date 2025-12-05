'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'

interface DownloadSettingsProps {
  className?: string
}

export default function DownloadSettings({ className = '' }: DownloadSettingsProps) {
  const [isClient, setIsClient] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Vérifier si l'app est installée
    if (typeof window !== 'undefined') {
      const checkInstallation = () => {
        // Vérifier si l'app est installée via PWA
        const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true
        
        setIsInstalled(isPWAInstalled)
      }
      
      checkInstallation()
      
      // Écouter les changements de mode d'affichage
      const mediaQuery = window.matchMedia('(display-mode: standalone)')
      mediaQuery.addEventListener('change', checkInstallation)
      
      return () => {
        mediaQuery.removeEventListener('change', checkInstallation)
      }
    }
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statut d'installation */}
      {isInstalled ? (
        <div 
          className="rounded-lg p-4"
          style={isClient ? {
            backgroundColor: `${content.appIdentity.colors.primary}20`,
            borderColor: content.appIdentity.colors.primary,
            borderWidth: '1px'
          } : {
            backgroundColor: '#3B82F620',
            borderColor: '#3B82F6',
            borderWidth: '1px'
          }}
        >
          <div className="flex items-center space-x-3">
            <CheckCircleIcon 
              className="w-6 h-6" 
              style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
            />
            <div>
              <h3 
                className="font-semibold"
                style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
              >
                {isClient ? content.appIdentity.name : 'Atiha'} est installée
              </h3>
              <p className="text-gray-300 text-sm">
                Vous utilisez la version installée de {isClient ? content.appIdentity.name : 'Atiha'}. Profitez de toutes les fonctionnalités PWA !
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="rounded-lg p-4"
          style={isClient ? {
            backgroundColor: `${content.appIdentity.colors.primary}20`,
            borderColor: content.appIdentity.colors.primary,
            borderWidth: '1px'
          } : {
            backgroundColor: '#3B82F620',
            borderColor: '#3B82F6',
            borderWidth: '1px'
          }}
        >
          <div className="flex items-center space-x-3">
            <InformationCircleIcon 
              className="w-6 h-6" 
              style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
            />
            <div>
              <h3 
                className="font-semibold"
                style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
              >
                {isClient ? content.appIdentity.name : 'Atiha'} n&apos;est pas installée
              </h3>
              <p className="text-gray-300 text-sm">
                Installez {isClient ? content.appIdentity.name : 'Atiha'} pour accéder aux fonctionnalités hors ligne et aux notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de téléchargement */}
      <div className="flex justify-end">
        <Link
          href="/download"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          style={isClient ? { 
            backgroundColor: content.appIdentity.colors.primary,
            '--hover-color': content.appIdentity.colors.secondary
          } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
          onMouseEnter={(e) => {
            if (isClient) {
              e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
            }
          }}
          onMouseLeave={(e) => {
            if (isClient) {
              e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
            }
          }}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Télécharger l&apos;application ici</span>
        </Link>
      </div>
    </div>
  )
}
