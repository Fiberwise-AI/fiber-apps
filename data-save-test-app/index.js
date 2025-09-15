/**
 * Data Save Test App
 * 
 * A professional application that tests data saving functionality in FiberWise.
 * Demonstrates how to use agents to save data to platform data models with
 * real-time updates and comprehensive error handling.
 */
import FiberWise from 'fiberwise';

// Import FontAwesome CSS for icons
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import component files
import './src/components/data-test-app.js';

// Create a FIBER SDK instance for this app using modern constructor pattern
export const FIBER = new FiberWise();

/**
 * Standard initialize function for app platform integration
 * @param {Object} appBridge - AppBridge instance from platform
 * @param {Object} manifest - The application manifest
 * @returns {Promise<boolean>} Success status
 */
export async function initialize(appBridge, manifest) {
  console.log('[DataSaveTest] Initializing app...');
  FIBER.initialize(appBridge, manifest);
  return true;
}

/**
 * Standard render function for app platform integration
 * @param {HTMLElement} mountPoint - Where to mount the app
 */
export function render(mountPoint) {
  console.log('[DataSaveTest] Rendering app...');
  console.log('[DataSaveTest] Mount point:', mountPoint);
  console.log('[DataSaveTest] Mount point innerHTML before:', mountPoint.innerHTML);
  
  const el = document.createElement('data-test-app');
  console.log('[DataSaveTest] Created element:', el);
  console.log('[DataSaveTest] Element tagName:', el.tagName);
  console.log('[DataSaveTest] Custom elements defined:', customElements.get('data-test-app'));
  
  mountPoint.appendChild(el);
  
  console.log('[DataSaveTest] Mount point innerHTML after:', mountPoint.innerHTML);
  console.log('[DataSaveTest] Element parent:', el.parentNode);
  
  // Check if element is connected after a short delay
  setTimeout(() => {
    console.log('[DataSaveTest] Element connected:', el.isConnected);
    console.log('[DataSaveTest] Element shadowRoot:', el.shadowRoot);
    if (el.shadowRoot) {
      console.log('[DataSaveTest] ShadowRoot innerHTML:', el.shadowRoot.innerHTML.substring(0, 200) + '...');
    }
  }, 100);
}
