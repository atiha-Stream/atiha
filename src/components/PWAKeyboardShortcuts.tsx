'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface PWAKeyboardShortcutsProps {
  onToggleFullscreen?: () => void
  onToggleMute?: () => void
  onTogglePlayPause?: () => void
  onSeekBackward?: () => void
  onSeekForward?: () => void
  onVolumeUp?: () => void
  onVolumeDown?: () => void
}

export default function PWAKeyboardShortcuts({
  onToggleFullscreen,
  onToggleMute,
  onTogglePlayPause,
  onSeekBackward,
  onSeekForward,
  onVolumeUp,
  onVolumeDown
}: PWAKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      // Raccourcis globaux PWA
      switch (event.code) {
        case 'KeyF':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onToggleFullscreen?.()
          }
          break

        case 'KeyM':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onToggleMute?.()
          }
          break

        case 'Space':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onTogglePlayPause?.()
          }
          break

        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onSeekBackward?.()
          }
          break

        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onSeekForward?.()
          }
          break

        case 'ArrowUp':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onVolumeUp?.()
          }
          break

        case 'ArrowDown':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onVolumeDown?.()
          }
          break

        case 'KeyH':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            showKeyboardShortcuts()
          }
          break

        case 'KeyI':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            showPWAInfo()
          }
          break

        case 'KeyR':
          if (event.ctrlKey || event.metaKey && event.shiftKey) {
            event.preventDefault()
            if (confirm('Vider le cache et recharger l\'application ?')) {
              clearCacheAndReload()
            }
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    onToggleFullscreen,
    onToggleMute,
    onTogglePlayPause,
    onSeekBackward,
    onSeekForward,
    onVolumeUp,
    onVolumeDown
  ])

  const showKeyboardShortcuts = () => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + F', description: 'Basculer en plein écran' },
      { key: 'Ctrl/Cmd + M', description: 'Couper/Activer le son' },
      { key: 'Ctrl/Cmd + Espace', description: 'Play/Pause' },
      { key: 'Ctrl/Cmd + ←', description: 'Reculer 10 secondes' },
      { key: 'Ctrl/Cmd + →', description: 'Avancer 10 secondes' },
      { key: 'Ctrl/Cmd + ↑', description: 'Augmenter le volume' },
      { key: 'Ctrl/Cmd + ↓', description: 'Diminuer le volume' },
      { key: 'Ctrl/Cmd + H', description: 'Afficher cette aide' },
      { key: 'Ctrl/Cmd + I', description: 'Informations PWA' },
      { key: 'Ctrl/Cmd + Shift + R', description: 'Vider le cache et recharger' }
    ]

    const shortcutsList = shortcuts
      .map(shortcut => `${shortcut.key}: ${shortcut.description}`)
      .join('\n')

    alert(`🎮 RACCOURCIS CLAVIER PWA\n\n${shortcutsList}`)
  }

  const showPWAInfo = () => {
    const isOnline = navigator.onLine
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const userAgent = navigator.userAgent
    const language = navigator.language
    const platform = navigator.platform
    const cookieEnabled = navigator.cookieEnabled
    const onLine = navigator.onLine

    const info = `
📱 INFORMATIONS PWA

🌐 Connexion: ${isOnline ? 'En ligne' : 'Hors ligne'}
📱 Mode: ${isStandalone ? 'Application installée' : 'Navigateur web'}
🌍 Langue: ${language}
💻 Plateforme: ${platform}
🍪 Cookies: ${cookieEnabled ? 'Activés' : 'Désactivés'}
📶 Statut: ${onLine ? 'Connecté' : 'Déconnecté'}

    `.trim()

    alert(info)
  }

  const clearCacheAndReload = async () => {
    try {
      // Vider le cache du service worker
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }

      // Vider le localStorage
      localStorage.clear()

      // Vider le sessionStorage
      sessionStorage.clear()

      // Recharger la page
      window.location.reload()
    } catch (error) {
      logger.error('Erreur lors du nettoyage du cache', error as Error)
      alert('Erreur lors du nettoyage du cache')
    }
  }

  return null // Ce composant ne rend rien
}

// Hook pour utiliser les raccourcis clavier
export function usePWAKeyboardShortcuts() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const seekBackward = () => {
    // Logique de recul
    logger.debug('Recul de 10 secondes')
  }

  const seekForward = () => {
    // Logique d'avance
    logger.debug('Avance de 10 secondes')
  }

  const volumeUp = () => {
    // Logique d'augmentation du volume
    logger.debug('Volume augmenté')
  }

  const volumeDown = () => {
    // Logique de diminution du volume
    console.log('Volume diminué')
  }

  return {
    isFullscreen,
    isMuted,
    isPlaying,
    toggleFullscreen,
    toggleMute,
    togglePlayPause,
    seekBackward,
    seekForward,
    volumeUp,
    volumeDown
  }
}
