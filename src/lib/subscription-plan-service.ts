'use client'

import { prisma } from './database'
import { logger } from './logger'

export interface SubscriptionPlanData {
  type: 'individuel' | 'famille'
  title: string
  price: string
  period: string
  commitment: string
  description?: string
  features: string[]
  buttonText: string
  buttonColor: string
  paymentUrl?: string
  isActive?: boolean
}

class SubscriptionPlanService {
  /**
   * Obtenir tous les plans d'abonnement
   */
  static async getAllPlans() {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { type: 'asc' }
      })
      return plans
    } catch (error) {
      logger.error('Error fetching subscription plans', error as Error)
      return []
    }
  }

  /**
   * Obtenir un plan par type
   */
  static async getPlanByType(type: 'individuel' | 'famille') {
    try {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { type }
      })
      return plan
    } catch (error) {
      logger.error(`Error fetching subscription plan ${type}`, error as Error)
      return null
    }
  }

  /**
   * Créer ou mettre à jour un plan
   */
  static async upsertPlan(data: SubscriptionPlanData) {
    try {
      const plan = await prisma.subscriptionPlan.upsert({
        where: { type: data.type },
        update: {
          title: data.title,
          price: data.price,
          period: data.period,
          commitment: data.commitment,
          description: data.description,
          features: data.features as any,
          buttonText: data.buttonText,
          buttonColor: data.buttonColor,
          paymentUrl: data.paymentUrl,
          isActive: data.isActive ?? true
        },
        create: {
          id: `plan_${data.type}_${Date.now()}`,
          type: data.type,
          title: data.title,
          price: data.price,
          period: data.period,
          commitment: data.commitment,
          description: data.description,
          features: data.features as any,
          buttonText: data.buttonText,
          buttonColor: data.buttonColor,
          paymentUrl: data.paymentUrl,
          isActive: data.isActive ?? true
        }
      })
      logger.info(`Subscription plan ${data.type} upserted successfully`)
      return plan
    } catch (error) {
      logger.error('Error upserting subscription plan', error as Error)
      throw error
    }
  }

  /**
   * Migrer les plans depuis localStorage
   */
  static async migrateFromLocalStorage() {
    try {
      if (typeof window === 'undefined') return { migrated: 0, errors: [] }

      const savedPlans = localStorage.getItem('atiha_subscription_plans')
      if (!savedPlans) {
        logger.info('No subscription plans found in localStorage')
        return { migrated: 0, errors: [] }
      }

      const plans = JSON.parse(savedPlans)
      const errors: string[] = []
      let migrated = 0

      // Migrer le plan individuel
      if (plans.individuel) {
        try {
          await this.upsertPlan({
            type: 'individuel',
            title: plans.individuel.title || 'Individuel',
            price: plans.individuel.price || '1999 fcfa/mois',
            period: plans.individuel.period || 'Mensuel',
            commitment: plans.individuel.commitment || 'Sans engagement',
            description: plans.individuel.description,
            features: plans.individuel.features || ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
            buttonText: plans.individuel.buttonText || 'Passer au paiement',
            buttonColor: plans.individuel.buttonColor || '#3B82F6',
            paymentUrl: plans.individuel.paymentUrl,
            isActive: plans.individuel.isActive !== false
          })
          migrated++
        } catch (error) {
          errors.push(`Error migrating individuel plan: ${error}`)
        }
      }

      // Migrer le plan famille
      if (plans.famille) {
        try {
          await this.upsertPlan({
            type: 'famille',
            title: plans.famille.title || 'Famille',
            price: plans.famille.price || '2999 fcfa/mois',
            period: plans.famille.period || 'Mensuel',
            commitment: plans.famille.commitment || 'Sans engagement',
            description: plans.famille.description || 'Ajoutez jusqu\'à 5 membres de votre famille (âgés de 13 ans et plus) à votre foyer.',
            features: plans.famille.features || ['Accès rapide', 'Contenu premium', 'Téléchargement hors ligne'],
            buttonText: plans.famille.buttonText || 'Passer au paiement',
            buttonColor: plans.famille.buttonColor || '#10B981',
            paymentUrl: plans.famille.paymentUrl,
            isActive: plans.famille.isActive !== false
          })
          migrated++
        } catch (error) {
          errors.push(`Error migrating famille plan: ${error}`)
        }
      }

      logger.info(`Migrated ${migrated} subscription plans from localStorage`)
      return { migrated, errors }
    } catch (error) {
      logger.error('Error migrating subscription plans', error as Error)
      return { migrated: 0, errors: [String(error)] }
    }
  }
}

export default SubscriptionPlanService

