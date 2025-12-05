/**
 * Script de migration des données localStorage vers PostgreSQL
 * À exécuter une seule fois lors de la migration
 */

import { PrismaClient } from '@prisma/client'
import { EncryptionService } from '../src/lib/encryption-service'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()

/**
 * Migre les utilisateurs depuis localStorage vers PostgreSQL
 */
async function migrateUsers() {
  if (typeof window === 'undefined') {
    logger.warn('Ce script doit être exécuté côté serveur')
    return
  }

  try {
    // Récupérer les utilisateurs depuis localStorage
    const usersData = localStorage.getItem('atiha_users_database')
    if (!usersData) {
      logger.info('Aucun utilisateur à migrer')
      return
    }

    const users = JSON.parse(usersData)
    logger.info(`Migration de ${users.length} utilisateurs`)

    for (const user of users) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (existing) {
          logger.debug(`Utilisateur ${user.email} existe déjà, ignoré`)
          continue
        }

        // Créer l'utilisateur
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            phone: user.phone,
            country: user.country,
            passwordHash: user.password, // Déjà haché avec bcrypt
            isActive: user.isActive ?? true,
            isBanned: user.isBanned ?? false,
            loginCount: user.loginCount ?? 0,
            registrationDate: user.registrationDate 
              ? new Date(user.registrationDate) 
              : new Date(),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          },
        })

        logger.info(`Utilisateur ${user.email} migré avec succès`)
      } catch (error) {
        logger.error(`Erreur lors de la migration de l'utilisateur ${user.email}`, error as Error)
      }
    }

    logger.info('Migration des utilisateurs terminée')
  } catch (error) {
    logger.error('Erreur lors de la migration des utilisateurs', error as Error)
    throw error
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  logger.info('Démarrage de la migration localStorage → PostgreSQL')

  try {
    await migrateUsers()
    logger.info('Migration terminée avec succès')
  } catch (error) {
    logger.error('Erreur lors de la migration', error as Error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
if (require.main === module) {
  main()
}

export { migrateUsers }

