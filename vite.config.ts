import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function chromeExtensionPlugin(): Plugin {
  return {
    name: 'chrome-extension-helper',
    closeBundle() {
      // Copy manifest.json
      if (fs.existsSync('manifest.json')) {
        fs.copyFileSync('manifest.json', 'dist/manifest.json');
        console.log('[MailShield AI] Copied manifest.json to dist/');
      }

      // Copy assets folder
      if (fs.existsSync('src/assets')) {
        fs.mkdirSync('dist/assets', { recursive: true });
        for (const file of fs.readdirSync('src/assets')) {
          fs.copyFileSync(resolve('src/assets', file), resolve('dist/assets', file));
        }
        console.log('[MailShield AI] Copied assets to dist/assets/');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        contentScript: resolve(__dirname, 'src/content/contentScript.tsx'),
        serviceWorker: resolve(__dirname, 'src/background/serviceWorker.ts'),
        contentStyle: resolve(__dirname, 'src/content/contentStyle.css'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'contentScript') return 'contentScript.js';
          if (chunkInfo.name === 'serviceWorker') return 'serviceWorker.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'contentStyle.css') return 'contentStyle.css';
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
