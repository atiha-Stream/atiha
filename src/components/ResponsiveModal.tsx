'use client'

import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ResponsiveModalProps) {
  const modalId = React.useId()
  const titleId = `modal-title-${modalId}`
  const descriptionId = `modal-description-${modalId}`

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  // Gérer la fermeture avec Escape
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={descriptionId}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className={`bg-dark-200 rounded-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          {title && (
            <div className="flex items-center justify-between mb-6">
              <h2 id={titleId} className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Fermer le modal"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          )}
          <div id={descriptionId}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ResponsiveConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ResponsiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger'
}: ResponsiveConfirmModalProps) {
  const modalId = React.useId()
  const titleId = `confirm-modal-title-${modalId}`
  const messageId = `confirm-modal-message-${modalId}`

  const variantClasses = {
    danger: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }

  // Gérer la fermeture avec Escape
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-dark-200 rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="text-center">
            <div 
              className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${variantClasses[variant]}`}
              aria-hidden="true"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 id={titleId} className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p id={messageId} className="text-gray-300 mb-6">{message}</p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                aria-label="Annuler l&apos;action"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  variant === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : variant === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                aria-label={`Confirmer l&apos;action: ${title}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook pour gérer les modales
export function useResponsiveModal() {
  const [isOpen, setIsOpen] = React.useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return {
    isOpen,
    openModal,
    closeModal
  }
}
