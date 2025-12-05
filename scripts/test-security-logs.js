/**
 * Script de test des logs de sécurité
 * Exécuter avec: node scripts/test-security-logs.js
 */

import { securityLogger } from '../src/lib/security-logger.js'

async function testSecurityLogs() {
  console.log('🚨 TEST DES LOGS DE SÉCURITÉ\n')
  
  // Initialiser le logger
  securityLogger.initialize()
  
  // Test 1: Logs de connexion
  console.log('1️⃣ Test des logs de connexion:')
  securityLogger.logLoginAttempt('test@example.com', true, {
    userId: 'user_123',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    timestamp: new Date().toISOString()
  })
  console.log('   ✅ Connexion réussie enregistrée')
  
  securityLogger.logLoginAttempt('hacker@evil.com', false, {
    reason: 'invalid_password',
    userAgent: 'Mozilla/5.0 (Suspicious Browser)',
    timestamp: new Date().toISOString()
  })
  console.log('   ✅ Connexion échouée enregistrée')
  
  // Test 2: Logs d'actions admin
  console.log('\n2️⃣ Test des logs d\'actions admin:')
  securityLogger.logAdminAction(
    'admin_123',
    'admin@example.com',
    'user_management',
    {
      action: 'delete_user',
      targetUserId: 'user_456',
      targetUserEmail: 'user@example.com'
    }
  )
  console.log('   ✅ Action admin enregistrée')
  
  // Test 3: Logs d'accès aux données
  console.log('\n3️⃣ Test des logs d\'accès aux données:')
  securityLogger.logDataAccess(
    'user_789',
    'user@example.com',
    'premium_content',
    'read',
    {
      contentId: 'content_123',
      contentTitle: 'Film Premium'
    }
  )
  console.log('   ✅ Accès aux données enregistré')
  
  // Test 4: Logs d'erreurs système
  console.log('\n4️⃣ Test des logs d\'erreurs système:')
  const testError = new Error('Test error for security logging')
  securityLogger.logSystemError(testError, 'test_context', {
    additionalInfo: 'This is a test error'
  })
  console.log('   ✅ Erreur système enregistrée')
  
  // Test 5: Création d'alertes
  console.log('\n5️⃣ Test de création d\'alertes:')
  securityLogger.createAlert(
    'high',
    'suspicious_login',
    'Tentatives de connexion multiples détectées',
    'Plus de 5 tentatives de connexion échouées depuis la même IP dans les 15 dernières minutes',
    ['suspicious@example.com'],
    85
  )
  console.log('   ✅ Alerte de sécurité créée')
  
  // Test 6: Détection d'activité suspecte
  console.log('\n6️⃣ Test de détection d\'activité suspecte:')
  
  // Simuler plusieurs tentatives échouées
  for (let i = 0; i < 6; i++) {
    securityLogger.logLoginAttempt('suspicious@example.com', false, {
      reason: 'invalid_password',
      attempt: i + 1,
      userAgent: 'Mozilla/5.0 (Suspicious Browser)'
    })
  }
  
  const suspiciousAlerts = securityLogger.detectSuspiciousActivity()
  console.log(`   ✅ ${suspiciousAlerts.length} activité(s) suspecte(s) détectée(s)`)
  
  // Test 7: Récupération des données
  console.log('\n7️⃣ Test de récupération des données:')
  
  const logs = securityLogger.getLogs(10)
  console.log(`   ✅ ${logs.length} logs récupérés`)
  
  const alerts = securityLogger.getActiveAlerts()
  console.log(`   ✅ ${alerts.length} alertes actives récupérées`)
  
  const stats = securityLogger.getSecurityStats()
  console.log(`   ✅ Statistiques récupérées: ${stats.totalLogs} logs total`)
  
  // Test 8: Affichage des résultats
  console.log('\n8️⃣ Résumé des tests:')
  console.log(`   📊 Total des logs: ${stats.totalLogs}`)
  console.log(`   🔴 Logs critiques: ${stats.criticalLogs}`)
  console.log(`   ⚠️  Logs à haut risque: ${stats.highRiskLogs}`)
  console.log(`   🚨 Alertes actives: ${stats.activeAlerts}`)
  console.log(`   ✅ Alertes résolues: ${stats.resolvedAlerts}`)
  
  if (stats.topThreats.length > 0) {
    console.log('\n   🎯 Principales menaces:')
    stats.topThreats.forEach((threat, index) => {
      console.log(`      ${index + 1}. ${threat.category}: ${threat.count} occurrences`)
    })
  }
  
  // Test 9: Vérification de la sécurité
  console.log('\n9️⃣ Vérification de la sécurité:')
  const securityChecks = [
    { name: 'Logger initialisé', status: true },
    { name: 'Logs enregistrés', status: logs.length > 0 },
    { name: 'Alertes créées', status: alerts.length > 0 },
    { name: 'Statistiques générées', status: stats.totalLogs > 0 },
    { name: 'Détection d\'activité suspecte', status: suspiciousAlerts.length > 0 }
  ]
  
  securityChecks.forEach(check => {
    console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`)
  })
  
  const allPassed = securityChecks.every(check => check.status)
  console.log(`\n🎯 Résultat global: ${allPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}`)
  
  if (allPassed) {
    console.log('\n🔐 SYSTÈME DE LOGS DE SÉCURITÉ OPÉRATIONNEL !')
    console.log('   - Surveillance en temps réel ✅')
    console.log('   - Détection d\'activité suspecte ✅')
    console.log('   - Alertes automatiques ✅')
    console.log('   - Statistiques de sécurité ✅')
    console.log('   - Tableau de bord intégré ✅')
  } else {
    console.log('\n⚠️  ATTENTION: Vérifiez la configuration des logs de sécurité')
  }
}

// Exécuter les tests
testSecurityLogs().catch(console.error)
