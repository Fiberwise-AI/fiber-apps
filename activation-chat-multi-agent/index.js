/**
 * Activation Chat App
 * 
 * A chat application that uses agent activations as the message store.
 * Demonstrates how to use agent activations for chat functionality.
 */
import FiberWise from 'fiberwise';

// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';

// Create a FIBER SDK instance for this app using modern constructor pattern
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
  const el = document.createElement('chat-app-multi');
  mountPoint.appendChild(el);
}

// Register the main component
import './chat-app.js';
