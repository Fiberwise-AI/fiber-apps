import { FIBER } from '../../index.js';

class DataService {
  constructor() {
    this._providersCache = null;
    this._providersCacheTime = null;
    this._cacheDuration = 60000; // 1 minute
  }

  /**
   * Get all available data models for the app
   * @returns {Promise<Array>} List of models
   */
  async getModels() {
    try {
      return await FIBER.data.getModels();
    } catch (error) {
      console.error('Error getting models:', error);
      throw error;
    }
  }

  /**
   * Get a specific data model by ID
   * @param {string} modelId ID of the model to get
   * @returns {Promise<Object>} Model details
   */
  async getModel(modelId) {
    try {
      return await FIBER.data.getModel(modelId);
    } catch (error) {
      console.error('Error getting model:', error);
      throw error;
    }
  }

  /**
   * List items from a data model with filtering and pagination
   * @param {string} modelId ID of the model
   * @param {Object} options Query options (page, limit, filters, sort)
   * @returns {Promise<Object>} Query results
   */
  async listItems(modelId, options = {}) {
    try {
      const { page = 1, limit = 50, filters = null, sortBy = null, sortOrder = 'asc' } = options;
      
      // Build where clause from filters
      const where = filters || {};
      
      // Build order by object
      const orderBy = {};
      if (sortBy) {
        orderBy[sortBy] = sortOrder;
      }
      
      const response = await FIBER.data.query({
        model: modelId,
        where,
        order_by: Object.keys(orderBy).length > 0 ? orderBy : undefined,
        page,
        limit
      });
      
      return {
        items: response.data || [],
        pagination: response.pagination || {
          page,
          limit,
          total: response.data?.length || 0
        }
      };
    } catch (error) {
      console.error('Error listing items:', error);
      throw error;
    }
  }

  /**
   * Get a specific item from a model
   * @param {string} modelId ID of the model
   * @param {string} itemId ID of the item
   * @returns {Promise<Object>} Item data
   */
  async getItem(modelId, itemId) {
    try {
      // Use primary key field for the model
      const pkField = this.getPrimaryKeyField(modelId);
      
      // Query single item
      const response = await FIBER.data.query({
        model: modelId,
        where: { [pkField]: itemId }
      });
      
      // Return the first item if found
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error getting item:', error);
      throw error;
    }
  }

