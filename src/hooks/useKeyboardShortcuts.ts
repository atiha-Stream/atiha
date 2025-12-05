'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
  onPlayPause?: () => void
  onNextEpisode?: () => void
  onPreviousEpisode?: () => void
  onSeekForward?: () => void
  onSeekBackward?: () => void
  onToggleFullscreen?: () => void
  onToggleMute?: () => void
  onVolumeUp?: () => void
  onVolumeDown?: () => void
  onToggleSubtitles?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Ignorer si on est dans un input ou textarea
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }

    const { key, ctrlKey, shiftKey, altKey } = event

    // Raccourcis de base
    switch (key) {
      case ' ':
        event.preventDefault()
        shortcuts.onPlayPause?.()
        break
      
      case 'ArrowRight':
        event.preventDefault()
        if (shiftKey) {
          shortcuts.onSeekForward?.()
        } else {
          shortcuts.onNextEpisode?.()
        }
        break
      
      case 'ArrowLeft':
        event.preventDefault()
        if (shiftKey) {
          shortcuts.onSeekBackward?.()
        } else {
          shortcuts.onPreviousEpisode?.()
        }
        break
      
      case 'ArrowUp':
        event.preventDefault()
        shortcuts.onVolumeUp?.()
        break
      
      case 'ArrowDown':
        event.preventDefault()
        shortcuts.onVolumeDown?.()
        break
      
      case 'f':
      case 'F':
        event.preventDefault()
        shortcuts.onToggleFullscreen?.()
        break
      
      case 'm':
      case 'M':
        event.preventDefault()
        shortcuts.onToggleMute?.()
        break
      
      case 'c':
      case 'C':
        event.preventDefault()
        shortcuts.onToggleSubtitles?.()
        break
      
      case 'n':
      case 'N':
        event.preventDefault()
        shortcuts.onNextEpisode?.()
        break
      
      case 'p':
      case 'P':
        event.preventDefault()
        shortcuts.onPreviousEpisode?.()
        break
    }

    // Raccourcis avec Ctrl
    if (ctrlKey) {
      switch (key) {
        case 'ArrowRight':
          event.preventDefault()
          shortcuts.onSeekForward?.()
          break
        case 'ArrowLeft':
          event.preventDefault()
          shortcuts.onSeekBackward?.()
          break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])
}

// Hook pour afficher l&apos;aide des raccourcis
export function useKeyboardHelp() {
  const shortcuts = [
    { key: 'Espace', description: 'Lecture/Pause' },
    { key: '← →', description: 'Épisode précédent/suivant' },
    { key: 'Shift + ← →', description: 'Reculer/Avancer 10s' },
    { key: '↑ ↓', description: 'Volume +/-' },
    { key: 'F', description: 'Plein écran' },
    { key: 'M', description: 'Muet' },
    { key: 'C', description: 'Sous-titres' },
    { key: 'N', description: 'Épisode suivant' },
    { key: 'P', description: 'Épisode précédent' },
    { key: '?', description: 'Afficher cette aide' }
  ]

  return shortcuts
}


