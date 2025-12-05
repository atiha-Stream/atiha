'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { premiumCodesService } from '@/lib/premium-codes-service'
import { SecureStorage } from '@/lib/secure-storage'
import { logger } from '@/lib/logger'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isActivating, setIsActivating] = useState(false)
  const [activationStatus, setActivationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [countdown, setCountdown] = useState(5)
  const [paymentType, setPaymentType] = useState<'individuel' | 'famille' | null>(null)

  useEffect(() => {
    // Notifier le parent que la page de succès est chargée (utile si affiché dans un iframe)
    try {
      if (typeof window !== 'undefined') {
        window.parent?.postMessage({ type: 'ATIHA_PAYMENT_SUCCESS_PAGE_LOADED' }, '*')
      }
    } catch (_) {}
    // Détecter le type de paiement depuis les paramètres URL ou l'URL complète
    const type = searchParams.get('type') as 'individuel' | 'famille'
    const paymentSuccess = searchParams.get('payment') === 'success'
    const duration = searchParams.get('duration') as '30day' | '1year'
    
    // Si pas de paramètres, essayer de détecter depuis l'URL complète
    if (!paymentSuccess || !type) {
      const currentUrl = window.location.href
      const detectedType = detectPaymentTypeFromUrl(currentUrl)
      
      if (detectedType) {
        setPaymentType(detectedType)
        activatePremiumCode(detectedType)
        return
      }
    }
    
    if (paymentSuccess && type) {
      setPaymentType(type)
      activatePremiumCode(type)
    } else {
      // Redirection si les paramètres ne sont pas corrects
      router.push('/subscription')
    }
  }, [searchParams, router])

  const detectPaymentTypeFromUrl = (url: string): 'individuel' | 'famille' | null => {
    try {
      // Détection par les nouveaux formats d'URL (priorité)
      // Support des URLs avec ou sans trailing slash
      if (url.includes('/payment-success-type-individuel-30day') || 
          url.includes('/payment-success-type-individuel-1year') ||
          url.includes('/payment-success-type-individuel-30day/') || 
          url.includes('/payment-success-type-individuel-1year/')) {
        return 'individuel'
      } else if (url.includes('/payment-success-type-family-30day') || 
                 url.includes('/payment-success-type-family-1year') ||
                 url.includes('/payment-success-type-family-30day/') || 
                 url.includes('/payment-success-type-family-1year/')) {
        return 'famille'
      }
      
      // Fallback : Détection par paramètres URL (ancien système)
      const urlParams = new URLSearchParams(url.split('?')[1] || '')
      const paymentParam = urlParams.get('payment')
      const typeParam = urlParams.get('type')
      
      if (paymentParam === 'success' && (typeParam === 'individuel' || typeParam === 'famille')) {
        return typeParam as 'individuel' | 'famille'
      }
      
      // Fallback : Récupérer les URLs configurées (ancien système)
      const links = SecureStorage.getItemJSON<{ [key: string]: string }>('atiha_post_payment_links')
      const activeStates = SecureStorage.getItemJSON<{ [key: string]: boolean }>('atiha_post_payment_links_active')
      
      if (links && activeStates) {
        // Vérifier si l'URL correspond à un lien configuré
        if (activeStates.individuel && links.individuel && url.includes(links.individuel)) {
          return 'individuel'
        } else if (activeStates.famille && links.famille && url.includes(links.famille)) {
          return 'famille'
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la détection du type de paiement', error as Error)
    }
    
    return null
  }

  useEffect(() => {
    if (activationStatus === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (activationStatus === 'success' && countdown === 0) {
      redirectToApp()
    }
  }, [activationStatus, countdown])

  // Notifier le parent de fermer le modal dès que l&apos;activation est réussie
  useEffect(() => {
    if (activationStatus === 'success') {
      try {
        window.parent?.postMessage({ type: 'ATIHA_PAYMENT_SUCCESS' }, '*')
        // Déclencher aussi un événement de stockage pour les écouteurs côté parent
        localStorage.setItem('atiha_payment_success', `${Date.now()}`)
      } catch (_) {}
    }
  }, [activationStatus])

  const activatePremiumCode = async (type: 'individuel' | 'famille') => {
    setIsActivating(true)
    setActivationStatus('loading')

    try {
      // Récupérer l'utilisateur connecté depuis SecureStorage
      const currentUser = SecureStorage.getItemJSON<any>('atiha_user')
      if (!currentUser) {
        throw new Error('Utilisateur non connecté')
      }


      // Récupérer les codes configurés
      const codes = SecureStorage.getItemJSON<{ [key: string]: string }>('atiha_post_payment_codes')
      const activeStates = SecureStorage.getItemJSON<{ [key: string]: boolean }>('atiha_post_payment_codes_active')
      
      if (!codes || !activeStates) {
        throw new Error('Aucun code configuré pour l\'activation après paiement')
      }

      // Détecter la durée depuis l'URL
      const currentUrl = window.location.href
      const is30Day = currentUrl.includes('30day')
      const is1Year = currentUrl.includes('1year')

      // Déterminer le code à utiliser selon le type et la durée
      let codeToActivate = ''
      if (type === 'individuel') {
        if (is30Day && activeStates.individuel30j && codes.individuel30j) {
          codeToActivate = codes.individuel30j
        } else if (is1Year && activeStates.individuel1an && codes.individuel1an) {
          codeToActivate = codes.individuel1an
        } else if (activeStates.individuel30j && codes.individuel30j) {
          // Fallback vers 30j si pas de durée spécifiée
          codeToActivate = codes.individuel30j
        }
      } else if (type === 'famille') {
        if (is30Day && activeStates.famille30j && codes.famille30j) {
          codeToActivate = codes.famille30j
        } else if (is1Year && activeStates.famille1an && codes.famille1an) {
          codeToActivate = codes.famille1an
        } else if (activeStates.famille30j && codes.famille30j) {
          // Fallback vers 30j si pas de durée spécifiée
          codeToActivate = codes.famille30j
        }
      }

      if (!codeToActivate) {
        const duration = is30Day ? '30 jours' : is1Year ? '1 an' : '30 jours (par défaut)'
        throw new Error(`Aucun code configuré et activé pour ${type} ${duration}`)
      }

      // Activer le code pour l&apos;utilisateur
      const result = premiumCodesService.activateCode(codeToActivate, currentUser.id)
      
      if (result.success) {
        setActivationStatus('success')
      } else {
        // Si le code est déjà utilisé mais que l&apos;activation a fonctionné en backend
        if (result.message && result.message.includes('déjà utilisé')) {
          setActivationStatus('success')
        } else {
          throw new Error(result.message || 'Erreur lors de l\'activation')
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'activation du code', error as Error)
      setActivationStatus('error')
    } finally {
      setIsActivating(false)
    }
  }

  const redirectToApp = () => {
    router.push('/dashboard')
  }

  const handleContinue = () => {
    redirectToApp()
  }

  if (activationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="w-full h-full border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Activation en cours...</h2>
          <p className="text-gray-300">
            Votre abonnement {paymentType === 'individuel' ? 'individuel' : 'famille'} {window.location.href.includes('30day') ? '(30 jours)' : window.location.href.includes('1year') ? '(1 an)' : '(30 jours)'} est en cours d&apos;activation
          </p>
        </div>
      </div>
    )
  }

  if (activationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Erreur d&apos;activation</h2>
          <p className="text-gray-300 mb-6">
            Une erreur s&apos;est produite lors de l&apos;activation de votre abonnement {paymentType === 'individuel' ? 'individuel' : 'famille'} {window.location.href.includes('30day') ? '(30 jours)' : window.location.href.includes('1year') ? '(1 an)' : '(30 jours)'}.
          </p>
          <button
            onClick={() => router.push('/subscription')}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium"
          >
            Retour à l&apos;abonnement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
        {/* Icône de succès */}
        <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Titre de succès */}
        <h1 className="text-3xl font-bold text-white mb-4">🎉 Paiement Confirmé !</h1>
        
        {/* Message de confirmation */}
        <div className="space-y-3 mb-8">
          <p className="text-green-400 font-medium">
            ✅ Votre paiement a été traité avec succès
          </p>
          <p className="text-white">
            🚀 Votre abonnement {paymentType === 'individuel' ? 'individuel' : 'famille'} {window.location.href.includes('30day') ? '(30 jours)' : window.location.href.includes('1year') ? '(1 an)' : '(30 jours)'} est maintenant actif !
          </p>
          <p className="text-gray-300 text-sm">
            Vous pouvez maintenant profiter de tous les avantages premium
          </p>
        </div>

        {/* Compte à rebours */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <p className="text-gray-300 text-sm mb-2">Redirection automatique dans :</p>
          <div className="text-3xl font-bold text-white">
            {countdown}s
          </div>
        </div>

        {/* Bouton continuer */}
        <button
          onClick={handleContinue}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-lg shadow-lg hover:shadow-xl"
        >
          Continuer vers l&apos;application
        </button>

        {/* Informations supplémentaires */}
        <div className="mt-6 text-xs text-gray-400">
          <p>Vous serez automatiquement redirigé vers votre tableau de bord</p>
        </div>
      </div>
    </div>
  )
}
