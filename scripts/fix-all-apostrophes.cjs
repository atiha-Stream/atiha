const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Fonction pour corriger les apostrophes dans le contenu JSX
function fixApostrophesInContent(content, filePath) {
  let fixed = content;
  let changed = false;
  
  // Liste des remplacements courants
  const replacements = [
    // Apostrophes simples dans texte français
    [/\b(d')(utilisateur|administration|abonnement|appareils?|appareil|écran|historique|import|export|activation|interface|application)\b/gi, 'd&apos;$2'],
    [/\b(l')(utilisateur|administrateur|abonnement|application|interface|activation|écran|historique|import|export)\b/gi, 'l&apos;$2'],
    [/\b(n')(est|ont|êtes|êtes-vous|avez|ont-ils)\b/gi, 'n&apos;$2'],
    [/\b(s')(est|affiche|agit|affiche|inscrire|connecter|déconnecter)\b/gi, 's&apos;$2'],
    [/\b(t')(utilisateur|abonnement)\b/gi, 't&apos;$2'],
    [/\b(m')(utilisateur|abonnement)\b/gi, 'm&apos;$2'],
    [/\b(jusqu')(hui|à|aux?)\b/gi, 'jusqu&apos;$2'],
    [/\b(aujourd')(hui)\b/gi, 'aujourd&apos;$2'],
    
    // Phrases complètes courantes
    [/Nom d'utilisateur/g, 'Nom d&apos;utilisateur'],
    [/d'utilisateur/g, 'd&apos;utilisateur'],
    [/l'utilisateur/g, 'l&apos;utilisateur'],
    [/l'administrateur/g, 'l&apos;administrateur'],
    [/l'application/g, 'l&apos;application'],
    [/l'interface/g, 'l&apos;interface'],
    [/l'activation/g, 'l&apos;activation'],
    [/l'écran/g, 'l&apos;écran'],
    [/l'historique/g, 'l&apos;historique'],
    [/l'import/g, 'l&apos;import'],
    [/l'export/g, 'l&apos;export'],
    [/d'abonnement/g, 'd&apos;abonnement'],
    [/d'appareils/g, 'd&apos;appareils'],
    [/d'appareil/g, 'd&apos;appareil'],
    [/Gestion du Prix d'Abonnement/g, 'Gestion du Prix d&apos;Abonnement'],
    [/Modifier l'Administrateur/g, 'Modifier l&apos;Administrateur'],
    [/Supprimer l'Administrateur/g, 'Supprimer l&apos;Administrateur'],
    [/Guide d'installation/g, 'Guide d&apos;installation'],
    [/écran d'accueil/g, 'écran d&apos;accueil'],
    [/Déconnectez-vous d'un/g, 'Déconnectez-vous d&apos;un'],
    [/Limite d'appareils/g, 'Limite d&apos;appareils'],
    [/Chaque type d'abonnement/g, 'Chaque type d&apos;abonnement'],
    [/d'un utilisateur/g, 'd&apos;un utilisateur'],
    [/d'un appareil/g, 'd&apos;un appareil'],
    [/d'autres/g, 'd&apos;autres'],
    
    // Guillemets doubles
    [/Recherche pour "([^"]+)"/g, 'Recherche pour &quot;$1&quot;'],
    [/Aucun résultat trouvé pour "([^"]+)"/g, 'Aucun résultat trouvé pour &quot;$1&quot;'],
    [/Bouton "([^"]+)"/g, 'Bouton &quot;$1&quot;'],
    [/Désactiver le compte"/g, 'Désactiver le compte&quot;'],
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changed = true;
    }
  });
  
  return { content: fixed, changed };
}

console.log('🔧 Correction automatique des apostrophes...\n');

// Trouver tous les fichiers .tsx dans src
const files = glob.sync('src/**/*.tsx', {
  ignore: ['**/node_modules/**', '**/*.test.tsx', '**/__tests__/**']
});

let totalFixed = 0;
let totalErrors = 0;

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Appliquer les corrections
    const result = fixApostrophesInContent(content, filePath);
    
    if (result.changed && result.content !== originalContent) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ Corrigé: ${file}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${file}:`, error.message);
    totalErrors++;
  }
});

console.log(`\n✅ ${totalFixed} fichier(s) modifié(s)`);
if (totalErrors > 0) {
  console.log(`⚠️  ${totalErrors} erreur(s)`);
}

