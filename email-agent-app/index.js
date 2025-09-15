/**
 * Email Agent App
 * 
 * A FiberWise application that connects to email accounts via OAuth
 * to search, view, compose, and analyze emails across different providers.
 */
import FiberWise from 'fiberwise';

// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';

// Create a FIBER SDK instance for this app using new constructor pattern
// Auto-detection: new FiberWise() would automatically use window.location.origin + "/api/v1"
export const FIBER = new FiberWise();

/**
 * Standard initialize function for app platform integration
 * @param {Object} appBridge - AppBridge instance from platform
 * @param {Object} manifest - The application manifest
 * @returns {Promise<boolean>} Success status
 */
export async function initialize(appBridge, manifest) {
  console.log('[EmailAgent] Initialize called with manifest:', manifest);
  console.log('[EmailAgent] Manifest app_slug:', manifest.app_slug);
  FIBER.initialize(appBridge, manifest);
  
  // Listen for route changes from AppBridge router
  if (appBridge && appBridge._router) {
    // Listen for route changes using popstate
    window.addEventListener('popstate', () => {
      // Get current route from AppBridge instead of window.location
      const currentRoute = appBridge._router ? appBridge._router.getCurrentPath() : '/';
      console.log('[EmailAgent] Route changed:', currentRoute);
      updateContentForRoute(currentRoute);
    });
    
    // Also listen for programmatic navigation by overriding navigateTo
    const originalNavigateTo = appBridge._router.navigateTo;
    appBridge._router.navigateTo = function(route) {
      console.log('[EmailAgent] Programmatic navigation to:', route);
      const result = originalNavigateTo.call(this, route);
      // Update content after navigation
      setTimeout(() => updateContentForRoute(route), 0);
      return result;
    };
  }
  
  return true;
}



// Global reference to mount point for route updates
let globalMountPoint = null;

/**
 * Update content based on route
 * @param {string} route - Current route
 */
function updateContentForRoute(route) {
  if (!globalMountPoint) return;
  
  console.log('[EmailAgent] Updating content for route:', route);
  
  // Clear existing content
  globalMountPoint.innerHTML = '';
  
  // Always mount main app component
  const appEl = document.createElement('email-agent-app');
  globalMountPoint.appendChild(appEl);
  
  // Mount additional components based on route
  if (route.includes('/settings')) {
    const settingsEl = document.createElement('email-settings');
    globalMountPoint.appendChild(settingsEl);
  }
}

/**
 * Standard render function for app platform integration
 * @param {HTMLElement} mountPoint - Where to mount the app
 */
export function render(mountPoint) {
  console.log('[EmailAgent] Rendering app...');
  
  // Store mount point reference for route updates
  globalMountPoint = mountPoint;
  
  // Get current route from FIBER if available, otherwise default to root
  const currentRoute = FIBER._appBridge?._router?.getCurrentPath() || '/';
  updateContentForRoute(currentRoute);
}

// Register the components
import './src/components/email-app.js';
import './src/components/email-search.js';
import './src/components/email-detail.js';
import './src/components/email-detail-page.js';
import './src/components/email-compose.js';
import './src/components/email-settings.js';
import './src/components/provider-connection.js';
import './src/components/label-manager.js';
import './src/components/prompt-templates.js';
import './src/components/email-analytics.js';
import './src/components/email-connections.js';
import './src/services/email-service.js';
import './src/services/data-service.js';

