/**
 * Script de migration des données d'abonnement depuis localStorage vers PostgreSQL
 * 
 * Usage: 
 * - Côté client: Exécuter depuis la console du navigateur après avoir importé le script
 * - Côté serveur: npm run migrate:subscription-data (si adapté pour serveur)
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()

async function migrateSubscriptionData() {
  console.log('🚀 Début de la migration des données d\'abonnement...\n')

  try {
    // Vérifier que nous sommes dans un environnement client
    if (typeof window === 'undefined') {
      console.log('⚠️  Ce script doit être exécuté côté client (browser)')
      return
    }

    const results = {
      plans: { migrated: 0, errors: [] as string[] },
      paymentLinks: { migrated: 0, errors: [] as string[] },
      postPaymentLinks: { migrated: 0, errors: [] as string[] },
      subscriptionPrice: { migrated: false, errors: [] as string[] }
    }

    // 1. Migrer les plans d'abonnement
    console.log('📋 Migration des plans d\'abonnement...')
    try {
      const savedPlans = localStorage.getItem('atiha_subscription_plans')
      if (savedPlans) {
        const plans = JSON.parse(savedPlans)
        
        // Migrer le plan individuel
        if (plans.individuel) {
          try {
            await prisma.subscriptionPlan.upsert({
              where: { type: 'individuel' },
              update: {
                title: plans.individuel.title || 'Individuel',
                price: plans.individuel.price || '1999 fcfa/mois',
                period: plans.individuel.period || 'Mensuel',
                commitment: plans.individuel.commitment || 'Sans engagement',
                description: plans.individuel.description,
                features: (plans.individuel.features || []) as any,
                buttonText: plans.individuel.buttonText || 'Passer au paiement',
                buttonColor: plans.individuel.buttonColor || '#3B82F6',
                paymentUrl: plans.individuel.paymentUrl,
                isActive: plans.individuel.isActive !== false
              },
              create: {
                id: `plan_individuel_${Date.now()}`,
                type: 'individuel',
                title: plans.individuel.title || 'Individuel',
                price: plans.individuel.price || '1999 fcfa/mois',
                period: plans.individuel.period || 'Mensuel',
                commitment: plans.individuel.commitment || 'Sans engagement',
                description: plans.individuel.description,
                features: (plans.individuel.features || []) as any,
                buttonText: plans.individuel.buttonText || 'Passer au paiement',
                buttonColor: plans.individuel.buttonColor || '#3B82F6',
                paymentUrl: plans.individuel.paymentUrl,
                isActive: plans.individuel.isActive !== false
              }
            })
            results.plans.migrated++
          } catch (error) {
            results.plans.errors.push(`Error migrating individuel plan: ${error}`)
          }
        }

        // Migrer le plan famille
        if (plans.famille) {
          try {
            await prisma.subscriptionPlan.upsert({
              where: { type: 'famille' },
              update: {
                title: plans.famille.title || 'Famille',
                price: plans.famille.price || '2999 fcfa/mois',
                period: plans.famille.period || 'Mensuel',
                commitment: plans.famille.commitment || 'Sans engagement',
                description: plans.famille.description,
                features: (plans.famille.features || []) as any,
                buttonText: plans.famille.buttonText || 'Passer au paiement',
                buttonColor: plans.famille.buttonColor || '#10B981',
                paymentUrl: plans.famille.paymentUrl,
                isActive: plans.famille.isActive !== false
              },
              create: {
                id: `plan_famille_${Date.now()}`,
                type: 'famille',
                title: plans.famille.title || 'Famille',
                price: plans.famille.price || '2999 fcfa/mois',
                period: plans.famille.period || 'Mensuel',
                commitment: plans.famille.commitment || 'Sans engagement',
                description: plans.famille.description,
                features: (plans.famille.features || []) as any,
                buttonText: plans.famille.buttonText || 'Passer au paiement',
                buttonColor: plans.famille.buttonColor || '#10B981',
                paymentUrl: plans.famille.paymentUrl,
                isActive: plans.famille.isActive !== false
              }
            })
            results.plans.migrated++
          } catch (error) {
            results.plans.errors.push(`Error migrating famille plan: ${error}`)
          }
        }
      }
      
      console.log(`   ✅ ${results.plans.migrated} plan(s) migré(s)`)
      if (results.plans.errors.length > 0) {
        console.log(`   ⚠️  ${results.plans.errors.length} erreur(s)`)
        results.plans.errors.forEach(err => console.log(`      - ${err}`))
      }
    } catch (error) {
      results.plans.errors.push(String(error))
      console.log(`   ❌ Erreur: ${error}`)
    }

    // 2. Migrer les liens de paiement
    console.log('\n🔗 Migration des liens de paiement...')
    try {
      // Utiliser SecureStorage si disponible, sinon localStorage
      let paymentLinks: any = null
      let paymentLinksActive: any = null
      
      try {
        // Essayer SecureStorage d'abord
        if (typeof (window as any).SecureStorage !== 'undefined') {
          paymentLinks = (window as any).SecureStorage.getItemJSON('atiha_payment_links')
          paymentLinksActive = (window as any).SecureStorage.getItemJSON('atiha_payment_links_active')
        } else {
          // Fallback vers localStorage
          const linksStr = localStorage.getItem('atiha_payment_links')
          const activeStr = localStorage.getItem('atiha_payment_links_active')
          if (linksStr) paymentLinks = JSON.parse(linksStr)
          if (activeStr) paymentLinksActive = JSON.parse(activeStr)
        }
      } catch (e) {
        // Si SecureStorage n'est pas disponible, utiliser localStorage directement
        const linksStr = localStorage.getItem('atiha_payment_links')
        const activeStr = localStorage.getItem('atiha_payment_links_active')
        if (linksStr) paymentLinks = JSON.parse(linksStr)
        if (activeStr) paymentLinksActive = JSON.parse(activeStr)
      }

      if (paymentLinks) {
        // Migrer le lien individuel
        if (paymentLinks.individuel) {
          try {
            await prisma.paymentLink.upsert({
              where: { planType: 'individuel' },
              update: {
                url: paymentLinks.individuel,
                isActive: paymentLinksActive?.individuel !== false
              },
              create: {
                id: `payment_link_individuel_${Date.now()}`,
                planType: 'individuel',
                url: paymentLinks.individuel,
                isActive: paymentLinksActive?.individuel !== false
              }
            })
            results.paymentLinks.migrated++
          } catch (error) {
            results.paymentLinks.errors.push(`Error migrating individuel payment link: ${error}`)
          }
        }

        // Migrer le lien famille
        if (paymentLinks.famille) {
          try {
            await prisma.paymentLink.upsert({
              where: { planType: 'famille' },
              update: {
                url: paymentLinks.famille,
                isActive: paymentLinksActive?.famille !== false
              },
              create: {
                id: `payment_link_famille_${Date.now()}`,
                planType: 'famille',
                url: paymentLinks.famille,
                isActive: paymentLinksActive?.famille !== false
              }
            })
            results.paymentLinks.migrated++
          } catch (error) {
            results.paymentLinks.errors.push(`Error migrating famille payment link: ${error}`)
          }
        }
      }
      
      console.log(`   ✅ ${results.paymentLinks.migrated} lien(s) migré(s)`)
      if (results.paymentLinks.errors.length > 0) {
        console.log(`   ⚠️  ${results.paymentLinks.errors.length} erreur(s)`)
        results.paymentLinks.errors.forEach(err => console.log(`      - ${err}`))
      }
    } catch (error) {
      results.paymentLinks.errors.push(String(error))
      console.log(`   ❌ Erreur: ${error}`)
    }

    // 3. Migrer les liens après paiement
    console.log('\n🔗 Migration des liens après paiement...')
    try {
      // Utiliser SecureStorage si disponible, sinon localStorage
      let postPaymentLinks: any = null
      let postPaymentLinksActive: any = null
      
      try {
        if (typeof (window as any).SecureStorage !== 'undefined') {
          postPaymentLinks = (window as any).SecureStorage.getItemJSON('atiha_post_payment_links')
          postPaymentLinksActive = (window as any).SecureStorage.getItemJSON('atiha_post_payment_links_active')
        } else {
          const linksStr = localStorage.getItem('atiha_post_payment_links')
          const activeStr = localStorage.getItem('atiha_post_payment_links_active')
          if (linksStr) postPaymentLinks = JSON.parse(linksStr)
          if (activeStr) postPaymentLinksActive = JSON.parse(activeStr)
        }
      } catch (e) {
        const linksStr = localStorage.getItem('atiha_post_payment_links')
        const activeStr = localStorage.getItem('atiha_post_payment_links_active')
        if (linksStr) postPaymentLinks = JSON.parse(linksStr)
        if (activeStr) postPaymentLinksActive = JSON.parse(activeStr)
      }

      if (postPaymentLinks) {
        // Migrer le lien individuel
        if (postPaymentLinks.individuel) {
          try {
            await prisma.postPaymentLink.upsert({
              where: { planType: 'individuel' },
              update: {
                url: postPaymentLinks.individuel,
                isActive: postPaymentLinksActive?.individuel !== false
              },
              create: {
                id: `post_payment_link_individuel_${Date.now()}`,
                planType: 'individuel',
                url: postPaymentLinks.individuel,
                isActive: postPaymentLinksActive?.individuel !== false
              }
            })
            results.postPaymentLinks.migrated++
          } catch (error) {
            results.postPaymentLinks.errors.push(`Error migrating individuel post-payment link: ${error}`)
          }
        }

        // Migrer le lien famille
        if (postPaymentLinks.famille) {
          try {
            await prisma.postPaymentLink.upsert({
              where: { planType: 'famille' },
              update: {
                url: postPaymentLinks.famille,
                isActive: postPaymentLinksActive?.famille !== false
              },
              create: {
                id: `post_payment_link_famille_${Date.now()}`,
                planType: 'famille',
                url: postPaymentLinks.famille,
                isActive: postPaymentLinksActive?.famille !== false
              }
            })
            results.postPaymentLinks.migrated++
          } catch (error) {
            results.postPaymentLinks.errors.push(`Error migrating famille post-payment link: ${error}`)
          }
        }
      }
      
      console.log(`   ✅ ${results.postPaymentLinks.migrated} lien(s) migré(s)`)
      if (results.postPaymentLinks.errors.length > 0) {
        console.log(`   ⚠️  ${results.postPaymentLinks.errors.length} erreur(s)`)
        results.postPaymentLinks.errors.forEach(err => console.log(`      - ${err}`))
      }
    } catch (error) {
      results.postPaymentLinks.errors.push(String(error))
      console.log(`   ❌ Erreur: ${error}`)
    }

    // 4. Migrer le prix d'abonnement
    console.log('\n💰 Migration du prix d\'abonnement...')
    try {
      const savedPrice = localStorage.getItem('atiha_subscription_price')
      if (savedPrice) {
        const price = JSON.parse(savedPrice)
        
        // Vérifier si un prix existe déjà
        const existingPrice = await prisma.subscriptionPrice.findFirst({
          orderBy: { createdAt: 'desc' }
        })

        if (!existingPrice || existingPrice.amount !== price.amount || existingPrice.currency !== price.currency) {
          await prisma.subscriptionPrice.create({
            data: {
              id: `price_${Date.now()}`,
              amount: price.amount,
              currency: price.currency,
              period: price.period,
              updatedBy: price.updatedBy || 'system'
            }
          })
          results.subscriptionPrice.migrated = true
          console.log('   ✅ Prix d\'abonnement migré')
        } else {
          console.log('   ℹ️  Prix d\'abonnement déjà présent dans la base de données')
        }
      } else {
        console.log('   ℹ️  Aucun prix d\'abonnement trouvé dans localStorage')
      }
    } catch (error) {
      results.subscriptionPrice.errors.push(String(error))
      console.log(`   ❌ Erreur: ${error}`)
    }

    // Résumé
    console.log('\n📊 Résumé de la migration:')
    console.log(`   Plans d'abonnement: ${results.plans.migrated} migré(s)`)
    console.log(`   Liens de paiement: ${results.paymentLinks.migrated} migré(s)`)
    console.log(`   Liens après paiement: ${results.postPaymentLinks.migrated} migré(s)`)
    console.log(`   Prix d'abonnement: ${results.subscriptionPrice.migrated ? 'Migré' : 'Non migré'}`)

    const totalErrors = results.plans.errors.length + 
                       results.paymentLinks.errors.length + 
                       results.postPaymentLinks.errors.length + 
                       results.subscriptionPrice.errors.length

    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} erreur(s) au total`)
    } else {
      console.log('\n✅ Migration terminée avec succès!')
    }

    return results
  } catch (error) {
    logger.error('Error during subscription data migration', error as Error)
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration si le script est appelé directement
if (typeof window !== 'undefined') {
  // Exposer la fonction globalement pour pouvoir l'appeler depuis la console
  (window as any).migrateSubscriptionData = migrateSubscriptionData
  console.log('💡 Pour migrer les données, exécutez: migrateSubscriptionData()')
}

export default migrateSubscriptionData

