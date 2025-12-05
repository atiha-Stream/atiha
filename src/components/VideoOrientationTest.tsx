'use client'

/**
 * Composant de test pour vérifier le comportement de l'orientation vidéo
 * Affiche les informations d'orientation en temps réel
 */
import { useState, useEffect } from 'react'

export default function VideoOrientationTest() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [aspectRatio, setAspectRatio] = useState(0)
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const ratio = width / height
      
      setDimensions({ width, height })
      setAspectRatio(ratio)
      
      // Détecter l'orientation basée sur les dimensions (plus fiable que orientation API)
      if (width > height) {
        setOrientation('landscape')
      } else {
        setOrientation('portrait')
      }
    }

    // Détecter si on est en PWA
    const checkPWA = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      setIsPWA(isStandalone)
    }

    updateOrientation()
    checkPWA()

    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  // Vérifier si le CSS paysage devrait s'appliquer
  const shouldApplyLandscapeCSS = dimensions.width <= 1024 && aspectRatio >= 4/3
  const shouldApplyPortraitCSS = dimensions.width <= 768 && aspectRatio <= 4/3

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-bold mb-2">🧪 Test Orientation Vidéo</div>
      
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Orientation détectée:</span>{' '}
          <span className={orientation === 'landscape' ? 'text-green-400' : 'text-blue-400'}>
            {orientation.toUpperCase()}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Dimensions:</span>{' '}
          {dimensions.width} × {dimensions.height}
        </div>
        
        <div>
          <span className="text-gray-400">Ratio:</span>{' '}
          {aspectRatio.toFixed(2)}:1
        </div>
        
        <div>
          <span className="text-gray-400">Mode:</span>{' '}
          {isPWA ? '📱 PWA' : '🌐 Navigateur'}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-gray-400 mb-1">CSS appliqué:</div>
          <div className={shouldApplyLandscapeCSS ? 'text-green-400' : 'text-gray-500'}>
            {shouldApplyLandscapeCSS ? '✅ Paysage' : '❌ Paysage'}
          </div>
          <div className={shouldApplyPortraitCSS ? 'text-blue-400' : 'text-gray-500'}>
            {shouldApplyPortraitCSS ? '✅ Portrait' : '❌ Portrait'}
          </div>
        </div>
      </div>
    </div>
  )
}

