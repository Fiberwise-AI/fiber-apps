/**
 * Test Data Generator Utility
 * 
 * UI interface for the Python generateTestData function via FiberWise SDK.
 * All actual data generation is handled by the Python function.
 */

export class TestDataGenerator {
  constructor(fiberInstance) {
    this.fiber = fiberInstance;
    this.generationHistory = [];
    this.presets = {
      chatTesting: {
        name: 'Chat Pipeline Testing',
        description: 'Generate user messages for chat pipeline testing',
        config: {
          data_type: 'user_messages',
          count: 20,
          complexity: 'medium'
        }
      },
      apiTesting: {
        name: 'API Testing Data',
        description: 'Generate JSON objects for API testing',
        config: {
          data_type: 'json_objects',
          count: 15,
          complexity: 'complex'
        }
      },
      performanceTesting: {
        name: 'Performance Testing',
        description: 'Generate large datasets for performance testing',
        config: {
          data_type: 'json_objects',
          count: 100,
          complexity: 'medium'
        }
      },
      documentTesting: {
        name: 'Document Processing',
        description: 'Generate text samples for document processing',
        config: {
          data_type: 'text_samples',
          count: 10,
          complexity: 'complex'
        }
      },
      analyticsData: {
        name: 'Analytics Testing',
        description: 'Generate numeric data for analytics testing',
        config: {
          data_type: 'numeric_data',
          count: 50,
          complexity: 'complex'
        }
      }
    };
  }

  async init() {
    console.log('[TestDataGenerator] Initializing test data generator...');
    
    // Load generation history
    await this.loadGenerationHistory();
  }

