'use client'

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

class SubscriptionPlanClientService {
  /**
   * Obtenir tous les plans d'abonnement
   */
  static async getAllPlans() {
    try {
      const response = await fetch('/api/subscription/plans')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des plans')
      }
      
      return result.data
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
      const plans = await this.getAllPlans()
      return plans.find((p: any) => p.type === type) || null
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
      const response = await fetch('/api/subscription/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde du plan')
      }
      
      logger.info(`Subscription plan ${data.type} upserted successfully`)
      return result.data
    } catch (error) {
      logger.error('Error upserting subscription plan', error as Error)
      throw error
    }
  }
}

export default SubscriptionPlanClientService

