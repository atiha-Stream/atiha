'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  StarIcon,
  PlayIcon,
  SignalSlashIcon,
  BellIcon,
  Cog6ToothIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { useAuth } from '@/lib/auth-context'
import { pwaInstallService } from '@/lib/pwa-install-service'
import { deviceDetectionService } from '@/lib/device-detection-service'
import { logger } from '@/lib/logger'

export default function DownloadPage() {
  const [isClient, setIsClient] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)

    // Détecter si l'app est déjà installée (mode standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) {
      setIsInstalled(true)
    }

    // Écouter l'événement beforeinstallprompt pour capturer le prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const prompt = e as any
      logger.info('beforeinstallprompt capturé', { prompt })
      setDeferredPrompt(prompt)
      // Enregistrer le prompt dans le service
      pwaInstallService.setDeferredPrompt(prompt)
    }

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      logger.info('Application installée')
      setIsInstalled(true)
      setDeferredPrompt(null)
      pwaInstallService.setDeferredPrompt(null)
    }

    // Enregistrer les listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { passive: false })
    window.addEventListener('appinstalled', handleAppInstalled)

    // Détection automatique améliorée : demander une détection PWA au chargement
    // (certains navigateurs peuvent déclencher beforeinstallprompt tardivement)
    const initDetection = async () => {
      if (!standalone && 'serviceWorker' in navigator) {
        logger.debug('Détection automatique PWA au chargement...')
        await pwaInstallService.requestPWADetection()
      }
    }
    
    // Attendre un peu avant de lancer la détection automatique
    const timeout = setTimeout(initDetection, 1000)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Gère le clic sur le bouton d'installation
   * À chaque clic, on renvoie une nouvelle demande de détection PWA au navigateur
   */
  const handleInstallClick = async () => {
    // Vérifier si déjà installé
    if (isInstalled || isStandalone) {
      alert(`${isClient ? content.appIdentity.name : 'Atiha'} est déjà installée sur votre appareil !`)
      return
    }

    setIsInstalling(true)
    
    try {
      // Le service gère toute la logique :
      // 1. Renvoie une nouvelle demande de détection PWA au navigateur
      // 2. Attend la réponse du navigateur
      // 3. Déclenche le prompt si disponible
      // 4. Affiche les instructions si nécessaire
      const result = await pwaInstallService.install()
      
      if (result.success) {
        // Installation réussie via prompt
        alert(`${isClient ? content.appIdentity.name : 'Atiha'} a été installée avec succès !`)
        setIsInstalled(true)
        setDeferredPrompt(null)
        pwaInstallService.setDeferredPrompt(null)
      } else if (result.instructions && result.instructions.length > 0) {
        // Afficher les instructions dans un modal
        pwaInstallService.showInstallModal(result.instructions)
      } else {
        // Message d'aide générique
        const helpMessage = pwaInstallService.getHelpMessage()
        alert(helpMessage)
      }
    } catch (error) {
      logger.error('Erreur lors de l\'installation', error as Error)
      
      // En cas d'erreur, afficher les instructions
      const deviceInfo = deviceDetectionService.getDeviceInfo()
      const instructions = deviceDetectionService.getInstallInstructions()
      
      // Créer un modal avec les instructions
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4'
      modal.innerHTML = `
        <div class="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
          <h2 class="text-2xl font-bold text-white mb-4">Installation de ${isClient ? content.appIdentity.name : 'Atiha'}</h2>
          <p class="text-gray-300 mb-4">${instructions}</p>
          <div class="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
            <p class="text-blue-200 text-sm">
              <strong>💡 Astuce :</strong> Si l'installation ne fonctionne pas automatiquement, suivez les instructions ci-dessus selon votre navigateur.
            </p>
          </div>
          <button id="close-install-modal" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            J'ai compris
          </button>
        </div>
      `
      
      document.body.appendChild(modal)
      
      const closeBtn = modal.querySelector('#close-install-modal')
      closeBtn?.addEventListener('click', () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal)
        }
        setIsInstalling(false)
      })
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal)
          }
          setIsInstalling(false)
        }
      })
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isAuthenticated && (
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Retour</span>
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
          {!isAuthenticated && (
            <Link href="/" className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
            </Link>
          )}
            {isAuthenticated && (
              <Link 
                href="/dashboard" 
                className="text-white px-4 py-2 rounded-lg transition-colors"
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
                Mon compte
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
              {content.download?.hero?.title || 'Téléchargez'} <span 
                style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
              >{isClient ? content.appIdentity.name : 'Atiha'}</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {(content.download?.hero?.description || 'Créer un compte et installez sur tous vos appareils pour une expérience de streaming unique, avec téléchargement hors ligne et notifications push.').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Mobile */}
            <div 
              className="bg-dark-200 rounded-xl p-8 text-center border border-gray-700 transition-all duration-300 hover:scale-105"
              style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
              onMouseEnter={(e) => {
                if (isClient) {
                  e.currentTarget.style.borderColor = content.appIdentity.colors.primary
                }
              }}
              onMouseLeave={(e) => {
                if (isClient) {
                  e.currentTarget.style.borderColor = '#374151'
                }
              }}
            >
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                style={isClient ? { 
                  background: `linear-gradient(to bottom right, ${content.appIdentity.colors.primary}, ${content.appIdentity.colors.secondary})`
                } : { 
                  background: 'linear-gradient(to bottom right, #3B82F6, #2563eb)'
                }}
              >
                <DevicePhoneMobileIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">{content.download?.devices?.mobile?.title || 'Mobile'}</h3>
              <p className="text-gray-400 mb-6">
                {(content.download?.devices?.mobile?.description || 'Installez sur votre smartphone pour regarder vos films et séries préférés partout, même sans connexion internet.').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span>iOS & Android</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <SignalSlashIcon className="w-4 h-4 text-blue-400" />
                  <span>Téléchargement hors ligne</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <BellIcon className="w-4 h-4 text-yellow-400" />
                  <span>Notifications push</span>
                </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                      <StarIcon className="w-4 h-4 text-purple-400" />
                      <span>Contenu premium</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-white font-semibold mb-3 block">{content.download?.devices?.mobile?.subtitle || 'Gratuit'}</span>
                    <button
                      onClick={handleInstallClick}
                      disabled={isInstalled || isInstalling}
                      className="w-full text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      style={isClient ? { 
                        backgroundColor: isInstalled ? '#10b981' : content.appIdentity.colors.primary,
                        '--hover-color': content.appIdentity.colors.secondary
                      } as React.CSSProperties : { backgroundColor: isInstalled ? '#10b981' : '#3B82F6' }}
                      onMouseEnter={(e) => {
                        if (isClient && !isInstalled && !isInstalling) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient && !isInstalled && !isInstalling) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                        }
                      }}
                    >
                      {isInstalling ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Installation...</span>
                        </>
                      ) : isInstalled ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Installé</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          <span>{content.download?.devices?.mobile?.buttonText || 'Installer'}</span>
                        </>
                      )}
                    </button>
                  </div>
            </div>

            {/* Tablette */}
            <div 
              className="bg-dark-200 rounded-xl p-8 text-center border border-gray-700 transition-all duration-300 hover:scale-105"
              style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
              onMouseEnter={(e) => {
                if (isClient) {
                  e.currentTarget.style.borderColor = content.appIdentity.colors.primary
                }
              }}
              onMouseLeave={(e) => {
                if (isClient) {
                  e.currentTarget.style.borderColor = '#374151'
                }
              }}
            >
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                style={isClient ? { 
                  background: `linear-gradient(to bottom right, ${content.appIdentity.colors.primary}, ${content.appIdentity.colors.secondary})`
                } : { 
                  background: 'linear-gradient(to bottom right, #3B82F6, #2563eb)'
                }}
              >
                <ComputerDesktopIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">{content.download?.devices?.tablet?.title || 'Tablette'}</h3>
              <p className="text-gray-400 mb-6">
                {(content.download?.devices?.tablet?.description || 'Profitez d\'un écran plus grand avec la même qualité de streaming et toutes les fonctionnalités premium sur votre tablette.').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span>iPad & Android</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <PlayIcon className="w-4 h-4 text-red-400" />
                  <span>Qualité HD/4K</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <Cog6ToothIcon className="w-4 h-4 text-blue-400" />
                  <span>Performance optimisée</span>
                </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                      <SignalSlashIcon className="w-4 h-4 text-green-400" />
                      <span>Mode hors ligne</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-white font-semibold mb-3 block">{content.download?.devices?.tablet?.subtitle || 'Gratuit'}</span>
                    <button
                      onClick={handleInstallClick}
                      disabled={isInstalled || isInstalling}
                      className="w-full text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      style={isClient ? { 
                        backgroundColor: isInstalled ? '#10b981' : content.appIdentity.colors.primary,
                        '--hover-color': content.appIdentity.colors.secondary
                      } as React.CSSProperties : { backgroundColor: isInstalled ? '#10b981' : '#3B82F6' }}
                      onMouseEnter={(e) => {
                        if (isClient && !isInstalled && !isInstalling) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient && !isInstalled && !isInstalling) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                        }
                      }}
                    >
                      {isInstalling ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Installation...</span>
                        </>
                      ) : isInstalled ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Installé</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          <span>{content.download?.devices?.tablet?.buttonText || 'Installer'}</span>
                        </>
                      )}
                    </button>
                  </div>
            </div>

            {/* Ordinateur */}
            <div 
              className="bg-dark-200 rounded-xl p-8 text-center border border-gray-700 transition-all duration-300 hover:scale-105"
              style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
              onMouseEnter={(e) => {
                if (isClient) {
                  e.currentTarget.style.borderColor = content.appIdentity.colors.primary
                }
              }}
              onMouseLeave={(e) => {
                if (isClient) {
                  e.currentTarget.style.borderColor = '#374151'
                }
              }}
            >
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                style={isClient ? { 
                  background: `linear-gradient(to bottom right, ${content.appIdentity.colors.primary}, ${content.appIdentity.colors.secondary})`
                } : { 
                  background: 'linear-gradient(to bottom right, #3B82F6, #2563eb)'
                }}
              >
                <ComputerDesktopIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">{content.download?.devices?.desktop?.title || 'Ordinateur'}</h3>
              <p className="text-gray-400 mb-6">
                {(content.download?.devices?.desktop?.description || 'Utilisez directement dans votre navigateur ou installez-la comme une application native sur votre ordinateur.').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span>Windows, Mac, Linux</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <ComputerDesktopIcon className="w-4 h-4 text-blue-400" />
                  <span>Tous navigateurs</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <Cog6ToothIcon className="w-4 h-4 text-purple-400" />
                  <span>Raccourcis clavier</span>
                </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                      <StarIcon className="w-4 h-4 text-yellow-400" />
                      <span>Interface complète</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-white font-semibold mb-3 block">{content.download?.devices?.desktop?.subtitle || 'Gratuit'}</span>
                    <button
                      onClick={handleInstallClick}
                      disabled={isInstalled || isInstalling}
                      className="w-full text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      style={isClient ? { 
                        backgroundColor: isInstalled ? '#10b981' : content.appIdentity.colors.primary,
                        '--hover-color': content.appIdentity.colors.secondary
                      } as React.CSSProperties : { backgroundColor: isInstalled ? '#10b981' : '#3B82F6' }}
                      onMouseEnter={(e) => {
                        if (isClient && !isInstalled && !isInstalling) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient && !isInstalled && !isInstalling) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                        }
                      }}
                    >
                      {isInstalling ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Installation...</span>
                        </>
                      ) : isInstalled ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Installé</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          <span>{content.download?.devices?.desktop?.buttonText || 'Installer'}</span>
                        </>
                      )}
                    </button>
                  </div>
            </div>
          </div>


          {/* Fonctionnalités PWA */}
          {content.download?.features?.isVisible !== false && (
            <div className="bg-dark-200 rounded-xl p-8 border border-gray-700">
              <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
                  {content.download?.features?.title || 'Fonctionnalités de'} {isClient ? content.appIdentity.name : 'Atiha'}
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-300">
                  {(content.download?.features?.description || 'Découvrez tous les avantages d\'utiliser comme application native').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-dark-300 rounded-lg">
                  <SignalSlashIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    {content.download?.features?.items?.[0]?.title || 'Mode hors ligne'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {(content.download?.features?.items?.[0]?.description || 'Téléchargez vos contenus préférés pour les regarder sans internet').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
                  </p>
                </div>

                <div className="text-center p-6 bg-dark-300 rounded-lg">
                  <BellIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    {content.download?.features?.items?.[1]?.title || 'Notifications'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {(content.download?.features?.items?.[1]?.description || 'Recevez des alertes pour les nouveaux épisodes et films').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
                  </p>
                </div>

                <div className="text-center p-6 bg-dark-300 rounded-lg">
                  <Cog6ToothIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    {content.download?.features?.items?.[2]?.title || 'Performance'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {(content.download?.features?.items?.[2]?.description || 'Chargement rapide et interface fluide comme une app native').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
                  </p>
                </div>

                <div className="text-center p-6 bg-dark-300 rounded-lg">
                  <StarIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    {content.download?.features?.items?.[3]?.title || 'Accès rapide'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {(content.download?.features?.items?.[3]?.description || 'Lancez directement depuis votre écran d\'accueil').replace(/Atiha/g, isClient ? content.appIdentity.name : 'Atiha')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
