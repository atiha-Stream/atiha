/**
 * Script de migration des données d'abonnement depuis localStorage vers PostgreSQL
 * Version serveur - peut être exécuté via npm run migrate:subscription-data
 * 
 * Ce script peut :
 * 1. Lire depuis un fichier JSON exporté (si fourni)
 * 2. Migrer les données existantes dans la DB si elles sont déjà présentes
 * 3. Créer des données par défaut si aucune donnée n'existe
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface MigrationData {
  plans?: {
    individuel?: any
    famille?: any
  }
  paymentLinks?: {
    individuel?: string
    famille?: string
  }
  paymentLinksActive?: {
    individuel?: boolean
    famille?: boolean
  }
  postPaymentLinks?: {
    individuel?: string
    famille?: string
  }
  postPaymentLinksActive?: {
    individuel?: boolean
    famille?: boolean
  }
  subscriptionPrice?: {
    amount: string
    currency: string
    period: string
  }
}

async function migrateSubscriptionData() {
  console.log('🚀 Début de la migration des données d\'abonnement (version serveur)...\n')

  try {
    const results = {
      plans: { migrated: 0, errors: [] as string[] },
      paymentLinks: { migrated: 0, errors: [] as string[] },
      postPaymentLinks: { migrated: 0, errors: [] as string[] },
      subscriptionPrice: { migrated: false, errors: [] as string[] }
    }

    // Essayer de lire depuis un fichier JSON exporté
    let migrationData: MigrationData | null = null
    const exportFile = path.join(process.cwd(), 'data', 'subscription-export.json')
    
    if (fs.existsSync(exportFile)) {
      console.log('📂 Fichier d\'export trouvé, lecture des données...')
      try {
        const fileContent = fs.readFileSync(exportFile, 'utf-8')
        migrationData = JSON.parse(fileContent)
        console.log('   ✅ Données chargées depuis le fichier d\'export\n')
      } catch (error) {
        console.log(`   ⚠️  Erreur lors de la lecture du fichier: ${error}`)
        console.log('   ℹ️  Continuation sans fichier d\'export...\n')
      }
    } else {
      console.log('ℹ️  Aucun fichier d\'export trouvé (data/subscription-export.json)')
      console.log('   ℹ️  Le script va vérifier les données existantes dans la DB...\n')
    }

    // 1. Migrer les plans d'abonnement
    console.log('📋 Migration des plans d\'abonnement...')
    try {
      if (migrationData?.plans) {
        // Migrer depuis le fichier d'export
        const plans = migrationData.plans
        
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
            console.log('   ✅ Plan Individuel migré')
          } catch (error) {
            results.plans.errors.push(`Error migrating individuel plan: ${error}`)
            console.log(`   ❌ Erreur lors de la migration du plan Individuel: ${error}`)
          }
        }

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
            console.log('   ✅ Plan Famille migré')
          } catch (error) {
            results.plans.errors.push(`Error migrating famille plan: ${error}`)
            console.log(`   ❌ Erreur lors de la migration du plan Famille: ${error}`)
          }
        }
      } else {
        // Vérifier si des plans existent déjà dans la DB
        const existingPlans = await prisma.subscriptionPlan.findMany()
        if (existingPlans.length > 0) {
          console.log(`   ℹ️  ${existingPlans.length} plan(s) déjà présent(s) dans la base de données`)
        } else {
          console.log('   ℹ️  Aucun plan à migrer (pas de données dans le fichier d\'export)')
        }
      }
      
      if (results.plans.migrated > 0) {
        console.log(`   ✅ ${results.plans.migrated} plan(s) migré(s)`)
      }
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
      if (migrationData?.paymentLinks) {
        const paymentLinks = migrationData.paymentLinks
        const paymentLinksActive = migrationData.paymentLinksActive || {}

        if (paymentLinks.individuel) {
          try {
            await prisma.paymentLink.upsert({
              where: { planType: 'individuel' },
              update: {
                url: paymentLinks.individuel,
                isActive: paymentLinksActive.individuel !== false
              },
              create: {
                id: `payment_link_individuel_${Date.now()}`,
                planType: 'individuel',
                url: paymentLinks.individuel,
                isActive: paymentLinksActive.individuel !== false
              }
            })
            results.paymentLinks.migrated++
            console.log('   ✅ Lien de paiement Individuel migré')
          } catch (error) {
            results.paymentLinks.errors.push(`Error migrating individuel payment link: ${error}`)
            console.log(`   ❌ Erreur lors de la migration du lien Individuel: ${error}`)
          }
        }

        if (paymentLinks.famille) {
          try {
            await prisma.paymentLink.upsert({
              where: { planType: 'famille' },
              update: {
                url: paymentLinks.famille,
                isActive: paymentLinksActive.famille !== false
              },
              create: {
                id: `payment_link_famille_${Date.now()}`,
                planType: 'famille',
                url: paymentLinks.famille,
                isActive: paymentLinksActive.famille !== false
              }
            })
            results.paymentLinks.migrated++
            console.log('   ✅ Lien de paiement Famille migré')
          } catch (error) {
            results.paymentLinks.errors.push(`Error migrating famille payment link: ${error}`)
            console.log(`   ❌ Erreur lors de la migration du lien Famille: ${error}`)
          }
        }
      } else {
        const existingLinks = await prisma.paymentLink.findMany()
        if (existingLinks.length > 0) {
          console.log(`   ℹ️  ${existingLinks.length} lien(s) déjà présent(s) dans la base de données`)
        } else {
          console.log('   ℹ️  Aucun lien à migrer (pas de données dans le fichier d\'export)')
        }
      }
      
      if (results.paymentLinks.migrated > 0) {
        console.log(`   ✅ ${results.paymentLinks.migrated} lien(s) migré(s)`)
      }
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
      if (migrationData?.postPaymentLinks) {
        const postPaymentLinks = migrationData.postPaymentLinks
        const postPaymentLinksActive = migrationData.postPaymentLinksActive || {}

        if (postPaymentLinks.individuel) {
          try {
            await prisma.postPaymentLink.upsert({
              where: { planType: 'individuel' },
              update: {
                url: postPaymentLinks.individuel,
                isActive: postPaymentLinksActive.individuel !== false
              },
              create: {
                id: `post_payment_link_individuel_${Date.now()}`,
                planType: 'individuel',
                url: postPaymentLinks.individuel,
                isActive: postPaymentLinksActive.individuel !== false
              }
            })
            results.postPaymentLinks.migrated++
            console.log('   ✅ Lien après paiement Individuel migré')
          } catch (error) {
            results.postPaymentLinks.errors.push(`Error migrating individuel post-payment link: ${error}`)
            console.log(`   ❌ Erreur lors de la migration du lien Individuel: ${error}`)
          }
        }

        if (postPaymentLinks.famille) {
          try {
            await prisma.postPaymentLink.upsert({
              where: { planType: 'famille' },
              update: {
                url: postPaymentLinks.famille,
                isActive: postPaymentLinksActive.famille !== false
              },
              create: {
                id: `post_payment_link_famille_${Date.now()}`,
                planType: 'famille',
                url: postPaymentLinks.famille,
                isActive: postPaymentLinksActive.famille !== false
              }
            })
            results.postPaymentLinks.migrated++
            console.log('   ✅ Lien après paiement Famille migré')
          } catch (error) {
            results.postPaymentLinks.errors.push(`Error migrating famille post-payment link: ${error}`)
            console.log(`   ❌ Erreur lors de la migration du lien Famille: ${error}`)
          }
        }
      } else {
        const existingLinks = await prisma.postPaymentLink.findMany()
        if (existingLinks.length > 0) {
          console.log(`   ℹ️  ${existingLinks.length} lien(s) déjà présent(s) dans la base de données`)
        } else {
          console.log('   ℹ️  Aucun lien à migrer (pas de données dans le fichier d\'export)')
        }
      }
      
      if (results.postPaymentLinks.migrated > 0) {
        console.log(`   ✅ ${results.postPaymentLinks.migrated} lien(s) migré(s)`)
      }
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
      if (migrationData?.subscriptionPrice) {
        const price = migrationData.subscriptionPrice
        
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
              updatedBy: 'system'
            }
          })
          results.subscriptionPrice.migrated = true
          console.log('   ✅ Prix d\'abonnement migré')
        } else {
          console.log('   ℹ️  Prix d\'abonnement déjà présent dans la base de données')
        }
      } else {
        const existingPrice = await prisma.subscriptionPrice.findFirst()
        if (existingPrice) {
          console.log('   ℹ️  Prix d\'abonnement déjà présent dans la base de données')
        } else {
          console.log('   ℹ️  Aucun prix d\'abonnement à migrer (pas de données dans le fichier d\'export)')
        }
      }
    } catch (error) {
      results.subscriptionPrice.errors.push(String(error))
      console.log(`   ❌ Erreur: ${error}`)
    }

    // Résumé
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ DE LA MIGRATION')
    console.log('='.repeat(60))
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

    console.log('\n💡 Note: Si vous avez des données dans localStorage,')
    console.log('   vous pouvez les exporter et les placer dans data/subscription-export.json')
    console.log('   puis réexécuter ce script.\n')

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
migrateSubscriptionData()
  .then(() => {
    console.log('✨ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

export default migrateSubscriptionData

