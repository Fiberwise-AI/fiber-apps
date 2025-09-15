/**
 * FiberWise Credential Service
 * Provides functionality for OAuth authentication and credential management
 */

class CredentialService {
  /**
   * Create a new Credential Service client
   * @param {Object} options - Configuration options
   * @param {FiberwiseAppConfig} options.config - Simple configuration instance
   * @param {string} options.appId - Optional app ID to override config
   * @param {string} options.baseUrl - Optional API base URL
   */
  constructor(options = {}) {
    this.config = options.config;
    this.appId = options.appId;
    this.baseUrl = options.baseUrl || 'https://api.fiberwise.ai/api/v1';
    this.credentialsBasePath = '/credentials';
  }

  /**
   * Get the app ID for this instance
   * @returns {string} - App ID from options or config
   */
  getAppId() {
    return this.appId || (this.config && this.config.get('appId'));
  }

  /**
   * Get headers for API requests
   * @returns {Object} - Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available
    const apiKey = this.config && this.config.get('apiKey');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    return headers;
  }

  /**
   * Get the full URL to initiate OAuth authentication for a provider
   * @param {string} providerId - The provider ID to authenticate with
   * @param {Object} options - Additional options
   * @param {string} options.returnTo - Path to return to after authentication
   * @returns {string} - Full URL to initiate authentication
   */
  getAuthUrl(providerId, options = {}) {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    const appId = this.getAppId();
    const queryParams = new URLSearchParams();
    
    // Add return path if available
    if (options.returnTo) {
      queryParams.set('return_to', options.returnTo);
    }
    
    // Add app ID if available
    if (appId) {
      queryParams.set('app_id', appId);
    }
    
    // Build the full URL with query parameters
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return `${this.baseUrl}${this.credentialsBasePath}/auth/initiate/${providerId}${queryString}`;
  }

  /**
   * Initiate OAuth authentication with a provider (redirects browser)
   * @param {string} providerId - The provider ID to authenticate with
   * @param {Object} options - Additional options
   * @param {string} options.returnTo - Path to return to after authentication
   * @returns {Promise<void>} - Redirects the browser
   */
  initiateAuth(providerId, options = {}) {
    try {
      const authUrl = this.getAuthUrl(providerId, options);
      // Use AppBridge router for navigation instead of direct window.location
      if (window.FIBER?._appBridge?._router) {
        window.FIBER._appBridge._router.navigateTo(authUrl);
      } else {
        console.error('AppBridge router not available for OAuth navigation');
        throw new Error('Router not available for OAuth flow');
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * List all OAuth connections for the current user
   * @param {Object} options - List options
   * @param {string} options.appId - Optional app ID to filter connections
   * @returns {Promise<Array>} - List of connections
   */
  async listConnections(options = {}) {
    try {
      // Get app ID from options or from instance
      const appId = options.appId || this.getAppId();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (appId) {
        queryParams.set('app_id', appId);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // Use the new service providers endpoint
      const response = await fetch(
        `${this.baseUrl}/apps/${appId}/service-providers${queryString}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to list connections: ${response.statusText}`);
      }
      
      const providers = await response.json();
      
      // Filter to only return actually connected providers
      return (providers || []).filter(provider => Boolean(provider.is_connected));
    } catch (error) {
      console.error('Error listing connections:', error);
      return [];
    }
  }

  /**
   * Revoke an OAuth connection
   * @param {string} connectionId - The connection ID to revoke
   * @param {Object} options - Additional options
   * @param {string} options.appId - Optional app ID context
   * @returns {Promise<Object>} - Result of the operation
   */
  async revokeConnection(connectionId, options = {}) {
    if (!connectionId) {
      throw new Error('Connection ID is required');
    }
    
    try {
      // Get app ID from options or from instance
      const appId = options.appId || this.getAppId();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (appId) {
        queryParams.set('app_id', appId);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // Use the new OAuth revoke endpoint
      const response = await fetch(
        `${this.baseUrl}/apps/${appId}/oauth/revoke/${connectionId}${queryString}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to revoke connection: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error revoking connection for ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if the current page load is the result of a successful OAuth callback
   * @param {string} providerId - Provider ID to check for
   * @returns {boolean} - True if this page load is from a successful connection
   */
  isConnectionCallback(providerId) {
    // Get URL parameters from AppBridge
    let searchParams = '';
    if (window.FIBER?._appBridge?._router?.getSearchParams) {
      searchParams = window.FIBER._appBridge._router.getSearchParams();
    } else {
      console.warn('AppBridge router not available for URL parameter parsing');
      return false; // Cannot check callback status without router
    }
    
    const params = new URLSearchParams(searchParams);
    
    // Check if all required parameters are present
    return (
      params.get('connected') === 'true' &&
      params.get('authenticator') === providerId &&
      params.get('app_id') === this.getAppId()
    );
  }

  /**
   * Check if a provider is connected
   * @param {string} providerId - Provider ID or name to check
   * @param {Object} options - Additional options
   * @param {string} options.appId - Optional app ID context
   * @returns {Promise<boolean>} - True if connected
   */
  async isConnected(providerId, options = {}) {
    try {
      const connections = await this.listConnections(options);
      return connections.some(connection => 
        connection.authenticator_id === providerId || 
        connection.name === providerId
      );
    } catch (error) {
      console.error(`Error checking connection status for provider ${providerId}:`, error);
      return false;
    }
  }
}

export default CredentialService;
