/**
 * Client Prisma pour la base de données
 * Singleton pour réutiliser la connexion
 */

// Configurer DATABASE_URL avant d'importer Prisma
import './db-config'

// FORCER la suppression de PRISMA_DATABASE_URL AVANT l'import de PrismaClient
// Prisma Client peut lire cette variable directement depuis process.env
if (process.env.PRISMA_DATABASE_URL) {
  const originalPrismaUrl = process.env.PRISMA_DATABASE_URL
  delete process.env.PRISMA_DATABASE_URL
  console.log('[database] ⚠️ PRISMA_DATABASE_URL supprimée pour forcer l\'utilisation de DATABASE_URL')
  console.log('[database] PRISMA_DATABASE_URL était:', originalPrismaUrl.substring(0, 50) + '...')
}

import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// Log des variables d'environnement pour debug
console.log('[database] Variables d\'environnement:', {
  hasDATABASE_URL: !!process.env.DATABASE_URL,
  hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
  hasPRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
  DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 50) + '...',
})

// Vérifier que DATABASE_URL est bien définie avant d'initialiser Prisma
if (!process.env.DATABASE_URL) {
  const error = new Error('DATABASE_URL n\'est pas définie. Vérifiez les variables d\'environnement.')
  logger.error('Erreur de configuration Prisma', error)
  console.error('[database] ❌ DATABASE_URL n\'est pas définie')
  throw error
}

// Vérifier que DATABASE_URL est une URL PostgreSQL valide (pas prisma+postgres://)
if (process.env.DATABASE_URL.startsWith('prisma+postgres://') || process.env.DATABASE_URL.startsWith('prisma://')) {
  const error = new Error('DATABASE_URL ne doit pas commencer par prisma:// ou prisma+postgres://. Utilisez POSTGRES_URL ou une URL postgres:// standard.')
  logger.error('Erreur de configuration Prisma', error)
  console.error('[database] ❌ DATABASE_URL commence par prisma:// ou prisma+postgres://')
  console.error('[database] DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...')
  throw error
}

console.log('[database] ✅ DATABASE_URL est valide:', process.env.DATABASE_URL.substring(0, 30) + '...')

// Extension du PrismaClient pour le logging
const prismaClientSingleton = () => {
  // Log de l'URL utilisée (sans les credentials)
  const dbUrlPreview = process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'non définie'
  logger.info(`Initialisation Prisma Client avec DATABASE_URL: ${dbUrlPreview.substring(0, 50)}...`)
  
  // FORCER l'utilisation de DATABASE_URL en la spécifiant explicitement
  // Cela empêche Prisma Client d'utiliser automatiquement PRISMA_DATABASE_URL
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

// Gestion de la déconnexion propre
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
    logger.info('Prisma client disconnected')
  })
}

export { prisma }

// Export des types Prisma
export type {
  User,
  Admin,
  UserProfile,
  WatchHistory,
  Watchlist,
  Rating,
  Favorite,
  UserSession,
  AdminSession,
  TwoFactorAuth,
  AdminTwoFactorAuth,
  SecurityLog,
} from '@prisma/client'

