'use client'

import React from 'react'
import { TokenManager } from '@/lib/token-manager'
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface TokenWarningProps {
  videoUrl: string
  className?: string
}

export const TokenWarning: React.FC<TokenWarningProps> = ({
  videoUrl,
  className = ''
}) => {
  const validation = TokenManager.validateStreamingUrl(videoUrl)
  
  if (!validation.warning) {
    return null
  }

  const isExpired = validation.tokenInfo?.expired
  const isWarning = !isExpired && validation.warning?.includes('⚠️')

  return (
    <div className={`p-3 rounded-lg border ${
      isExpired 
        ? 'bg-red-900/20 border-red-500/30 text-red-400' 
        : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
    } ${className}`}>
      <div className="flex items-start space-x-3">
        {isExpired ? (
          <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        ) : (
          <ClockIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        )}
        
        <div className="flex-1">
          <h4 className="font-medium mb-1">
            {isExpired ? 'Token expiré' : 'Token expire bientôt'}
          </h4>
          <p className="text-sm opacity-90">
            {validation.warning}
          </p>
          
          {validation.type === 'cosmic-crab' && (
            <div className="mt-2 text-xs opacity-75">
              <p>Service: Cosmic Crab API</p>
              <p>Recommandation: Utiliser le transcodage HLS pour éviter les problèmes de token</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TokenWarning
