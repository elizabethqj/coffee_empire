import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // firebase-admin is mocked at the module level in tests
    // only the pure `aggregate` function is tested — no Firebase calls
  },
})
