/**
 * Project List Navigation Component
 * Displays a list of projects in the site navigation sidebar
 */

import { APPSTATE } from '../../../index.js';

export class ProjectListNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.projects = [];
    this.loading = true;
    this.error = null;
    this.appBridge = document.querySelector('app-bus').appBridge;
    this.notifications = this.appBridge.notifications;
  }
  
  connectedCallback() {
    // Add data-path attribute to support site-nav navigation
    if (this.hasAttribute('data-path')) {
      this.dataset.path = this.getAttribute('data-path');
    }
    console.log('[ProjectListNav] connectedCallback called');
    
    // Listen for the appInitialized event
    this.appBridge.on('appInitialized', (data) => {
      console.log('[ProjectListNav] App Initialized Event Received', data);
      this.loadProjects();
    });
  }
  
  async loadProjects() {
    try {
      this.loading = true;
      this.render();
      console.log('[ProjectListNav] Loading projects...');
      
      // Use the DynamicData client if available, otherwise fall back to AppBridge
      if (APPSTATE.dynamicDataClient) {
        // Using DynamicData SDK
        console.log('[ProjectListNav] Using DynamicData SDK');
        const result = await APPSTATE.dynamicDataClient.listItems('projects');
        this.projects = result.items || [];
      } else {
        // Legacy: Using AppBridge
        console.log('[ProjectListNav] Using AppBridge getItems');
        this.projects = await this.appBridge.getItems(APPSTATE, 'projects');
      }
      
      this.error = null;
    } catch (error) {
      console.error('[ProjectListNav] Error loading projects:', error);
      this.error = error.message || 'Error loading projects';
    } finally {
      this.loading = false;
      this.render();
    }
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 1rem;
        }
        
        .project-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .project-nav-item {
          padding: 0.25rem 0.5rem 0.25rem 1.5rem;
          position: relative;
        }
        
        .project-nav-item:hover {
          background-color: var(--hover-bg, rgba(0,0,0,0.05));
        }
        
        .project-nav-link {
          display: block;
          text-decoration: none;
          color: var(--text-color, inherit);
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .project-nav-link::before {
          content: "•";
          position: absolute;
          left: 0.5rem;
        }
        
        .loading-message,
        .empty-message,
        .error-message {
          font-style: italic;
          font-size: 0.875rem;
          color: var(--text-light, #666);
          padding: 0.25rem 1rem;
        }
        
        .error-message {
          color: var(--error-color, #e74c3c);
        }
        
        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted, #666);
          padding: 0.25rem 0.5rem;
          margin: 0;
        }
      </style>
      
      <h5 class="section-title">Recent Projects</h5>
      
      ${this.loading ? 
        `<div class="loading-message">Loading projects...</div>` : 
        this.error ?
          `<div class="error-message">${this.error}</div>` :
          this.projects.length === 0 ? 
            `<div class="empty-message">No projects</div>` :
            `<ul class="project-nav-list">
              ${this.projects.map(project => `
                <li class="project-nav-item">
                  <a href="/projects/${project.id || project.item_id}" 
                     class="project-nav-link" 
                     data-path="/projects/${project.id || project.item_id}"
                     data-project-id="${project.id || project.item_id}">
                    ${project.name || project.data?.name || 'Untitled Project'}
                  </a>
                </li>
              `).join('')}
            </ul>`
      }
    `;
    
    // Add event listeners to project links
    this.shadowRoot.querySelectorAll('.project-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const projectId = link.dataset.projectId;
        const path = link.dataset.path;
        
        // Dispatch event for navigation
        this.dispatchEvent(new CustomEvent('project-selected', {
          bubbles: true,
          composed: true,
          detail: { projectId, path }
        }));
      });
    });
  }
}

customElements.define('project-list-nav', ProjectListNav);
