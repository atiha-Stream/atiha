import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SimpleNetworkHandler } from '@/components/SimpleNetworkHandler'
import GeographicBlocker from '@/components/GeographicBlocker'
import PWAInstaller from '@/components/PWAInstaller'
import OfflineIndicator from '@/components/OfflineIndicator'
import PWAKeyboardShortcuts from '@/components/PWAKeyboardShortcuts'
import DynamicTitle from '@/components/DynamicTitle'
import SecureStorageInitializer from '@/components/SecureStorageInitializer'
import SkipLink from '@/components/SkipLink'
import { CardModalProvider } from '@/contexts/CardModalContext'
import CardModal from '@/components/CardModal'

export const metadata: Metadata = {
  title: 'Atiha - Streaming de Films et Séries',
  description: 'Découvrez et regardez vos films et séries préférés en streaming haute qualité',
  keywords: 'streaming, films, séries, vidéo, entertainment',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Atiha',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Atiha',
    title: 'Atiha - Streaming de Films et Séries',
    description: 'Découvrez et regardez vos films et séries préférés en streaming haute qualité',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atiha - Streaming de Films et Séries',
    description: 'Découvrez et regardez vos films et séries préférés en streaming haute qualité',
  },
  icons: {
    icon: '/icons/icon-192x192.svg',
    shortcut: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Atiha" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="192x192" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="512x512" href="/icons/icon-512x512.svg" />
      </head>
      <body className="antialiased">
        <SkipLink />
        <ErrorBoundary>
          <GeographicBlocker>
            <SimpleNetworkHandler>
              <AuthProvider>
                <CardModalProvider>
                <SecureStorageInitializer />
                <DynamicTitle />
                {children}
                  <CardModal />
                <PWAInstaller />
                <OfflineIndicator />
                <PWAKeyboardShortcuts />
                </CardModalProvider>
              </AuthProvider>
            </SimpleNetworkHandler>
          </GeographicBlocker>
        </ErrorBoundary>
      </body>
    </html>
  )
}
