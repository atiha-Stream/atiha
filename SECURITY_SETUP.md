# 🔐 GUIDE DE CONFIGURATION SÉCURISÉE

## ⚠️ ÉTAPES OBLIGATOIRES AVANT LA MISE EN PRODUCTION

### **1. Configuration des variables d'environnement**

#### **Créer le fichier `.env.local` :**
```bash
# Copier le fichier d'exemple
cp env.secure.example .env.local
```

#### **Générer les clés de sécurité :**
```bash
# Générer une clé de chiffrement (256 bits)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Générer un secret JWT
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

#### **Remplir le fichier `.env.local` :**
```env
# Clé de chiffrement principale (256 bits)
ENCRYPTION_KEY=votre_clé_de_32_caractères_hexadécimaux

# Secret JWT pour les tokens
JWT_SECRET=votre_secret_jwt_de_64_caractères_hexadécimaux

# Identifiants admin (CHANGER EN PRODUCTION !)
ADMIN_USERNAME=leGenny
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
ADMIN_SECURITY_CODE=VotreCodeSecurite123!

# Configuration de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Atiha
```

### **2. Vérification de la sécurité**

#### **Tester le chiffrement :**
```typescript
import { EncryptionService } from '@/lib/encryption-service'

// Test de hachage de mot de passe
const password = 'MonMotDePasse123!'
const hashed = await EncryptionService.hashPassword(password)
console.log('Mot de passe haché:', hashed)

// Test de vérification
const isValid = await EncryptionService.verifyPassword(password, hashed)
console.log('Mot de passe valide:', isValid)

// Test de chiffrement de données
const data = { email: 'test@example.com', phone: '0123456789' }
const encrypted = EncryptionService.encryptData(data)
console.log('Données chiffrées:', encrypted)

const decrypted = EncryptionService.decryptData(encrypted)
console.log('Données déchiffrées:', decrypted)
```

### **3. Migration des données existantes**

#### **Script de migration (à exécuter une seule fois) :**
```typescript
// migration-security.js
import { EncryptionService } from './src/lib/encryption-service'

async function migrateExistingData() {
  console.log('🔄 Migration des données vers le chiffrement...')
  
  // 1. Chiffrer les mots de passe existants
  const users = JSON.parse(localStorage.getItem('atiha_users_database') || '[]')
  
  for (const user of users) {
    if (user.password && !user.password.startsWith('$2')) {
      // Le mot de passe n'est pas encore haché
      user.password = await EncryptionService.hashPassword(user.password)
    }
  }
  
  // 2. Sauvegarder les données chiffrées
  localStorage.setItem('atiha_users_database', JSON.stringify(users))
  
  console.log('✅ Migration terminée !')
}

migrateExistingData()
```

### **4. Sécurité en production**

#### **Checklist de sécurité :**
- [ ] **Variables d'environnement** configurées
- [ ] **Clés de chiffrement** générées et sécurisées
- [ ] **Mots de passe admin** changés
- [ ] **HTTPS** activé
- [ ] **Certificats SSL** valides
- [ ] **Firewall** configuré
- [ ] **Backup** des clés de chiffrement
- [ ] **Monitoring** des logs de sécurité

#### **Commandes de génération des clés :**
```bash
# Clé de chiffrement AES-256
openssl rand -hex 32

# Secret JWT
openssl rand -hex 64

# Mot de passe admin sécurisé
openssl rand -base64 32
```

### **5. Test de sécurité**

#### **Vérifier que tout fonctionne :**
1. **Connexion admin** avec nouveau mot de passe
2. **Inscription utilisateur** avec validation de mot de passe
3. **Chiffrement des données** localStorage
4. **Déchiffrement** des données existantes

#### **Tests à effectuer :**
```typescript
// Test 1: Validation de mot de passe
const weakPassword = '123'
const validation = EncryptionService.validatePasswordStrength(weakPassword)
console.log('Mot de passe faible:', validation)

// Test 2: Chiffrement de données sensibles
const sensitiveData = { creditCard: '1234-5678-9012-3456' }
const encrypted = EncryptionService.encryptData(sensitiveData)
const decrypted = EncryptionService.decryptData(encrypted)
console.log('Données sensibles protégées:', encrypted !== sensitiveData.creditCard)

// Test 3: Intégrité des données
const isValid = EncryptionService.verifyDataIntegrity(encrypted)
console.log('Intégrité vérifiée:', isValid)
```

## 🚨 **IMPORTANT - SÉCURITÉ**

### **❌ NE JAMAIS FAIRE :**
- Commiter le fichier `.env.local` dans Git
- Partager les clés de chiffrement
- Utiliser des mots de passe faibles
- Stocker les clés en dur dans le code

### **✅ TOUJOURS FAIRE :**
- Utiliser des variables d'environnement
- Changer les mots de passe par défaut
- Sauvegarder les clés de chiffrement
- Monitorer les logs de sécurité
- Tester la sécurité régulièrement

## 🔧 **DÉPANNAGE**

### **Erreur "ENCRYPTION_KEY non définie" :**
```bash
# Vérifier que le fichier .env.local existe
ls -la .env.local

# Vérifier le contenu
cat .env.local | grep ENCRYPTION_KEY
```

### **Erreur de déchiffrement :**
```typescript
// Vérifier l'intégrité des données
const isValid = EncryptionService.verifyDataIntegrity(encryptedData)
if (!isValid) {
  console.error('Données corrompues ou clé incorrecte')
}
```

### **Migration des données existantes :**
```typescript
// Sauvegarder avant migration
const backup = localStorage.getItem('atiha_users_database')
localStorage.setItem('atiha_users_backup', backup)

// Puis exécuter la migration
```

---

**🎯 Résultat : Application sécurisée avec chiffrement AES-256 et hachage bcrypt !**
