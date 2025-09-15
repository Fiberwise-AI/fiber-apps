import { FIBER } from '../../index.js';
import { emailService } from '../services/email-service.js';
import { dataService } from '../services/data-service.js';

// Create a vanilla JavaScript web component
class EmailConnections extends HTMLElement {
  constructor() {
    super();
    this.providers = [];
    this.connections = [];
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize the DOM
    this.render();
    
    // Bind event handlers
    this.handleConnectionStatus = this.handleConnectionStatus.bind(this);
    this.clearMessages = this.clearMessages.bind(this);
  }
  
  // Custom element lifecycle methods
  connectedCallback() {
    console.log('EMAIL-CONNECTIONS: Component connected - UPDATED VERSION RUNNING');
    this.loadData();
    // Listen for connection changes from credential service
    window.addEventListener('connection-status', this.handleConnectionStatus);
  }

  disconnectedCallback() {
    window.removeEventListener('connection-status', this.handleConnectionStatus);
  }
  
  // Handle connection status updates
  handleConnectionStatus(event) {
    const status = event.detail;
    if (status.status === 'connected') {
      this.successMessage = `Successfully connected to ${status.authenticator_name || 'provider'}`;
      this.loadData(); // Refresh the data
      this.render(); // Update the UI
    }
  }

  // Load providers and connections data
  async loadData() {
    console.log('EMAIL-CONNECTIONS: loadData() called');
    this.loading = true;
    this.error = null;
    this.render();
    
    try {
      // Get available providers for this app
      console.log('EMAIL-CONNECTIONS: Calling dataService.getServiceProviders()');
      const providers = await dataService.getServiceProviders();
      console.log('EMAIL-CONNECTIONS: Raw API response:', providers);
      console.log('EMAIL-CONNECTIONS: Provider structure:', providers.map(p => ({
        provider_id: p.provider_id,
        authenticator_id: p.authenticator_id,
        id: p.id,
        name: p.name,
        status: p.status,
        allKeys: Object.keys(p)
      })));
      
      // Use the providers from the API response - ensure we have proper provider_id
      this.providers = (providers || []).map(provider => ({
        id: provider.provider_id || provider.authenticator_id, // Use provider_id as primary, fallback to authenticator_id
        provider_id: provider.provider_id || provider.authenticator_id,
        authenticator_id: provider.authenticator_id || provider.provider_id,
        provider_key: provider.provider_key,
        name: provider.name || provider.display_name,
        icon: `/static/icons/${(provider.authenticator_type || provider.authenticator_type || 'email').toLowerCase()}.svg`,
        description: `Connect your ${provider.name || provider.display_name} account to read, send, and analyze emails.`,
        scopes: provider.scopes || [],
        type: provider.authenticator_type || provider.authenticator_type,
        is_connected: Boolean(provider.is_connected), // Use the actual connection status from API
        connection_status: provider.connection_status || (provider.is_connected ? 'connected' : 'disconnected') // Add connection status
      }));
      
      // Filter connected providers from the same list
      this.connections = this.providers.filter(provider => provider.is_connected);
      
      console.log('EMAIL-CONNECTIONS: Final processed providers:', this.providers);
      console.log('EMAIL-CONNECTIONS: Connected providers only:', this.connections);
      
      console.log('Loaded providers:', this.providers);
      console.log('Loaded connections:', this.connections);
    } catch (error) {
      console.error('Error loading provider data:', error);
      this.error = 'Failed to load provider information. Please try again.';
    } finally {
      this.loading = false;
      this.render(); // Update the UI with the loaded data
    }
  }

  // Get information about a provider
  getProviderInfo(type) {
    const providers = {
      google: {
        id: 'google',
        name: 'Google',
        icon: '/static/icons/google.svg',
        description: 'Connect your Gmail account to read, send, and analyze emails.',
        scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']
      },
      microsoft: {
        id: 'microsoft',
        name: 'Microsoft',
        icon: '/static/icons/microsoft.svg',
        description: 'Connect your Outlook or Microsoft 365 email account.',
        scopes: ['Mail.Read', 'Mail.Send']
      },
      yahoo: {
        id: 'yahoo',
        name: 'Yahoo',
        icon: '/static/icons/yahoo.svg',
        description: 'Connect your Yahoo Mail account to access your emails.',
        scopes: ['mail-r', 'mail-w']
      }
    };
    
    return providers[type] || {
      id: type,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      icon: '/static/icons/email.svg',
      description: 'Connect your email account.'
    };
  }

