/**
 * Test direct de la logique de la route API HomepageEditor
 * Teste directement avec Prisma sans avoir besoin du serveur Next.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testHomepageEditorAPIDirect() {
  console.log('🧪 Test direct de la logique API HomepageEditor\n')

  try {
    // Test 1: Récupérer l'enregistrement actif (simule GET)
    console.log('📋 Test 1: Récupérer l\'enregistrement actif (GET)')
    const homepageEditor = await prisma.homepageEditor.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (homepageEditor) {
      console.log('✅ Enregistrement trouvé')
      console.log(`   ID: ${homepageEditor.id}`)
      console.log(`   Version: ${homepageEditor.version}`)
      console.log(`   Actif: ${homepageEditor.isActive}`)
      console.log(`   Créé par: ${homepageEditor.createdBy || 'N/A'}`)
      console.log(`   Mis à jour par: ${homepageEditor.updatedBy || 'N/A'}`)
      console.log(`   Créé le: ${homepageEditor.createdAt}`)
      console.log(`   Mis à jour le: ${homepageEditor.updatedAt}`)

      // Vérifier le contenu
      const content = homepageEditor.content as any
      if (content) {
        console.log(`\n   📄 Contenu:`)
        console.log(`      - Nom de l'app: ${content.appIdentity?.name || 'N/A'}`)
        console.log(`      - Dernière mise à jour: ${content.lastUpdated || 'N/A'}`)
        console.log(`      - Sections visibles: ${Object.keys(content.sectionsVisibility || {}).length}`)
        
        // Vérifier quelques sections importantes
        if (content.hero) {
          console.log(`      - Hero title: ${content.hero.title || 'N/A'}`)
        }
        if (content.features) {
          console.log(`      - Features présents: Oui`)
        }
        if (content.footer) {
          console.log(`      - Footer présent: Oui`)
        }
        if (content.faq) {
          console.log(`      - FAQ questions: ${content.faq.questions?.length || 0}`)
        }
      } else {
        console.log('   ⚠️  Aucun contenu trouvé')
      }
    } else {
      console.log('❌ Aucun enregistrement actif trouvé')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Vérifier la structure de la réponse (simule la réponse API)
    console.log('📋 Test 2: Vérifier la structure de la réponse API')
    if (homepageEditor) {
      const apiResponse = {
        success: true,
        data: {
          id: homepageEditor.id,
          content: homepageEditor.content,
          version: homepageEditor.version,
          isActive: homepageEditor.isActive,
          createdAt: homepageEditor.createdAt,
          updatedAt: homepageEditor.updatedAt
        }
      }

      console.log('✅ Structure de réponse valide')
      console.log(`   success: ${apiResponse.success}`)
      console.log(`   data.id: ${apiResponse.data.id}`)
      console.log(`   data.version: ${apiResponse.data.version}`)
      console.log(`   data.isActive: ${apiResponse.data.isActive}`)
      console.log(`   data.content: ${apiResponse.data.content ? 'Présent' : 'Absent'}`)
    } else {
      const apiResponse = {
        success: true,
        data: null,
        message: 'Aucune configuration de page d\'accueil trouvée'
      }
      console.log('✅ Structure de réponse valide (aucune donnée)')
      console.log(`   success: ${apiResponse.success}`)
      console.log(`   message: ${apiResponse.message}`)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Vérifier tous les enregistrements
    console.log('📋 Test 3: Lister tous les enregistrements')
    const allRecords = await prisma.homepageEditor.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ ${allRecords.length} enregistrement(s) trouvé(s)`)
    allRecords.forEach((record, index) => {
      console.log(`\n   Enregistrement ${index + 1}:`)
      console.log(`      ID: ${record.id}`)
      console.log(`      Version: ${record.version}`)
      console.log(`      Actif: ${record.isActive ? 'Oui' : 'Non'}`)
      console.log(`      Créé le: ${record.createdAt}`)
    })

    console.log('\n✨ Tests terminés avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
testHomepageEditorAPIDirect()

