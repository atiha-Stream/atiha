'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { PlayIcon, ArrowLeftIcon, PlusIcon, ClipboardDocumentIcon, TrashIcon, CheckIcon, XMarkIcon, UserIcon, KeyIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { premiumCodesService, PremiumCode } from '@/lib/premium-codes-service'
import { subscriptionPriceService, SubscriptionPrice } from '@/lib/subscription-price-service'
import SubscriptionPlanClientService from '@/lib/subscription-plan-client-service'
import PaymentLinkClientService from '@/lib/payment-link-client-service'
import PostPaymentLinkService from '@/lib/post-payment-link-client-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { SecureStorage } from '@/lib/secure-storage'
import { logger } from '@/lib/logger'

export default function PremiumCodesPage() {
  const { admin } = useAdminAuth()
  const [codes, setCodes] = useState<PremiumCode[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0,
    expiredCodes: 0,
    totalUsers: 0
  })
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [subscriptionPrice, setSubscriptionPrice] = useState<SubscriptionPrice>({
    amount: '1499',
    currency: 'fcfa',
    period: 'mois',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  })
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [priceForm, setPriceForm] = useState({
    amount: '1499',
    currency: 'fcfa',
    period: 'mois'
  })
  const [premiumInfo, setPremiumInfo] = useState({
    title: 'Plan Premium',
    description: 'Accès illimité à tous nos contenus'
  })
  const [paymentPartners, setPaymentPartners] = useState({
    isVisible: true,
    title: 'Partenaires de paiement',
    items: [
      {
        id: 'visa',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
        isVisible: true
      },
      {
        id: 'mastercard',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/2560px-Mastercard-logo.svg.png',
        isVisible: true
      },
      {
        id: 'paypal',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png',
        isVisible: true
      }
    ]
  })
  const [codeForm, setCodeForm] = useState({
    type: 'individuel' as 'inscription' | 'inscription-flexible' | 'individuel' | 'famille' | 'individuel-annuel' | 'famille-annuel' | 'plan-premium' | 'post-payment-individuel' | 'post-payment-famille' | 'post-payment-individuel-annuel' | 'post-payment-famille-annuel' | 'post-payment-individuel-flexible' | 'post-payment-famille-flexible',
    startsAt: '',
    expiresAt: '',
    flexibleExpiration: false,
    customExpirationDays: 5
  })
  const [showCodeForm, setShowCodeForm] = useState(false)
  
  // États pour la gestion des types d&apos;abonnement
  const [subscriptionPlans, setSubscriptionPlans] = useState({
    mainTitle: 'Choisissez votre abonnement',
    individuel: {
      title: 'Individuel',
      period: 'Mensuel',
      price: '1999 fcfa/mois',
      commitment: 'Sans engagement',
      description: '',
      features: ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
      buttonText: 'Passer au paiement',
      paymentUrl: '',
      buttonColor: '#3B82F6'
    },
    famille: {
      title: 'Famille',
      period: 'Mensuel',
      price: '2999 fcfa/mois',
      commitment: 'Sans engagement',
      description: 'Ajoutez jusqu\'à 5 membres de votre famille (âgés de 13 ans et plus) à votre foyer.',
      features: ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
      buttonText: 'Passer au paiement',
      paymentUrl: '',
      buttonColor: '#10B981'
    },
    disclaimer: 'Annulez à tout moment. Votre abonnement sans engagement commence dès votre inscription.'
  })
  
  // États pour la gestion des notifications d&apos;abonnement
  const [subscriptionNotifications, setSubscriptionNotifications] = useState({
    essaiGratuit: {
      title: 'Essai gratuit activé !',
      description: 'Profitez de 5 jours d\'accès premium gratuit dès votre inscription !'
    },
    bienvenue: {
      title: '🎉 Bienvenue !',
      subtitle: 'Votre compte est désormais activé',
      sectionTitle: 'Essai Premium Gratuit',
      sectionDescription: 'Vous profitez de 5 jours d\'accès illimité à tout notre catalogue premium',
      features: [
        'Accès complet à tout le catalogue',
        'Téléchargements disponibles hors ligne',
        'Qualité HD / 4K'
      ],
      buttonText: 'Découvrir notre catalogue'
    },
    inscriptionReussie: {
      title: 'Inscription réussie !',
      subtitle: 'Compte créé avec succès',
      description: 'Votre compte a été créé avec succès. Commencez à explorer notre collection !',
      buttonText: 'Continuer'
    },
    contenuPremium: {
      title: 'Contenu Premium',
      subtitle: 'Abonnement requis',
      sectionTitle: 'Accès Premium Requis',
      sectionDescription: 'Ce contenu nécessite un abonnement premium pour être regardé.',
      features: [
        'Accès à tous les contenus premium',
        'Téléchargements hors ligne',
        'Qualité HD/4K'
      ],
      cancelButton: 'Annuler',
      subscribeButton: 'Activer mon abonnement'
    }
  })
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)
  const [isUpdatingPlans, setIsUpdatingPlans] = useState(false)
  const [isSubscriptionPlansCollapsed, setIsSubscriptionPlansCollapsed] = useState(false)
  const [isSubscriptionPriceCollapsed, setIsSubscriptionPriceCollapsed] = useState(false)
  const [isNotificationsCollapsed, setIsNotificationsCollapsed] = useState(false)
  const [showSubscriptionButton, setShowSubscriptionButton] = useState(true)
  
  // États pour les liens après paiement
  const [postPaymentLinks, setPostPaymentLinks] = useState({
    individuel: '',
    famille: ''
  })
  const [postPaymentLinksActive, setPostPaymentLinksActive] = useState({
    individuel: false,
    famille: false
  })
  const [isUpdatingPostPaymentLinks, setIsUpdatingPostPaymentLinks] = useState(false)
  const [isPostPaymentLinksCollapsed, setIsPostPaymentLinksCollapsed] = useState(false)
  
  // États pour les liens de paiement
  const [paymentLinks, setPaymentLinks] = useState({
    individuel: '',
    famille: ''
  })
  const [paymentLinksActive, setPaymentLinksActive] = useState({
    individuel: false,
    famille: false
  })
  const [isUpdatingPaymentLinks, setIsUpdatingPaymentLinks] = useState(false)
  
  // États pour les codes après paiement
  const [postPaymentCodes, setPostPaymentCodes] = useState({
    individuel30j: '',
    individuel1an: '',
    famille30j: '',
    famille1an: ''
  })
  const [postPaymentCodesActive, setPostPaymentCodesActive] = useState({
    individuel30j: false,
    individuel1an: false,
    famille30j: false,
    famille1an: false
  })
  const [isUpdatingPostPaymentCodes, setIsUpdatingPostPaymentCodes] = useState(false)
  const [isPostPaymentCodesCollapsed, setIsPostPaymentCodesCollapsed] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Charger l'option d'affichage du bouton Abonnement
    try {
      const savedOption = SecureStorage.getItem('atiha_show_subscription_button')
      if (savedOption !== null) {
        setShowSubscriptionButton(savedOption === 'true')
      } else {
        // Par défaut, le bouton est visible
        setShowSubscriptionButton(true)
        SecureStorage.setItem('atiha_show_subscription_button', 'true')
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de l\'option d\'affichage du bouton Abonnement', error as Error)
      setShowSubscriptionButton(true)
    }
  }, [])

  useEffect(() => {
    loadCodes()
    loadStats()
    loadSubscriptionPrice()
    loadSubscriptionPlans()
    loadSubscriptionNotifications()
    loadPostPaymentLinks()
    loadPaymentLinks()
    loadPostPaymentCodes()
    // Note: Les fonctions loadSubscriptionPlans, loadPostPaymentLinks, loadPaymentLinks sont maintenant async
    // mais useEffect ne peut pas être async, donc elles sont appelées sans await
  }, [])

  const loadCodes = () => {
    const allCodes = premiumCodesService.getAllCodes()
    setCodes(allCodes.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()))
  }

  const loadStats = () => {
    setStats(premiumCodesService.getStats())
  }

  const loadSubscriptionPrice = () => {
    const currentPrice = subscriptionPriceService.getCurrentPrice()
    setSubscriptionPrice(currentPrice)
    setPriceForm({
      amount: currentPrice.amount,
      currency: currentPrice.currency,
      period: currentPrice.period
    })
    
    // Charger les informations premium sauvegardées
    try {
      const savedPremiumInfo = localStorage.getItem('atiha_premium_info')
      if (savedPremiumInfo) {
        const parsed = JSON.parse(savedPremiumInfo)
        setPremiumInfo({
          title: parsed.title || 'Plan Premium',
          description: parsed.description || 'Accès illimité à tous nos contenus'
        })
      }
      
      // Charger les partenaires de paiement sauvegardés
      const savedPaymentPartners = localStorage.getItem('atiha_premium_payment_partners')
      if (savedPaymentPartners) {
        const parsed = JSON.parse(savedPaymentPartners)
        setPaymentPartners(parsed)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des informations premium', error as Error)
    }
  }

  const generateNewCode = async () => {
    if (!showCodeForm) {
      setShowCodeForm(true)
      return
    }

    // Validation des dates si elles sont fournies
    if (codeForm.startsAt && codeForm.expiresAt) {
      const startDate = new Date(codeForm.startsAt)
      const endDate = new Date(codeForm.expiresAt)
      
      if (startDate >= endDate) {
        alert('La date de fin doit être après la date de début')
        return
      }
    }

    setIsGenerating(true)
    try {
      // Déterminer si c'est un code flexible selon le type
      const isFlexible = codeForm.type === 'post-payment-individuel-flexible' || codeForm.type === 'post-payment-famille-flexible' || codeForm.type === 'inscription-flexible'
      
      // Validation pour inscription-flexible
      if (codeForm.type === 'inscription-flexible') {
        if (!codeForm.customExpirationDays || codeForm.customExpirationDays < 1) {
          alert('Veuillez entrer un nombre de jours valide (minimum 1 jour)')
          setIsGenerating(false)
          return
        }
      }
      
      const newCode = premiumCodesService.generatePremiumCode(
        admin?.email || 'admin',
        codeForm.type as 'inscription' | 'inscription-flexible' | 'individuel' | 'famille' | 'individuel-annuel' | 'famille-annuel' | 'plan-premium' | 'post-payment-individuel' | 'post-payment-famille' | 'post-payment-individuel-annuel' | 'post-payment-famille-annuel' | 'post-payment-individuel-flexible' | 'post-payment-famille-flexible',
        codeForm.startsAt || undefined,
        codeForm.expiresAt || undefined,
        isFlexible || codeForm.flexibleExpiration,
        codeForm.type === 'inscription-flexible' ? codeForm.customExpirationDays : undefined
      )
      loadCodes()
      loadStats()
      
      // Copier automatiquement le nouveau code
      navigator.clipboard.writeText(newCode.code)
      setCopiedCode(newCode.code)
      setTimeout(() => setCopiedCode(null), 3000)
      
      // Réinitialiser le formulaire
      setCodeForm({
        type: 'individuel',
        startsAt: '',
        expiresAt: '',
        flexibleExpiration: false,
        customExpirationDays: 5
      })
      setShowCodeForm(false)
    } catch (error) {
      logger.error('Erreur lors de la génération du code', error as Error)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateSubscriptionPrice = async () => {
    if (!priceForm.amount.trim() || !priceForm.currency.trim() || !priceForm.period.trim()) {
      alert('Veuillez remplir tous les champs')
      return
    }

    setIsUpdatingPrice(true)
    try {
      subscriptionPriceService.updatePrice(
        priceForm.amount,
        priceForm.currency,
        priceForm.period,
        admin?.email || 'admin'
      )
      loadSubscriptionPrice()
      alert('Prix de l\'abonnement mis à jour avec succès!')
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du prix', error as Error)
      alert('Erreur lors de la mise à jour du prix')
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  const updateSubscriptionPlans = async () => {
    setIsUpdatingPlans(true)
    try {
      // Sauvegarder dans la base de données
      const updates: Promise<any>[] = []
      
      if (subscriptionPlans.individuel) {
        updates.push(
          SubscriptionPlanClientService.upsertPlan({
            type: 'individuel',
            title: subscriptionPlans.individuel.title,
            price: subscriptionPlans.individuel.price,
            period: subscriptionPlans.individuel.period,
            commitment: subscriptionPlans.individuel.commitment,
            description: subscriptionPlans.individuel.description,
            features: subscriptionPlans.individuel.features,
            buttonText: subscriptionPlans.individuel.buttonText,
            buttonColor: subscriptionPlans.individuel.buttonColor,
            paymentUrl: subscriptionPlans.individuel.paymentUrl,
            isActive: true
          })
        )
      }
      
      if (subscriptionPlans.famille) {
        updates.push(
          SubscriptionPlanClientService.upsertPlan({
            type: 'famille',
            title: subscriptionPlans.famille.title,
            price: subscriptionPlans.famille.price,
            period: subscriptionPlans.famille.period,
            commitment: subscriptionPlans.famille.commitment,
            description: subscriptionPlans.famille.description,
            features: subscriptionPlans.famille.features,
            buttonText: subscriptionPlans.famille.buttonText,
            buttonColor: subscriptionPlans.famille.buttonColor,
            paymentUrl: subscriptionPlans.famille.paymentUrl,
            isActive: true
          })
        )
      }
      
      await Promise.all(updates)
      
      // Sauvegarder aussi dans localStorage comme backup
      localStorage.setItem('atiha_subscription_plans', JSON.stringify(subscriptionPlans))
      
      alert('Plans d\'abonnement mis à jour avec succès!')
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des plans', error as Error)
      alert('Erreur lors de la mise à jour des plans')
    } finally {
      setIsUpdatingPlans(false)
    }
  }

  const loadSubscriptionPlans = async () => {
    try {
      // Charger depuis la base de données
      const plans = await SubscriptionPlanClientService.getAllPlans()
      
      if (plans && plans.length > 0) {
        // Convertir les plans de la DB au format attendu par l'interface
        const plansData: any = {
          mainTitle: 'Choisissez votre abonnement',
          individuel: null,
          famille: null
        }
        
        plans.forEach((plan: any) => {
          if (plan.type === 'individuel') {
            plansData.individuel = {
              title: plan.title,
              period: plan.period,
              price: plan.price,
              commitment: plan.commitment,
              description: plan.description,
              features: Array.isArray(plan.features) ? plan.features : [],
              buttonText: plan.buttonText,
              paymentUrl: plan.paymentUrl || '',
              buttonColor: plan.buttonColor
            }
          } else if (plan.type === 'famille') {
            plansData.famille = {
              title: plan.title,
              period: plan.period,
              price: plan.price,
              commitment: plan.commitment,
              description: plan.description,
              features: Array.isArray(plan.features) ? plan.features : [],
              buttonText: plan.buttonText,
              paymentUrl: plan.paymentUrl || '',
              buttonColor: plan.buttonColor
            }
          }
        })
        
        // Si les plans existent dans la DB, les utiliser
        if (plansData.individuel || plansData.famille) {
          setSubscriptionPlans(plansData)
        } else {
          // Sinon, fallback vers localStorage
          const savedPlans = localStorage.getItem('atiha_subscription_plans')
          if (savedPlans) {
            setSubscriptionPlans(JSON.parse(savedPlans))
          }
        }
      } else {
        // Fallback vers localStorage si pas de plans dans la DB
        const savedPlans = localStorage.getItem('atiha_subscription_plans')
        if (savedPlans) {
          setSubscriptionPlans(JSON.parse(savedPlans))
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des plans', error as Error)
      // Fallback vers localStorage en cas d'erreur
      try {
        const savedPlans = localStorage.getItem('atiha_subscription_plans')
        if (savedPlans) {
          setSubscriptionPlans(JSON.parse(savedPlans))
        }
      } catch (e) {
        logger.error('Erreur lors du chargement depuis localStorage', e as Error)
      }
    }
  }

  const updateSubscriptionNotifications = async () => {
    setIsUpdatingNotifications(true)
    try {
      // Sauvegarder les notifications dans localStorage
      localStorage.setItem('atiha_subscription_notifications', JSON.stringify(subscriptionNotifications))
      alert('Notifications d\'abonnement mises à jour avec succès!')
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des notifications', error as Error)
      alert('Erreur lors de la mise à jour des notifications')
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  const loadSubscriptionNotifications = () => {
    try {
      const savedNotifications = localStorage.getItem('atiha_subscription_notifications')
      if (savedNotifications) {
        setSubscriptionNotifications(JSON.parse(savedNotifications))
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des notifications', error as Error)
    }
  }

  const loadPostPaymentLinks = async () => {
    try {
      // Charger depuis la base de données
      const links = await PostPaymentLinkService.getAllLinks()
      
      if (links && links.length > 0) {
        const linksData: { individuel: string; famille: string } = { individuel: '', famille: '' }
        const activeStates: { individuel: boolean; famille: boolean } = { individuel: false, famille: false }
        
        links.forEach((link: any) => {
          if (link.planType === 'individuel') {
            linksData.individuel = link.url
            activeStates.individuel = link.isActive
          } else if (link.planType === 'famille') {
            linksData.famille = link.url
            activeStates.famille = link.isActive
          }
        })
        
        setPostPaymentLinks(linksData)
        setPostPaymentLinksActive(activeStates)
      } else {
        // Fallback vers SecureStorage
        const savedLinks = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_post_payment_links')
        if (savedLinks) {
          setPostPaymentLinks(savedLinks)
        }
        
        const savedActiveStates = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_post_payment_links_active')
        if (savedActiveStates) {
          setPostPaymentLinksActive(savedActiveStates)
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des liens après paiement', error as Error)
      // Fallback vers SecureStorage en cas d'erreur
      try {
        const savedLinks = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_post_payment_links')
        if (savedLinks) {
          setPostPaymentLinks(savedLinks)
        }
        
        const savedActiveStates = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_post_payment_links_active')
        if (savedActiveStates) {
          setPostPaymentLinksActive(savedActiveStates)
        }
      } catch (e) {
        logger.error('Erreur lors du chargement depuis SecureStorage', e as Error)
      }
    }
  }

  const updatePostPaymentLinks = async () => {
    setIsUpdatingPostPaymentLinks(true)
    try {
      // Sauvegarder dans la base de données
      const updates: Promise<any>[] = []
      
      if (postPaymentLinks.individuel) {
        updates.push(
          PostPaymentLinkService.upsertLink({
            planType: 'individuel',
            url: postPaymentLinks.individuel,
            isActive: postPaymentLinksActive.individuel
          })
        )
      }
      
      if (postPaymentLinks.famille) {
        updates.push(
          PostPaymentLinkService.upsertLink({
            planType: 'famille',
            url: postPaymentLinks.famille,
            isActive: postPaymentLinksActive.famille
          })
        )
      }
      
      await Promise.all(updates)
      
      // Sauvegarder aussi dans SecureStorage comme backup
      SecureStorage.setItem('atiha_post_payment_links', postPaymentLinks)
      SecureStorage.setItem('atiha_post_payment_links_active', postPaymentLinksActive)
      
      alert('Liens après paiement mis à jour avec succès!')
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des liens', error as Error)
      alert('Erreur lors de la mise à jour des liens')
    } finally {
      setIsUpdatingPostPaymentLinks(false)
    }
  }

  const loadPaymentLinks = async () => {
    try {
      // Charger depuis la base de données
      const links = await PaymentLinkClientService.getAllLinks()
      
      if (links && links.length > 0) {
        const linksData: { individuel: string; famille: string } = { individuel: '', famille: '' }
        const activeStates: { individuel: boolean; famille: boolean } = { individuel: false, famille: false }
        
        links.forEach((link: any) => {
          if (link.planType === 'individuel') {
            linksData.individuel = link.url
            activeStates.individuel = link.isActive
          } else if (link.planType === 'famille') {
            linksData.famille = link.url
            activeStates.famille = link.isActive
          }
        })
        
        setPaymentLinks(linksData)
        setPaymentLinksActive(activeStates)
      } else {
        // Fallback vers SecureStorage
        const savedLinks = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_payment_links')
        if (savedLinks) {
          setPaymentLinks(savedLinks)
        }
        
        const savedActiveStates = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_payment_links_active')
        if (savedActiveStates) {
          setPaymentLinksActive(savedActiveStates)
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des liens de paiement', error as Error)
      // Fallback vers SecureStorage en cas d'erreur
      try {
        const savedLinks = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_payment_links')
        if (savedLinks) {
          setPaymentLinks(savedLinks)
        }
        
        const savedActiveStates = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_payment_links_active')
        if (savedActiveStates) {
          setPaymentLinksActive(savedActiveStates)
        }
      } catch (e) {
        logger.error('Erreur lors du chargement depuis SecureStorage', e as Error)
      }
    }
  }

  const updatePaymentLinks = async () => {
    setIsUpdatingPaymentLinks(true)
    try {
      // Sauvegarder dans la base de données
      const updates: Promise<any>[] = []
      
      if (paymentLinks.individuel) {
        updates.push(
          PaymentLinkClientService.upsertLink({
            planType: 'individuel',
            url: paymentLinks.individuel,
            isActive: paymentLinksActive.individuel,
            createdBy: admin?.email || 'admin'
          })
        )
      }
      
      if (paymentLinks.famille) {
        updates.push(
          PaymentLinkClientService.upsertLink({
            planType: 'famille',
            url: paymentLinks.famille,
            isActive: paymentLinksActive.famille,
            createdBy: admin?.email || 'admin'
          })
        )
      }
      
      await Promise.all(updates)
      
      // Sauvegarder aussi dans SecureStorage comme backup
      SecureStorage.setItem('atiha_payment_links', paymentLinks)
      SecureStorage.setItem('atiha_payment_links_active', paymentLinksActive)
      
      alert('Liens de paiement mis à jour avec succès!')
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des liens de paiement', error as Error)
      alert('Erreur lors de la mise à jour des liens de paiement')
    } finally {
      setIsUpdatingPaymentLinks(false)
    }
  }

  const togglePaymentLink = async (type: 'individuel' | 'famille') => {
    if (!paymentLinks[type].trim()) {
      alert('Veuillez entrer un lien valide avant de l\'activer')
      return
    }

    const newActiveState = {
      ...paymentLinksActive,
      [type]: !paymentLinksActive[type]
    }

    setPaymentLinksActive(newActiveState)

    try {
      // Sauvegarder dans la base de données
      await PaymentLinkClientService.upsertLink({
        planType: type,
        url: paymentLinks[type],
        isActive: newActiveState[type],
        createdBy: admin?.email || 'admin'
      })
      
      // Sauvegarder aussi dans SecureStorage comme backup
      SecureStorage.setItem('atiha_payment_links', paymentLinks)
      SecureStorage.setItem('atiha_payment_links_active', newActiveState)
      
      alert(`Lien ${type} ${newActiveState[type] ? 'activé' : 'désactivé'} et sauvegardé avec succès!`)
    } catch (error) {
      logger.error(`Error toggling payment link for ${type}`, error as Error)
      alert('Erreur lors de la sauvegarde du lien')
    }
  }

  const togglePostPaymentLink = async (type: 'individuel' | 'famille') => {
    if (!postPaymentLinks[type].trim()) {
      alert('Veuillez entrer un lien valide avant de l\'activer')
      return
    }

    const newActiveState = {
      ...postPaymentLinksActive,
      [type]: !postPaymentLinksActive[type]
    }

    setPostPaymentLinksActive(newActiveState)

    try {
      // Sauvegarder dans la base de données
      await PostPaymentLinkService.upsertLink({
        planType: type,
        url: postPaymentLinks[type],
        isActive: newActiveState[type]
      })
      
      // Sauvegarder aussi dans SecureStorage comme backup
      SecureStorage.setItem('atiha_post_payment_links', postPaymentLinks)
      SecureStorage.setItem('atiha_post_payment_links_active', newActiveState)
      
      alert(`Lien après paiement ${type} ${newActiveState[type] ? 'activé' : 'désactivé'} et sauvegardé avec succès!`)
    } catch (error) {
      logger.error(`Error toggling post-payment link for ${type}`, error as Error)
      alert('Erreur lors de la sauvegarde du lien')
    }
  }

  const loadPostPaymentCodes = () => {
    try {
      const savedCodes = SecureStorage.getItemJSON<{ individuel30j: string; individuel1an: string; famille30j: string; famille1an: string }>('atiha_post_payment_codes')
      if (savedCodes) {
        setPostPaymentCodes(savedCodes)
      }
      
      const savedActiveStates = SecureStorage.getItemJSON<{ individuel30j: boolean; individuel1an: boolean; famille30j: boolean; famille1an: boolean }>('atiha_post_payment_codes_active')
      if (savedActiveStates) {
        setPostPaymentCodesActive(savedActiveStates)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des codes après paiement', error as Error)
    }
  }

  const updatePostPaymentCodes = async () => {
    setIsUpdatingPostPaymentCodes(true)
    try {
      // Sauvegarder les codes dans SecureStorage
      SecureStorage.setItem('atiha_post_payment_codes', postPaymentCodes)
      SecureStorage.setItem('atiha_post_payment_codes_active', postPaymentCodesActive)
      alert('Codes après paiement mis à jour avec succès!')
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des codes', error as Error)
      alert('Erreur lors de la mise à jour des codes')
    } finally {
      setIsUpdatingPostPaymentCodes(false)
    }
  }

  const togglePostPaymentCode = (type: 'individuel30j' | 'individuel1an' | 'famille30j' | 'famille1an') => {
    if (!postPaymentCodes[type].trim()) {
      alert('Veuillez entrer un code valide avant de l\'activer')
      return
    }

    const newActiveState = {
      ...postPaymentCodesActive,
      [type]: !postPaymentCodesActive[type]
    }

    setPostPaymentCodesActive(newActiveState)

    // Sauvegarder immédiatement les codes ET l'état
    SecureStorage.setItem('atiha_post_payment_codes', postPaymentCodes)
    SecureStorage.setItem('atiha_post_payment_codes_active', newActiveState)
    
    // Message de confirmation
    const typeNames = {
      individuel30j: 'individuel 30j',
      individuel1an: 'individuel 1an',
      famille30j: 'famille 30j',
      famille1an: 'famille 1an'
    }
    alert(`Code après paiement ${typeNames[type]} ${newActiveState[type] ? 'activé' : 'désactivé'} et sauvegardé avec succès!`)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  const toggleCodeSelection = (codeId: string) => {
    const newSelected = new Set(selectedCodes)
    if (newSelected.has(codeId)) {
      newSelected.delete(codeId)
    } else {
      newSelected.add(codeId)
    }
    setSelectedCodes(newSelected)
  }

  const selectAllCodes = () => {
    setSelectedCodes(new Set(codes.map(code => code.id)))
  }

  const deselectAllCodes = () => {
    setSelectedCodes(new Set())
  }

  const deleteSelectedCodes = async () => {
    if (selectedCodes.size === 0) return

    setIsDeleting(true)
    try {
      // Utiliser le service pour supprimer les codes et désactiver le premium des utilisateurs
      const result = premiumCodesService.deleteCodes(Array.from(selectedCodes))
      
      if (result.success) {
        // Recharger les données
        loadCodes()
        loadStats()
        setSelectedCodes(new Set())
        setShowDeleteModal(false)
        
        // Afficher un message de succès avec le nombre d&apos;utilisateurs affectés
        if (result.affectedUsers > 0) {
          alert(`✅ ${result.message}\n\n⚠️ ${result.affectedUsers} utilisateur(s) ont perdu leur accès premium.`)
        } else {
          alert(`✅ ${result.message}`)
        }
      } else {
        alert(`❌ ${result.message}`)
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression', error as Error)
      alert('❌ Erreur lors de la suppression des codes')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Convertir une date (ISO ou datetime-local) en format datetime-local pour l'input
  const toDateTimeLocal = (dateString: string): string => {
    if (!dateString) return ''
    // Si c'est déjà au format datetime-local (YYYY-MM-DDTHH:mm), on le retourne tel quel
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
      return dateString
    }
    // Sinon, on convertit depuis ISO ou autre format
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Convertir une valeur datetime-local en format compatible
  // Le service generatePremiumCode accepte les formats ISO et datetime-local
  // On garde le format datetime-local pour compatibilité avec l'ancien système
  const fromDateTimeLocal = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return ''
    // Le constructeur Date() accepte le format datetime-local (YYYY-MM-DDTHH:mm)
    // et le service l'utilisera tel quel, donc on retourne directement la valeur
    return dateTimeLocal
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date()
  }

  const getStatusBadge = (code: PremiumCode) => {
    const now = new Date()
    const startsAt = new Date(code.startsAt)
    const expiresAt = new Date(code.expiresAt)
    
    if (now < startsAt) {
      return (
        <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded-full text-xs font-medium">
          En attente
        </span>
      )
    }
    
    if (now > expiresAt) {
      return (
        <span className="px-2 py-1 bg-red-900 text-red-300 rounded-full text-xs font-medium">
          Expiré
        </span>
      )
    }
    
    if (code.usedBy.length > 0) {
      return (
        <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs font-medium">
          Utilisé ({code.usedBy.length})
        </span>
      )
    }
    
    return (
      <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-medium">
        Actif
      </span>
    )
  }

  // Fonction d'export de toutes les données premium
  const exportPremiumData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: 'premium-configuration',
      version: '1.0',
      data: {
        // Activer l'affichage du bouton d'abonnement
        showSubscriptionButton,
        // Gestion du Prix d'Abonnement
        subscriptionPrice,
        // Type d'abonnement
        subscriptionPlans,
        // Lien après paiement
        postPaymentLinks,
        postPaymentLinksActive,
        // Liens de paiement
        paymentLinks,
        paymentLinksActive,
        // Code après paiement
        postPaymentCodes,
        postPaymentCodesActive,
        // Notification d'abonnement
        subscriptionNotifications,
        // Codes générés
        codes: codes.map(code => ({
          id: code.id,
          code: code.code,
          type: code.type,
          generatedAt: code.generatedAt,
          startsAt: code.startsAt,
          expiresAt: code.expiresAt,
          isActive: code.isActive,
          generatedBy: code.generatedBy,
          usedBy: code.usedBy,
          usedAt: code.usedAt,
          flexibleExpiration: code.flexibleExpiration,
          customExpirationDays: code.customExpirationDays
        }))
      }
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `premium_configuration_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('Configuration premium exportée avec succès !')
  }

  // Fonction d'import de toutes les données premium
  const importPremiumData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        
        // Vérifier la structure des données
        if (!importData.data || importData.exportType !== 'premium-configuration') {
          alert('Format de fichier invalide. Veuillez sélectionner un fichier JSON valide exporté depuis cette page.')
          return
        }

        const data = importData.data

        // Importer toutes les données
        if (data.showSubscriptionButton !== undefined) {
          setShowSubscriptionButton(data.showSubscriptionButton)
          SecureStorage.setItem('atiha_show_subscription_button', String(data.showSubscriptionButton))
        }

        if (data.subscriptionPrice) {
          const price = data.subscriptionPrice
          subscriptionPriceService.updatePrice(
            price.amount || '1499',
            price.currency || 'fcfa',
            price.period || 'mois',
            price.updatedBy || admin?.email || 'system'
          )
          setSubscriptionPrice({
            amount: price.amount || '1499',
            currency: price.currency || 'fcfa',
            period: price.period || 'mois',
            lastUpdated: price.lastUpdated || new Date().toISOString(),
            updatedBy: price.updatedBy || admin?.email || 'system'
          })
          setPriceForm({
            amount: price.amount || '1499',
            currency: price.currency || 'fcfa',
            period: price.period || 'mois'
          })
        }

        if (data.subscriptionPlans) {
          setSubscriptionPlans(data.subscriptionPlans)
          SecureStorage.setItem('atiha_subscription_plans', JSON.stringify(data.subscriptionPlans))
        }

        if (data.postPaymentLinks) {
          setPostPaymentLinks(data.postPaymentLinks)
          SecureStorage.setItem('atiha_post_payment_links', JSON.stringify(data.postPaymentLinks))
        }

        if (data.postPaymentLinksActive) {
          setPostPaymentLinksActive(data.postPaymentLinksActive)
          SecureStorage.setItem('atiha_post_payment_links_active', JSON.stringify(data.postPaymentLinksActive))
        }

        if (data.paymentLinks) {
          setPaymentLinks(data.paymentLinks)
          SecureStorage.setItem('atiha_payment_links', JSON.stringify(data.paymentLinks))
        }

        if (data.paymentLinksActive) {
          setPaymentLinksActive(data.paymentLinksActive)
          SecureStorage.setItem('atiha_payment_links_active', JSON.stringify(data.paymentLinksActive))
        }

        if (data.postPaymentCodes) {
          setPostPaymentCodes(data.postPaymentCodes)
          SecureStorage.setItem('atiha_post_payment_codes', JSON.stringify(data.postPaymentCodes))
        }

        if (data.postPaymentCodesActive) {
          setPostPaymentCodesActive(data.postPaymentCodesActive)
          SecureStorage.setItem('atiha_post_payment_codes_active', JSON.stringify(data.postPaymentCodesActive))
        }

        if (data.subscriptionNotifications) {
          setSubscriptionNotifications(data.subscriptionNotifications)
          SecureStorage.setItem('atiha_subscription_notifications', JSON.stringify(data.subscriptionNotifications))
        }

        // Importer les codes générés
        if (data.codes && Array.isArray(data.codes)) {
          const allCodes = premiumCodesService.getAllCodes()
          const importedCodeIds = new Set(data.codes.map((c: PremiumCode) => c.id))
          
          // Supprimer les codes existants qui sont dans l'import (pour éviter les doublons)
          // Les codes importés remplaceront les codes existants avec le même ID
          const filteredCodes = allCodes.filter(code => !importedCodeIds.has(code.id))
          
          // Ajouter les codes importés (ils remplaceront les codes existants avec le même ID)
          const updatedCodes = [...filteredCodes, ...data.codes]
          SecureStorage.setItem('atiha_premium_codes', updatedCodes)
          loadCodes()
          loadStats()
        }

        alert('Configuration premium importée avec succès !')
        
        // Recharger les données pour s'assurer que tout est à jour
        window.location.reload()
        
        // Réinitialiser l'input file
        event.target.value = ''
      } catch (error) {
        console.error('Erreur lors de l\'import:', error)
        alert('Erreur lors de la lecture du fichier. Vérifiez que le fichier est un JSON valide.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-800">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center space-x-1.5 sm:space-x-2 text-gray-400 hover:text-white transition-colors text-base sm:text-lg min-h-[44px] sm:min-h-0"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Retour</span>
              </button>
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <KeyIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Codes Premium</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
              <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Total des codes</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalCodes}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Codes actifs</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.activeCodes}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Codes utilisés</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.usedCodes}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Codes expirés</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.expiredCodes}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Total utilisateurs</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Export/Import */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Gestion des données</h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Exportez ou importez toutes les configurations premium (bouton abonnement, prix, plans, liens, codes, notifications)
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3">
                <button
                  onClick={exportPremiumData}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Exporter JSON</span>
                </button>
                <label className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto">
                  <ArrowUpTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Importer JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importPremiumData}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-3">
                L'export inclut : Affichage bouton abonnement, Prix d'abonnement, Types d'abonnement, Liens après paiement, Codes après paiement, Notifications d'abonnement, et tous les codes générés.
              </p>
            </div>

            {/* Afficher le bouton d'Abonnement */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🔘</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Afficher le bouton d&apos;Abonnement</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Activez cette option pour afficher le bouton d&apos;abonnement dans l&apos;interface utilisateur</p>
                </div>
              </div>

              {/* Option de visibilité */}
              <div className="bg-dark-500/30 rounded-xl p-3 sm:p-4 border border-gray-600/50">
                <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSubscriptionButton}
                    onChange={(e) => {
                      const newValue = e.target.checked
                      setShowSubscriptionButton(newValue)
                      SecureStorage.setItem('atiha_show_subscription_button', newValue.toString())
                    }}
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 bg-dark-600 border-gray-600 rounded focus:ring-blue-500 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  />
                  <span className="text-gray-300 text-sm sm:text-base">Activer l&apos;affichage du bouton d&apos;abonnement</span>
                </label>
              </div>
            </div>

            {/* Subscription Price Management */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div 
                className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsSubscriptionPriceCollapsed(!isSubscriptionPriceCollapsed)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">💰</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Gestion du Prix d&apos;Abonnement</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Modifiez le prix affiché aux utilisateurs</p>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {isSubscriptionPriceCollapsed ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Contenu de la section - masquable */}
              {!isSubscriptionPriceCollapsed && (
                <>
                  {/* Prix actuel */}
              <div className="bg-dark-500/30 rounded-xl p-4 mb-6 border border-gray-600/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Prix actuel</p>
                    <p className="text-2xl font-bold text-white">
                      {subscriptionPrice.amount}{subscriptionPrice.currency}/{subscriptionPrice.period}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Dernière mise à jour: {new Date(subscriptionPrice.lastUpdated).toLocaleDateString('fr-FR')} par {subscriptionPrice.updatedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire de modification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Montant
                  </label>
                  <input
                    type="text"
                    value={priceForm.amount}
                    onChange={(e) => setPriceForm({ ...priceForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="1499"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Devise
                  </label>
                  <input
                    type="text"
                    value={priceForm.currency}
                    onChange={(e) => setPriceForm({ ...priceForm, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="fcfa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Période
                  </label>
                  <input
                    type="text"
                    value={priceForm.period}
                    onChange={(e) => setPriceForm({ ...priceForm, period: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="mois"
                  />
                </div>
              </div>

              {/* Aperçu du nouveau prix */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
                <p className="text-gray-400 text-sm mb-2">Aperçu du nouveau prix:</p>
                <p className="text-2xl font-bold text-white">
                  {priceForm.amount}{priceForm.currency}/{priceForm.period}
                </p>
              </div>

              {/* Informations Premium */}
              <div className="mt-8 pt-8 border-t border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-4">Informations du Plan Premium</h4>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={premiumInfo.title}
                      onChange={(e) => setPremiumInfo({ ...premiumInfo, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Plan Premium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={premiumInfo.description}
                      onChange={(e) => setPremiumInfo({ ...premiumInfo, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Accès illimité à tous nos contenus"
                    />
                  </div>
                </div>
                
                {/* Aperçu */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
                  <p className="text-gray-400 text-sm mb-2">Aperçu:</p>
                  <h3 className="text-lg font-bold text-white mb-2">{premiumInfo.title}</h3>
                  <p className="text-gray-300 text-sm">{premiumInfo.description}</p>
                </div>
              </div>

              {/* Partenaires de Paiement */}
              <div className="mt-8 pt-8 border-t border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Partenaires de Paiement</h4>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="premium-paymentPartners-visible"
                      checked={paymentPartners.isVisible}
                      onChange={(e) => setPaymentPartners({ ...paymentPartners, isVisible: e.target.checked })}
                      className="w-5 h-5 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="premium-paymentPartners-visible" className="text-sm font-medium text-gray-300">
                      Afficher les partenaires de paiement
                    </label>
                  </div>
                </div>

                {paymentPartners.isVisible && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titre (optionnel)
                      </label>
                      <input
                        type="text"
                        value={paymentPartners.title || ''}
                        onChange={(e) => setPaymentPartners({ ...paymentPartners, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Partenaires de paiement"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-300">
                          Logos des passerelles de paiement
                        </label>
                        <button
                          onClick={() => {
                            const items = [...(paymentPartners.items || [])]
                            const newId = `partner-${Date.now()}`
                            items.push({
                              id: newId,
                              logoUrl: '',
                              isVisible: true
                            })
                            setPaymentPartners({ ...paymentPartners, items })
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Ajouter un partenaire</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(paymentPartners.items || []).map((partner, index) => (
                          <div key={partner.id} className="border border-gray-600 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h5 className="text-sm font-semibold text-white">Partenaire #{index + 1}</h5>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={`premium-paymentPartner-${partner.id}-visible`}
                                  checked={partner.isVisible}
                                  onChange={(e) => {
                                    const items = [...(paymentPartners.items || [])]
                                    const itemIndex = items.findIndex(item => item.id === partner.id)
                                    if (itemIndex !== -1) {
                                      items[itemIndex] = { ...items[itemIndex], isVisible: e.target.checked }
                                      setPaymentPartners({ ...paymentPartners, items })
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                                />
                                <label htmlFor={`premium-paymentPartner-${partner.id}-visible`} className="text-xs text-gray-400">
                                  Visible
                                </label>
                                <button
                                  onClick={() => {
                                    const items = (paymentPartners.items || []).filter(item => item.id !== partner.id)
                                    setPaymentPartners({ ...paymentPartners, items })
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  aria-label="Supprimer le partenaire"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                URL du logo
                              </label>
                              <input
                                type="text"
                                value={partner.logoUrl}
                                onChange={(e) => {
                                  const items = [...(paymentPartners.items || [])]
                                  const itemIndex = items.findIndex(item => item.id === partner.id)
                                  if (itemIndex !== -1) {
                                    items[itemIndex] = { ...items[itemIndex], logoUrl: e.target.value }
                                    setPaymentPartners({ ...paymentPartners, items })
                                  }
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                                placeholder="https://example.com/logo.png"
                              />
                              {partner.logoUrl && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-400 mb-1">Aperçu :</p>
                                  <div className="inline-block p-2 bg-white rounded border border-gray-300">
                                    <img
                                      src={partner.logoUrl}
                                      alt="Logo partenaire"
                                      className="h-8 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    setPriceForm({
                      amount: subscriptionPrice.amount,
                      currency: subscriptionPrice.currency,
                      period: subscriptionPrice.period
                    })
                    // Réinitialiser les informations premium
                    loadSubscriptionPrice()
                    // Réinitialiser les partenaires de paiement
                    setPaymentPartners({
                      isVisible: true,
                      title: 'Partenaires de paiement',
                      items: [
                        {
                          id: 'visa',
                          logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
                          isVisible: true
                        },
                        {
                          id: 'mastercard',
                          logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/2560px-Mastercard-logo.svg.png',
                          isVisible: true
                        },
                        {
                          id: 'paypal',
                          logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png',
                          isVisible: true
                        }
                      ]
                    })
                  }}
                  className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    updateSubscriptionPrice()
                    // Sauvegarder les informations premium
                    try {
                      localStorage.setItem('atiha_premium_info', JSON.stringify(premiumInfo))
                      localStorage.setItem('atiha_premium_payment_partners', JSON.stringify(paymentPartners))
                      alert('Informations premium mises à jour avec succès!')
                    } catch (error) {
                      logger.error('Erreur lors de la sauvegarde des informations premium', error as Error)
                      alert('Erreur lors de la sauvegarde des informations premium')
                    }
                  }}
                  disabled={isUpdatingPrice}
                  className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:scale-100 text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  {isUpdatingPrice ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Mise à jour...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Mettre à jour</span>
                    </div>
                  )}
                </button>
              </div>
                </>
              )}
            </div>

            {/* Subscription Plans Management */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div 
                className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsSubscriptionPlansCollapsed(!isSubscriptionPlansCollapsed)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Type d&apos;abonnement</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Modifiez les informations des plans Individuel et Famille</p>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {isSubscriptionPlansCollapsed ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Contenu de la section - masquable */}
              {!isSubscriptionPlansCollapsed && (
                <>
                  {/* Titre principal */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre principal
                </label>
                <input
                  type="text"
                  value={subscriptionPlans.mainTitle}
                  onChange={(e) => setSubscriptionPlans({
                    ...subscriptionPlans,
                    mainTitle: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Titre affiché aux utilisateurs</p>
              </div>

              {/* Plans d&apos;abonnement */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Plan Individuel */}
                <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👤</span>
                    </div>
                    <span>Plan Individuel</span>
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.individuel.title}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          individuel: { ...subscriptionPlans.individuel, title: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Période
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.individuel.period}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          individuel: { ...subscriptionPlans.individuel, period: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prix
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.individuel.price}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          individuel: { ...subscriptionPlans.individuel, price: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Engagement
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.individuel.commitment}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          individuel: { ...subscriptionPlans.individuel, commitment: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fonctionnalités (une par ligne)
                      </label>
                      <textarea
                        value={subscriptionPlans.individuel.features.join('\n')}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          individuel: { ...subscriptionPlans.individuel, features: e.target.value.split('\n').filter(f => f.trim()) }
                        })}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Texte du bouton
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.individuel.buttonText}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          individuel: { ...subscriptionPlans.individuel, buttonText: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Lien plan individuel
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="url"
                          value={paymentLinks.individuel}
                          onChange={(e) => {
                            const newLinks = {
                              ...paymentLinks,
                              individuel: e.target.value
                            }
                            setPaymentLinks(newLinks)
                            // Sauvegarder automatiquement
                            SecureStorage.setItem('atiha_payment_links', newLinks)
                          }}
                          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                          placeholder="https://example.com/payment-individuel"
                        />
                        <button
                          onClick={() => togglePaymentLink('individuel')}
                          className={`px-4 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                            paymentLinksActive.individuel 
                              ? 'bg-red-600 hover:bg-red-500' 
                              : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                        >
                          {paymentLinksActive.individuel ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">URL du site de paiement pour le plan individuel</p>
                    </div>
                    
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Couleur bouton
                      </label>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                          style={{ backgroundColor: subscriptionPlans.individuel.buttonColor }}
                          onClick={() => {
                            const colorInput = document.getElementById('individuel-color-picker') as HTMLInputElement
                            colorInput?.click()
                          }}
                        />
                        <input
                          id="individuel-color-picker"
                          type="color"
                          value={subscriptionPlans.individuel.buttonColor}
                          onChange={(e) => setSubscriptionPlans({
                            ...subscriptionPlans,
                            individuel: { ...subscriptionPlans.individuel, buttonColor: e.target.value }
                          })}
                          className="hidden"
                        />
                        <input
                          type="text"
                          value={subscriptionPlans.individuel.buttonColor}
                          onChange={(e) => setSubscriptionPlans({
                            ...subscriptionPlans,
                            individuel: { ...subscriptionPlans.individuel, buttonColor: e.target.value }
                          })}
                          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent font-mono text-sm"
                          placeholder="#3B82F6"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Couleur de l&apos;icône et du bouton pour le plan individuel</p>
                    </div>
                  </div>
                </div>

                {/* Plan Famille */}
                <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👥</span>
                    </div>
                    <span>Plan Famille</span>
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.famille.title}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, title: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Période
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.famille.period}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, period: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prix
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.famille.price}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, price: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Engagement
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.famille.commitment}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, commitment: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description famille
                      </label>
                      <textarea
                        value={subscriptionPlans.famille.description || ''}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, description: e.target.value }
                        })}
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fonctionnalités (une par ligne)
                      </label>
                      <textarea
                        value={subscriptionPlans.famille.features.join('\n')}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, features: e.target.value.split('\n').filter(f => f.trim()) }
                        })}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Texte du bouton
                      </label>
                      <input
                        type="text"
                        value={subscriptionPlans.famille.buttonText}
                        onChange={(e) => setSubscriptionPlans({
                          ...subscriptionPlans,
                          famille: { ...subscriptionPlans.famille, buttonText: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Lien plan famille
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="url"
                          value={paymentLinks.famille}
                          onChange={(e) => {
                            const newLinks = {
                              ...paymentLinks,
                              famille: e.target.value
                            }
                            setPaymentLinks(newLinks)
                            // Sauvegarder automatiquement
                            SecureStorage.setItem('atiha_payment_links', newLinks)
                          }}
                          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                          placeholder="https://example.com/payment-famille"
                        />
                        <button
                          onClick={() => togglePaymentLink('famille')}
                          className={`px-4 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                            paymentLinksActive.famille 
                              ? 'bg-red-600 hover:bg-red-500' 
                              : 'bg-green-600 hover:bg-green-500'
                          }`}
                        >
                          {paymentLinksActive.famille ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">URL du site de paiement pour le plan famille</p>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Couleur bouton
                      </label>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                          style={{ backgroundColor: subscriptionPlans.famille.buttonColor }}
                          onClick={() => {
                            const colorInput = document.getElementById('famille-color-picker') as HTMLInputElement
                            colorInput?.click()
                          }}
                        />
                        <input
                          id="famille-color-picker"
                          type="color"
                          value={subscriptionPlans.famille.buttonColor}
                          onChange={(e) => setSubscriptionPlans({
                            ...subscriptionPlans,
                            famille: { ...subscriptionPlans.famille, buttonColor: e.target.value }
                          })}
                          className="hidden"
                        />
                        <input
                          type="text"
                          value={subscriptionPlans.famille.buttonColor}
                          onChange={(e) => setSubscriptionPlans({
                            ...subscriptionPlans,
                            famille: { ...subscriptionPlans.famille, buttonColor: e.target.value }
                          })}
                          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent font-mono text-sm"
                          placeholder="#10B981"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Couleur de l&apos;icône et du bouton pour le plan famille</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texte de désengagement */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Texte de désengagement
                </label>
                <textarea
                  value={subscriptionPlans.disclaimer}
                  onChange={(e) => setSubscriptionPlans({
                    ...subscriptionPlans,
                    disclaimer: e.target.value
                  })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    // Réinitialiser aux valeurs par défaut
                    setSubscriptionPlans({
                      mainTitle: 'Choisissez votre abonnement',
                      individuel: {
                        title: 'Individuel',
                        period: 'Mensuel',
                        price: '1999 fcfa/mois',
                        commitment: 'Sans engagement',
                        description: '',
                        features: ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
                        buttonText: 'Passer au paiement',
                        paymentUrl: '',
                        buttonColor: '#3B82F6'
                      },
                      famille: {
                        title: 'Famille',
                        period: 'Mensuel',
                        price: '2999 fcfa/mois',
                        commitment: 'Sans engagement',
                        description: 'Ajoutez jusqu\'à 5 membres de votre famille (âgés de 13 ans et plus) à votre foyer.',
                        features: ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
                        buttonText: 'Passer au paiement',
                        paymentUrl: '',
                        buttonColor: '#10B981'
                      },
                      disclaimer: 'Annulez à tout moment. Votre abonnement sans engagement commence dès votre inscription.'
                    })
                  }}
                  className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={updateSubscriptionPlans}
                  disabled={isUpdatingPlans}
                  className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:scale-100 text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  {isUpdatingPlans ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Mise à jour...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Mettre à jour les plans</span>
                    </div>
                  )}
                </button>
              </div>
                </>
              )}
            </div>

            {/* Post Payment Links Management */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div 
                className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsPostPaymentLinksCollapsed(!isPostPaymentLinksCollapsed)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🔗</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Lien après paiement</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Configurez les liens de redirection après paiement</p>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {isPostPaymentLinksCollapsed ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Contenu de la section - masquable */}
              {!isPostPaymentLinksCollapsed && (
                <>
                  {/* Lien après paiement individuel */}
                  <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">👤</span>
                      </div>
                      <span>Lien après paiement individuel</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          URL de redirection
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="url"
                            value={postPaymentLinks.individuel}
                            onChange={(e) => {
                              const newLinks = {
                                ...postPaymentLinks,
                                individuel: e.target.value
                              }
                              setPostPaymentLinks(newLinks)
                              // Sauvegarder automatiquement
                              SecureStorage.setItem('atiha_post_payment_links', newLinks)
                            }}
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                            placeholder="https://example.com/after-payment-individuel"
                          />
                          <button
                            onClick={() => togglePostPaymentLink('individuel')}
                            className={`px-6 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                              postPaymentLinksActive.individuel 
                                ? 'bg-red-600 hover:bg-red-500' 
                                : 'bg-green-600 hover:bg-green-500'
                            }`}
                          >
                            {postPaymentLinksActive.individuel ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">URL vers laquelle l&apos;utilisateur sera redirigé après un paiement individuel</p>
                      </div>
                    </div>
                  </div>

                  {/* Lien après paiement famille */}
                  <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">👥</span>
                      </div>
                      <span>Lien après paiement famille</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          URL de redirection
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="url"
                            value={postPaymentLinks.famille}
                            onChange={(e) => {
                              const newLinks = {
                                ...postPaymentLinks,
                                famille: e.target.value
                              }
                              setPostPaymentLinks(newLinks)
                              // Sauvegarder automatiquement
                              SecureStorage.setItem('atiha_post_payment_links', newLinks)
                            }}
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                            placeholder="https://example.com/after-payment-famille"
                          />
                          <button
                            onClick={() => togglePostPaymentLink('famille')}
                            className={`px-6 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                              postPaymentLinksActive.famille 
                                ? 'bg-red-600 hover:bg-red-500' 
                                : 'bg-green-600 hover:bg-green-500'
                            }`}
                          >
                            {postPaymentLinksActive.famille ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">URL vers laquelle l&apos;utilisateur sera redirigé après un paiement famille</p>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                    <button
                      onClick={() => {
                        setPostPaymentLinks({
                          individuel: '',
                          famille: ''
                        })
                      }}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={updatePostPaymentLinks}
                      disabled={isUpdatingPostPaymentLinks}
                      className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:scale-100 text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      {isUpdatingPostPaymentLinks ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Mise à jour...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Mettre à jour les liens</span>
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Post Payment Codes Management */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div 
                className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsPostPaymentCodesCollapsed(!isPostPaymentCodesCollapsed)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🎫</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Code après paiement</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Configurez les codes à activer après paiement</p>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {isPostPaymentCodesCollapsed ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Contenu de la section - masquable */}
              {!isPostPaymentCodesCollapsed && (
                <>
                  {/* Codes Individuel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Code après paiement individuel 30j */}
                    <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">👤</span>
                        </div>
                        <span>Code après paiement individuel 30j</span>
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Code premium
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={postPaymentCodes.individuel30j}
                              onChange={(e) => {
                                const newCodes = {
                                  ...postPaymentCodes,
                                  individuel30j: e.target.value
                                }
                                setPostPaymentCodes(newCodes)
                                // Sauvegarder automatiquement
                                SecureStorage.setItem('atiha_post_payment_codes', newCodes)
                              }}
                              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                              placeholder="IND-ABC123-XYZ789"
                            />
                            <button
                              onClick={() => togglePostPaymentCode('individuel30j')}
                              className={`px-4 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                                postPaymentCodesActive.individuel30j 
                                  ? 'bg-red-600 hover:bg-red-500' 
                                  : 'bg-purple-600 hover:bg-purple-500'
                              }`}
                            >
                              {postPaymentCodesActive.individuel30j ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Code à activer pour les paiements individuels 30 jours</p>
                        </div>
                      </div>
                    </div>

                    {/* Code après paiement individuel 1an */}
                    <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">👤</span>
                        </div>
                        <span>Code après paiement individuel 1an</span>
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Code premium
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={postPaymentCodes.individuel1an}
                              onChange={(e) => {
                                const newCodes = {
                                  ...postPaymentCodes,
                                  individuel1an: e.target.value
                                }
                                setPostPaymentCodes(newCodes)
                                // Sauvegarder automatiquement
                                SecureStorage.setItem('atiha_post_payment_codes', newCodes)
                              }}
                              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                              placeholder="IND-ANNUEL-ABC123"
                            />
                            <button
                              onClick={() => togglePostPaymentCode('individuel1an')}
                              className={`px-4 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                                postPaymentCodesActive.individuel1an 
                                  ? 'bg-red-600 hover:bg-red-500' 
                                  : 'bg-purple-600 hover:bg-purple-500'
                              }`}
                            >
                              {postPaymentCodesActive.individuel1an ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Code à activer pour les paiements individuels 1 an</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Codes Famille */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Code après paiement famille 30j */}
                    <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">👥</span>
                        </div>
                        <span>Code après paiement famille 30j</span>
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Code premium
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={postPaymentCodes.famille30j}
                              onChange={(e) => {
                                const newCodes = {
                                  ...postPaymentCodes,
                                  famille30j: e.target.value
                                }
                                setPostPaymentCodes(newCodes)
                                // Sauvegarder automatiquement
                                SecureStorage.setItem('atiha_post_payment_codes', newCodes)
                              }}
                              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                              placeholder="FAM-ABC123-XYZ789"
                            />
                            <button
                              onClick={() => togglePostPaymentCode('famille30j')}
                              className={`px-4 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                                postPaymentCodesActive.famille30j 
                                  ? 'bg-red-600 hover:bg-red-500' 
                                  : 'bg-purple-600 hover:bg-purple-500'
                              }`}
                            >
                              {postPaymentCodesActive.famille30j ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Code à activer pour les paiements famille 30 jours</p>
                        </div>
                      </div>
                    </div>

                    {/* Code après paiement famille 1an */}
                    <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">👥</span>
                        </div>
                        <span>Code après paiement famille 1an</span>
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Code premium
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={postPaymentCodes.famille1an}
                              onChange={(e) => {
                                const newCodes = {
                                  ...postPaymentCodes,
                                  famille1an: e.target.value
                                }
                                setPostPaymentCodes(newCodes)
                                // Sauvegarder automatiquement
                                SecureStorage.setItem('atiha_post_payment_codes', newCodes)
                              }}
                              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                              placeholder="FAM-ANNUEL-ABC123"
                            />
                            <button
                              onClick={() => togglePostPaymentCode('famille1an')}
                              className={`px-4 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium ${
                                postPaymentCodesActive.famille1an 
                                  ? 'bg-red-600 hover:bg-red-500' 
                                  : 'bg-purple-600 hover:bg-purple-500'
                              }`}
                            >
                              {postPaymentCodesActive.famille1an ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Code à activer pour les paiements famille 1 an</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => {
                        setPostPaymentCodes({
                          individuel30j: '',
                          individuel1an: '',
                          famille30j: '',
                          famille1an: ''
                        })
                        setPostPaymentCodesActive({
                          individuel30j: false,
                          individuel1an: false,
                          famille30j: false,
                          famille1an: false
                        })
                      }}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={updatePostPaymentCodes}
                      disabled={isUpdatingPostPaymentCodes}
                      className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:scale-100 text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      {isUpdatingPostPaymentCodes ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Mise à jour...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Mettre à jour les codes</span>
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Subscription Notifications Management */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div 
                className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsNotificationsCollapsed(!isNotificationsCollapsed)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🔔</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Notification d&apos;abonnement</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Modifiez les textes des notifications d&apos;abonnement</p>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {isNotificationsCollapsed ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Contenu de la section - masquable */}
              {!isNotificationsCollapsed && (
                <>
                  {/* Essai Gratuit */}
                  <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🎁</span>
                      </div>
                      <span>Essai Gratuit</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.essaiGratuit.title}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            essaiGratuit: { ...subscriptionNotifications.essaiGratuit, title: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={subscriptionNotifications.essaiGratuit.description}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            essaiGratuit: { ...subscriptionNotifications.essaiGratuit, description: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bienvenue */}
                  <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🎉</span>
                      </div>
                      <span>Bienvenue</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.bienvenue.title}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            bienvenue: { ...subscriptionNotifications.bienvenue, title: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sous-titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.bienvenue.subtitle}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            bienvenue: { ...subscriptionNotifications.bienvenue, subtitle: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre de section
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.bienvenue.sectionTitle}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            bienvenue: { ...subscriptionNotifications.bienvenue, sectionTitle: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description de section
                        </label>
                        <textarea
                          value={subscriptionNotifications.bienvenue.sectionDescription}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            bienvenue: { ...subscriptionNotifications.bienvenue, sectionDescription: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Fonctionnalités (une par ligne)
                        </label>
                        <textarea
                          value={subscriptionNotifications.bienvenue.features.join('\n')}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            bienvenue: { ...subscriptionNotifications.bienvenue, features: e.target.value.split('\n').filter(f => f.trim()) }
                          })}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Texte du bouton
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.bienvenue.buttonText}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            bienvenue: { ...subscriptionNotifications.bienvenue, buttonText: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inscription Réussie */}
                  <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✅</span>
                      </div>
                      <span>Inscription Réussie</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.inscriptionReussie.title}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            inscriptionReussie: { ...subscriptionNotifications.inscriptionReussie, title: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sous-titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.inscriptionReussie.subtitle}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            inscriptionReussie: { ...subscriptionNotifications.inscriptionReussie, subtitle: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={subscriptionNotifications.inscriptionReussie.description}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            inscriptionReussie: { ...subscriptionNotifications.inscriptionReussie, description: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Texte du bouton
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.inscriptionReussie.buttonText}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            inscriptionReussie: { ...subscriptionNotifications.inscriptionReussie, buttonText: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contenu Premium */}
                  <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🔒</span>
                      </div>
                      <span>Contenu Premium</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.contenuPremium.title}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            contenuPremium: { ...subscriptionNotifications.contenuPremium, title: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sous-titre
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.contenuPremium.subtitle}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            contenuPremium: { ...subscriptionNotifications.contenuPremium, subtitle: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre de section
                        </label>
                        <input
                          type="text"
                          value={subscriptionNotifications.contenuPremium.sectionTitle}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            contenuPremium: { ...subscriptionNotifications.contenuPremium, sectionTitle: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description de section
                        </label>
                        <textarea
                          value={subscriptionNotifications.contenuPremium.sectionDescription}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            contenuPremium: { ...subscriptionNotifications.contenuPremium, sectionDescription: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Fonctionnalités (une par ligne)
                        </label>
                        <textarea
                          value={subscriptionNotifications.contenuPremium.features.join('\n')}
                          onChange={(e) => setSubscriptionNotifications({
                            ...subscriptionNotifications,
                            contenuPremium: { ...subscriptionNotifications.contenuPremium, features: e.target.value.split('\n').filter(f => f.trim()) }
                          })}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bouton Annuler
                          </label>
                          <input
                            type="text"
                            value={subscriptionNotifications.contenuPremium.cancelButton}
                            onChange={(e) => setSubscriptionNotifications({
                              ...subscriptionNotifications,
                              contenuPremium: { ...subscriptionNotifications.contenuPremium, cancelButton: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bouton S&apos;abonner
                          </label>
                          <input
                            type="text"
                            value={subscriptionNotifications.contenuPremium.subscribeButton}
                            onChange={(e) => setSubscriptionNotifications({
                              ...subscriptionNotifications,
                              contenuPremium: { ...subscriptionNotifications.contenuPremium, subscribeButton: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => {
                        // Réinitialiser aux valeurs par défaut
                        setSubscriptionNotifications({
                          essaiGratuit: {
                            title: 'Essai gratuit activé !',
                            description: 'Profitez de 5 jours d\'accès premium gratuit dès votre inscription !'
                          },
                          bienvenue: {
                            title: '🎉 Bienvenue !',
                            subtitle: 'Votre compte est désormais activé',
                            sectionTitle: 'Essai Premium Gratuit',
                            sectionDescription: 'Vous profitez de 5 jours d\'accès illimité à tout notre catalogue premium',
                            features: [
                              'Accès complet à tout le catalogue',
                              'Téléchargements disponibles hors ligne',
                              'Qualité HD / 4K'
                            ],
                            buttonText: 'Découvrir notre catalogue'
                          },
                          inscriptionReussie: {
                            title: 'Inscription réussie !',
                            subtitle: 'Compte créé avec succès',
                            description: 'Votre compte a été créé avec succès. Commencez à explorer notre collection !',
                            buttonText: 'Continuer'
                          },
                          contenuPremium: {
                            title: 'Contenu Premium',
                            subtitle: 'Abonnement requis',
                            sectionTitle: 'Accès Premium Requis',
                            sectionDescription: 'Ce contenu nécessite un abonnement premium pour être regardé.',
                            features: [
                              'Accès à tous les contenus premium',
                              'Téléchargements hors ligne',
                              'Qualité HD/4K'
                            ],
                            cancelButton: 'Annuler',
                            subscribeButton: 'Activer mon abonnement'
                          }
                        })
                      }}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={updateSubscriptionNotifications}
                      disabled={isUpdatingNotifications}
                      className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:scale-100 text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      {isUpdatingNotifications ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Mise à jour...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Mettre à jour les notifications</span>
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Generate New Code */}
            <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Générer un nouveau code</h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Créez un code premium personnalisé - Peut être utilisé par plusieurs utilisateurs
                  </p>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={generateNewCode}
                    disabled={isGenerating}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>{isGenerating ? 'Génération...' : 'Générer un code'}</span>
                  </button>
                </div>
              </div>

              {/* Formulaire de génération de code */}
              {showCodeForm && (
                <div className="bg-dark-500/30 rounded-xl p-6 border border-gray-600/50">
                  <h4 className="text-lg font-semibold text-white mb-4">Configuration du code</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Type de code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Type de code
                      </label>
                      <select
                        value={codeForm.type}
                        onChange={(e) => setCodeForm({ ...codeForm, type: e.target.value as 'inscription' | 'inscription-flexible' | 'individuel' | 'famille' | 'individuel-annuel' | 'famille-annuel' | 'plan-premium' | 'post-payment-individuel' | 'post-payment-famille' | 'post-payment-individuel-annuel' | 'post-payment-famille-annuel' | 'post-payment-individuel-flexible' | 'post-payment-famille-flexible' })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200"
                      >
                        <option value="inscription">Code Inscription (5 jours)</option>
                        <option value="inscription-flexible">Code d'inscription flexible (durée personnalisable)</option>
                        <option value="individuel">Code Individuel Pro</option>
                        <option value="famille">Code Famille et amis Pro</option>
                        <optgroup label="Codes après paiement">
                          <option value="post-payment-individuel">Code après paiement individuel (30 jours)</option>
                          <option value="post-payment-famille">Code après paiement famille (30 jours)</option>
                          <option value="post-payment-individuel-flexible">Code après paiement individuel flexible (30 jours à partir de l'activation)</option>
                          <option value="post-payment-famille-flexible">Code après paiement famille flexible (30 jours à partir de l'activation)</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Date de début */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date de début (optionnel)
                      </label>
                      <input
                        type="datetime-local"
                        value={codeForm.startsAt ? toDateTimeLocal(codeForm.startsAt) : ''}
                        onChange={(e) => {
                          const isoValue = fromDateTimeLocal(e.target.value)
                          setCodeForm({ ...codeForm, startsAt: isoValue })
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200"
                        disabled={codeForm.type === 'inscription-flexible'}
                      />
                      <p className="text-xs text-gray-500 mt-1">Si vide, commence maintenant</p>
                    </div>

                    {/* Date de fin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date de fin (optionnel)
                      </label>
                      <input
                        type="datetime-local"
                        value={codeForm.expiresAt ? toDateTimeLocal(codeForm.expiresAt) : ''}
                        onChange={(e) => {
                          const isoValue = fromDateTimeLocal(e.target.value)
                          setCodeForm({ ...codeForm, expiresAt: isoValue })
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200"
                        disabled={codeForm.type === 'inscription-flexible'}
                      />
                      <p className="text-xs text-gray-500 mt-1">Si vide, durée par défaut selon le type</p>
                    </div>
                  </div>

                  {/* Champ nombre de jours pour inscription-flexible */}
                  {codeForm.type === 'inscription-flexible' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre de jours de validité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={codeForm.customExpirationDays}
                        onChange={(e) => setCodeForm({ ...codeForm, customExpirationDays: parseInt(e.target.value) || 5 })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="Ex: 10, 20, 30..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Le code expirera X jours après son activation par l'utilisateur</p>
                    </div>
                  )}

                  {/* Aperçu du code */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
                    <p className="text-gray-400 text-sm mb-2">Configuration du code:</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">
                        <span className="text-gray-400">Type:</span> {
                          codeForm.type === 'inscription' ? 'Code Inscription (5 jours)' :
                          codeForm.type === 'inscription-flexible' ? `Code d'inscription flexible (${codeForm.customExpirationDays} jours à partir de l'activation)` :
                          codeForm.type === 'individuel' ? 'Code Individuel Pro' :
                          codeForm.type === 'famille' ? 'Code Famille et amis Pro' :
                          codeForm.type === 'post-payment-individuel' ? 'Code après paiement individuel (30 jours)' :
                          codeForm.type === 'post-payment-famille' ? 'Code après paiement famille (30 jours)' :
                          codeForm.type === 'post-payment-individuel-flexible' ? 'Code après paiement individuel flexible (30 jours à partir de l\'activation)' :
                          codeForm.type === 'post-payment-famille-flexible' ? 'Code après paiement famille flexible (30 jours à partir de l\'activation)' :
                          'Code Inconnu'
                        }
                      </p>
                      <p className="text-white">
                        <span className="text-gray-400">Début:</span> {codeForm.startsAt ? new Date(codeForm.startsAt).toLocaleString('fr-FR') : 'Maintenant'}
                      </p>
                      <p className="text-white">
                        <span className="text-gray-400">Fin:</span> {
                          codeForm.type === 'inscription-flexible'
                            ? `Flexible (${codeForm.customExpirationDays} jours à partir de l'activation)`
                            : (codeForm.type === 'post-payment-individuel-flexible' || codeForm.type === 'post-payment-famille-flexible') 
                            ? 'Flexible (30 jours à partir de l\'activation)' 
                            : (codeForm.expiresAt ? new Date(codeForm.expiresAt).toLocaleString('fr-FR') : 'Selon le type')
                        }
                      </p>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6">
                    <button
                      onClick={() => {
                        setShowCodeForm(false)
                        setCodeForm({
                          type: 'individuel',
                          startsAt: '',
                          expiresAt: '',
                          flexibleExpiration: false,
                          customExpirationDays: 5
                        })
                      }}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={generateNewCode}
                      disabled={isGenerating}
                      className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      {isGenerating ? 'Génération...' : 'Activer le code'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Codes List */}
            <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <div className="p-4 sm:p-5 md:p-6 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Codes générés</h3>
                  
                  {/* Actions de sélection */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {selectedCodes.size > 0 && (
                      <>
                        <span className="text-xs sm:text-sm text-gray-400">
                          {selectedCodes.size} code{selectedCodes.size > 1 ? 's' : ''} sélectionné{selectedCodes.size > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          disabled={isDeleting}
                          className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                        >
                          <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Supprimer</span>
                        </button>
                        <button
                          onClick={deselectAllCodes}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    
                    {selectedCodes.size === 0 && (
                      <button
                        onClick={selectAllCodes}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 text-white hover:text-gray-300 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                      >
                        Tout sélectionner
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
                <table className="w-full text-xs sm:text-sm min-w-[800px]">
                  <thead className="bg-dark-300">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCodes.size === codes.length && codes.length > 0}
                          onChange={() => {
                            if (selectedCodes.size === codes.length) {
                              deselectAllCodes()
                            } else {
                              selectAllCodes()
                            }
                          }}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 bg-dark-400 border-gray-600 rounded focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Généré le
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Commence le
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Expire le
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Utilisé par
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {codes.map((code) => (
                      <tr key={code.id} className="hover:bg-dark-300/50">
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCodes.has(code.id)}
                            onChange={() => toggleCodeSelection(code.id)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 bg-dark-400 border-gray-600 rounded focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <code className="text-xs sm:text-sm font-mono bg-dark-200 px-2 py-1 rounded text-white break-all">
                              {code.code}
                            </code>
                            <button
                              onClick={() => copyCode(code.code)}
                              className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                              title="Copier le code"
                            >
                              {copiedCode === code.code ? (
                                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                              ) : (
                                <ClipboardDocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            code.type === 'inscription' 
                              ? 'bg-green-900 text-green-300' 
                              : code.type === 'individuel'
                              ? 'bg-blue-900 text-blue-300'
                              : code.type === 'famille'
                              ? 'bg-purple-900 text-purple-300'
                              : code.type === 'individuel-annuel'
                              ? 'bg-orange-900 text-orange-300'
                              : code.type === 'famille-annuel'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {code.type === 'inscription' ? 'Inscription' : 
                             code.type === 'individuel' ? 'Individuel Pro' : 
                             code.type === 'famille' ? 'Famille et amis Pro' :
                             code.type === 'individuel-annuel' ? 'Individuel Annuel' :
                             code.type === 'famille-annuel' ? 'Famille Annuel' :
                             code.type === 'post-payment-individuel-flexible' ? 'Post-payment Individuel Flexible' :
                             code.type === 'post-payment-famille-flexible' ? 'Post-payment Famille Flexible' :
                             code.type === 'post-payment-individuel' ? 'Post-payment Individuel' :
                             code.type === 'post-payment-famille' ? 'Post-payment Famille' :
                             code.type === 'post-payment-individuel-annuel' ? 'Post-payment Individuel Annuel' :
                             code.type === 'post-payment-famille-annuel' ? 'Post-payment Famille Annuel' :
                             'Plan Premium'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                          {getStatusBadge(code)}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                          {formatDate(code.generatedAt)}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                          {formatDate(code.startsAt)}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                          {code.flexibleExpiration ? (
                            <span className="text-blue-400 font-medium break-words">Flexible (30 jours à partir de l'activation)</span>
                          ) : code.expiresAt ? (
                            formatDate(code.expiresAt)
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                          {code.usedBy.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-green-400 font-medium">
                                {code.usedBy.length} utilisateur{code.usedBy.length > 1 ? 's' : ''}
                              </span>
                              <div className="text-xs text-gray-400 break-words">
                                {code.usedBy.slice(0, 2).map((userId, index) => (
                                  <div key={index}>{userId}</div>
                                ))}
                                {code.usedBy.length > 2 && (
                                  <div>+{code.usedBy.length - 2} autres...</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Non utilisé</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                          <button
                            onClick={() => copyCode(code.code)}
                            className="text-primary-400 hover:text-primary-300 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 min-h-[44px] sm:min-h-0"
                          >
                            Copier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {codes.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-400 text-sm sm:text-base">Aucun code généré pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-400 rounded-lg border border-gray-700 p-4 sm:p-5 md:p-6 max-w-md w-full">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Supprimer les codes</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
                Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-white">{selectedCodes.size}</span> code{selectedCodes.size > 1 ? 's' : ''} premium ?
                {(() => {
                  const affectedUsers = new Set<string>()
                  codes.filter(code => selectedCodes.has(code.id)).forEach(code => {
                    code.usedBy.forEach(userId => affectedUsers.add(userId))
                  })
                  return affectedUsers.size > 0 ? (
                    <span className="block text-red-400 text-xs sm:text-sm mt-2">
                      ⚠️ <span className="font-semibold">{affectedUsers.size}</span> utilisateur{affectedUsers.size > 1 ? 's' : ''} perdront leur accès premium
                    </span>
                  ) : (
                    <span className="block text-green-400 text-xs sm:text-sm mt-2">
                      ✅ Aucun utilisateur ne sera affecté
                    </span>
                  )
                })()}
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
                >
                  Annuler
                </button>
                <button
                  onClick={deleteSelectedCodes}
                  disabled={isDeleting}
                  className="flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  )
}
