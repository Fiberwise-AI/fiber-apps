/**
 * Function Test App Component
 * 
 * Main UI component for executing functions and viewing results
 */
import html from './function-test-app.html?raw';
import css from './function-test-app.css?inline';
import { executeFunction, getFunctionHistory } from './utils.js';
import Mustache from 'mustache';
import fiber from 'fiberwise';
import { FIBER } from './index.js';

export class FunctionTestApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.functionHistory = [];
    this.isLoading = false;
    this.selectedFunction = null;
    this.executionResult = null;
    this.template = '';
    this.availableFunctions = [
      {
        id: 'helloWorldFunction',
        name: 'Hello World',
        description: 'A simple function that greets you in different languages',
        inputParams: [
          { name: 'name', type: 'string', required: true, default: 'World' },
          { name: 'language', type: 'enum', required: false, default: 'English', options: ['English', 'Spanish', 'French'] }
        ]
      }
    ];
  }

  /**
   * connectedCallback is called every time the element is inserted into the DOM
   * We need to ensure we don't load history multiple times
   */
  connectedCallback() {
    if (!this.initialized) {
      console.log('[FunctionTester] Initializing component (first time)');
      this.initialized = true;
      this.init();
    } else {
      console.log('[FunctionTester] Component reconnected - not reinitializing');
    }
  }
  
  /**
   * Initialize the component
   */
  async init() {
    console.log('[FunctionTester] Running init()');
    
    // First render the UI
    this.render();
    
    // Then setup event listeners
    this.setupEventListeners();
    
    // Load function history only once during initialization
    console.log('[FunctionTester] History loaded status:', this.historyLoaded);
    await this.loadFunctionHistory();
    // Set default selected function to first in list
    if (this.availableFunctions && this.availableFunctions.length > 0) {
      this.selectedFunction = this.availableFunctions[0];
      this.renderFunctionForm();
    }
  }
  
  /**
   * Load function history data
   */
  async loadFunctionHistory() {
    try {
      console.log('[FunctionTester] loadFunctionHistory called');
      this.isLoading = true;
      this.render();
      
      console.log('[FunctionTester] Loading function history...');
      // Single API call to get function history
      const response = await FIBER.func.list();
      
      if (response.items && response.items.length > 0) {
        // Process each history item to ensure input_data is properly parsed
        this.functionHistory = response.items.map(item => {
          // Parse input_data if it's a string
          let inputData = item.input_data;
          if (typeof inputData === 'string') {
            try {
              inputData = JSON.parse(inputData);
            } catch (e) {
              console.error('Error parsing input_data JSON:', e);
              inputData = { error: 'Could not parse input data' };
            }
          }
          
          // Parse output_data if it's a string
          let outputData = item.output_data;
          if (typeof outputData === 'string') {
            try {
              outputData = JSON.parse(outputData);
            } catch (e) {
              console.error('Error parsing output_data JSON:', e);
              outputData = { error: 'Could not parse output data' };
            }
          }
          
          // Calculate execution time
          let executionTime = 0;
          if (item.started_at && item.completed_at) {
            const startTime = new Date(item.started_at);
            const endTime = new Date(item.completed_at);
            executionTime = endTime - startTime;
          }
          
          return {
            ...item,
            inputData,
            outputData,
            execution_time: executionTime
          };
        });
      } else {
        this.functionHistory = [];
      }
      
      this.functionStats = response.function_stats || [];
      
      // Process function stats for UI display
      this.functionStats = this.functionStats.map(stat => {
        const successPercentage = stat.total_executions > 0 
          ? Math.round((stat.successful / stat.total_executions) * 100) 
          : 0;
          
        return {
          ...stat,
          successPercentage,
          avg_execution_time_formatted: stat.avg_execution_time.toFixed(2),
          last_execution_formatted: this.formatDate(stat.last_execution)
        };
      });
      
      this.isLoading = false;
      this.render();
    } catch (error) {
      console.error('Error loading function history:', error);
      this.isLoading = false;
      this.render();
    }
  }
  
  setupEventListeners() {
    // Function selection
    this.shadowRoot.querySelectorAll('.function-selector').forEach(btn => {
      btn.addEventListener('click', () => {
        const functionId = btn.dataset.functionId;
        this.selectedFunction = this.availableFunctions.find(f => f.id === functionId);
        this.renderFunctionForm();
      });
    });
    
    // Form submission
    const form = this.shadowRoot.querySelector('#function-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    // Refresh button - simply reload function history
    const refreshBtn = this.shadowRoot.querySelector('#refresh-button');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadFunctionHistory());
    }
  }
  
  async handleSubmit(event) {
    event.preventDefault();
    
    if (!this.selectedFunction) {
      this.showNotification('Please select a function', 'error');
      return;
    }
    
    // Get parameter values from form
    const form = event.target;
    const params = {};
    
    this.selectedFunction.inputParams.forEach(param => {
      const input = form.querySelector(`[name="${param.name}"]`);
      if (input) {
        params[param.name] = input.value || param.default || '';
      }
    });
    
    try {
      this.isLoading = true;
      this.render();
      
      console.log(params);
      // Execute the function
      const result = await FIBER.func.activate(this.selectedFunction.id, params);
      
      // Show result
      this.executionResult = result;
      this.showNotification('Function executed successfully!', 'success');
      
      // Refresh history after execution
      await this.loadFunctionHistory();
    } catch (error) {
      console.error('Error executing function:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
      this.isLoading = false;
      this.render();
    }
  }
  
  renderFunctionForm() {
    const formContainer = this.shadowRoot.querySelector('#function-form-container');
    if (!formContainer || !this.selectedFunction) return;
    
    const params = this.selectedFunction.inputParams;
    
    formContainer.innerHTML = `
      <h3>${this.selectedFunction.name}</h3>
      <p>${this.selectedFunction.description}</p>
      
      <form id="function-form" class="function-form">
        ${params.map(param => `
          <div class="form-group">
            <label for="param-${param.name}">${param.name} ${param.required ? '*' : ''}</label>
            ${this.renderInputField(param)}
          </div>
        `).join('')}
        
        <button type="submit" class="btn btn-primary" ${this.isLoading ? 'disabled' : ''}>
          ${this.isLoading ? '<i class="fas fa-spinner fa-spin"></i> Running...' : '<i class="fas fa-play"></i> Execute Function'}
        </button>
      </form>
    `;
    
    // Re-attach event listener to the new form
    const form = formContainer.querySelector('#function-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }
  
  renderInputField(param) {
    switch (param.type) {
      case 'enum':
        return `
          <select name="${param.name}" class="form-control" ${param.required ? 'required' : ''}>
            ${(param.options || []).map(option => `
              <option value="${option}" ${option === param.default ? 'selected' : ''}>${option}</option>
            `).join('')}
          </select>
        `;
      case 'number':
        return `
          <input 
            type="number" 
            name="${param.name}" 
            class="form-control"
            value="${param.default || ''}"
            ${param.required ? 'required' : ''}
          >
        `;
      case 'boolean':
        return `
          <input 
            type="checkbox" 
            name="${param.name}" 
            ${param.default ? 'checked' : ''}
          >
        `;
      default: // string and other types
        return `
          <input 
            type="text" 
            name="${param.name}" 
            class="form-control"
            value="${param.default || ''}"
            ${param.required ? 'required' : ''}
          >
        `;
    }
  }
  
  showNotification(message, type = 'info') {
    const notificationContainer = this.shadowRoot.querySelector('.notification-container');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
          notificationContainer.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  }

  render() {
    const functionOptions = this.availableFunctions || [];
   
    // Prepare view model for Mustache
    const viewModel = {
      functionOptions: functionOptions.map(func => ({
        ...func,
        isSelected: func.id === this.selectedFunction?.id
      })),
      selectedFunction: this.selectedFunction,
      executionResult: this.executionResult ? {
        ...this.executionResult,
        executionTimeFormatted: this.executionResult.executionTime?.toFixed(2) || '0',
        resultJson: JSON.stringify(this.executionResult, null, 2)
      } : null,
      isLoading: this.isLoading,
      functionHistory: this.functionHistory.map(item => ({
        ...item,
        statusClass: item.status === 'completed' ? 'success' : item.status === 'failed' ? 'error' : 'pending',
        inputParamsJson: JSON.stringify(item.inputData || item.input_data || {}, null, 2),
        outputDataJson: JSON.stringify(item.outputData || item.output_data || {}, null, 2),
        executionTimeFormatted: item.execution_time ? `${item.execution_time.toFixed(2)} ms` : '-',
        formattedDate: this.formatDate(item.created_at)
      })),
      functionStats: this.functionStats || [],
      noHistory: !this.functionHistory || this.functionHistory.length === 0
    };
    
    // Render template
    this.shadowRoot.innerHTML = Mustache.render(html, viewModel);
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = css;
    this.shadowRoot.appendChild(style);
    
    // Additional updates after rendering
    this.setupEventListeners();
    if (this.selectedFunction) {
      this.renderFunctionForm();
    }
  }
}

customElements.define('function-test-app', FunctionTestApp);