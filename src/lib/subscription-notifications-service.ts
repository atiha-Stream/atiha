import { logger } from './logger'

export interface EssaiGratuitNotification {
  title: string
  description: string
}

export interface BienvenueNotification {
  title: string
  subtitle: string
  sectionTitle: string
  sectionDescription: string
  features: string[]
  buttonText: string
}

export interface InscriptionReussieNotification {
  title: string
  subtitle: string
  description: string
  buttonText: string
}

export interface ContenuPremiumNotification {
  title: string
  subtitle: string
  sectionTitle: string
  sectionDescription: string
  features: string[]
  cancelButton: string
  subscribeButton: string
}

export interface SubscriptionNotifications {
  essaiGratuit: EssaiGratuitNotification
  bienvenue: BienvenueNotification
  inscriptionReussie: InscriptionReussieNotification
  contenuPremium: ContenuPremiumNotification
}

class SubscriptionNotificationsService {
  private readonly STORAGE_KEY = 'atiha_subscription_notifications'

  private readonly DEFAULT_NOTIFICATIONS: SubscriptionNotifications = {
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
  }

  getNotifications(): SubscriptionNotifications {
    try {
      if (typeof window === 'undefined') return this.DEFAULT_NOTIFICATIONS
      
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Fusionner avec les valeurs par défaut pour s'assurer que tous les champs existent
        return this.mergeWithDefaults(parsed)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des notifications', error as Error)
    }
    
    return this.DEFAULT_NOTIFICATIONS
  }

  private mergeWithDefaults(saved: any): SubscriptionNotifications {
    return {
      essaiGratuit: {
        ...this.DEFAULT_NOTIFICATIONS.essaiGratuit,
        ...saved.essaiGratuit
      },
      bienvenue: {
        ...this.DEFAULT_NOTIFICATIONS.bienvenue,
        ...saved.bienvenue,
        features: saved.bienvenue?.features || this.DEFAULT_NOTIFICATIONS.bienvenue.features
      },
      inscriptionReussie: {
        ...this.DEFAULT_NOTIFICATIONS.inscriptionReussie,
        ...saved.inscriptionReussie
      },
      contenuPremium: {
        ...this.DEFAULT_NOTIFICATIONS.contenuPremium,
        ...saved.contenuPremium,
        features: saved.contenuPremium?.features || this.DEFAULT_NOTIFICATIONS.contenuPremium.features
      }
    }
  }

  getEssaiGratuitNotification(): EssaiGratuitNotification {
    return this.getNotifications().essaiGratuit
  }

  getBienvenueNotification(): BienvenueNotification {
    return this.getNotifications().bienvenue
  }

  getInscriptionReussieNotification(): InscriptionReussieNotification {
    return this.getNotifications().inscriptionReussie
  }

  getContenuPremiumNotification(): ContenuPremiumNotification {
    return this.getNotifications().contenuPremium
  }

  // Méthode pour déclencher un événement personnalisé quand les notifications sont mises à jour
  notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscriptionNotificationsUpdated'))
    }
  }
}

export const subscriptionNotificationsService = new SubscriptionNotificationsService()
