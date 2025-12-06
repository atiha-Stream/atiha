/**
 * Script d'export des données d'abonnement depuis localStorage vers un fichier JSON
 * 
 * Ce script doit être exécuté côté client (navigateur) pour exporter les données
 * depuis localStorage vers un fichier JSON qui peut ensuite être utilisé pour la migration
 * 
 * Usage: 
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script dans la console
 * 3. Exécuter: exportSubscriptionData()
 * 4. Télécharger le fichier JSON généré
 * 5. Placer le fichier dans data/subscription-export.json
 * 6. Exécuter: npm run migrate:subscription-data
 */

function exportSubscriptionData() {
  console.log('📤 Export des données d\'abonnement depuis localStorage...\n')

  const exportData: any = {}

  try {
    // 1. Exporter les plans d'abonnement
    console.log('📋 Export des plans d\'abonnement...')
    const savedPlans = localStorage.getItem('atiha_subscription_plans')
    if (savedPlans) {
      exportData.plans = JSON.parse(savedPlans)
      console.log('   ✅ Plans exportés')
    } else {
      console.log('   ℹ️  Aucun plan trouvé dans localStorage')
    }

    // 2. Exporter les liens de paiement
    console.log('\n🔗 Export des liens de paiement...')
    try {
      // Essayer SecureStorage d'abord
      let paymentLinks: any = null
      let paymentLinksActive: any = null
      
      if (typeof (window as any).SecureStorage !== 'undefined') {
        paymentLinks = (window as any).SecureStorage.getItemJSON('atiha_payment_links')
        paymentLinksActive = (window as any).SecureStorage.getItemJSON('atiha_payment_links_active')
      } else {
        const linksStr = localStorage.getItem('atiha_payment_links')
        const activeStr = localStorage.getItem('atiha_payment_links_active')
        if (linksStr) paymentLinks = JSON.parse(linksStr)
        if (activeStr) paymentLinksActive = JSON.parse(activeStr)
      }

      if (paymentLinks) {
        exportData.paymentLinks = paymentLinks
        exportData.paymentLinksActive = paymentLinksActive || {}
        console.log('   ✅ Liens de paiement exportés')
      } else {
        console.log('   ℹ️  Aucun lien de paiement trouvé')
      }
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'export des liens: ${error}`)
    }

    // 3. Exporter les liens après paiement
    console.log('\n🔗 Export des liens après paiement...')
    try {
      let postPaymentLinks: any = null
      let postPaymentLinksActive: any = null
      
      if (typeof (window as any).SecureStorage !== 'undefined') {
        postPaymentLinks = (window as any).SecureStorage.getItemJSON('atiha_post_payment_links')
        postPaymentLinksActive = (window as any).SecureStorage.getItemJSON('atiha_post_payment_links_active')
      } else {
        const linksStr = localStorage.getItem('atiha_post_payment_links')
        const activeStr = localStorage.getItem('atiha_post_payment_links_active')
        if (linksStr) postPaymentLinks = JSON.parse(linksStr)
        if (activeStr) postPaymentLinksActive = JSON.parse(activeStr)
      }

      if (postPaymentLinks) {
        exportData.postPaymentLinks = postPaymentLinks
        exportData.postPaymentLinksActive = postPaymentLinksActive || {}
        console.log('   ✅ Liens après paiement exportés')
      } else {
        console.log('   ℹ️  Aucun lien après paiement trouvé')
      }
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'export des liens: ${error}`)
    }

    // 4. Exporter le prix d'abonnement
    console.log('\n💰 Export du prix d\'abonnement...')
    const savedPrice = localStorage.getItem('atiha_subscription_price')
    if (savedPrice) {
      exportData.subscriptionPrice = JSON.parse(savedPrice)
      console.log('   ✅ Prix d\'abonnement exporté')
    } else {
      console.log('   ℹ️  Aucun prix d\'abonnement trouvé')
    }

    // Générer le JSON
    const jsonData = JSON.stringify(exportData, null, 2)
    
    // Créer un blob et télécharger
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscription-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('\n✅ Export terminé!')
    console.log('📁 Fichier téléchargé: subscription-export.json')
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Placer le fichier dans data/subscription-export.json')
    console.log('   2. Exécuter: npm run migrate:subscription-data')

    return exportData
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error)
    throw error
  }
}

// Exposer la fonction globalement si dans un navigateur
if (typeof window !== 'undefined') {
  (window as any).exportSubscriptionData = exportSubscriptionData
  console.log('💡 Pour exporter les données, exécutez: exportSubscriptionData()')
}

export default exportSubscriptionData

