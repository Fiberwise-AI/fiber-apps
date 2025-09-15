import { FIBER } from '../../index.js';
import { dataService } from '../services/data-service.js';
import { emailService } from '../services/email-service.js';

export class AuthenticatorConnection extends HTMLElement {
  constructor() {
    super();
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize state
    this.authenticators = [];
    this.connections = [];
    this.loading = true;
    this.error = null;
    this.selectedAuthenticatorId = '';
    this.connectingAuthenticator = null;
    
    // Bind event handlers
    this.handleConnectionStatus = this.handleConnectionStatus.bind(this);
    
    // Create stylesheet
    this.setupStyles();
    
    // Initial render
    this.render();
  }
  
  // Lifecycle callbacks
  connectedCallback() {
    // Listen for connection status updates
    document.addEventListener('connection-status', this.handleConnectionStatus);
    
    // Load data
    this.loadData();
  }
  
  disconnectedCallback() {
    document.removeEventListener('connection-status', this.handleConnectionStatus);
  }

  // Event handlers
  handleConnectionStatus(event) {
    const { status, service_authenticator_id } = event.detail;
    
    // Refresh connections list when status changes
    this.loadData();
    
    // Stop connecting spinner if this was the provider we were connecting
    if (service_authenticator_id === this.connectingAuthenticator) {
      this.connectingAuthenticator = null;
      this.render();
    }
  }

