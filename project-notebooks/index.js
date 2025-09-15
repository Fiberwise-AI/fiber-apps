console.log('[App] index.js loaded');

/**
 * Project Container App Entry Point
 */

// Import app components


import './app/ui/pages/project-page.js';
import './app/ui/pages/new-project-page.js';
import './app/ui/pages/project-dashboard.js';
import './app/ui/pages/notebook-page.js';
import './app/ui/pages/new-notebook-page.js'; 
import './app/ui/components/notebook-list.js';
import './app/ui/components/project-list-nav.js';


// Import app initialization and API
import { initializeProjectContainerApp } from './app/app-init.js';

// Import DynamicData SDK
import {DynamicData, AppState} from 'fiberwise';
const APPSTATE = AppState
export { APPSTATE };

/**
 * Standard initialize function for app platform integration
 * @param {Object} appBridge - AppBridge instance from platform
 * @returns {Promise<boolean>} Success status
 */
export async function initialize(appBridge, manifest) {
  try {
    console.log(APPSTATE);
    console.log('[App] Initializing with DynamicData SDK');
    APPSTATE.appId = manifest.id ;
    // Create a DynamicData client for the application
    // Store the client in APPSTATE for easy access across the app
    APPSTATE.dynamicDataClient = new DynamicData({
      baseUrl: window.location.origin,
      appId: manifest.id
    });
    APPSTATE.router = appBridge._router;

    
    // Initialize the app with AppBridge and manifest
    const success = await initializeProjectContainerApp(appBridge, manifest);
    console.log(`[App] Initialization result: ${success}`);
    if (success) {
      // Load models schema to populate APPSTATE
      try {
        const models = await APPSTATE.dynamicDataClient.getModels();
        console.log(`[App] Retrieved ${models.length} models from DynamicData`, models);
        APPSTATE.setModels(models);
        console.log(`[App] Loaded ${models.length} models from schema`);
      } catch (error) {
        console.warn('[App] Could not load models schema:', error);
        // Continue even if models couldn't be loaded
      }
    }
    //appBridge._router.start();
    // Emit a custom event using AppBridge
    appBridge.emit('appInitialized', { 
      appId: manifest.id || 'app_project_container',
      hasSDK: true
    });
    
    return success;
  } catch (error) {
    console.error('[App] Initialization error:', error);
    appBridge.emit('appInitialized', { 
      appId: manifest.id || 'app_project_container',
      error: error.message
    });
    return false;
  }
}

