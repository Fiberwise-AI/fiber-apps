import { dataService } from '../services/data-service.js';
import { FIBER } from '../../index.js';

export class EmailSettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.connections = [];
    this.providers = [];
    this.loading = true;
    this.error = null;
  }

  connectedCallback() {
    this.render();
    this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      this.render();

      // Load available providers and their connection status using the service providers API
      const providersResponse = await dataService.getServiceProviders();
      this.providers = (providersResponse || []).map(provider => ({
        id: provider.authenticator_id || provider.authenticator_id,
        name: provider.name || provider.display_name,
        type: provider.authenticator_type || provider.authenticator_type,
        description: provider.description || `Connect your ${provider.name || provider.display_name} account`,
        is_connected: Boolean(provider.is_connected)
      }));
      
      // Filter to get only actually connected providers
      this.connections = this.providers.filter(provider => provider.is_connected).map(provider => ({
        id: provider.id,
        provider_id: provider.id,
        provider_name: provider.name,
        authenticator_type: provider.type,
        email: 'Connected Account' // We don't have email info in this API
      }));
      
      console.log('EMAIL-SETTINGS: Loaded providers:', this.providers);
      console.log('EMAIL-SETTINGS: Connected providers:', this.connections);
      
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Error loading data:', error);
      this.error = error.message;
      this.loading = false;
      this.render();
    }
  }

  async removeConnection(connectionId) {
    try {
      // Display confirmation
      if (!confirm('Are you sure you want to remove this connection?')) {
        return;
      }
      
      // Remove connection using dataService
      await dataService.revokeConnection(connectionId);
      
      // Reload connections
      this.loadData();
      
      // Show notification
      this.showNotification('Connection removed successfully', 'success');
    } catch (error) {
      console.error('Error removing connection:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  // Helper to get provider icon based on provider type
  getProviderIcon(providerType) {
    const lowerType = (providerType || '').toLowerCase();
    
    if (lowerType.includes('google')) return 'google';
    if (lowerType.includes('microsoft') || lowerType.includes('outlook')) return 'microsoft';
    if (lowerType.includes('yahoo')) return 'yahoo';
    if (lowerType.includes('apple') || lowerType.includes('icloud')) return 'apple';
    if (lowerType.includes('github')) return 'github';
    
    // Default icon
    return 'envelope';
  }
  
  // Helper to get provider color based on provider type
  getProviderColor(providerType) {
    const lowerType = (providerType || '').toLowerCase();
    
    if (lowerType.includes('google')) return '#DB4437';
    if (lowerType.includes('microsoft') || lowerType.includes('outlook')) return '#0078D4';
    if (lowerType.includes('yahoo')) return '#6001D2';
    if (lowerType.includes('apple') || lowerType.includes('icloud')) return '#555555';
    if (lowerType.includes('github')) return '#24292E';
    
    // Default color
    return '#6b7280';
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

  render() {
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
        
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .header {
          margin-bottom: 2rem;
        }
        
        .header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          color: var(--text-primary);
        }
        
        .header p {
          margin: 0;
          color: var(--text-secondary);
        }
        
        .section {
          margin-bottom: 2rem;
          background-color: var(--surface-color);
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .section-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .section-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .section-body {
          padding: 1.25rem;
        }
        
        .provider-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .provider-card {
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .provider-header {
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .provider-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
        }
        
        .provider-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        
        .provider-body {
          padding: 1rem;
        }
        
        .provider-description {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .connection-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #d1fae5;
          color: #065f46;
          margin-bottom: 1rem;
        }
        
        .provider-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .action-button {
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          cursor: pointer;
          border: 1px solid var(--border-color);
          background-color: var(--surface-color);
          color: var(--text-primary);
        }
        
        .action-button:hover {
          background-color: var(--background-color);
        }
        
        .action-button.connect {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        
        .action-button.connect:hover {
          background-color: var(--primary-hover);
        }
        
        .action-button.disconnect {
          background-color: var(--error-color);
          color: white;
          border-color: var(--error-color);
        }
        
        .action-button.disconnect:hover {
          background-color: #dc2626;
        }
        
        .connections-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .connection-item {
          display: flex;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          align-items: center;
        }
        
        .connection-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          margin-right: 0.75rem;
        }
        
        .connection-info {
          flex: 1;
        }
        
        .connection-name {
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }
        
        .connection-email {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }
        
        .connection-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--secondary-color);
        }
        
        .spinner {
          width: 2rem;
          height: 2rem;
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
          padding: 1rem;
          background-color: #fee2e2;
          border-radius: 0.375rem;
          color: #b91c1c;
          margin-bottom: 1rem;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--secondary-color);
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
      
      <div class="settings-container">
        <div class="header">
          <h1>Email Account Settings</h1>
          <p>Connect and manage your email accounts to use with the Email Agent App.</p>
        </div>
        
        ${this.error ? `
          <div class="error-container">
            ${this.error}
          </div>
        ` : ''}
        
        ${this.loading ? `
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading email connections...</p>
          </div>
        ` : `
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">Your Connected Accounts</h2>
            </div>
            <div class="section-body">
              ${this.connections.length === 0 ? `
                <div class="empty-state">
                  <p>You don't have any email accounts connected yet.</p>
                </div>
              ` : `
                <div class="connections-list">
                  ${this.connections.map(connection => {
                    const providerIcon = this.getProviderIcon(connection.authenticator_type);
                    const providerColor = this.getProviderColor(connection.authenticator_type);
                    return `
                      <div class="connection-item">
                        <div class="connection-icon" style="background-color: ${providerColor}">
                          <i class="fab fa-${providerIcon}"></i>
                        </div>
                        <div class="connection-info">
                          <div class="connection-name">${connection.provider_name || connection.authenticator_type || 'Email Provider'}</div>
                          <div class="connection-email">${connection.email || connection.user_identifier || 'Connected Account'}</div>
                        </div>
                        <div class="connection-actions">
                          <button class="action-button disconnect" data-connection-id="${connection.id || connection.connection_id}">
                            <i class="fas fa-unlink"></i> Disconnect
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>
          
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">Available Email Providers</h2>
            </div>
            <div class="section-body">
              <div class="provider-list">
                ${this.providers.map(provider => {
                  const isConnected = provider.is_connected; // Use the actual connection status from API
                  const providerIcon = this.getProviderIcon(provider.type);
                  const providerColor = this.getProviderColor(provider.type);
                  return `
                    <div class="provider-card">
                      <div class="provider-header">
                        <div class="provider-icon" style="background-color: ${providerColor}">
                          <i class="fab fa-${providerIcon}"></i>
                        </div>
                        <h3 class="provider-name">${provider.name}</h3>
                      </div>
                      <div class="provider-body">
                        <p class="provider-description">${provider.description || `Connect your ${provider.name} email account`}</p>
                        ${isConnected ? `
                          <div class="connection-badge">
                            <i class="fas fa-check"></i> Connected
                          </div>
                        ` : ''}
                        <div class="provider-actions">
                          ${isConnected ? `
                            <button class="action-button" id="configure-${provider.id}">
                              <i class="fas fa-cog"></i> Configure
                            </button>
                          ` : `
                            <button class="action-button connect" id="connect-${provider.id}" data-authenticator-id="${provider.id}">
                              <i class="fas fa-plug"></i> Connect
                            </button>
                          `}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `}
        
        <div class="notification-container"></div>
      </div>
    `;
    
    // Add event listeners
    if (!this.loading) {
      // Disconnect buttons
      this.shadowRoot.querySelectorAll('.action-button.disconnect').forEach(button => {
        button.addEventListener('click', () => {
          const connectionId = button.dataset.connectionId;
          if (connectionId) {
            this.removeConnection(connectionId);
          }
        });
      });
      
      // Connect buttons
      this.shadowRoot.querySelectorAll('.action-button.connect').forEach(button => {
        button.addEventListener('click', () => {
          const authenticatorId = button.dataset.authenticatorId;
          if (authenticatorId) {
            this.dispatchEvent(new CustomEvent('connect-provider', {
              bubbles: true,
              composed: true,
              detail: { authenticatorId }
            }));
            
            // Create and mount the authenticator connection component
            const connectionEl = document.createElement('authenticator-connection');
            connectionEl.setAttribute('authenticator-id', authenticatorId);
            
            document.body.appendChild(connectionEl);
          }
        });
      });
    }
  }
}

customElements.define('email-settings', EmailSettings);
