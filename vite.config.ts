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
        // O script de registro não é mais auto-injetado no HTML — é chamado
        // manualmente em index.tsx, só fora do app nativo (ver comentário lá).
        // Dentro do Capacitor/WebView, um Service Worker registrado podia
        // ficar servindo uma versão em cache do app mesmo depois de instalar
        // uma atualização nova via Play Store — o app nativo já tem seu
        // próprio mecanismo de atualização (a instalação do APK em si), não
        // precisa (e não deve) do cache de PWA por cima.
        injectRegister: null,
        includeAssets: ['pwa-icon-512.png', 'pwa-icon-192.png'],
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
              src: 'pwa-icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-icon-512.png',
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
