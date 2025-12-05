'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowDownTrayIcon, 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  CheckCircleIcon,
  StarIcon,
  SignalSlashIcon,
  BellIcon,
  Cog6ToothIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import PWAInstaller from './PWAInstaller'
import { HomepageContentService } from '@/lib/homepage-content-service'

interface DownloadInfoProps {
  className?: string
}

export default function DownloadInfo({ className = '' }: DownloadInfoProps) {
  const [isClient, setIsClient] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  return (
    <div className={`bg-dark-200 rounded-xl p-6 border border-gray-700 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
          <ArrowDownTrayIcon className="w-6 h-6 mr-2 text-primary-400" />
          Téléchargez {isClient ? content.appIdentity.name : 'Atiha'}
        </h2>
        <p className="text-gray-300">
          Installez {isClient ? content.appIdentity.name : 'Atiha'} sur tous vos appareils pour une expérience optimale
        </p>
      </div>

      {/* Bouton d'installation PWA */}
      <div className="mb-6">
        <PWAInstaller />
      </div>

      {/* Appareils supportés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-dark-300 rounded-lg">
          <DevicePhoneMobileIcon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
          <h3 className="text-white font-semibold text-sm mb-1">Mobile</h3>
          <p className="text-gray-400 text-xs">iOS & Android</p>
        </div>
        <div className="text-center p-4 bg-dark-300 rounded-lg">
          <ComputerDesktopIcon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
          <h3 className="text-white font-semibold text-sm mb-1">Tablette</h3>
          <p className="text-gray-400 text-xs">iPad & Android</p>
        </div>
        <div className="text-center p-4 bg-dark-300 rounded-lg">
          <ComputerDesktopIcon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
          <h3 className="text-white font-semibold text-sm mb-1">Ordinateur</h3>
          <p className="text-gray-400 text-xs">Tous navigateurs</p>
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <SignalSlashIcon className="w-4 h-4 text-green-400" />
          <span>Mode hors ligne</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <BellIcon className="w-4 h-4 text-yellow-400" />
          <span>Notifications</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <Cog6ToothIcon className="w-4 h-4 text-blue-400" />
          <span>Performance</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <StarIcon className="w-4 h-4 text-purple-400" />
          <span>Accès rapide</span>
        </div>
      </div>

      {/* Lien vers la page complète */}
      <div className="text-center">
        <Link 
          href="/download" 
          className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors text-sm"
        >
          <PlayIcon className="w-4 h-4" />
          <span>Guide d&apos;installation complet</span>
        </Link>
      </div>
    </div>
  )
}
