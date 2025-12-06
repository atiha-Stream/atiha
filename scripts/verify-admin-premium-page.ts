/**
 * Script de vérification de la page admin /admin/premium
 * 
 * Vérifie que :
 * - Les routes API sont accessibles
 * - Les données sont disponibles
 * - La page peut charger correctement
 * - Les fonctionnalités de gestion sont opérationnelles
 * 
 * Usage: npx tsx scripts/verify-admin-premium-page.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface VerificationResult {
  check: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: VerificationResult[] = []

async function checkAPIEndpoint(
  endpoint: string,
  description: string
): Promise<VerificationResult> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    const data = await response.json()

    if (response.ok && data.success) {
      const hasData = Array.isArray(data.data) ? data.data.length > 0 : !!data.data
      return {
        check: description,
        status: hasData ? 'success' : 'warning',
        message: hasData
          ? `✅ ${description} - Données disponibles (${Array.isArray(data.data) ? data.data.length : 1} élément(s))`
          : `⚠️  ${description} - Aucune donnée disponible`,
        details: Array.isArray(data.data) ? { count: data.data.length } : { exists: true },
      }
    } else {
      return {
        check: description,
        status: 'error',
        message: `❌ ${description} - Erreur: ${data.error || 'Erreur inconnue'}`,
        details: { statusCode: response.status },
      }
    }
  } catch (error: any) {
    return {
      check: description,
      status: 'error',
      message: `❌ ${description} - Erreur de connexion: ${error.message}`,
      details: { error: error.message },
    }
  }
}

async function testAPIPost(
  endpoint: string,
  body: any,
  description: string
): Promise<VerificationResult> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()

    if (response.ok && data.success) {
      return {
        check: description,
        status: 'success',
        message: `✅ ${description} - Opération réussie`,
        details: { data: data.data },
      }
    } else {
      return {
        check: description,
        status: 'error',
        message: `❌ ${description} - Erreur: ${data.error || 'Erreur inconnue'}`,
        details: { statusCode: response.status },
      }
    }
  } catch (error: any) {
    return {
      check: description,
      status: 'error',
      message: `❌ ${description} - Erreur de connexion: ${error.message}`,
      details: { error: error.message },
    }
  }
}

async function verifyAdminPremiumPage() {
  console.log('🔍 Vérification de la page admin /admin/premium\n')
  console.log(`📍 URL de base: ${BASE_URL}\n`)

  // Vérification 1: Route API Plans
  console.log('1️⃣  Vérification de l\'API Plans...')
  const plansCheck = await checkAPIEndpoint('/api/subscription/plans', 'API Plans')
  results.push(plansCheck)
  console.log(`   ${plansCheck.message}`)
  if (plansCheck.details) {
    console.log(`   Détails:`, plansCheck.details)
  }

  // Vérification 2: Route API Payment Links
  console.log('\n2️⃣  Vérification de l\'API Payment Links...')
  const paymentLinksCheck = await checkAPIEndpoint(
    '/api/subscription/payment-links',
    'API Payment Links'
  )
  results.push(paymentLinksCheck)
  console.log(`   ${paymentLinksCheck.message}`)
  if (paymentLinksCheck.details) {
    console.log(`   Détails:`, paymentLinksCheck.details)
  }

  // Vérification 3: Route API Post Payment Links
  console.log('\n3️⃣  Vérification de l\'API Post Payment Links...')
  const postPaymentLinksCheck = await checkAPIEndpoint(
    '/api/subscription/post-payment-links',
    'API Post Payment Links'
  )
  results.push(postPaymentLinksCheck)
  console.log(`   ${postPaymentLinksCheck.message}`)
  if (postPaymentLinksCheck.details) {
    console.log(`   Détails:`, postPaymentLinksCheck.details)
  }

  // Vérification 4: Vérifier que la page est accessible
  console.log('\n4️⃣  Vérification de l\'accessibilité de la page...')
  try {
    const response = await fetch(`${BASE_URL}/admin/premium`, {
      method: 'HEAD',
    })
    if (response.ok || response.status === 401 || response.status === 403) {
      // 401/403 sont attendus si pas authentifié, mais la page existe
      results.push({
        check: 'Page /admin/premium',
        status: response.ok ? 'success' : 'warning',
        message: response.ok
          ? '✅ Page /admin/premium accessible'
          : `⚠️  Page /admin/premium protégée (authentification requise)`,
        details: { statusCode: response.status },
      })
      console.log(
        `   ${response.ok ? '✅' : '⚠️ '} Page /admin/premium ${response.ok ? 'accessible' : 'protégée (authentification requise)'}`
      )
    } else {
      results.push({
        check: 'Page /admin/premium',
        status: 'error',
        message: `❌ Page /admin/premium - Status: ${response.status}`,
        details: { statusCode: response.status },
      })
      console.log(`   ❌ Page /admin/premium - Status: ${response.status}`)
    }
  } catch (error: any) {
    results.push({
      check: 'Page /admin/premium',
      status: 'error',
      message: `❌ Page /admin/premium - Erreur: ${error.message}`,
      details: { error: error.message },
    })
    console.log(`   ❌ Page /admin/premium - Erreur: ${error.message}`)
  }

  // Vérification 5: Vérifier les plans disponibles
  console.log('\n5️⃣  Vérification des plans disponibles...')
  try {
    const response = await fetch(`${BASE_URL}/api/subscription/plans`)
    const data = await response.json()

    if (response.ok && data.success && Array.isArray(data.data)) {
      const individuelPlan = data.data.find((p: any) => p.type === 'individuel')
      const famillePlan = data.data.find((p: any) => p.type === 'famille')

      results.push({
        check: 'Plans disponibles',
        status: 'success',
        message: `✅ ${data.data.length} plan(s) disponible(s)`,
        details: {
          total: data.data.length,
          individuel: !!individuelPlan,
          famille: !!famillePlan,
        },
      })

      console.log(`   ✅ ${data.data.length} plan(s) disponible(s)`)
      if (individuelPlan) {
        console.log(`   ✅ Plan Individuel: ${individuelPlan.title} - ${individuelPlan.price}`)
      }
      if (famillePlan) {
        console.log(`   ✅ Plan Famille: ${famillePlan.title} - ${famillePlan.price}`)
      }
    }
  } catch (error: any) {
    results.push({
      check: 'Plans disponibles',
      status: 'error',
      message: `❌ Erreur lors de la vérification des plans: ${error.message}`,
    })
    console.log(`   ❌ Erreur: ${error.message}`)
  }

  // Vérification 6: Vérifier les liens de paiement disponibles
  console.log('\n6️⃣  Vérification des liens de paiement disponibles...')
  try {
    const response = await fetch(`${BASE_URL}/api/subscription/payment-links`)
    const data = await response.json()

    if (response.ok && data.success && Array.isArray(data.data)) {
      const individuelLink = data.data.find((l: any) => l.planType === 'individuel')
      const familleLink = data.data.find((l: any) => l.planType === 'famille')

      results.push({
        check: 'Liens de paiement disponibles',
        status: 'success',
        message: `✅ ${data.data.length} lien(s) de paiement disponible(s)`,
        details: {
          total: data.data.length,
          individuel: !!individuelLink,
          famille: !!familleLink,
        },
      })

      console.log(`   ✅ ${data.data.length} lien(s) de paiement disponible(s)`)
      if (individuelLink) {
        console.log(`   ✅ Lien Individuel: ${individuelLink.isActive ? 'Actif' : 'Inactif'}`)
      }
      if (familleLink) {
        console.log(`   ✅ Lien Famille: ${familleLink.isActive ? 'Actif' : 'Inactif'}`)
      }
    }
  } catch (error: any) {
    results.push({
      check: 'Liens de paiement disponibles',
      status: 'error',
      message: `❌ Erreur lors de la vérification des liens: ${error.message}`,
    })
    console.log(`   ❌ Erreur: ${error.message}`)
  }

  // Vérification 7: Vérifier les liens après paiement disponibles
  console.log('\n7️⃣  Vérification des liens après paiement disponibles...')
  try {
    const response = await fetch(`${BASE_URL}/api/subscription/post-payment-links`)
    const data = await response.json()

    if (response.ok && data.success && Array.isArray(data.data)) {
      const individuelLink = data.data.find((l: any) => l.planType === 'individuel')
      const familleLink = data.data.find((l: any) => l.planType === 'famille')

      results.push({
        check: 'Liens après paiement disponibles',
        status: 'success',
        message: `✅ ${data.data.length} lien(s) après paiement disponible(s)`,
        details: {
          total: data.data.length,
          individuel: !!individuelLink,
          famille: !!familleLink,
        },
      })

      console.log(`   ✅ ${data.data.length} lien(s) après paiement disponible(s)`)
      if (individuelLink) {
        console.log(`   ✅ Lien Individuel: ${individuelLink.isActive ? 'Actif' : 'Inactif'}`)
      }
      if (familleLink) {
        console.log(`   ✅ Lien Famille: ${familleLink.isActive ? 'Actif' : 'Inactif'}`)
      }
    }
  } catch (error: any) {
    results.push({
      check: 'Liens après paiement disponibles',
      status: 'error',
      message: `❌ Erreur lors de la vérification des liens: ${error.message}`,
    })
    console.log(`   ❌ Erreur: ${error.message}`)
  }

  // Vérification 8: Test de mise à jour d'un plan (simulation)
  console.log('\n8️⃣  Test de la fonctionnalité de mise à jour (simulation)...')
  try {
    // Récupérer un plan existant
    const getResponse = await fetch(`${BASE_URL}/api/subscription/plans`)
    const getData = await getResponse.json()

    if (getResponse.ok && getData.success && Array.isArray(getData.data) && getData.data.length > 0) {
      const existingPlan = getData.data[0]
      
      // Tester la mise à jour (sans vraiment modifier)
      const testUpdate = await testAPIPost(
        '/api/subscription/plans',
        {
          type: existingPlan.type,
          title: existingPlan.title,
          price: existingPlan.price,
          period: existingPlan.period,
          commitment: existingPlan.commitment,
          description: existingPlan.description,
          features: existingPlan.features || [],
          buttonText: existingPlan.buttonText,
          buttonColor: existingPlan.buttonColor,
          paymentUrl: existingPlan.paymentUrl,
          isActive: existingPlan.isActive,
        },
        'Mise à jour d\'un plan'
      )
      
      results.push(testUpdate)
      console.log(`   ${testUpdate.message}`)
    } else {
      results.push({
        check: 'Mise à jour d\'un plan',
        status: 'warning',
        message: '⚠️  Aucun plan disponible pour tester la mise à jour',
      })
      console.log('   ⚠️  Aucun plan disponible pour tester la mise à jour')
    }
  } catch (error: any) {
    results.push({
      check: 'Mise à jour d\'un plan',
      status: 'error',
      message: `❌ Erreur lors du test de mise à jour: ${error.message}`,
    })
    console.log(`   ❌ Erreur: ${error.message}`)
  }

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DE LA VÉRIFICATION')
  console.log('='.repeat(60))

  const successCount = results.filter((r) => r.status === 'success').length
  const warningCount = results.filter((r) => r.status === 'warning').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const totalCount = results.length

  console.log(`\n✅ Succès: ${successCount}/${totalCount}`)
  console.log(`⚠️  Avertissements: ${warningCount}/${totalCount}`)
  console.log(`❌ Erreurs: ${errorCount}/${totalCount}`)

  if (errorCount === 0 && warningCount === 0) {
    console.log('\n✨ Toutes les vérifications sont passées !')
    console.log('   La page /admin/premium devrait fonctionner correctement.')
    console.log('\n📝 Prochaines étapes :')
    console.log('   1. Se connecter en tant qu\'admin sur /admin/login')
    console.log('   2. Ouvrir http://localhost:3000/admin/premium')
    console.log('   3. Vérifier visuellement que les plans et liens s\'affichent')
    console.log('   4. Tester les fonctionnalités de gestion (modifier, sauvegarder)')
    console.log('   5. Consulter TEST_ADMIN_PREMIUM_PAGE.md pour le guide complet')
  } else if (errorCount > 0) {
    console.log('\n⚠️  Des erreurs ont été détectées :')
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`   - ${r.check}: ${r.message}`)
      })
    console.log('\n🔧 Actions recommandées :')
    console.log('   1. Vérifier que le serveur est en cours d\'exécution (npm run dev)')
    console.log('   2. Vérifier la connexion à la base de données')
    console.log('   3. Vérifier que les routes API sont correctement configurées')
  } else {
    console.log('\n⚠️  Des avertissements ont été détectés :')
    results
      .filter((r) => r.status === 'warning')
      .forEach((r) => {
        console.log(`   - ${r.check}: ${r.message}`)
      })
    console.log('\n💡 Note : Les avertissements indiquent que certaines données ne sont pas disponibles.')
    console.log('   Vous pouvez les créer via l\'interface admin.')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Vérification terminée!')
  console.log('='.repeat(60) + '\n')

  // Code de sortie
  process.exit(errorCount > 0 ? 1 : 0)
}

// Exécuter la vérification
verifyAdminPremiumPage().catch((error) => {
  console.error('❌ Erreur fatale lors de la vérification:', error)
  process.exit(1)
})

