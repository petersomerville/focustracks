import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill Web APIs for Next.js API routes testing
// @ts-expect-error - Node.js TextEncoder/TextDecoder types don't exactly match global types
global.TextEncoder = TextEncoder
// @ts-expect-error - Node.js TextEncoder/TextDecoder types don't exactly match global types
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock window.matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  } as Storage
  global.localStorage = localStorageMock
}

// Mock structured logger to keep test output clean
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    dbQuery: jest.fn(),
    userAction: jest.fn(),
    performance: jest.fn(),
  }),
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    dbQuery: jest.fn(),
    userAction: jest.fn(),
    performance: jest.fn(),
  }
}))
