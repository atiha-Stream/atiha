/**
 * Script pour résoudre une migration Prisma échouée
 * Usage: tsx scripts/resolve-failed-migration.ts
 */

import { execSync } from 'child_process'
import { logger } from '../src/lib/logger'

const MIGRATION_NAME = '20251206013111_baseline'

async function main() {
  try {
    logger.info('🔧 Résolution de la migration échouée...')
    
    // Option 1: Marquer la migration comme appliquée (si les tables existent déjà)
    logger.info('Option 1: Marquer la migration comme appliquée...')
    try {
      execSync(`npx prisma migrate resolve --applied ${MIGRATION_NAME}`, {
        stdio: 'inherit',
        env: process.env
      })
      logger.info('✅ Migration marquée comme appliquée')
      return
    } catch (error) {
      logger.warn('⚠️ Impossible de marquer comme appliquée, essayons de la marquer comme annulée...')
    }

    // Option 2: Marquer la migration comme annulée (si elle n'a pas été appliquée)
    logger.info('Option 2: Marquer la migration comme annulée...')
    try {
      execSync(`npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}`, {
        stdio: 'inherit',
        env: process.env
      })
      logger.info('✅ Migration marquée comme annulée')
      logger.info('💡 Vous pouvez maintenant réappliquer les migrations avec: npx prisma migrate deploy')
      return
    } catch (error) {
      logger.error('❌ Impossible de résoudre la migration automatiquement')
      logger.error('💡 Essayez manuellement:')
      logger.error(`   npx prisma migrate resolve --applied ${MIGRATION_NAME}`)
      logger.error(`   ou`)
      logger.error(`   npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}`)
      process.exit(1)
    }
  } catch (error) {
    logger.error('Erreur lors de la résolution de la migration', error as Error)
    process.exit(1)
  }
}

main()

