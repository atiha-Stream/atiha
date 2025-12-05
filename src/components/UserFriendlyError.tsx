'use client'

import React from 'react'
import ErrorMessage, { ErrorType } from '@/components/ErrorMessage'
import { ErrorMessages } from '@/lib/error-messages'

interface UserFriendlyErrorProps {
  error: any
  type?: ErrorType
  title?: string
  onClose?: () => void
  className?: string
}

export function UserFriendlyError({ 
  error, 
  type = 'error', 
  title, 
  onClose, 
  className 
}: UserFriendlyErrorProps) {
  // En production, masquer complètement les détails techniques
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Messages conviviaux pour l&apos;utilisateur
  const getUserFriendlyMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error
    }

    if (error?.message) {
      // Messages d&apos;erreur techniques à remplacer par des messages conviviaux
      const technicalMessages = [
        'Email ou mot de passe incorrect',
        'Invalid credentials',
        'Authentication failed',
        'Network error',
        'Connection failed',
        'Server error',
        'Internal server error'
      ]

      const message = error.message.toLowerCase()
      
      if (message.includes('email') && message.includes('password')) {
        return ErrorMessages.auth.invalidCredentials
      }
      
      if (message.includes('network') || message.includes('connection')) {
        return ErrorMessages.network.connectionFailed
      }
      
      if (message.includes('server') || message.includes('internal')) {
        return ErrorMessages.network.serverError
      }
      
      if (message.includes('timeout')) {
        return ErrorMessages.network.timeout
      }
      
      if (message.includes('unauthorized') || message.includes('forbidden')) {
        return ErrorMessages.network.unauthorized
      }
      
      // Si c&apos;est un message technique, le remplacer par un message générique
      if (technicalMessages.some(techMsg => message.includes(techMsg.toLowerCase()))) {
        return ErrorMessages.generic.unexpected
      }
      
      // Sinon, retourner le message original (peut être déjà convivial)
      return error.message
    }

    return ErrorMessages.generic.unexpected
  }

  const userMessage = getUserFriendlyMessage(error)
  
  // En production, ne jamais afficher les détails techniques
  const technicalDetails = isProduction ? undefined : error?.stack

  return (
    <ErrorMessage
      type={type}
      title={title}
      message={userMessage}
      details={technicalDetails}
      onClose={onClose}
      className={className}
    />
  )
}

// Composants spécialisés
export function UserFriendlyErrorAlert(props: Omit<UserFriendlyErrorProps, 'type'>) {
  return <UserFriendlyError {...props} type="error" />
}

export function UserFriendlyWarningAlert(props: Omit<UserFriendlyErrorProps, 'type'>) {
  return <UserFriendlyError {...props} type="warning" />
}

export function UserFriendlyInfoAlert(props: Omit<UserFriendlyErrorProps, 'type'>) {
  return <UserFriendlyError {...props} type="info" />
}
