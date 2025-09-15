import { dataService } from '../services/data-service.js';
import { FIBER } from '../../index.js';
import './email-detail.js';
import './email-detail-page.js';
import './email-search.js';
import './email-compose.js';
import './label-manager.js';
export class EmailAgentApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.providers = [];
    this.selectedProvider = null;
    this.currentView = 'inbox';
    this.selectedMessageId = null;
    this.loading = true;
    this.error = null;

    this._handleEmailSent = this.handleEmailSent.bind(this);
    this._handleComposeCancelled = this.handleComposeCancelled.bind(this);
  }

  async connectedCallback() {
    if (!this.initialized) {
      this.initialized = true;
      
      // Render first (adds to DOM)
      this.render();
      
      // Then connect to realtime after component is in DOM
      try {
        await FIBER.realtime.connect();
        console.log('[EmailApp] Realtime connection established');
        
        // Set up realtime event listeners
        FIBER.realtime.on('message', (message) => {
          this.handleRealtimeMessage(message);
        });
      } catch (error) {
        console.error('[EmailApp] Failed to connect to realtime:', error);
      }
      
      // Set up DOM event listeners
      this.shadowRoot.addEventListener('email-sent', this._handleEmailSent);
      this.shadowRoot.addEventListener('compose-cancelled', this._handleComposeCancelled);
      
      // Note: Frontend only receives realtime updates from backend
      // No need to listen for agent update events since agent sends directly via realtime API
      
      // Load providers
      this.loadProviders();
    }
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('email-sent', this._handleEmailSent);
    this.shadowRoot.removeEventListener('compose-cancelled', this._handleComposeCancelled);
  }

  async loadProviders() {
    try {
      this.loading = true;
      this.render();

      // Load connected providers using dataService
      this.providers = await dataService.getConnections();
      console.log('Loaded connected providers:', this.providers);
      this.loading = false;
      
      // If we have providers, select the first one
      if (this.providers.length > 0) {
        this.selectConnection(this.providers[0].authenticator_id || this.providers[0].name);
      }

      this.render();
    } catch (error) {
      console.error('Error loading providers:', error);
      this.error = error.message;
      this.loading = false;
      this.render();
    }
  }

  selectConnection(connectionId) {
    this.selectedConnectionId = connectionId;
    this.currentView = 'inbox';
    this.selectedMessageId = null;
    this.render();
  }

  handleViewChange(view) {
    this.currentView = view;
    this.selectedMessageId = null;
    this.render();
  }

  handleMessageSelected(messageId) {
    // Navigate to the dedicated email detail page route
    if (this.selectedConnectionId && messageId) {
      try {
        FIBER.router.navigateTo(`/email/${this.selectedConnectionId}/${messageId}`);
      } catch (error) {
        console.error('[EmailAgent] Router error - email details disabled until router is fixed:', error.message);
        // Do nothing - don't show email details until router works
      }
    }
  }

  handleEmailLink(messageId) {
    // Delegate to handleMessageSelected for consistent navigation
    this.handleMessageSelected(messageId);
  }

  handleComposeClick() {
    this.currentView = 'compose';
    this.selectedMessageId = null;
    this.render();
  }

  handleReplyClick(messageId) {
    this.currentView = 'compose';
    this.selectedMessageId = messageId;
    this.render();
  }

  handleEmailSent(detail) {
    const { asDraft } = detail;
    this.showNotification(asDraft ? 'Draft saved successfully' : 'Email sent successfully', 'success');
    this.handleViewChange(asDraft ? 'drafts' : 'inbox');
  }

  handleComposeCancelled() {
    this.handleViewChange('inbox');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = this.shadowRoot.querySelector('.notification-container');
    if (container) {
      container.appendChild(notification);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    }
  }

  handleRealtimeMessage(message) {
    console.log('[EmailApp] Received realtime message:', message);
    
    if (message.type === 'agent_update' || message.type === 'activation_completed') {
      // Handle agent activation updates
      this.showNotification(`Agent task completed: ${message.data?.status || 'Unknown'}`, 'success');
    } else if (message.type === 'email_notification') {
      // Handle email notifications
      this.showNotification(`Email update: ${message.data?.subject || 'New email'}`, 'info');
    } else if (message.type === 'connection_status') {
      // Handle connection status updates
      this.showNotification(`Connection status: ${message.data?.status || 'Updated'}`, 'info');
    }
  }

  // Frontend only receives realtime updates from backend
  // No need to send agent updates - the Python agent sends them directly

  render() {
    const hasProviders = this.providers.length > 0;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --primary-color: #4f46e5;
          --primary-hover: #4338ca;
          --secondary-color: #6b7280;
          --background-color: #f9fafb;
          --surface-color: #ffffff;
          --border-color: #e5e7eb;
          --text-primary: #111827;
          --text-secondary: #4b5563;
          --success-color: #10b981;
          --error-color: #ef4444;
          --warning-color: #f59e0b;
          --info-color: #3b82f6;
        }
        
        .email-app-container {
          max-width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--background-color);
        }
        
        .app-header {
          background-color: var(--surface-color);
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }
        
        .app-header h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }
        
        .header-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .header-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .compose-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
        }
        
        .compose-button:hover {
          background-color: var(--primary-hover);
        }
        
        .settings-button {
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        
        .settings-button:hover {
          background-color: var(--background-color);
        }
        
        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .sidebar {
          width: 240px;
          background-color: var(--surface-color);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }
        
        .provider-selector {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .provider-selector select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        
        .nav-menu {
          padding: 1rem 0;
        }
        
        .nav-item {
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .nav-item:hover {
          background-color: var(--background-color);
        }
        
        .nav-item.active {
          color: var(--primary-color);
          background-color: #ede9fe;
          font-weight: 500;
        }
        
        .content-area {
          flex: 1;
          overflow: auto;
          padding: 1rem;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--secondary-color);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(79, 70, 229, 0.1);
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--error-color);
          text-align: center;
          padding: 2rem;
        }
        
        .error-container i {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        
        .retry-button {
          margin-top: 1rem;
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--secondary-color);
          text-align: center;
          padding: 2rem;
        }
        
        .empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: var(--border-color);
        }
        
        .empty-state h2 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: var (--text-primary);
        }
        
        .connect-button {
          margin-top: 1.5rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        
        .connect-button:hover {
          background-color: var(--primary-hover);
        }
        
        .notification-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 1000;
        }
        
        .notification {
          background-color: var(--surface-color);
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 0.75rem 1rem;
          min-width: 250px;
          max-width: 350px;
          border-left: 4px solid var(--info-color);
          animation: slide-in 0.3s ease forwards;
          transition: opacity 0.3s, transform 0.3s;
        }
        
        .notification.success {
          border-left-color: var(--success-color);
        }
        
        .notification.error {
          border-left-color: var(--error-color);
        }
        
        .notification.warning {
          border-left-color: var(--warning-color);
        }
        
        .notification.fade-out {
          opacity: 0;
          transform: translateX(100%);
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      </style>
      
      <div class="email-app-container">
        <header class="app-header">
          <h1>Email Agent App</h1>
          <div class="header-actions">
            ${this.selectedConnectionId ? `
              <button class="header-button compose-button" id="compose-button">
                <i class="fas fa-pen"></i> Compose
              </button>
            ` : ''}
            <a href="/email-agent-app/settings" class="settings-link">
              <button class="header-button settings-button">
                <i class="fas fa-cog"></i> Settings
              </button>
            </a>
          </div>
        </header>
        
        ${this.loading ? `
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading email connections...</p>
          </div>
        ` : this.error ? `
          <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error: ${this.error}</p>
            <button class="retry-button" id="retry-button">Retry</button>
          </div>
        ` : !hasProviders ? `
          <div class="empty-state">
            <i class="fas fa-envelope"></i>
            <h2>No Email Accounts Connected</h2>
            <p>Connect your email accounts to start managing your emails.</p>
            <a href="/email-agent-app/settings" class="connect-link">
              <button class="connect-button">Connect Email Account</button>
            </a>
          </div>
        ` : `
          <div class="main-content">
            <aside class="sidebar">
              <div class="provider-selector">
                <select id="provider-select">
                  ${this.providers.map(provider => `
                    <option value="${provider.authenticator_id || provider.name}" ${(provider.authenticator_id || provider.name) === this.selectedConnectionId ? 'selected' : ''}>
                      ${provider.name || provider.authenticator_name || 'Unknown Provider'}
                    </option>
                  `).join('')}
                </select>
              </div>
              <nav class="nav-menu">
                <div class="nav-item ${this.currentView === 'inbox' ? 'active' : ''}" data-view="inbox">
                  <i class="fas fa-inbox"></i> Inbox
                </div>
                <div class="nav-item ${this.currentView === 'sent' ? 'active' : ''}" data-view="sent">
                  <i class="fas fa-paper-plane"></i> Sent
                </div>
                <div class="nav-item ${this.currentView === 'drafts' ? 'active' : ''}" data-view="drafts">
                  <i class="fas fa-file-alt"></i> Drafts
                </div>
                <div class="nav-item ${this.currentView === 'starred' ? 'active' : ''}" data-view="starred">
                  <i class="fas fa-star"></i> Starred
                </div>
                <div class="nav-item ${this.currentView === 'labels' ? 'active' : ''}" data-view="labels">
                  <i class="fas fa-tag"></i> Labels
                </div>
              </nav>
            </aside>
            
            <main class="content-area">
              ${this.currentView === 'inbox' || this.currentView === 'sent' || this.currentView === 'drafts' || this.currentView === 'starred' ? `
                <email-search 
                  connection-id="${this.selectedConnectionId}" 
                  search-label="${this.currentView === 'sent' ? 'SENT' : this.currentView === 'drafts' ? 'DRAFT' : this.currentView === 'starred' ? 'STARRED' : 'INBOX'}"
                ></email-search>
              ` : this.currentView === 'message' && this.selectedMessageId ? `
                <email-detail 
                  connection-id="${this.selectedConnectionId}" 
                  message-id="${this.selectedMessageId}"
                ></email-detail>
              ` : this.currentView === 'compose' ? `
                <email-compose 
                  connection-id="${this.selectedConnectionId}"
                  ${this.selectedMessageId ? `reply-to-message-id="${this.selectedMessageId}"` : ''}
                ></email-compose>
              ` : this.currentView === 'labels' ? `
                <label-manager
                  connection-id="${this.selectedConnectionId}"
                ></label-manager>
              ` : ''}
            </main>
          </div>
        `}
        
        <div class="notification-container"></div>
      </div>
    `;

    // Add event listeners
    if (!this.loading && !this.error && hasProviders) {
      // Provider selector
      const providerSelect = this.shadowRoot.querySelector('#provider-select');
      if (providerSelect) {
        providerSelect.addEventListener('change', (e) => {
          this.selectConnection(e.target.value);
        });
      }

      // Nav menu items
      this.shadowRoot.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          this.handleViewChange(item.dataset.view);
        });
      });

      // Compose button
      const composeButton = this.shadowRoot.querySelector('#compose-button');
      if (composeButton) {
        composeButton.addEventListener('click', () => {
          this.handleComposeClick();
        });
      }

      // Email search message selection
      const emailSearch = this.shadowRoot.querySelector('email-search');
      if (emailSearch) {
        emailSearch.addEventListener('message-selected', (e) => {
          this.handleMessageSelected(e.detail.messageId);
        });
      }

      // Email detail reply
      const emailDetail = this.shadowRoot.querySelector('email-detail');
      if (emailDetail) {
        emailDetail.addEventListener('reply-click', (e) => {
          this.handleReplyClick(e.detail.messageId);
        });
      }
    }

    // Retry button
    const retryButton = this.shadowRoot.querySelector('#retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.loadProviders();
      });
    }
  }
}

customElements.define('email-agent-app', EmailAgentApp);
