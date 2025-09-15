/**
 * Knowledge Wiki App
 * 
 * A knowledge base for documentation and information sharing
 */
import FiberWise from 'fiberwise';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Create a FIBER SDK instance for this app
export const FIBER = new FiberWise();

/**
 * Standard initialize function for app platform integration
 */
export async function initialize(appBridge, manifest) {
  console.log('[WikiApp] Initializing app...');
  FIBER.initialize(appBridge, manifest);
  return true;
}

/**
 * Standard render function for app platform integration
 */
export function render(mountPoint) {
  console.log('[WikiApp] Rendering app...');
  
  const el = document.createElement('wiki-home');
  mountPoint.appendChild(el);
}

// Register all components
import { WikiHome } from './src/components/wiki-home.js';
import { CreatePage } from './src/components/create-page.js';
import { AllPages } from './src/components/all-pages.js';
import { WikiPage } from './src/components/wiki-page.js';

// Only register if not already registered
if (!customElements.get('wiki-home')) {
  customElements.define('wiki-home', WikiHome);
}
if (!customElements.get('create-page')) {
  customElements.define('create-page', CreatePage);
}
if (!customElements.get('all-pages')) {
  customElements.define('all-pages', AllPages);
}
if (!customElements.get('wiki-page')) {
  customElements.define('wiki-page', WikiPage);
}