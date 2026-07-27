import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Separate config/entry/deploy pipeline from the customer-facing app
// (vite.config.js) - ops.ardoiseeduc.com is internal team tooling
// (CRM, BI, support, subscription management) and deliberately does
// not ship in the same bundle or release as the marketplace/SaaS
// product, even though it reuses that app's shared components and
// AuthContext via relative imports (see ops/src/App.jsx). No PWA
// plugin here - this is an internal tool, not something the team
// installs to a home screen.
export default defineConfig({
  root: 'ops',
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../ops-dist',
    emptyOutDir: true,
  },
})
