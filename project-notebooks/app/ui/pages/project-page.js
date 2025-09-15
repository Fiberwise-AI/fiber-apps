/**
 * Project Page Component
 * Displays a list of projects and provides navigation to individual projects
 */
import { APPSTATE } from '../../../index.js';
export class ProjectPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.projects = [];
    this.loading = true;
    this.error = null;
    this.appBridge = null;
  }

  connectedCallback() {
    this.render();
    this.loadProjects();
    
   
  }

  async loadProjects() {
    try {
      this.loading = true;
      this.render();
      
      console.log('[ProjectPage] Fetching projects...');
      
      // Get DynamicData client from APPSTATE
      this.dynamicClient = APPSTATE.dynamicDataClient;
      
      // Fetch projects from the API using DynamicData client
      const result = await this.dynamicClient.listItems('projects', {
        limit: 50, // Adjust as needed
        page: 1
      });
      
      // Store the fetched projects
      this.projects = result.items || [];
      
      console.log(`[ProjectPage] Fetched ${this.projects.length} projects`);
      this.error = null;
    } catch (error) {
      console.error('[ProjectPage] Error loading projects:', error);
      this.error = error.message || 'Failed to load projects';
    } finally {
      this.loading = false;
      this.render();
    }
    this.setupEventListeners();

  }

  setupEventListeners() {
    // Update the create project link to use the router
    const createProjectLink = this.shadowRoot.querySelector('#create-project');
    console.log(createProjectLink);
    if (createProjectLink) {
      createProjectLink.addEventListener('click', (e) => {
        e.preventDefault();
        APPSTATE.navigateTo(`/projects/new`);
      });
    }
    
    // Add event listeners
    if (!this.loading && !this.error) {
      this.shadowRoot.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
          const projectId = card.dataset.projectId;
          window.location.href = `/projects/${projectId}`;
        });
      });
    }
    
    // Retry button
    const retryBtn = this.shadowRoot.querySelector('#retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadProjects());
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
        }
        
        h1 {
          margin-top: 0;
          font-size: 1.75rem;
        }
        
        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .project-card {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 1rem;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          background: #fff;
        }
        
        .project-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        
        .project-title {
          margin-top: 0;
          font-size: 1.25rem;
        }
        
        .project-description {
          color: #666;
          margin-bottom: 0;
        }
        
        .loading {
          display: flex;
          align-items: center;
          padding: 2rem;
          background: #f9f9f9;
          border-radius: 4px;
        }
        
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 1rem;
        }
        
        .error {
          padding: 1rem;
          background: #fee;
          color: #c00;
          border-radius: 4px;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          background: #f9f9f9;
          border-radius: 4px;
        }
        
        .create-project {
          display: inline-block;
          padding: 0.75rem 1rem;
          background: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 1rem;
          font-weight: 500;
        }
        
        .create-project:hover {
          background: #43a047;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      
      <div class="project-page">
        <div class="project-header">
          <h1>Projects</h1>
        </div>
        
        ${this.loading ? 
          `<div class="loading">
            <div class="spinner"></div>
            <span>Loading projects...</span>
          </div>` : 
          this.error ?
            `<div class="error">
              <p>${this.error}</p>
              <button id="retry">Try Again</button>
            </div>` :
            this.projects.length === 0 ? 
              `<div class="empty-state">
                <p>You don't have any projects yet.</p>
                <a id="create-project" class="create-project">Create Your First Project</a>
              </div>` :
              `<div class="project-grid">
                ${this.projects.map(project => `
                  <div class="project-card" data-project-id="${project.id || project.item_id}">
                    <h2 class="project-title">${project.name || project.data?.name || 'Untitled Project'}</h2>
                    <p class="project-description">${project.description || project.data?.description || 'No description'}</p>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top: 1.5rem;">
                <a class="create-project" id="create-project">Create New Project</a>
              </div>`
        }
      </div>
    `;
  }
}

customElements.define('project-page', ProjectPage);
