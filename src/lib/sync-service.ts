'use client'

/**
 * Service de synchronisation bidirectionnelle localStorage ↔ PostgreSQL
 * 
 * Stratégie :
 * 1. Chargement : PostgreSQL (via API) → Cache localStorage
 * 2. Modification : localStorage immédiat → Sync PostgreSQL en arrière-plan
 * 3. Mode offline : Queue des modifications → Sync au retour en ligne
 * 4. Synchronisation périodique : Toutes les 30 secondes
 */

import { logger } from './logger'

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  data: any
  timestamp: number
  retries: number
}

export interface SyncConfig {
  cacheKey: string
  apiEndpoint: string
  syncInterval?: number // en millisecondes (défaut: 30000 = 30s)
  maxRetries?: number // nombre max de tentatives (défaut: 3)
}

class SyncService {
  private static readonly QUEUE_KEY = 'atiha_sync_queue'
  private static readonly LAST_SYNC_KEY = 'atiha_last_sync'
  private static readonly DEFAULT_SYNC_INTERVAL = 30000 // 30 secondes
  private static readonly DEFAULT_MAX_RETRIES = 3
  private static syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  private static isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true

  /**
   * Initialiser le service de synchronisation
   */
  static init() {
    if (typeof window === 'undefined') return

    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      this.isOnline = true
      logger.info('Connexion rétablie, synchronisation des données en attente...')
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      logger.warn('Connexion perdue, mode offline activé')
    })

    // Traiter la queue au démarrage
    this.processSyncQueue()
  }

  /**
   * Charger les données depuis PostgreSQL avec cache localStorage
   */
  static async load<T>(config: SyncConfig): Promise<T[]> {
    if (typeof window === 'undefined') return []

    try {
      // 1. Essayer de charger depuis PostgreSQL
      const response = await fetch(config.apiEndpoint)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur API')
      }

      const data = result.data || result[Object.keys(result).find(k => k !== 'success')] || []

      // 2. Mettre à jour le cache localStorage
      this.setCache(config.cacheKey, data)
      this.setLastSync(config.cacheKey, Date.now())

      logger.debug(`Données chargées depuis PostgreSQL et mises en cache`, {
        endpoint: config.apiEndpoint,
        count: Array.isArray(data) ? data.length : 1
      })

      return Array.isArray(data) ? data : [data]
    } catch (error) {
      logger.warn(`Erreur lors du chargement depuis PostgreSQL, utilisation du cache`, {
        endpoint: config.apiEndpoint,
        error: error instanceof Error ? error.message : String(error)
      })

      // 3. Fallback : charger depuis le cache localStorage
      return this.getCache<T>(config.cacheKey)
    }
  }

  /**
   * Sauvegarder les données (localStorage immédiat + sync PostgreSQL en arrière-plan)
   */
  static async save<T>(
    config: SyncConfig,
    data: T[],
    operation?: SyncOperation
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      // 1. Sauvegarder immédiatement dans localStorage (UX rapide)
      this.setCache(config.cacheKey, data)

      // 2. Synchroniser avec PostgreSQL en arrière-plan
      if (this.isOnline) {
        // Si une opération spécifique est fournie, l'utiliser
        if (operation) {
          await this.syncOperation(operation, config)
        } else {
          // Sinon, synchroniser toutes les données
          await this.syncAll(config, data)
        }
      } else {
        // Mode offline : ajouter à la queue
        if (operation) {
          this.addToQueue(operation)
        }
        logger.warn('Mode offline, opération ajoutée à la queue de synchronisation')
      }

      return true
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde', error as Error)
      
      // En cas d'erreur, les données restent dans localStorage
      if (operation) {
        this.addToQueue(operation)
      }
      
      return false
    }
  }

  /**
   * Créer une opération de synchronisation
   */
  static createOperation(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ): SyncOperation {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0
    }
  }

  /**
   * Synchroniser une opération spécifique
   */
  private static async syncOperation(operation: SyncOperation, config: SyncConfig): Promise<void> {
    try {
      const method = operation.type === 'delete' ? 'DELETE' : 'POST'
      const url = operation.type === 'delete' 
        ? `${operation.endpoint}?${new URLSearchParams(operation.data).toString()}`
        : operation.endpoint

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: method !== 'DELETE' ? JSON.stringify(operation.data) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur API')
      }

      logger.debug(`Opération synchronisée avec succès`, {
        type: operation.type,
        endpoint: operation.endpoint
      })
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation de l'opération`, error as Error)
      
      // Ajouter à la queue pour réessayer plus tard
      if (operation.retries < (config.maxRetries || this.DEFAULT_MAX_RETRIES)) {
        operation.retries++
        this.addToQueue(operation)
      } else {
        logger.error(`Opération abandonnée après ${operation.retries} tentatives`, {
          operation: operation.id
        })
      }
      
      throw error
    }
  }

  /**
   * Synchroniser toutes les données
   */
  private static async syncAll<T>(config: SyncConfig, data: T[]): Promise<void> {
    // Pour la synchronisation complète, on recharge depuis le serveur
    // Cela garantit que les données sont à jour
    await this.load(config)
  }

  /**
   * Démarrer la synchronisation périodique
   */
  static startPeriodicSync(config: SyncConfig): void {
    if (typeof window === 'undefined') return

    // Arrêter la synchronisation existante si elle existe
    this.stopPeriodicSync(config.cacheKey)

    const interval = config.syncInterval || this.DEFAULT_SYNC_INTERVAL

    const syncInterval = setInterval(async () => {
      if (this.isOnline) {
        try {
          await this.load(config)
          logger.debug(`Synchronisation périodique réussie`, {
            cacheKey: config.cacheKey
          })
        } catch (error) {
          logger.warn(`Erreur lors de la synchronisation périodique`, {
            cacheKey: config.cacheKey,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }, interval)

    this.syncIntervals.set(config.cacheKey, syncInterval)
    logger.info(`Synchronisation périodique démarrée`, {
      cacheKey: config.cacheKey,
      interval: `${interval / 1000}s`
    })
  }

  /**
   * Arrêter la synchronisation périodique
   */
  static stopPeriodicSync(cacheKey: string): void {
    const interval = this.syncIntervals.get(cacheKey)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(cacheKey)
      logger.debug(`Synchronisation périodique arrêtée`, { cacheKey })
    }
  }

  /**
   * Traiter la queue de synchronisation
   */
  static async processSyncQueue(): Promise<void> {
    if (typeof window === 'undefined' || !this.isOnline) return

    const queue = this.getQueue()
    
    if (queue.length === 0) {
      return
    }

    logger.info(`Traitement de la queue de synchronisation`, { count: queue.length })

    const processed: string[] = []
    const failed: SyncOperation[] = []

    for (const operation of queue) {
      try {
        // Créer une config temporaire pour cette opération
        const config: SyncConfig = {
          cacheKey: '', // Pas nécessaire pour une opération unique
          apiEndpoint: operation.endpoint,
          maxRetries: this.DEFAULT_MAX_RETRIES
        }

        await this.syncOperation(operation, config)
        processed.push(operation.id)
      } catch (error) {
        if (operation.retries < this.DEFAULT_MAX_RETRIES) {
          operation.retries++
          failed.push(operation)
        } else {
          logger.error(`Opération abandonnée après ${operation.retries} tentatives`, {
            operation: operation.id
          })
          processed.push(operation.id) // Retirer même si échouée
        }
      }
    }

    // Mettre à jour la queue
    this.setQueue(failed)

    if (processed.length > 0) {
      logger.info(`Queue traitée`, {
        processed: processed.length,
        failed: failed.length
      })
    }
  }

  /**
   * Gestion du cache localStorage
   */
  private static getCache<T>(key: string): T[] {
    if (typeof window === 'undefined') return []
    
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      logger.error(`Erreur lors de la lecture du cache`, error as Error)
    }
    
    return []
  }

  private static setCache<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      logger.error(`Erreur lors de l'écriture du cache`, error as Error)
    }
  }

  private static setLastSync(key: string, timestamp: number): void {
    if (typeof window === 'undefined') return
    
    try {
      const lastSync = this.getLastSync()
      lastSync[key] = timestamp
      localStorage.setItem(this.LAST_SYNC_KEY, JSON.stringify(lastSync))
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde du timestamp de synchronisation`, error as Error)
    }
  }

  private static getLastSync(): Record<string, number> {
    if (typeof window === 'undefined') return {}
    
    try {
      const cached = localStorage.getItem(this.LAST_SYNC_KEY)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      logger.error(`Erreur lors de la lecture du timestamp de synchronisation`, error as Error)
    }
    
    return {}
  }

  /**
   * Gestion de la queue de synchronisation
   */
  private static getQueue(): SyncOperation[] {
    if (typeof window === 'undefined') return []
    
    try {
      const queue = localStorage.getItem(this.QUEUE_KEY)
      if (queue) {
        return JSON.parse(queue)
      }
    } catch (error) {
      logger.error(`Erreur lors de la lecture de la queue`, error as Error)
    }
    
    return []
  }

  private static setQueue(queue: SyncOperation[]): void {
    if (typeof window === 'undefined') return
    
    try {
      if (queue.length === 0) {
        localStorage.removeItem(this.QUEUE_KEY)
      } else {
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
      }
    } catch (error) {
      logger.error(`Erreur lors de l'écriture de la queue`, error as Error)
    }
  }

  private static addToQueue(operation: SyncOperation): void {
    const queue = this.getQueue()
    queue.push(operation)
    this.setQueue(queue)
  }

  /**
   * Vérifier si les données sont synchronisées
   */
  static isSynced(cacheKey: string, maxAge: number = 60000): boolean {
    const lastSync = this.getLastSync()
    const timestamp = lastSync[cacheKey]
    
    if (!timestamp) {
      return false
    }
    
    return (Date.now() - timestamp) < maxAge
  }

  /**
   * Forcer la synchronisation
   */
  static async forceSync(config: SyncConfig): Promise<void> {
    await this.load(config)
    await this.processSyncQueue()
  }
}

// Initialiser le service au chargement
if (typeof window !== 'undefined') {
  SyncService.init()
}

export default SyncService

