'use client'

// Utilitaires de validation/sanitization pour formulaires et URLs

/**
 * Sanitise une chaîne de caractères pour prévenir les attaques XSS
 * @param input - La chaîne à sanitiser
 * @param opts - Options de sanitisation
 * @returns La chaîne sanitisée
 */
export function sanitizeString(input: string, opts: { maxLen?: number; allowNewlines?: boolean } = {}): string {
  if (!input || typeof input !== 'string') return ''
  
  const max = opts.maxLen ?? 500
  let trimmed = input.trim()
  
  // Supprimer les caractères de contrôle (sauf les sauts de ligne si autorisés)
  if (opts.allowNewlines) {
    trimmed = trimmed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  } else {
    trimmed = trimmed.replace(/[\u0000-\u001F\u007F]/g, '')
  }
  
  // Échapper les caractères HTML pour prévenir XSS
  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return escaped.slice(0, max)
}

/**
 * Sanitise une chaîne pour l'affichage (sans échappement HTML, seulement pour le stockage)
 * Utilisé avant d'enregistrer dans la base de données
 */
export function sanitizeForStorage(input: string, opts: { maxLen?: number } = {}): string {
  if (!input || typeof input !== 'string') return ''
  
  const max = opts.maxLen ?? 1000
  let trimmed = input.trim()
  
  // Supprimer les caractères de contrôle dangereux
  trimmed = trimmed.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  
  // Supprimer les balises HTML dangereuses
  trimmed = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  trimmed = trimmed.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  trimmed = trimmed.replace(/javascript:/gi, '')
  trimmed = trimmed.replace(/on\w+\s*=/gi, '') // Supprimer les event handlers (onclick, onerror, etc.)
  
  return trimmed.slice(0, max)
}

export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const u = new URL(url)
    // Autoriser uniquement http/https et pas de javascript: etc.
    if (!['http:', 'https:'].includes(u.protocol)) return false
    return true
  } catch {
    return false
  }
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  
  // Pattern RFC 5322 simplifié mais efficace
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  // Vérifier la longueur (max 254 caractères selon RFC)
  if (trimmed.length > 254) return false
  
  return emailRegex.test(trimmed)
}

/**
 * Valide et sanitise un nom d'utilisateur
 */
export function validateUsername(username: string): { isValid: boolean; error?: string; sanitized?: string } {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Le nom d\'utilisateur est requis' }
  }
  
  const trimmed = username.trim()
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Le nom doit contenir au moins 2 caractères' }
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Le nom ne peut pas dépasser 50 caractères' }
  }
  
  // Autoriser lettres, chiffres, espaces, tirets, apostrophes
  const usernameRegex = /^[a-zA-Z0-9\s\-'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]+$/
  
  if (!usernameRegex.test(trimmed)) {
    return { isValid: false, error: 'Le nom contient des caractères non autorisés' }
  }
  
  const sanitized = sanitizeForStorage(trimmed, { maxLen: 50 })
  
  return { isValid: true, sanitized }
}

export function isStrongPassword(pwd: string, minLen: number = 12): boolean {
  if (!pwd || pwd.length < minLen) return false
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd)
  return hasUpper && hasLower && hasDigit && hasSymbol
}

export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Valide un numéro de téléphone (format international)
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string; sanitized?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Le numéro de téléphone est requis' }
  }
  
  // Supprimer tous les caractères non numériques sauf + au début
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Si commence par +, le garder, sinon ajouter +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/^0+/, '') // Supprimer les zéros en tête
  }
  
  // Vérifier la longueur (entre 8 et 15 chiffres selon ITU-T E.164)
  const digitsOnly = cleaned.replace(/\+/g, '')
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Le numéro de téléphone doit contenir entre 7 et 15 chiffres' }
  }
  
  return { isValid: true, sanitized: cleaned }
}


