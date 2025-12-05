# 🔐 Guide de Surveillance de Sécurité en Production

## 📋 Vérifications régulières

### En production : Comment faire `npm audit` ?

#### Option 1 : Via SSH (si serveur dédié)

```bash
# 1. Se connecter au serveur
ssh user@votre-serveur.com

# 2. Aller dans le dossier du projet
cd /chemin/vers/votre/projet

# 3. Exécuter npm audit
npm audit

# 4. Voir les détails
npm audit --json > security-report-$(date +%Y%m%d).json
```

---

#### Option 2 : Script automatique (recommandé)

J'ai créé un script `scripts/check-security.js` qui fait tout automatiquement :

```bash
# Vérification complète avec rapport
npm run security:report

# Ou directement
node scripts/check-security.js
```

**Ce que fait le script** :
- ✅ Exécute `npm audit`
- ✅ Génère un rapport lisible dans `security-reports/`
- ✅ Sauvegarde la date du rapport
- ✅ Affiche un résumé clair

---

#### Option 3 : Via Vercel/Next.js Cloud (si déployé là)

**Vercel** :
1. Allez dans votre projet sur vercel.com
2. Settings → Security
3. Vérifiez les alertes de sécurité automatiques

**GitHub/GitLab** :
- Configurez Dependabot ou Renovate pour surveiller automatiquement
- Vous recevrez des alerts sur les nouvelles vulnérabilités

---

#### Option 4 : Via CI/CD (automatique)

Si vous avez GitHub Actions ou GitLab CI, ajoutez ceci :

```yaml
# .github/workflows/security.yml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * 1'  # Chaque lundi à minuit
  workflow_dispatch:  # Déclenchement manuel

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit
      - run: npm run security:report
```

---

## 📅 Calendrier recommandé

### Fréquence de vérification

| Période | Action | Priorité |
|---------|--------|----------|
| **Hebdomadaire** | `npm audit` | ⭐⭐⭐ Critique |
| **Mensuel** | `npm audit fix` + mise à jour dépendances | ⭐⭐ Important |
| **Quartier** | Audit de sécurité complet | ⭐ Utile |

---

## 🔧 Commandes utiles

### Vérifications de base

```bash
# Audit standard
npm audit

# Audit avec détails JSON
npm audit --json

# Tentative de correction automatique (sans breaking changes)
npm audit fix

# Correction forcée (avec breaking changes - ⚠️ attention)
npm audit fix --force
```

### Script personnalisé

```bash
# Générer un rapport complet
npm run security:report

# Vérification rapide
npm run audit:check
```

---

## 📊 Interprétation des résultats

### Si `npm audit` trouve des vulnérabilités :

1. **Vulnérabilités HIGH/CRITICAL** :
   - ⚠️ Action immédiate requise
   - Vérifiez si elles affectent votre utilisation
   - Corrigez avec `npm audit fix` si possible

2. **Vulnérabilités LOW/MODERATE** :
   - 📅 Planifier la correction
   - Surveiller régulièrement

3. **Aucune vulnérabilité** :
   - ✅ Tout est bon, continuez la surveillance

---

## 🚨 Plan d'action en cas de vulnérabilité critique

### Étapes d'urgence :

1. **Identifier la vulnérabilité** :
   ```bash
   npm audit
   ```

2. **Évaluer l'impact** :
   - Lisez le CVE/GHSA associé
   - Vérif免责z si vous utilisez la fonctionnalité affectée

3. **Corriger** :
   ```bash
   # Tentative de correction douce
   npm audit fix
   
   # Si ça ne fonctionne pas, évaluer npm audit fix --force
   ```

4. **Tester** :
   ```bash
   npm test
   npm run build
   ```

5. **Déployer la correction** :
   - Déployer en staging d'abord
   - Tester complètement
   - Déployer en production

---

## 📧 Alertes automatiques (optionnel)

### Configurer des notifications

1. **GitHub Dependabot** (si votre code est sur GitHub) :
   - Activez Dependabot dans Settings → Security
   - Recevez des alerts automatiques

2. **Email/Slack** :
   - Configurez un cron job hebdomadaire
   - Envoyez un email si des vulnérabilités sont détectées

Exemple de script d'alerte :

```bash
#!/bin/bash
# check-and-alert.sh

VULNS=$(npm audit --json | jq '.metadata.vulnerabilities.total')

if [ "$VULNS" -gt 0 ]; then
  echo "⚠️ Vulnérabilités détectées: $VULNS" | mail -s "Security Alert" admin@votre-domaine.com
fi
```

---

## ✅ Checklist de surveillance

- [ ] Vérification hebdomadaire : `npm audit`
- [ ] Rapport mensuel : `npm run security:report`
- [ ] Mise à jour des dépendances critiques
- [ ] Documentation des vulnérabilités connues
- [ ] Plan de correction pour chaque vulnérabilité

---

## 📝 Logs et historique

Les rapports sont sauvegardés dans `security-reports/` :
- Un rapport par jour
- Format lisible et JSON disponible
- Historique pour suivre l'évolution

---

**Rappel** : La sécurité est un processus continu, pas un état ponctuel !

