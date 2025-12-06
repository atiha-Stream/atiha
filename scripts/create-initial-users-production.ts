/**
 * Script pour créer un utilisateur et un admin initial dans la base de données de production
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Configuration de DATABASE_URL pour la production
process.env.DATABASE_URL = process.env.DATABASE_URL || 
  'postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require'

// Importer db-config pour s'assurer que la configuration est correcte
import '../src/lib/db-config'

const prisma = new PrismaClient()

async function createInitialUsers() {
  console.log('🚀 Création des utilisateurs initiaux...\n')

  // Informations de l'utilisateur
  const userEmail = 'leGenny@atiha.com'
  const userName = 'leGenny'
  const userPassword = 'Atiasekbaby@89#2025!'

  // Informations de l'admin
  const adminUsername = 'leGenny'
  const adminPassword = 'Atiasekbaby@89#2025!'
  const adminEmail = 'leGenny@atiha.com'

  try {
    // 1. Créer l'utilisateur
    console.log('👤 Création de l\'utilisateur...')
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (existingUser) {
      console.log(`⚠️  L'utilisateur avec l'email ${userEmail} existe déjà`)
      console.log('   Mise à jour du mot de passe...')
      
      const passwordHash = await bcrypt.hash(userPassword, 10)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: userName,
          passwordHash: passwordHash,
          isActive: true,
          isBanned: false
        }
      })
      console.log('✅ Utilisateur mis à jour avec succès')
    } else {
      const passwordHash = await bcrypt.hash(userPassword, 10)
      const user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          passwordHash: passwordHash,
          isActive: true,
          isBanned: false
        }
      })
      console.log(`✅ Utilisateur créé avec succès`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Nom: ${user.name}`)
    }

    console.log('')

    // 2. Créer l'admin
    console.log('🔐 Création de l\'admin...')
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: adminUsername }
    })

    if (existingAdmin) {
      console.log(`⚠️  L'admin avec le username ${adminUsername} existe déjà`)
      console.log('   Mise à jour du mot de passe...')
      
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: passwordHash,
          email: adminEmail,
          isActive: true,
          role: 'super_admin',
          permissions: ['*'] // Toutes les permissions
        }
      })
      console.log('✅ Admin mis à jour avec succès')
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      const admin = await prisma.admin.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          passwordHash: passwordHash,
          role: 'super_admin',
          permissions: ['*'], // Toutes les permissions
          isActive: true
        }
      })
      console.log(`✅ Admin créé avec succès`)
      console.log(`   - ID: ${admin.id}`)
      console.log(`   - Username: ${admin.username}`)
      console.log(`   - Email: ${admin.email}`)
      console.log(`   - Role: ${admin.role}`)
    }

    console.log('\n✨ Création terminée avec succès!')
    console.log('\n📋 Résumé:')
    console.log(`   Utilisateur: ${userEmail} / ${userPassword}`)
    console.log(`   Admin: ${adminUsername} / ${adminPassword}`)
    console.log('\n⚠️  Note: Ces identifiants sont pour la base de données de PRODUCTION')

  } catch (error) {
    console.error('\n❌ Erreur lors de la création:', error)
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createInitialUsers()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })

