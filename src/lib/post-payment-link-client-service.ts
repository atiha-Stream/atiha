'use client'

import { logger } from './logger'

export interface PostPaymentLinkData {
  planType: 'individuel' | 'famille'
  url: string
  isActive?: boolean
}

class PostPaymentLinkClientService {
  /**
   * Obtenir tous les liens après paiement
   */
  static async getAllLinks() {
    try {
      const response = await fetch('/api/subscription/post-payment-links')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des liens')
      }
      
      return result.data
    } catch (error) {
      logger.error('Error fetching post-payment links', error as Error)
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
      logger.error(`Error fetching post-payment link for ${planType}`, error as Error)
      return null
    }
  }

  /**
   * Créer ou mettre à jour un lien après paiement
   */
  static async upsertLink(data: PostPaymentLinkData) {
    try {
      const response = await fetch('/api/subscription/post-payment-links', {
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
      
      logger.info(`Post-payment link for ${data.planType} upserted successfully`)
      return result.data
    } catch (error) {
      logger.error('Error upserting post-payment link', error as Error)
      throw error
    }
  }
}

export default PostPaymentLinkClientService

