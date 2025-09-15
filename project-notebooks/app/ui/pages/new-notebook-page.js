import { APPSTATE } from '../../../index.js';

class NewNotebookPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Get AppBridge for navigation and notifications
    const appBridge = document.querySelector('app-bus').appBridge;
    this.appBridge = appBridge;
    this.notifications = appBridge._notifications;
    console.log(this.appBridge);
    // Initialize DynamicData client from APPSTATE
    this.dynamicClient = APPSTATE.dynamicDataClient;
    
    // Store form state
    this.formState = {
      title: '',
      type: 'general',
      content: '',
    };
    
    // Get project ID from URL or attribute
    this.projectId = null;
  }

  connectedCallback() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Get project ID from attribute or URL
    this.projectId = this.getAttribute('projectId');
    
    if (!this.projectId) {
      // Try to extract project ID from URL
      const pathParts = window.location.pathname.split('/');
      const projectIndex = pathParts.indexOf('projects');
      
      if (projectIndex !== -1 && projectIndex + 1 < pathParts.length) {
        this.projectId = pathParts[projectIndex + 1];
        console.log('[NewNotebookPage] Project ID from URL:', this.projectId);
      }
    }
    
    if (!this.projectId) {
      this.renderError('Missing project ID - cannot create notebook without project context');
      return;
    }
    
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 800px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        
        .breadcrumbs {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #64748b);
          margin-bottom: 1.5rem;
        }
        
        .breadcrumb-link {
          color: var(--color-primary, #3b82f6);
          text-decoration: none;
        }
        
        .breadcrumb-link:hover {
          text-decoration: underline;
        }
        
        .content-header {
          margin-bottom: 2rem;
        }
        
        h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          color: var(--color-text-primary, #1e293b);
        }
        
        .subtitle {
          font-size: 1rem;
          color: var(--color-text-secondary, #64748b);
        }
        
        .notebook-form {
          background-color: #fff;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: var(--color-text-primary, #1e293b);
        }
        
        input, select, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: border-color 0.15s;
        }
        
        input:focus, select:focus, textarea:focus {
          border-color: var(--color-primary, #3b82f6);
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        textarea {
          min-height: 200px;
          resize: vertical;
        }
        
        .error-message {
          color: var(--color-error, #ef4444);
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: none;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background-color: var(--color-primary, #3b82f6);
          color: white;
          border: none;
        }
        
        .btn-primary:hover {
          background-color: var(--color-primary-dark, #2563eb);
        }
        
        .btn-secondary {
          background-color: white;
          color: var(--color-text-primary, #1e293b);
          border: 1px solid var(--color-border, #e2e8f0);
        }
        
        .btn-secondary:hover {
          background-color: var(--color-hover, #f8fafc);
        }
        
        .btn-primary:disabled {
          background-color: var(--color-primary-light, #93c5fd);
          cursor: not-allowed;
        }
        
        .spinner {
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          width: 1rem;
          height: 1rem;
          animation: spin 1s linear infinite;
        }
        
        .hidden {
          display: none;
        }
        
        .error {
          background-color: var(--color-error-light, #fee2e2);
          color: var(--color-error, #b91c1c);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      
      <div class="new-notebook-container">
        <nav class="breadcrumbs">
          <a href="/projects" class="breadcrumb-link">Projects</a> / 
          <a href="/projects/${this.projectId}" class="breadcrumb-link">Project</a> / 
          <span>New Notebook</span>
        </nav>
        
        <div class="content-header">
          <h1>Create New Notebook</h1>
          <p class="subtitle">Create a new notebook for your project</p>
        </div>
        
        <form id="notebookForm" class="notebook-form">
          <div class="form-group">
            <label for="notebookTitle">Notebook Title *</label>
            <input 
              type="text" 
              id="notebookTitle" 
              name="title" 
              required
              minlength="3" 
              maxlength="100"
              placeholder="Enter notebook title"
            >
            <div class="error-message" id="titleError"></div>
          </div>
          
          <div class="form-group">
            <label for="notebookType">Notebook Type</label>
            <select id="notebookType" name="type">
              <option value="general">General</option>
              <option value="research">Research</option>
              <option value="blog">Blog Post</option>
              <option value="report">Report</option>
              <option value="script">Script</option>
              <option value="idea">Idea</option>
              <option value="summary">Summary</option>
              <option value="chat">Chat</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="notebookContent">Initial Content (optional)</label>
            <textarea 
              id="notebookContent" 
              name="content" 
              placeholder="Add initial content for your notebook here"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
            <button type="submit" class="btn-primary" id="createBtn">
              <span class="btn-text">Create Notebook</span>
              <span class="spinner hidden" id="submitSpinner"></span>
            </button>
          </div>
        </form>
      </div>
    `;
  }

  setupEventListeners() {
    // Get form elements
    this.notebookForm = this.shadowRoot.getElementById('notebookForm');
    this.titleInput = this.shadowRoot.getElementById('notebookTitle');
    this.typeSelect = this.shadowRoot.getElementById('notebookType');
    this.contentTextarea = this.shadowRoot.getElementById('notebookContent');
    this.cancelBtn = this.shadowRoot.getElementById('cancelBtn');
    this.createBtn = this.shadowRoot.getElementById('createBtn');
    this.submitSpinner = this.shadowRoot.getElementById('submitSpinner');
    this.titleError = this.shadowRoot.getElementById('titleError');
    
    // Setup form submission
    this.notebookForm.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Form field change handlers
    this.titleInput.addEventListener('input', () => {
      this.formState.title = this.titleInput.value;
      this.validateTitle();
    });
    
    this.typeSelect.addEventListener('change', () => {
      this.formState.type = this.typeSelect.value;
    });
    
    this.contentTextarea.addEventListener('input', () => {
      this.formState.content = this.contentTextarea.value;
    });
    
    // Cancel button
    this.cancelBtn.addEventListener('click', () => this.navigateBack());
  }

  validateTitle() {
    const title = this.formState.title;
    
    if (!title || title.length < 3) {
      this.titleError.textContent = 'Notebook title must be at least 3 characters';
      this.titleError.style.display = 'block';
      return false;
    }
    
    this.titleError.style.display = 'none';
    return true;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!this.validateTitle()) {
      return;
    }
    
    // Show loading state
    this.setLoading(true);
    
    try {
      if (!this.dynamicClient) {
        throw new Error('DynamicData client not available');
      }
      
      // Prepare notebook data
      const notebookData = {
        title: this.formState.title,
        type: this.formState.type,
        project_id: this.projectId,
        content: this.formState.content || null
      };
      
      console.log('[NewNotebookPage] Creating notebook:', notebookData);
      
      // Use DynamicData client to create notebook
      const notebook = await this.dynamicClient.createItem('notebooks', notebookData);
      
      console.log('[NewNotebookPage] Notebook created successfully:', notebook);
      
      // Show success notification
      this.notifications.success('Notebook created successfully');
      
      // Navigate to the new notebook
      this.appBridge._router.navigateTo(`/projects/${this.projectId}/notebooks/${notebook.item_id}`);
      
    } catch (error) {
      console.error('[NewNotebookPage] Error creating notebook:', error);
      this.notifications.error(`Failed to create notebook: ${error.message || 'Unknown error'}`);
      this.setLoading(false);
    }
  }

  navigateBack() {
    this.appBridge._router.navigateTo(`/projects/${this.projectId}`);
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.createBtn.disabled = true;
      this.submitSpinner.classList.remove('hidden');
      this.createBtn.querySelector('.btn-text').textContent = 'Creating...';
    } else {
      this.createBtn.disabled = false;
      this.submitSpinner.classList.add('hidden');
      this.createBtn.querySelector('.btn-text').textContent = 'Create Notebook';
    }
  }

  renderError(message) {
    this.shadowRoot.innerHTML = `
      <div class="error">
        <p>${message}</p>
        <button id="back-button" class="btn-secondary">Back to Project</button>
      </div>
    `;
    
    const backButton = this.shadowRoot.getElementById('back-button');
    if (backButton && this.projectId) {
      backButton.addEventListener('click', () => {
        this.appBridge._router.navigateTo(`/projects/${this.projectId}`);
      });
    } else if (backButton) {
      backButton.addEventListener('click', () => {
        this.appBridge._router.navigateTo('/projects');
      });
    }
  }
}

customElements.define('new-notebook-page', NewNotebookPage);
export default NewNotebookPage;
