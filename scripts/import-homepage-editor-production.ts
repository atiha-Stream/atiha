/**
 * Script pour importer les données HomepageEditor dans la base de données de production
 * Utilise les variables d'environnement pour se connecter à la base de production
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'
import fs from 'fs'
import path from 'path'

// Utiliser les variables d'environnement de production
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL
    }
  }
})

async function importHomepageEditorProduction() {
  console.log('🚀 Début de l\'import des données HomepageEditor en PRODUCTION...\n')
  console.log('⚠️  ATTENTION: Ce script va modifier la base de données de PRODUCTION\n')

  // Vérifier que nous sommes bien en production
  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL
  if (!dbUrl) {
    console.log('❌ Variables d\'environnement DATABASE_URL ou PRISMA_DATABASE_URL non trouvées')
    process.exit(1)
  }

  console.log(`📍 Connexion à la base de données: ${dbUrl.includes('@') ? dbUrl.split('@')[1] : 'Masqué'}\n`)

  const backupFilePath = path.join(
    process.cwd(),
    '..',
    'Documentation',
    'design',
    'le Génie-backup-2025-12-03.json'
  )

  let backupData: any = null

  try {
    if (fs.existsSync(backupFilePath)) {
      const fileContent = fs.readFileSync(backupFilePath, 'utf-8')
      backupData = JSON.parse(fileContent)
      console.log(`✅ Fichier de backup trouvé et chargé: ${backupFilePath}`)
    } else {
      console.log(`❌ Fichier de backup non trouvé: ${backupFilePath}`)
      process.exit(1)
    }
  } catch (error) {
    logger.error('Erreur lors de la lecture ou du parsing du fichier de backup', error as Error)
    console.log(`❌ Erreur lors de la lecture du fichier: ${error}`)
    process.exit(1)
  }

  // Extraire les données homepageContent
  const homepageContent = backupData?.data?.homepageContent

  if (!homepageContent) {
    console.log('❌ Aucune donnée homepageContent trouvée dans le backup')
    process.exit(1)
  }

  console.log('📋 Données homepageContent trouvées dans le backup')
  console.log(`   - Nom de l'application: ${homepageContent.appIdentity?.name || 'N/A'}`)
  console.log(`   - Dernière mise à jour: ${backupData.data.homepageContent.lastUpdated || 'N/A'}`)

  try {
    // Test de connexion
    console.log('\n🔌 Test de connexion à la base de données...')
    await prisma.$connect()
    console.log('✅ Connexion réussie\n')

    // Vérifier si un enregistrement existe déjà
    const existingRecord = await prisma.homepageEditor.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (existingRecord) {
      console.log('⚠️  Un enregistrement actif existe déjà dans la base de données')
      console.log(`   ID: ${existingRecord.id}`)
      console.log(`   Version: ${existingRecord.version}`)
      console.log(`   Créé le: ${existingRecord.createdAt}`)
      console.log('\n   Mise à jour de l\'enregistrement existant...')

      // Mettre à jour l'enregistrement existant
      const updated = await prisma.homepageEditor.update({
        where: { id: existingRecord.id },
        data: {
          content: homepageContent as any,
          version: existingRecord.version + 1,
          updatedBy: 'system-import-production',
          updatedAt: new Date()
        }
      })

      console.log(`\n✅ Enregistrement mis à jour avec succès!`)
      console.log(`   ID: ${updated.id}`)
      console.log(`   Nouvelle version: ${updated.version}`)
    } else {
      console.log('\n   Création d\'un nouvel enregistrement...')

      // Créer un nouvel enregistrement
      const created = await prisma.homepageEditor.create({
        data: {
          id: `homepage_${Date.now()}`,
          content: homepageContent as any,
          version: 1,
          isActive: true,
          createdBy: 'system-import-production',
          updatedBy: 'system-import-production'
        }
      })

      console.log(`\n✅ Enregistrement créé avec succès!`)
      console.log(`   ID: ${created.id}`)
      console.log(`   Version: ${created.version}`)
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...')
    const verify = await prisma.homepageEditor.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (verify) {
      const content = verify.content as any
      console.log('✅ Données vérifiées dans la base de production')
      console.log(`   Nom de l'app: ${content.appIdentity?.name || 'N/A'}`)
      console.log(`   Sections visibles: ${Object.keys(content.sectionsVisibility || {}).length}`)
    }

    console.log('\n✨ Import terminé avec succès en PRODUCTION!')
  } catch (error) {
    logger.error('Erreur lors de l\'import des données HomepageEditor en production', error as Error)
    console.log(`\n❌ Erreur lors de l'import: ${error}`)
    if (error instanceof Error) {
      console.log(`   Message: ${error.message}`)
      if (error.message.includes('Can\'t reach database')) {
        console.log('\n💡 Vérifiez que:')
        console.log('   1. Les variables d\'environnement DATABASE_URL sont correctement configurées')
        console.log('   2. La base de données est accessible depuis votre machine')
        console.log('   3. Les credentials sont corrects')
      }
    }
    process.exit(1)
  }
}

// Exécuter l'import si le script est appelé directement
importHomepageEditorProduction()
  .catch((e) => {
    logger.error('Erreur non gérée lors de l\'import HomepageEditor en production', e as Error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default importHomepageEditorProduction

