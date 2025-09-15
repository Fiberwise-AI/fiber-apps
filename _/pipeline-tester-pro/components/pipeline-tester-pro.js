/**
 * Pipeline Tester Pro - Main Component
 * 
 * Advanced pipeline testing interface with real-time monitoring,
 * template management, and comprehensive analytics
 */

import { FIBER, APP_CONFIG, APP_INSTANCE } from '../index.js';

class PipelineTesterPro extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.state = {
      isLoggedIn: false,
      currentUser: null,
      pipelines: [],
      testSessions: [],
      templates: [],
      executionLogs: [],
      selectedPipeline: null,
      selectedTemplate: null,
      isExecuting: false,
      currentSession: null,
      filters: {
        status: 'all',
        timeRange: '24h',
        pipelineId: 'all'
      },
      view: 'dashboard' // dashboard, execution, templates, analytics
    };

    // UI elements will be bound after render
    this.elements = {};
    
    // Performance tracking
    this.performanceMetrics = {
      renderStart: null,
      renderEnd: null,
      lastUpdate: null
    };
  }

  connectedCallback() {
    this.performanceMetrics.renderStart = performance.now();
    this.init();
  }

  async init() {
    try {
      // Wait for app services to be ready
      await APP_INSTANCE.init();
      
      // Check authentication
      await this.checkAuthentication();
      
      if (this.state.isLoggedIn) {
        // Load initial data
        await this.loadInitialData();
        
        // Render the interface
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start real-time updates
        this.startRealTimeUpdates();
      } else {
        this.renderLogin();
      }
      
      this.performanceMetrics.renderEnd = performance.now();
      console.log(`[PipelineTesterPro] Initialization completed in ${this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart}ms`);
      
    } catch (error) {
      console.error('[PipelineTesterPro] Initialization failed:', error);
      this.renderError('Failed to initialize Pipeline Tester Pro', error);
    }
  }

  async checkAuthentication() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        this.state.currentUser = await response.json();
        this.state.isLoggedIn = true;
      } else {
        this.state.isLoggedIn = false;
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Auth check failed:', error);
      this.state.isLoggedIn = false;
    }
  }

  async loadInitialData() {
    const startTime = performance.now();
    
    try {
      // Load data in parallel for better performance
      const [pipelinesResp, sessionsResp, templatesResp, logsResp] = await Promise.all([
        this.loadPipelines(),
        this.loadTestSessions(),
        this.loadTemplates(),
        this.loadExecutionLogs()
      ]);

      console.log(`[PipelineTesterPro] Initial data loaded in ${performance.now() - startTime}ms`);
      
    } catch (error) {
      console.error('[PipelineTesterPro] Failed to load initial data:', error);
      throw error;
    }
  }

  async loadPipelines() {
    try {
      const response = await fetch('/api/v1/pipelines', {
        credentials: 'include'
      });
      
      if (response.ok) {
        this.state.pipelines = await response.json();
        return this.state.pipelines;
      } else {
        throw new Error(`Failed to load pipelines: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Error loading pipelines:', error);
      this.state.pipelines = [];
      return [];
    }
  }

  async loadTestSessions() {
    try {
      const response = await fetch('/api/v1/data/test_sessions?limit=50&sort=created_at:desc', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.state.testSessions = data.items || [];
        return this.state.testSessions;
      } else {
        throw new Error(`Failed to load test sessions: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Error loading test sessions:', error);
      this.state.testSessions = [];
      return [];
    }
  }

  async loadTemplates() {
    try {
      const response = await fetch('/api/v1/data/test_templates?limit=100&sort=created_at:desc', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.state.templates = data.items || [];
        return this.state.templates;
      } else {
        throw new Error(`Failed to load templates: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Error loading templates:', error);
      this.state.templates = [];
      return [];
    }
  }

  async loadExecutionLogs() {
    try {
      const response = await fetch('/api/v1/data/execution_logs?limit=100&sort=started_at:desc', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.state.executionLogs = data.items || [];
        return this.state.executionLogs;
      } else {
        throw new Error(`Failed to load execution logs: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Error loading execution logs:', error);
      this.state.executionLogs = [];
      return [];
    }
  }

  renderLogin() {
    this.shadowRoot.innerHTML = `
      <style>
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .login-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .login-icon {
          font-size: 3rem;
          color: #667eea;
          margin-bottom: 1rem;
        }
        .login-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .login-subtitle {
          color: #6b7280;
          margin-bottom: 2rem;
        }
        .login-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 500;
          text-decoration: none;
          display: inline-block;
          transition: background-color 0.2s;
        }
        .login-btn:hover {
          background: #5a67d8;
        }
      </style>
      <div class="login-container">
        <div class="login-card">
          <div class="login-icon">🚀</div>
          <h2 class="login-title">Pipeline Tester Pro</h2>
          <p class="login-subtitle">Advanced pipeline testing and development platform</p>
          <a href="/auth/login" class="login-btn">Login to Continue</a>
        </div>
      </div>
    `;
  }

  renderError(title, error) {
    this.shadowRoot.innerHTML = `
      <style>
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f9fafb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .error-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
          border-left: 4px solid #ef4444;
        }
        .error-icon {
          font-size: 3rem;
          color: #ef4444;
          margin-bottom: 1rem;
        }
        .error-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .error-message {
          color: #6b7280;
          margin-bottom: 1rem;
        }
        .error-details {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 1rem;
          text-align: left;
          font-family: monospace;
          font-size: 0.875rem;
          color: #4b5563;
          margin: 1rem 0;
        }
        .retry-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }
      </style>
      <div class="error-container">
        <div class="error-card">
          <div class="error-icon">⚠️</div>
          <h2 class="error-title">${title}</h2>
          <p class="error-message">An error occurred while loading the application.</p>
          <div class="error-details">${error.message || error}</div>
          <button class="retry-btn" onclick="window.location.reload()">Retry</button>
        </div>
      </div>
    `;
  }

  render() {
    const viewContent = this.renderView();
    
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      <div class="app-container">
        ${this.renderHeader()}
        ${this.renderNavigation()}
        <main class="main-content">
          ${viewContent}
        </main>
        ${this.renderStatusBar()}
      </div>
    `;

    // Bind UI elements
    this.bindElements();
    
    this.performanceMetrics.lastUpdate = performance.now();
  }

  renderView() {
    switch (this.state.view) {
      case 'dashboard':
        return this.renderDashboard();
      case 'execution':
        return this.renderExecution();
      case 'templates':
        return this.renderTemplates();
      case 'analytics':
        return this.renderAnalytics();
      default:
        return this.renderDashboard();
    }
  }

  renderHeader() {
    return `
      <header class="app-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="app-title">
              <span class="app-icon">🚀</span>
              Pipeline Tester Pro
            </h1>
            <div class="header-status">
              <span class="status-dot ${this.state.isExecuting ? 'executing' : 'idle'}"></span>
              <span class="status-text">${this.state.isExecuting ? 'Executing' : 'Ready'}</span>
            </div>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-name">${this.state.currentUser?.email || 'User'}</span>
              <div class="user-avatar">${this.state.currentUser?.email?.[0]?.toUpperCase() || 'U'}</div>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  renderNavigation() {
    const views = [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'execution', label: 'Execution', icon: '🚀' },
      { key: 'templates', label: 'Templates', icon: '📝' },
      { key: 'analytics', label: 'Analytics', icon: '📈' }
    ];

    return `
      <nav class="app-navigation">
        <div class="nav-content">
          ${views.map(view => `
            <button class="nav-item ${this.state.view === view.key ? 'active' : ''}" 
                    data-view="${view.key}">
              <span class="nav-icon">${view.icon}</span>
              <span class="nav-label">${view.label}</span>
            </button>
          `).join('')}
        </div>
      </nav>
    `;
  }

  renderDashboard() {
    const stats = this.calculateDashboardStats();
    
    return `
      <div class="dashboard-view">
        <div class="dashboard-header">
          <h2>Pipeline Testing Dashboard</h2>
          <p class="dashboard-subtitle">Monitor and manage your pipeline testing activities</p>
        </div>
        
        <div class="stats-grid">
          ${this.renderStatsCards(stats)}
        </div>
        
        <div class="dashboard-content">
          <div class="dashboard-left">
            ${this.renderQuickActions()}
            ${this.renderRecentSessions()}
          </div>
          <div class="dashboard-right">
            ${this.renderPipelinesList()}
            ${this.renderSystemStatus()}
          </div>
        </div>
      </div>
    `;
  }

  calculateDashboardStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recent = this.state.executionLogs.filter(log => new Date(log.started_at) > last24h);
    const completed = recent.filter(log => log.status === 'completed');
    const failed = recent.filter(log => log.status === 'failed');
    
    return {
      totalPipelines: this.state.pipelines.length,
      activePipelines: this.state.pipelines.filter(p => p.is_active).length,
      totalSessions: this.state.testSessions.length,
      recentExecutions: recent.length,
      successRate: recent.length > 0 ? Math.round((completed.length / recent.length) * 100) : 0,
      avgExecutionTime: completed.length > 0 ? 
        Math.round(completed.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / completed.length) : 0
    };
  }

  renderStatsCards(stats) {
    const cards = [
      { title: 'Total Pipelines', value: stats.totalPipelines, icon: '⚙️', color: 'blue' },
      { title: 'Active Pipelines', value: stats.activePipelines, icon: '✅', color: 'green' },
      { title: 'Test Sessions', value: stats.totalSessions, icon: '📋', color: 'purple' },
      { title: 'Recent Executions', value: stats.recentExecutions, icon: '🚀', color: 'orange' },
      { title: 'Success Rate', value: `${stats.successRate}%`, icon: '📈', color: 'green' },
      { title: 'Avg Execution Time', value: `${stats.avgExecutionTime}ms`, icon: '⏱️', color: 'blue' }
    ];

    return cards.map(card => `
      <div class="stats-card ${card.color}">
        <div class="stats-icon">${card.icon}</div>
        <div class="stats-content">
          <div class="stats-value">${card.value}</div>
          <div class="stats-title">${card.title}</div>
        </div>
      </div>
    `).join('');
  }

  renderQuickActions() {
    return `
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
          <button class="action-btn primary" data-action="create-session">
            <span class="btn-icon">➕</span>
            New Test Session
          </button>
          <button class="action-btn secondary" data-action="quick-test">
            <span class="btn-icon">⚡</span>
            Quick Test
          </button>
          <button class="action-btn secondary" data-action="load-template">
            <span class="btn-icon">📄</span>
            Load Template
          </button>
        </div>
      </div>
    `;
  }

  getStyles() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f8fafc;
      }

      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .app-header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1400px;
        margin: 0 auto;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .app-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .app-icon {
        font-size: 1.75rem;
      }

      .header-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        background: #f1f5f9;
        border-radius: 20px;
        font-size: 0.875rem;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
      }

      .status-dot.executing {
        background: #f59e0b;
        animation: pulse 2s infinite;
      }

      .status-dot.idle {
        background: #10b981;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .user-name {
        font-size: 0.875rem;
        color: #64748b;
      }

      .user-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        font-size: 0.875rem;
      }

      .app-navigation {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 0 2rem;
      }

      .nav-content {
        display: flex;
        max-width: 1400px;
        margin: 0 auto;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        border: none;
        background: none;
        color: #64748b;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .nav-item:hover {
        color: #3b82f6;
        background: #f8fafc;
      }

      .nav-item.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
      }

      .nav-icon {
        font-size: 1rem;
      }

      .main-content {
        flex: 1;
        overflow: auto;
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
      }

      .dashboard-view {
        space-y: 2rem;
      }

      .dashboard-header {
        margin-bottom: 2rem;
      }

      .dashboard-header h2 {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      .dashboard-subtitle {
        color: #64748b;
        font-size: 1rem;
        margin: 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stats-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border-left: 4px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .stats-card.blue { border-left-color: #3b82f6; }
      .stats-card.green { border-left-color: #10b981; }
      .stats-card.purple { border-left-color: #8b5cf6; }
      .stats-card.orange { border-left-color: #f59e0b; }

      .stats-icon {
        font-size: 2rem;
        opacity: 0.8;
      }

      .stats-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
      }

      .stats-title {
        font-size: 0.875rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .dashboard-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      .quick-actions {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
      }

      .quick-actions h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        text-align: left;
      }

      .action-btn.primary {
        background: #3b82f6;
        color: white;
      }

      .action-btn.primary:hover {
        background: #2563eb;
      }

      .action-btn.secondary {
        background: #f1f5f9;
        color: #475569;
      }

      .action-btn.secondary:hover {
        background: #e2e8f0;
      }

      .btn-icon {
        font-size: 1rem;
      }

      @media (max-width: 768px) {
        .app-header {
          padding: 1rem;
        }

        .main-content {
          padding: 1rem;
        }

        .dashboard-content {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .nav-item {
          padding: 0.75rem 1rem;
        }

        .nav-label {
          display: none;
        }
      }
    `;
  }

  setupEventListeners() {
    // Navigation
    this.shadowRoot.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    // Quick actions
    this.shadowRoot.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });
  }

  switchView(view) {
    this.state.view = view;
    this.render();
  }

  handleQuickAction(action) {
    switch (action) {
      case 'create-session':
        this.createNewSession();
        break;
      case 'quick-test':
        this.runQuickTest();
        break;
      case 'load-template':
        this.loadTemplate();
        break;
    }
  }

  async createNewSession() {
    try {
      console.log('[PipelineTesterPro] Creating new test session...');
      
      // Generate test data using Python function
      const testDataResult = await FIBER.func.activate('generateTestData', {
        data_type: 'json_objects',
        count: 10,
        complexity: 'medium'
      });

      if (testDataResult.success) {
        console.log('[PipelineTesterPro] Test data generated:', testDataResult.generated_data);
        
        // Create session with generated data
        const sessionData = {
          session_name: `Test Session ${new Date().toISOString()}`,
          pipeline_id: this.state.selectedPipeline?.id || 'default',
          test_config: {
            data_type: 'json_objects',
            count: 10,
            complexity: 'medium'
          },
          input_data: testDataResult.generated_data
        };

        // Save session via API
        const response = await fetch('/api/v1/data/test_sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sessionData)
        });

        if (response.ok) {
          const session = await response.json();
          this.state.testSessions.unshift(session);
          this.render();
          console.log('[PipelineTesterPro] Session created successfully');
        }
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Failed to create session:', error);
    }
  }

  async runQuickTest() {
    try {
      console.log('[PipelineTesterPro] Running quick test...');
      this.state.isExecuting = true;
      this.render();

      // Generate small test dataset using Python function
      const testDataResult = await FIBER.func.activate('generateTestData', {
        data_type: 'user_messages',
        count: 5,
        complexity: 'simple'
      });

      if (testDataResult.success) {
        // Process data using Python agent
        const processResult = await FIBER.agent.activate('data_processor_agent', {
          mode: 'analyze',
          data: testDataResult.generated_data
        });

        // Analyze performance using Python function
        const performanceResult = await FIBER.func.activate('analyzePipelinePerformance', {
          execution_logs: [processResult],
          analysis_type: 'timing'
        });

        console.log('[PipelineTesterPro] Quick test completed:', {
          testData: testDataResult.generated_data,
          processResult: processResult,
          performance: performanceResult
        });
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Quick test failed:', error);
    } finally {
      this.state.isExecuting = false;
      this.render();
    }
  }

  async loadTemplate() {
    try {
      console.log('[PipelineTesterPro] Loading template...');
      
      // For now, use a simple template that generates data
      const templateConfig = {
        data_type: 'json_objects',
        count: 20,
        complexity: 'complex'
      };

      const result = await FIBER.func.activate('generateTestData', templateConfig);
      
      if (result.success) {
        console.log('[PipelineTesterPro] Template data loaded:', result.generated_data);
        
        // Switch to execution view to show the loaded data
        this.state.view = 'execution';
        this.state.selectedTemplate = {
          name: 'Default Template',
          config: templateConfig,
          data: result.generated_data
        };
        this.render();
      }
    } catch (error) {
      console.error('[PipelineTesterPro] Failed to load template:', error);
    }
  }

  startRealTimeUpdates() {
    // Update data every 5 seconds
    setInterval(() => {
      if (!this.state.isExecuting) {
        this.loadExecutionLogs();
      }
    }, APP_CONFIG.defaults.autoRefreshInterval);
  }

  bindElements() {
    // Bind frequently accessed elements
    this.elements = {
      header: this.shadowRoot.querySelector('.app-header'),
      navigation: this.shadowRoot.querySelector('.app-navigation'),
      mainContent: this.shadowRoot.querySelector('.main-content')
    };
  }

  // Additional render methods will be implemented as the component grows
  renderExecution() {
    return '<div>Execution view coming soon...</div>';
  }

  renderTemplates() {
    return '<div>Templates view coming soon...</div>';
  }

  renderAnalytics() {
    return '<div>Analytics view coming soon...</div>';
  }

  renderStatusBar() {
    return `
      <footer class="status-bar">
        <div class="status-content">
          <span>Ready</span>
          <span>Last updated: ${new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    `;
  }

  renderRecentSessions() {
    const recentSessions = this.state.testSessions.slice(0, 5);
    
    return `
      <div class="recent-sessions">
        <h3>Recent Sessions</h3>
        ${recentSessions.length > 0 ? `
          <div class="sessions-list">
            ${recentSessions.map(session => `
              <div class="session-item">
                <div class="session-info">
                  <div class="session-name">${session.session_name}</div>
                  <div class="session-meta">${new Date(session.created_at).toLocaleDateString()}</div>
                </div>
                <div class="session-status status-${session.status}">${session.status}</div>
              </div>
            `).join('')}
          </div>
        ` : '<p>No recent sessions</p>'}
      </div>
    `;
  }

  renderPipelinesList() {
    return `
      <div class="pipelines-list">
        <h3>Available Pipelines</h3>
        ${this.state.pipelines.length > 0 ? `
          <div class="pipeline-items">
            ${this.state.pipelines.slice(0, 5).map(pipeline => `
              <div class="pipeline-item">
                <div class="pipeline-info">
                  <div class="pipeline-name">${pipeline.name}</div>
                  <div class="pipeline-desc">${pipeline.description || 'No description'}</div>
                </div>
                <div class="pipeline-status ${pipeline.is_active ? 'active' : 'inactive'}">
                  ${pipeline.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p>No pipelines available</p>'}
      </div>
    `;
  }

  renderSystemStatus() {
    return `
      <div class="system-status">
        <h3>System Status</h3>
        <div class="status-items">
          <div class="status-item">
            <span class="status-label">Pipeline Service</span>
            <span class="status-value online">Online</span>
          </div>
          <div class="status-item">
            <span class="status-label">Agent Service</span>
            <span class="status-value online">Online</span>
          </div>
          <div class="status-item">
            <span class="status-label">Database</span>
            <span class="status-value online">Connected</span>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('pipeline-tester-pro', PipelineTesterPro);