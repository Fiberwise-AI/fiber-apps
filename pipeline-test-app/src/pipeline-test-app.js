/**
 * Pipeline Test App Component
 * 
 * Super simple UI that triggers a 2-step pipeline for testing
 */
import htmlTemplate from './pipeline-test-app.html?raw';
import cssStyles from './pipeline-test-app.css?inline';
import { FIBER } from '../index.js';

export class PipelineTestApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // App state
    this.currentView = 'input'; // input, status, results
    this.currentExecution = null;
    this.testResults = [];
    this.pipelineActivations = [];
    this.lastResult = null;
    this.availablePipelines = [];
    this.selectedPipelineId = null;

    // Step status tracking
    this.stepStatuses = {
      'double_number': 'pending',
      'save_result': 'pending'
    };

    // Prevent duplicate completion handling
    this.isCompleted = false;
  }

  connectedCallback() {
    if (!this.initialized) {
      console.log('[PipelineTest] Initializing component');
      this.initialized = true;
      this.init();
    }
  }
  
  async init() {
    console.log('[PipelineTest] Running init()');
    
    try {
      // Connect to realtime updates for pipeline execution
      await FIBER.realtime.connect();
      FIBER.realtime.on('message', (message) => {
        console.log('[PipelineTest] Realtime message:', message);
        if (message.type === 'pipeline_step_update' || message.type === 'pipeline_execution_update') {
          this.handlePipelineUpdate(message);
        }
      });
      
      // Load existing test results
      await this.loadResults();
      
      // Load pipeline activations
      await this.loadActivations();
      
      // Load available pipelines
      await this.loadPipelines();
      
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing pipeline test app:', error);
      this.render();
    }
  }

  async loadResults() {
    try {
      console.log('[PipelineTest] Loading test results');
      
      const response = await FIBER.data.listItems('test-results', {
        limit: 10,
        sort: [{ field: 'created_at', direction: 'desc' }]
      });
      
      this.testResults = response.items || [];
      console.log('[PipelineTest] Loaded results:', this.testResults);
      return this.testResults;
    } catch (error) {
      console.error('Error loading test results:', error);
      this.showMessage('Failed to load results', 'error');
      return [];
    }
  }

  async loadActivations() {
    try {
      console.log('[PipelineTest] Loading pipeline activations');
      
      // Use the new activation API
      const activations = await FIBER.pipelines.listActivations({
        limit: 10
      });
      
      this.pipelineActivations = activations || [];
      console.log('[PipelineTest] Loaded activations:', this.pipelineActivations);
      return this.pipelineActivations;
    } catch (error) {
      console.error('Error loading pipeline activations:', error);
      this.showMessage('Failed to load pipeline activations', 'error');
      return [];
    }
  }

  async loadPipelines() {
    try {
      console.log('[PipelineTest] Loading available pipelines');
      
      const pipelines = await FIBER.pipelines.list();
      this.availablePipelines = pipelines || [];
      
      console.log('[PipelineTest] Loaded pipelines:', this.availablePipelines);
      
      // Update the dropdown after loading
      this.updatePipelineDropdown();
      
      return this.availablePipelines;
    } catch (error) {
      console.error('Error loading pipelines:', error);
      this.showMessage('Failed to load pipelines', 'error');
      return [];
    }
  }

  updatePipelineDropdown() {
    const select = this.shadowRoot.querySelector('#pipeline-select');
    if (!select) return;

    if (this.availablePipelines.length === 0) {
      select.innerHTML = '<option value="">No pipelines available</option>';
      select.disabled = true;
      return;
    }

    // Build options with first one selected
    select.innerHTML = this.availablePipelines.map((pipeline, index) => `
      <option value="${pipeline.pipeline_id}" ${index === 0 ? 'selected' : ''}>
        ${pipeline.name}
      </option>
    `).join('');

    // Auto-select the first pipeline
    if (this.availablePipelines.length > 0 && !this.selectedPipelineId) {
      this.selectedPipelineId = this.availablePipelines[0].pipeline_id;
      console.log('[PipelineTest] Auto-selected first pipeline:', this.selectedPipelineId);
    }

    select.disabled = false;
  }

  async runPipeline(number) {
    try {
      console.log('[PipelineTest] Starting pipeline with number:', number);
      
      if (!this.selectedPipelineId) {
        this.showMessage('Please select a pipeline first', 'error');
        return;
      }
      
      // Switch to status view
      this.currentView = 'status';
      this.render();
      
      // Execute the selected pipeline
      const pipelineInput = { number: parseInt(number) };
      
      // Create a temporary execution object with a predictable ID pattern
      // The actual execution ID will be returned by the API, but we need something now
      // to track WebSocket messages that arrive during execution
      this.currentExecution = {
        pipeline_id: this.selectedPipelineId,
        input_data: pipelineInput,
        status: 'starting'
      };

      console.log('[PipelineTest] Temporary execution set to:', this.currentExecution);

      // Reset completion flag for new pipeline
      this.isCompleted = false;

      // Set all steps to pending state initially (they'll update to running when WebSocket messages arrive)
      this.stepStatuses = {
        'double_number': 'pending',
        'save_result': 'pending'
      };
      this.render(); // Re-render to show pending state

      const execution = await FIBER.pipelines.execute(
        this.selectedPipelineId,
        pipelineInput,
        { source: 'pipeline_test_app' }
      );
      
      // Update with the real execution object
      this.currentExecution = execution;

      console.log('[PipelineTest] Final execution set to:', this.currentExecution);
      console.log('[PipelineTest] Execution ID:', this.currentExecution?.execution_id);

      console.log('[PipelineTest] Pipeline started:', execution);
      
      return execution;
    } catch (error) {
      console.error('Error running pipeline:', error);
      this.showMessage('Failed to start pipeline: ' + error.message, 'error');
      this.currentView = 'input';
      this.render();
      throw error;
    }
  }

  handlePipelineUpdate(message) {
    console.log('[PipelineTest] handlePipelineUpdate called with:', message);
    
    // If we're not expecting pipeline updates, ignore all messages
    if (this.currentView !== 'status') {
      console.log('[PipelineTest] Not in status view, ignoring message');
      return;
    }

    // If we don't have an active execution context, ignore
    if (!this.currentExecution) {
      console.log('[PipelineTest] No current execution, ignoring message');
      return;
    }

    console.log('[PipelineTest] Current execution:', this.currentExecution);

    // Get the execution ID from the message
    const messageExecutionId = message.execution_id || message.data?.execution_id;
    console.log('[PipelineTest] Message execution ID:', messageExecutionId);
    console.log('[PipelineTest] Current execution ID:', this.currentExecution.execution_id);

    // If we have a real execution ID, filter by it. Otherwise, accept any message while in status view
    if (this.currentExecution.execution_id && messageExecutionId !== this.currentExecution.execution_id) {
      console.log(`[PipelineTest] Ignoring message for different execution: ${messageExecutionId}`);
      return;
    }

    // If this is the first message and we don't have a real execution ID yet, adopt it
    if (!this.currentExecution.execution_id && messageExecutionId) {
      console.log('[PipelineTest] Adopting execution ID from first message:', messageExecutionId);
      this.currentExecution.execution_id = messageExecutionId;
    }

    console.log('[PipelineTest] Processing pipeline update:', message);

    // Handle different types of pipeline updates
    if (message.type === 'pipeline_step_update') {
      const { step_id, status, data } = message;

      console.log('[PipelineTest] Step update:', { step_id, status, currentStatuses: this.stepStatuses });
      console.log('[PipelineTest] Step ID type:', typeof step_id, 'Step ID value:', JSON.stringify(step_id));
      console.log('[PipelineTest] Status type:', typeof status, 'Status value:', JSON.stringify(status));

      // Update stored step status based on the actual message
      if (status === 'running') {
        console.log('[PipelineTest] Setting step to RUNNING:', step_id);
        this.stepStatuses[step_id] = 'running';
        this.updateStepStatus(step_id, 'running');
      } else if (status === 'completed') {
        console.log('[PipelineTest] Setting step to COMPLETED:', step_id);
        this.stepStatuses[step_id] = 'completed';
        this.updateStepStatus(step_id, 'completed');

        // Light up connection when step 1 completes
        if (step_id === 'double_number') {
          console.log('[PipelineTest] Step 1 (double_number) completed, lighting up connection');
          this.updateConnectionStatus('connection-1-2', 'running');
        }
      } else if (status === 'failed') {
        console.log('[PipelineTest] Setting step to ERROR:', step_id);
        this.stepStatuses[step_id] = 'error';
        this.updateStepStatus(step_id, 'error');
        this.showMessage(`Step ${step_id} failed: ${data?.error || 'Unknown error'}`, 'error');
      } else {
        console.log('[PipelineTest] Unknown step status:', status, 'for step:', step_id);
      }

      console.log('[PipelineTest] Updated stepStatuses:', this.stepStatuses);

      // Handle pipeline completion
      if (status === 'completed' && step_id === 'save_result') {
        // Mark connection as completed when final step completes
        this.updateConnectionStatus('connection-1-2', 'completed');
        
        // Only handle completion once
        if (!this.isCompleted) {
          this.isCompleted = true;
          this.handlePipelineCompletion(data);
        }
      }

    } else if (message.type === 'pipeline_execution_update') {
      const { execution_id, status, result } = message;

      if (status === 'running') {
        this.showMessage('Pipeline started...', 'info');
      } else if (status === 'completed') {
        this.showMessage('Pipeline completed successfully!', 'success');
        
        // Only handle completion once
        if (!this.isCompleted) {
          this.isCompleted = true;
          this.handlePipelineCompletion(result);
        }
      } else if (status === 'failed') {
        this.showMessage(`Pipeline failed: ${message.message}`, 'error');
      }
    }
  }

  updateStepStatus(stepId, status) {
    // Map step IDs to UI element IDs
    const stepMap = {
      'double_number': 'step-double',
      'save_result': 'step-save'
    };

    const elementId = stepMap[stepId];
    const stepElement = this.shadowRoot.querySelector(`#${elementId}`);

    if (stepElement) {
      console.log('[PipelineTest] Updating step status:', { stepId, elementId, status });

      // Remove all existing status classes
      stepElement.classList.remove('active', 'completed', 'error', 'loading', 'pending', 'running');

      // Add new status class
      if (status === 'running') {
        stepElement.classList.add('running');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-spinner fa-spin running';
        }
      } else if (status === 'completed') {
        stepElement.classList.add('completed');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-check completed';
        }
      } else if (status === 'error') {
        stepElement.classList.add('error');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-times error';
        }
      } else if (status === 'loading') {
        stepElement.classList.add('loading');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-hourglass-half loading';
        }
      } else if (status === 'pending') {
        stepElement.classList.add('pending');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-clock pending';
        }
      }

      console.log('[PipelineTest] Step status updated:', { stepId, status, classes: stepElement.className });
    } else {
      console.warn('[PipelineTest] Step element not found:', { stepId, elementId });
    }
  }

  updateConnectionStatus(connectionId, status) {
    const connectionElement = this.shadowRoot.querySelector(`#${connectionId}`);
    if (connectionElement) {
      // Remove existing status classes
      connectionElement.classList.remove('active', 'completed', 'running');

      // Add new status
      if (status === 'active' || status === 'running') {
        connectionElement.classList.add('running');
      } else if (status === 'completed') {
        connectionElement.classList.add('completed');
      }

      console.log('[PipelineTest] Updated connection status:', { connectionId, status, classes: connectionElement.className });
    } else {
      console.warn('[PipelineTest] Connection element not found:', connectionId);
    }
  }

  async handlePipelineCompletion(data) {
    console.log('[PipelineTest] Pipeline completed with data:', data);

    // Extract result data from the pipeline execution
    // Data structure varies based on whether it comes from WebSocket or API response
    const steps = data?.steps || data?.step_results || {};
    const inputData = data?.input_data || data?.pipeline_input || {};

    const doubleResult = steps.double_number;
    const saveResult = steps.save_result;

    console.log('[PipelineTest] Extracted results:', {
      inputData,
      doubleResult,
      saveResult,
      steps
    });

    // Store the last result with better data extraction
    this.lastResult = {
      input: inputData?.number || this.shadowRoot.querySelector('#number-input')?.value || 0,
      doubled: doubleResult?.doubled_number || doubleResult?.result?.doubled_number || 0,
      resultId: saveResult?.result_id || saveResult?.result?.result_id,
      success: saveResult?.success !== false
    };

    console.log('[PipelineTest] Final lastResult:', this.lastResult);
    
    // Reload results to get the new one
    await this.loadResults();
    
    // Reload activations to show the latest execution
    await this.loadActivations();
    
    this.showMessage('Pipeline completed successfully!', 'success');
    
    // Switch to results view immediately
    this.currentView = 'results';
    this.render();
  }

  showMessage(message, type = 'info') {
    const container = this.shadowRoot.querySelector('#message-container');
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                      type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }

  setupEventListeners() {
    // Navigation buttons
    const navLinks = this.shadowRoot.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = e.currentTarget.getAttribute('data-route');
        if (route) {
          FIBER.router.navigateTo(route);
        }
      });
    });
    
    // Pipeline selection
    const pipelineSelect = this.shadowRoot.querySelector('#pipeline-select');
    if (pipelineSelect) {
      pipelineSelect.addEventListener('change', (e) => {
        this.selectedPipelineId = e.target.value;
        console.log('[PipelineTest] Selected pipeline:', this.selectedPipelineId);
      });
    }
    
    // Pipeline form submission
    const pipelineForm = this.shadowRoot.querySelector('#pipeline-form');
    if (pipelineForm) {
      pipelineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const numberInput = this.shadowRoot.querySelector('#number-input');
        const number = numberInput.value;
        
        if (number && !isNaN(number)) {
          await this.runPipeline(number);
        }
      });
    }
    

    // Try Again button (in results panel)
    const tryAgainBtn = this.shadowRoot.querySelector('#try-again-btn');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        this.currentView = 'input';
        this.currentExecution = null;
        this.isCompleted = false; // Reset completion flag
        // Reset step statuses
        this.stepStatuses = {
          'double_number': 'pending',
          'save_result': 'pending'
        };
        this.render();
      });
    }
  }

  renderResults() {
    const container = this.shadowRoot.querySelector('#results-list');

    if (this.testResults.length === 0) {
      container.innerHTML = '<div class="loading">No results yet</div>';
      return;
    }

    console.log('[PipelineTest] Rendering results:', this.testResults);
    console.log('[PipelineTest] Number of results:', this.testResults.length);

    container.innerHTML = this.testResults.map((result, index) => {
      console.log(`[PipelineTest] Processing result ${index}:`, result);
      console.log(`[PipelineTest] Result keys:`, Object.keys(result));
      console.log(`[PipelineTest] Result data type:`, typeof result.data);
      
      // Log the actual structure for debugging
      if (result.data) {
        console.log(`[PipelineTest] Result.data:`, result.data);
        console.log(`[PipelineTest] Result.data keys:`, Object.keys(result.data));
      }

      // Handle different possible field names for the data
      const inputNumber = result.input_number || 
                         result.inputNumber || 
                         result.number || 
                         result.data?.input_number || 
                         result.data?.inputNumber ||
                         result.data?.number ||
                         'unknown';
      
      const doubledNumber = result.doubled_number || 
                           result.doubledNumber || 
                           result.result || 
                           result.data?.doubled_number || 
                           result.data?.doubledNumber ||
                           result.data?.result ||
                           'unknown';
      
      const createdAt = result.created_at || 
                       result.createdAt || 
                       result.timestamp || 
                       result.data?.created_at ||
                       result.data?.createdAt ||
                       result.data?.timestamp ||
                       new Date().toISOString();

      console.log(`[PipelineTest] Parsed result ${index}:`, { 
        inputNumber, 
        doubledNumber, 
        createdAt,
        originalResult: result 
      });

      return `
        <div class="result-row">
          <div>
            <strong>${inputNumber}</strong> × 2 = <strong>${doubledNumber}</strong>
          </div>
          <div>
            <small>${new Date(createdAt).toLocaleString()}</small>
          </div>
        </div>
      `;
    }).join('');
  }

  render() {
    console.log('[PipelineTest] Rendering component, view:', this.currentView);
    
    // Inject HTML template and CSS
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
    `;
    
    // Show/hide panels based on current view
    const panels = {
      'input': '#input-panel',
      'status': '#status-panel',
      'results': '#results-panel'
    };
    
    Object.entries(panels).forEach(([view, selector]) => {
      const panel = this.shadowRoot.querySelector(selector);
      if (panel) {
        if (view === this.currentView) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    });
    
    // Populate results if in results view
    if (this.currentView === 'results') {
      // Show last result
      if (this.lastResult) {
        this.shadowRoot.querySelector('#result-input').textContent = this.lastResult.input;
        this.shadowRoot.querySelector('#result-doubled').textContent = this.lastResult.doubled;
        this.shadowRoot.querySelector('#result-status').textContent = 'SUCCESS';
      }
      
      // Render recent results
      setTimeout(() => this.renderResults(), 0);
    }
    
    // Update pipeline dropdown if in input view
    if (this.currentView === 'input') {
      setTimeout(() => this.updatePipelineDropdown(), 0);
    }
    
    // Restore step statuses after HTML reset
    if (this.currentView === 'status') {
      setTimeout(() => {
        Object.entries(this.stepStatuses).forEach(([stepId, status]) => {
          this.updateStepStatus(stepId, status);
        });
      }, 0);
    }

    // Set up event listeners after render
    setTimeout(() => {
      this.setupEventListeners();
    }, 0);
  }
}

customElements.define('pipeline-test-app', PipelineTestApp);