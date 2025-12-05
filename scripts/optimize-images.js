#!/usr/bin/env node

/**
 * Script d'optimisation des images
 * Remplace automatiquement toutes les balises <img> par le composant OptimizedImage
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src')
const COMPONENTS_TO_OPTIMIZE = [
  'Recommendations.tsx',
  'SearchBar.tsx',
  'SeriesPreview.tsx',
  'EpisodeNavigator.tsx',
  'UserProfile.tsx',
  'Watchlist.tsx',
  'LazyImage.tsx',
  'SeriesManager.tsx'
]

// Patterns de remplacement
const REPLACEMENTS = [
  // Import statements
  {
    pattern: /import\s+Image\s+from\s+['"]next\/image['"];?\s*\n/g,
    replacement: "import { PosterImage, ThumbnailImage, AvatarImage } from '@/components/OptimizedImage'\n"
  },
  
  // Balises img pour les affiches
  {
    pattern: /<img\s+src=\{([^}]+)\}\s+alt=\{([^}]+)\}\s+className="([^"]*)"\s*\/>/g,
    replacement: '<PosterImage src={$1} alt={$2} className="$3" />'
  },
  
  // Balises img avec width/height
  {
    pattern: /<img\s+src=\{([^}]+)\}\s+alt=\{([^}]+)\}\s+width=\{(\d+)\}\s+height=\{(\d+)\}\s+className="([^"]*)"\s*\/>/g,
    replacement: '<ThumbnailImage src={$1} alt={$2} className="$5" />'
  },
  
  // Balises img pour avatars
  {
    pattern: /<img\s+src=\{([^}]+)\}\s+alt=\{([^}]+)\}\s+className="([^"]*rounded-full[^"]*)"\s*\/>/g,
    replacement: '<AvatarImage src={$1} alt={$2} className="$3" />'
  }
]

function optimizeFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Appliquer les remplacements
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement)
      if (newContent !== content) {
        content = newContent
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Optimisé: ${path.relative(SRC_DIR, filePath)}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Erreur lors de l'optimisation de ${filePath}:`, error.message)
    return false
  }
}

function findComponentFiles(dir) {
  const files = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath)
      } else if (stat.isFile() && item.endsWith('.tsx') && COMPONENTS_TO_OPTIMIZE.includes(item)) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

function main() {
  console.log('🚀 Début de l\'optimisation des images...\n')
  
  const componentFiles = findComponentFiles(SRC_DIR)
  let optimizedCount = 0
  
  for (const file of componentFiles) {
    if (optimizeFile(file)) {
      optimizedCount++
    }
  }
  
  console.log(`\n✨ Optimisation terminée ! ${optimizedCount} fichiers modifiés.`)
  
  if (optimizedCount > 0) {
    console.log('\n📋 Prochaines étapes:')
    console.log('1. Vérifiez les imports dans les fichiers modifiés')
    console.log('2. Testez l\'application pour vous assurer que tout fonctionne')
    console.log('3. Lancez npm run build pour vérifier qu\'il n\'y a pas d\'erreurs')
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { optimizeFile, findComponentFiles }
