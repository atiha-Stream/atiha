#!/usr/bin/env node

/**
 * Script pour générer le fichier .env.local avec des clés sécurisées
 * Usage: node scripts/generate-env-local.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Générer des clés sécurisées
const encryptionKey = crypto.randomBytes(32).toString('hex');
const jwtSecret = crypto.randomBytes(64).toString('hex');
const adminPassword = crypto.randomBytes(24).toString('base64');
const securityCode = crypto.randomBytes(16).toString('base64') + '!@#Code';

// Contenu du fichier .env.local
const envContent = `# Configuration de sécurité pour l'application Atiha
# ⚠️ IMPORTANT: Ce fichier contient des informations sensibles
# ⚠️ CRITIQUE: Ne JAMAIS committer ce fichier dans Git
# ⚠️ Ce fichier est déjà dans .gitignore
# 
# Généré automatiquement le ${new Date().toISOString()}

# ============================================
# VARIABLES REQUISES (OBLIGATOIRES)
# ============================================

# Identifiants admin (OBLIGATOIRE)
# ⚠️ NE JAMAIS utiliser NEXT_PUBLIC_* pour ces variables (elles seraient exposées côté client)
ADMIN_USERNAME=leGenny
ADMIN_PASSWORD=${adminPassword}
ADMIN_SECURITY_CODE=${securityCode}

# ============================================
# VARIABLES RECOMMANDÉES
# ============================================

# Clé de chiffrement principale (256 bits)
# Générée automatiquement - NE PAS MODIFIER
ENCRYPTION_KEY=${encryptionKey}

# Secret JWT pour les tokens
# Généré automatiquement - NE PAS MODIFIER
JWT_SECRET=${jwtSecret}

# Configuration de l'application (peuvent être publiques)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Atiha

# ============================================
# CONFIGURATION DE SÉCURITÉ
# ============================================

# Nombre maximum de tentatives de connexion avant verrouillage
MAX_LOGIN_ATTEMPTS=5

# Durée du verrouillage en minutes
LOCKOUT_DURATION_MINUTES=5

# Configuration bcrypt
BCRYPT_SALT_ROUNDS=12

# Timeout de session en millisecondes (1 heure par défaut)
SESSION_TIMEOUT=3600000

# Configuration de chiffrement
AES_KEY_LENGTH=256
GCM_IV_LENGTH=12

# ============================================
# DÉVELOPPEMENT UNIQUEMENT
# ============================================

# Permettre l'utilisation de credentials par défaut (UNIQUEMENT en développement)
# ⚠️ NE JAMAIS activer en production
# ALLOW_DEFAULT_ADMIN_CREDENTIALS=false
`;

// Chemin du fichier .env.local
const envPath = path.join(process.cwd(), '.env.local');

// Vérifier si le fichier existe déjà
if (fs.existsSync(envPath)) {
  console.log('⚠️  Le fichier .env.local existe déjà!');
  console.log('   Pour le régénérer, supprimez-le d\'abord ou renommez-le.');
  process.exit(1);
}

// Créer le fichier
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  // Définir les permissions (600 = lecture/écriture pour le propriétaire uniquement)
  if (process.platform !== 'win32') {
    fs.chmodSync(envPath, 0o600);
  }
  
  console.log('✅ Fichier .env.local créé avec succès!');
  console.log('');
  console.log('📋 Informations générées:');
  console.log(`   - ADMIN_USERNAME: leGenny`);
  console.log(`   - ADMIN_PASSWORD: ${adminPassword}`);
  console.log(`   - ADMIN_SECURITY_CODE: ${securityCode}`);
  console.log(`   - ENCRYPTION_KEY: ${encryptionKey.substring(0, 20)}...`);
  console.log(`   - JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   1. Notez ces informations dans un endroit sécurisé');
  console.log('   2. Changez ADMIN_PASSWORD et ADMIN_SECURITY_CODE en production');
  console.log('   3. Ne committez JAMAIS ce fichier dans Git');
  console.log('');
  console.log('✅ Vous pouvez maintenant démarrer l\'application avec: npm run dev');
  
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier .env.local:', error.message);
  process.exit(1);
}

