// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage avec un vrai stockage en mémoire
const localStorageMock = (() => {
  let store = {}
  
  return {
    getItem: jest.fn((key) => {
      // Simuler localStorage pour encryption-service
      if (key === 'atiha_master_key') {
        return 'test-master-key-for-jest-tests-only-do-not-use-in-production'
      }
      return store[key] || null
    }),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    })
  }
})()

global.localStorage = localStorageMock

// Mock window pour crypto-js si nécessaire
global.window = global.window || {}

