/**
 * Activation Chat App
 * 
 * A chat application that uses agent activations as the message store.
 * Demonstrates how to use agent activations for chat functionality.
 */
import FiberWise from 'fiberwise';

// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';

// Create a FIBER SDK instance for this app using new constructor pattern
export const FIBER = new FiberWise();


/**
 * Standard initialize function for app platform integration
 * @param {Object} appBridge - AppBridge instance from platform
 * @param {Object} manifest - The application manifest
 * @returns {Promise<boolean>} Success status
 */
export async function initialize(appBridge, manifest) {
  console.log('[ActivationChat] Initializing app...');
  FIBER.initialize(appBridge, manifest);
  return true;
}

/**
 * Standard render function for app platform integration
 * @param {HTMLElement} mountPoint - Where to mount the app
 */
export function render(mountPoint) {
  console.log('[ActivationChat] Rendering app...');
  console.log('[ActivationChat] Mount point:', mountPoint);
  console.log('[ActivationChat] Mount point innerHTML before:', mountPoint.innerHTML);
  
  const el = document.createElement('chat-app');
  console.log('[ActivationChat] Created element:', el);
  console.log('[ActivationChat] Element tagName:', el.tagName);
  console.log('[ActivationChat] Custom elements defined:', customElements.get('chat-app'));
  
  mountPoint.appendChild(el);
  
  console.log('[ActivationChat] Mount point innerHTML after:', mountPoint.innerHTML);
  console.log('[ActivationChat] Element parent:', el.parentNode);
  
  // Check if element is connected after a short delay
  setTimeout(() => {
    console.log('[ActivationChat] Element connected:', el.isConnected);
    console.log('[ActivationChat] Element shadowRoot:', el.shadowRoot);
  }, 100);
}

// Register the main component
import './chat-app.js';
