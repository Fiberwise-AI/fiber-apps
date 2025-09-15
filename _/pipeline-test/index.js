/**
 * Pipeline Test App - Entry Point
 * 
 * Simple FiberWise app for testing pipeline execution with manual triggers.
 * This app provides a user interface to execute pipelines and view results.
 */

// Import the main app component
import './components/pipeline-test-app.js';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Pipeline Test App initialized');
    
    // Add any global app initialization here
    if (window.FiberWise) {
        console.log('FiberWise SDK available');
        
        // Register app with FiberWise if needed
        window.FiberWise.registerApp({
            name: 'Pipeline Test',
            version: '0.0.1',
            component: 'pipeline-test-app'
        });
    }
});

// Export app metadata for FiberWise
export const AppInfo = {
    name: 'Pipeline Test',
    version: '0.0.1',
    description: 'Simple pipeline testing app with manual triggers',
    author: 'FiberWise',
    main_component: 'pipeline-test-app'
};

// Global error handler for the app
window.addEventListener('error', function(event) {
    console.error('Pipeline Test App Error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Pipeline Test App Unhandled Promise Rejection:', event.reason);
});