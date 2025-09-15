/**
 * Notebook List component for displaying notebooks within a project
 */
import { APPSTATE } from '../../../index.js';

class NotebookList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const appBridge = document.querySelector('app-bus').appBridge;
    this.notifications = appBridge.notifications;
    this.projectId = null;
    this.notebooks = [];
    
    // Initialize DynamicData client from APPSTATE
    this.dynamicClient = APPSTATE.dynamicDataClient;
  }

  connectedCallback() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Get project ID from attribute or URL
    this.projectId = this.getAttribute('projectId');
    
    if (!this.projectId) {
      const pathParts = window.location.pathname.split('/');
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (pathParts[i] === 'projects' && i + 1 < pathParts.length) {
          this.projectId = pathParts[i + 1];
          break;
        }
      }
    }
    
    if (!this.projectId) {
      this.renderError('No project ID provided');
      return;
    }

    this.render();
    this.loadNotebooks();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .notebooks-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .notebook-card {
          background: var(--color-surface, white);
          border-radius: 8px;
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--color-border, #e2e8f0);
        }
        
        .notebook-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md, 0 4px 6px rgba(0,0,0,0.1));
        }
        
        .notebook-name {
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .notebook-type {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #64748b);
          margin-bottom: 0.5rem;
        }
        
        .notebook-date {
          font-size: 0.75rem;
          color: var(--color-text-tertiary, #94a3b8);
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-secondary, #64748b);
          background: var(--color-surface, white);
          border-radius: 8px;
          border: 1px dashed var(--color-border, #e2e8f0);
        }
        
        .create-button {
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        .create-button:hover {
          background: var(--color-primary-dark, #2563eb);
        }
        
        .error {
          color: var(--color-error, #ef4444);
          padding: 1rem;
          text-align: center;
          background: var(--color-error-light, #fee2e2);
          border-radius: 6px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        h2 {
          margin: 0;
          font-size: 1.25rem;
        }
      </style>
      
      <div class="header">
        <h2>Notebooks</h2>
        <button class="create-button" id="create-notebook">
          <i class="fas fa-plus"></i> New Notebook
        </button>
      </div>
      
      <div class="notebooks-container" id="notebooks-list">
        <div class="loading">Loading notebooks...</div>
      </div>
    `;
    
    this.shadowRoot.getElementById('create-notebook').addEventListener('click', () => {
      this.createNotebook();
    });
  }

  async loadNotebooks() {
    try {
      if (!this.dynamicClient) {
        console.error('[NotebookList] DynamicData client not initialized');
        throw new Error('DynamicData client not available');
      }
      
      if (!this.projectId) {
        console.error('[NotebookList] No project ID provided, cannot fetch notebooks');
        throw new Error('Project ID is required to load notebooks');
      }
      
      console.log(`[NotebookList] Loading notebooks for project ${this.projectId} using DynamicData client`);
      
      // Use direct filtering with project_id as primary filter method
      // This ensures we only get notebooks that belong to this project
      const result = await this.dynamicClient.listItems('notebooks', {
        page: 1,
        limit: 50,
        filters: {
          project_id: this.projectId
        }
      });
      
      // Double-check that all returned notebooks belong to this project
      this.notebooks = (result.items || []).filter(notebook => {
        // Make sure project_id is a string for comparison
        const notebookProjectId = String(notebook.data?.project_id || '');
        const currentProjectId = String(this.projectId || '');
        
        if (notebookProjectId !== currentProjectId) {
          console.warn(`[NotebookList] Received notebook ${notebook.item_id} with project_id ${notebookProjectId} but expected ${currentProjectId}`);
          return false;
        }
        return true;
      });
      
      console.log(`[NotebookList] Loaded ${this.notebooks.length} notebooks for project ${this.projectId}`);
      
      this.renderNotebooks();
    } catch (error) {
      console.error('[NotebookList] Error loading notebooks:', error);
      this.shadowRoot.getElementById('notebooks-list').innerHTML = `
        <div class="error">
          <p>Failed to load notebooks: ${error.message}</p>
        </div>
      `;
    }
  }

  renderNotebooks() {
    const container = this.shadowRoot.getElementById('notebooks-list');
    
    if (!this.notebooks.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No notebooks found in this project</p>
          <button class="create-button" id="create-first-notebook">Create your first notebook</button>
        </div>
      `;
      
      this.shadowRoot.getElementById('create-first-notebook').addEventListener('click', () => {
        this.createNotebook();
      });
      
      return;
    }
    
    container.innerHTML = this.notebooks.map(notebook => `
      <div class="notebook-card" data-id="${notebook.item_id}">
        <h3 class="notebook-name">${notebook.data.title || 'Untitled'}</h3>
        <div class="notebook-type">${this.formatNotebookType(notebook.data.type)}</div>
        <div class="notebook-date">Last updated: ${this.formatDate(notebook.updated_at || notebook.created_at)}</div>
      </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.notebook-card').forEach(card => {
      card.addEventListener('click', () => {
        const notebookId = card.dataset.id;
        this.navigateToNotebook(notebookId);
      });
    });
  }
  
  navigateToNotebook(notebookId) {
    const appBridge = document.querySelector('app-bus')?.appBridge;
    if (appBridge && appBridge._router) {
      appBridge._router.navigateTo(`/projects/${this.projectId}/notebooks/${notebookId}`);
    } else {
      window.location.href = `/projects/${this.projectId}/notebooks/${notebookId}`;
    }
  }
  
  formatNotebookType(type) {
    if (!type) return 'General';
    const typeMap = {
      'general': 'General Writing',
      'research': 'Research',
      'blog': 'Blog Post',
      'report': 'Report',
      'script': 'Script',
      'idea': 'Ideas',
      'summary': 'Summary',
      'chat': 'Chat'
    };
    return typeMap[type.toLowerCase()] || type;
  }
  
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  createNotebook() {
    const appBridge = document.querySelector('app-bus')?.appBridge;
    if (appBridge && appBridge._router) {
      appBridge._router.navigateTo(`/projects/${this.projectId}/notebooks/new`);
    } else {
      window.location.href = `/projects/${this.projectId}/notebooks/new`;
    }
  }

  renderError(message) {
    this.shadowRoot.innerHTML = `
      <div class="error">
        <p>${message}</p>
      </div>
    `;
  }
}

customElements.define('notebook-list', NotebookList);

