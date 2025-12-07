/**
 * Script de diagnostic et correction complète pour Prisma en production
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// URL de production
const PRODUCTION_DATABASE_URL = 'postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require'

console.log('🔍 DIAGNOSTIC ET CORRECTION COMPLÈTE PRISMA\n')
console.log('=' .repeat(70))

async function diagnosticEtFix() {
  try {
    // 1. Configuration
    console.log('1️⃣ Configuration des variables d\'environnement...')
    process.env.DATABASE_URL = PRODUCTION_DATABASE_URL
    process.env.POSTGRES_URL = PRODUCTION_DATABASE_URL
    delete process.env.PRISMA_DATABASE_URL
    console.log('   ✅ Variables configurées\n')

    // 2. Test de connexion
    console.log('2️⃣ Test de connexion à la base de données...')
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DATABASE_URL
        }
      },
      log: ['error', 'warn']
    })

    try {
      await prisma.$connect()
      console.log('   ✅ Connexion réussie!\n')
    } catch (error) {
      console.error('   ❌ ERREUR DE CONNEXION:', error)
      console.error('\n   🔧 Solutions possibles:')
      console.error('      - Vérifier que la base de données Prisma est active')
      console.error('      - Vérifier que l\'URL est correcte')
      console.error('      - Vérifier les credentials')
      process.exit(1)
    }

    // 3. Vérifier les tables
    console.log('3️⃣ Vérification des tables...')
    let tables: Array<{ tablename: string }> = []
    try {
      tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `
      console.log(`   ✅ ${tables.length} table(s) trouvée(s)`)
      tables.forEach(table => {
        console.log(`      - ${table.tablename}`)
      })
      console.log()
    } catch (error) {
      console.error('   ❌ Erreur lors de la vérification des tables:', error)
    }

    // 4. Vérifier les tables Prisma requises
    console.log('4️⃣ Vérification des tables Prisma requises...')
    const requiredTables = ['users', 'admins', 'homepage_editor']
    const existingTables = tables.map(t => t.tablename)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))
    
    if (missingTables.length > 0) {
      console.log(`   ⚠️  ${missingTables.length} table(s) manquante(s):`)
      missingTables.forEach(table => {
        console.log(`      - ${table}`)
      })
      console.log('\n   🔄 Application du schéma Prisma...')
      
      // Utiliser db push pour appliquer le schéma
      const { execSync } = require('child_process')
      try {
        execSync('npx prisma db push --accept-data-loss --skip-generate', {
          env: {
            ...process.env,
            DATABASE_URL: PRODUCTION_DATABASE_URL
          },
          stdio: 'inherit'
        })
        console.log('   ✅ Schéma appliqué avec succès!\n')
        
        // Re-vérifier les tables
        tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `
        console.log(`   ✅ ${tables.length} table(s) après application du schéma\n`)
      } catch (error) {
        console.error('   ❌ Erreur lors de l\'application du schéma:', error)
        throw error
      }
    } else {
      console.log('   ✅ Toutes les tables requises existent\n')
    }

    // 5. Générer le client Prisma
    console.log('5️⃣ Génération du client Prisma...')
    const { execSync } = require('child_process')
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
      console.error('   ⚠️  Erreur lors de la génération (peut être ignorée):', error)
    }

    // 6. Vérifier/Créer les utilisateurs et admins
    console.log('6️⃣ Vérification et création des utilisateurs/admins...')
    
    // Utilisateur
    const userEmail = 'leGenny@atiha.com'
    const userName = 'leGenny'
    const userPassword = 'Atiasekbaby@89#2025!'
    
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    })
    
    if (!user) {
      console.log(`   👤 Création de l'utilisateur ${userEmail}...`)
      const passwordHash = await bcrypt.hash(userPassword, 10)
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          passwordHash: passwordHash,
          isActive: true,
          isBanned: false
        }
      })
      console.log(`   ✅ Utilisateur créé (ID: ${user.id})\n`)
    } else {
      console.log(`   ✅ Utilisateur ${userEmail} existe déjà`)
      // Mettre à jour le mot de passe au cas où
      const passwordHash = await bcrypt.hash(userPassword, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: passwordHash,
          isActive: true,
          isBanned: false
        }
      })
      console.log(`   ✅ Mot de passe mis à jour\n`)
    }

    // Admin
    const adminUsername = 'leGenny'
    const adminPassword = 'Atiasekbaby@89#2025!'
    const adminEmail = 'leGenny@atiha.com'
    
    let admin = await prisma.admin.findUnique({
      where: { username: adminUsername }
    })
    
    if (!admin) {
      console.log(`   👨‍💼 Création de l'admin ${adminUsername}...`)
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      admin = await prisma.admin.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          passwordHash: passwordHash,
          role: 'super_admin',
          permissions: ['*'],
          isActive: true
        }
      })
      console.log(`   ✅ Admin créé (ID: ${admin.id})\n`)
    } else {
      console.log(`   ✅ Admin ${adminUsername} existe déjà`)
      // Mettre à jour le mot de passe au cas où
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          passwordHash: passwordHash,
          isActive: true,
          role: 'super_admin',
          permissions: ['*']
        }
      })
      console.log(`   ✅ Mot de passe mis à jour\n`)
    }

    // 7. Test de connexion
    console.log('7️⃣ Test de connexion avec les identifiants...')
    
    // Test utilisateur
    const testUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })
    if (testUser) {
      const userPasswordValid = await bcrypt.compare(userPassword, testUser.passwordHash)
      console.log(`   ${userPasswordValid ? '✅' : '❌'} Test utilisateur: ${userPasswordValid ? 'OK' : 'ÉCHEC'}`)
    }
    
    // Test admin
    const testAdmin = await prisma.admin.findUnique({
      where: { username: adminUsername }
    })
    if (testAdmin) {
      const adminPasswordValid = await bcrypt.compare(adminPassword, testAdmin.passwordHash)
      console.log(`   ${adminPasswordValid ? '✅' : '❌'} Test admin: ${adminPasswordValid ? 'OK' : 'ÉCHEC'}\n`)
    }

    await prisma.$disconnect()
    
    console.log('=' .repeat(70))
    console.log('✅ DIAGNOSTIC ET CORRECTION TERMINÉS AVEC SUCCÈS!\n')
    console.log('📋 RÉSUMÉ:')
    console.log(`   - Tables: ${tables.length}`)
    console.log(`   - Utilisateur: ${userEmail} (${user ? '✅' : '❌'})`)
    console.log(`   - Admin: ${adminUsername} (${admin ? '✅' : '❌'})\n`)
    console.log('📝 PROCHAINES ÉTAPES:')
    console.log('   1. Vérifier que DATABASE_URL est définie sur Vercel')
    console.log('   2. Vérifier que POSTGRES_URL est définie sur Vercel')
    console.log('   3. Supprimer PRISMA_DATABASE_URL de Vercel si elle existe')
    console.log('   4. Redéployer le projet sur Vercel')
    console.log('   5. Tester la connexion sur https://attiha.vercel.app/admin/login')
    console.log('      Username: leGenny')
    console.log('      Password: Atiasekbaby@89#2025!')

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU DIAGNOSTIC:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      if (error.stack) {
        console.error('   Stack:', error.stack)
      }
    }
    process.exit(1)
  }
}

diagnosticEtFix()

