'use client'

import React from 'react'

interface SimpleNetworkHandlerProps {
  children: React.ReactNode
}

// Version simplifiée sans notifications visuelles
export function SimpleNetworkHandler({ children }: SimpleNetworkHandlerProps) {
  return <>{children}</>
}

