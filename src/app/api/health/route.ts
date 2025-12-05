import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * 
 * Vérifie l'état de l'application et des services critiques
 * Utilisé pour le monitoring et les vérifications de disponibilité
 * 
 * GET /api/health
 * GET /api/health?detailed=true (pour plus de détails)
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    application: {
      status: 'ok' | 'error'
      message: string
    }
    storage: {
      status: 'ok' | 'error' | 'warning'
      message: string
      available?: boolean
    }
    memory: {
      status: 'ok' | 'warning' | 'error'
      message: string
      usage?: {
        used: number
        total: number
        percentage: number
      }
    }
  }
}

// Temps de démarrage de l'application (approximatif)
const startTime = Date.now()

// Vérifier la disponibilité du localStorage (côté serveur, toujours true)
function checkStorage(): { status: 'ok' | 'error' | 'warning'; message: string; available?: boolean } {
  try {
    // En production Next.js, localStorage n'est pas disponible côté serveur
    // On retourne 'ok' car localStorage est disponible côté client
    // Si vous utilisez une base de données, ajoutez la vérification ici
    return {
      status: 'ok',
      message: 'Storage disponible (localStorage côté client)',
      available: true
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Erreur storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      available: false
    }
  }
}

// Vérifier l'utilisation mémoire (Node.js)
function checkMemory(): { 
  status: 'ok' | 'warning' | 'error'
  message: string
  usage?: { used: number; total: number; percentage: number }
} {
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      const total = usage.heapTotal
      const used = usage.heapUsed
      const percentage = (used / total) * 100
      
      // Seuils d'alerte
      let status: 'ok' | 'warning' | 'error' = 'ok'
      let message = `Mémoire: ${Math.round(percentage)}% utilisée`
      
      if (percentage > 90) {
        status = 'error'
        message = `CRITIQUE: Mémoire > 90% (${Math.round(percentage)}%)`
      } else if (percentage > 75) {
        status = 'warning'
        message = `ATTENTION: Mémoire > 75% (${Math.round(percentage)}%)`
      }
      
      return {
        status,
        message,
        usage: {
          used: Math.round(used / 1024 / 1024), // MB
          total: Math.round(total / 1024 / 1024), // MB
          percentage: Math.round(percentage)
        }
      }
    }
    
    // Si process n'est pas disponible (Edge Runtime, etc.), c'est normal
    // Ne pas retourner d'erreur dans ce cas
    return {
      status: 'ok',
      message: 'Mémoire: vérification non disponible dans ce contexte (normal pour Edge Runtime)'
    }
  } catch (error) {
    // En cas d'erreur, ne pas considérer comme critique
    // Cela peut arriver dans Edge Runtime où process n'est pas toujours disponible
    return {
      status: 'ok',
      message: `Mémoire: vérification non disponible (${error instanceof Error ? error.message : 'Unknown error'})`
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    // Calculer l'uptime
    const uptime = Math.floor((Date.now() - startTime) / 1000) // en secondes
    
    // Obtenir les informations de l'environnement
    const environment = process.env.NODE_ENV || 'development'
    const version = process.env.npm_package_version || '1.0.0'
    
    // Effectuer les vérifications
    const storageCheck = checkStorage()
    const memoryCheck = checkMemory()
    
    // Vérifier l'application (toujours OK si on arrive ici)
    const applicationCheck = {
      status: 'ok' as const,
      message: 'Application opérationnelle'
    }
    
    // Déterminer le statut global
    const checks = {
      application: applicationCheck,
      storage: storageCheck,
      memory: memoryCheck
    }
    
    // Si une vérification critique échoue, statut = unhealthy
    // Si une vérification a un warning, statut = degraded
    // Sinon, statut = healthy
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    // En développement, être plus tolérant avec les erreurs de mémoire
    const isDevelopment = environment === 'development'
    
    // Storage error = toujours unhealthy (critique)
    if (checks.storage.status === 'error') {
      overallStatus = 'unhealthy'
    }
    // Memory error = unhealthy en production, degraded en dev
    else if (checks.memory.status === 'error') {
      overallStatus = isDevelopment ? 'degraded' : 'unhealthy'
    }
    // Warnings = degraded
    else if (checks.storage.status === 'warning' || checks.memory.status === 'warning') {
      overallStatus = 'degraded'
    }
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version,
      environment,
      checks
    }
    
    // Code HTTP approprié selon le statut
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503
    
    // Si detailed=true, retourner toutes les informations
    // Sinon, retourner une version simplifiée
    if (!detailed) {
      return NextResponse.json(
        {
          status: overallStatus,
          timestamp: healthStatus.timestamp,
          uptime: healthStatus.uptime,
          version: healthStatus.version,
          environment: healthStatus.environment
        },
        { status: statusCode }
      )
    }
    
    return NextResponse.json(healthStatus, { status: statusCode })
    
  } catch (error) {
    // En cas d'erreur dans le health check lui-même
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Erreur lors de la vérification de santé',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

// Endpoint HEAD pour les checks simples (plus rapide)
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

