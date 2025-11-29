// vite.config.js - Optimized & Fixed
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'utils': ['axios', 'react-toastify', 'react-dropzone']
        }
      }
    },
    minify: 'esbuild', // ✅ Use esbuild (faster & no extra dependency)
  },
  esbuild: {
    drop: ['console', 'debugger'], // ✅ Remove console logs in production
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material', 'axios']
  }
});
