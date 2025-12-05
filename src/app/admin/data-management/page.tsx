'use client'

import React from 'react'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import DataManagement from '@/components/DataManagement'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function AdminDataManagementPage() {
  const router = useRouter()

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-800">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-1.5 sm:space-x-2 text-gray-400 hover:text-white transition-colors text-base sm:text-lg min-h-[44px] sm:min-h-0"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Retour</span>
              </button>
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <DocumentArrowDownIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Données</span>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            <DataManagement />
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  )
}


