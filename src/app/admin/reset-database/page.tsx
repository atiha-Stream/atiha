'use client'

import { useState } from 'react'
import { userDatabase } from '@/lib/user-database'

export default function ResetDatabasePage() {
  const [isResetting, setIsResetting] = useState(false)
  const [message, setMessage] = useState('')

  const handleReset = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser la base de données ? Cela supprimera tous les utilisateurs existants.')) {
      return
    }

    setIsResetting(true)
    setMessage('')

    try {
      const result = userDatabase.forceResetDatabase()
      
      if (result.success) {
        setMessage('✅ Base de données réinitialisée avec succès ! Vous pouvez maintenant vous connecter avec admin@user.com / admin@user@2025')
      } else {
        setMessage(`❌ Erreur: ${result.message}`)
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔄 Réinitialisation de la Base de Données</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Attention</h2>
          <p className="text-gray-300 mb-4">
            Cette action va supprimer tous les utilisateurs existants et recréer l&apos;utilisateur admin avec le nouveau mot de passe.
          </p>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-300 mb-2">Nouveaux identifiants :</h3>
            <p className="text-blue-200">Email: <code className="bg-blue-900/50 px-2 py-1 rounded">admin@user.com</code></p>
            <p className="text-blue-200">Mot de passe: <code className="bg-blue-900/50 px-2 py-1 rounded">admin@user@2025</code></p>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isResetting ? '🔄 Réinitialisation...' : '🔄 Réinitialiser la Base de Données'}
        </button>

        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500/30 text-green-300' : 'bg-red-900/20 border border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center">
          <a 
            href="/login" 
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  )
}

