/**
 * Service d'installation PWA manuelle
 * 
 * Ce service gère l'installation PWA avec les fonctionnalités suivantes :
 * - Détection automatique PWA au chargement de la page
 * - Demande manuelle de détection PWA à chaque clic sur le bouton d'installation
 * - Déclenchement du prompt d'installation si disponible
 * - Affichage d'instructions spécifiques selon le navigateur/plateforme si le prompt n'est pas disponible
 * 
 * À chaque clic sur "Télécharger" ou "Installer", le service renvoie une nouvelle demande
 * de détection PWA au navigateur pour forcer la réévaluation des critères d'installation.
 */

import { deviceDetectionService } from './device-detection-service'
import { HomepageContentService } from './homepage-content-service'
import { logger } from './logger'

export interface InstallResult {
  success: boolean
  method: 'prompt' | 'instructions' | 'redirect' | 'failed'
  message: string
  instructions?: string[]
}

class PWAInstallService {
  private deferredPrompt: any = null

  /**
   * Enregistre le prompt d'installation
   */
  public setDeferredPrompt(prompt: any): void {
    this.deferredPrompt = prompt
  }

  /**
   * Obtient le prompt d'installation s'il est disponible
   */
  public getDeferredPrompt(): any {
    return this.deferredPrompt
  }

