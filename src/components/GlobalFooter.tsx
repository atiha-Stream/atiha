'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlayIcon, 
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import DeviceModal from './DeviceModal'

interface GlobalFooterProps {
  className?: string
}

export default function GlobalFooter({ className = '' }: GlobalFooterProps) {
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false)
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('')
  const [selectedModalContent, setSelectedModalContent] = useState<string>('')

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Écouter les changements de contenu
    const handleStorageChange = () => {
      const updatedContent = HomepageContentService.getContent()
      setContent(updatedContent)
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Écouter aussi les événements personnalisés pour les changements dans la même fenêtre
    window.addEventListener('homepageContentUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('homepageContentUpdated', handleStorageChange)
    }
  }, [])

  const handleDeviceClick = (deviceType: string, deviceKey: 'title' | 'vrHeadset' | 'tv' | 'vrHeadset2' | 'tv2') => {
    setSelectedDeviceType(deviceType)
    const modalContent = content.footer.availableOn[deviceKey]?.modalContent || ''
    setSelectedModalContent(modalContent)
    setIsDeviceModalOpen(true)
  }

  // Ne pas afficher le footer si il est désactivé
  if (isClient && !content.footer.isVisible) {
    return null
  }

  return (
    <footer className={`bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 border-t border-gray-700 ${className}`}>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo et description */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                >
                  <PlayIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
              </Link>
              <p className="text-gray-400 text-sm">
                {isClient ? content.appIdentity.footer.text : 'Votre plateforme de streaming préférée pour films et séries. Disponible sur tous vos appareils.'}
              </p>
            </div>

            {/* Liens rapides */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">{isClient ? content.footer.quickLinksTitle : 'Liens rapides'}</h3>
              <div className="space-y-2">
                {isClient && content.footer.quickLinks.downloadApp.isVisible && (
                  <Link 
                    href={content.footer.quickLinks.downloadApp.url} 
                    className="block text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>{content.footer.quickLinks.downloadApp.text}</span>
                  </Link>
                )}
                {isClient && content.footer.quickLinks.login.isVisible && (
                  <Link 
                    href={content.footer.quickLinks.login.url} 
                    className="block text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>{content.footer.quickLinks.login.text}</span>
                  </Link>
                )}
                {isClient && content.footer.quickLinks.register.isVisible && (
                  <Link 
                    href={content.footer.quickLinks.register.url} 
                    className="block text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>{content.footer.quickLinks.register.text}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Appareils supportés */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">{isClient ? content.footer.availableOnTitle : 'Disponible sur'}</h3>
              <div className="space-y-3">
                {isClient && content.footer.availableOn.title.isVisible && (
                    <span 
                      className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer block"
                      onClick={() => handleDeviceClick(content.footer.availableOn.title.text, 'title')}
                    >
                      {content.footer.availableOn.title.text}
                    </span>
                )}
                {isClient && content.footer.availableOn.vrHeadset.isVisible && (
                    <span 
                      className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer block"
                      onClick={() => handleDeviceClick(content.footer.availableOn.vrHeadset.text, 'vrHeadset')}
                    >
                      {content.footer.availableOn.vrHeadset.text}
                    </span>
                )}
                {isClient && content.footer.availableOn.tv.isVisible && (
                    <span 
                      className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer block"
                      onClick={() => handleDeviceClick(content.footer.availableOn.tv.text, 'tv')}
                    >
                      {content.footer.availableOn.tv.text}
                    </span>
                )}
                {isClient && content.footer.availableOn.vrHeadset2.isVisible && (
                    <span 
                      className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer block"
                      onClick={() => handleDeviceClick(content.footer.availableOn.vrHeadset2.text, 'vrHeadset2')}
                    >
                      {content.footer.availableOn.vrHeadset2.text}
                    </span>
                )}
                {isClient && content.footer.availableOn.tv2.isVisible && (
                    <span 
                      className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer block"
                      onClick={() => handleDeviceClick(content.footer.availableOn.tv2.text, 'tv2')}
                    >
                      {content.footer.availableOn.tv2.text}
                    </span>
                )}
              </div>
            </div>
          </div>

          {/* Ligne de séparation */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center justify-center">
                <p className="text-gray-400 text-sm">
                  {isClient ? content.appIdentity.footer.copyright : '© 2025 Atiha. Tous droits réservés.'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 w-full">
                {isClient && Object.entries(content.appIdentity.socialLinks)
                  .filter(([_, linkData]) => linkData.isVisible)
                  .map(([platform, linkData]) => (
                    <a
                      key={platform}
                      href={linkData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center space-x-2 sm:space-x-3 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 text-white rounded-lg sm:rounded-xl border-2 shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                      style={{ 
                        background: `linear-gradient(to right, ${content.appIdentity.colors.primary}, ${content.appIdentity.colors.secondary})`,
                        borderColor: content.appIdentity.colors.primary,
                        boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${content.appIdentity.colors.primary}30`
                      }}
                    >
                      <div className="relative">
                        <span className="text-xl sm:text-2xl">
                          {platform === 'telegram' && '📱'}
                          {platform === 'discord' && '💬'}
                          {platform === 'twitter' && '🐦'}
                          {platform === 'instagram' && '📸'}
                          {platform === 'youtube' && '📺'}
                        </span>
                        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></div>
                      </div>
                      <div className="text-left hidden sm:block">
                        <div className="text-xs sm:text-sm font-medium">{linkData.description}</div>
                        <div className="text-sm sm:text-base lg:text-lg font-bold">{linkData.text}</div>
                      </div>
                      <div className="text-left sm:hidden">
                        <div className="text-xs font-bold">{linkData.text}</div>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour les appareils */}
      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        deviceType={selectedDeviceType}
        modalContent={selectedModalContent}
      />
    </footer>
  )
}
