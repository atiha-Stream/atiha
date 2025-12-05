/**
 * Composant pour configurer l'authentification à deux facteurs (2FA)
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CSRFService } from '@/lib/csrf-service'
import { logger } from '@/lib/logger'

interface TwoFactorAuthSetupProps {
  isAdmin?: boolean
  onComplete?: () => void
}

export default function TwoFactorAuthSetup({ isAdmin = false, onComplete }: TwoFactorAuthSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    setError('')

    try {
      const csrfToken = CSRFService.getToken()
      const endpoint = isAdmin ? '/api/admin/2fa/setup' : '/api/2fa/setup'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ csrfToken }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la configuration')
      }

      setQrCodeUrl(data.qrCodeUrl)
      setBackupCodes(data.backupCodes)
      setStep('verify')
    } catch (error) {
      logger.error('Erreur lors de la configuration 2FA', error as Error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const csrfToken = CSRFService.getToken()
      const endpoint = isAdmin ? '/api/admin/2fa/verify' : '/api/2fa/verify'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, csrfToken }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Code invalide')
      }

      setStep('complete')
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification 2FA', error as Error)
      setError(error instanceof Error ? error.message : 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'setup') {
    return (
      <div className="bg-dark-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Activer l&apos;authentification à deux facteurs (2FA)
        </h3>
        <p className="text-gray-400 mb-6">
          La 2FA ajoute une couche de sécurité supplémentaire à votre compte.
          Vous devrez entrer un code depuis votre application d&apos;authentification
          à chaque connexion.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Configuration...' : 'Commencer la configuration'}
        </button>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="bg-dark-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Scanner le QR Code
        </h3>
        <p className="text-gray-400 mb-6">
          1. Ouvrez votre application d&apos;authentification (Google Authenticator, Authy, etc.)
          <br />
          2. Scannez ce QR code
          <br />
          3. Entrez le code à 6 chiffres affiché
        </p>

        {qrCodeUrl && (
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-lg">
              <Image
                src={qrCodeUrl}
                alt="QR Code 2FA"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 font-semibold mb-2">
              ⚠️ Codes de secours (à sauvegarder) :
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code
                  key={index}
                  className="bg-dark-300 text-yellow-300 p-2 rounded text-sm font-mono"
                >
                  {code}
                </code>
              ))}
            </div>
            <p className="text-yellow-400 text-sm mt-2">
              Sauvegardez ces codes dans un endroit sûr. Vous en aurez besoin
              si vous perdez l&apos;accès à votre application d&apos;authentification.
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-white font-semibold mb-2">
            Code à 6 chiffres
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(value)
            }}
            placeholder="000000"
            maxLength={6}
            className="w-full bg-dark-300 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none text-center text-2xl tracking-widest font-mono"
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Vérification...' : 'Vérifier et activer'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
      <h3 className="text-xl font-bold text-green-400 mb-2">
        ✅ 2FA activé avec succès !
      </h3>
      <p className="text-gray-300">
        Votre compte est maintenant protégé par l&apos;authentification à deux facteurs.
        Vous devrez entrer un code à chaque connexion.
      </p>
    </div>
  )
}

