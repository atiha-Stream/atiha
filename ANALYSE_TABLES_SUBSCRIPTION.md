# 📊 Analyse des Tables Nécessaires pour `/subscription`

## 🔍 Données Actuellement dans localStorage

La page `/subscription` utilise actuellement ces données stockées localement :

1. **`atiha_payment_links`** - URLs de paiement (individuel/famille)
2. **`atiha_payment_links_active`** - État d'activation des liens
3. **`atiha_subscription_plans`** - Plans d'abonnement (détails, prix, features)
4. **`atiha_post_payment_links`** - Liens après paiement
5. **`atiha_post_payment_codes`** - Codes après paiement
6. **`atiha_subscription_price`** - ✅ Déjà dans la DB (`subscription_prices`)

## 📋 Tables Recommandées

### 1. **`subscription_plans`** (Recommandé)
Pour stocker les plans d'abonnement (individuel/famille) avec leurs détails.

**Champs :**
- `id` (String, PK)
- `type` (String) - 'individuel' | 'famille'
- `title` (String)
- `price` (String) - ex: "1999 fcfa/mois"
- `period` (String) - ex: "Mensuel"
- `commitment` (String) - ex: "Sans engagement"
- `description` (String?)
- `features` (Json) - Array de features
- `button_text` (String)
- `button_color` (String)
- `payment_url` (String?) - URL de paiement (fallback)
- `is_active` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### 2. **`payment_links`** (Recommandé)
Pour stocker les URLs de paiement configurées.

**Champs :**
- `id` (String, PK)
- `plan_type` (String) - 'individuel' | 'famille'
- `url` (String) - URL de paiement
- `is_active` (Boolean)
- `created_by` (String?)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### 3. **`post_payment_links`** (Optionnel)
Pour stocker les liens après paiement.

**Champs :**
- `id` (String, PK)
- `plan_type` (String)
- `url` (String)
- `is_active` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### 4. **`payments`** (Recommandé pour le suivi)
Pour suivre les transactions de paiement.

**Champs :**
- `id` (String, PK)
- `user_id` (String, FK -> users)
- `plan_type` (String)
- `amount` (String)
- `currency` (String)
- `status` (String) - 'pending' | 'completed' | 'failed' | 'cancelled'
- `payment_url` (String?)
- `transaction_id` (String?)
- `payment_provider` (String?)
- `metadata` (Json?)
- `created_at` (DateTime)
- `updated_at` (DateTime)

## ✅ Tables Déjà Existantes

- ✅ `subscription_prices` - Prix d'abonnement
- ✅ `premium_codes` - Codes premium
- ✅ `premium_code_usages` - Utilisation des codes

## 🎯 Recommandation

**Minimum requis :**
- `subscription_plans` - Pour centraliser la configuration des plans
- `payment_links` - Pour gérer les URLs de paiement

**Optionnel mais utile :**
- `payments` - Pour suivre les transactions
- `post_payment_links` - Si vous voulez migrer ces données aussi

