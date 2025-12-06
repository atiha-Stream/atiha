'use client'

import { logger } from './logger'

export interface PaymentLinkData {
  planType: 'individuel' | 'famille'
  url: string
  isActive?: boolean
  createdBy?: string
}

class PaymentLinkClientService {
  /**
   * Obtenir tous les liens de paiement
   */
  static async getAllLinks() {
    try {
      const response = await fetch('/api/subscription/payment-links')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des liens')
      }
      
      return result.data
    } catch (error) {
      logger.error('Error fetching payment links', error as Error)
      return []
    }
  }

  /**
   * Obtenir un lien par type de plan
   */
  static async getLinkByPlanType(planType: 'individuel' | 'famille') {
    try {
      const links = await this.getAllLinks()
      return links.find((l: any) => l.planType === planType && l.isActive) || null
    } catch (error) {
      logger.error(`Error fetching payment link for ${planType}`, error as Error)
      return null
    }
  }

  /**
   * Obtenir l'URL de paiement active pour un type de plan
   */
  static async getActivePaymentUrl(planType: 'individuel' | 'famille'): Promise<string | null> {
    try {
      const link = await this.getLinkByPlanType(planType)
      return link?.url || null
    } catch (error) {
      logger.error(`Error getting active payment URL for ${planType}`, error as Error)
      return null
    }
  }

  /**
   * Créer ou mettre à jour un lien de paiement
   */
  static async upsertLink(data: PaymentLinkData) {
    try {
      const response = await fetch('/api/subscription/payment-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde du lien')
      }
      
      logger.info(`Payment link for ${data.planType} upserted successfully`)
      return result.data
    } catch (error) {
      logger.error('Error upserting payment link', error as Error)
      throw error
    }
  }
}

export default PaymentLinkClientService

