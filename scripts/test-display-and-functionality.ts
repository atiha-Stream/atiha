/**
 * Script de test de l'affichage et du fonctionnement
 * 
 * Vérifie que :
 * - Les pages s'affichent correctement
 * - Les données sont chargées et affichées
 * - Les interactions fonctionnent
 * - Les API répondent correctement
 * 
 * Usage: npx tsx scripts/test-display-and-functionality.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: TestResult[] = []

async function testPageAccessibility(url: string, description: string): Promise<TestResult> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    
    if (response.ok) {
      return {
        test: description,
        status: 'success',
        message: `✅ ${description} - Page accessible`,
        details: { statusCode: response.status, url },
      }
    } else if (response.status === 401 || response.status === 403) {
      return {
        test: description,
        status: 'warning',
        message: `⚠️  ${description} - Page protégée (authentification requise)`,
        details: { statusCode: response.status, url },
      }
    } else {
      return {
        test: description,
        status: 'error',
        message: `❌ ${description} - Erreur: Status ${response.status}`,
        details: { statusCode: response.status, url },
      }
    }
  } catch (error: any) {
    return {
      test: description,
      status: 'error',
      message: `❌ ${description} - Erreur de connexion: ${error.message}`,
      details: { error: error.message, url },
    }
  }
}

async function testAPIData(endpoint: string, description: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    const data = await response.json()

    if (response.ok && data.success) {
      const hasData = Array.isArray(data.data) ? data.data.length > 0 : !!data.data
      return {
        test: description,
        status: hasData ? 'success' : 'warning',
        message: hasData
          ? `✅ ${description} - Données disponibles (${Array.isArray(data.data) ? data.data.length : 1} élément(s))`
          : `⚠️  ${description} - Aucune donnée disponible`,
        details: {
          count: Array.isArray(data.data) ? data.data.length : (data.data ? 1 : 0),
          sample: Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : data.data,
        },
      }
    } else {
      return {
        test: description,
        status: 'error',
        message: `❌ ${description} - Erreur: ${data.error || 'Erreur inconnue'}`,
        details: { statusCode: response.status },
      }
    }
  } catch (error: any) {
    return {
      test: description,
      status: 'error',
      message: `❌ ${description} - Erreur de connexion: ${error.message}`,
      details: { error: error.message },
    }
  }
}

async function testDisplayAndFunctionality() {
  console.log('🧪 Test de l\'affichage et du fonctionnement\n')
  console.log(`📍 URL de base: ${BASE_URL}\n`)

  // Tests d'accessibilité des pages
  console.log('='.repeat(60))
  console.log('📄 TESTS D\'ACCESSIBILITÉ DES PAGES')
  console.log('='.repeat(60) + '\n')

  const pages = [
    { url: '/subscription', description: 'Page /subscription' },
    { url: '/admin/premium', description: 'Page Admin /admin/premium' },
    { url: '/admin/login', description: 'Page Admin Login' },
    { url: '/dashboard', description: 'Page Dashboard' },
  ]

  for (const page of pages) {
    console.log(`🔍 Test: ${page.description}...`)
    const result = await testPageAccessibility(`${BASE_URL}${page.url}`, page.description)
    results.push(result)
    console.log(`   ${result.message}`)
    if (result.details?.statusCode) {
      console.log(`   Status: ${result.details.statusCode}`)
    }
    console.log()
  }

  // Tests des données API
  console.log('='.repeat(60))
  console.log('📊 TESTS DES DONNÉES API')
  console.log('='.repeat(60) + '\n')

  const apiEndpoints = [
    { endpoint: '/api/subscription/plans', description: 'API Plans d\'abonnement' },
    { endpoint: '/api/subscription/payment-links', description: 'API Liens de paiement' },
    { endpoint: '/api/subscription/post-payment-links', description: 'API Liens après paiement' },
  ]

  for (const api of apiEndpoints) {
    console.log(`🔍 Test: ${api.description}...`)
    const result = await testAPIData(api.endpoint, api.description)
    results.push(result)
    console.log(`   ${result.message}`)
    if (result.details?.count !== undefined) {
      console.log(`   Nombre d'éléments: ${result.details.count}`)
    }
    if (result.details?.sample) {
      const sample = result.details.sample
      if (sample.type) {
        console.log(`   Exemple: ${sample.type} - ${sample.title || sample.planType || 'N/A'}`)
      }
    }
    console.log()
  }

  // Tests de cohérence des données
  console.log('='.repeat(60))
  console.log('🔗 TESTS DE COHÉRENCE DES DONNÉES')
  console.log('='.repeat(60) + '\n')

  try {
    // Vérifier que les plans ont des liens de paiement correspondants
    console.log('🔍 Test: Cohérence Plans ↔ Liens de paiement...')
    const plansResponse = await fetch(`${BASE_URL}/api/subscription/plans`)
    const plansData = await plansResponse.json()
    
    const linksResponse = await fetch(`${BASE_URL}/api/subscription/payment-links`)
    const linksData = await linksResponse.json()

    if (plansResponse.ok && linksResponse.ok && plansData.success && linksData.success) {
      const plans = plansData.data || []
      const links = linksData.data || []
      
      const individuelPlan = plans.find((p: any) => p.type === 'individuel')
      const famillePlan = plans.find((p: any) => p.type === 'famille')
      const individuelLink = links.find((l: any) => l.planType === 'individuel')
      const familleLink = links.find((l: any) => l.planType === 'famille')

      const coherence = {
        individuel: { plan: !!individuelPlan, link: !!individuelLink },
        famille: { plan: !!famillePlan, link: !!familleLink },
      }

      const allCoherent = 
        (coherence.individuel.plan === coherence.individuel.link) &&
        (coherence.famille.plan === coherence.famille.link)

      results.push({
        test: 'Cohérence Plans ↔ Liens',
        status: allCoherent ? 'success' : 'warning',
        message: allCoherent
          ? '✅ Cohérence Plans ↔ Liens - Tous les plans ont leurs liens correspondants'
          : '⚠️  Cohérence Plans ↔ Liens - Certains plans n\'ont pas de liens correspondants',
        details: coherence,
      })

      console.log(`   ${allCoherent ? '✅' : '⚠️ '} Cohérence vérifiée`)
      console.log(`   Individuel: Plan ${coherence.individuel.plan ? '✅' : '❌'} | Lien ${coherence.individuel.link ? '✅' : '❌'}`)
      console.log(`   Famille: Plan ${coherence.famille.plan ? '✅' : '❌'} | Lien ${coherence.famille.link ? '✅' : '❌'}`)
    } else {
      results.push({
        test: 'Cohérence Plans ↔ Liens',
        status: 'error',
        message: '❌ Impossible de vérifier la cohérence - Erreur API',
      })
      console.log('   ❌ Erreur lors de la vérification')
    }
  } catch (error: any) {
    results.push({
      test: 'Cohérence Plans ↔ Liens',
      status: 'error',
      message: `❌ Erreur: ${error.message}`,
    })
    console.log(`   ❌ Erreur: ${error.message}`)
  }

  console.log()

  // Résumé
  console.log('='.repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('='.repeat(60))

  const successCount = results.filter((r) => r.status === 'success').length
  const warningCount = results.filter((r) => r.status === 'warning').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const totalCount = results.length

  console.log(`\n✅ Succès: ${successCount}/${totalCount}`)
  console.log(`⚠️  Avertissements: ${warningCount}/${totalCount}`)
  console.log(`❌ Erreurs: ${errorCount}/${totalCount}`)
  console.log(`📈 Taux de réussite: ${((successCount / totalCount) * 100).toFixed(1)}%\n`)

  if (errorCount > 0) {
    console.log('❌ Tests en erreur:')
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`   - ${r.test}: ${r.message}`)
      })
    console.log()
  }

  if (warningCount > 0) {
    console.log('⚠️  Tests avec avertissements:')
    results
      .filter((r) => r.status === 'warning')
      .forEach((r) => {
        console.log(`   - ${r.test}: ${r.message}`)
      })
    console.log()
  }

  // Recommandations
  console.log('='.repeat(60))
  console.log('📝 RECOMMANDATIONS POUR LES TESTS VISUELS')
  console.log('='.repeat(60) + '\n')

  console.log('1. Page /subscription :')
  console.log('   - Ouvrir http://localhost:3000/subscription')
  console.log('   - Vérifier que les plans s\'affichent correctement')
  console.log('   - Vérifier que les prix et fonctionnalités sont visibles')
  console.log('   - Tester les boutons "S\'abonner"')
  console.log('   - Vérifier que les modals de paiement s\'ouvrent\n')

  console.log('2. Page Admin /admin/premium :')
  console.log('   - Se connecter sur /admin/login')
  console.log('   - Ouvrir http://localhost:3000/admin/premium')
  console.log('   - Vérifier que les formulaires sont pré-remplis')
  console.log('   - Modifier un plan et sauvegarder')
  console.log('   - Vérifier que les modifications sont persistées\n')

  console.log('3. Console du navigateur (F12) :')
  console.log('   - Vérifier qu\'il n\'y a pas d\'erreurs JavaScript')
  console.log('   - Vérifier les requêtes API dans l\'onglet Network')
  console.log('   - Vérifier que les réponses sont correctes\n')

  console.log('4. Responsive Design :')
  console.log('   - Tester sur différentes tailles d\'écran')
  console.log('   - Desktop (1920x1080)')
  console.log('   - Tablet (768x1024)')
  console.log('   - Mobile (375x667)\n')

  console.log('='.repeat(60))
  console.log('✨ Tests terminés!')
  console.log('='.repeat(60) + '\n')

  // Code de sortie
  process.exit(errorCount > 0 ? 1 : 0)
}

// Exécuter les tests
testDisplayAndFunctionality().catch((error) => {
  console.error('❌ Erreur fatale lors des tests:', error)
  process.exit(1)
})

