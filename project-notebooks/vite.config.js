import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// Determine if watch mode is enabled from command line
const isWatchMode = process.argv.includes('--watch');

export default defineConfig({
  root: path.resolve(__dirname, './'),
  build: {
    // Only include watch configuration if --watch flag is used
    ...(isWatchMode ? {
      watch: {
        include: ['app/**','index.js'], 
        exclude: ['node_modules/**']
      },
      outDir: path.resolve(__dirname, './dist'),
    } : {
      outDir: path.resolve(__dirname, './dist')
    }),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Specify the index.js entry point explicitly
        index: path.resolve(__dirname, 'index.js'),
      },
      output: {
        // Move entry files to the root of the output directory
        entryFileNames: `[name].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      },
      external: ['fiberwise']
    },
    assetsInclude: ['**/*.json', '**/*.html', '**/*.css'],
    sourcemap: false,
    // Add this to ensure Vite properly treats the entry file
    lib: {
      entry: path.resolve(__dirname, 'index.js'),
      formats: ['es'],
      fileName: 'index'
    }
  },
  server: {
    port: 5557,
  },
  plugins: [
    // Add HTML import support
    {
      name: 'html-loader',
      transform(_, id) {
        if (id.endsWith('.html')) {
          return `export default ${JSON.stringify(fs.readFileSync(id, 'utf-8'))}`;
        }
      }
    }
  ],

  resolve: {
    alias: {
      'fiberwise': path.resolve(__dirname, '../../../FiberWise-SDK/js/index.js')
    }
  }
});
