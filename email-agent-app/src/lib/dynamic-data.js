/**
 * DynamicData module for FiberWise SDK
 * Handles data operations for applications
 */

class DynamicData {
  /**
   * Create a new DynamicData client
   * @param {Object} options - Configuration options
   * @param {FiberwiseAppConfigs} options.config - Simple configuration instance
   * @param {string} options.appId - Optional app ID to override config
   * @param {string} options.baseUrl - Optional API base URL
   */
  constructor(options = {}) {
    this.config = options.config;
    this.appId = options.appId;
    this.baseUrl = options.baseUrl || 'https://api.fiberwise.ai/api/v1';
    this.apiPath = '';
    
    // Initialize schema and models cache
    this._schema = {};
    this._models = null;
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
   * @returns {Object} Headers for fetch requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key from config if available
    const apiKey = this.config && this.config.get('apiKey');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    return headers;
  }
  
  /**
   * Create a new DynamicData instance with different options
   * @param {Object} options - Configuration options
   * @returns {DynamicData} - New DynamicData instance
   */
  withOptions(options) {
    return new DynamicData({
      config: this.config,
      baseUrl: this.baseUrl,
      apiPath: this.apiPath,
      ...options
    });
  }
  
  /**
   * Make an API request
   * @param {string} path - API path
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   * @private
   */
  async _request(path, options = {}) {
    try {
      const url = `${this.baseUrl}${this.apiPath}${path}`;
      
      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        },
        credentials: 'include'
      };
      
