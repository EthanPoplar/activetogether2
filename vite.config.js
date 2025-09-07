import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // Set the base path so assets and routing work
  // when deployed under a subpath (e.g. GitHub Pages)
  base: '/activetogether2/',
  plugins: [vue()],
})
