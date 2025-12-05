import { logger } from './logger'

export interface SubscriptionPrice {
  amount: string
  currency: string
  period: string
  lastUpdated: string
  updatedBy: string
}

class SubscriptionPriceService {
  private readonly STORAGE_KEY = 'atiha_subscription_price'

  // Prix par défaut
  private readonly DEFAULT_PRICE: SubscriptionPrice = {
    amount: '1499',
    currency: 'fcfa',
    period: 'mois',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  }

  // Obtenir le prix actuel
  getCurrentPrice(): SubscriptionPrice {
    if (typeof window === 'undefined') {
      return this.DEFAULT_PRICE
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      logger.error('Error loading subscription price', error as Error)
    }

    return this.DEFAULT_PRICE
  }

  // Mettre à jour le prix
  updatePrice(amount: string, currency: string, period: string, updatedBy: string): void {
    if (typeof window === 'undefined') return

    try {
      const newPrice: SubscriptionPrice = {
        amount: amount.trim(),
        currency: currency.trim(),
        period: period.trim(),
        lastUpdated: new Date().toISOString(),
        updatedBy: updatedBy.trim()
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newPrice))
      logger.info('✅ Subscription price updated successfully')
    } catch (error) {
      logger.error('❌ Error updating subscription price', error as Error)
      throw new Error('Erreur lors de la mise à jour du prix')
    }
  }

  // Obtenir le prix formaté pour l'affichage
  getFormattedPrice(): string {
    const price = this.getCurrentPrice()
    return `${price.amount}${price.currency}/${price.period}`
  }

  // Réinitialiser au prix par défaut
  resetToDefault(updatedBy: string): void {
    this.updatePrice(
      this.DEFAULT_PRICE.amount,
      this.DEFAULT_PRICE.currency,
      this.DEFAULT_PRICE.period,
      updatedBy
    )
  }
}

export const subscriptionPriceService = new SubscriptionPriceService()
