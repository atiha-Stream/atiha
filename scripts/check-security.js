#!/usr/bin/env node

/**
 * Script de vérification de sécurité pour l'application Atiha
 * Vérifie les problèmes de sécurité courants dans le code
 * 
 * Usage: npm run security:report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const issues = {
  critical: [],
  warning: [],
  info: []
};

// Fonction pour vérifier si une ligne est dans un commentaire ou une chaîne
function isInCommentOrString(line, index) {
  const beforeMatch = line.substring(0, index);
  // Vérifier si on est dans un commentaire
  if (beforeMatch.includes('//') || beforeMatch.match(/\/\*/)) {
    return true;
  }
  // Vérifier si on est dans une chaîne (approximatif)
  const singleQuotes = (beforeMatch.match(/'/g) || []).length;
  const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
  // Si nombre impair de guillemets, on est dans une chaîne
  if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
    return true;
  }
  return false;
}

// Patterns à rechercher
const securityPatterns = {
  critical: [
    {
      pattern: /NEXT_PUBLIC_ADMIN_(PASSWORD|SECRET|KEY)/i,
      message: 'Variables NEXT_PUBLIC_* utilisées pour des données sensibles (exposées côté client)',
      fix: 'Utiliser ADMIN_* (sans NEXT_PUBLIC_) pour les données sensibles',
      excludeInComments: true,
      excludePatterns: [
        /if\s*\(process\.env\.NEXT_PUBLIC_ADMIN/i, // Vérifications dans env-validator
        /warnings\.push.*NEXT_PUBLIC/i, // Messages d'avertissement
        /console\.(log|warn|error).*NEXT_PUBLIC/i // Logs d'avertissement
      ]
    },
    {
      pattern: /password\s*[:=]\s*['"]([^'"]{3,})['"]/i,
      message: 'Mot de passe hardcodé détecté',
      fix: 'Utiliser des variables d\'environnement',
      excludeInComments: true,
      excludePatterns: [
        /\/\/.*password/i,  // Commentaires
        /\*.*password/i,    // Commentaires multi-lignes
        /weakPassword/i,    // Messages d'erreur
        /password.*must/i,  // Messages d'erreur
        /password.*should/i, // Messages d'erreur
        /password.*required/i, // Messages d'erreur
        /test.*password/i,  // Tests
        /example.*password/i, // Exemples
        /\[CHANGER/i,       // Placeholders comme [CHANGER_CE_MOT_DE_PASSE]
        /placeholder/i,     // Placeholders
        /temp_/i,          // Mots de passe temporaires générés
        /process\.env\./i  // Variables d'environnement
      ]
    },
    {
      pattern: /api[_-]?key\s*[:=]\s*['"]([^'"]{5,})['"]/i,
      message: 'Clé API hardcodée détectée',
      fix: 'Utiliser des variables d\'environnement',
      excludeInComments: true
    },
    {
      pattern: /secret\s*[:=]\s*['"]([^'"]{5,})['"]/i,
      message: 'Secret hardcodé détecté',
      fix: 'Utiliser des variables d\'environnement',
      excludeInComments: true,
      excludePatterns: [
        /\/\/.*secret/i,
        /\*.*secret/i
      ]
    }
  ],
  warning: [
    {
      pattern: /console\.(log|error|warn)/,
      message: 'console.log/error/warn utilisé (devrait utiliser le logger centralisé)',
      fix: 'Remplacer par logger.info/error/warn de src/lib/logger.ts'
    },
    {
      pattern: /eval\s*\(/,
      message: 'eval() utilisé (risque de sécurité)',
      fix: 'Éviter eval(), utiliser des alternatives sécurisées'
    },
    {
      pattern: /innerHTML\s*=/,
      message: 'innerHTML utilisé (risque XSS)',
      fix: 'Utiliser textContent ou des méthodes sécurisées'
    }
  ],
  info: [
    {
      pattern: /TODO.*security|FIXME.*security/i,
      message: 'TODO/FIXME lié à la sécurité',
      fix: 'Vérifier et corriger les problèmes de sécurité'
    }
  ]
};

function scanFile(filePath) {
  // Ignorer les fichiers de test
  if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // Vérifier les patterns critiques
  securityPatterns.critical.forEach(({ pattern, message, fix, excludeInComments, excludePatterns }) => {
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        // Vérifier si on est dans un commentaire
        if (excludeInComments && isInCommentOrString(line, match.index)) {
          return;
        }
        
        // Vérifier les patterns d'exclusion
        if (excludePatterns) {
          const shouldExclude = excludePatterns.some(excludePattern => excludePattern.test(line));
          if (shouldExclude) {
            return;
          }
        }
        
        issues.critical.push({
          file: relativePath,
          line: index + 1,
          message,
          fix,
          code: line.trim()
        });
      }
    });
  });

  // Vérifier les warnings
  securityPatterns.warning.forEach(({ pattern, message, fix }) => {
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        // Ignorer les commentaires pour les warnings aussi
        if (isInCommentOrString(line, match.index)) {
          return;
        }
        
        issues.warning.push({
          file: relativePath,
          line: index + 1,
          message,
          fix,
          code: line.trim()
        });
      }
    });
  });

  // Vérifier les infos
  securityPatterns.info.forEach(({ pattern, message, fix }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        issues.info.push({
          file: relativePath,
          line: index + 1,
          message,
          fix,
          code: line.trim()
        });
      }
    });
  });
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Ignorer node_modules, .next, etc.
          if (!['node_modules', '.next', '.git', 'dist', 'build', '.turbo'].includes(file)) {
            scanDirectory(filePath, extensions);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            scanFile(filePath);
          }
        }
      } catch (err) {
        // Ignorer les erreurs d'accès aux fichiers
      }
    });
  } catch (err) {
    // Ignorer les erreurs d'accès aux répertoires
  }
}

