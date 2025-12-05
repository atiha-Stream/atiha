import { Country, PhoneValidation } from '@/types/phone'
import { COUNTRIES, findCountryByCode } from './countries'

// Service de validation des numéros de téléphone
export class PhoneValidationService {
  // Valider un numéro de téléphone
  static validatePhoneNumber(phoneNumber: string, countryCode: string): PhoneValidation {
    const country = findCountryByCode(countryCode)
    
    if (!country) {
      return {
        isValid: false,
        formattedNumber: phoneNumber,
        country: null,
        error: 'Pays non trouvé'
      }
    }

    // Nettoyer le numéro (supprimer espaces, tirets, etc.)
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    // Vérifier si le numéro correspond au pattern du pays
    const isValid = country.phonePattern.test(cleanNumber)
    
    // Formater le numéro complet
    const formattedNumber = isValid ? `${country.phoneCode}${cleanNumber}` : phoneNumber
    
    return {
      isValid,
      formattedNumber,
      country,
      error: isValid ? undefined : `Format invalide. Exemple: ${country.example}`
    }
  }

  // Valider un numéro complet (avec code pays)
  static validateCompletePhoneNumber(completeNumber: string): PhoneValidation {
    // Extraire le code pays du numéro
    const phoneCodeMatch = completeNumber.match(/^\+(\d{1,4})/)
    
    if (!phoneCodeMatch) {
      return {
        isValid: false,
        formattedNumber: completeNumber,
        country: null,
        error: 'Code pays manquant'
      }
    }

    const phoneCode = `+${phoneCodeMatch[1]}`
    const numberWithoutCode = completeNumber.replace(/^\+\d{1,4}/, '')
    
    // Trouver le pays par code téléphonique
    const country = COUNTRIES.find(c => c.phoneCode === phoneCode)
    
    if (!country) {
      return {
        isValid: false,
        formattedNumber: completeNumber,
        country: null,
        error: 'Code pays non reconnu'
      }
    }

    // Valider le numéro
    const cleanNumber = numberWithoutCode.replace(/[\s\-\(\)]/g, '')
    const isValid = country.phonePattern.test(cleanNumber)
    
    return {
      isValid,
      formattedNumber: completeNumber,
      country,
      error: isValid ? undefined : `Format invalide pour ${country.name}. Exemple: ${country.example}`
    }
  }

  // Formater un numéro pour l'affichage
  static formatPhoneNumber(phoneNumber: string, country: Country): string {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    if (!country.phonePattern.test(cleanNumber)) {
      return phoneNumber
    }

    // Formatage spécifique par pays
    switch (country.code) {
      case 'FR':
        // Format français: 06 12 34 56 78
        return cleanNumber.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
      
      case 'MA':
        // Format marocain: 600 69 18 0
        return cleanNumber.replace(/(\d{3})(\d{2})(\d{2})(\d{1})/, '$1 $2 $3 $4')
      
      case 'US':
      case 'CA':
        // Format américain: (201) 555-1234
        return cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
      
      default:
        // Format par défaut: espacer tous les 3 chiffres
        return cleanNumber.replace(/(\d{3})(?=\d)/g, '$1 ')
    }
  }

  // Obtenir des suggestions de correction
  static getSuggestions(phoneNumber: string, country: Country): string[] {
    const suggestions: string[] = []
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    // Vérifier les erreurs communes
    if (cleanNumber.startsWith('0') && country.code === 'FR') {
      // Pour la France, suggérer de garder le 0
      suggestions.push(`Gardez le 0 au début: ${cleanNumber}`)
    }
    
    if (cleanNumber.startsWith('0') && country.code === 'MA') {
      // Pour le Maroc, suggérer de supprimer le 0
      const withoutZero = cleanNumber.substring(1)
      suggestions.push(`Supprimez le 0 au début: ${withoutZero}`)
    }
    
    // Vérifier la longueur
    const expectedLength = country.example.length
    if (cleanNumber.length !== expectedLength) {
      suggestions.push(`Le numéro doit faire ${expectedLength} chiffres`)
    }
    
    // Vérifier le premier chiffre
    const firstDigit = cleanNumber.charAt(0)
    const exampleFirstDigit = country.example.charAt(0)
    if (firstDigit !== exampleFirstDigit) {
      suggestions.push(`Le numéro doit commencer par ${exampleFirstDigit}`)
    }
    
    return suggestions
  }
}