  // Connect to a provider
  async connectAuthenticator(authenticatorId) {
    console.log('EMAIL-CONNECTIONS: connectAuthenticator called with ID:', authenticatorId);
    try {
      console.log('EMAIL-CONNECTIONS: Attempting to connect with authenticatorId:', authenticatorId);
      console.log('EMAIL-CONNECTIONS: Available providers:', this.providers);
      
      // Find the provider to get proper ID
      const provider = this.providers.find(p => p.id === authenticatorId);
      console.log('EMAIL-CONNECTIONS: Found provider:', provider);
      
      if (!provider) {
        throw new Error('Provider not found');
      }
      
      // Use the actual authenticator_id from the provider
      const actualId = provider.authenticator_id || provider.provider_id;
      console.log('EMAIL-CONNECTIONS: Using actual authenticator ID:', actualId);
      
      if (!actualId) {
        throw new Error('No valid authenticator ID found for provider');
      }
      
      // Update the UI immediately to show connecting state (only if not already pending)
      const providerIndex = this.providers.findIndex(p => p.id === authenticatorId);
      if (providerIndex >= 0 && provider.connection_status !== 'pending') {
        this.providers[providerIndex].connection_status = 'pending';
        this.providers[providerIndex].is_connected = false;
        this.render(); // Re-render to show pending state immediately
      }
      
      // Determine the return URL for after authentication
      const returnPath = `/email-agent-app/settings/email-connections`;
      
      // Use the connectAuthenticator method from the FIBER.credentials service
      if (!FIBER || !FIBER.credentials) {
        throw new Error('FIBER SDK not available');
      }
      
      await FIBER.credentials.connectAuthenticator(actualId, {
        returnTo: returnPath
      });
      
      // The connectAuthenticator method will handle the redirect
    } catch (error) {
      console.error('Error initiating connection:', error);
      
      // Reset the provider state on error
      const providerIndex = this.providers.findIndex(p => p.id === authenticatorId);
      if (providerIndex >= 0) {
        this.providers[providerIndex].connection_status = 'disconnected';
        this.providers[providerIndex].is_connected = false;
      }
      
      this.error = `Failed to connect to provider. Please try again: ${error.message}`;
      this.render();
    }
  }

