'use client'

import React, { useState } from 'react'
import { logger } from '@/lib/logger'
import ResponsiveForm, { ResponsiveField, ResponsiveInput, ResponsiveButton, ResponsiveButtonGroup } from './ResponsiveForm'
import ResponsiveModal, { ResponsiveConfirmModal, useResponsiveModal } from './ResponsiveModal'
import ResponsiveTable, { ResponsiveCard } from './ResponsiveTable'
import ResponsiveVideoPlayer from './ResponsiveVideoPlayer'
import ResponsiveNavigation from './ResponsiveNavigation'
import { PlayIcon, UserIcon } from '@heroicons/react/24/outline'
export default function ResponsiveTest() {
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  // Modales
  const basicModal = useResponsiveModal()
  const confirmModal = useResponsiveModal()

  // Données de test
  const testData = [
    { id: 1, name: 'Film 1', year: 2024, rating: 8.5, genre: 'Action' },
    { id: 2, name: 'Film 2', year: 2023, rating: 7.8, genre: 'Comédie' },
    { id: 3, name: 'Film 3', year: 2024, rating: 9.2, genre: 'Drame' }
  ]

  const columns = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'year', label: 'Année', sortable: true },
    { key: 'rating', label: 'Note', sortable: true },
    { key: 'genre', label: 'Genre', sortable: true }
  ] as any

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    logger.debug('Form submitted', { formData })
  }

  const handleConfirm = () => {
    logger.debug('Confirmed!')
    confirmModal.closeModal()
  }

  return (
    <div className="min-h-screen bg-dark-100">
      {/* Navigation */}
      <ResponsiveNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Test de Responsivité</h1>

        {/* Grilles Responsives */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Grilles Responsives</h2>
          
          {/* Grille de contenu */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">Grille de Contenu</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-dark-200 rounded-lg p-4 border border-gray-700">
                  <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <PlayIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h4 className="text-white font-medium">Film {item}</h4>
                  <p className="text-gray-400 text-sm">2024</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grille de statistiques */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">Grille de Statistiques</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-dark-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary-500 mb-2">1,234</div>
                <div className="text-gray-400">Films</div>
              </div>
              <div className="bg-dark-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">567</div>
                <div className="text-gray-400">Séries</div>
              </div>
              <div className="bg-dark-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">89</div>
                <div className="text-gray-400">Utilisateurs</div>
              </div>
              <div className="bg-dark-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">45</div>
                <div className="text-gray-400">Genres</div>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaires Responsives */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Formulaires Responsives</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire simple */}
            <div className="bg-dark-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Formulaire Simple</h3>
              <ResponsiveForm onSubmit={handleFormSubmit}>
                <ResponsiveField label="Nom" required>
                  <ResponsiveInput
                    type="text"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    icon={<UserIcon className="w-5 h-5" />}
                  />
                </ResponsiveField>
                
                <ResponsiveField label="Email" required>
                  <ResponsiveInput
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </ResponsiveField>
                
                <ResponsiveField label="Message">
                  <textarea
                    className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Votre message..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </ResponsiveField>
                
                <ResponsiveButtonGroup>
                  <ResponsiveButton type="submit" variant="primary">
                    Envoyer
                  </ResponsiveButton>
                  <ResponsiveButton type="button" variant="secondary">
                    Annuler
                  </ResponsiveButton>
                </ResponsiveButtonGroup>
              </ResponsiveForm>
            </div>

            {/* Formulaire en grille */}
            <div className="bg-dark-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Formulaire en Grille</h3>
              <ResponsiveForm gridLayout>
                <ResponsiveField label="Prénom">
                  <ResponsiveInput type="text" placeholder="Prénom" />
                </ResponsiveField>
                
                <ResponsiveField label="Nom">
                  <ResponsiveInput type="text" placeholder="Nom" />
                </ResponsiveField>
                
                <ResponsiveField label="Email">
                  <ResponsiveInput type="email" placeholder="Email" />
                </ResponsiveField>
                
                <ResponsiveField label="Téléphone">
                  <ResponsiveInput type="tel" placeholder="Téléphone" />
                </ResponsiveField>
                
                <ResponsiveField label="Ville">
                  <ResponsiveInput type="text" placeholder="Ville" />
                </ResponsiveField>
                
                <ResponsiveField label="Code postal">
                  <ResponsiveInput type="text" placeholder="Code postal" />
                </ResponsiveField>
              </ResponsiveForm>
            </div>
          </div>
        </section>

        {/* Tableaux Responsives */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Tableaux Responsives</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tableau desktop */}
            <div className="hidden lg:block">
              <h3 className="text-lg font-medium text-white mb-4">Tableau Desktop</h3>
              <ResponsiveTable
                data={testData}
                columns={columns}
                searchable
                sortable
                actions={(item) => (
                  <button className="text-primary-400 hover:text-primary-300">
                    Voir
                  </button>
                )}
              />
            </div>

            {/* Cartes mobile */}
            <div className="lg:hidden">
              <h3 className="text-lg font-medium text-white mb-4">Cartes Mobile</h3>
              <ResponsiveCard
                data={testData}
                columns={columns}
                searchable
                actions={(item) => (
                  <button className="text-primary-400 hover:text-primary-300">
                    Voir
                  </button>
                )}
              />
            </div>
          </div>
        </section>

        {/* Lecteur Vidéo Responsive */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Lecteur Vidéo Responsive</h2>
          
          <div className="bg-dark-200 rounded-lg p-6">
            <ResponsiveVideoPlayer
              src="/sample-video.mp4"
              poster="/sample-poster.jpg"
              title="Vidéo de démonstration"
              className="w-full h-64 sm:h-80 lg:h-96"
            />
          </div>
        </section>

        {/* Modales Responsives */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Modales Responsives</h2>
          
          <div className="flex flex-wrap gap-4">
            <ResponsiveButton
              onClick={basicModal.openModal}
              variant="primary"
            >
              Ouvrir Modal
            </ResponsiveButton>
            
            <ResponsiveButton
              onClick={confirmModal.openModal}
              variant="danger"
            >
              Modal de Confirmation
            </ResponsiveButton>
          </div>

          {/* Modal basique */}
          <ResponsiveModal
            isOpen={basicModal.isOpen}
            onClose={basicModal.closeModal}
            title="Modal de Test"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                Ceci est une modal responsive qui s&apos;adapte à toutes les tailles d&apos;écran.
              </p>
              <div className="flex justify-end space-x-2">
                <ResponsiveButton
                  onClick={basicModal.closeModal}
                  variant="secondary"
                >
                  Fermer
                </ResponsiveButton>
              </div>
            </div>
          </ResponsiveModal>

          {/* Modal de confirmation */}
          <ResponsiveConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={confirmModal.closeModal}
            onConfirm={handleConfirm}
            title="Confirmer l&apos;action"
            message="Êtes-vous sûr de vouloir effectuer cette action ?"
            variant="danger"
          />
        </section>

        {/* Test de tailles d&apos;écran */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Test de Tailles d&apos;Écran</h2>
          
          <div className="bg-dark-200 rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="bg-primary-500 text-white p-4 rounded-lg text-center">
                <div className="font-bold">XS</div>
                <div className="text-sm">Mobile</div>
              </div>
              <div className="bg-green-500 text-white p-4 rounded-lg text-center">
                <div className="font-bold">SM</div>
                <div className="text-sm">Tablet</div>
              </div>
              <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
                <div className="font-bold">LG</div>
                <div className="text-sm">Desktop</div>
              </div>
              <div className="bg-purple-500 text-white p-4 rounded-lg text-center">
                <div className="font-bold">XL</div>
                <div className="text-sm">Large</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
