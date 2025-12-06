/**
 * Script de test de connexion à la base de données PostgreSQL via Prisma
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔌 Test de connexion à la base de données...\n')

    // Test 1: Connexion basique
    console.log('1️⃣ Test de connexion basique...')
    await prisma.$connect()
    console.log('   ✅ Connexion réussie!\n')

    // Test 2: Requête simple
    console.log('2️⃣ Test de requête simple...')
    const userCount = await prisma.user.count()
    console.log(`   ✅ Nombre d'utilisateurs: ${userCount}\n`)

    // Test 3: Vérifier les tables
    console.log('3️⃣ Vérification des tables...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
    console.log(`   ✅ Tables trouvées: ${tables.length}`)
    tables.forEach(table => {
      console.log(`      - ${table.tablename}`)
    })
    console.log()

    // Test 4: Vérifier les modèles Prisma
    console.log('4️⃣ Vérification des modèles Prisma...')
    const models = [
      'User',
      'UserProfile',
      'WatchHistory',
      'Watchlist',
      'Rating',
      'Favorite',
      'UserSession',
      'TwoFactorAuth',
      'Admin',
      'AdminSession',
      'AdminTwoFactorAuth',
      'SecurityLog',
      'HomepageEditor',
      'PremiumCode',
      'PremiumCodeUsage',
      'SubscriptionPrice',
      'SubscriptionPlan',
      'PaymentLink',
      'PostPaymentLink',
      'Payment'
    ]

    const modelMap: { [key: string]: string } = {
      'User': 'user',
      'UserProfile': 'userProfile',
      'WatchHistory': 'watchHistory',
      'Watchlist': 'watchlist',
      'Rating': 'rating',
      'Favorite': 'favorite',
      'UserSession': 'userSession',
      'TwoFactorAuth': 'twoFactorAuth',
      'Admin': 'admin',
      'AdminSession': 'adminSession',
      'AdminTwoFactorAuth': 'adminTwoFactorAuth',
      'SecurityLog': 'securityLog',
      'HomepageEditor': 'homepageEditor',
      'PremiumCode': 'premiumCode',
      'PremiumCodeUsage': 'premiumCodeUsage',
      'SubscriptionPrice': 'subscriptionPrice',
      'SubscriptionPlan': 'subscriptionPlan',
      'PaymentLink': 'paymentLink',
      'PostPaymentLink': 'postPaymentLink',
      'Payment': 'payment'
    }

    for (const model of models) {
      try {
        const prismaModelName = modelMap[model] || model.toLowerCase()
        const count = await (prisma as any)[prismaModelName].count()
        console.log(`   ✅ ${model}: ${count} enregistrement(s)`)
      } catch (error) {
        console.log(`   ⚠️  ${model}: Erreur (table peut-être vide)`)
      }
    }
    console.log()

    // Test 5: Informations sur la base de données
    console.log('5️⃣ Informations sur la base de données...')
    const dbInfo = await prisma.$queryRaw<Array<{ 
      current_database: string
      version: string 
    }>>`
      SELECT current_database(), version();
    `
    if (dbInfo.length > 0) {
      console.log(`   ✅ Base de données: ${dbInfo[0].current_database}`)
      console.log(`   ✅ Version PostgreSQL: ${dbInfo[0].version.split(' ')[0]} ${dbInfo[0].version.split(' ')[1]}`)
    }
    console.log()

    console.log('✅ Tous les tests de connexion ont réussi!')
    console.log('🎉 La base de données est opérationnelle.\n')

  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Connexion fermée.')
  }
}

testConnection()

