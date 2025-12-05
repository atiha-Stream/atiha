'use client'

import React from 'react'
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

export type ErrorType = 'error' | 'warning' | 'info' | 'success'

interface ErrorMessageProps {
  type?: ErrorType
  title?: string
  message: string
  details?: string
  onClose?: () => void
  className?: string
  showIcon?: boolean
}

const typeConfig = {
  error: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-400',
    iconColor: 'text-red-400'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    textColor: 'text-yellow-400',
    iconColor: 'text-yellow-400'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-400'
  },
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    textColor: 'text-green-400',
    iconColor: 'text-green-400'
  }
}

export default function ErrorMessage({
  type = 'error',
  title,
  message,
  details,
  onClose,
  className = '',
  showIcon = true
}: ErrorMessageProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={`
      ${config.bgColor} 
      ${config.borderColor} 
      border rounded-lg p-4 
      ${className}
    `}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold ${config.textColor} mb-1`}>
              {title}
            </h3>
          )}
          
          <p className={`${config.textColor} text-sm`}>
            {message}
          </p>
          
          {details && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className={`${config.textColor} text-xs cursor-pointer hover:underline`}>
                Détails techniques (développement)
              </summary>
              <div className="mt-2 bg-dark-300 rounded p-2">
                <pre className={`${config.textColor} text-xs overflow-auto whitespace-pre-wrap`}>
                  {details}
                </pre>
              </div>
            </details>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Fermer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Composants spécialisés pour chaque type
export function ErrorAlert(props: Omit<ErrorMessageProps, 'type'>) {
  return <ErrorMessage {...props} type="error" />
}

export function WarningAlert(props: Omit<ErrorMessageProps, 'type'>) {
  return <ErrorMessage {...props} type="warning" />
}

export function InfoAlert(props: Omit<ErrorMessageProps, 'type'>) {
  return <ErrorMessage {...props} type="info" />
}

export function SuccessAlert(props: Omit<ErrorMessageProps, 'type'>) {
  return <ErrorMessage {...props} type="success" />
}
