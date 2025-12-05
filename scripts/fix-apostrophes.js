const fs = require('fs');
const path = require('path');

// Liste des fichiers à traiter
const filesToFix = [
  'src/components/AdminModals.tsx',
  'src/components/SearchResultsPopup.tsx',
  'src/components/SessionManagementModal.tsx',
  'src/components/UserSessionManagementModal.tsx',
  'src/components/WebtorConfiguration.tsx',
  'src/components/WebtorPlayer.tsx',
  'src/components/UniversalVideoPlayer.tsx',
  'src/components/SubscriptionManagementModal.tsx',
  'src/components/AnalyticsDashboard.tsx',
  'src/components/AdminRoleProtectedRoute.tsx',
  'src/components/CreateAdminModal.tsx',
  'src/components/AdminTestsPanel.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/collection/page.tsx',
  'src/app/films/page.tsx',
  'src/app/series/page.tsx',
  'src/app/homepage-editor/page.tsx'
];

function fixApostrophes(content) {
  // Remplacer les apostrophes dans les chaînes JSX uniquement
  // Pattern: trouver les apostrophes dans les attributs ou contenu JSX
  // Mais éviter de remplacer dans les chaînes de template JavaScript
  
  // Remplacer ' par &apos; dans les attributs JSX (className, etc. avec texte)
  content = content.replace(/(className|placeholder|title|alt|aria-label|aria-describedby)=["']([^"']*?)['"']/g, (match, attr, text) => {
    return `${attr}="${text.replace(/'/g, '&apos;').replace(/"/g, '&quot;')}"`;
  });
  
  // Remplacer dans le contenu JSX entre balises
  // Pattern: >texte avec apostrophe<
  content = content.replace(/>([^<]*?['"][^<]*?)</g, (match, text) => {
    // Vérifier que ce n'est pas une expression JSX { }
    if (!text.includes('{') && !text.includes('}')) {
      return `>${text.replace(/'/g, '&apos;').replace(/"/g, '&quot;')}<`;
    }
    return match;
  });
  
  // Correction plus simple : remplacer dans les chaînes entre guillemets simples ou doubles dans JSX
  // Mais seulement si elles sont dans un contexte JSX (pas dans du code JS)
  
  return content;
}

// Fonction plus précise pour corriger les apostrophes dans JSX
function fixApostrophesPrecise(content) {
  // Éviter de modifier les imports et le code JS
  const lines = content.split('\n');
  const fixedLines = [];
  let inJSX = false;
  let inString = false;
  let stringChar = '';
  
  for (let line of lines) {
    // Détecter si on est dans du JSX (après return ou dans une balise)
    if (line.includes('return') && line.includes('(')) {
      inJSX = true;
    }
    if (line.includes('</') || (line.includes('/>') && !line.includes('{/*'))) {
      inJSX = false;
    }
    
    // Si on est dans du JSX, corriger les apostrophes dans les attributs et le texte
    if (inJSX || line.includes('className') || line.includes('<') || line.includes('>')) {
      // Corriger dans les attributs JSX
      line = line.replace(/(\w+)=["']([^"']*?'[^"']*?)["']/g, (match, attr, value) => {
        return `${attr}="${value.replace(/'/g, '&apos;').replace(/"/g, '&quot;')}"`;
      });
      
      // Corriger dans le texte entre balises (mais pas dans { })
      line = line.replace(/>([^{<]*?['"][^{<]*?)</g, (match, text) => {
        if (!text.trim().match(/^\{/)) {
          return `>${text.replace(/'/g, '&apos;').replace(/"/g, '&quot;')}<`;
        }
        return match;
      });
    }
    
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

console.log('🔧 Correction automatique des apostrophes...\n');

let totalFixed = 0;

for (const file of filesToFix) {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier non trouvé: ${file}`);
    continue;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Correction manuelle ciblée - trop complexe pour automatiser parfaitement
    // On va plutôt corriger manuellement les fichiers critiques
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${file}`);
      totalFixed++;
    } else {
      console.log(`⏭️  Ignoré (pas de changements): ${file}`);
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${file}:`, error.message);
  }
}

console.log(`\n✅ ${totalFixed} fichier(s) corrigé(s)`);
console.log('\n⚠️  Note: Les corrections automatiques sont limitées.');
console.log('   Veuillez corriger manuellement les apostrophes restantes.');

