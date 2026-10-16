import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

async function buildAll() {
  console.log('🚀 Starting MailShield AI Chrome Extension build...');

  // Ensure clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // 1. Build Popup (HTML, React, CSS)
  console.log('📦 Building Popup...');
  await build({
    configFile: false,
    plugins: [react()],
    base: '',
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: path.resolve('src/popup/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    }
  });

  // 2. Build Content Script as self-contained IIFE bundle (required for Chrome MV3 content scripts)
  console.log('📦 Building Content Script (Self-Contained IIFE)...');
  await build({
    configFile: false,
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/contentScript.tsx'),
        name: 'MailShieldContentScript',
        formats: ['iife'],
        fileName: () => 'contentScript.js'
      },
      rollupOptions: {
        output: {
          extend: true
        }
      }
    }
  });

  // 3. Build Background Service Worker (ES module)
  console.log('📦 Building Background Service Worker...');
  await build({
    configFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/serviceWorker.ts'),
        name: 'MailShieldServiceWorker',
        formats: ['es'],
        fileName: () => 'serviceWorker.js'
      }
    }
  });

  // 4. Build Scoped Content CSS using Vite/PostCSS
  console.log('📦 Building Content Stylesheet...');
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve('src/content/contentStyle.css'),
        output: {
          assetFileNames: 'contentStyle.css'
        }
      }
    }
  });

  // 5. Copy manifest.json, assets & demo stylesheet
  console.log('📋 Copying manifest.json, assets, and demo stylesheet...');
  fs.copyFileSync('manifest.json', 'dist/manifest.json');

  if (fs.existsSync('src/assets')) {
    fs.mkdirSync('dist/assets', { recursive: true });
    for (const file of fs.readdirSync('src/assets')) {
      fs.copyFileSync(path.resolve('src/assets', file), path.resolve('dist/assets', file));
    }
  }

  // Ensure demo directory has contentStyle.css available for direct preview
  if (fs.existsSync('dist/contentStyle.css')) {
    fs.mkdirSync('demo', { recursive: true });
    fs.copyFileSync('dist/contentStyle.css', 'demo/contentStyle.css');
  }

  console.log('✨ MailShield AI Build complete! Successfully packaged for Chrome Extension MV3.');
}

buildAll().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
