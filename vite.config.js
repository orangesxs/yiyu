import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 等子路径部署需要相对路径
  base: './',
  plugins: [vue()],
})