  /**
   * Generic method to create an item in any model
   * @param {string} modelId ID of the model
   * @param {Object} data Item data
   * @returns {Promise<Object>} Created item
   */
  async createItem(modelId, data) {
    try {
      const response = await FIBER.data.create({
        model: modelId,
        data: data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error creating item in model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to update an item in any model
   * @param {string} modelId ID of the model
   * @param {string} itemId ID of the item
   * @param {Object} data Updated item data
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(modelId, itemId, data) {
    try {
      const response = await FIBER.data.update({
        model: modelId,
        where: { [this.getPrimaryKeyField(modelId)]: itemId },
        data: data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating item in model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to delete an item from any model
   * @param {string} modelId ID of the model
   * @param {string} itemId ID of the item
   * @returns {Promise<boolean>} Success status
   */
  async deleteItem(modelId, itemId) {
    try {
      await FIBER.data.delete({
        model: modelId,
        where: { [this.getPrimaryKeyField(modelId)]: itemId }
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting item from model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Query items from any model with a where clause
   * @param {string} modelId ID of the model
   * @param {Object} where Where clause
   * @param {Object} options Additional options (orderBy, limit)
   * @returns {Promise<Array>} Query results
   */
  async queryItems(modelId, where = {}, options = {}) {
    try {
      const response = await FIBER.data.query({
        model: modelId,
        where: where,
        ...(options.orderBy && { order_by: options.orderBy }),
        ...(options.limit && { limit: options.limit }),
        ...(options.page && { page: options.page })
      });
      
      return response.data || [];
    } catch (error) {
      console.error(`Error querying items from model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get the primary key field for a model
   * @param {string} modelId ID of the model
   * @returns {string} Primary key field name
   */
  getPrimaryKeyField(modelId) {
    // Default primary keys for known models
    const primaryKeys = {
      'email_analyses': 'analysis_id',
      'email_prompt_templates': 'template_id',
      'chats': 'chat_id'
    };
    
    return primaryKeys[modelId] || 'id';
  }

  /**
   * Save email analysis to the data store
   * @param {Object} analysisData Analysis data to save
   * @returns {Promise<Object>} Save result
   */
  async saveEmailAnalysis(analysisData) {
    try {
      // Ensure topics, action_items, and suggested_labels are stored as JSON
      const processedData = {
        ...analysisData,
        topics: Array.isArray(analysisData.topics) ? JSON.stringify(analysisData.topics) : analysisData.topics,
        action_items: Array.isArray(analysisData.action_items) ? JSON.stringify(analysisData.action_items) : analysisData.action_items,
        suggested_labels: Array.isArray(analysisData.suggested_labels) ? JSON.stringify(analysisData.suggested_labels) : analysisData.suggested_labels,
        analysis_date: new Date().toISOString()
      };
      
      const response = await FIBER.data.create({
        model: 'email_analyses',
        data: processedData
      });
      
      return response;
    } catch (error) {
      console.error('Error saving email analysis:', error);
      throw error;
    }
  }

  /**
   * Query email analyses with filtering options
   * @param {Object} filters Filter criteria
   * @returns {Promise<Array>} Analysis results
   */
  async getEmailAnalyses(filters = {}) {
    try {
      const response = await FIBER.data.query({
        model: 'email_analyses',
        where: filters,
        order_by: { analysis_date: 'desc' }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error querying email analyses:', error);
      return [];
    }
  }

  /**
   * Get prompt templates for the current user
   * @returns {Promise<Array>} Templates
   */
  async getPromptTemplates() {
    try {
      return await this.queryItems('email_prompt_templates', {});
    } catch (error) {
      console.error('Error getting prompt templates:', error);
      throw error;
    }
  }

  /**
   * Save a prompt template
   * @param {Object} template Template data
   * @returns {Promise<Object>} Save result
   */
  async savePromptTemplate(template) {
    try {
      if (template.template_id) {
        // Update existing template
        return await this.updateItem(
          'email_prompt_templates',
          template.template_id,
          {
            template_name: template.template_name,
            template_content: template.template_content,
            description: template.description,
            updated_at: new Date().toISOString()
          }
        );
      } else {
        // Create new template
        return await this.createItem(
          'email_prompt_templates',
          {
            template_name: template.template_name,
            template_content: template.template_content,
            description: template.description
          }
        );
      }
    } catch (error) {
      console.error('Error saving prompt template:', error);
      throw error;
    }
  }

  /**
   * Delete a prompt template
   * @param {string} templateId Template ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deletePromptTemplate(templateId) {
    try {
      return await this.deleteItem('email_prompt_templates', templateId);
    } catch (error) {
      console.error('Error deleting prompt template:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for email analyses
   * @param {Object} options Filter options
   * @returns {Promise<Object>} Analytics data
   */
  async getEmailAnalyticsData(options = {}) {
    try {
      const { timeframe = 'month' } = options;
      
      // Build date filter based on timeframe
      let dateFilter = {};
      const now = new Date();
      
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        dateFilter = { gte: weekAgo.toISOString() };
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        dateFilter = { gte: monthAgo.toISOString() };
      } else if (timeframe === 'year') {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        dateFilter = { gte: yearAgo.toISOString() };
      }
      
      // Fetch analyses with the appropriate filter
      const filters = Object.keys(dateFilter).length > 0 
        ? { analysis_date: dateFilter } 
        : {};
        
      const analyses = await this.getEmailAnalyses(filters);
      
      // Process the analytics data
      return this.processAnalyticsData(analyses);
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  }

  /**
   * Process raw analyses into analytics data
   * @param {Array} analyses Raw analyses
   * @returns {Object} Processed analytics data
   */
  processAnalyticsData(analyses) {
    // Reset stats
    const stats = {
      totalAnalyzed: analyses.length,
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
      priorityBreakdown: { high: 0, medium: 0, low: 0 },
      topTopics: [],
      topLabels: []
    };

    // Topic and label counters
    const topicCounter = {};
    const labelCounter = {};

    // Process each analysis
    analyses.forEach(analysis => {
      // Count sentiments
      if (analysis.sentiment) {
        stats.sentimentBreakdown[analysis.sentiment] = 
          (stats.sentimentBreakdown[analysis.sentiment] || 0) + 1;
      }
      
      // Count priorities
      if (analysis.priority) {
        stats.priorityBreakdown[analysis.priority] = 
          (stats.priorityBreakdown[analysis.priority] || 0) + 1;
      }
      
      // Count topics
      if (analysis.topics) {
        let topics;
        try {
          topics = typeof analysis.topics === 'string' 
            ? JSON.parse(analysis.topics) 
            : analysis.topics;
        } catch (e) {
          topics = [];
        }
          
        if (Array.isArray(topics)) {
          topics.forEach(topic => {
            topicCounter[topic] = (topicCounter[topic] || 0) + 1;
          });
        }
      }
      
      // Count suggested labels
      if (analysis.suggested_labels) {
        let labels;
        try {
          labels = typeof analysis.suggested_labels === 'string'
            ? JSON.parse(analysis.suggested_labels)
            : analysis.suggested_labels;
        } catch (e) {
          labels = [];
        }
          
        if (Array.isArray(labels)) {
          labels.forEach(label => {
            labelCounter[label] = (labelCounter[label] || 0) + 1;
          });
        }
      }
    });
    
    // Convert topic and label counters to sorted arrays
    stats.topTopics = Object.entries(topicCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
      
    stats.topLabels = Object.entries(labelCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count }));
    
    return {
      stats,
      analyses
    };
  }
  
  /**
   * Get all available service providers, with caching
   * @returns {Promise<Array>} List of service providers
   */
  async getServiceProviders() {
    const now = Date.now();
    if (this._providersCache && this._providersCacheTime && (now - this._providersCacheTime < this._cacheDuration)) {
      return this._providersCache;
    }
    try {
      const response = await FIBER.apps.listServiceProviders();
      this._providersCache = response || [];
      this._providersCacheTime = now;
      return this._providersCache;
    } catch (error) {
      console.error('Error getting service providers:', error);
      throw error;
    }
  }
  
  /**
   * Get connections for the current user
   * @returns {Promise<Array>} List of actually connected providers
   */
  async getConnections() {
    try {
      const providers = await this.getServiceProviders();
      
      // Filter to only return actually connected providers
      const connectedProviders = (providers || []).filter(provider => Boolean(provider.is_connected));
      
      return connectedProviders;
    } catch (error) {
      console.error('Error getting connections:', error);
      return [];
    }
  }
  
  /**
   * Revoke a connection
   * @param {string} connectionId Connection ID to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeConnection(connectionId) {
    try {
      await FIBER.credentials.revokeConnection(connectionId);
      
      return true;
    } catch (error) {
      console.error('Error revoking connection:', error);
      throw error;
    }
  }
  
  /**
   * Get authentication URL for an authenticator
   * @param {string} authenticatorId Authenticator ID
   * @param {Object} options Additional options
   * @returns {string} Authentication URL
   */
  getAuthUrl(authenticatorId, options = {}) {
    return FIBER.credentials.getAuthUrl(authenticatorId, options);
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;
