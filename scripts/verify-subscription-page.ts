/**
 * Script de vérification de la page /subscription
 * 
 * Vérifie que :
 * - Les routes API sont accessibles
 * - Les données sont disponibles
 * - La page peut charger correctement
 * 
 * Usage: npx tsx scripts/verify-subscription-page.ts
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

async function verifySubscriptionPage() {
  console.log('🔍 Vérification de la page /subscription\n')
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
    const response = await fetch(`${BASE_URL}/subscription`, {
      method: 'HEAD',
    })
    if (response.ok) {
      results.push({
        check: 'Page /subscription',
        status: 'success',
        message: '✅ Page /subscription accessible',
        details: { statusCode: response.status },
      })
      console.log('   ✅ Page /subscription accessible')
    } else {
      results.push({
        check: 'Page /subscription',
        status: 'error',
        message: `❌ Page /subscription - Status: ${response.status}`,
        details: { statusCode: response.status },
      })
      console.log(`   ❌ Page /subscription - Status: ${response.status}`)
    }
  } catch (error: any) {
    results.push({
      check: 'Page /subscription',
      status: 'error',
      message: `❌ Page /subscription - Erreur: ${error.message}`,
      details: { error: error.message },
    })
    console.log(`   ❌ Page /subscription - Erreur: ${error.message}`)
  }

  // Vérification 5: Vérifier les plans actifs
  console.log('\n5️⃣  Vérification des plans actifs...')
  try {
    const response = await fetch(`${BASE_URL}/api/subscription/plans`)
    const data = await response.json()

    if (response.ok && data.success && Array.isArray(data.data)) {
      const activePlans = data.data.filter((plan: any) => plan.isActive)
      const individuelPlan = activePlans.find((p: any) => p.type === 'individuel')
      const famillePlan = activePlans.find((p: any) => p.type === 'famille')

      results.push({
        check: 'Plans actifs',
        status: activePlans.length > 0 ? 'success' : 'warning',
        message:
          activePlans.length > 0
            ? `✅ ${activePlans.length} plan(s) actif(s) trouvé(s)`
            : '⚠️  Aucun plan actif trouvé',
        details: {
          total: activePlans.length,
          individuel: !!individuelPlan,
          famille: !!famillePlan,
        },
      })

      console.log(`   ${activePlans.length > 0 ? '✅' : '⚠️ '} ${activePlans.length} plan(s) actif(s)`)
      if (individuelPlan) console.log('   ✅ Plan Individuel disponible')
      if (famillePlan) console.log('   ✅ Plan Famille disponible')
      if (!individuelPlan && !famillePlan) {
        console.log('   ⚠️  Aucun plan actif - La page utilisera le fallback localStorage')
      }
    }
  } catch (error: any) {
    results.push({
      check: 'Plans actifs',
      status: 'error',
      message: `❌ Erreur lors de la vérification des plans: ${error.message}`,
    })
    console.log(`   ❌ Erreur: ${error.message}`)
  }

  // Vérification 6: Vérifier les liens de paiement actifs
  console.log('\n6️⃣  Vérification des liens de paiement actifs...')
  try {
    const response = await fetch(`${BASE_URL}/api/subscription/payment-links`)
    const data = await response.json()

    if (response.ok && data.success && Array.isArray(data.data)) {
      const activeLinks = data.data.filter((link: any) => link.isActive)
      const individuelLink = activeLinks.find((l: any) => l.planType === 'individuel')
      const familleLink = activeLinks.find((l: any) => l.planType === 'famille')

      results.push({
        check: 'Liens de paiement actifs',
        status: activeLinks.length > 0 ? 'success' : 'warning',
        message:
          activeLinks.length > 0
            ? `✅ ${activeLinks.length} lien(s) de paiement actif(s)`
            : '⚠️  Aucun lien de paiement actif',
        details: {
          total: activeLinks.length,
          individuel: !!individuelLink,
          famille: !!familleLink,
        },
      })

      console.log(`   ${activeLinks.length > 0 ? '✅' : '⚠️ '} ${activeLinks.length} lien(s) de paiement actif(s)`)
      if (individuelLink) console.log(`   ✅ Lien Individuel: ${individuelLink.url.substring(0, 50)}...`)
      if (familleLink) console.log(`   ✅ Lien Famille: ${familleLink.url.substring(0, 50)}...`)
      if (!individuelLink && !familleLink) {
        console.log('   ⚠️  Aucun lien actif - La page utilisera le fallback SecureStorage')
      }
    }
  } catch (error: any) {
    results.push({
      check: 'Liens de paiement actifs',
      status: 'error',
      message: `❌ Erreur lors de la vérification des liens: ${error.message}`,
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
    console.log('   La page /subscription devrait fonctionner correctement.')
    console.log('\n📝 Prochaines étapes :')
    console.log('   1. Ouvrir http://localhost:3000/subscription dans votre navigateur')
    console.log('   2. Vérifier visuellement que les plans s\'affichent')
    console.log('   3. Tester les interactions (boutons, modals)')
    console.log('   4. Consulter TEST_PAGE_SUBSCRIPTION.md pour le guide complet')
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
    console.log('   La page utilisera le fallback vers localStorage/SecureStorage.')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Vérification terminée!')
  console.log('='.repeat(60) + '\n')

  // Code de sortie
  process.exit(errorCount > 0 ? 1 : 0)
}

// Exécuter la vérification
verifySubscriptionPage().catch((error) => {
  console.error('❌ Erreur fatale lors de la vérification:', error)
  process.exit(1)
})

