import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Ép toàn bộ ứng dụng dùng bản browser của path
      path: 'path-browserify',
    },
  },
  define: {
    // esbuild/Vite chỉ chấp nhận literal/identifier — biểu thức ternary sẽ làm build fail
    global: 'window',
    'process.env': {},
  },
  optimizeDeps: {
    // Ép Vite xử lý các module commonjs cũ của kuromoji
    include: ['kuroshiro', 'kuroshiro-analyzer-kuromoji'],
  },
})