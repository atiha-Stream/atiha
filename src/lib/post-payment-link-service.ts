'use client'

import { prisma } from './database'
import { logger } from './logger'
import { SecureStorage } from './secure-storage'

export interface PostPaymentLinkData {
  planType: 'individuel' | 'famille'
  url: string
  isActive?: boolean
}

class PostPaymentLinkService {
  /**
   * Obtenir tous les liens après paiement
   */
  static async getAllLinks() {
    try {
      const links = await prisma.postPaymentLink.findMany({
        orderBy: { planType: 'asc' }
      })
      return links
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
      const link = await prisma.postPaymentLink.findUnique({
        where: { planType }
      })
      return link
    } catch (error) {
      logger.error(`Error fetching post-payment link for ${planType}`, error as Error)
      return null
    }
  }

  /**
   * Obtenir l'URL active après paiement pour un type de plan
   */
  static async getActivePostPaymentUrl(planType: 'individuel' | 'famille'): Promise<string | null> {
    try {
      const link = await prisma.postPaymentLink.findUnique({
        where: { planType }
      })
      
      if (link && link.isActive && link.url) {
        return link.url
      }
      
      return null
    } catch (error) {
      logger.error(`Error getting active post-payment URL for ${planType}`, error as Error)
      return null
    }
  }

  /**
   * Créer ou mettre à jour un lien après paiement
   */
  static async upsertLink(data: PostPaymentLinkData) {
    try {
      const link = await prisma.postPaymentLink.upsert({
        where: { planType: data.planType },
        update: {
          url: data.url,
          isActive: data.isActive ?? true
        },
        create: {
          id: `post_payment_link_${data.planType}_${Date.now()}`,
          planType: data.planType,
          url: data.url,
          isActive: data.isActive ?? true
        }
      })
      logger.info(`Post-payment link for ${data.planType} upserted successfully`)
      return link
    } catch (error) {
      logger.error('Error upserting post-payment link', error as Error)
      throw error
    }
  }

  /**
   * Activer/désactiver un lien
   */
  static async toggleLink(planType: 'individuel' | 'famille') {
    try {
      const link = await prisma.postPaymentLink.findUnique({
        where: { planType }
      })
      
      if (!link) {
        throw new Error(`Post-payment link for ${planType} not found`)
      }

      const updated = await prisma.postPaymentLink.update({
        where: { planType },
        data: { isActive: !link.isActive }
      })
      
      logger.info(`Post-payment link for ${planType} toggled to ${updated.isActive}`)
      return updated
    } catch (error) {
      logger.error(`Error toggling post-payment link for ${planType}`, error as Error)
      throw error
    }
  }

  /**
   * Migrer les liens depuis SecureStorage
   */
  static async migrateFromLocalStorage() {
    try {
      if (typeof window === 'undefined') return { migrated: 0, errors: [] }

      const postPaymentLinks = SecureStorage.getItemJSON<{ individuel: string; famille: string }>('atiha_post_payment_links')
      const postPaymentLinksActive = SecureStorage.getItemJSON<{ individuel: boolean; famille: boolean }>('atiha_post_payment_links_active')

      if (!postPaymentLinks) {
        logger.info('No post-payment links found in SecureStorage')
        return { migrated: 0, errors: [] }
      }

      const errors: string[] = []
      let migrated = 0

      // Migrer le lien individuel
      if (postPaymentLinks.individuel) {
        try {
          await this.upsertLink({
            planType: 'individuel',
            url: postPaymentLinks.individuel,
            isActive: postPaymentLinksActive?.individuel !== false
          })
          migrated++
        } catch (error) {
          errors.push(`Error migrating individuel post-payment link: ${error}`)
        }
      }

      // Migrer le lien famille
      if (postPaymentLinks.famille) {
        try {
          await this.upsertLink({
            planType: 'famille',
            url: postPaymentLinks.famille,
            isActive: postPaymentLinksActive?.famille !== false
          })
          migrated++
        } catch (error) {
          errors.push(`Error migrating famille post-payment link: ${error}`)
        }
      }

      logger.info(`Migrated ${migrated} post-payment links from SecureStorage`)
      return { migrated, errors }
    } catch (error) {
      logger.error('Error migrating post-payment links', error as Error)
      return { migrated: 0, errors: [String(error)] }
    }
  }
}

export default PostPaymentLinkService