function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log(BLUE + '🔒 RAPPORT DE VÉRIFICATION DE SÉCURITÉ' + RESET);
  console.log('='.repeat(80) + '\n');

  // Issues critiques
  if (issues.critical.length > 0) {
    console.log(RED + `❌ PROBLÈMES CRITIQUES (${issues.critical.length})` + RESET);
    issues.critical.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${RED}${issue.file}:${issue.line}${RESET}`);
      console.log(`   ${YELLOW}${issue.message}${RESET}`);
      console.log(`   ${BLUE}Code:${RESET} ${issue.code}`);
      console.log(`   ${GREEN}Fix:${RESET} ${issue.fix}`);
    });
    console.log('');
  }

  // Warnings
  if (issues.warning.length > 0) {
    console.log(YELLOW + `⚠️  AVERTISSEMENTS (${issues.warning.length})` + RESET);
    issues.warning.slice(0, 20).forEach((issue, index) => {
      console.log(`\n${index + 1}. ${YELLOW}${issue.file}:${issue.line}${RESET}`);
      console.log(`   ${issue.message}`);
      console.log(`   ${GREEN}Fix:${RESET} ${issue.fix}`);
    });
    if (issues.warning.length > 20) {
      console.log(`\n   ... et ${issues.warning.length - 20} autres avertissements`);
    }
    console.log('');
  }

  // Infos
  if (issues.info.length > 0) {
    console.log(BLUE + `ℹ️  INFORMATIONS (${issues.info.length})` + RESET);
    issues.info.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   ${issue.message}`);
    });
    console.log('');
  }

  // Résumé
  console.log('='.repeat(80));
  console.log(BLUE + '📊 RÉSUMÉ' + RESET);
  console.log('='.repeat(80));
  console.log(`${RED}Critiques:${RESET} ${issues.critical.length}`);
  console.log(`${YELLOW}Avertissements:${RESET} ${issues.warning.length}`);
  console.log(`${BLUE}Informations:${RESET} ${issues.info.length}`);
  console.log('='.repeat(80) + '\n');

  // Score (les avertissements comptent moins que les problèmes critiques)
  const criticalPenalty = issues.critical.length * 20; // -20 points par problème critique
  const warningPenalty = Math.min(issues.warning.length * 0.1, 20); // Max -20 points pour les warnings
  const infoPenalty = issues.info.length * 0.5; // -0.5 point par info
  
  let score = 100 - criticalPenalty - warningPenalty - infoPenalty;
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  console.log(`Score de sécurité: ${score >= 80 ? GREEN : score >= 60 ? YELLOW : RED}${score}/100${RESET}\n`);

  // Recommandations
  if (issues.critical.length > 0) {
    console.log(RED + '🚨 ACTION REQUISE:' + RESET);
    console.log('   Corriger les problèmes critiques avant le déploiement en production!\n');
    process.exit(1);
  } else if (issues.warning.length > 10) {
    console.log(YELLOW + '⚠️  RECOMMANDATION:' + RESET);
    console.log('   Considérer la correction des avertissements pour améliorer la sécurité.\n');
  } else {
    console.log(GREEN + '✅ Aucun problème critique détecté!' + RESET + '\n');
  }
}

// Main
console.log(BLUE + '🔍 Scan de sécurité en cours...' + RESET);

const srcDir = path.join(process.cwd(), 'src');
if (fs.existsSync(srcDir)) {
  scanDirectory(srcDir);
} else {
  console.error(RED + '❌ Répertoire src/ non trouvé!' + RESET);
  process.exit(1);
}

printReport();
