'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { 
  Bars3Icon, 
  XMarkIcon, 
  PlayIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  FilmIcon,
  TvIcon,
  HeartIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import HeaderStatusIndicator from './HeaderStatusIndicator'
import { HomepageContentService } from '@/lib/homepage-content-service'

interface ResponsiveNavigationProps {
  className?: string
}

export default function ResponsiveNavigation({ className = '' }: ResponsiveNavigationProps) {
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    closeMobileMenu()
  }

  return (
    <nav className={`bg-dark-200 border-b border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">{isClient ? content.appIdentity.name : 'Atiha'}</span>
            </Link>
            <HeaderStatusIndicator />
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Accueil</span>
                </Link>
                <Link 
                  href="/dashboard?tab=movies" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <FilmIcon className="w-4 h-4" />
                  <span>Films</span>
                </Link>
                <Link 
                  href="/dashboard?tab=series" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <TvIcon className="w-4 h-4" />
                  <span>Séries</span>
                </Link>
                <Link 
                  href="/dashboard?tab=watchlist" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <HeartIcon className="w-4 h-4" />
                  <span>Ma Liste</span>
                </Link>
                <Link 
                  href="/dashboard?tab=analytics" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Statistiques</span>
                </Link>
                <Link 
                  href="/download" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Télécharger</span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/download" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Télécharger</span>
                </Link>
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link 
                  href="/register" 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* User Menu Desktop */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-sm font-medium hidden sm:block">{user.email || 'Utilisateur'}</span>
              </div>
              <Link 
                href="/settings" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-300 rounded-lg mt-2">
              {user ? (
                <>
                  {/* User info */}
                  <div className="px-3 py-2 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.email || 'Utilisateur'}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation links */}
                  <Link 
                    href="/dashboard" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span>Accueil</span>
                  </Link>
                  <Link 
                    href="/dashboard?tab=movies" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <FilmIcon className="w-5 h-5" />
                    <span>Films</span>
                  </Link>
                  <Link 
                    href="/dashboard?tab=series" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <TvIcon className="w-5 h-5" />
                    <span>Séries</span>
                  </Link>
                  <Link 
                    href="/dashboard?tab=watchlist" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <HeartIcon className="w-5 h-5" />
                    <span>Ma Liste</span>
                  </Link>
                  <Link 
                    href="/dashboard?tab=analytics" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Statistiques</span>
                  </Link>
                  <Link 
                    href="/download" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Télécharger</span>
                  </Link>

                  {/* User actions */}
                  <div className="border-t border-gray-700 pt-2">
                    <Link 
                      href="/settings" 
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                      onClick={closeMobileMenu}
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      <span>Paramètres</span>
                    </Link>
                    <Link 
                      href="/download" 
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                      onClick={closeMobileMenu}
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      <span>Télécharger l&apos;app</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    href="/download" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                    onClick={closeMobileMenu}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Télécharger</span>
                  </Link>
                  <Link 
                    href="/login" 
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Connexion
                  </Link>
                  <Link 
                    href="/register" 
                    className="block px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors text-center"
                    onClick={closeMobileMenu}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