  /**
   * Force le navigateur à réévaluer les critères PWA et à détecter l'application
   * Cette méthode est appelée à chaque clic sur le bouton d'installation
   * pour renvoyer une nouvelle demande de détection au navigateur
   */
  public async requestPWADetection(): Promise<boolean> {
    logger.debug('🔄 Demande de détection PWA au navigateur')
    
    try {
      // 1. Vérifier et recharger le Service Worker si nécessaire
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            // Forcer une mise à jour du service worker
            await registration.update()
            logger.info('✅ Service Worker mis à jour')
          } else {
            // Essayer de s'enregistrer si pas encore fait
            try {
              const reg = await navigator.serviceWorker.register('/sw.js')
              logger.info('✅ Service Worker enregistré', { registration: reg })
            } catch (swError) {
              logger.warn('⚠️ Erreur lors de l\'enregistrement du Service Worker', { error: swError })
            }
          }
        } catch (error) {
          logger.warn('⚠️ Erreur Service Worker', { error })
        }
      }

      // 2. Vérifier et recharger le manifest
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      if (manifestLink) {
        // Forcer un rechargement du manifest
        const manifestUrl = manifestLink.href
        manifestLink.href = ''
        setTimeout(() => {
          manifestLink.href = manifestUrl
          logger.debug('✅ Manifest rechargé')
        }, 100)
      }

      // 3. Vérifier les critères PWA
      const hasServiceWorker = 'serviceWorker' in navigator
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      const hasManifest = !!manifestLink
      
      logger.debug('📋 Critères PWA', {
        hasServiceWorker,
        isHTTPS,
        hasManifest,
        url: window.location.href
      })

      // 4. Essayer de déclencher un événement personnalisé pour forcer la réévaluation
      // Note: Le navigateur peut ne pas réagir, mais on essaie
      const customEvent = new CustomEvent('pwa-install-request', {
        bubbles: true,
        cancelable: true,
        detail: { timestamp: Date.now() }
      })
      window.dispatchEvent(customEvent)

      // 5. Attendre un peu pour que le navigateur traite la demande
      // Le navigateur peut déclencher beforeinstallprompt après notre demande
      await new Promise(resolve => setTimeout(resolve, 500))

      // 6. Vérifier si un nouveau prompt est disponible
      // Le navigateur peut déclencher beforeinstallprompt après notre demande
      return hasServiceWorker && isHTTPS && hasManifest
    } catch (error) {
      logger.error('❌ Erreur lors de la demande de détection PWA', error as Error)
      return false
    }
  }

  /**
   * Tente d'installer l'application avec plusieurs méthodes
   * À chaque appel, on renvoie une nouvelle demande de détection PWA
   */
  public async install(): Promise<InstallResult> {
    // ÉTAPE 1: Renvoyer une nouvelle demande de détection PWA au navigateur
    logger.debug('🔄 Nouvelle demande de détection PWA')
    await this.requestPWADetection()

    // ÉTAPE 2: Attendre un peu pour que le navigateur traite la demande
    // Le navigateur peut déclencher beforeinstallprompt après notre demande
    await new Promise(resolve => setTimeout(resolve, 300))

    // ÉTAPE 3: Vérifier à nouveau si un prompt est disponible
    // (il peut avoir été capturé entre-temps)
    const currentPrompt = this.deferredPrompt
    const deviceInfo = deviceDetectionService.getDeviceInfo()

    // ÉTAPE 4: Utiliser le prompt si disponible et valide
    if (currentPrompt && typeof currentPrompt.prompt === 'function') {
      try {
        logger.debug('✅ Prompt disponible, déclenchement')
        await currentPrompt.prompt()
        const { outcome } = await currentPrompt.userChoice
        
        if (outcome === 'accepted') {
          // Réinitialiser le prompt après utilisation
          this.deferredPrompt = null
          return {
            success: true,
            method: 'prompt',
            message: 'Installation lancée avec succès !'
          }
        } else {
          return {
            success: false,
            method: 'prompt',
            message: 'Installation annulée par l\'utilisateur'
          }
        }
      } catch (error) {
        logger.error('❌ Erreur avec le prompt', error as Error)
        // Réinitialiser le prompt en cas d'erreur
        this.deferredPrompt = null
        // Continuer avec les autres méthodes
      }
    } else {
      logger.debug('ℹ️ Aucun prompt disponible, affichage des instructions')
    }

    // ÉTAPE 5: Si pas de prompt, afficher les instructions spécifiques
    return this.getInstallInstructions(deviceInfo)
  }

  /**
   * Obtient les instructions d'installation selon l'appareil
   */
  private getInstallInstructions(deviceInfo: any): InstallResult {
    const instructions: string[] = []
    let method: 'instructions' | 'redirect' | 'failed' = 'instructions'

    // Détection améliorée du navigateur
    const ua = navigator.userAgent.toLowerCase()
    const isChrome = ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')
    const isEdge = ua.includes('edg/') || ua.includes('edgios/') || ua.includes('edga/')
    const isFirefox = ua.includes('firefox') || ua.includes('fxios')
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')
    const isOpera = ua.includes('opr/') || ua.includes('opera/')

    // Détection de la plateforme
    const isWindows = deviceInfo.platform === 'windows' || ua.includes('windows')
    const isMac = deviceInfo.platform === 'macos' || ua.includes('macintosh') || ua.includes('mac os x')
    const isLinux = deviceInfo.platform === 'linux' || ua.includes('linux')
    const isDesktop = isWindows || isMac || isLinux || deviceInfo.type === 'desktop'

    // Log pour déboguer
    logger.debug('🔍 Détection PWA', {
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      type: deviceInfo.type,
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      isDesktop,
      ua: navigator.userAgent
    })

    switch (deviceInfo.platform) {
      case 'ios':
        if (deviceInfo.browser === 'safari' || isSafari) {
          instructions.push(
            '1. Appuyez sur le bouton de partage 📤 en bas de l\'écran',
            '2. Faites défiler vers le bas et appuyez sur "Sur l\'écran d\'accueil"',
            '3. Appuyez sur "Ajouter" en haut à droite'
          )
          method = 'instructions'
        } else {
          instructions.push(
            '⚠️ Pour installer sur iOS, vous devez utiliser Safari',
            '1. Ouvrez cette page dans Safari',
            '2. Appuyez sur le bouton de partage 📤',
            '3. Sélectionnez "Sur l\'écran d\'accueil"'
          )
        }
        break

      case 'android':
        if (deviceInfo.browser === 'chrome' || isChrome) {
          instructions.push(
            '1. Appuyez sur le menu (⋮) en haut à droite de Chrome',
            '2. Recherchez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
            '3. Appuyez sur "Installer" dans la popup qui s\'affiche'
          )
          this.tryTriggerChromeInstall()
        } else if (deviceInfo.browser === 'edge' || isEdge) {
          instructions.push(
            '1. Appuyez sur le menu (⋮) en haut à droite d\'Edge',
            '2. Recherchez "Installer l\'application" ou "Applications"',
            '3. Appuyez sur "Installer" dans la popup'
          )
        } else if (deviceInfo.browser === 'samsung') {
          instructions.push(
            '1. Appuyez sur le menu (⋮) en haut à droite',
            '2. Sélectionnez "Ajouter à l\'écran d\'accueil"',
            '3. Confirmez l\'installation'
          )
        } else {
          instructions.push(
            '1. Ouvrez le menu de votre navigateur (⋮ ou ☰)',
            '2. Recherchez "Ajouter à l\'écran d\'accueil" ou "Installer l\'application"',
            '3. Suivez les instructions affichées'
          )
        }
        break

      case 'windows':
      case 'macos':
      case 'linux':
      default:
        // Instructions pour desktop
        if (isChrome || deviceInfo.browser === 'chrome') {
          instructions.push(
            '1. 📍 Regardez dans la barre d\'adresse (à droite de l\'URL)',
            '2. 🔍 Recherchez l\'icône d\'installation (icône de téléchargement ou "+" dans un carré)',
            '3. 👆 Cliquez sur cette icône',
            '4. ✅ Cliquez sur "Installer" dans la popup qui apparaît',
            '',
            '💡 Si vous ne voyez pas l\'icône :',
            '   • Attendez quelques secondes, elle peut apparaître après le chargement',
            '   • Vérifiez que vous êtes en HTTPS (cadenas vert dans la barre d\'adresse)',
            '   • Essayez de rafraîchir la page (F5 ou Ctrl+R)'
          )
          this.tryTriggerChromeInstall()
        } else if (isEdge || deviceInfo.browser === 'edge') {
          instructions.push(
            '1. 📍 Regardez dans la barre d\'adresse (à droite de l\'URL)',
            '2. 🔍 Recherchez l\'icône d\'installation (icône d\'application ou "+")',
            '3. 👆 Cliquez sur cette icône',
            '4. ✅ Cliquez sur "Installer" dans la popup',
            '',
            '💡 Alternative :',
            '   • Cliquez sur le menu (⋮) en haut à droite',
            '   • Sélectionnez "Applications" puis "Installer ce site en tant qu\'application"'
          )
        } else if (isFirefox || deviceInfo.browser === 'firefox') {
          instructions.push(
            '1. Cliquez sur le menu (☰) en haut à droite',
            '2. Sélectionnez "Installer le site en tant qu\'application"',
            '3. Confirmez l\'installation dans la popup'
          )
        } else if (isSafari || deviceInfo.browser === 'safari') {
          if (isMac) {
            instructions.push(
              '1. Cliquez sur "Fichier" dans la barre de menu en haut',
              '2. Sélectionnez "Ajouter à l\'écran d\'accueil"',
              '3. Confirmez l\'installation'
            )
          } else {
            instructions.push(
              '1. Cliquez sur le menu Safari (⚙️)',
              '2. Sélectionnez "Ajouter à l\'écran d\'accueil"',
              '3. Confirmez l\'installation'
            )
          }
        } else if (isOpera || deviceInfo.browser === 'opera') {
          instructions.push(
            '1. Cliquez sur le menu Opera (☰) en haut à gauche',
            '2. Recherchez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
            '3. Suivez les instructions affichées'
          )
        } else {
          // Instructions génériques mais plus détaillées
          instructions.push(
            '1. 🔍 Recherchez l\'icône d\'installation dans la barre d\'adresse de votre navigateur',
            '2. 👆 Cliquez sur cette icône (généralement à droite de l\'URL)',
            '3. ✅ Suivez les instructions affichées',
            '',
            '💡 Si vous ne trouvez pas l\'icône :',
            '   • Ouvrez le menu de votre navigateur (⋮, ☰, ou menu)',
            '   • Recherchez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
            '   • Vérifiez que vous êtes en HTTPS (cadenas vert)'
          )
        }
        break
    }

    return {
      success: false,
      method,
      message: 'Suivez ces instructions pour installer l\'application',
      instructions
    }
  }

  /**
   * Essaie de déclencher l'installation Chrome/Edge manuellement
   * Cette méthode est appelée pour les navigateurs Chromium
   */
  private tryTriggerChromeInstall(): void {
    try {
      // Vérifier si on peut accéder à l'API d'installation
      if ('serviceWorker' in navigator) {
        // Vérifier si le service worker est actif
        if (navigator.serviceWorker.controller) {
          logger.info('✅ Service Worker actif - Installation PWA possible')
        }
        
        // Essayer de forcer une réévaluation en créant un événement personnalisé
        // Note: Le navigateur peut ne pas réagir, mais on essaie
        const event = new CustomEvent('pwa-install-request', {
          bubbles: true,
          cancelable: true,
          detail: { source: 'chrome-trigger' }
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      logger.warn('⚠️ Impossible de déclencher le prompt automatiquement', { error })
    }
  }

  /**
   * Affiche un modal avec les instructions d'installation
   */
  public showInstallModal(instructions: string[]): void {
    // Créer un modal avec les instructions
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4'
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.75); padding: 1rem;'
    
    const deviceInfo = deviceDetectionService.getDeviceInfo()
    const content = HomepageContentService.getContent()
    const appName = content.appIdentity.name || 'Atiha'
    
    // Formater les instructions avec gestion des sauts de ligne
    const formattedInstructions = instructions.map(instruction => {
      // Si la ligne est vide, créer un saut de ligne
      if (instruction.trim() === '') {
        return '<div style="height: 0.5rem;"></div>'
      }
      // Si la ligne commence par un numéro, c'est une étape
      if (/^\d+\./.test(instruction.trim())) {
        return `<li style="margin-bottom: 0.75rem; padding-left: 0.5rem; line-height: 1.6; color: #d1d5db;">${instruction}</li>`
      }
      // Sinon, c'est une info ou astuce
      return `<div style="margin-bottom: 0.5rem; padding-left: 0.5rem; line-height: 1.6; color: #9ca3af; font-size: 0.9rem;">${instruction}</div>`
    }).join('')
    
    modal.innerHTML = `
      <div style="background-color: #1f2937; border-radius: 0.75rem; padding: 1.5rem; max-width: 32rem; width: 100%; border: 1px solid #374151; max-height: 90vh; overflow-y: auto;">
        <h2 style="font-size: 1.5rem; font-weight: bold; color: white; margin-bottom: 1rem;">
          Installation de ${appName}
        </h2>
        <div style="background-color: rgba(30, 64, 175, 0.3); border: 1px solid #1e3a8a; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="color: #bfdbfe; font-size: 0.875rem; line-height: 1.6; margin: 0;">
            <strong>💡 Astuce :</strong> Suivez ces instructions étape par étape pour installer l'application sur votre ${deviceInfo.type === 'mobile' ? 'téléphone' : deviceInfo.type === 'tablet' ? 'tablette' : deviceInfo.type === 'desktop' ? 'ordinateur' : 'appareil'}.
          </p>
        </div>
        <div style="color: #d1d5db; margin-bottom: 1.5rem;">
          <ol style="list-style-type: decimal; list-style-position: inside; margin: 0; padding: 0;">
            ${formattedInstructions}
          </ol>
        </div>
        <button id="close-modal" style="width: 100%; background-color: #2563eb; color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s; border: none; font-size: 1rem;" onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
          J'ai compris
        </button>
      </div>
    `
    
    document.body.appendChild(modal)
    
    const closeBtn = modal.querySelector('#close-modal')
    closeBtn?.addEventListener('click', () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal)
      }
    })
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal)
        }
      }
    })
  }

  /**
   * Vérifie si l'installation est possible
   */
  public canInstall(): boolean {
    const deviceInfo = deviceDetectionService.getDeviceInfo()
    
    // Toujours possible sur iOS (instructions manuelles)
    if (deviceInfo.isIOS) {
      return true
    }
    
    // Possible si beforeinstallprompt est disponible
    if (this.deferredPrompt) {
      return true
    }
    
    // Possible si Service Worker est supporté
    if ('serviceWorker' in navigator) {
      return true
    }
    
    return false
  }

  /**
   * Obtient un message d'aide selon l'appareil
   */
  public getHelpMessage(): string {
    const deviceInfo = deviceDetectionService.getDeviceInfo()
    return deviceDetectionService.getInstallInstructions()
  }
}

// Instance singleton
export const pwaInstallService = new PWAInstallService()

