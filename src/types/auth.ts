export interface User {
  id: string
  email: string
  name: string
  phone: string
  password: string // 🔑 Ajout du mot de passe
  country?: string
  avatar?: string
  createdAt: Date
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  country?: string
}

export interface AuthResponse {
  user: User
  token: string
}

