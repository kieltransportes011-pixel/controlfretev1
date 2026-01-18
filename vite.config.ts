import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3003,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-control-frete.png'],
        manifest: {
          name: 'Control Frete',
          short_name: 'ControlFrete',
          description: 'Gestão Inteligente de Frotas e Fretes',
          theme_color: '#1F3A5F',
          start_url: '/',
          display: 'standalone',
          background_color: '#F4F6F8',
          icons: [
            {
              src: 'logo-control-frete.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo-control-frete.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'logo-control-frete.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'ui-icons': ['lucide-react'],
          }
        }
      }
    }
  };
});
