/**
 * Script de test pour les routes API d'abonnement
 * 
 * Usage: npx tsx scripts/test-subscription-api-routes.ts
 * 
 * Prérequis: L'application doit être en cours d'exécution (npm run dev)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface TestResult {
  route: string
  method: string
  status: 'success' | 'error' | 'warning'
  statusCode?: number
  message: string
  data?: any
  error?: string
}

const results: TestResult[] = []

async function testRoute(
  route: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: any
): Promise<TestResult> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${route}`, options)
    const data = await response.json()

    if (response.ok && data.success) {
      return {
        route,
        method,
        status: 'success',
        statusCode: response.status,
        message: 'Route fonctionnelle',
        data: data.data,
      }
    } else {
      return {
        route,
        method,
        status: 'error',
        statusCode: response.status,
        message: 'Erreur dans la réponse',
        error: data.error || 'Erreur inconnue',
      }
    }
  } catch (error: any) {
    return {
      route,
      method,
      status: 'error',
      message: 'Erreur de connexion',
      error: error.message || 'Erreur inconnue',
    }
  }
}

async function runTests() {
  console.log('🧪 Début des tests des routes API d\'abonnement\n')
  console.log(`📍 URL de base: ${BASE_URL}\n`)

  // Test 1: GET /api/subscription/plans
  console.log('1️⃣  Test GET /api/subscription/plans...')
  const getPlans = await testRoute('/api/subscription/plans', 'GET')
  results.push(getPlans)
  console.log(`   ${getPlans.status === 'success' ? '✅' : '❌'} ${getPlans.message}`)
  if (getPlans.statusCode) console.log(`   Status: ${getPlans.statusCode}`)

  // Test 2: POST /api/subscription/plans (créer un plan individuel)
  console.log('\n2️⃣  Test POST /api/subscription/plans (individuel)...')
  const postPlanIndividuel = await testRoute('/api/subscription/plans', 'POST', {
    type: 'individuel',
    title: 'Plan Individuel',
    price: '9.99',
    period: 'mois',
    commitment: 'Sans engagement',
    description: 'Plan individuel de test',
    features: ['Accès illimité', 'HD disponible'],
    buttonText: 'S\'abonner',
    buttonColor: '#3B82F6',
    paymentUrl: 'https://example.com/payment/individuel',
    isActive: true,
  })
  results.push(postPlanIndividuel)
  console.log(`   ${postPlanIndividuel.status === 'success' ? '✅' : '❌'} ${postPlanIndividuel.message}`)
  if (postPlanIndividuel.statusCode) console.log(`   Status: ${postPlanIndividuel.statusCode}`)

  // Test 3: POST /api/subscription/plans (créer un plan famille)
  console.log('\n3️⃣  Test POST /api/subscription/plans (famille)...')
  const postPlanFamille = await testRoute('/api/subscription/plans', 'POST', {
    type: 'famille',
    title: 'Plan Famille',
    price: '14.99',
    period: 'mois',
    commitment: 'Sans engagement',
    description: 'Plan famille de test',
    features: ['Accès illimité', '4K disponible', 'Multi-écrans'],
    buttonText: 'S\'abonner',
    buttonColor: '#10B981',
    paymentUrl: 'https://example.com/payment/famille',
    isActive: true,
  })
  results.push(postPlanFamille)
  console.log(`   ${postPlanFamille.status === 'success' ? '✅' : '❌'} ${postPlanFamille.message}`)
  if (postPlanFamille.statusCode) console.log(`   Status: ${postPlanFamille.statusCode}`)

  // Test 4: GET /api/subscription/payment-links
  console.log('\n4️⃣  Test GET /api/subscription/payment-links...')
  const getPaymentLinks = await testRoute('/api/subscription/payment-links', 'GET')
  results.push(getPaymentLinks)
  console.log(`   ${getPaymentLinks.status === 'success' ? '✅' : '❌'} ${getPaymentLinks.message}`)
  if (getPaymentLinks.statusCode) console.log(`   Status: ${getPaymentLinks.statusCode}`)

  // Test 5: POST /api/subscription/payment-links (individuel)
  console.log('\n5️⃣  Test POST /api/subscription/payment-links (individuel)...')
  const postPaymentLinkIndividuel = await testRoute('/api/subscription/payment-links', 'POST', {
    planType: 'individuel',
    url: 'https://example.com/payment/individuel',
    isActive: true,
    createdBy: 'test-user',
  })
  results.push(postPaymentLinkIndividuel)
  console.log(`   ${postPaymentLinkIndividuel.status === 'success' ? '✅' : '❌'} ${postPaymentLinkIndividuel.message}`)
  if (postPaymentLinkIndividuel.statusCode) console.log(`   Status: ${postPaymentLinkIndividuel.statusCode}`)

  // Test 6: POST /api/subscription/payment-links (famille)
  console.log('\n6️⃣  Test POST /api/subscription/payment-links (famille)...')
  const postPaymentLinkFamille = await testRoute('/api/subscription/payment-links', 'POST', {
    planType: 'famille',
    url: 'https://example.com/payment/famille',
    isActive: true,
    createdBy: 'test-user',
  })
  results.push(postPaymentLinkFamille)
  console.log(`   ${postPaymentLinkFamille.status === 'success' ? '✅' : '❌'} ${postPaymentLinkFamille.message}`)
  if (postPaymentLinkFamille.statusCode) console.log(`   Status: ${postPaymentLinkFamille.statusCode}`)

  // Test 7: GET /api/subscription/post-payment-links
  console.log('\n7️⃣  Test GET /api/subscription/post-payment-links...')
  const getPostPaymentLinks = await testRoute('/api/subscription/post-payment-links', 'GET')
  results.push(getPostPaymentLinks)
  console.log(`   ${getPostPaymentLinks.status === 'success' ? '✅' : '❌'} ${getPostPaymentLinks.message}`)
  if (getPostPaymentLinks.statusCode) console.log(`   Status: ${getPostPaymentLinks.statusCode}`)

  // Test 8: POST /api/subscription/post-payment-links (individuel)
  console.log('\n8️⃣  Test POST /api/subscription/post-payment-links (individuel)...')
  const postPostPaymentLinkIndividuel = await testRoute('/api/subscription/post-payment-links', 'POST', {
    planType: 'individuel',
    url: 'https://example.com/post-payment/individuel',
    isActive: true,
  })
  results.push(postPostPaymentLinkIndividuel)
  console.log(`   ${postPostPaymentLinkIndividuel.status === 'success' ? '✅' : '❌'} ${postPostPaymentLinkIndividuel.message}`)
  if (postPostPaymentLinkIndividuel.statusCode) console.log(`   Status: ${postPostPaymentLinkIndividuel.statusCode}`)

  // Test 9: POST /api/subscription/post-payment-links (famille)
  console.log('\n9️⃣  Test POST /api/subscription/post-payment-links (famille)...')
  const postPostPaymentLinkFamille = await testRoute('/api/subscription/post-payment-links', 'POST', {
    planType: 'famille',
    url: 'https://example.com/post-payment/famille',
    isActive: true,
  })
  results.push(postPostPaymentLinkFamille)
  console.log(`   ${postPostPaymentLinkFamille.status === 'success' ? '✅' : '❌'} ${postPostPaymentLinkFamille.message}`)
  if (postPostPaymentLinkFamille.statusCode) console.log(`   Status: ${postPostPaymentLinkFamille.statusCode}`)

  // Test 10: GET /api/subscription/payments
  console.log('\n🔟 Test GET /api/subscription/payments...')
  const getPayments = await testRoute('/api/subscription/payments', 'GET')
  results.push(getPayments)
  console.log(`   ${getPayments.status === 'success' ? '✅' : '❌'} ${getPayments.message}`)
  if (getPayments.statusCode) console.log(`   Status: ${getPayments.statusCode}`)

  // Test 11: Récupérer ou créer un utilisateur de test pour les paiements
  console.log('\n1️⃣1️⃣ Préparation: Récupération d\'un utilisateur de test...')
  let testUserId: string | null = null
  
  // Essayer de récupérer un utilisateur existant
  try {
    const usersResponse = await fetch(`${BASE_URL}/api/users?limit=1`)
    if (usersResponse.ok) {
      const usersData = await usersResponse.json()
      if (usersData.users && usersData.users.length > 0) {
        testUserId = usersData.users[0].id
        console.log(`   ✅ Utilisateur trouvé: ${testUserId}`)
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Impossible de récupérer un utilisateur existant`)
  }

  // Si aucun utilisateur trouvé, créer un utilisateur de test
  if (!testUserId) {
    try {
      const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-${Date.now()}@atiha-test.com`,
          password: 'TestPassword123!',
          name: 'Test User API',
        }),
      })
      if (createUserResponse.ok) {
        const userData = await createUserResponse.json()
        if (userData.user) {
          testUserId = userData.user.id
          console.log(`   ✅ Utilisateur de test créé: ${testUserId}`)
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Impossible de créer un utilisateur de test`)
    }
  }

  // Test 12: POST /api/subscription/payments (créer un paiement)
  if (testUserId) {
    console.log('\n1️⃣2️⃣ Test POST /api/subscription/payments...')
    const postPayment = await testRoute('/api/subscription/payments', 'POST', {
      userId: testUserId,
      planType: 'individuel',
      amount: '9.99',
      currency: 'EUR',
      status: 'pending',
      paymentUrl: 'https://example.com/payment/123',
      paymentProvider: 'stripe',
      metadata: { test: true },
    })
    results.push(postPayment)
    console.log(`   ${postPayment.status === 'success' ? '✅' : '❌'} ${postPayment.message}`)
    if (postPayment.statusCode) console.log(`   Status: ${postPayment.statusCode}`)

    // Test 13: GET /api/subscription/payments/[id] (si un paiement a été créé)
    if (postPayment.status === 'success' && postPayment.data?.id) {
      console.log('\n1️⃣3️⃣ Test GET /api/subscription/payments/[id]...')
      const getPaymentById = await testRoute(`/api/subscription/payments/${postPayment.data.id}`, 'GET')
      results.push(getPaymentById)
      console.log(`   ${getPaymentById.status === 'success' ? '✅' : '❌'} ${getPaymentById.message}`)
      if (getPaymentById.statusCode) console.log(`   Status: ${getPaymentById.statusCode}`)

      // Test 14: PATCH /api/subscription/payments/[id]
      if (getPaymentById.status === 'success') {
        console.log('\n1️⃣4️⃣ Test PATCH /api/subscription/payments/[id]...')
        const patchPayment = await testRoute(`/api/subscription/payments/${postPayment.data.id}`, 'PATCH', {
          status: 'completed',
          transactionId: 'txn_test_123456',
        })
        results.push(patchPayment)
        console.log(`   ${patchPayment.status === 'success' ? '✅' : '❌'} ${patchPayment.message}`)
        if (patchPayment.statusCode) console.log(`   Status: ${patchPayment.statusCode}`)
      }
    }
  } else {
    console.log('\n1️⃣2️⃣ ⚠️  Test POST /api/subscription/payments ignoré (aucun utilisateur disponible)')
    results.push({
      route: '/api/subscription/payments',
      method: 'POST',
      status: 'warning',
      message: 'Test ignoré - aucun utilisateur disponible',
    })
  }


  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('='.repeat(60))

  const successCount = results.filter((r) => r.status === 'success').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const totalCount = results.length

  console.log(`\n✅ Succès: ${successCount}/${totalCount}`)
  console.log(`❌ Erreurs: ${errorCount}/${totalCount}`)
  console.log(`📈 Taux de réussite: ${((successCount / totalCount) * 100).toFixed(1)}%\n`)

  if (errorCount > 0) {
    console.log('❌ Routes en erreur:')
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`   - ${r.method} ${r.route}`)
        if (r.error) console.log(`     Erreur: ${r.error}`)
        if (r.statusCode) console.log(`     Status: ${r.statusCode}`)
      })
    console.log()
  }

  // Détails des résultats
  console.log('📋 Détails des résultats:')
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : '❌'
    console.log(`   ${icon} ${index + 1}. ${result.method} ${result.route}`)
    if (result.statusCode) console.log(`      Status: ${result.statusCode}`)
    if (result.error) console.log(`      Erreur: ${result.error}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log('✨ Tests terminés!')
  console.log('='.repeat(60) + '\n')

  // Code de sortie
  process.exit(errorCount > 0 ? 1 : 0)
}

// Exécuter les tests
runTests().catch((error) => {
  console.error('❌ Erreur fatale lors de l\'exécution des tests:', error)
  process.exit(1)
})

