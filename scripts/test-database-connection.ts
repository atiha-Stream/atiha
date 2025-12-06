/**
 * Script de test de connexion à la base de données
 * Vérifie que Prisma peut se connecter avec les variables d'environnement configurées
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...\n')

  // Afficher les variables d'environnement (masquer les mots de passe)
  console.log('📋 Variables d\'environnement détectées:')
  if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')
    console.log(`  ✅ DATABASE_URL: ${maskedUrl}`)
  } else {
    console.log('  ❌ DATABASE_URL: Non définie')
  }

  if (process.env.POSTGRES_URL) {
    const maskedUrl = process.env.POSTGRES_URL.replace(/:([^:@]+)@/, ':****@')
    console.log(`  ✅ POSTGRES_URL: ${maskedUrl}`)
  } else {
    console.log('  ⚠️  POSTGRES_URL: Non définie')
  }

  if (process.env.PRISMA_DATABASE_URL) {
    const maskedUrl = process.env.PRISMA_DATABASE_URL.replace(/api_key=([^&]+)/, 'api_key=****')
    console.log(`  ✅ PRISMA_DATABASE_URL: ${maskedUrl}`)
  } else {
    console.log('  ⚠️  PRISMA_DATABASE_URL: Non définie')
  }

  // Vérifier les variables préfixées
  if (process.env['atiha_DATABASE_URL']) {
    const maskedUrl = process.env['atiha_DATABASE_URL'].replace(/:([^:@]+)@/, ':****@')
    console.log(`  ✅ atiha_DATABASE_URL: ${maskedUrl}`)
  }

  if (process.env['atiha_POSTGRES_URL']) {
    const maskedUrl = process.env['atiha_POSTGRES_URL'].replace(/:([^:@]+)@/, ':****@')
    console.log(`  ✅ atiha_POSTGRES_URL: ${maskedUrl}`)
  }

  console.log('\n')

  // Importer db-config pour s'assurer que DATABASE_URL est configurée
  await import('../src/lib/db-config')

  // Vérifier que DATABASE_URL est définie après la configuration
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erreur: DATABASE_URL n\'est pas définie après la configuration')
    console.error('   Veuillez définir DATABASE_URL, POSTGRES_URL, ou les variables préfixées')
    process.exit(1)
  }

  console.log('🔌 Tentative de connexion à la base de données...\n')

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  try {
    // Test de connexion simple
    await prisma.$connect()
    console.log('✅ Connexion réussie à la base de données!\n')

    // Test de requête simple
    console.log('🔍 Test de requête simple...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Requête SQL réussie:', result)
    console.log('')

    // Vérifier les tables existantes
    console.log('📊 Vérification des tables...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    if (tables.length > 0) {
      console.log(`✅ ${tables.length} table(s) trouvée(s):`)
      tables.forEach((table) => {
        console.log(`   - ${table.tablename}`)
      })
    } else {
      console.log('⚠️  Aucune table trouvée dans le schéma public')
      console.log('   Les migrations Prisma doivent être appliquées')
    }

    console.log('\n✅ Tous les tests sont passés avec succès!')
  } catch (error) {
    console.error('\n❌ Erreur lors de la connexion à la base de données:')
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`)
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`)
      }
    } else {
      console.error('   Erreur inconnue:', error)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Connexion fermée')
  }
}

// Exécuter le test
testDatabaseConnection()
  .then(() => {
    console.log('\n✨ Test terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })

