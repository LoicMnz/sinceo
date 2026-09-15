import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function normalizedBasePath(value: string | undefined): string {
  if (!value) return '/'
  const path = value.trim()
  if (!path || path === '/') return '/'
  return `/${path.replace(/^\/+|\/+$/g, '')}/`
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages supplies its repository path; local development stays at /.
  base: normalizedBasePath(process.env.VITE_BASE_PATH),
  plugins: [react()],
})
