/**
 * Script pour créer un utilisateur de test dans la base de données de production
 * Usage: npm run create:test-user:production
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('🔐 Création d\'un utilisateur de test en production...\n')

  // Vérifier les variables d'environnement
  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL
  if (!dbUrl) {
    console.error('❌ Aucune variable d\'environnement de base de données trouvée!')
    console.error('   Veuillez configurer DATABASE_URL, PRISMA_DATABASE_URL ou POSTGRES_URL dans .env.local')
    process.exit(1)
  }
  console.log('✅ Variable d\'environnement DATABASE_URL trouvée\n')

  // Vérifier la connexion à la base de données
  try {
    await prisma.$connect()
    console.log('✅ Connexion à la base de données réussie\n')
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:')
    console.error('   Vérifiez que DATABASE_URL, PRISMA_DATABASE_URL ou POSTGRES_URL est configuré dans .env.local')
    console.error(error)
    process.exit(1)
  }

  // Informations de l'utilisateur de test
  const testUser = {
    email: 'atiha@atiha.com',
    name: 'atiha',
    password: 'atiha@101089', // Mot de passe en clair
    phone: '+221771234567',
    country: 'SN'
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    })

    if (existingUser) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà.')
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Créé le: ${existingUser.createdAt}`)
      console.log('\n💡 Pour réinitialiser le mot de passe, supprimez d\'abord l\'utilisateur.')
      return
    }

    // Hasher le mot de passe
    console.log('🔒 Hachage du mot de passe...')
    const passwordHash = await bcrypt.hash(testUser.password, 10)

    // Créer l'utilisateur
    console.log('👤 Création de l\'utilisateur...')
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        passwordHash,
        phone: testUser.phone,
        country: testUser.country,
        isActive: true,
        isBanned: false
      }
    })

    console.log('\n✅ Utilisateur créé avec succès!')
    console.log('=====================================')
    console.log('📧 Email:', testUser.email)
    console.log('🔑 Mot de passe:', testUser.password)
    console.log('👤 Nom:', testUser.name)
    console.log('🆔 ID:', user.id)
    console.log('📱 Téléphone:', testUser.phone)
    console.log('🌍 Pays:', testUser.country)
    console.log('=====================================')
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants.')
    console.log('⚠️  Important: Changez le mot de passe après la première connexion!')

  } catch (error) {
    logger.error('Erreur lors de la création de l\'utilisateur de test', error as Error)
    console.error('\n❌ Erreur lors de la création de l\'utilisateur:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createTestUser()
  .catch((e) => {
    logger.error('Erreur non gérée lors de la création de l\'utilisateur de test', e as Error)
    console.error('❌ Erreur:', e)
    process.exit(1)
  })

export default createTestUser

