import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase to avoid real network calls in tests
vi.mock('@/firebase/config', () => ({
  db: {},
  auth: {},
  functions: {},
}))
