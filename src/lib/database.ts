/**
 * Client Prisma pour la base de données
 * Singleton pour réutiliser la connexion
 */

// Configurer DATABASE_URL avant d'importer Prisma
import './db-config'

import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// Extension du PrismaClient pour le logging
const prismaClientSingleton = () => {
  return new PrismaClient({
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

