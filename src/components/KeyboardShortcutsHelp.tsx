'use client'

import React, { useEffect } from 'react'
import { useKeyboardHelp } from '@/hooks/useKeyboardShortcuts'
import { 
  XMarkIcon, 
  CommandLineIcon,
  PlayIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = useKeyboardHelp()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '?' || event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress)
      return () => {
        document.removeEventListener('keydown', handleKeyPress)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <CommandLineIcon className="w-6 h-6 text-primary-400" />
              </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Raccourcis clavier</h3>
              <p className="text-gray-400 text-sm">Contrôlez la lecture avec votre clavier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Contrôles de lecture */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <PlayIcon className="w-4 h-4 text-primary-400" />
              <span>Contrôles de lecture</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.slice(0, 4).map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between bg-dark-300 rounded-lg p-3">
                  <span className="text-gray-300 text-sm">{shortcut.description}</span>
                  <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <ArrowRightIcon className="w-4 h-4 text-blue-400" />
              <span>Navigation</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.slice(4, 8).map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between bg-dark-300 rounded-lg p-3">
                  <span className="text-gray-300 text-sm">{shortcut.description}</span>
                  <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Contrôles avancés */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <CommandLineIcon className="w-4 h-4 text-green-400" />
              <span>Contrôles avancés</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.slice(8).map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between bg-dark-300 rounded-lg p-3">
                  <span className="text-gray-300 text-sm">{shortcut.description}</span>
                  <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Appuyez sur <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono">?</kbd> ou <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono">Échap</kbd> pour fermer
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