  // Cancel a pending connection
  async cancelConnection(authenticatorId) {
    try {
      const provider = this.providers.find(p => p.authenticator_id === authenticatorId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      const actualId = provider.authenticator_id;
      
      // Call the disconnect method to remove the pending connection
      await this.disconnectConnection(actualId);
      
      this.successMessage = 'Pending connection canceled successfully';
      this.render();
    } catch (error) {
      console.error('Error canceling connection:', error);
      this.error = `Failed to cancel connection: ${error.message}`;
      this.render();
    }
  }

  // Disconnect a provider
  async disconnectConnection(connectionId) {
    console.log('EMAIL-CONNECTIONS: disconnectConnection called with:', connectionId);
    
    if (!connectionId || connectionId === 'undefined') {
      console.error('EMAIL-CONNECTIONS: Invalid connection ID:', connectionId);
      this.error = 'Invalid connection ID. Please refresh the page and try again.';
      this.render();
      return;
    }
    
    if (!confirm('Are you sure you want to disconnect this provider? This will remove access to your email account.')) {
      return;
    }
    
    try {
      await dataService.revokeConnection(connectionId);
      this.successMessage = 'Provider disconnected successfully';
      // Refresh connections
      await this.loadData();
    } catch (error) {
      console.error('Error disconnecting provider:', error);
      this.error = 'Failed to disconnect provider. Please try again.';
      this.render();
    }
  }

  // Test a connection
  async testConnection(connectionId) {
    try {
      this.loading = true;
      this.render();
      
      const result = await emailService.checkConnectionStatus(connectionId);
      
      if (result.status === 'success' && result.result?.connected) {
        this.successMessage = 'Connection verified successfully';
      } else {
        this.error = result.result?.message || 'Connection verification failed';
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      this.error = 'Failed to test connection. Please try again.';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  // Clear error and success messages
  clearMessages() {
    this.error = null;
    this.successMessage = null;
    this.render();
  }
  
  // Create the component styles
  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        padding: 1rem;
        --primary-color: #4a6da7;
        --success-color: #28a745;
        --danger-color: #dc3545;
        --warning-color: #ffc107;
        --info-color: #17a2b8;
        --light-color: #f8f9fa;
        --dark-color: #343a40;
        --border-color: #e0e0e0;
      }

      .container {
        max-width: 900px;
        margin: 0 auto;
      }

      .page-title {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        color: var(--primary-color);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.5rem;
      }

      .provider-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .provider-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .provider-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
      }

      .provider-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }

      .provider-icon {
        width: 40px;
        height: 40px;
        margin-right: 0.75rem;
        object-fit: contain;
      }

      .provider-name {
        font-size: 1.25rem;
        font-weight: 500;
      }

      .provider-description {
        margin-bottom: 1rem;
        color: var(--dark-color);
        flex-grow: 1;
      }

      .provider-action {
        margin-top: auto;
      }

      .btn {
        display: inline-block;
        font-weight: 500;
        text-align: center;
        vertical-align: middle;
        cursor: pointer;
        border: 1px solid transparent;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        line-height: 1.5;
        border-radius: 0.25rem;
        transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
        text-decoration: none;
      }

      .btn-primary {
        color: white;
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }

      .btn-primary:hover {
        background-color: #3a5d97;
        border-color: #355588;
      }

      .btn-success {
        color: white;
        background-color: var(--success-color);
        border-color: var(--success-color);
      }

      .btn-success:hover {
        background-color: #218838;
        border-color: #1e7e34;
      }

      .btn-warning {
        color: white;
        background-color: var(--warning-color);
        border-color: var(--warning-color);
      }

      .btn-warning:hover {
        background-color: #e0a800;
        border-color: #d39e00;
      }

      .btn-secondary {
        color: white;
        background-color: #6c757d;
        border-color: #6c757d;
      }

      .btn-secondary:hover {
        background-color: #5a6268;
        border-color: #545b62;
      }

      .btn-danger {
        color: white;
        background-color: var(--danger-color);
        border-color: var(--danger-color);
      }

      .btn-danger:hover {
        background-color: #c82333;
        border-color: #bd2130;
      }

      .alert {
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid transparent;
        border-radius: 0.25rem;
      }

      .alert-info {
        color: #0c5460;
        background-color: #d1ecf1;
        border-color: #bee5eb;
      }

      .alert-warning {
        color: #856404;
        background-color: #fff3cd;
        border-color: #ffeeba;
      }

      .alert-danger {
        color: #721c24;
        background-color: #f8d7da;
        border-color: #f5c6cb;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        margin: 2rem 0;
      }

      .empty-state-icon {
        font-size: 3rem;
        color: var(--border-color);
        margin-bottom: 1rem;
      }

      .empty-state-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--dark-color);
        margin-bottom: 1rem;
      }

      .empty-state-text {
        font-size: 1.25rem;
        color: var(--dark-color);
        margin-bottom: 1.5rem;
      }

      .no-providers-state {
        background: #fff9e6;
        border-color: #ffd700;
        color: #856404;
      }

      .no-providers-state .empty-state-icon {
        color: #ffd700;
      }

      .no-providers-state .empty-state-title {
        color: #856404;
      }

      .no-providers-state .empty-state-text {
        color: #856404;
        font-size: 1rem;
      }

      .empty-state-details {
        text-align: left;
        background: rgba(255, 255, 255, 0.8);
        padding: 1.5rem;
        border-radius: 6px;
        margin-top: 1rem;
        border: 1px solid #f0e6a6;
      }

      .empty-state-details p {
        margin: 0 0 1rem 0;
        font-weight: 600;
      }

      .empty-state-details ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }

      .empty-state-details li {
        margin-bottom: 0.5rem;
      }

      .empty-state-details a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 600;
      }

      .empty-state-details a:hover {
        text-decoration: underline;
      }

      .section-title {
        font-size: 1.25rem;
        margin: 1.5rem 0 1rem;
        color: var(--dark-color);
      }

      .connected-providers {
        margin-top: 2rem;
      }

      .connection-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .connection-info {
        display: flex;
        align-items: center;
      }

      .connection-icon {
        width: 32px;
        height: 32px;
        margin-right: 0.75rem;
        object-fit: contain;
      }

      .connection-details h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
      }

      .connection-details p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }

      .connection-actions {
        display: flex;
        gap: 0.5rem;
      }

      .back-btn {
        margin-bottom: 1rem;
      }

      /* Loading spinner */
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
      }

      .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid var(--primary-color);
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    return style;
  }
  
  // Create error alert
  createErrorAlert() {
    if (!this.error) return null;
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle';
    alert.appendChild(icon);
    
    alert.appendChild(document.createTextNode(' ' + this.error));
    
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'btn btn-sm';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.addEventListener('click', this.clearMessages);
    alert.appendChild(dismissBtn);
    
    return alert;
  }
  
  // Create success alert
  createSuccessAlert() {
    if (!this.successMessage) return null;
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-info';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';
    alert.appendChild(icon);
    
    alert.appendChild(document.createTextNode(' ' + this.successMessage));
    
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'btn btn-sm';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.addEventListener('click', this.clearMessages);
    alert.appendChild(dismissBtn);
    
    return alert;
  }
  
  // Create loading spinner
  createLoadingSpinner() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loadingDiv.appendChild(spinner);
    
    return loadingDiv;
  }
  
  // Create connection card
  createConnectionCard(connection) {
    const card = document.createElement('div');
    card.className = 'connection-card';
    
    // Find the provider info by authenticator_id, provider_id, or authenticator_type
    const providerInfo = this.providers.find(p => 
      p.authenticator_id === connection.authenticator_id ||
      p.authenticator_id === connection.authenticator_id || 
      p.id === connection.authenticator_id ||
      p.type === connection.authenticator_type
    ) || {
      icon: `/static/icons/email.svg`,
      name: connection.authenticator_type || 'Email Provider'
    };
    
    // Connection info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'connection-info';
    
    const icon = document.createElement('img');
    icon.className = 'connection-icon';
    icon.src = providerInfo.icon;
    icon.alt = `${connection.authenticator_type || 'provider'} icon`;
    infoDiv.appendChild(icon);
    
    const details = document.createElement('div');
    details.className = 'connection-details';
    
    const title = document.createElement('h3');
    title.textContent = connection.authenticator_name || providerInfo.name || connection.authenticator_type;
    details.appendChild(title);
    
    const email = document.createElement('p');
    email.textContent = connection.email || 'Connected account';
    details.appendChild(email);
    
    infoDiv.appendChild(details);
    card.appendChild(infoDiv);
    
    // Connection actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'connection-actions';
    
    const testBtn = document.createElement('button');
    testBtn.className = 'btn btn-primary';
    testBtn.innerHTML = '<i class="fas fa-sync"></i> Test';
    testBtn.addEventListener('click', () => this.testConnection(connection.authenticator_id));
    actionsDiv.appendChild(testBtn);
    
    const disconnectBtn = document.createElement('button');
    disconnectBtn.className = 'btn btn-danger';
    disconnectBtn.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
    disconnectBtn.addEventListener('click', () => this.disconnectConnection(connection.authenticator_id));
    actionsDiv.appendChild(disconnectBtn);
    
    card.appendChild(actionsDiv);
    
    return card;
  }
  
  // Create empty state for no connections
  createEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-state-icon';
    iconDiv.innerHTML = '<i class="fas fa-plug"></i>';
    emptyDiv.appendChild(iconDiv);
    
    const textDiv = document.createElement('div');
    textDiv.className = 'empty-state-text';
    textDiv.textContent = "You don't have any connected email accounts yet.";
    emptyDiv.appendChild(textDiv);
    
    return emptyDiv;
  }

  // Create empty state for no configured authenticators
  createNoProvidersState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state no-providers-state';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-state-icon';
    iconDiv.innerHTML = '<i class="fas fa-tools"></i>';
    emptyDiv.appendChild(iconDiv);
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'empty-state-title';
    titleDiv.textContent = 'No Email Authenticators Configured';
    emptyDiv.appendChild(titleDiv);
    
    const textDiv = document.createElement('div');
    textDiv.className = 'empty-state-text';
    textDiv.textContent = 'This app has not been configured with any OAuth authenticators for email providers.';
    emptyDiv.appendChild(textDiv);
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'empty-state-details';
    detailsDiv.innerHTML = `
      <p><strong>For App Developers:</strong></p>
      <ul>
        <li>Add OAuth authenticators to your app manifest</li>
        <li>Configure Gmail, Outlook, or other email provider credentials</li>
        <li>Deploy your updated app configuration</li>
      </ul>
      <p>See the <a href="/docs/oauth-setup" target="_blank">OAuth Setup Guide</a> for detailed instructions.</p>
    `;
    emptyDiv.appendChild(detailsDiv);
    
    return emptyDiv;
  }
  
  // Create provider card
  createProviderCard(provider) {
    const card = document.createElement('div');
    card.className = 'provider-card';
    
    // Provider header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'provider-header';
    
    const icon = document.createElement('img');
    icon.className = 'provider-icon';
    icon.src = provider.icon;
    icon.alt = `${provider.name} icon`;
    headerDiv.appendChild(icon);
    
    const name = document.createElement('h3');
    name.className = 'provider-name';
    name.textContent = provider.name;
    headerDiv.appendChild(name);
    
    card.appendChild(headerDiv);
    
    // Provider description
    const descDiv = document.createElement('div');
    descDiv.className = 'provider-description';
    descDiv.textContent = provider.description;
    card.appendChild(descDiv);
    
    // Provider action
    const actionDiv = document.createElement('div');
    actionDiv.className = 'provider-action';
    
    // Check if already connected - use the connection_status field from API
    const connectionStatus = provider.connection_status || 'disconnected';
    const isConnected = connectionStatus === 'connected';
    const isPending = connectionStatus === 'pending';
    
    if (isConnected) {
      const connectedBtn = document.createElement('button');
      connectedBtn.className = 'btn btn-success';
      connectedBtn.disabled = true;
      connectedBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
      actionDiv.appendChild(connectedBtn);
    } else if (isPending) {
      const pendingBtn = document.createElement('button');
      pendingBtn.className = 'btn btn-warning';
      pendingBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Complete Authorization';
      pendingBtn.addEventListener('click', () => this.connectAuthenticator(provider.id));
      actionDiv.appendChild(pendingBtn);
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.style.marginLeft = '0.5rem';
      cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
      cancelBtn.addEventListener('click', () => this.cancelConnection(provider.authenticator_id));
      actionDiv.appendChild(cancelBtn);
    } else {
      const connectBtn = document.createElement('button');
      connectBtn.className = 'btn btn-primary';
      connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
      connectBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.connectAuthenticator(provider.id);
      };
      actionDiv.appendChild(connectBtn);
    }
    
    card.appendChild(actionDiv);
    
    return card;
  }
  
  // Render the component
  render() {
    // Clear the current content
    const shadowRoot = this.shadowRoot;
    while (shadowRoot.firstChild) {
      shadowRoot.removeChild(shadowRoot.firstChild);
    }
    
    // Add styles
    shadowRoot.appendChild(this.createStyles());
    
    // Create main container
    const container = document.createElement('div');
    container.className = 'container';
    
    // Back button
    const backBtn = document.createElement('a');
    backBtn.href = '/email-agent-app/settings';
    backBtn.className = 'btn back-btn';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Settings';
    container.appendChild(backBtn);
    
    // Page title
    const title = document.createElement('h1');
    title.className = 'page-title';
    title.textContent = 'Email Account Connections';
    container.appendChild(title);
    
    // Error alert
    const errorAlert = this.createErrorAlert();
    if (errorAlert) container.appendChild(errorAlert);
    
    // Success alert
    const successAlert = this.createSuccessAlert();
    if (successAlert) container.appendChild(successAlert);
    
    // Main content
    if (this.loading) {
      container.appendChild(this.createLoadingSpinner());
    } else {
      // Connected providers section
      const connectedSection = document.createElement('div');
      connectedSection.className = 'connected-providers';
      
      const connectedTitle = document.createElement('h2');
      connectedTitle.className = 'section-title';
      connectedTitle.textContent = 'Your Connected Email Accounts';
      connectedSection.appendChild(connectedTitle);
      
      if (this.connections.length === 0) {
        connectedSection.appendChild(this.createEmptyState());
      } else {
        this.connections.forEach(connection => {
          connectedSection.appendChild(this.createConnectionCard(connection));
        });
      }
      
      container.appendChild(connectedSection);
      
      // Available providers section
      const providersTitle = document.createElement('h2');
      providersTitle.className = 'section-title';
      providersTitle.textContent = 'Available Email Providers';
      container.appendChild(providersTitle);
      
      const providerList = document.createElement('div');
      providerList.className = 'provider-list';
      
      if (this.providers.length === 0) {
        // Show empty state when no authenticators are configured
        const emptyProvidersState = this.createNoProvidersState();
        container.appendChild(emptyProvidersState);
      } else {
        this.providers.forEach(provider => {
          providerList.appendChild(this.createProviderCard(provider));
        });
        container.appendChild(providerList);
      }
    }
    
    // Add the container to the shadow DOM
    shadowRoot.appendChild(container);
  }
}

// Define the custom element
customElements.define('email-connections', EmailConnections);
