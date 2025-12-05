export interface Country {
  code: string
  name: string
  phoneCode: string
  flag: string
  phonePattern: RegExp
  example: string
}

export interface PhoneValidation {
  isValid: boolean
  formattedNumber: string
  country: Country | null
  error?: string
}

export interface PhoneInputProps {
  value: string
  onChange: (value: string, country: Country | null) => void
  onValidationChange?: (validation: PhoneValidation) => void
  placeholder?: string
  className?: string
}