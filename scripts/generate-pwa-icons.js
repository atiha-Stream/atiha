#!/usr/bin/env node

/**
 * Script de génération des icônes PWA pour Atiha
 * Génère toutes les tailles d'icônes nécessaires
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration des icônes
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
]

// SVG de base pour l'icône Atiha
const ATIHA_ICON_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="play" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  
  <!-- Play button -->
  <g transform="translate(128, 128)">
    <circle cx="128" cy="128" r="120" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
    <polygon points="100,80 100,176 200,128" fill="url(#play)"/>
  </g>
  
  <!-- Text "A" -->
  <text x="256" y="400" font-family="Arial, sans-serif" font-size="120" font-weight="bold" text-anchor="middle" fill="white">A</text>
</svg>
`

// Fonction pour créer un PNG à partir du SVG (simulation)
function createIconPNG(size, filename) {
  // En réalité, vous devriez utiliser une bibliothèque comme sharp ou canvas
  // Pour ce script, on va créer des fichiers SVG temporaires
  const svgContent = ATIHA_ICON_SVG.replace('width="512"', `width="${size}"`).replace('height="512"', `height="${size}"`)
  
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  
  const svgPath = path.join(iconsDir, filename.replace('.png', '.svg'))
  fs.writeFileSync(svgPath, svgContent)
  
  console.log(`✅ Icône générée: ${filename} (${size}x${size})`)
}

// Fonction pour créer les raccourcis
function createShortcutIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')
  
  // Icône Films
  const filmsSVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="16" fill="#1e40af"/>
  <rect x="20" y="20" width="56" height="40" rx="4" fill="rgba(255,255,255,0.1)"/>
  <polygon points="36,32 36,48 52,40" fill="white"/>
  <text x="48" y="75" font-family="Arial" font-size="12" text-anchor="middle" fill="white">FILMS</text>
</svg>`
  
  // Icône Séries
  const seriesSVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="16" fill="#059669"/>
  <rect x="20" y="20" width="56" height="40" rx="4" fill="rgba(255,255,255,0.1)"/>
  <rect x="32" y="28" width="8" height="24" fill="white"/>
  <rect x="44" y="28" width="8" height="24" fill="white"/>
  <rect x="56" y="28" width="8" height="24" fill="white"/>
  <text x="48" y="75" font-family="Arial" font-size="12" text-anchor="middle" fill="white">SÉRIES</text>
</svg>`
  
  // Icône Profil
  const profileSVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="16" fill="#7c3aed"/>
  <circle cx="48" cy="32" r="12" fill="rgba(255,255,255,0.1)"/>
  <path d="M24 72 Q24 60 36 60 L60 60 Q72 60 72 72 L72 80 L24 80 Z" fill="rgba(255,255,255,0.1)"/>
  <text x="48" y="90" font-family="Arial" font-size="10" text-anchor="middle" fill="white">PROFIL</text>
</svg>`
  
  fs.writeFileSync(path.join(iconsDir, 'shortcut-films.svg'), filmsSVG)
  fs.writeFileSync(path.join(iconsDir, 'shortcut-series.svg'), seriesSVG)
  fs.writeFileSync(path.join(iconsDir, 'shortcut-profile.svg'), profileSVG)
  
  console.log('✅ Icônes de raccourcis générées')
}

function main() {
  console.log('🎨 Génération des icônes PWA pour Atiha...\n')
  
  // Créer le dossier icons s'il n'existe pas
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  
  // Générer les icônes principales
  ICON_SIZES.forEach(icon => {
    createIconPNG(icon.size, icon.name)
  })
  
  // Générer les icônes de raccourcis
  createShortcutIcons()
  
  console.log('\n📱 Instructions pour finaliser les icônes:')
  console.log('1. Convertissez les fichiers SVG en PNG avec un outil comme:')
  console.log('   - https://convertio.co/svg-png/')
  console.log('   - https://cloudconvert.com/svg-to-png')
  console.log('   - Ou utilisez ImageMagick: convert icon.svg icon.png')
  console.log('\n2. Placez les fichiers PNG dans public/icons/')
  console.log('\n3. Les icônes sont maintenant prêtes pour le PWA!')
  
  console.log('\n🎯 Icônes générées avec succès!')
}

main()
