import htmlContent from './notebook-page.html?raw';
import styles from './notebook-page.css?raw';
import { APPSTATE } from '../../../index.js';

class NotebookPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = htmlContent;
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    this.shadowRoot.appendChild(styleElement);
    
    // Get AppBridge for navigation and notifications
    const appBridge = document.querySelector('app-bus').appBridge;
    this.appBridge = appBridge;
    this.notifications = appBridge.notifications;
    
    // Initialize DynamicData client from APPSTATE
    this.dynamicClient = APPSTATE.dynamicDataClient;
    
    // Notebook data properties
    this.projectId = null;
    this.notebookId = null;
    this.notebook = null;
    this.project = null;
    
    // Editor instance (will be initialized later)
    this.editor = null;
    
    // Track auto-save state
    this.autoSaveTimeout = null;
    this.lastSavedContent = "";
    this.isSaving = false;
  }

  connectedCallback() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Get IDs from attributes or URL
    this.projectId = this.getAttribute('projectId');
    this.notebookId = this.getAttribute('notebookId');
    
    if (!this.projectId || !this.notebookId) {
      // Try to get IDs from URL
      const pathParts = window.location.pathname.split('/');
      const projectIndex = pathParts.indexOf('projects');
      
      if (projectIndex !== -1 && projectIndex + 3 < pathParts.length) {
        this.projectId = pathParts[projectIndex + 1];
        this.notebookId = pathParts[projectIndex + 3];
      }
    }
    
    if (!this.projectId || !this.notebookId) {
      this.renderError('Missing project or notebook ID');
      return;
    }
    
    console.log(`[NotebookPage] Loading notebook ${this.notebookId} in project ${this.projectId}`);
    
    this.setupElements();
    this.setupEventListeners();
    this.loadNotebookData();
  }

  setupElements() {
    this.titleElement = this.shadowRoot.getElementById('notebook-title');
    this.editorContainer = this.shadowRoot.getElementById('editor-container');
    this.saveButton = this.shadowRoot.getElementById('save-button');
    this.saveStatus = this.shadowRoot.getElementById('save-status');
    this.backButton = this.shadowRoot.getElementById('back-button');
    this.typeLabel = this.shadowRoot.getElementById('notebook-type');
  }

  setupEventListeners() {
    // Back button
    this.backButton?.addEventListener('click', () => {
      this.appBridge._router.navigateTo(`/projects/${this.projectId}`);
    });
    
    // Save button
    this.saveButton?.addEventListener('click', () => this.saveNotebook());
    
    // Title editing (if inline editing is supported)
    this.titleElement?.addEventListener('blur', (e) => {
      if (e.target.textContent !== this.notebook?.data.title) {
        this.updateNotebookTitle(e.target.textContent);
      }
    });
  }

  async loadNotebookData() {
    this.renderLoading();
    
    try {
      // Fetch notebook using DynamicData client
      const notebook = await this.dynamicClient.getItem('notebooks', this.notebookId);
      this.notebook = notebook;
      console.log('[NotebookPage] Loaded notebook:', notebook);
      
      // If project ID is in the notebook data, use that
      const projectIdFromNotebook = notebook.data.project_id;
      if (projectIdFromNotebook && (!this.projectId || this.projectId !== projectIdFromNotebook)) {
        console.log(`[NotebookPage] Using project ID from notebook data: ${projectIdFromNotebook}`);
        this.projectId = projectIdFromNotebook;
      }
      
      // Also fetch the associated project to get more context
      if (this.projectId) {
        try {
          const project = await this.dynamicClient.getItem('projects', this.projectId);
          this.project = project;
          console.log('[NotebookPage] Loaded parent project:', project);
        } catch (projectErr) {
          console.warn('[NotebookPage] Failed to load parent project:', projectErr);
          // Continue even without project data - it's not critical
        }
      }
      
      // Fix breadcrumbs with proper project path
      this.updateBreadcrumbs();
      
      this.renderNotebook();
      this.initializeEditor();
      this.clearLoading();
      
    } catch (error) {
      console.error('[NotebookPage] Error loading notebook:', error);
      this.renderError(`Failed to load notebook: ${error.message || 'Unknown error'}`);
    }
  }

  updateBreadcrumbs() {
    // Update breadcrumb links with proper project ID
    if (this.projectId) {
      const projectLink = this.shadowRoot.getElementById('project-link');
      if (projectLink) {
        projectLink.href = `/projects/${this.projectId}`;
      }
      
      // Update project name in breadcrumb if available
      const projectNameSpan = this.shadowRoot.querySelector('[data-project-name]');
      if (projectNameSpan && this.project) {
        projectNameSpan.textContent = this.project.data.name || 'Unnamed Project';
      }
    }
  }

  renderNotebook() {
    // Display notebook metadata
    if (this.titleElement) {
      this.titleElement.textContent = this.notebook.data.title || 'Untitled Notebook';
      this.titleElement.contentEditable = 'true';
    }
    
    // Display notebook type if available
    if (this.typeLabel) {
      const type = this.formatNotebookType(this.notebook.data.type);
      this.typeLabel.textContent = type;
    }
    
    // Update last edited time if available
    const lastEditedEl = this.shadowRoot.getElementById('last-edited-time');
    if (lastEditedEl) {
      const updateDate = new Date(this.notebook.updated_at || this.notebook.created_at);
      lastEditedEl.textContent = updateDate.toLocaleString();
      lastEditedEl.dateTime = updateDate.toISOString();
    }
  }

  initializeEditor() {
    // This would normally initialize a rich text editor like Quill, TinyMCE, etc.
    // For simplicity, I'll use a textarea in this example
    const content = this.notebook.data.content || '';
    this.lastSavedContent = content;
    
    // Create a simple textarea as our editor for this example
    const textarea = document.createElement('textarea');
    textarea.className = 'notebook-editor';
    textarea.value = content;
    textarea.style.width = '100%';
    textarea.style.height = '400px';
    textarea.style.padding = '10px';
    textarea.style.fontSize = '16px';
    
    // Add to container
    this.editorContainer.innerHTML = '';
    this.editorContainer.appendChild(textarea);
    
    // Set up auto-save on content change
    textarea.addEventListener('input', () => {
      this.updateSaveStatus('unsaved');
      
      // Clear existing timeout
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
      
      // Set new timeout for auto-save
      this.autoSaveTimeout = setTimeout(() => this.saveNotebook(), 2000);
    });
    
    // Store reference to our editor
    this.editor = textarea;
  }

  async saveNotebook() {
    if (this.isSaving) return;
    
    const content = this.editor.value;
    
    // Skip if content hasn't changed
    if (content === this.lastSavedContent) {
      this.updateSaveStatus('saved');
      return;
    }
    
    this.isSaving = true;
    this.updateSaveStatus('saving');
    
    try {
      // Update notebook with DynamicData client
      await this.dynamicClient.updateItem('notebooks', this.notebookId, {
        content: content
      });
      
      this.lastSavedContent = content;
      this.updateSaveStatus('saved');
      console.log('[NotebookPage] Notebook saved successfully');
      
      // Update the last edited time
      const lastEditedEl = this.shadowRoot.getElementById('last-edited-time');
      if (lastEditedEl) {
        const now = new Date();
        lastEditedEl.textContent = now.toLocaleString();
        lastEditedEl.dateTime = now.toISOString();
      }
      
    } catch (error) {
      console.error('[NotebookPage] Error saving notebook:', error);
      this.updateSaveStatus('error');
      this.notifications.error(`Failed to save: ${error.message || 'Unknown error'}`);
      
    } finally {
      this.isSaving = false;
    }
  }

  async updateNotebookTitle(newTitle) {
    if (!newTitle || newTitle.trim() === '' || newTitle === this.notebook?.data.title) return;
    
    try {
      // Update notebook title with DynamicData client
      await this.dynamicClient.updateItem('notebooks', this.notebookId, {
        title: newTitle
      });
      
      // Update local data
      this.notebook.data.title = newTitle;
      console.log('[NotebookPage] Title updated successfully');
      
    } catch (error) {
      console.error('[NotebookPage] Error updating title:', error);
      this.notifications.error(`Failed to update title: ${error.message || 'Unknown error'}`);
      
      // Restore original title in the UI
      if (this.titleElement) {
        this.titleElement.textContent = this.notebook?.data.title || 'Untitled Notebook';
      }
    }
  }

  updateSaveStatus(status) {
    if (!this.saveStatus) return;
    
    switch (status) {
      case 'unsaved':
        this.saveStatus.textContent = 'Unsaved changes';
        this.saveStatus.className = 'save-status unsaved';
        break;
      case 'saving':
        this.saveStatus.textContent = 'Saving...';
        this.saveStatus.className = 'save-status saving';
        break;
      case 'saved':
        this.saveStatus.textContent = 'All changes saved';
        this.saveStatus.className = 'save-status saved';
        setTimeout(() => {
          if (this.saveStatus.className === 'save-status saved') {
            this.saveStatus.textContent = '';
          }
        }, 3000);
        break;
      case 'error':
        this.saveStatus.textContent = 'Failed to save';
        this.saveStatus.className = 'save-status error';
        break;
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

  renderLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading';
    loadingEl.innerHTML = `
      <div class="spinner"></div>
      <span>Loading notebook...</span>
    `;
    
    // Add to editor container
    if (this.editorContainer) {
      this.editorContainer.innerHTML = '';
      this.editorContainer.appendChild(loadingEl);
    }
  }

  clearLoading() {
    const loadingEl = this.shadowRoot.querySelector('.loading');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  renderError(message) {
    if (this.editorContainer) {
      this.editorContainer.innerHTML = `
        <div class="error">
          <p>${message}</p>
          <button id="retry-button" class="btn btn-secondary">Retry</button>
          <button id="back-button-error" class="btn btn-secondary">Back to Project</button>
        </div>
      `;
      
      this.shadowRoot.getElementById('retry-button')?.addEventListener(
        'click', () => this.loadNotebookData()
      );
      
      this.shadowRoot.getElementById('back-button-error')?.addEventListener(
        'click', () => this.appBridge._router.navigateTo(`/projects/${this.projectId}`)
      );
    }
  }
}

customElements.define('notebook-page', NotebookPage);
export default NotebookPage;
