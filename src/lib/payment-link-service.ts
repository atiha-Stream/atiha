'use client'

import { prisma } from './database'
import { logger } from './logger'
import { SecureStorage } from './secure-storage'

export interface PaymentLinkData {
  planType: 'individuel' | 'famille'
  url: string
  isActive?: boolean
  createdBy?: string
}

class PaymentLinkService {
  /**
   * Obtenir tous les liens de paiement
   */
  static async getAllLinks() {
    try {
      const links = await prisma.paymentLink.findMany({
        orderBy: { planType: 'asc' }
      })
      return links
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
      const link = await prisma.paymentLink.findUnique({
        where: { planType }
      })
      return link
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
      const link = await prisma.paymentLink.findUnique({
        where: { planType }
      })
      
      if (link && link.isActive && link.url) {
        return link.url
      }
      
      return null
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
      const link = await prisma.paymentLink.upsert({
        where: { planType: data.planType },
        update: {
          url: data.url,
          isActive: data.isActive ?? true
        },
        create: {
          id: `payment_link_${data.planType}_${Date.now()}`,
          planType: data.planType,
          url: data.url,
          isActive: data.isActive ?? true,
          createdBy: data.createdBy
        }
      })
      logger.info(`Payment link for ${data.planType} upserted successfully`)
      return link
    } catch (error) {
      logger.error('Error upserting payment link', error as Error)
      throw error
    }
  }

  /**
   * Activer/désactiver un lien
   */
  static async toggleLink(planType: 'individuel' | 'famille') {
    try {
      const link = await prisma.paymentLink.findUnique({
        where: { planType }
      })
      
      if (!link) {
        throw new Error(`Payment link for ${planType} not found`)
      }

      const updated = await prisma.paymentLink.update({
        where: { planType },
        data: { isActive: !link.isActive }
      })
      
      logger.info(`Payment link for ${planType} toggled to ${updated.isActive}`)
      return updated
    } catch (error) {
      logger.error(`Error toggling payment link for ${planType}`, error as Error)
      throw error
    }
  }

  /**
   * Migrer les liens depuis SecureStorage
   */
  static async migrateFromLocalStorage() {
    try {
      if (typeof window === 'undefined') return { migrated: 0, errors: [] }

      const paymentLinks = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_payment_links')
      const paymentLinksActive = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_payment_links_active')

      if (!paymentLinks) {
        logger.info('No payment links found in SecureStorage')
        return { migrated: 0, errors: [] }
      }

      const errors: string[] = []
      let migrated = 0

      // Migrer le lien individuel
      if (paymentLinks.individuel) {
        try {
          await this.upsertLink({
            planType: 'individuel',
            url: paymentLinks.individuel,
            isActive: paymentLinksActive?.individuel !== false
          })
          migrated++
        } catch (error) {
          errors.push(`Error migrating individuel payment link: ${error}`)
        }
      }

      // Migrer le lien famille
      if (paymentLinks.famille) {
        try {
          await this.upsertLink({
            planType: 'famille',
            url: paymentLinks.famille,
            isActive: paymentLinksActive?.famille !== false
          })
          migrated++
        } catch (error) {
          errors.push(`Error migrating famille payment link: ${error}`)
        }
      }

      logger.info(`Migrated ${migrated} payment links from SecureStorage`)
      return { migrated, errors }
    } catch (error) {
      logger.error('Error migrating payment links', error as Error)
      return { migrated: 0, errors: [String(error)] }
    }
  }
}

export default PaymentLinkService

