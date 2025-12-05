'use client'

import { useState, useEffect, useRef } from 'react'
import { ShareIcon, CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { logger } from '@/lib/logger'

interface ShareButtonProps {
  contentId: string
  contentTitle: string
  className?: string
}

export default function ShareButton({ contentId, contentTitle, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right')
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const updateMenuPosition = () => {
        if (!buttonRef.current) return
        
        const buttonRect = buttonRef.current.getBoundingClientRect()
        const menuWidth = 224 // w-56 = 14rem = 224px
        const viewportWidth = window.innerWidth
        const padding = 16 // Padding de sécurité
        
        let left: string | number | undefined = 0
        let right: string | number | undefined = 'auto'
        
        // Calculer la position par défaut (aligné à gauche du bouton)
        left = 0
        
        // Vérifier si le menu dépasse à droite
        if (buttonRect.left + menuWidth > viewportWidth - padding) {
          // Si le menu dépasse à droite, on le positionne à droite du bouton
          left = undefined
          right = 0
          
          // Vérifier si même à droite il dépasse
          if (buttonRect.right - menuWidth < padding) {
            // Si le menu est trop large, on l'aligne au bord droit de la page
            left = undefined
            right = padding
          }
        } else {
          // Le menu peut s'afficher normalement à gauche
          left = 0
          right = undefined
        }
        
        setMenuStyle({
          left: left !== undefined ? left : undefined,
          right: right !== undefined ? right : undefined,
          maxWidth: `calc(100vw - ${padding * 2}px)`
        })
        
        if (left === undefined) {
          setMenuPosition('right')
        } else {
          setMenuPosition('left')
        }
      }
      
      updateMenuPosition()
      
      // Réajuster lors du redimensionnement
      window.addEventListener('resize', updateMenuPosition)
      window.addEventListener('scroll', updateMenuPosition, true)
      
      return () => {
        window.removeEventListener('resize', updateMenuPosition)
        window.removeEventListener('scroll', updateMenuPosition, true)
      }
    }
  }, [showMenu])

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/content/${contentId}/p`
    : `/content/${contentId}/p`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setShowMenu(false)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error('Erreur lors de la copie', error as Error)
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setShowMenu(false)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
      if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        const appName = isClient ? content.appIdentity.name : 'Atiha'
        await navigator.share({
          title: contentTitle,
          text: `Découvrez "${contentTitle}" sur ${appName}`,
          url: shareUrl,
        })
        setShowMenu(false)
      } catch (error) {
        // L'utilisateur a annulé le partage
        if ((error as Error).name !== 'AbortError') {
          logger.error('Erreur lors du partage', error as Error)
        }
      }
    } else {
      // Fallback : copier le lien
      handleCopyLink()
    }
  }

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
    setShowMenu(false)
  }

  const shareToTwitter = () => {
    const appName = isClient ? content.appIdentity.name : 'Atiha'
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Découvrez "${contentTitle}" sur ${appName}`)}`
    window.open(url, '_blank', 'width=600,height=400')
    setShowMenu(false)
  }

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${contentTitle} - ${shareUrl}`)}`
    window.open(url, '_blank')
    setShowMenu(false)
  }

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(contentTitle)}`
    window.open(url, '_blank')
    setShowMenu(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        className={`w-full min-h-[44px] sm:min-h-[48px] md:min-h-[52px] inline-flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 font-medium text-base sm:text-lg md:text-xl rounded-lg transition-all duration-200 text-white bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/50 hover:border-gray-600/70 backdrop-blur-sm ${className.includes('w-full') ? '' : ''}`}
        aria-label="Partager"
        aria-expanded={showMenu}
      >
        {copied ? (
          <>
            <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            <span className="hidden sm:inline">Copié !</span>
          </>
        ) : (
          <>
            <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-transform duration-200 group-hover:rotate-12" />
            <span className="hidden sm:inline">Partager</span>
          </>
        )}
      </button>

      {showMenu && (
        <>
          {/* Overlay pour fermer le menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu de partage */}
          <div 
            ref={menuRef}
            className="absolute mt-2 w-56 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 z-20"
            style={menuStyle}
          >
            <div className="py-2">
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <ClipboardIcon className="w-5 h-5" />
                <span>Copier le lien</span>
              </button>
              <div className="border-t border-gray-700 my-1" />
              <button
                onClick={shareToWhatsApp}
                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
              >
                WhatsApp
              </button>
              <button
                onClick={shareToTelegram}
                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
              >
                Telegram
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

