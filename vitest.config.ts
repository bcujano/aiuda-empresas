import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Node 24 carga archivos .env de forma nativa: las pruebas usan las mismas
// credenciales que la aplicación, sin una copia que se desincronice.
const archivoEnv = resolve(import.meta.dirname, '.env.local')
if (existsSync(archivoEnv)) {
  process.loadEnvFile(archivoEnv)
}

// Vitest no hereda los paths de tsconfig: el alias se declara aquí a propósito.
export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    testTimeout: 30000,
  },
})
