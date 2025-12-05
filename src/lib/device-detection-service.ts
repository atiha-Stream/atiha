/**
 * Service de détection avancée des appareils pour PWA
 * Utilise plusieurs méthodes de détection pour une meilleure fiabilité
 * Supporte : Mobile, Tablette, Desktop, TV, VR
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'vr' | 'unknown'
export type PlatformType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'tvos' | 'androidtv' | 'webos' | 'tizen' | 'vr' | 'unknown'
export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'unknown'

export interface DeviceInfo {
  type: DeviceType
  platform: PlatformType
  browser: BrowserType
  isPWA: boolean
  isStandalone: boolean
  canInstall: boolean
  supportsVR: boolean
  supportsTV: boolean
  userAgent: string
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  isTouchDevice: boolean
  isRetina: boolean
  orientation: 'portrait' | 'landscape'
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

class DeviceDetectionService {
  private deviceInfo: DeviceInfo | null = null
  private detectionCache: Map<string, any> = new Map()

  /**
   * Détecte le type d'appareil avec plusieurs méthodes
   */
  private detectDeviceType(): DeviceType {
    if (typeof window === 'undefined') return 'unknown'

    const ua = navigator.userAgent.toLowerCase()
    const width = window.screen.width || window.innerWidth
    const height = window.screen.height || window.innerHeight
    const maxDimension = Math.max(width, height)
    const minDimension = Math.min(width, height)
    const aspectRatio = maxDimension / minDimension

    // Vérifier d'abord si c'est un desktop classique (Windows, Mac, Linux)
    const isDesktopOS = /windows|macintosh|mac os x|linux/i.test(ua) && 
                       !/android|iphone|ipad|ipod|mobile/i.test(ua)

    // Méthode 1: Détection VR (prioritaire) - MAIS exclure les desktop
    if (!isDesktopOS && this.isVRDevice()) {
      return 'vr'
    }

    // Méthode 2: Détection TV (prioritaire) - MAIS exclure les desktop
    if (!isDesktopOS && this.isTVDevice()) {
      return 'tv'
    }

    // Méthode 3: Détection par User-Agent
    const uaMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini|windows phone/i.test(ua)
    const uaTablet = /ipad|android(?!.*mobile)|tablet|playbook|silk|kindle/i.test(ua)

    // Méthode 4: Détection par taille d'écran et ratio
    // Tablette: généralement entre 600-1024px de largeur
    const isTabletBySize = (width >= 600 && width < 1024) || 
                          (width >= 768 && width <= 1024) ||
                          (minDimension >= 600 && maxDimension <= 1024)

    // Mobile: généralement moins de 600px de largeur
    const isMobileBySize = width < 600 || minDimension < 600

    // Méthode 5: Détection par touch points
    const hasTouchScreen = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 ||
                          (navigator as any).msMaxTouchPoints > 0

    // Méthode 6: Détection iOS spécifique
    const isIOSDevice = /iphone|ipad|ipod/i.test(ua) || 
                       ((navigator as any).standalone === true) ||
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    // Logique de décision combinée
    if (uaTablet || (isTabletBySize && hasTouchScreen && !uaMobile)) {
      return 'tablet'
    }

    if (uaMobile || isMobileBySize || isIOSDevice) {
      // Vérifier si c'est vraiment une tablette (iPad en mode mobile Safari)
      if (isIOSDevice && (width >= 768 || maxDimension >= 768)) {
        return 'tablet'
      }
      return 'mobile'
    }

    // Desktop par défaut
    return 'desktop'
  }

  /**
   * Détecte si l'appareil est un casque VR (méthodes multiples)
   */
  private isVRDevice(): boolean {
    if (typeof window === 'undefined') return false

    const cacheKey = 'vr_device'
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)
    }

    const ua = navigator.userAgent.toLowerCase()
    let isVR = false

    // Méthode 1: User-Agent spécifiques
    const vrPatterns = [
      /oculus/i,
      /quest/i,
      /rift/i,
      /vive/i,
      /pico/i,
      /daydream/i,
      /cardboard/i,
      /gearvr/i,
      /windows mixed reality/i,
      /wmr/i,
      /valve index/i,
      /playstation vr/i,
      /psvr/i
    ]

    if (vrPatterns.some(pattern => pattern.test(ua))) {
      isVR = true
    }

    // Méthode 2: API WebXR (seulement si vraiment un casque VR)
    // Ne pas détecter VR juste parce que l'API existe (elle peut exister sur desktop)
    if (!isVR && 'xr' in navigator) {
      // Vérifier si c'est vraiment un casque VR connecté
      // Pour l'instant, on ne considère pas l'API seule comme preuve
      // car elle peut être disponible sur desktop sans casque
    }

    // Méthode 3: API WebVR (legacy) - même logique
    // Ne pas détecter VR juste parce que l'API existe
    if (!isVR && (navigator as any).getVRDisplays) {
      // L'API peut exister sur desktop, donc on ne l'utilise pas seule
    }

    // Méthode 4: Détection par résolution (VR typiquement 2160x1200 ou similaire)
    // MAIS seulement si on n'est pas sur un desktop classique
    if (!isVR) {
      const width = window.screen.width
      const height = window.screen.height
      const ua = navigator.userAgent.toLowerCase()
      
      // Exclure les desktop classiques
      const isDesktopOS = /windows|macintosh|linux/i.test(ua)
      
      // Résolutions VR communes
      const vrResolutions = [
        { w: 2160, h: 1200 }, // Oculus Rift
        { w: 2880, h: 1600 }, // Oculus Quest
        { w: 2560, h: 1440 }, // HTC Vive
      ]
      
      // Ne détecter VR par résolution que si ce n'est PAS un desktop classique
      if (!isDesktopOS) {
        isVR = vrResolutions.some(res => 
          Math.abs(width - res.w) < 50 && Math.abs(height - res.h) < 50
        )
      }
    }

    this.detectionCache.set(cacheKey, isVR)
    return isVR
  }

  /**
   * Détecte si l'appareil est une TV (méthodes multiples)
   */
  private isTVDevice(): boolean {
    if (typeof window === 'undefined') return false

    const cacheKey = 'tv_device'
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)
    }

    const ua = navigator.userAgent.toLowerCase()
    let isTV = false

    // Méthode 1: User-Agent spécifiques Smart TV
    const tvPatterns = [
      /smart-tv|smarttv/i,
      /googletv/i,
      /appletv/i,
      /roku/i,
      /chromecast/i,
      /androidtv/i,
      /tvos/i,
      /webos/i,
      /tizen/i,
      /bravia/i,
      /panasonic/i,
      /philips/i,
      /samsung.*tv/i,
      /lg.*tv/i,
      /sony.*tv/i,
      /vizio/i,
      /hisense/i,
      /sharp.*aquos/i,
      /tv.*browser/i,
      /hbbtv/i,
      /netcast/i,
      /opera tv/i,
      /smart.*hub/i
    ]

    if (tvPatterns.some(pattern => pattern.test(ua))) {
      isTV = true
    }

    // Méthode 2: Détection par résolution et absence de certains features
    if (!isTV) {
      const width = window.screen.width
      const height = window.screen.height
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const hasBattery = 'getBattery' in navigator
      
      // TV typiquement: grande résolution (1920x1080+), pas de touch, pas de batterie
      if (width >= 1920 && height >= 1080 && !hasTouch && !hasBattery) {
        // Vérifier que ce n'est pas un desktop
        const isDesktopOS = /windows|macintosh|linux/i.test(ua)
        if (!isDesktopOS) {
          isTV = true
        }
      }
    }

    // Méthode 3: Détection par ratio d'aspect (TV typiquement 16:9)
    if (!isTV) {
      const width = window.screen.width
      const height = window.screen.height
      const aspectRatio = width / height
      // Ratio 16:9 = 1.777...
      if (Math.abs(aspectRatio - 1.777) < 0.1 && width >= 1920) {
        const hasTouch = 'ontouchstart' in window
        if (!hasTouch) {
          isTV = true
        }
      }
    }

    // Méthode 4: Détection par features spécifiques TV
    if (!isTV) {
      // Les TV ont souvent des APIs spécifiques
      if ((window as any).webkitRequestFullscreen || 
          (document as any).webkitCancelFullScreen) {
        // Indicateur possible de TV, mais pas fiable seul
      }
    }

    this.detectionCache.set(cacheKey, isTV)
    return isTV
  }

  /**
   * Détecte la plateforme avec plusieurs méthodes
   */
  private detectPlatform(): PlatformType {
    if (typeof window === 'undefined') return 'unknown'

    const cacheKey = 'platform'
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)
    }

    const ua = navigator.userAgent.toLowerCase()
    let platform: PlatformType = 'unknown'

    // Vérifier d'abord si c'est un desktop classique
    const isDesktopOS = /windows|macintosh|mac os x|linux/i.test(ua) && 
                       !/android|iphone|ipad|ipod|mobile/i.test(ua)

    // Détection VR - SEULEMENT si ce n'est pas un desktop
    if (!isDesktopOS && this.isVRDevice()) {
      platform = 'vr'
    }
    // Détection TV - SEULEMENT si ce n'est pas un desktop
    else if (!isDesktopOS && this.isTVDevice()) {
      if (ua.includes('tvos') || ua.includes('appletv')) {
        platform = 'tvos'
      } else if (ua.includes('androidtv') || ua.includes('googletv')) {
        platform = 'androidtv'
      } else if (ua.includes('webos')) {
        platform = 'webos'
      } else if (ua.includes('tizen')) {
        platform = 'tizen'
      } else {
        platform = 'androidtv' // Par défaut pour TV
      }
    }
    // Détection iOS (incluant iPad)
    else if (/iphone|ipad|ipod/i.test(ua)) {
      // iPad peut être détecté comme MacIntel, donc vérifier aussi maxTouchPoints
      if (/ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        platform = 'ios'
      } else {
        platform = 'ios'
      }
    }
    // Détection Android
    else if (/android/i.test(ua)) {
      platform = 'android'
    }
    // Détection Windows
    else if (/windows|win32|win64/i.test(ua)) {
      platform = 'windows'
    }
    // Détection macOS
    else if (/macintosh|mac os x|macintel/i.test(ua)) {
      platform = 'macos'
    }
    // Détection Linux
    else if (/linux/i.test(ua)) {
      platform = 'linux'
    }

    this.detectionCache.set(cacheKey, platform)
    return platform
  }

  /**
   * Détecte le navigateur avec plusieurs méthodes
   */
  private detectBrowser(): BrowserType {
    if (typeof window === 'undefined') return 'unknown'

    const cacheKey = 'browser'
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)
    }

    const ua = navigator.userAgent.toLowerCase()
    let browser: BrowserType = 'unknown'

    // Ordre important: vérifier les plus spécifiques en premier
    if (ua.includes('samsungbrowser') || ua.includes('samsung')) {
      browser = 'samsung'
    } else if (ua.includes('edg/') || ua.includes('edgios/') || ua.includes('edga/')) {
      browser = 'edge'
    } else if (ua.includes('opr/') || ua.includes('opera/')) {
      browser = 'opera'
    } else if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) {
      browser = 'chrome'
    } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')) {
      browser = 'safari'
    } else if (ua.includes('firefox') || ua.includes('fxios')) {
      browser = 'firefox'
    }

    this.detectionCache.set(cacheKey, browser)
    return browser
  }

  /**
   * Vérifie si l'app est installée en mode PWA (méthodes multiples)
   */
  private checkPWAStatus(): { isPWA: boolean; isStandalone: boolean } {
    if (typeof window === 'undefined') {
      return { isPWA: false, isStandalone: false }
    }

    // Méthode 1: Display mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches

    // Méthode 2: iOS standalone
    const isIOSStandalone = (window.navigator as any).standalone === true

    // Méthode 3: Android app referrer
    const isAndroidApp = document.referrer.includes('android-app://')

    // Méthode 4: Vérifier si on est dans un WebView
    const isWebView = !(window as any).chrome && 
                     (window.navigator as any).standalone !== undefined

    const standalone = isStandalone || isIOSStandalone || isAndroidApp

    // PWA si standalone ou dans un contexte d'app
    const isPWA = standalone || isWebView

    return { isPWA, isStandalone: standalone }
  }

  /**
   * Vérifie si l'installation PWA est possible
   */
  private checkCanInstall(): boolean {
    if (typeof window === 'undefined') return false

    // Vérifier le support Service Worker
    const hasServiceWorker = 'serviceWorker' in navigator

    // Vérifier le support BeforeInstallPrompt
    const hasBeforeInstallPrompt = 'BeforeInstallPromptEvent' in window || 
                                   'onbeforeinstallprompt' in window

    // Vérifier le support de l'API d'installation
    const hasInstallAPI = hasServiceWorker && hasBeforeInstallPrompt

    // iOS peut toujours être installé manuellement
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const canInstallIOS = isIOS && hasServiceWorker

    return hasInstallAPI || canInstallIOS
  }

  /**
   * Obtient les informations complètes de l'appareil
   */
  public getDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo
    }

    if (typeof window === 'undefined') {
      return this.getDefaultDeviceInfo()
    }

    const { isPWA, isStandalone } = this.checkPWAStatus()
    const deviceType = this.detectDeviceType()
    const platform = this.detectPlatform()
    const browser = this.detectBrowser()
    const ua = navigator.userAgent.toLowerCase()

    const width = window.screen.width || window.innerWidth
    const height = window.screen.height || window.innerHeight
    const pixelRatio = window.devicePixelRatio || 1
    const isTouchDevice = 'ontouchstart' in window || 
                         navigator.maxTouchPoints > 0 ||
                         (navigator as any).msMaxTouchPoints > 0
    const isRetina = pixelRatio > 1
    const orientation = height > width ? 'portrait' : 'landscape'

    const isIOS = /iphone|ipad|ipod/i.test(ua) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /android/i.test(ua)
    const isMobile = deviceType === 'mobile'
    const isTablet = deviceType === 'tablet'
    const isDesktop = deviceType === 'desktop'

    this.deviceInfo = {
      type: deviceType,
      platform,
      browser,
      isPWA,
      isStandalone,
      canInstall: this.checkCanInstall(),
      supportsVR: this.isVRDevice() || 'xr' in navigator,
      supportsTV: this.isTVDevice(),
      userAgent: navigator.userAgent,
      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      isTouchDevice,
      isRetina,
      orientation,
      isIOS,
      isAndroid,
      isMobile,
      isTablet,
      isDesktop
    }

    return this.deviceInfo
  }

  /**
   * Retourne des valeurs par défaut si window n'est pas disponible
   */
  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      type: 'unknown',
      platform: 'unknown',
      browser: 'unknown',
      isPWA: false,
      isStandalone: false,
      canInstall: false,
      supportsVR: false,
      supportsTV: false,
      userAgent: '',
      screenWidth: 0,
      screenHeight: 0,
      pixelRatio: 1,
      isTouchDevice: false,
      isRetina: false,
      orientation: 'landscape',
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isTablet: false,
      isDesktop: false
    }
  }

  /**
   * Réinitialise la détection (utile après changement d'orientation)
   */
  public reset(): void {
    this.deviceInfo = null
    this.detectionCache.clear()
  }

  /**
   * Obtient les instructions d'installation selon l'appareil
   */
  public getInstallInstructions(): string {
    const info = this.getDeviceInfo()

    switch (info.platform) {
      case 'ios':
        return 'Appuyez sur le bouton de partage 📤 puis "Ajouter à l\'écran d\'accueil"'
      case 'android':
        if (info.browser === 'samsung') {
          return 'Appuyez sur le menu (⋮) puis "Ajouter à l\'écran d\'accueil"'
        }
        return 'Appuyez sur le menu (⋮) puis "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"'
      case 'tvos':
        return 'L\'application peut être installée depuis l\'App Store ou via AirPlay'
      case 'androidtv':
      case 'webos':
      case 'tizen':
        return 'L\'application peut être installée depuis le store de votre TV'
      case 'vr':
        return 'L\'application peut être installée depuis le store VR ou via le navigateur'
      default:
        if (info.browser === 'chrome' || info.browser === 'edge') {
          return 'Cliquez sur l\'icône d\'installation dans la barre d\'adresse'
        } else if (info.browser === 'safari') {
          return 'Utilisez le menu Fichier > Ajouter à l\'écran d\'accueil'
        } else {
          return 'Utilisez le menu de votre navigateur pour installer l\'application'
        }
    }
  }

  /**
   * Vérifie si l'appareil est un iPad (détection améliorée)
   */
  public isIPad(): boolean {
    const info = this.getDeviceInfo()
    if (info.isIOS && (info.isTablet || info.screenWidth >= 768)) {
      return true
    }
    // Détection spécifique iPad
    const ua = navigator.userAgent.toLowerCase()
    return /ipad/i.test(ua) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }
}

// Instance singleton
export const deviceDetectionService = new DeviceDetectionService()

