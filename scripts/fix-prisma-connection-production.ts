/**
 * Script pour corriger la connexion Prisma à la base de données de production
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

// URL de production
const PRODUCTION_DATABASE_URL = 'postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require'

console.log('🔧 Correction de la connexion Prisma à la base de données de production\n')
console.log('=' .repeat(70))

async function fixPrismaConnection() {
  try {
    // 1. Configurer DATABASE_URL
    console.log('1️⃣ Configuration de DATABASE_URL...')
    process.env.DATABASE_URL = PRODUCTION_DATABASE_URL
    process.env.POSTGRES_URL = PRODUCTION_DATABASE_URL
    // Supprimer PRISMA_DATABASE_URL si elle existe
    delete process.env.PRISMA_DATABASE_URL
    console.log('   ✅ DATABASE_URL configurée\n')

    // 2. Tester la connexion
    console.log('2️⃣ Test de connexion à la base de données...')
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DATABASE_URL
        }
      },
      log: ['error', 'warn', 'info']
    })

    try {
      await prisma.$connect()
      console.log('   ✅ Connexion réussie!\n')
    } catch (error) {
      console.error('   ❌ Erreur de connexion:', error)
      throw error
    }

    // 3. Vérifier les tables
    console.log('3️⃣ Vérification des tables...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
    
    console.log(`   ✅ ${tables.length} table(s) trouvée(s):`)
    tables.forEach(table => {
      console.log(`      - ${table.tablename}`)
    })
    console.log()

    // 4. Vérifier si les tables Prisma existent
    const requiredTables = ['users', 'admins', 'homepage_editor']
    const existingTables = tables.map(t => t.tablename)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))
    
    if (missingTables.length > 0) {
      console.log('4️⃣ Tables manquantes détectées:')
      missingTables.forEach(table => {
        console.log(`   ⚠️  ${table}`)
      })
      console.log('\n   🔄 Application du schéma Prisma...')
      
      // Appliquer le schéma avec db push
      try {
        execSync('npx prisma db push --accept-data-loss --skip-generate', {
          env: {
            ...process.env,
            DATABASE_URL: PRODUCTION_DATABASE_URL
          },
          stdio: 'inherit'
        })
        console.log('   ✅ Schéma appliqué avec succès!\n')
      } catch (error) {
        console.error('   ❌ Erreur lors de l\'application du schéma:', error)
        throw error
      }
    } else {
      console.log('4️⃣ ✅ Toutes les tables requises existent\n')
    }

    // 5. Vérifier les utilisateurs et admins
    console.log('5️⃣ Vérification des utilisateurs et admins...')
    const userCount = await prisma.user.count()
    const adminCount = await prisma.admin.count()
    
    console.log(`   👥 Utilisateurs: ${userCount}`)
    console.log(`   👨‍💼 Admins: ${adminCount}\n`)

    // 6. Générer le client Prisma
    console.log('6️⃣ Génération du client Prisma...')
    try {
      execSync('npx prisma generate', {
        env: {
          ...process.env,
          DATABASE_URL: PRODUCTION_DATABASE_URL
        },
        stdio: 'inherit'
      })
      console.log('   ✅ Client Prisma généré!\n')
    } catch (error) {
      console.error('   ❌ Erreur lors de la génération:', error)
    }

    await prisma.$disconnect()
    console.log('✅ Correction terminée avec succès!')
    console.log('\n📋 Prochaines étapes:')
    console.log('   1. Vérifier que DATABASE_URL est bien définie sur Vercel')
    console.log('   2. Vérifier que POSTGRES_URL est bien définie sur Vercel')
    console.log('   3. Vérifier que PRISMA_DATABASE_URL n\'est PAS définie (ou supprimée)')
    console.log('   4. Redéployer le projet sur Vercel')
    console.log('   5. Créer les utilisateurs/admins si nécessaire')

  } catch (error) {
    console.error('\n❌ Erreur lors de la correction:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      if (error.stack) {
        console.error('   Stack:', error.stack)
      }
    }
    process.exit(1)
  }
}

fixPrismaConnection()

