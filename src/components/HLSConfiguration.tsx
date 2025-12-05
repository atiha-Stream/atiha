'use client'

import React, { useState, useEffect } from 'react'
import { HLSTranscoderService, HLSStreamingConfig } from '@/lib/hls-transcoder-service'
import { logger } from '@/lib/logger'

interface HLSConfigurationProps {
  onConfigChange?: (config: HLSStreamingConfig) => void
  initialConfig?: Partial<HLSStreamingConfig>
}

export const HLSConfiguration: React.FC<HLSConfigurationProps> = ({
  onConfigChange,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<HLSStreamingConfig>({
    serverUrl: 'http://localhost',
    port: 8080,
    outputDir: './data/hls',
    quality: 'auto',
    preset: 'fast',
    ...initialConfig
  })

  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Tester la connexion au serveur HLS
  const testConnection = async () => {
    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const isHealthy = await HLSTranscoderService.checkServerHealth(config)
      setIsServerHealthy(isHealthy)
      
      if (isHealthy) {
        setTestResult('✅ Connexion au serveur HLS réussie')
      } else {
        setTestResult('❌ Serveur HLS non accessible')
      }
    } catch (error) {
      setIsServerHealthy(false)
      setTestResult(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Tester le transcodage avec une URL d'exemple
  const testTranscoding = async () => {
    setIsTestingConnection(true)
    setTestResult(null)

    try {
      // URL d'exemple (vidéo de test)
      const testUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      
      const result = await HLSTranscoderService.startTranscoding(testUrl, config)
      
      if (result.success) {
        setTestResult('✅ Test de transcodage réussi')
        logger.debug('URL HLS générée', { url: result.masterPlaylistUrl })
      } else {
        setTestResult(`❌ Échec du transcodage: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Erreur de test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Mettre à jour la configuration
  const updateConfig = (updates: Partial<HLSStreamingConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  // Charger la configuration depuis l'environnement
  useEffect(() => {
    const loadEnvConfig = () => {
      const envConfig: Partial<HLSStreamingConfig> = {}
      
      if (process.env.NEXT_PUBLIC_HLS_SERVER_URL) {
        envConfig.serverUrl = process.env.NEXT_PUBLIC_HLS_SERVER_URL
      }
      
      if (process.env.NEXT_PUBLIC_HLS_PORT) {
        envConfig.port = parseInt(process.env.NEXT_PUBLIC_HLS_PORT)
      }
      
      if (process.env.NEXT_PUBLIC_HLS_QUALITY) {
        envConfig.quality = process.env.NEXT_PUBLIC_HLS_QUALITY as any
      }
      
      if (process.env.NEXT_PUBLIC_HLS_PRESET) {
        envConfig.preset = process.env.NEXT_PUBLIC_HLS_PRESET as any
      }
      
      if (Object.keys(envConfig).length > 0) {
        updateConfig(envConfig)
      }
    }

    loadEnvConfig()
  }, [])

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
        <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          🎬
        </span>
        Configuration HLS Transcoder
      </h3>

      <div className="space-y-4">
        {/* URL du serveur */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            URL du serveur HLS
          </label>
          <input
            type="text"
            value={config.serverUrl}
            onChange={(e) => updateConfig({ serverUrl: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="http://localhost"
          />
        </div>

        {/* Port */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Port
          </label>
          <input
            type="number"
            value={config.port}
            onChange={(e) => updateConfig({ port: parseInt(e.target.value) || 8080 })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="8080"
            min="1"
            max="65535"
          />
        </div>

        {/* Qualité */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Qualité par défaut
          </label>
          <select
            value={config.quality}
            onChange={(e) => updateConfig({ quality: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="auto">Auto (adaptatif)</option>
            <option value="240p">240p</option>
            <option value="360p">360p</option>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>

        {/* Preset FFmpeg */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Preset FFmpeg
          </label>
          <select
            value={config.preset}
            onChange={(e) => updateConfig({ preset: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ultrafast">Ultra Fast (qualité moindre)</option>
            <option value="fast">Fast (équilibré)</option>
            <option value="medium">Medium (qualité élevée)</option>
            <option value="slow">Slow (qualité maximale)</option>
          </select>
        </div>

        {/* Répertoire de sortie */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Répertoire de sortie
          </label>
          <input
            type="text"
            value={config.outputDir}
            onChange={(e) => updateConfig({ outputDir: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="./data/hls"
          />
        </div>

        {/* Statut du serveur */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center">
            <span className="text-gray-300 text-sm font-medium mr-3">Statut du serveur:</span>
            {isServerHealthy === null && (
              <span className="text-gray-400 text-sm">Non testé</span>
            )}
            {isServerHealthy === true && (
              <span className="text-green-400 text-sm flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                En ligne
              </span>
            )}
            {isServerHealthy === false && (
              <span className="text-red-400 text-sm flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Hors ligne
              </span>
            )}
          </div>
          
          <button
            onClick={testConnection}
            disabled={isTestingConnection}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingConnection ? 'Test...' : 'Tester'}
          </button>
        </div>

        {/* Résultat du test */}
        {testResult && (
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm">{testResult}</p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={testTranscoding}
            disabled={isTestingConnection}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingConnection ? 'Test en cours...' : 'Tester le transcodage'}
          </button>
          
          <button
            onClick={() => {
              const defaultConfig = HLSTranscoderService.getConfigForEnvironment('development')
              updateConfig(defaultConfig)
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Réinitialiser
          </button>
        </div>

        {/* Informations utiles */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-400 font-medium mb-2">💡 Informations</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Le serveur HLS doit être démarré avant d&apos;utiliser cette fonctionnalité</li>
            <li>• URL de test: <code className="bg-gray-700 px-1 rounded">{config.serverUrl}:{config.port}/player/</code></li>
            <li>• API de transcodage: <code className="bg-gray-700 px-1 rounded">{config.serverUrl}:{config.port}/index.m3u8?source_url=&lt;URL_VIDEO&gt;</code></li>
            <li>• Formats supportés: MP4, MKV, AVI, MOV, WMV, FLV, WebM</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HLSConfiguration
