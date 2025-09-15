/**
 * Pipeline Executions Component
 * 
 * Displays previous pipeline executions with details and status
 */
import htmlTemplate from './pipeline-executions.html?raw';
import cssStyles from './pipeline-executions.css?inline';
import { FIBER } from '../index.js';

export class PipelineExecutions extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.executions = [];
    this.filteredExecutions = [];
    this.currentFilter = 'all'; // all, success, error, running
    this.sortBy = 'created_at'; // created_at, status, pipeline_name
    this.sortOrder = 'desc'; // asc, desc
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalItems = 0;
  }

  connectedCallback() {
    if (!this.initialized) {
      console.log('[PipelineExecutions] Initializing component');
      this.initialized = true;
      this.init();
    }
  }
  
  async init() {
    console.log('[PipelineExecutions] Running init()');
    
    try {
      // Connect to realtime updates for pipeline execution
      await FIBER.realtime.connect();
      FIBER.realtime.on('message', (message) => {
        if (message.type === 'pipeline_execution_updated') {
          this.handleExecutionUpdate(message);
        }
      });
      
      // Load pipeline executions
      await this.loadExecutions();
      
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing pipeline executions:', error);
      this.render();
    }
  }

  async loadExecutions() {
    try {
      console.log('[PipelineExecutions] Loading pipeline executions');
      
      // Get pipeline executions using the FIBER SDK
      const response = await FIBER.pipelines.listExecutions({
        limit: this.itemsPerPage,
        offset: (this.currentPage - 1) * this.itemsPerPage,
        sort: [{ field: this.sortBy, direction: this.sortOrder }]
      });
      
      this.executions = response.items || [];
      this.totalItems = response.total || 0;
      
      console.log('[PipelineExecutions] Loaded executions:', this.executions);
      
      // Apply current filter
      this.applyFilter();
      
      return this.executions;
    } catch (error) {
      console.error('Error loading pipeline executions:', error);
      this.showMessage('Failed to load pipeline executions', 'error');
      return [];
    }
  }

  applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredExecutions = [...this.executions];
    } else {
      this.filteredExecutions = this.executions.filter(execution => {
        switch (this.currentFilter) {
          case 'success':
            return execution.status === 'completed';
          case 'error':
            return execution.status === 'error' || execution.status === 'failed';
          case 'running':
            return execution.status === 'running' || execution.status === 'pending';
          default:
            return true;
        }
      });
    }
    
    // Update the filtered results display
    this.updateExecutionsList();
  }

  handleExecutionUpdate(message) {
    console.log('[PipelineExecutions] Execution update:', message);
    
    // Find and update the execution in our list
    const executionIndex = this.executions.findIndex(
      exec => exec.execution_id === message.execution_id
    );
    
    if (executionIndex >= 0) {
      // Update existing execution
      this.executions[executionIndex] = {
        ...this.executions[executionIndex],
        ...message
      };
    } else {
      // Add new execution to the beginning of the list
      this.executions.unshift(message);
    }
    
    // Re-apply filter and update display
    this.applyFilter();
  }

  async refreshExecutions() {
    this.currentPage = 1;
    await this.loadExecutions();
    this.render();
  }

  formatDuration(startTime, endTime) {
    if (!startTime) return 'Unknown';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end - start) / 1000); // seconds
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.round(duration / 60)}m ${duration % 60}s`;
    } else {
      return `${Math.round(duration / 3600)}h ${Math.round((duration % 3600) / 60)}m`;
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return 'fas fa-check-circle text-success';
      case 'error':
      case 'failed':
        return 'fas fa-times-circle text-error';
      case 'running':
        return 'fas fa-spinner fa-spin text-running';
      case 'pending':
        return 'fas fa-clock text-pending';
      default:
        return 'fas fa-question-circle text-unknown';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'error':
      case 'failed':
        return 'Failed';
      case 'running':
        return 'Running';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  }

  showMessage(message, type = 'info') {
    const container = this.shadowRoot.querySelector('#message-container');
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                      type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }

  setupEventListeners() {
    // Navigation buttons
    const navLinks = this.shadowRoot.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = e.currentTarget.getAttribute('data-route');
        if (route) {
          FIBER.router.navigateTo(route);
        }
      });
    });
    
    // Filter buttons
    const filterButtons = this.shadowRoot.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.getAttribute('data-filter');
        this.currentFilter = filter;
        
        // Update active button
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Apply filter
        this.applyFilter();
      });
    });
    
    // Sort dropdown
    const sortSelect = this.shadowRoot.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', async (e) => {
        const [field, order] = e.target.value.split('_');
        this.sortBy = field;
        this.sortOrder = order;
        await this.loadExecutions();
      });
    }
    
    // Refresh button
    const refreshBtn = this.shadowRoot.querySelector('#refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshExecutions();
      });
    }
    
    // Pagination
    const prevBtn = this.shadowRoot.querySelector('#prev-page');
    const nextBtn = this.shadowRoot.querySelector('#next-page');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', async () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          await this.loadExecutions();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        const maxPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (this.currentPage < maxPages) {
          this.currentPage++;
          await this.loadExecutions();
        }
      });
    }
  }

  updateExecutionsList() {
    const container = this.shadowRoot.querySelector('#executions-list');
    
    if (this.filteredExecutions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No pipeline executions found</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.filteredExecutions.map(execution => `
      <div class="execution-row" data-execution-id="${execution.execution_id}">
        <div class="execution-main">
          <div class="execution-header">
            <div class="pipeline-info">
              <h3>${execution.pipeline_name || 'Unknown Pipeline'}</h3>
              <span class="execution-id">ID: ${execution.execution_id}</span>
            </div>
            <div class="execution-status">
              <i class="${this.getStatusIcon(execution.status)}"></i>
              <span>${this.getStatusText(execution.status)}</span>
            </div>
          </div>
          
          <div class="execution-details">
            <div class="detail-item">
              <strong>Started:</strong>
              <span>${new Date(execution.created_at).toLocaleString()}</span>
            </div>
            <div class="detail-item">
              <strong>Duration:</strong>
              <span>${this.formatDuration(execution.created_at, execution.completed_at)}</span>
            </div>
            ${execution.pipeline_input ? `
              <div class="detail-item">
                <strong>Input:</strong>
                <span>${JSON.stringify(execution.pipeline_input)}</span>
              </div>
            ` : ''}
          </div>
          
          ${execution.error_message ? `
            <div class="execution-error">
              <i class="fas fa-exclamation-triangle"></i>
              <span>${execution.error_message}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="execution-actions">
          <button class="action-btn view-details" data-execution-id="${execution.execution_id}">
            <i class="fas fa-eye"></i>
            Details
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners for detail buttons
    const detailButtons = container.querySelectorAll('.view-details');
    detailButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const executionId = e.target.getAttribute('data-execution-id');
        this.showExecutionDetails(executionId);
      });
    });
  }

  async showExecutionDetails(executionId) {
    try {
      const execution = await FIBER.pipelines.getExecution(executionId);
      
      // Create a modal or detailed view
      const modal = document.createElement('div');
      modal.className = 'execution-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Execution Details</h2>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <pre>${JSON.stringify(execution, null, 2)}</pre>
          </div>
        </div>
      `;
      
      // Add to shadow root
      this.shadowRoot.appendChild(modal);
      
      // Close modal event
      modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
      });
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
    } catch (error) {
      console.error('Error loading execution details:', error);
      this.showMessage('Failed to load execution details', 'error');
    }
  }

  render() {
    console.log('[PipelineExecutions] Rendering component');
    
    // Inject HTML template and CSS
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
    `;
    
    // Update executions list
    setTimeout(() => this.updateExecutionsList(), 0);
    
    // Update pagination info
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const pageInfo = this.shadowRoot.querySelector('#page-info');
    if (pageInfo) {
      pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }
    
    // Update prev/next button states
    const prevBtn = this.shadowRoot.querySelector('#prev-page');
    const nextBtn = this.shadowRoot.querySelector('#next-page');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= totalPages;
    }
    
    // Set up event listeners after render
    setTimeout(() => {
      this.setupEventListeners();
    }, 0);
  }
}

customElements.define('pipeline-executions', PipelineExecutions);