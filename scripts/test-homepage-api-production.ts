/**
 * Script pour tester l'API HomepageEditor en production
 */

const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://attiha.vercel.app'
const API_URL = `${PRODUCTION_URL}/api/homepage-editor`

async function testHomepageAPIProduction() {
  console.log('🧪 Test de l\'API HomepageEditor en PRODUCTION\n')
  console.log(`📍 URL de production: ${PRODUCTION_URL}`)
  console.log(`📍 URL de l'API: ${API_URL}\n`)

  // Test 1: GET - Récupérer les données
  console.log('📋 Test 1: GET /api/homepage-editor')
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.log('⚠️  La réponse n\'est pas du JSON valide')
      console.log(`   Status: ${response.status}`)
      console.log(`   Response (premiers 200 caractères): ${responseText.substring(0, 200)}`)
      if (responseText.includes('deploy') || responseText.includes('Deploy')) {
        console.log('\n💡 L\'URL semble pointer vers une page de déploiement plutôt que vers l\'application')
        console.log('   Vérifiez l\'URL de production dans Vercel')
      }
      return
    }

    if (response.ok) {
      console.log('✅ GET réussi')
      console.log(`   Status: ${response.status}`)
      console.log(`   Success: ${data.success}`)
      
      if (data.data) {
        console.log(`   ID: ${data.data.id}`)
        console.log(`   Version: ${data.data.version}`)
        console.log(`   Actif: ${data.data.isActive}`)
        console.log(`   Contenu présent: ${data.data.content ? 'Oui' : 'Non'}`)
        
        if (data.data.content) {
          const content = data.data.content as any
          console.log(`   Nom de l'app: ${content.appIdentity?.name || 'N/A'}`)
          console.log(`   Sections visibles: ${Object.keys(content.sectionsVisibility || {}).length}`)
          console.log(`   Hero title: ${content.hero?.title || 'N/A'}`)
        }
      } else {
        console.log(`   ⚠️  Aucune donnée trouvée`)
        console.log(`   Message: ${data.message}`)
        console.log('\n💡 Les données doivent être importées dans la base de production')
        console.log('   Exécutez: npm run import:homepage:production')
      }
    } else {
      console.log('❌ GET échoué')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${data.error || 'Erreur inconnue'}`)
    }
  } catch (error) {
    console.log('❌ Erreur lors du test GET')
    console.log(`   Error: ${error}`)
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Vérifiez que:')
        console.log('   1. L\'application est déployée et accessible')
        console.log('   2. L\'URL de production est correcte')
        console.log('   3. Les variables d\'environnement NEXT_PUBLIC_APP_URL sont configurées')
      }
    }
  }

  console.log('\n✨ Test terminé')
}

// Exécuter les tests
testHomepageAPIProduction().catch(console.error)

