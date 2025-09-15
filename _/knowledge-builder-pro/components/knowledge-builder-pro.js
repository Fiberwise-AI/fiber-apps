/**
 * Knowledge Builder Pro - Main Component
 * 
 * Deep research interface with Wikipedia API, web scraping, and collaborative analysis.
 * Orchestrates the complete knowledge building pipeline.
 */

import { FIBER, APP_CONFIG, APP_INSTANCE } from '../index.js';

class KnowledgeBuilderPro extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.state = {
      isLoggedIn: false,
      currentUser: null,
      researchProjects: [],
      currentProject: null,
      pipelineStatus: 'idle', // idle, running, completed, error
      researchResults: null,
      executionLog: [],
      isExecuting: false
    };

    // UI elements will be bound after render
    this.elements = {};
  }

  connectedCallback() {
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
        await this.loadResearchProjects();
        
        // Render the interface
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
      } else {
        this.renderLogin();
      }
      
    } catch (error) {
      console.error('[KnowledgeBuilderPro] Initialization failed:', error);
      this.renderError('Failed to initialize Knowledge Builder Pro', error);
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
      console.error('[KnowledgeBuilderPro] Auth check failed:', error);
      this.state.isLoggedIn = false;
    }
  }

  async loadResearchProjects() {
    try {
      const response = await fetch('/api/v1/data/research_projects?limit=20&sort=created_at:desc', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.state.researchProjects = data.items || [];
      }
    } catch (error) {
      console.error('[KnowledgeBuilderPro] Error loading projects:', error);
      this.state.researchProjects = [];
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      <div class="app-container">
        ${this.renderHeader()}
        <main class="main-content">
          ${this.renderMainInterface()}
        </main>
        ${this.renderStatusBar()}
      </div>
    `;

    // Bind UI elements
    this.bindElements();
  }

  renderHeader() {
    return `
      <header class="app-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="app-title">
              <span class="app-icon">🧠</span>
              Knowledge Builder Pro
            </h1>
            <div class="header-status">
              <span class="status-dot ${this.state.pipelineStatus}"></span>
              <span class="status-text">${this.getStatusText()}</span>
            </div>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-name">${this.state.currentUser?.email || 'User'}</span>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  renderMainInterface() {
    if (this.state.pipelineStatus === 'running') {
      return this.renderExecutionView();
    } else if (this.state.researchResults) {
      return this.renderResultsView();
    } else {
      return this.renderResearchForm();
    }
  }

  renderResearchForm() {
    return `
      <div class="research-form-container">
        <div class="form-header">
          <h2>Start Deep Research</h2>
          <p>Combine Wikipedia API, web scraping, and AI analysis for comprehensive knowledge building</p>
        </div>
        
        <form class="research-form" id="researchForm">
          <div class="form-group">
            <label for="researchTopic">Research Topic</label>
            <input 
              type="text" 
              id="researchTopic" 
              name="researchTopic" 
              placeholder="Enter your research topic..."
              required
            >
            <small>What would you like to research in depth?</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="researchScope">Research Scope</label>
              <select id="researchScope" name="researchScope">
                <option value="narrow">Narrow - Focused analysis</option>
                <option value="broad" selected>Broad - Comprehensive coverage</option>
                <option value="comprehensive">Comprehensive - Exhaustive research</option>
              </select>
            </div>

            <div class="form-group">
              <label for="maxSources">Max Sources</label>
              <input 
                type="number" 
                id="maxSources" 
                name="maxSources" 
                min="5" 
                max="50" 
                value="15"
              >
            </div>
          </div>

          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                id="enableAgentConversations" 
                name="enableAgentConversations" 
                checked
              >
              Enable AI Agent Conversations
            </label>
            <small>Allow AI agents to discuss and analyze findings collaboratively</small>
          </div>

          <div class="form-group">
            <label for="synthesisDepth">Synthesis Depth</label>
            <select id="synthesisDepth" name="synthesisDepth">
              <option value="summary">Summary - Key points only</option>
              <option value="detailed" selected>Detailed - Comprehensive analysis</option>
              <option value="comprehensive">Comprehensive - Full depth research</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" id="startResearchBtn">
              <span class="btn-icon">🚀</span>
              Start Knowledge Building
            </button>
          </div>
        </form>

        ${this.renderRecentProjects()}
      </div>
    `;
  }

  renderExecutionView() {
    const progress = this.calculateProgress();
    
    return `
      <div class="execution-view">
        <div class="execution-header">
          <h2>Building Knowledge Base</h2>
          <p>Topic: <strong>${this.state.currentProject?.research_topic || 'Unknown'}</strong></p>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${progress}% Complete</span>
        </div>

        <div class="execution-log">
          <h3>Execution Log</h3>
          <div class="log-entries">
            ${this.state.executionLog.map(entry => `
              <div class="log-entry ${entry.status || 'info'}">
                <span class="log-timestamp">${new Date(entry.timestamp || Date.now()).toLocaleTimeString()}</span>
                <span class="log-message">${entry.message || entry}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="execution-actions">
          <button class="btn btn-secondary" onclick="this.stopExecution()">
            <span class="btn-icon">⏹️</span>
            Stop Research
          </button>
        </div>
      </div>
    `;
  }

  renderResultsView() {
    const results = this.state.researchResults;
    const summary = results.research_summary || {};
    
    return `
      <div class="results-view">
        <div class="results-header">
          <h2>Knowledge Base Complete</h2>
          <p>Topic: <strong>${results.research_topic}</strong></p>
          
          <div class="results-stats">
            <div class="stat-card">
              <div class="stat-value">${summary.wikipedia_articles || 0}</div>
              <div class="stat-label">Wikipedia Articles</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.web_sources || 0}</div>
              <div class="stat-label">Web Sources</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.agent_conversations || 0}</div>
              <div class="stat-label">AI Conversations</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.knowledge_elements || 0}</div>
              <div class="stat-label">Knowledge Elements</div>
            </div>
          </div>
        </div>

        <div class="results-content">
          <div class="results-tabs">
            <button class="tab-btn active" data-tab="knowledge">Knowledge Base</button>
            <button class="tab-btn" data-tab="sources">Sources</button>
            <button class="tab-btn" data-tab="conversations">AI Conversations</button>
            <button class="tab-btn" data-tab="insights">Key Insights</button>
          </div>

          <div class="tab-content active" id="knowledge-tab">
            ${this.renderKnowledgeBase(results.research_data?.final_knowledge_base)}
          </div>

          <div class="tab-content" id="sources-tab">
            ${this.renderSourcesAnalysis(results.research_data)}
          </div>

          <div class="tab-content" id="conversations-tab">
            ${this.renderAgentConversations(results.research_data?.agent_conversations)}
          </div>

          <div class="tab-content" id="insights-tab">
            ${this.renderKeyInsights(results.research_data?.final_knowledge_base)}
          </div>
        </div>

        <div class="results-actions">
          <button class="btn btn-primary" onclick="this.exportResults()">
            <span class="btn-icon">📥</span>
            Export Knowledge Base
          </button>
          <button class="btn btn-secondary" onclick="this.startNewResearch()">
            <span class="btn-icon">🔍</span>
            New Research
          </button>
        </div>
      </div>
    `;
  }

  renderKnowledgeBase(knowledgeBase) {
    if (!knowledgeBase || !knowledgeBase.knowledge_elements) {
      return '<p>No knowledge base available</p>';
    }

    return `
      <div class="knowledge-base">
        <h3>Knowledge Elements</h3>
        ${knowledgeBase.knowledge_elements.map(element => `
          <div class="knowledge-element">
            <h4>${element.title || 'Knowledge Element'}</h4>
            <p>${element.content || element.summary || 'No content available'}</p>
            <div class="element-meta">
              <span class="confidence">Confidence: ${Math.round((element.confidence || 0) * 100)}%</span>
              <span class="sources">Sources: ${element.sources ? element.sources.length : 0}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderSourcesAnalysis(researchData) {
    const wikipediaData = researchData?.wikipedia_research;
    const webData = researchData?.web_scraping_results;

    return `
      <div class="sources-analysis">
        <div class="source-section">
          <h3>Wikipedia Sources</h3>
          ${wikipediaData?.main_article ? `
            <div class="source-item">
              <h4>${wikipediaData.main_article.title}</h4>
              <p>${wikipediaData.main_article.summary}</p>
              <a href="${wikipediaData.main_article.url}" target="_blank">View Article</a>
            </div>
          ` : '<p>No Wikipedia data available</p>'}
          
          ${wikipediaData?.related_articles?.map(article => `
            <div class="source-item">
              <h4>${article.title}</h4>
              <p>${article.summary}</p>
              <a href="${article.url}" target="_blank">View Article</a>
            </div>
          `).join('') || ''}
        </div>

        <div class="source-section">
          <h3>Web Sources</h3>
          ${webData?.scraped_data?.map(source => `
            <div class="source-item">
              <h4>${source.title}</h4>
              <p>${source.content?.substring(0, 200)}...</p>
              <div class="source-meta">
                <span>Relevance: ${Math.round((source.relevance_score || 0) * 100)}%</span>
                <a href="${source.url}" target="_blank">View Source</a>
              </div>
            </div>
          `).join('') || '<p>No web sources available</p>'}
        </div>
      </div>
    `;
  }

  renderAgentConversations(conversations) {
    if (!conversations || !conversations.conversations) {
      return '<p>No agent conversations available</p>';
    }

    return `
      <div class="agent-conversations">
        <h3>AI Agent Discussions</h3>
        ${conversations.conversations.map((conv, index) => `
          <div class="conversation-item">
            <div class="conversation-header">
              <span class="conversation-type">${conv.type || 'Discussion'}</span>
              <span class="conversation-id">#${index + 1}</span>
            </div>
            <div class="conversation-content">
              ${JSON.stringify(conv.content || conv, null, 2)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderKeyInsights(knowledgeBase) {
    if (!knowledgeBase) {
      return '<p>No insights available</p>';
    }

    return `
      <div class="key-insights">
        <h3>Key Research Insights</h3>
        
        ${knowledgeBase.agent_insights?.map(insight => `
          <div class="insight-item">
            <p>${insight}</p>
          </div>
        `).join('') || ''}

        ${knowledgeBase.research_hypotheses?.map(hypothesis => `
          <div class="hypothesis-item">
            <h4>Research Hypothesis</h4>
            <p>${hypothesis.hypothesis_statement || hypothesis}</p>
            <div class="hypothesis-meta">
              <span>Type: ${hypothesis.hypothesis_type || 'General'}</span>
              <span>Confidence: ${Math.round((hypothesis.confidence || 0) * 100)}%</span>
            </div>
          </div>
        `).join('') || ''}

        ${knowledgeBase.expert_assessment ? `
          <div class="expert-assessment">
            <h4>Expert Assessment</h4>
            <p>${JSON.stringify(knowledgeBase.expert_assessment, null, 2)}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderRecentProjects() {
    if (this.state.researchProjects.length === 0) {
      return '';
    }

    return `
      <div class="recent-projects">
        <h3>Recent Research Projects</h3>
        <div class="project-list">
          ${this.state.researchProjects.slice(0, 5).map(project => `
            <div class="project-item" data-project-id="${project.project_id}">
              <div class="project-info">
                <h4>${project.project_name}</h4>
                <p>${project.research_topic}</p>
                <small>Status: ${project.status} | ${new Date(project.created_at).toLocaleDateString()}</small>
              </div>
              <button class="btn btn-sm" onclick="this.loadProject('${project.project_id}')">
                Load
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderStatusBar() {
    return `
      <footer class="status-bar">
        <div class="status-content">
          <span>${this.getStatusMessage()}</span>
          <span>Last updated: ${new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    `;
  }

  setupEventListeners() {
    // Research form submission
    const form = this.shadowRoot.getElementById('researchForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.startResearch();
      });
    }

    // Tab switching
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });
  }

  async startResearch() {
    const form = this.shadowRoot.getElementById('researchForm');
    if (!form) return;

    const formData = new FormData(form);
    const researchConfig = {
      research_topic: formData.get('researchTopic'),
      research_scope: formData.get('researchScope'),
      max_sources: parseInt(formData.get('maxSources')),
      enable_agent_conversations: formData.has('enableAgentConversations'),
      synthesis_depth: formData.get('synthesisDepth')
    };

    this.state.pipelineStatus = 'running';
    this.state.isExecuting = true;
    this.state.executionLog = [];
    this.state.currentProject = researchConfig;
    
    this.render();

    try {
      // Execute the knowledge building pipeline
      const result = await FIBER.pipeline.execute('knowledge-builder', researchConfig);

      if (result.execution_successful) {
        this.state.pipelineStatus = 'completed';
        this.state.researchResults = result;
        this.addLogEntry('Pipeline completed successfully!', 'success');
      } else {
        this.state.pipelineStatus = 'error';
        this.addLogEntry(`Pipeline failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.state.pipelineStatus = 'error';
      this.addLogEntry(`Execution error: ${error.message}`, 'error');
      console.error('[KnowledgeBuilderPro] Research execution failed:', error);
    }

    this.state.isExecuting = false;
    this.render();
  }

  addLogEntry(message, status = 'info') {
    this.state.executionLog.push({
      message,
      status,
      timestamp: new Date().toISOString()
    });
    
    // Update log display if in execution view
    const logEntries = this.shadowRoot.querySelector('.log-entries');
    if (logEntries) {
      logEntries.innerHTML = this.state.executionLog.map(entry => `
        <div class="log-entry ${entry.status}">
          <span class="log-timestamp">${new Date(entry.timestamp).toLocaleTimeString()}</span>
          <span class="log-message">${entry.message}</span>
        </div>
      `).join('');
      logEntries.scrollTop = logEntries.scrollHeight;
    }
  }

  calculateProgress() {
    const logCount = this.state.executionLog.length;
    // Rough estimate based on expected pipeline steps
    const estimatedSteps = 8;
    return Math.min(Math.round((logCount / estimatedSteps) * 100), 95);
  }

  switchTab(tabName) {
    // Update tab buttons
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    this.shadowRoot.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
  }

  getStatusText() {
    switch (this.state.pipelineStatus) {
      case 'running': return 'Researching...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  }

  getStatusMessage() {
    switch (this.state.pipelineStatus) {
      case 'running': return 'Knowledge building pipeline in progress...';
      case 'completed': return 'Research completed successfully';
      case 'error': return 'Research encountered an error';
      default: return 'Ready to start deep research';
    }
  }

  // Additional methods for user interactions
  startNewResearch() {
    this.state.pipelineStatus = 'idle';
    this.state.researchResults = null;
    this.state.currentProject = null;
    this.state.executionLog = [];
    this.render();
  }

  exportResults() {
    if (!this.state.researchResults) return;

    const dataStr = JSON.stringify(this.state.researchResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-base-${this.state.researchResults.research_topic.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  renderLogin() {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="login-container">
        <div class="login-card">
          <div class="login-icon">🧠</div>
          <h2>Knowledge Builder Pro</h2>
          <p>Deep research with AI-powered knowledge synthesis</p>
          <a href="/auth/login" class="login-btn">Login to Continue</a>
        </div>
      </div>
    `;
  }

  renderError(title, error) {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="error-container">
        <div class="error-card">
          <div class="error-icon">⚠️</div>
          <h2>${title}</h2>
          <p>An error occurred while loading the application.</p>
          <div class="error-details">${error.message || error}</div>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </div>
    `;
  }

  bindElements() {
    this.elements = {
      form: this.shadowRoot.getElementById('researchForm'),
      statusBar: this.shadowRoot.querySelector('.status-bar')
    };
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

      .status-dot.running {
        background: #f59e0b;
        animation: pulse 2s infinite;
      }

      .status-dot.completed {
        background: #10b981;
      }

      .status-dot.error {
        background: #ef4444;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .main-content {
        flex: 1;
        overflow: auto;
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
      }

      .research-form-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .form-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .form-header h2 {
        font-size: 2rem;
        color: #1e293b;
        margin-bottom: 0.5rem;
      }

      .research-form {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 200px;
        gap: 1rem;
      }

      .form-group label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .form-group input,
      .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
      }

      .form-group small {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .form-actions {
        text-align: center;
        margin-top: 2rem;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #6b7280;
        color: white;
      }

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }

      .execution-view {
        max-width: 1000px;
        margin: 0 auto;
      }

      .progress-container {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .progress-fill {
        height: 100%;
        background: #3b82f6;
        transition: width 0.3s ease;
      }

      .execution-log {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
      }

      .log-entries {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1rem;
        background: #f9fafb;
      }

      .log-entry {
        margin-bottom: 0.5rem;
        font-family: monospace;
        font-size: 0.875rem;
      }

      .log-entry.success {
        color: #065f46;
      }

      .log-entry.error {
        color: #dc2626;
      }

      .results-view {
        max-width: 1200px;
        margin: 0 auto;
      }

      .results-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }

      .stat-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .results-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 2rem;
      }

      .tab-btn {
        padding: 1rem 1.5rem;
        border: none;
        background: none;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
      }

      .tab-btn.active {
        border-bottom-color: #3b82f6;
        color: #3b82f6;
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .knowledge-element,
      .source-item,
      .conversation-item,
      .insight-item {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .recent-projects {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .project-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-bottom: 0.5rem;
      }

      .status-bar {
        background: white;
        border-top: 1px solid #e5e7eb;
        padding: 0.75rem 2rem;
      }

      .status-content {
        display: flex;
        justify-content: space-between;
        max-width: 1400px;
        margin: 0 auto;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .login-container,
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .login-card,
      .error-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .login-icon,
      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .login-btn {
        background: #3b82f6;
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        text-decoration: none;
        display: inline-block;
        margin-top: 1rem;
      }

      @media (max-width: 768px) {
        .main-content {
          padding: 1rem;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .results-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .results-tabs {
          overflow-x: auto;
        }
      }
    `;
  }
}

// Register the custom element
customElements.define('knowledge-builder-pro', KnowledgeBuilderPro);