  /**
   * Generate test data using the Python generateTestData function via FiberWise SDK
   */
  async generateTestData(config) {
    try {
      console.log('[TestDataGenerator] Calling Python generateTestData function with config:', config);

      // Validate configuration
      const validatedConfig = this.validateConfig(config);
      
      // Call the Python generateTestData function via FiberWise SDK
      const result = await this.fiber.func.activate('generateTestData', validatedConfig);

      if (result && result.success) {
        const generationResult = {
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          config: validatedConfig,
          data: result.generated_data,
          metadata: result.metadata,
          success: true
        };

        // Add to history
        this.addToHistory(generationResult);

        return {
          success: true,
          data: result.generated_data,
          metadata: result.metadata,
          generationId: generationResult.id
        };

      } else {
        throw new Error(result?.error || 'Python function returned no data');
      }

    } catch (error) {
      console.error('[TestDataGenerator] Python function call failed:', error);
      
      const failureResult = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        config,
        error: error.message,
        success: false
      };

      this.addToHistory(failureResult);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate data using a preset configuration
   */
  async generateFromPreset(presetName, overrides = {}) {
    const preset = this.presets[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    const config = {
      ...preset.config,
      ...overrides
    };

    console.log(`[TestDataGenerator] Generating from preset: ${preset.name}`);
    return await this.generateTestData(config);
  }

  /**
   * Generate test data for specific pipeline requirements using Python function
   */
  async generateForPipeline(pipelineId, inputSchema = null) {
    try {
      // Build config for Python function
      let config;
      if (inputSchema) {
        config = this.deriveConfigFromSchema(inputSchema);
      } else {
        config = {
          data_type: 'json_objects',
          count: 10,
          complexity: 'medium'
        };
      }

      // Add pipeline context
      config.pipeline_id = pipelineId;

      return await this.generateTestData(config);

    } catch (error) {
      console.error('[TestDataGenerator] Pipeline-specific generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a specific number of items quickly (for real-time testing)
   */
  async quickGenerate(type = 'user_messages', count = 5) {
    const config = {
      data_type: type,
      count: Math.min(count, 20), // Limit for quick generation
      complexity: 'simple'
    };

    return await this.generateTestData(config);
  }

  /**
   * Generate test data with reproducible results (using seed)
   */
  async generateReproducible(config, seed = null) {
    const reproducibleConfig = {
      ...config,
      seed: seed || Date.now()
    };

    console.log(`[TestDataGenerator] Generating reproducible data with seed: ${reproducibleConfig.seed}`);
    return await this.generateTestData(reproducibleConfig);
  }

  /**
   * Batch generate multiple datasets
   */
  async batchGenerate(configsArray) {
    console.log(`[TestDataGenerator] Batch generating ${configsArray.length} datasets`);
    
    const results = [];
    
    for (let i = 0; i < configsArray.length; i++) {
      const config = configsArray[i];
      
      try {
        const result = await this.generateTestData(config);
        results.push({
          index: i,
          config,
          ...result
        });
        
        // Small delay to prevent overwhelming the system
        if (i < configsArray.length - 1) {
          await this.delay(100);
        }
        
      } catch (error) {
        results.push({
          index: i,
          config,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      results,
      total: configsArray.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Get available data types and their descriptions
   */
  getDataTypes() {
    return {
      user_messages: {
        name: 'User Messages',
        description: 'Realistic user messages for chat and conversational testing',
        complexityLevels: {
          simple: 'Basic greetings and short phrases',
          medium: 'Customer service inquiries and common requests',
          complex: 'Technical discussions and detailed scenarios'
        }
      },
      json_objects: {
        name: 'JSON Objects',
        description: 'Structured JSON data objects for API and data processing',
        complexityLevels: {
          simple: 'Basic user profiles and simple records',
          medium: 'Multi-level objects with relationships',
          complex: 'Enterprise-grade configurations and analytics data'
        }
      },
      text_samples: {
        name: 'Text Samples',
        description: 'Text content for document processing and NLP testing',
        complexityLevels: {
          simple: 'Short phrases and basic sentences',
          medium: 'Paragraph-length content and articles',
          complex: 'Technical documentation and research papers'
        }
      },
      numeric_data: {
        name: 'Numeric Data',
        description: 'Numeric datasets for analytics and statistical testing',
        complexityLevels: {
          simple: 'Basic numbers and simple metrics',
          medium: 'Time series and grouped metrics',
          complex: 'Multi-dimensional statistical datasets'
        }
      }
    };
  }

  /**
   * Get preset configurations
   */
  getPresets() {
    return Object.entries(this.presets).map(([key, preset]) => ({
      id: key,
      ...preset
    }));
  }

  /**
   * Get generation history
   */
  getHistory(limit = 50) {
    return this.generationHistory
      .slice(-limit)
      .reverse()
      .map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        config: entry.config,
        success: entry.success,
        dataCount: entry.data ? entry.data.length : 0,
        metadata: entry.metadata,
        error: entry.error
      }));
  }

  /**
   * Get statistics about generated data
   */
  getStatistics() {
    const total = this.generationHistory.length;
    const successful = this.generationHistory.filter(h => h.success).length;
    const failed = total - successful;

    // Data type distribution
    const typeDistribution = {};
    this.generationHistory.forEach(entry => {
      if (entry.config && entry.config.data_type) {
        const type = entry.config.data_type;
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      }
    });

    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = this.generationHistory.filter(entry => 
      new Date(entry.timestamp) > oneDayAgo
    ).length;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      typeDistribution,
      recentActivity,
      lastGeneration: total > 0 ? this.generationHistory[total - 1].timestamp : null
    };
  }

  /**
   * Clear generation history
   */
  clearHistory() {
    this.generationHistory = [];
    console.log('[TestDataGenerator] Generation history cleared');
  }

  /**
   * Export generated data in various formats
   */
  exportData(generationId, format = 'json') {
    const generation = this.generationHistory.find(g => g.id === generationId);
    if (!generation || !generation.data) {
      throw new Error('Generation not found or contains no data');
    }

    switch (format.toLowerCase()) {
      case 'json':
        return this.exportAsJson(generation.data);
      case 'csv':
        return this.exportAsCsv(generation.data);
      case 'txt':
        return this.exportAsText(generation.data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private methods

  validateConfig(config) {
    const validTypes = ['user_messages', 'json_objects', 'text_samples', 'numeric_data'];
    const validComplexity = ['simple', 'medium', 'complex'];

    if (!config.data_type || !validTypes.includes(config.data_type)) {
      throw new Error(`Invalid data_type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (config.count && (config.count < 1 || config.count > 1000)) {
      throw new Error('Count must be between 1 and 1000');
    }

    if (config.complexity && !validComplexity.includes(config.complexity)) {
      throw new Error(`Invalid complexity. Must be one of: ${validComplexity.join(', ')}`);
    }

    return {
      data_type: config.data_type,
      count: config.count || 10,
      complexity: config.complexity || 'medium',
      seed: config.seed
    };
  }

  deriveConfigFromSchema(schema) {
    // Analyze schema to determine appropriate test data type
    if (schema.type === 'object') {
      return {
        data_type: 'json_objects',
        count: 10,
        complexity: Object.keys(schema.properties || {}).length > 5 ? 'complex' : 'medium'
      };
    } else if (schema.type === 'string') {
      return {
        data_type: 'user_messages',
        count: 15,
        complexity: 'medium'
      };
    } else if (schema.type === 'array') {
      return {
        data_type: 'json_objects',
        count: 20,
        complexity: 'medium'
      };
    } else {
      return {
        data_type: 'json_objects',
        count: 10,
        complexity: 'medium'
      };
    }
  }


  generateId() {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addToHistory(entry) {
    this.generationHistory.push(entry);
    
    // Keep only last 500 entries
    if (this.generationHistory.length > 500) {
      this.generationHistory = this.generationHistory.slice(-500);
    }
  }

  async loadGenerationHistory() {
    try {
      // In a real application, this might load from local storage or a database
      const stored = localStorage.getItem('pipeline_tester_generation_history');
      if (stored) {
        this.generationHistory = JSON.parse(stored);
        console.log(`[TestDataGenerator] Loaded ${this.generationHistory.length} historical generations`);
      }
    } catch (error) {
      console.warn('[TestDataGenerator] Failed to load generation history:', error);
      this.generationHistory = [];
    }
  }

  saveGenerationHistory() {
    try {
      localStorage.setItem('pipeline_tester_generation_history', JSON.stringify(this.generationHistory));
    } catch (error) {
      console.warn('[TestDataGenerator] Failed to save generation history:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Export methods

  exportAsJson(data) {
    return {
      format: 'json',
      content: JSON.stringify(data, null, 2),
      filename: `test_data_${Date.now()}.json`
    };
  }

  exportAsCsv(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Cannot export empty or non-array data as CSV');
    }

    // Handle different data types
    let csvContent = '';
    
    if (typeof data[0] === 'string') {
      // Text data
      csvContent = 'index,content\n';
      data.forEach((item, index) => {
        csvContent += `${index + 1},"${item.replace(/"/g, '""')}"\n`;
      });
    } else if (typeof data[0] === 'object') {
      // Object data
      const headers = Object.keys(data[0]);
      csvContent = headers.join(',') + '\n';
      
      data.forEach(item => {
        const values = headers.map(header => {
          const value = item[header];
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });
    } else {
      // Simple values
      csvContent = 'index,value\n';
      data.forEach((item, index) => {
        csvContent += `${index + 1},${item}\n`;
      });
    }

    return {
      format: 'csv',
      content: csvContent,
      filename: `test_data_${Date.now()}.csv`
    };
  }

  exportAsText(data) {
    let textContent = '';
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        textContent += `${index + 1}. ${typeof item === 'object' ? JSON.stringify(item) : item}\n`;
      });
    } else {
      textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    }

    return {
      format: 'txt',
      content: textContent,
      filename: `test_data_${Date.now()}.txt`
    };
  }

  // Cleanup method
  destroy() {
    this.saveGenerationHistory();
    console.log('[TestDataGenerator] Test data generator destroyed');
  }
}