import {
  sanitizeString,
  isSafeUrl,
  isStrongPassword,
  stripHtml,
} from '@/lib/input-validation'

describe('Input Validation', () => {
  describe('sanitizeString', () => {
    it('should sanitize basic XSS attempts', () => {
      const input = '<script>alert("XSS")</script>Hello'
      const result = sanitizeString(input)
      // La fonction échappe &, <, >, ", ', /
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;Hello')
      expect(result).not.toContain('<script>')
    })

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(1000)
      const result = sanitizeString(longString, { maxLen: 100 })
      expect(result.length).toBeLessThanOrEqual(100)
    })

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString(null as any)).toBe('')
    })

    it('should remove control characters', () => {
      const input = 'Hello\u0000World\u001F'
      const result = sanitizeString(input)
      expect(result).not.toContain('\u0000')
      expect(result).not.toContain('\u001F')
    })

    it('should escape HTML entities', () => {
      // La fonction échappe &, <, >, ", ', /
      expect(sanitizeString('<>&"')).toBe('&lt;&gt;&amp;&quot;')
    })
  })

  describe('isSafeUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true)
      expect(isSafeUrl('https://example.com')).toBe(true)
    })

    it('should reject javascript: URLs', () => {
      expect(isSafeUrl('javascript:alert("XSS")')).toBe(false)
      expect(isSafeUrl('javascript://example.com')).toBe(false)
    })

    it('should reject data: URLs (XSS risk)', () => {
      expect(isSafeUrl('data:text/html,<script>alert("XSS")</script>')).toBe(false)
    })

    it('should reject invalid URLs', () => {
      expect(isSafeUrl('not-a-url')).toBe(false)
      expect(isSafeUrl('')).toBe(false)
      expect(isSafeUrl(null as any)).toBe(false)
    })

    it('should accept URLs with paths and query params', () => {
      expect(isSafeUrl('https://example.com/path?query=value')).toBe(true)
    })
  })

  describe('isStrongPassword', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('MySecurePass123!@#')).toBe(true)
      expect(isStrongPassword('Password123!')).toBe(true)
    })

    it('should reject short passwords', () => {
      expect(isStrongPassword('Short1!')).toBe(false)
      expect(isStrongPassword('Pass1!')).toBe(false)
    })

    it('should require uppercase letters', () => {
      expect(isStrongPassword('mypassword123!@#')).toBe(false)
    })

    it('should require lowercase letters', () => {
      expect(isStrongPassword('MYPASSWORD123!@#')).toBe(false)
    })

    it('should require numbers', () => {
      expect(isStrongPassword('MyPassword!@#')).toBe(false)
    })

    it('should require special characters', () => {
      expect(isStrongPassword('MyPassword123')).toBe(false)
    })

    it('should allow custom minimum length', () => {
      expect(isStrongPassword('Pass1!', 6)).toBe(true)
      expect(isStrongPassword('Pass1!', 10)).toBe(false)
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello')
      expect(stripHtml('<div><span>Test</span></div>')).toBe('Test')
    })

    it('should handle fabricated HTML', () => {
      const input = '<script>alert("XSS")</script>Hello'
      expect(stripHtml(input)).toBe('alert("XSS")Hello')
    })

    it('should handle empty strings', () => {
      expect(stripHtml('')).toBe('')
      expect(stripHtml(null as any)).toBe('')
    })

    it('should handle text without HTML', () => {
      expect(stripHtml('Plain text')).toBe('Plain text')
    })
  })
})

