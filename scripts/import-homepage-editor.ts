import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importHomepageEditor() {
  console.log('🚀 Début de l\'import des données HomepageEditor...\n')

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
    // Vérifier si un enregistrement existe déjà
    const existingRecord = await prisma.homepageEditor.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (existingRecord) {
      console.log('\n⚠️  Un enregistrement actif existe déjà dans la base de données')
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
          updatedBy: 'system-import',
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
          createdBy: 'system-import',
          updatedBy: 'system-import'
        }
      })

      console.log(`\n✅ Enregistrement créé avec succès!`)
      console.log(`   ID: ${created.id}`)
      console.log(`   Version: ${created.version}`)
    }

    console.log('\n✨ Import terminé avec succès!')
  } catch (error) {
    logger.error('Erreur lors de l\'import des données HomepageEditor', error as Error)
    console.log(`\n❌ Erreur lors de l'import: ${error}`)
    process.exit(1)
  }
}

// Exécuter l'import
importHomepageEditor()
  .catch((e) => {
    logger.error('Erreur non gérée lors de l\'import HomepageEditor', e as Error)
    console.error('Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default importHomepageEditor

