/**
 * Script de test pour la route API HomepageEditor
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_URL = `${BASE_URL}/api/homepage-editor`

async function testHomepageEditorAPI() {
  console.log('🧪 Test de la route API HomepageEditor\n')
  console.log(`📍 URL de test: ${API_URL}\n`)

  // Test 1: GET - Récupérer les données (publique)
  console.log('📋 Test 1: GET /api/homepage-editor (publique)')
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

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
        }
      } else {
        console.log(`   Message: ${data.message}`)
      }
    } else {
      console.log('❌ GET échoué')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${data.error || 'Erreur inconnue'}`)
    }
  } catch (error) {
    console.log('❌ Erreur lors du test GET')
    console.log(`   Error: ${error}`)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: POST - Mettre à jour (nécessite authentification admin)
  console.log('📋 Test 2: POST /api/homepage-editor (admin requis)')
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          test: 'data'
        }
      })
    })

    const data = await response.json()

    if (response.status === 401 || response.status === 403) {
      console.log('✅ POST correctement protégé (authentification requise)')
      console.log(`   Status: ${response.status}`)
      console.log(`   Message: ${data.error}`)
    } else if (response.ok) {
      console.log('✅ POST réussi')
      console.log(`   Status: ${response.status}`)
      console.log(`   Message: ${data.message}`)
    } else {
      console.log('⚠️  POST retourné une erreur')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${data.error || 'Erreur inconnue'}`)
    }
  } catch (error) {
    console.log('❌ Erreur lors du test POST')
    console.log(`   Error: ${error}`)
  }

  console.log('\n✨ Tests terminés')
}

// Exécuter les tests
testHomepageEditorAPI().catch(console.error)

