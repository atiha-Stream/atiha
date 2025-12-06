import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyHomepageEditor() {
  console.log('🔍 Vérification des données HomepageEditor...\n')

  try {
    const records = await prisma.homepageEditor.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (records.length === 0) {
      console.log('❌ Aucun enregistrement trouvé dans la table HomepageEditor')
      return
    }

    console.log(`✅ ${records.length} enregistrement(s) trouvé(s)\n`)

    records.forEach((record, index) => {
      console.log(`📋 Enregistrement ${index + 1}:`)
      console.log(`   ID: ${record.id}`)
      console.log(`   Version: ${record.version}`)
      console.log(`   Actif: ${record.isActive ? 'Oui' : 'Non'}`)
      console.log(`   Créé par: ${record.createdBy || 'N/A'}`)
      console.log(`   Mis à jour par: ${record.updatedBy || 'N/A'}`)
      console.log(`   Créé le: ${record.createdAt}`)
      console.log(`   Mis à jour le: ${record.updatedAt}`)

      // Afficher quelques informations du contenu
      const content = record.content as any
      if (content) {
        console.log(`   Contenu:`)
        console.log(`      - Nom de l'app: ${content.appIdentity?.name || 'N/A'}`)
        console.log(`      - Dernière mise à jour: ${content.lastUpdated || 'N/A'}`)
        console.log(`      - Sections visibles: ${Object.keys(content.sectionsVisibility || {}).length}`)
      }
      console.log('')
    })

    const activeRecord = records.find(r => r.isActive)
    if (activeRecord) {
      console.log(`✅ Enregistrement actif trouvé: ${activeRecord.id}`)
    } else {
      console.log('⚠️  Aucun enregistrement actif trouvé')
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyHomepageEditor()

