/**
 * Script pour lister toutes les tables de la base de données
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listTables() {
  try {
    console.log('📋 Liste des tables dans la base de données:\n')

    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

    console.log(`Total: ${tables.length} tables\n`)
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`)
    })

    // Tables dans le schéma Prisma
    const prismaModels = [
      'users',
      'user_profiles',
      'watch_history',
      'watchlist',
      'ratings',
      'favorites',
      'user_sessions',
      'two_factor_auth',
      'admins',
      'admin_sessions',
      'admin_two_factor_auth',
      'security_logs',
      'homepage_editor',
      'premium_codes',
      'premium_code_usages',
      'subscription_prices',
      'subscription_plans',
      'payment_links',
      'post_payment_links',
      'payments'
    ]

    console.log('\n\n📊 Analyse:\n')
    console.log('Tables dans Prisma schema:')
    prismaModels.forEach(model => {
      const exists = tables.some(t => t.tablename === model)
      console.log(`  ${exists ? '✅' : '❌'} ${model}`)
    })

    console.log('\nTables dans la DB mais PAS dans Prisma:')
    const missingInPrisma = tables
      .filter(t => !prismaModels.includes(t.tablename) && t.tablename !== '_prisma_migrations')
      .map(t => t.tablename)
    
    if (missingInPrisma.length > 0) {
      missingInPrisma.forEach(table => {
        console.log(`  ⚠️  ${table}`)
      })
    } else {
      console.log('  ✅ Aucune table manquante')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

listTables()

