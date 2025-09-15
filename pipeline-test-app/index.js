/**
 * Pipeline Test App
 * 
 * Super simple app to test pipeline installation and execution
 */
import FiberWise from 'fiberwise';

// Import FontAwesome CSS for icons
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import component files
import './src/pipeline-test-app.js';
import './src/pipeline-executions.js';

// Create a FIBER SDK instance for this app
export const FIBER = new FiberWise();

/**
 * Standard initialize function for app platform integration
 * @param {Object} appBridge - AppBridge instance from platform
 * @param {Object} manifest - The application manifest
 * @returns {Promise<boolean>} Success status
 */
export async function initialize(appBridge, manifest) {
  console.log('[PipelineTest] Initializing app...');
  FIBER.initialize(appBridge, manifest);
  return true;
}

/**
 * Standard render function for app platform integration
 * @param {HTMLElement} mountPoint - Where to mount the app
 */
export function render(mountPoint) {
  console.log('[PipelineTest] Rendering app...');
  const el = document.createElement('pipeline-test-app');
  mountPoint.appendChild(el);
}