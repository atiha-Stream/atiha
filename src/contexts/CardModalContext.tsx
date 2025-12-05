'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Movie, Series } from '@/types/content'

interface CardModalState {
  content: (Movie | Series) | null
  isVisible: boolean
  cardElement: HTMLElement | null
  isHoveringModal: boolean
}

interface CardModalContextType {
  cardModal: CardModalState
  showCardModal: (content: Movie | Series, cardElement: HTMLElement) => void
  hideCardModal: () => void
  setHoveringModal: (isHovering: boolean) => void
}

const CardModalContext = createContext<CardModalContextType | undefined>(undefined)

export function CardModalProvider({ children }: { children: ReactNode }) {
  const [cardModal, setCardModal] = useState<CardModalState>({
    content: null,
    isVisible: false,
    cardElement: null,
    isHoveringModal: false
  })

  const showCardModal = (content: Movie | Series, cardElement: HTMLElement) => {
    setCardModal({
      content,
      isVisible: true,
      cardElement,
      isHoveringModal: false
    })
  }

  const hideCardModal = () => {
    setCardModal(prev => ({
      ...prev,
      isVisible: false,
      cardElement: null,
      isHoveringModal: false
    }))
  }

  const setHoveringModal = (isHovering: boolean) => {
    setCardModal(prev => ({
      ...prev,
      isHoveringModal: isHovering
    }))
  }

  return (
    <CardModalContext.Provider value={{ cardModal, showCardModal, hideCardModal, setHoveringModal }}>
      {children}
    </CardModalContext.Provider>
  )
}

export function useCardModal() {
  const context = useContext(CardModalContext)
  if (context === undefined) {
    throw new Error('useCardModal must be used within a CardModalProvider')
  }
  return context
}

