/**
 * Pipeline Tester Pro - Main Entry Point
 * 
 * Advanced pipeline testing and development platform for FiberWise
 * 
 * Features:
 * - Real-time pipeline execution monitoring
 * - Comprehensive testing and validation
 * - Performance analytics and optimization
 * - Template-based test scenarios
 * - Visual pipeline builder integration
 */

import fiber from 'fiberwise';

// Initialize FiberWise SDK
export const FIBER = new fiber();

// Import main components
import './components/pipeline-tester-pro.js';
import './components/pipeline-builder.js';
import './components/pipeline-monitor.js';

// Import utility modules
import './components/utils/pipeline-executor.js';
import './components/utils/test-data-generator.js';
import './components/utils/performance-analyzer.js';
import './components/utils/template-manager.js';

// Global app configuration
export const APP_CONFIG = {
  name: 'Pipeline Tester Pro',
  version: '1.0.0',
  features: {
    realTimeMonitoring: true,
    advancedAnalytics: true,
    templateSystem: true,
    visualBuilder: true,
    performanceOptimization: true
  },
  defaults: {
    executionTimeout: 300000, // 5 minutes
    maxConcurrentTests: 5,
    defaultPaginationLimit: 20,
    autoRefreshInterval: 5000 // 5 seconds
  }
};

// Initialize application services
class PipelineTesterProApp {
  constructor() {
    this.services = {
      executor: null,
      analyzer: null,
      templateManager: null,
      dataGenerator: null
    };
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      console.log('[PipelineTesterPro] Initializing application services...');
      
      // Initialize core services
      await this.initializeServices();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('[PipelineTesterPro] Application initialized successfully');
      
    } catch (error) {
      console.error('[PipelineTesterPro] Failed to initialize application:', error);
      throw error;
    }
  }

  async initializeServices() {
    const { PipelineExecutor } = await import('./components/utils/pipeline-executor.js');
    const { PerformanceAnalyzer } = await import('./components/utils/performance-analyzer.js');
    const { TemplateManager } = await import('./components/utils/template-manager.js');
    const { TestDataGenerator } = await import('./components/utils/test-data-generator.js');

    this.services.executor = new PipelineExecutor(FIBER);
    this.services.analyzer = new PerformanceAnalyzer(FIBER);
    this.services.templateManager = new TemplateManager(FIBER);
    this.services.dataGenerator = new TestDataGenerator();

    // Initialize each service
    await Promise.all([
      this.services.executor.init(),
      this.services.analyzer.init(),
      this.services.templateManager.init(),
      this.services.dataGenerator.init()
    ]);
  }

  setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[PipelineTesterPro] Unhandled promise rejection:', event.reason);
      this.logError('Unhandled Promise Rejection', event.reason);
    });

    window.addEventListener('error', (event) => {
      console.error('[PipelineTesterPro] Global error:', event.error);
      this.logError('Global Error', event.error);
    });
  }

  setupPerformanceMonitoring() {
    // Monitor performance metrics
    if ('performance' in window && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.debug(`[Performance] ${entry.name}: ${entry.duration}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }

  logError(context, error) {
    const errorData = {
      context,
      message: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a production environment, you might want to send this to a logging service
    console.error('[PipelineTesterPro] Error logged:', errorData);
  }

  getService(serviceName) {
    return this.services[serviceName];
  }
}

// Create global app instance
export const APP_INSTANCE = new PipelineTesterProApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => APP_INSTANCE.init());
} else {
  APP_INSTANCE.init();
}

// Export for use by components
export { APP_INSTANCE as default };