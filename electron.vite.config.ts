import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    },
    envPrefix: ['VITE_', 'ELECTRON_'],
    define: {
      'process.env.VITE_API_URL':
        process.env.NODE_ENV === 'development'
          ? JSON.stringify('http://0.0.0.0:3000')
          : JSON.stringify('http://91.108.122.35:3000')
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    envPrefix: ['VITE_', 'ELECTRON_']
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    server: {
      host: '0.0.0.0',
      cors: true,
      proxy: {
        '/api': {
          target: 'http://0.0.0.0:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    envPrefix: ['VITE_', 'ELECTRON_'],
    define: {
      'process.env.VITE_API_URL':
        process.env.NODE_ENV === 'development'
          ? JSON.stringify('http://0.0.0.0:3000')
          : JSON.stringify('http://91.108.122.35:3000')
    }
  }
})
