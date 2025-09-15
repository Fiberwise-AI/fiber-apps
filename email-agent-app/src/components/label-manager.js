import { FIBER } from '../../index.js';
import { emailService } from '../services/email-service.js';

export class LabelManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.authenticatorId = null;
    this.labels = [];
    this.loading = false;
    this.error = null;
  }
  
  static get observedAttributes() {
    return ['connection-id'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'connection-id' && oldValue !== newValue) {
      this.connectionId = newValue;
      if (this.connectionId) this.loadLabels();
    }
  }
  
  connectedCallback() {
    this.connectionId = this.getAttribute('connection-id');
    this.render();
    
    if (this.connectionId) {
      this.loadLabels();
    }
  }
  
  async loadLabels() {
    if (!this.connectionId) return;
    
    try {
      this.loading = true;
      this.render();
      
      const response = await emailService.listLabels(this.connectionId);
      
      if (response && response.status === 'success') {
        this.labels = response.result.labels || [];
        this.error = null;
      } else {
        this.error = (response && response.message) || 'Failed to load labels';
        this.labels = [];
      }
    } catch (error) {
      console.error('Error loading labels:', error);
      this.error = error.message || 'An error occurred while loading labels';
      this.labels = [];
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
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .labels-container {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .labels-header {
          padding: 1.25rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .labels-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }
        
        .labels-body {
          padding: 1.25rem;
        }
        
        .labels-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.75rem;
        }
        
        .label-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }
        
        .label-color {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          background-color: #e5e7eb;
        }
        
        .label-color.system {
          background-color: #93c5fd;
        }
        
        .label-color.user {
          background-color: #a5b4fc;
        }
        
        .label-info {
          flex: 1;
          min-width: 0;
        }
        
        .label-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .label-type {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }
        
        .count-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .count-number {
          font-weight: 600;
          color: #374151;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
        }
        
        .spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid rgba(79, 70, 229, 0.1);
          border-radius: 50%;
          border-top-color: #4f46e5;
          animation: spin 1s linear infinite;
          margin-right: 0.75rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container {
          padding: 1rem;
          background-color: #fee2e2;
          border-radius: 0.375rem;
          color: #b91c1c;
          margin-bottom: 1rem;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
        
        .section {
          margin-bottom: 2rem;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
      </style>
      
      <div class="labels-container">
        <div class="labels-header">
          <h2 class="labels-title">Email Labels & Folders</h2>
        </div>
        
        ${this.loading ? `
          <div class="loading-container">
            <div class="spinner"></div>
            <div>Loading labels...</div>
          </div>
        ` : this.error ? `
          <div class="labels-body">
            <div class="error-container">
              ${this.error}
            </div>
          </div>
        ` : this.labels.length === 0 ? `
          <div class="labels-body">
            <div class="empty-state">
              No labels or folders found for this email account.
            </div>
          </div>
        ` : `
          <div class="labels-body">
            <div class="section">
              <h3 class="section-title">System Labels</h3>
              <div class="labels-list">
                ${this.labels.filter(label => label.type === 'system').map(label => `
                  <div class="label-item">
                    <div class="label-color system"></div>
                    <div class="label-info">
                      <div class="label-name">${label.name}</div>
                      <div class="label-type">System</div>
                    </div>
                    ${(label.total_items !== undefined || label.unread_items !== undefined) ? `
                      <div class="count-badge">
                        <div class="count-number">${label.total_items || 0}</div>
                        <div>emails</div>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">User Labels</h3>
              ${this.labels.filter(label => label.type === 'user').length === 0 ? `
                <div class="empty-state">No user-created labels found.</div>
              ` : `
                <div class="labels-list">
                  ${this.labels.filter(label => label.type === 'user').map(label => `
                    <div class="label-item">
                      <div class="label-color user"></div>
                      <div class="label-info">
                        <div class="label-name">${label.name}</div>
                        <div class="label-type">User</div>
                      </div>
                      ${(label.total_items !== undefined || label.unread_items !== undefined) ? `
                        <div class="count-badge">
                          <div class="count-number">${label.total_items || 0}</div>
                          <div>emails</div>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('label-manager', LabelManager);
