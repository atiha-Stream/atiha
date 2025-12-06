'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PlayIcon, ArrowLeftIcon, CheckIcon, XMarkIcon, StarIcon, KeyIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { premiumCodesService, UserPremiumStatus } from '@/lib/premium-codes-service'
import { subscriptionPriceService } from '@/lib/subscription-price-service'
import SubscriptionPlanClientService from '@/lib/subscription-plan-client-service'
import PaymentLinkClientService from '@/lib/payment-link-client-service'
import HeaderStatusIndicator from '@/components/HeaderStatusIndicator'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { SecureStorage } from '@/lib/secure-storage'
import { logger } from '@/lib/logger'

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [premiumStatus, setPremiumStatus] = useState<UserPremiumStatus>({ isPremium: false })
  const [premiumCode, setPremiumCode] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [activationMessage, setActivationMessage] = useState('')
  const [justActivated, setJustActivated] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isIframeModalOpen, setIsIframeModalOpen] = useState(false)
  const [selectedPlanType, setSelectedPlanType] = useState<string>('')
  const [activatedCodesThisMonth, setActivatedCodesThisMonth] = useState<any[]>([])
  const [showNoPaymentNotification, setShowNoPaymentNotification] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [paymentLinks, setPaymentLinks] = useState<any[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Charger les plans et liens de paiement depuis la base de données
    loadSubscriptionData()
    
    if (user?.id) {
      const status = premiumCodesService.getUserPremiumStatus(user.id)
      setPremiumStatus(status)
      // Si une activation vient d'arriver via storage/postMessage, afficher un message succès une seule fois
      const flag = sessionStorage.getItem('atiha_show_activation_success')
      if (flag === '1' && status.isPremium) {
        setJustActivated(true)
        sessionStorage.removeItem('atiha_show_activation_success')
        // Effacer automatiquement après quelques secondes
        setTimeout(() => setJustActivated(false), 5000)
      }
      loadActivatedCodesThisMonth()
    }
  }, [user?.id])

  // Charger les données d'abonnement depuis la base de données
  const loadSubscriptionData = async () => {
    try {
      setIsLoadingPlans(true)
      
      // Charger les plans d'abonnement
      const plans = await SubscriptionPlanClientService.getAllPlans()
      setSubscriptionPlans(plans)
      
      // Charger les liens de paiement
      const links = await PaymentLinkClientService.getAllLinks()
      setPaymentLinks(links)
    } catch (error) {
      logger.error('Error loading subscription data', error as Error)
      // Fallback vers localStorage si la base de données n'est pas disponible
      const savedPlans = localStorage.getItem('atiha_subscription_plans')
      if (savedPlans) {
        try {
          const plans = JSON.parse(savedPlans)
          setSubscriptionPlans([plans.individuel, plans.famille].filter(Boolean))
        } catch (e) {
          logger.error('Error parsing saved plans', e as Error)
        }
      }
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const loadActivatedCodesThisMonth = () => {
    if (!user?.id) return

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Récupérer tous les codes premium
    const allCodes = premiumCodesService.getAllCodes()
    
    // Filtrer les codes utilisés par cet utilisateur ce mois-ci
    const userCodesThisMonth = allCodes.filter(code => {
      if (!code.usedBy.includes(user.id)) return false
      
      // Trouver la date d&apos;activation pour cet utilisateur
      const userIndex = code.usedBy.indexOf(user.id)
      if (userIndex === -1) return false
      
      const activationDate = new Date(code.usedAt[userIndex])
      return activationDate >= firstDayOfMonth && activationDate <= lastDayOfMonth
    }).map(code => {
      const userIndex = code.usedBy.indexOf(user.id)
      return {
        ...code,
        activatedAt: code.usedAt[userIndex],
        userIndex
      }
    }).sort((a, b) => new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime())

    setActivatedCodesThisMonth(userCodesThisMonth)
  }

  const handleActivateCode = async () => {
    if (!premiumCode.trim() || !user?.id) return

    setIsActivating(true)
    setActivationMessage('')

    try {
      const result = premiumCodesService.activateCode(premiumCode.trim(), user.id)
      
      if (result.success) {
        setActivationMessage(result.message)
        setPremiumCode('')
        // Recharger le statut premium
        const newStatus = premiumCodesService.getUserPremiumStatus(user.id)
        setPremiumStatus(newStatus)
        // Recharger l&apos;historique des codes activés
        loadActivatedCodesThisMonth()
      } else {
        setActivationMessage(result.message)
      }
    } catch (error) {
      setActivationMessage('Erreur lors de l\'activation du code')
    } finally {
      setIsActivating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePaymentClick = () => {
    setIsPaymentModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsPaymentModalOpen(false)
  }

  const handleProceedToPayment = async (planType: string) => {
    setSelectedPlanType(planType)
    
    const paymentUrl = await getPaymentUrl(planType)
    
    // Vérifier si l'URL de paiement est vide
    if (!paymentUrl || paymentUrl.trim() === '') {
      // Afficher une notification centrée au lieu d'un alert
      setShowNoPaymentNotification(true)
      // Masquer automatiquement après 5 secondes
      setTimeout(() => setShowNoPaymentNotification(false), 5000)
      return
    }
    
    // Fermer le modal de sélection
    setIsPaymentModalOpen(false)
    
    // Ouvrir directement la page de paiement dans un nouvel onglet
    window.open(paymentUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCloseIframeModal = () => {
    setIsIframeModalOpen(false)
    setIsPaymentModalOpen(true) // Revenir au modal de sélection d&apos;abonnement
    // Ne pas réinitialiser selectedPlanType pour garder la sélection
  }

  // Écouter les messages envoyés par la page de paiement (dans l'iframe)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event?.data || typeof event.data !== 'object') return
      const { type } = event.data
      if (type === 'ATIHA_PAYMENT_SUCCESS_PAGE_LOADED') {
        // Optionnel: on pourrait afficher un statut
      }
      if (type === 'ATIHA_PAYMENT_SUCCESS') {
        // Fermer l'iframe et rafraîchir le statut premium
        setIsIframeModalOpen(false)
        setIsPaymentModalOpen(false)
        if (user?.id) {
          const newStatus = premiumCodesService.getUserPremiumStatus(user.id)
          setPremiumStatus(newStatus)
          loadActivatedCodesThisMonth()
        }
        sessionStorage.setItem('atiha_show_activation_success', '1')
        // Rediriger la fenêtre principale hors du modal
        try {
          window.location.href = '/subscription'
        } catch (_) {}
      }
    }

    window.addEventListener('message', handleMessage)
    // Écouter aussi l'événement storage (ex: si payment-success est servi depuis un autre contexte)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'atiha_payment_success' && e.newValue) {
        setIsIframeModalOpen(false)
        setIsPaymentModalOpen(false)
        if (user?.id) {
          const newStatus = premiumCodesService.getUserPremiumStatus(user.id)
          setPremiumStatus(newStatus)
          loadActivatedCodesThisMonth()
        }
        sessionStorage.setItem('atiha_show_activation_success', '1')
        // Rediriger également au tableau de bord
        try {
          window.location.href = '/subscription'
        } catch (_) {}
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('storage', handleStorage)
    }
  }, [user?.id])

  // Fonction pour obtenir les informations du plan depuis la base de données
  const getPlanInfo = (planType: string) => {
    // Chercher le plan dans les données chargées
    const plan = subscriptionPlans.find((p: any) => p.type === planType && p.isActive)
    
    if (plan) {
      return {
        title: plan.title,
        period: plan.period,
        price: plan.price,
        commitment: plan.commitment,
        description: plan.description,
        features: Array.isArray(plan.features) ? plan.features : [],
        buttonText: plan.buttonText,
        buttonColor: plan.buttonColor
      }
    }
    
    // Fallback vers localStorage si pas trouvé dans la DB
    try {
      const savedPlans = localStorage.getItem('atiha_subscription_plans')
      if (savedPlans) {
        const plans = JSON.parse(savedPlans)
        switch (planType) {
          case 'famille':
            return plans.famille || getDefaultPlan('famille')
          case 'individuel':
            return plans.individuel || getDefaultPlan('individuel')
          default:
            return plans.individuel || getDefaultPlan('individuel')
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des informations du plan', error as Error)
    }
    
    // Fallback vers les valeurs par défaut
    return getDefaultPlan(planType)
  }

  // Fonction helper pour les valeurs par défaut
  const getDefaultPlan = (planType: string) => {
    switch (planType) {
      case 'famille':
        return {
          title: 'Famille',
          period: 'Mensuel',
          price: '2999 fcfa/mois',
          commitment: 'Sans engagement',
          description: 'Ajoutez jusqu\'à 5 membres de votre famille (âgés de 13 ans et plus) à votre foyer.',
          features: ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
          buttonText: 'Passer au paiement',
          buttonColor: '#10B981'
        }
      case 'individuel':
      default:
        return {
          title: 'Individuel',
          period: 'Mensuel',
          price: '1999 fcfa/mois',
          commitment: 'Sans engagement',
          features: ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
          buttonText: 'Passer au paiement',
          buttonColor: '#3B82F6'
        }
    }
  }

  // Fonction pour obtenir la couleur du bouton selon le type de plan
  const getButtonColor = (planType: string) => {
    const plan = subscriptionPlans.find((p: any) => p.type === planType && p.isActive)
    if (plan?.buttonColor) {
      return plan.buttonColor
    }
    
    // Fallback vers localStorage
    try {
      const savedPlans = localStorage.getItem('atiha_subscription_plans')
      if (savedPlans) {
        const plans = JSON.parse(savedPlans)
        switch (planType) {
          case 'famille':
            return plans.famille?.buttonColor || '#10B981'
          case 'individuel':
            return plans.individuel?.buttonColor || '#3B82F6'
          default:
            return plans.individuel?.buttonColor || '#3B82F6'
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des couleurs', error as Error)
    }
    
    // Fallback vers les couleurs par défaut
    switch (planType) {
      case 'famille':
        return '#10B981'
      case 'individuel':
        return '#3B82F6'
      default:
        return '#3B82F6'
    }
  }

  // Fonction pour obtenir l'URL de paiement selon le type de plan
  const getPaymentUrl = async (planType: string): Promise<string> => {
    try {
      // Chercher dans les liens de paiement chargés depuis la base de données
      const paymentLink = paymentLinks.find((l: any) => l.planType === planType && l.isActive)
      if (paymentLink?.url) {
        return paymentLink.url
      }
      
      // Essayer de charger depuis l'API si pas encore chargé
      const link = await PaymentLinkClientService.getActivePaymentUrl(planType as 'individuel' | 'famille')
      if (link) {
        // Mettre à jour le cache local
        setPaymentLinks(prev => {
          const existing = prev.find((l: any) => l.planType === planType)
          if (existing) {
            return prev.map((l: any) => l.planType === planType ? { ...l, url: link } : l)
          }
          return [...prev, { planType, url: link, isActive: true }]
        })
        return link
      }
      
      // Fallback : utiliser SecureStorage/localStorage
      try {
        const paymentLinksStorage = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_payment_links')
        const paymentLinksActive = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_payment_links_active')
        
        if (paymentLinksStorage && paymentLinksActive) {
          if (planType === 'individuel' && paymentLinksActive.individuel && paymentLinksStorage.individuel) {
            return paymentLinksStorage.individuel
          } else if (planType === 'famille' && paymentLinksActive.famille && paymentLinksStorage.famille) {
            return paymentLinksStorage.famille
          }
        }
        
        // Fallback : utiliser les anciens plans si pas d'URL configurée
        const savedPlansStr = localStorage.getItem('atiha_subscription_plans')
        if (savedPlansStr) {
          const plans = JSON.parse(savedPlansStr)
          switch (planType) {
            case 'famille':
              return plans.famille?.paymentUrl || ''
            case 'individuel':
              return plans.individuel?.paymentUrl || ''
            default:
              return plans.individuel?.paymentUrl || ''
          }
        }
      } catch (error) {
        logger.error('Error reading payment links from storage', error as Error)
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des URLs de paiement', error as Error)
    }
    
    // Pas de fallback - retourner une chaîne vide si aucun lien n'est configuré
    return ''
  }

  const getCurrentMonthName = () => {
    const now = new Date()
    return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  // Fonction pour masquer un code premium
  const maskCode = (code: string) => {
    if (code.length <= 4) return '••••'
    return code.substring(0, 2) + '••••••••' + code.substring(code.length - 2)
  }

  const formatActivationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'inscription': return 'Inscription'
      case 'individuel': return 'Individuel'
      case 'famille': return 'Famille'
      case 'individuel-annuel': return 'Individuel Annuel'
      case 'famille-annuel': return 'Famille Annuel'
      case 'plan-premium': return 'Plan Premium'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inscription': return 'bg-green-900 text-green-300'
      case 'individuel': return 'bg-blue-900 text-blue-300'
      case 'famille': return 'bg-purple-900 text-purple-300'
      case 'individuel-annuel': return 'bg-orange-900 text-orange-300'
      case 'famille-annuel': return 'bg-red-900 text-red-300'
      case 'plan-premium': return 'bg-yellow-900 text-yellow-300'
      default: return 'bg-gray-900 text-gray-300'
    }
  }

  // Composant pour le contenu de l'iframe de paiement
  const PaymentIframeContent = ({ planType }: { planType: string }) => {
    const [paymentUrl, setPaymentUrl] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const loadPaymentUrl = async () => {
        if (!planType) {
          setIsLoading(false)
          return
        }
        
        try {
          setIsLoading(true)
          // Utiliser directement PaymentLinkClientService pour éviter la dépendance circulaire
          const url = await PaymentLinkClientService.getActivePaymentUrl(planType as 'individuel' | 'famille')
          if (url) {
            setPaymentUrl(url)
          } else {
            // Fallback vers SecureStorage
            try {
              const paymentLinksStorage = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_payment_links')
              const paymentLinksActive = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_payment_links_active')
              
              if (paymentLinksStorage && paymentLinksActive) {
                if (planType === 'individuel' && paymentLinksActive.individuel && paymentLinksStorage.individuel) {
                  setPaymentUrl(paymentLinksStorage.individuel)
                } else if (planType === 'famille' && paymentLinksActive.famille && paymentLinksStorage.famille) {
                  setPaymentUrl(paymentLinksStorage.famille)
                }
              }
            } catch (e) {
              logger.error('Error reading payment links from storage', e as Error)
            }
          }
        } catch (error) {
          logger.error('Error loading payment URL', error as Error)
        } finally {
          setIsLoading(false)
        }
      }

      loadPaymentUrl()
    }, [planType])

    if (isLoading) {
      return (
        <div className="bg-dark-300 rounded-lg shadow-lg overflow-hidden h-full flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Chargement du paiement...</p>
          </div>
        </div>
      )
    }

    if (paymentUrl) {
      return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
          <iframe
            src={paymentUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0, overflow: 'auto' }}
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      )
    }

    return (
      <div className="bg-dark-300 rounded-lg shadow-lg overflow-hidden h-full flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-400 text-lg mb-2">Aucun moyen de paiement intégré</p>
          <p className="text-gray-500 text-sm">Le paiement n'est pas disponible pour le moment.</p>
        </div>
      </div>
    )
  }

  const renderSubscriptionContent = () => (
    <div className="space-y-6">
      {/* Statut Premium */}
      {premiumStatus.isPremium ? (
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Premium Actif</h3>
              <p className="text-sm sm:text-base text-green-100">
                {(() => {
                  try {
                    const savedPremiumInfo = localStorage.getItem('atiha_premium_info')
                    if (savedPremiumInfo) {
                      const parsed = JSON.parse(savedPremiumInfo)
                      return parsed.description || 'Accès illimité à tous nos contenus'
                    }
                  } catch (error) {
                    logger.error('Erreur lors du chargement des informations premium', error as Error)
                  }
                  return 'Accès illimité à tous nos contenus'
                })()}
              </p>
            </div>
          </div>
          {premiumStatus.expiresAt && (
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-green-100 text-sm">
                Votre abonnement premium expire le <span className="font-semibold">{formatDate(premiumStatus.expiresAt)}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="rounded-lg p-6 text-white"
          style={isClient ? {
            background: `linear-gradient(to right, ${content.appIdentity.colors.primary}, ${content.appIdentity.colors.secondary})`
          } : {
            background: 'linear-gradient(to right, #3B82F6, #1E40AF)'
          }}
        >
          <h3 className="text-lg sm:text-xl font-bold mb-2">
            {(() => {
              try {
                const savedPremiumInfo = localStorage.getItem('atiha_premium_info')
                if (savedPremiumInfo) {
                  const parsed = JSON.parse(savedPremiumInfo)
                  return parsed.title || 'Plan Premium'
                }
              } catch (error) {
                logger.error('Erreur lors du chargement des informations premium', error as Error)
              }
              return 'Plan Premium'
            })()}
          </h3>
          <p className="text-sm sm:text-base text-white/80 mb-4">
            {(() => {
              try {
                const savedPremiumInfo = localStorage.getItem('atiha_premium_info')
                if (savedPremiumInfo) {
                  const parsed = JSON.parse(savedPremiumInfo)
                  return parsed.description || 'Accès illimité à tous nos contenus'
                }
              } catch (error) {
                logger.error('Erreur lors du chargement des informations premium', error as Error)
              }
              return 'Accès illimité à tous nos contenus'
            })()}
          </p>

          {/* Partenaires de Paiement */}
          {(() => {
            try {
              const savedPaymentPartners = localStorage.getItem('atiha_premium_payment_partners')
              if (savedPaymentPartners) {
                const parsed = JSON.parse(savedPaymentPartners)
                if (parsed.isVisible && parsed.items && parsed.items.filter((item: any) => item.isVisible && item.logoUrl).length > 0) {
                  return (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      {parsed.title && (
                        <p className="text-xs text-white/70 mb-3 text-center">
                          {parsed.title}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {parsed.items
                          .filter((item: any) => item.isVisible && item.logoUrl)
                          .map((partner: any) => (
                            <img
                              key={partner.id}
                              src={partner.logoUrl}
                              alt="Logo partenaire de paiement"
                              className="h-6 sm:h-8 object-contain opacity-90 hover:opacity-100 transition-opacity"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  )
                }
              }
            } catch (error) {
              logger.error('Erreur lors du chargement des partenaires de paiement', error as Error)
            }
            return null
          })()}

          <div className="space-y-3">
            <div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold">{subscriptionPriceService.getFormattedPrice()}</span>
            </div>
            <button
              onClick={handlePaymentClick}
              className="w-full px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm md:text-base bg-white rounded-lg font-bold hover:bg-gray-100 transition-colors"
              style={isClient ? {
                color: content.appIdentity.colors.primary
              } : {
                color: '#3B82F6'
              }}
            >
              Payer maintenant
            </button>
          </div>
        </div>
      )}

      {/* Activation Code Premium */}
      <div className="bg-dark-300 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
          >
            <KeyIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-white">Code Premium</h4>
            <p className="text-gray-400 text-xs sm:text-sm">Activez votre code premium pour accéder au contenu exclusif</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Entrez votre code premium
            </label>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <input
                type="text"
                value={premiumCode}
                onChange={(e) => setPremiumCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123DEF456"
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-dark-200 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent"
                style={isClient ? {
                  '--tw-ring-color': content.appIdentity.colors.primary
                } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                onFocus={(e) => {
                  if (isClient) {
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                }}
                maxLength={12}
              />
              <button
                onClick={handleActivateCode}
                disabled={!premiumCode.trim() || isActivating}
                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                style={isClient ? { 
                  backgroundColor: content.appIdentity.colors.primary,
                  '--hover-color': content.appIdentity.colors.secondary
                } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
                onMouseEnter={(e) => {
                  if (isClient && !e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClient && !e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                  }
                }}
              >
                {isActivating ? 'Activation...' : 'Activer'}
              </button>
            </div>
          </div>

          {activationMessage && (
            <div className={`p-4 rounded-lg ${
              activationMessage.includes('succès') 
                ? 'bg-green-900/50 border border-green-700 text-green-300' 
                : 'bg-red-900/50 border border-red-700 text-red-300'
            }`}>
              <div className="flex items-center space-x-2">
                {activationMessage.includes('succès') ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
                <span>{activationMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Codes Premium Activés - Historique du mois */}
      <div className="bg-dark-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base sm:text-lg font-semibold text-white">Codes Premium Activés</h4>
          <span className="text-xs sm:text-sm text-gray-400">{getCurrentMonthName()}</span>
        </div>
        
        
        <div className="space-y-3">
          {activatedCodesThisMonth.length > 0 ? (
            activatedCodesThisMonth.map((code, index) => (
              <div key={code.id} className="flex items-center justify-between py-3 px-4 bg-dark-200 rounded-lg border border-gray-600">
                <div className="flex-1">
                  <div className="mb-2">
                    <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${getTypeColor(code.type)}`}>
                      {getTypeDisplayName(code.type)}
                    </span>
                  </div>
                  <code className="text-sm font-mono bg-dark-400 px-2 py-1 rounded text-gray-300 mb-2">
                    {maskCode(code.code)}
                  </code>
                  <p className="text-gray-400 text-sm">
                    Activé le {formatActivationDate(code.activatedAt)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Expire le {new Date(code.expiresAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    new Date(code.expiresAt) > new Date() ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    new Date(code.expiresAt) > new Date() ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {new Date(code.expiresAt) > new Date() ? 'Actif' : 'Expiré'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 mb-2">Aucun code activé</p>
              <p className="text-gray-500 text-sm">Activez un code premium pour voir vos codes activés</p>
            </div>
          )}
        </div>

        {/* Note sur la réinitialisation */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <p className="text-blue-300 text-xs">
            💡 L&apos;historique se réinitialise automatiquement chaque premier jour du mois
          </p>
        </div>
      </div>
    </div>
  )

  // Modal iframe de paiement
  const renderIframeModal = () => {
    if (!isIframeModalOpen) return null

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-gradient-to-br from-dark-400 via-dark-300 to-dark-500 rounded-xl w-[90vw] h-[90vh] overflow-hidden shadow-2xl border border-gray-600">
          {/* Fond décoratif */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-green-500/10 rounded-xl"></div>
          
          {/* Motifs décoratifs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl"></div>
          
          {/* Contenu du modal */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header du modal iframe */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600/50 bg-gradient-to-r from-dark-400/50 to-dark-300/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <h2 className="text-xl font-bold text-white">Paiement sécurisé</h2>
              </div>
              <button
                onClick={handleCloseIframeModal}
                className="w-8 h-8 rounded-full border border-gray-400 hover:border-white flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-dark-500/50 hover:bg-dark-400/50 flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu iframe avec fond - occupe tout l'espace restant */}
            <div className="flex-1 p-4 bg-gradient-to-br from-gray-900/30 to-dark-400/30">
              <PaymentIframeContent planType={selectedPlanType} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modal de paiement
  const renderPaymentModal = () => {
    if (!isPaymentModalOpen) return null

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-dark-400 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header du modal */}
          <div className="flex items-center justify-between p-6">
            <h2 className="text-2xl font-bold text-white">Choisissez votre abonnement</h2>
            <button
              onClick={handleCloseModal}
              className="w-8 h-8 rounded-full border border-gray-400 hover:border-white flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Ligne de séparateur réduite */}
          <div className="flex justify-center">
            <div className="w-[93%] border-t border-gray-600"></div>
          </div>

          {/* Contenu du modal */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan Individuel */}
              <div className="bg-dark-300 rounded-lg p-6 border border-gray-600">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getButtonColor('individuel') }}
                  >
                    <span className="text-white text-sm">👤</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{getPlanInfo('individuel').title}</h3>
                </div>
                
                <div className="border-t border-gray-600 pt-4 mb-4">
                  <p className="text-gray-300 text-sm mb-2">{getPlanInfo('individuel').period}</p>
                  <p className="text-3xl font-bold text-white mb-2">{getPlanInfo('individuel').price}</p>
                  <p className="text-white mb-2">{getPlanInfo('individuel').commitment}</p>
                  {getPlanInfo('individuel').features.map((feature: string, index: number) => (
                    <p key={index} className="text-gray-400 text-sm">{feature}</p>
                  ))}
                </div>

                <button
                  onClick={() => handleProceedToPayment('individuel')}
                  className="w-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white font-bold rounded-lg transition-colors hover:opacity-90"
                  style={{ 
                    backgroundColor: getButtonColor('individuel'),
                    '--hover-color': getButtonColor('individuel')
                  } as React.CSSProperties}
                >
                  {getPlanInfo('individuel').buttonText}
                </button>
              </div>

              {/* Plan Famille */}
              <div className="bg-dark-300 rounded-lg p-6 border border-gray-600">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getButtonColor('famille') }}
                  >
                    <span className="text-white text-sm">👥</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{getPlanInfo('famille').title}</h3>
                </div>
                
                <div className="border-t border-gray-600 pt-4 mb-4">
                  <p className="text-gray-300 text-sm mb-2">{getPlanInfo('famille').period}</p>
                  <p className="text-3xl font-bold text-white mb-2">{getPlanInfo('famille').price}</p>
                  <p className="text-white mb-2">{getPlanInfo('famille').commitment}</p>
                  {getPlanInfo('famille').description && (
                    <p className="text-white text-sm mb-2">
                      {getPlanInfo('famille').description}
                    </p>
                  )}
                  {getPlanInfo('famille').features.map((feature: string, index: number) => (
                    <p key={index} className="text-gray-400 text-sm">{feature}</p>
                  ))}
                </div>

                <button
                  onClick={() => handleProceedToPayment('famille')}
                  className="w-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white font-bold rounded-lg transition-colors hover:opacity-90"
                  style={{ 
                    backgroundColor: getButtonColor('famille'),
                    '--hover-color': getButtonColor('famille')
                  } as React.CSSProperties}
                >
                  {getPlanInfo('famille').buttonText}
                </button>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="mt-6 p-4 bg-dark-200 rounded-lg">
              <p className="text-gray-300 text-sm text-center">
                {(() => {
                  // Chercher dans les plans chargés (si un disclaimer est stocké dans les plans)
                  // Pour l'instant, utiliser le texte par défaut
                  // TODO: Ajouter un champ disclaimer dans le modèle SubscriptionPlan si nécessaire
                  try {
                    const savedPlans = localStorage.getItem('atiha_subscription_plans')
                    if (savedPlans) {
                      const plans = JSON.parse(savedPlans)
                      return plans.disclaimer || 'Annulez à tout moment. Votre abonnement sans engagement commence dès votre inscription.'
                    }
                  } catch (error) {
                    logger.error('Erreur lors du chargement du disclaimer', error as Error)
                  }
                  return 'Annulez à tout moment. Votre abonnement sans engagement commence dès votre inscription.'
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="bg-dark-400/50 backdrop-blur-sm border-b border-gray-700">
          <div className="px-6 py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Retour</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link href="/" className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                  >
                    <PlayIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
                </Link>
                <HeaderStatusIndicator />
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {justActivated && (
              <div className="mb-6 p-4 rounded-lg bg-green-900/40 border border-green-700 text-green-300">
                <div className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5" />
                  <span>Votre plan premium a été activé avec succès.</span>
                </div>
              </div>
            )}
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Abonnement</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Gérez votre abonnement premium et vos codes d&apos;activation
              </p>
            </div>

            {/* Subscription Content */}
            <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
              {renderSubscriptionContent()}
            </div>
          </div>
        </main>

        {/* Modal de paiement */}
        {renderPaymentModal()}
        
        {/* Modal iframe de paiement */}
        {renderIframeModal()}

        {/* Notification centrée pour absence de moyen de paiement */}
        {showNoPaymentNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-dark-400 rounded-2xl border border-gray-700 shadow-2xl p-6 max-w-md mx-4 transform transition-all">
              <div className="text-center">
                <div className="mb-4">
                  <XMarkIcon className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun moyen de paiement intégré</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Le paiement n'est pas disponible pour le moment.
                </p>
                <button
                  onClick={() => setShowNoPaymentNotification(false)}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : {}}
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
