/**
 * Script pour tester la connexion et vérifier les utilisateurs/admins dans Prisma
 */

// Utiliser la DATABASE_URL de production si elle n'est pas définie
if (!process.env.DATABASE_URL) {
  // URL de production fournie par l'utilisateur
  process.env.DATABASE_URL = 'postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require'
  console.log('⚠️  Utilisation de la DATABASE_URL de production pour les tests\n')
}

import { prisma } from '../src/lib/database'
import bcrypt from 'bcryptjs'
import { logger } from '../src/lib/logger'

async function testLogin() {
  try {
    console.log('🔍 Test de connexion à la base de données...\n')

    // Test 1: Vérifier la connexion
    await prisma.$connect()
    console.log('✅ Connexion à la base de données réussie\n')

    // Test 2: Lister tous les utilisateurs
    console.log('👥 Utilisateurs dans la base de données:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isBanned: true,
        passwordHash: true
      }
    })
    
    if (users.length === 0) {
      console.log('  ⚠️  Aucun utilisateur trouvé dans la base de données')
    } else {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name || 'Sans nom'})`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Actif: ${user.isActive ? '✅' : '❌'}`)
        console.log(`     Banni: ${user.isBanned ? '❌' : '✅'}`)
        console.log(`     Hash: ${user.passwordHash.substring(0, 20)}...`)
      })
    }

    console.log('\n👨‍💼 Admins dans la base de données:')
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true
      }
    })
    
    if (admins.length === 0) {
      console.log('  ⚠️  Aucun admin trouvé dans la base de données')
    } else {
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.username} (${admin.email || 'Sans email'})`)
        console.log(`     ID: ${admin.id}`)
        console.log(`     Rôle: ${admin.role}`)
        console.log(`     Actif: ${admin.isActive ? '✅' : '❌'}`)
        console.log(`     Hash: ${admin.passwordHash.substring(0, 20)}...`)
      })
    }

    // Test 3: Tester la connexion avec un utilisateur spécifique
    console.log('\n🔐 Test de connexion utilisateur:')
    const testUserEmail = 'leGenny@atiha.com'
    const testUserPassword = 'Atiasekbaby@89#2025!'
    
    const testUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    })
    
    if (!testUser) {
      console.log(`  ❌ Utilisateur ${testUserEmail} non trouvé`)
    } else {
      console.log(`  ✅ Utilisateur ${testUserEmail} trouvé`)
      const passwordValid = await bcrypt.compare(testUserPassword, testUser.passwordHash)
      console.log(`  ${passwordValid ? '✅' : '❌'} Mot de passe: ${passwordValid ? 'Valide' : 'Invalide'}`)
    }

    // Test 4: Tester la connexion avec un admin spécifique
    console.log('\n🔐 Test de connexion admin:')
    const testAdminUsername = 'leGenny'
    const testAdminPassword = 'Atiasekbaby@89#2025!'
    
    const testAdmin = await prisma.admin.findUnique({
      where: { username: testAdminUsername }
    })
    
    if (!testAdmin) {
      console.log(`  ❌ Admin ${testAdminUsername} non trouvé`)
    } else {
      console.log(`  ✅ Admin ${testAdminUsername} trouvé`)
      const passwordValid = await bcrypt.compare(testAdminPassword, testAdmin.passwordHash)
      console.log(`  ${passwordValid ? '✅' : '❌'} Mot de passe: ${passwordValid ? 'Valide' : 'Invalide'}`)
    }

    await prisma.$disconnect()
    console.log('\n✅ Tests terminés')
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testLogin()