  // Data loading methods
  async loadData() {
    try {
      this.loading = true;
      this.render();
      
      // Get available authenticators from the service providers API
      const response = await dataService.getServiceProviders();
      const providers = response || [];

      this.authenticators = providers.map(provider => ({
        id: provider.authenticator_id || provider.authenticator_id,
        name: provider.name || provider.display_name,
        type: provider.authenticator_type || provider.authenticator_type || 'oauth2',
        description: provider.description || `Connect your ${provider.name || provider.display_name} account`,
        is_connected: Boolean(provider.is_connected)
      }));

      this.connections = providers
        .filter(provider => Boolean(provider.is_connected))
        .map(provider => ({
          id: provider.authenticator_id || provider.authenticator_id,
          authenticator_id: provider.authenticator_id,
          authenticator_name: provider.name || provider.display_name,
          authenticator_type: provider.authenticator_type || provider.authenticator_type,
          email: 'Connected Account' // We don't have email info in this API
        }));
    } catch (error) {
      console.error('Error loading provider data:', error);
      this.error = 'Failed to load provider information. Please try again.';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  // UI interaction methods
  async connectAuthenticator(authenticatorId) {
    try {
      this.connectingAuthenticator = authenticatorId;
      this.render();
      
      // Use FIBER.credentials.connectAuthenticator for OAuth flow
      await FIBER.credentials.connectAuthenticator(authenticatorId, {
        returnTo: FIBER._appBridge?._router?.getCurrentPath() || '/'
      });
      
      // The connectAuthenticator method will handle the redirect
    } catch (error) {
      console.error('Error connecting authenticator:', error);
      this.error = 'Failed to connect to the authenticator. Please try again.';
      this.connectingAuthenticator = null;
      this.render();
    }
  }

  async disconnectConnection(connection) {
    try {
      const connectionId = connection.id || connection.authenticator_id;
      const confirmed = confirm(`Are you sure you want to disconnect ${connection.authenticator_name || connection.authenticator_type}?`);
      
      if (confirmed) {
        await dataService.revokeConnection(connectionId);
        this.loadConnections();
        
        // Show success message
        const event = new CustomEvent('email-service-notification', {
          bubbles: true,
          composed: true,
          detail: {
            type: 'success',
            title: 'Connection Removed',
            message: `${connection.authenticator_name || connection.authenticator_type} has been disconnected`,
            level: 'success'
          }
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error disconnecting authenticator:', error);
      this.error = 'Failed to disconnect the authenticator. Please try again.';
      this.render();
    }
  }
  
  async checkConnection(connection) {
    try {
      const connectionId = connection.id || connection.authenticator_id;
      
      // Show checking indicator
      this.connectingAuthenticator = connectionId;
      this.render();
      
      // Use email service to check connection
      await emailService.checkConnectionStatus(connectionId);
      
      // Clear checking indicator
      this.connectingAuthenticator = null;
      this.render();
    } catch (error) {
      console.error('Error checking connection:', error);
      this.connectingAuthenticator = null;
      this.render();
      
      // Show error message
      const event = new CustomEvent('email-service-notification', {
        bubbles: true,
        composed: true,
        detail: {
          type: 'error',
          title: 'Connection Check Failed',
          message: `Could not verify connection: ${error.message}`,
          level: 'error'
        }
      });
      document.dispatchEvent(event);
    }
  }
  
  clearError() {
    this.error = null;
    this.render();
  }

  // Helper methods
  getAuthenticatorIcon(authenticatorType) {
    const lowerType = (authenticatorType || '').toLowerCase();
    
    if (lowerType.includes('google')) return 'google';
    if (lowerType.includes('microsoft') || lowerType.includes('outlook')) return 'microsoft';
    if (lowerType.includes('yahoo')) return 'yahoo';
    if (lowerType.includes('apple') || lowerType.includes('icloud')) return 'apple';
    
    // Default icon
    return 'envelope';
  }
  
  // Setup styles for shadow DOM
  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .provider-connection-container {
        padding: 1rem;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      h2 {
        font-size: 1.25rem;
        margin-top: 0;
        margin-bottom: 1rem;
        color: #374151;
      }
      
      h3 {
        font-size: 1rem;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: #4B5563;
      }
      
      .error-message {
        background-color: #FEF2F2;
        border: 1px solid #F87171;
        color: #B91C1C;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .close-button {
        background: none;
        border: none;
        color: #B91C1C;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: #6B7280;
      }
      
      .spinner {
        display: inline-block;
        width: 1.5rem;
        height: 1.5rem;
        border: 2px solid rgba(108, 126, 254, 0.3);
        border-radius: 50%;
        border-top-color: #6c7efe;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
      }
      
      .spinner.small {
        width: 1rem;
        height: 1rem;
        border-width: 2px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6B7280;
      }
      
      .empty-state i {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #E5E7EB;
      }
      
      .empty-state p {
        margin: 0.5rem 0;
      }
      
      .empty-description {
        font-size: 0.875rem;
        color: #9CA3AF;
      }
      
      .connections-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .connection-card {
        border: 1px solid #E5E7EB;
        border-radius: 0.5rem;
        padding: 1rem;
        transition: box-shadow 0.2s, transform 0.2s;
      }
      
      .connection-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
      }
      
      .connection-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .provider-icon {
        width: 2.5rem;
        height: 2.5rem;
        background-color: #F3F4F6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 0.75rem;
        font-size: 1.25rem;
        color: #6c7efe;
      }
      
      .connection-info {
        flex: 1;
      }
      
      .connection-info h3 {
        margin: 0;
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }
      
      .connection-email {
        font-size: 0.875rem;
        color: #6B7280;
      }
      
      .connection-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      
      .check-button, .disconnect-button {
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: background-color 0.2s;
      }
      
      .check-button {
        background-color: #F9FAFB;
        border: 1px solid #E5E7EB;
        color: #374151;
      }
      
      .check-button:hover {
        background-color: #F3F4F6;
      }
      
      .disconnect-button {
        background-color: transparent;
        border: 1px solid #EF4444;
        color: #EF4444;
      }
      
      .disconnect-button:hover {
        background-color: #FEF2F2;
      }
      
      .providers-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      
      .provider-button {
        padding: 0.625rem 1rem;
        border-radius: 0.375rem;
        background-color: #F3F4F6;
        border: 1px solid #E5E7EB;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: background-color 0.2s;
      }
      
      .provider-button:hover {
        background-color: #E5E7EB;
      }
      
      button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  // Render UI
  render() {
    // Clear existing content except the style
    const style = this.shadowRoot.querySelector('style');
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    
    // Create main container
    const container = document.createElement('div');
    container.className = 'provider-connection-container';
    
    // Create heading
    const heading = document.createElement('h2');
    heading.textContent = 'Connected Email Accounts';
    container.appendChild(heading);
    
    // Add error message if any
    if (this.error) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = this.error;
      
      const closeButton = document.createElement('button');
      closeButton.className = 'close-button';
      closeButton.textContent = '×';
      closeButton.addEventListener('click', () => this.clearError());
      
      errorMessage.appendChild(closeButton);
      container.appendChild(errorMessage);
    }
    
    // Create connections list
    const connectionsList = document.createElement('div');
    connectionsList.className = 'connections-list';
    
    if (this.loading) {
      // Loading state
      const loadingContainer = document.createElement('div');
      loadingContainer.className = 'loading-container';
      
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      loadingContainer.appendChild(spinner);
      
      const loadingText = document.createElement('span');
      loadingText.textContent = 'Loading your connections...';
      loadingContainer.appendChild(loadingText);
      
      connectionsList.appendChild(loadingContainer);
    } else if (this.connections.length === 0) {
      // Empty state
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const emptyIcon = document.createElement('i');
      emptyIcon.className = 'fas fa-inbox';
      emptyState.appendChild(emptyIcon);
      
      const emptyText = document.createElement('p');
      emptyText.textContent = 'No email accounts connected';
      emptyState.appendChild(emptyText);
      
      const emptyDescription = document.createElement('p');
      emptyDescription.className = 'empty-description';
      emptyDescription.textContent = 'Connect an email provider to get started.';
      emptyState.appendChild(emptyDescription);
      
      connectionsList.appendChild(emptyState);
    } else {
      // Show connections
      this.connections.forEach(connection => {
        const card = document.createElement('div');
        card.className = 'connection-card';
        
        // Create card header with icon and info
        const header = document.createElement('div');
        header.className = 'connection-header';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'provider-icon';
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${this.getAuthenticatorIcon(connection.authenticator_type)}`;
        iconContainer.appendChild(icon);
        
        header.appendChild(iconContainer);
        
        const info = document.createElement('div');
        info.className = 'connection-info';
        
        const name = document.createElement('h3');
        name.textContent = connection.authenticator_name || connection.authenticator_type;
        info.appendChild(name);
        
        if (connection.email) {
          const email = document.createElement('div');
          email.className = 'connection-email';
          email.textContent = connection.email;
          info.appendChild(email);
        }
        
        header.appendChild(info);
        card.appendChild(header);
        
        // Create action buttons
        const actions = document.createElement('div');
        actions.className = 'connection-actions';
        
        const checkButton = document.createElement('button');
        checkButton.className = 'check-button';
        
        if (this.connectingAuthenticator === connection.id) {
          const checkSpinner = document.createElement('span');
          checkSpinner.className = 'spinner small';
          checkButton.appendChild(checkSpinner);
          
          const checkingText = document.createTextNode(' Checking...');
          checkButton.appendChild(checkingText);
          checkButton.disabled = true;
        } else {
          const checkIcon = document.createElement('i');
          checkIcon.className = 'fas fa-sync-alt';
          checkButton.appendChild(checkIcon);
          
          const checkText = document.createTextNode(' Check');
          checkButton.appendChild(checkText);
          checkButton.addEventListener('click', () => this.checkConnection(connection));
        }
        
        actions.appendChild(checkButton);
        
        const disconnectButton = document.createElement('button');
        disconnectButton.className = 'disconnect-button';
        
        const disconnectIcon = document.createElement('i');
        disconnectIcon.className = 'fas fa-unlink';
        disconnectButton.appendChild(disconnectIcon);
        
        const disconnectText = document.createTextNode(' Disconnect');
        disconnectButton.appendChild(disconnectText);
        disconnectButton.addEventListener('click', () => this.disconnectConnection(connection));
        
        actions.appendChild(disconnectButton);
        card.appendChild(actions);
        
        connectionsList.appendChild(card);
      });
    }
    
    container.appendChild(connectionsList);
    
    // Add Email Account section
    const addTitle = document.createElement('h3');
    addTitle.textContent = 'Add Email Account';
    container.appendChild(addTitle);
    
    const providersList = document.createElement('div');
    providersList.className = 'providers-list';
    
    this.authenticators.forEach(provider => {
      const providerButton = document.createElement('button');
      providerButton.className = 'provider-button';
      
      if (this.connectingAuthenticator === provider.id) {
        const connectingSpinner = document.createElement('span');
        connectingSpinner.className = 'spinner small';
        providerButton.appendChild(connectingSpinner);
        
        const connectingText = document.createTextNode(' Connecting...');
        providerButton.appendChild(connectingText);
        providerButton.disabled = true;
      } else {
        const authenticatorIcon = document.createElement('i');
        authenticatorIcon.className = `fas fa-${this.getAuthenticatorIcon(provider.type)}`;
        providerButton.appendChild(authenticatorIcon);
        
        const authenticatorText = document.createTextNode(` Connect ${provider.name}`);
        providerButton.appendChild(authenticatorText);
        providerButton.addEventListener('click', () => this.connectAuthenticator(provider.id));
      }
      
      providersList.appendChild(providerButton);
    });
    
    container.appendChild(providersList);
    
    // Add container to shadow root
    this.shadowRoot.appendChild(container);
  }
}

customElements.define('authenticator-connection', AuthenticatorConnection);
