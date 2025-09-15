/**
 * Template Manager Utility
 * 
 * Manages test templates for pipeline testing using the FiberWise SDK
 * for storing and retrieving template configurations.
 */

export class TemplateManager {
  constructor(fiberInstance) {
    this.fiber = fiberInstance;
    this.templates = new Map();
    this.categories = new Set();
    this.executionHistory = [];
  }

  async init() {
    console.log('[TemplateManager] Initializing template manager...');
    
    // Load templates from FiberWise data store
    await this.loadTemplates();
    
    // Load execution history
    await this.loadExecutionHistory();
  }

  /**
   * Create a new test template
   */
  async createTemplate(templateData) {
    try {
      console.log('[TemplateManager] Creating new template:', templateData.template_name);

      // Validate template data
      const validatedTemplate = this.validateTemplateData(templateData);

      // Use FiberWise SDK to save template
      const result = await this.fiber.data.create('test_templates', validatedTemplate);

      if (result && result.template_id) {
        // Add to local cache
        this.templates.set(result.template_id, {
          ...validatedTemplate,
          template_id: result.template_id,
          created_at: result.created_at || new Date().toISOString()
        });

        // Update categories
        if (validatedTemplate.tags) {
          validatedTemplate.tags.split(',').forEach(tag => 
            this.categories.add(tag.trim())
          );
        }

        return {
          success: true,
          template_id: result.template_id,
          template: this.templates.get(result.template_id)
        };

      } else {
        throw new Error('Failed to create template - no ID returned');
      }

    } catch (error) {
      console.error('[TemplateManager] Failed to create template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load all templates from the data store
   */
  async loadTemplates() {
    try {
      const response = await this.fiber.data.get('test_templates', {
        limit: 1000,
        sort: 'created_at:desc'
      });

      if (response && response.items) {
        // Clear current templates
        this.templates.clear();
        this.categories.clear();

        // Load templates into cache
        response.items.forEach(template => {
          this.templates.set(template.template_id, template);
          
          // Extract categories from tags
          if (template.tags) {
            template.tags.split(',').forEach(tag => 
              this.categories.add(tag.trim())
            );
          }
        });

        console.log(`[TemplateManager] Loaded ${this.templates.size} templates`);
      }

    } catch (error) {
      console.error('[TemplateManager] Failed to load templates:', error);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    try {
      // Check cache first
      if (this.templates.has(templateId)) {
        return {
          success: true,
          template: this.templates.get(templateId)
        };
      }

      // Fetch from data store
      const response = await this.fiber.data.get('test_templates', {
        filter: `template_id:${templateId}`
      });

      if (response && response.items && response.items.length > 0) {
        const template = response.items[0];
        this.templates.set(templateId, template);
        
        return {
          success: true,
          template
        };
      } else {
        return {
          success: false,
          error: 'Template not found'
        };
      }

    } catch (error) {
      console.error('[TemplateManager] Failed to get template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId, updates) {
    try {
      console.log('[TemplateManager] Updating template:', templateId);

      // Validate updates
      const validatedUpdates = this.validateTemplateData(updates, false);

      // Use FiberWise SDK to update template
      const result = await this.fiber.data.update('test_templates', templateId, validatedUpdates);

      if (result) {
        // Update local cache
        const existingTemplate = this.templates.get(templateId);
        const updatedTemplate = {
          ...existingTemplate,
          ...validatedUpdates,
          updated_at: new Date().toISOString()
        };
        
        this.templates.set(templateId, updatedTemplate);

        return {
          success: true,
          template: updatedTemplate
        };

      } else {
        throw new Error('Failed to update template');
      }

    } catch (error) {
      console.error('[TemplateManager] Failed to update template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId) {
    try {
      console.log('[TemplateManager] Deleting template:', templateId);

      // Use FiberWise SDK to delete template
      const result = await this.fiber.data.delete('test_templates', templateId);

      if (result) {
        // Remove from local cache
        this.templates.delete(templateId);

        return {
          success: true,
          message: 'Template deleted successfully'
        };

      } else {
        throw new Error('Failed to delete template');
      }

    } catch (error) {
      console.error('[TemplateManager] Failed to delete template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a template (run the test scenarios)
   */
  async executeTemplate(templateId, variations = {}) {
    try {
      console.log('[TemplateManager] Executing template:', templateId);

      // Get template
      const templateResult = await this.getTemplate(templateId);
      if (!templateResult.success) {
        throw new Error(templateResult.error);
      }

      const template = templateResult.template;
      
      // Parse template configuration
      const templateConfig = this.parseTemplateConfig(template.template_config);
      const testScenarios = this.parseTestScenarios(template.test_scenarios);

      // Apply variations to base configuration
      const executionConfig = {
        ...templateConfig,
        ...variations
      };

      // Execute each test scenario
      const scenarioResults = [];
      
      for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        console.log(`[TemplateManager] Executing scenario ${i + 1}/${testScenarios.length}: ${scenario.name}`);

        try {
          const scenarioResult = await this.executeScenario(
            template.pipeline_id,
            scenario,
            executionConfig
          );

          scenarioResults.push({
            scenarioIndex: i,
            scenarioName: scenario.name,
            ...scenarioResult
          });

        } catch (error) {
          scenarioResults.push({
            scenarioIndex: i,
            scenarioName: scenario.name,
            success: false,
            error: error.message
          });
        }
      }

      // Create execution record
      const executionRecord = {
        template_id: templateId,
        template_name: template.template_name,
        pipeline_id: template.pipeline_id,
        execution_timestamp: new Date().toISOString(),
        scenarios_executed: testScenarios.length,
        scenarios_passed: scenarioResults.filter(r => r.success).length,
        scenarios_failed: scenarioResults.filter(r => !r.success).length,
        variations_applied: variations,
        results: scenarioResults
      };

      // Save execution history
      await this.saveExecutionRecord(executionRecord);

      return {
        success: true,
        execution: executionRecord,
        summary: {
          total: testScenarios.length,
          passed: executionRecord.scenarios_passed,
          failed: executionRecord.scenarios_failed,
          successRate: Math.round((executionRecord.scenarios_passed / testScenarios.length) * 100)
        }
      };

    } catch (error) {
      console.error('[TemplateManager] Template execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all templates with optional filtering
   */
  getTemplates(filters = {}) {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (filters.category) {
      templates = templates.filter(t => 
        t.tags && t.tags.includes(filters.category)
      );
    }

    if (filters.pipeline_id) {
      templates = templates.filter(t => 
        t.pipeline_id === filters.pipeline_id
      );
    }

    if (filters.is_active !== undefined) {
      templates = templates.filter(t => 
        t.is_active === filters.is_active
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      templates = templates.filter(t => 
        t.template_name.toLowerCase().includes(searchTerm) ||
        (t.description && t.description.toLowerCase().includes(searchTerm))
      );
    }

    // Sort templates
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';

    templates.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    return templates;
  }

  /**
   * Get template categories
   */
  getCategories() {
    return Array.from(this.categories).sort();
  }

  /**
   * Get execution history
   */
  getExecutionHistory(templateId = null, limit = 50) {
    let history = this.executionHistory;

    if (templateId) {
      history = history.filter(h => h.template_id === templateId);
    }

    return history
      .slice(-limit)
      .reverse()
      .map(record => ({
        ...record,
        results: undefined, // Exclude detailed results for list view
        summary: {
          total: record.scenarios_executed,
          passed: record.scenarios_passed,
          failed: record.scenarios_failed,
          successRate: Math.round((record.scenarios_passed / record.scenarios_executed) * 100)
        }
      }));
  }

  /**
   * Get detailed execution results
   */
  getExecutionDetails(executionId) {
    return this.executionHistory.find(h => h.id === executionId);
  }

  /**
   * Create template from pipeline execution
   */
  async createTemplateFromExecution(executionData, templateName, description = '') {
    try {
      const templateData = {
        template_name: templateName,
        description: description,
        pipeline_id: executionData.pipeline_id,
        template_config: JSON.stringify({
          input_data: executionData.input_data,
          execution_options: executionData.execution_options || {}
        }),
        test_scenarios: JSON.stringify([
          {
            name: 'Scenario from Execution',
            description: 'Test scenario created from successful pipeline execution',
            input_data: executionData.input_data,
            expected_output: executionData.output_data,
            validation_rules: [
              {
                type: 'status',
                expected: 'completed'
              }
            ]
          }
        ]),
        tags: 'auto-generated,execution-based',
        is_active: true
      };

      return await this.createTemplate(templateData);

    } catch (error) {
      console.error('[TemplateManager] Failed to create template from execution:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(templateId, newName) {
    try {
      const templateResult = await this.getTemplate(templateId);
      if (!templateResult.success) {
        throw new Error(templateResult.error);
      }

      const template = templateResult.template;
      
      const duplicateData = {
        ...template,
        template_name: newName,
        description: `Copy of ${template.template_name}`,
        tags: template.tags ? `${template.tags},duplicate` : 'duplicate'
      };

      // Remove ID fields
      delete duplicateData.template_id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      return await this.createTemplate(duplicateData);

    } catch (error) {
      console.error('[TemplateManager] Failed to duplicate template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private methods

  validateTemplateData(data, requireAll = true) {
    const errors = [];

    if (requireAll || data.template_name !== undefined) {
      if (!data.template_name || data.template_name.trim().length === 0) {
        errors.push('Template name is required');
      }
    }

    if (requireAll || data.pipeline_id !== undefined) {
      if (!data.pipeline_id || data.pipeline_id.trim().length === 0) {
        errors.push('Pipeline ID is required');
      }
    }

    if (data.template_config) {
      try {
        JSON.parse(data.template_config);
      } catch (error) {
        errors.push('Template configuration must be valid JSON');
      }
    }

    if (data.test_scenarios) {
      try {
        const scenarios = JSON.parse(data.test_scenarios);
        if (!Array.isArray(scenarios)) {
          errors.push('Test scenarios must be an array');
        }
      } catch (error) {
        errors.push('Test scenarios must be valid JSON');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return {
      template_name: data.template_name,
      description: data.description || '',
      pipeline_id: data.pipeline_id,
      template_config: data.template_config || '{}',
      test_scenarios: data.test_scenarios || '[]',
      tags: data.tags || '',
      is_active: data.is_active !== undefined ? data.is_active : true
    };
  }

  parseTemplateConfig(configString) {
    try {
      return JSON.parse(configString || '{}');
    } catch (error) {
      console.warn('[TemplateManager] Failed to parse template config:', error);
      return {};
    }
  }

  parseTestScenarios(scenariosString) {
    try {
      const scenarios = JSON.parse(scenariosString || '[]');
      return Array.isArray(scenarios) ? scenarios : [];
    } catch (error) {
      console.warn('[TemplateManager] Failed to parse test scenarios:', error);
      return [];
    }
  }

  async executeScenario(pipelineId, scenario, config) {
    try {
      // Merge scenario input with base config
      const inputData = {
        ...config.input_data,
        ...scenario.input_data
      };

      // Execute pipeline using FiberWise SDK
      const executionResponse = await this.fiber.pipelines.execute(pipelineId, {
        input_data: inputData,
        ...config.execution_options
      });

      if (!executionResponse) {
        throw new Error('No response from pipeline execution');
      }

      // Validate results against scenario expectations
      const validationResults = await this.validateScenarioResults(
        executionResponse,
        scenario
      );

      return {
        success: validationResults.isValid,
        execution_response: executionResponse,
        validation_results: validationResults,
        duration: executionResponse.duration_ms || 0
      };

    } catch (error) {
      console.error('[TemplateManager] Scenario execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateScenarioResults(executionResponse, scenario) {
    const validationResults = {
      isValid: true,
      checks: [],
      errors: []
    };

    // Get validation rules from scenario
    const validationRules = scenario.validation_rules || [];

    for (const rule of validationRules) {
      try {
        const checkResult = await this.applyValidationRule(executionResponse, rule);
        validationResults.checks.push(checkResult);

        if (!checkResult.passed) {
          validationResults.isValid = false;
          validationResults.errors.push(checkResult.message);
        }

      } catch (error) {
        validationResults.isValid = false;
        validationResults.errors.push(`Validation rule error: ${error.message}`);
      }
    }

    return validationResults;
  }

  async applyValidationRule(executionResponse, rule) {
    switch (rule.type) {
      case 'status':
        return {
          type: 'status',
          passed: executionResponse.status === rule.expected,
          message: executionResponse.status === rule.expected 
            ? `Status is ${rule.expected}` 
            : `Expected status ${rule.expected}, got ${executionResponse.status}`
        };

      case 'duration':
        const duration = executionResponse.duration_ms || 0;
        const passed = rule.max_duration ? duration <= rule.max_duration : true;
        return {
          type: 'duration',
          passed,
          message: passed 
            ? `Duration ${duration}ms within limit` 
            : `Duration ${duration}ms exceeds limit ${rule.max_duration}ms`
        };

      case 'output_contains':
        const outputString = JSON.stringify(executionResponse.output || {});
        const contains = outputString.includes(rule.expected_content);
        return {
          type: 'output_contains',
          passed: contains,
          message: contains 
            ? `Output contains expected content` 
            : `Output does not contain expected content: ${rule.expected_content}`
        };

      case 'output_schema':
        // Basic schema validation
        const hasRequiredFields = rule.required_fields.every(field => 
          this.hasNestedProperty(executionResponse.output, field)
        );
        return {
          type: 'output_schema',
          passed: hasRequiredFields,
          message: hasRequiredFields 
            ? 'All required fields present' 
            : `Missing required fields: ${rule.required_fields.join(', ')}`
        };

      default:
        return {
          type: rule.type,
          passed: false,
          message: `Unknown validation rule type: ${rule.type}`
        };
    }
  }

  hasNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }

    return true;
  }

  async saveExecutionRecord(record) {
    try {
      // Add unique ID
      record.id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to local history
      this.executionHistory.push(record);

      // Keep only last 200 records
      if (this.executionHistory.length > 200) {
        this.executionHistory = this.executionHistory.slice(-200);
      }

      // In a real application, this might also save to a database
      this.saveExecutionHistoryToStorage();

    } catch (error) {
      console.error('[TemplateManager] Failed to save execution record:', error);
    }
  }

  async loadExecutionHistory() {
    try {
      const stored = localStorage.getItem('pipeline_tester_execution_history');
      if (stored) {
        this.executionHistory = JSON.parse(stored);
        console.log(`[TemplateManager] Loaded ${this.executionHistory.length} execution records`);
      }
    } catch (error) {
      console.warn('[TemplateManager] Failed to load execution history:', error);
      this.executionHistory = [];
    }
  }

  saveExecutionHistoryToStorage() {
    try {
      localStorage.setItem('pipeline_tester_execution_history', JSON.stringify(this.executionHistory));
    } catch (error) {
      console.warn('[TemplateManager] Failed to save execution history:', error);
    }
  }

  // Cleanup method
  destroy() {
    this.saveExecutionHistoryToStorage();
    console.log('[TemplateManager] Template manager destroyed');
  }
}