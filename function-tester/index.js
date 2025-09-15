/**
 * Function Tester App
 * 
 * Main entry point that initializes the app with an isolated FiberWise SDK instance.
 */
import fiber from 'fiberwise';

// Create a clean SDK instance with no initial configuration
export const FIBER = fiber.createInstance({baseUrl: window.location.origin+ "/api/v1"});

// Register the main component
import './function-test-app.js';

/**
 * Standard initialize function for app platform integration.
 * @param {Object} appBridge - AppBridge instance from platform.
 * @param {Object} manifest - The application manifest loaded by the platform.
 * @returns {Promise<boolean>} Success status.
 */
export async function initialize(appBridge, manifest) {
  console.log('[FunctionTester] Initializing app...');
  FIBER.initialize(appBridge, manifest);
  return true;
}
/**
 * Standard render function for app platform integration.
 * @param {HTMLElement} mountPoint - Where to mount the app.
 */
export function render(mountPoint) {
  console.log('[FunctionTester] Rendering app...');
  const el = document.createElement('function-test-app');
  // Pass the fiber instance to the component if needed
  el.fiber = FIBER;
  
  mountPoint.appendChild(el);
}