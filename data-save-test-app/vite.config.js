import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// Determine if watch mode is enabled from command line
const isWatchMode = process.argv.includes('--watch');
const iDevMode = process.argv.includes('dev');

console.log('🔧 [Vite Config] Build process started');
console.log('🔧 [Vite Config] Command line args:', process.argv);
console.log('🔧 [Vite Config] isWatchMode:', isWatchMode);
console.log('🔧 [Vite Config] iDevMode:', iDevMode);

// Read the app info from .fiber/local/app.json
let appId = 'data-save-test-app'; // Default or placeholder
let versionId = 'latest'; // Default version ID

try {
    const appInfoPath = path.resolve(__dirname, './.fiber/local/app.json');
    console.log('🔧 [Vite Config] Reading app info from:', appInfoPath);
    const appInfoContent = fs.readFileSync(appInfoPath, 'utf-8');
    const appInfo = JSON.parse(appInfoContent);
    appId = appInfo.app_id || appId;
    versionId = appInfo.last_version_id || appInfo.version_id || versionId;
    console.log('🔧 [Vite Config] App info loaded:', { appId, versionId });
} catch (e) {
    console.warn("🔧 [Vite Config] Could not read app info, using defaults:", { appId, versionId });
    console.warn("Make sure the app is installed: fiber app install . --to-instance local");
}

export default defineConfig({
  root: path.resolve(__dirname, './'), // Project root
  build: {
    // Only include watch configuration if --watch flag is used
    ...((isWatchMode || iDevMode) ? {
      watch: {
        include: ['**/*.js', '**/*.css', '**/*.html'], // Watch relevant files
        exclude: ['node_modules/**', 'dist/**', '**/app_bundles/**']
      },
      // Output directly to app_bundle with app_id and version_id
      outDir: (() => {
        const watchOutDir = path.resolve(__dirname, `../../app_bundles/apps/${appId}/${versionId}/dist`);
        console.log('🔧 [Vite Config] Watch/Dev mode - Output directory:', watchOutDir);
        return watchOutDir;
      })(),
    } : {
      // Standard build output directory
      outDir: (() => {
        const standardOutDir = path.resolve(__dirname, './dist');
        console.log('🔧 [Vite Config] Standard build mode - Output directory:', standardOutDir);
        return standardOutDir;
      })(),
    }),

    emptyOutDir: true, // Clean output directory before build
    rollupOptions: {
      input: {
        // Main entry point
        index: path.resolve(__dirname, 'index.js'),
      },
      output: {
        // Output format suitable for modern browsers and script modules
        format: 'es',
        // Consistent naming for the entry file
        entryFileNames: `[name].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
      },
    },
    // Include assets like HTML/CSS if imported directly
    assetsInclude: ['**/*.html?raw', '**/*.css?raw'],
    sourcemap: true, // Enable sourcemaps for easier debugging
    // Configure as a library build
    lib: {
      entry: path.resolve(__dirname, 'index.js'),
      formats: ['es'],
      fileName: (format) => `index.${format}.js` // Or just 'index.js' if only ES format
    }
  },
  server: {
    // Development server configuration
    port: 5559, // Different port from other apps
  },
  resolve: {
    // Define aliases if needed (e.g., for shared SDKs)
    alias: {
      '@': path.resolve(__dirname)
    }
  }
});
