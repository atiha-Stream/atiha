'use client'

import React, { useState, useEffect } from 'react'
import { 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  TvIcon,
  ViewfinderCircleIcon
} from '@heroicons/react/24/outline'
import { deviceDetectionService, DeviceInfo } from '@/lib/device-detection-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { logger } from '@/lib/logger'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  useEffect(() => {
    // Ne pas afficher le PWAInstaller sur la page /download
    if (typeof window !== 'undefined' && window.location.pathname === '/download') {
      setIsInstalled(true) // Forcer à ne pas afficher
      return
    }

    // Obtenir les informations de l'appareil avec le service amélioré
    // Réinitialiser le cache pour forcer une nouvelle détection
    deviceDetectionService.reset()
    const info = deviceDetectionService.getDeviceInfo()
    setDeviceInfo(info)

    // Vérifier si l'app est déjà installée
    if (info.isStandalone || info.isPWA) {
      setIsInstalled(true)
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Afficher le prompt d'installation après un délai
      // Plus long pour TV/VR pour laisser le temps à l'utilisateur
      const delay = (info.type === 'tv' || info.type === 'vr') ? 5000 : 3000
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, delay)
    }

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      // Réinitialiser la détection pour mettre à jour les infos
      deviceDetectionService.reset()
      setDeviceInfo(deviceDetectionService.getDeviceInfo())
    }

    // Écouter les changements d'orientation pour mettre à jour les infos
    const handleOrientationChange = () => {
      deviceDetectionService.reset()
      const updatedInfo = deviceDetectionService.getDeviceInfo()
      setDeviceInfo(updatedInfo)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Afficher les instructions spécifiques à l'appareil
      const instructions = deviceInfo 
        ? deviceDetectionService.getInstallInstructions()
        : 'Veuillez utiliser le menu de votre navigateur pour installer l\'application'
      
      alert(instructions)
      return
    }

    // Vérifier que la méthode prompt existe avant de l'appeler
    if (typeof deferredPrompt.prompt !== 'function') {
      logger.warn('⚠️ deferredPrompt.prompt n\'est pas une fonction')
      const instructions = deviceInfo 
        ? deviceDetectionService.getInstallInstructions()
        : 'Veuillez utiliser le menu de votre navigateur pour installer l\'application'
      alert(instructions)
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        logger.info('PWA installée avec succès')
      } else {
        logger.info('Installation PWA refusée')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      logger.error('Erreur lors de l\'installation', error as Error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Ne plus afficher pendant cette session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Ne pas afficher sur la page /download
  if (typeof window !== 'undefined' && window.location.pathname === '/download') {
    return null
  }

  // Ne pas afficher si déjà installée
  if (isInstalled || !showInstallPrompt || !deviceInfo) {
    return null
  }

  // Vérifier si l'utilisateur a déjà refusé dans cette session
  if (sessionStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  // Obtenir l'icône selon le type d'appareil
  const getDeviceIcon = () => {
    switch (deviceInfo.type) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="w-8 h-8 text-white" />
      case 'tablet':
        return <DevicePhoneMobileIcon className="w-8 h-8 text-white" />
      case 'tv':
        return <TvIcon className="w-8 h-8 text-white" />
      case 'vr':
        return <ViewfinderCircleIcon className="w-8 h-8 text-white" />
      default:
        return <ComputerDesktopIcon className="w-8 h-8 text-white" />
    }
  }

  // Obtenir le message selon le type d'appareil
  const getInstallMessage = () => {
    const appName = isClient ? content.appIdentity.name : 'Atiha'
    switch (deviceInfo.type) {
      case 'tv':
        return `Installez ${appName} sur votre TV pour une expérience cinéma optimale`
      case 'vr':
        return `Installez ${appName} en mode VR pour une immersion totale`
      case 'mobile':
      case 'tablet':
        return `Ajoutez ${appName} à votre écran d'accueil pour une expérience optimale`
      default:
        return `Installez ${appName} sur votre appareil pour un accès rapide`
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-2xl border border-blue-500/30 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getDeviceIcon()}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Installer {isClient ? content.appIdentity.name : 'Atiha'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {getInstallMessage()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-blue-600 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Installer</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-blue-100 hover:text-white transition-colors"
            >
              Plus tard
            </button>
          </div>

          <div className="mt-3 p-3 bg-blue-500/20 rounded-lg">
            <p className="text-blue-100 text-xs">
              <strong>Instructions :</strong> {deviceDetectionService.getInstallInstructions()}
            </p>
            {deviceInfo.type === 'vr' && (
              <p className="text-blue-100 text-xs mt-1">
                💡 Mode VR : Utilisez les contrôles VR pour naviguer dans l&apos;application
              </p>
            )}
            {deviceInfo.type === 'tv' && (
              <p className="text-blue-100 text-xs mt-1">
                📺 Mode TV : Utilisez votre télécommande pour naviguer
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook amélioré pour utiliser les fonctionnalités PWA
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)

  useEffect(() => {
    // Obtenir les informations de l'appareil
    const info = deviceDetectionService.getDeviceInfo()
    setDeviceInfo(info)

    // Détecter la connectivité
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Écouter les changements d'orientation
    const handleOrientationChange = () => {
      deviceDetectionService.reset()
      setDeviceInfo(deviceDetectionService.getDeviceInfo())
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  return {
    isOnline,
    isInstalled: deviceInfo?.isPWA || false,
    isPWA: deviceInfo?.isPWA || false,
    deviceInfo,
    deviceType: deviceInfo?.type || 'unknown',
    platform: deviceInfo?.platform || 'unknown',
    browser: deviceInfo?.browser || 'unknown',
    canInstall: deviceInfo?.canInstall || false,
    supportsVR: deviceInfo?.supportsVR || false,
    supportsTV: deviceInfo?.supportsTV || false,
    isIOS: deviceInfo?.isIOS || false,
    isAndroid: deviceInfo?.isAndroid || false,
    isMobile: deviceInfo?.isMobile || false,
    isTablet: deviceInfo?.isTablet || false,
    isDesktop: deviceInfo?.isDesktop || false
  }
}