      // Add body for requests that need it
      if (options.body && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
        fetchOptions.body = JSON.stringify(options.body);
      }
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || response.statusText;
        } catch {
          errorMessage = response.statusText || `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // For HEAD requests or no content responses
      if (response.status === 204 || fetchOptions.method === 'HEAD') {
        return null;
      }
      
      // Parse response as JSON
      return await response.json();
    } catch (error) {
      console.error(`[DynamicData] Request failed for ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Ensure app ID is set
   * @private
   */
  _ensureAppId() {
    if (!this.appId) {
      this.appId = this.getAppId();
    }
    
    if (!this.appId) {
      throw new Error('Application ID is required. Set it during initialization or via app configuration.');
    }
  }
  
  /**
   * Get all models for the current app
   * @returns {Promise<Array>} List of models
   */
  async getModels() {
    this._ensureAppId();
    
    if (this._models) {
      return this._models;
    }
    
    try {
      const appDetails = await this._request(`/apps/${this.appId}`);
      this._models = appDetails.models || [];
      
      // Build schema cache
      this._models.forEach(model => {
        this._schema[model.model_slug] = model.fields;
      });
      
      return this._models;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }
  
  /**
   * Get a specific model by slug
   * @param {string} modelSlug - Model slug
   * @returns {Promise<Object>} Model details
   */
  async getModel(modelSlug) {
    await this.getModels();
    return this._models.find(model => model.model_slug === modelSlug);
  }
  
  /**
   * Get schema for a specific model
   * @param {string} modelSlug - Model slug
   * @returns {Promise<Array>} List of field definitions
   */
  async getSchema(modelSlug) {
    if (!this._schema[modelSlug]) {
      const model = await this.getModel(modelSlug);
      if (!model) {
        throw new Error(`Model "${modelSlug}" not found in app "${this.appId}"`);
      }
      this._schema[modelSlug] = model.fields;
    }
    
    return this._schema[modelSlug];
  }
  
  /**
   * Validate data against schema
   * @param {string} modelSlug - Model slug
   * @param {Object} data - Data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.isCreate - Whether this is a create operation
   * @returns {Promise<{valid: boolean, errors: Array}>} Validation result
   */
  async validateData(modelSlug, data, options = {}) {
    const schema = await this.getSchema(modelSlug);
    const errors = [];
    const isCreate = options.isCreate || false;
    
    // Basic validation
    for (const field of schema) {
      const value = data[field.field_column];
      
      // Required field check - skip for primary keys during create operations
      if (field.is_required && (value === undefined || value === null)) {
        // Don't validate required primary keys during creation as they're often auto-generated
        if (!(isCreate && field.is_primary_key)) {
          errors.push(`Field "${field.name}" is required`);
          continue;
        }
      }
      
      // Skip further validation if no value
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation
      switch (field.data_type) {
        case 'string':
        case 'text':
          if (typeof value !== 'string') {
            errors.push(`Field "${field.name}" must be a string`);
          }
          break;
        case 'integer':
          if (!Number.isInteger(value)) {
            errors.push(`Field "${field.name}" must be an integer`);
          }
          break;
        case 'float':
          if (typeof value !== 'number') {
            errors.push(`Field "${field.name}" must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field "${field.name}" must be a boolean`);
          }
          break;
        case 'date':
        case 'datetime':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push(`Field "${field.name}" must be a valid date`);
          }
          break;
      }
      
      // Additional validation from validations_json if provided
      if (field.validations_json) {
        // Implement custom validations based on validations_json schema
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * List items for a specific model
   * @param {string} modelSlug - Model slug
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {Object} options.filters - Filter conditions
   * @returns {Promise<Object>} Paginated list of items
   */
  async listItems(modelSlug, options = {}) {
    this._ensureAppId();
    
    const queryParams = new URLSearchParams();
    
    if (options.page) queryParams.set('page', options.page);
    if (options.limit) queryParams.set('limit', options.limit);
    
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        queryParams.set(key, value);
      });
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this._request(`/data/${this.appId}/${modelSlug}${queryString}`);
  }
  
  /**
   * Get a specific item by ID
   * @param {string} modelSlug - Model slug
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Item data
   */
  async getItem(modelSlug, itemId) {
    this._ensureAppId();
    return this._request(`/data/${this.appId}/${modelSlug}/${itemId}`);
  }
  
  /**
   * Create a new item
   * @param {string} modelSlug - Model slug
   * @param {Object} data - Item data
   * @param {boolean} validate - Whether to validate data against schema
   * @returns {Promise<Object>} Created item
   */
  async createItem(modelSlug, data, validate = true) {
    this._ensureAppId();
    
    if (validate) {
      // Pass isCreate: true to skip primary key validation
      const validation = await this.validateData(modelSlug, data, { isCreate: true });
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    return this._request(`/data/${this.appId}/${modelSlug}`, {
      method: 'POST',
      body: { data }
    });
  }
  
  /**
   * Update an existing item
   * @param {string} modelSlug - Model slug
   * @param {string} itemId - Item ID
   * @param {Object} data - Item data
   * @param {boolean} validate - Whether to validate data against schema
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(modelSlug, itemId, data, validate = true) {
    this._ensureAppId();
    
    if (validate) {
      const validation = await this.validateData(modelSlug, data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    return this._request(`/data/${this.appId}/${modelSlug}/${itemId}`, {
      method: 'PUT',
      body: { data }
    });
  }
  
  /**
   * Partially update an item
   * @param {string} modelSlug - Model slug
   * @param {string} itemId - Item ID
   * @param {Object} data - Partial data to update
   * @returns {Promise<Object>} Updated item
   */
  async patchItem(modelSlug, itemId, data) {
    this._ensureAppId();
    
    return this._request(`/data/${this.appId}/${modelSlug}/${itemId}`, {
      method: 'PATCH',
      body: data
    });
  }
  
  /**
   * Delete an item
   * @param {string} modelSlug - Model slug
   * @param {string} itemId - Item ID
   * @returns {Promise<void>}
   */
  async deleteItem(modelSlug, itemId) {
    this._ensureAppId();
    
    return this._request(`/data/${this.appId}/${modelSlug}/${itemId}`, {
      method: 'DELETE'
    });
  }
}

export default DynamicData;
