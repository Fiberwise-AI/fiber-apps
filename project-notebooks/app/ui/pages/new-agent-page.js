import htmlContent from './new-agent-page.html?raw';


/**
 * New Agent Page Component
 * Provides an overlay for adding new agents to a project
 */
class NewAgentPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = htmlContent;
    const appBridge = document.querySelector('app-bus').appBridge;
    this.notifications = appBridge.notifications;
    this.projectId = null;
    this.availableAgentTypes = [];
    this.selectedAgentType = null;
  }

  connectedCallback() {
    console.log('NewAgentPage connected to DOM');
    
    // Get project ID from attribute
    this.projectId = this.getAttribute('project-id');
    if (!this.projectId) {
      this.showError('No project ID specified');
      return;
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load project data and agent types
    this.loadProjectData(this.projectId);
    this.loadAgentTypes();
  }
  
  /**
   * Set up event listeners for form, buttons, etc.
   */
  setupEventListeners() {
    // Form submission
    const agentForm = this.shadowRoot.getElementById('new-agent-form');
    if (agentForm) {
      agentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createNewAgent();
      });
    }
    
    // Agent type selection
    const agentTypeSelector = this.shadowRoot.getElementById('agent-type-selector');
    if (agentTypeSelector) {
      agentTypeSelector.addEventListener('change', (e) => {
        this.selectedAgentType = e.target.value;
        this.updateAgentTypeInfo();
      });
    }
    
    // Cancel button
    const cancelBtn = this.shadowRoot.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closeOverlay();
      });
    }
  }
  
  /**
   * Load project data to verify it exists
   */
  async loadProjectData(projectId) {
    try {
      // Use dynamic data API
      const appSlug = 'project-container';
      const apiBase = `/api/v1/data/${appSlug}`;
      
      const response = await fetch(`${apiBase}/projects/items/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.statusText}`);
      }
      
      const project = await response.json();
      
      // Update title in overlay
      const titleEl = this.shadowRoot.querySelector('.overlay-title');
      if (titleEl) {
        titleEl.textContent = `Add Agent to: ${project.name || 'Project'}`;
      }
      
    } catch (error) {
      console.error('Error loading project:', error);
      this.showError(`Failed to load project: ${error.message}`);
    }
  }
  
  /**
   * Load available agent types
   */
  async loadAgentTypes() {
    try {
      const response = await fetch('/api/v1/agent-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load agent types: ${response.statusText}`);
      }
      
      this.availableAgentTypes = await response.json();
      this.populateAgentTypeSelector();
      
    } catch (error) {
      console.error('Error loading agent types:', error);
      this.notifications.warning(`Failed to load agent types: ${error.message}`);
    }
  }
  
  /**
   * Fill the agent type selector with available options
   */
  populateAgentTypeSelector() {
    const selector = this.shadowRoot.getElementById('agent-type-selector');
    if (!selector || !this.availableAgentTypes || this.availableAgentTypes.length === 0) return;
    
    // Clear existing options except the first placeholder
    while (selector.options.length > 1) {
      selector.remove(1);
    }
    
    // Add options for each agent type
    this.availableAgentTypes.forEach(agentType => {
      const option = document.createElement('option');
      option.value = agentType.id;
      option.textContent = agentType.name;
      selector.appendChild(option);
    });
  }
  
  /**
   * Update the agent type info section when a type is selected
   */
  updateAgentTypeInfo() {
    if (!this.selectedAgentType) return;
    
    const agentTypeInfo = this.shadowRoot.getElementById('agent-type-info');
    if (!agentTypeInfo) return;
    
    const selectedType = this.availableAgentTypes.find(type => type.id === this.selectedAgentType);
    if (!selectedType) return;
    
    agentTypeInfo.innerHTML = `
      <h4>${selectedType.name}</h4>
      <p>${selectedType.description || 'No description available'}</p>
      <div class="capabilities">
        ${selectedType.capabilities && selectedType.capabilities.length > 0 
          ? `<p><strong>Capabilities:</strong> ${selectedType.capabilities.join(', ')}</p>` 
          : ''}
      </div>
    `;
    agentTypeInfo.style.display = 'block';
    
    // Pre-fill agent name field with a default
    const nameInput = this.shadowRoot.getElementById('agent-name');
    if (nameInput) {
      nameInput.value = selectedType.name;
    }
  }
  
  /**
   * Create a new agent for the project
   */
  async createNewAgent() {
    if (!this.projectId || !this.selectedAgentType) {
      this.notifications.warning('Please select an agent type');
      return;
    }
    
    const nameInput = this.shadowRoot.getElementById('agent-name');
    const enabledSwitch = this.shadowRoot.getElementById('agent-enabled');
    
    if (!nameInput || !nameInput.value.trim()) {
      this.notifications.warning('Please enter an agent name');
      return;
    }
    
    // Find the selected agent type
    const selectedType = this.availableAgentTypes.find(type => type.id === this.selectedAgentType);
    if (!selectedType) return;
    
    // Create agent data
    const agentData = {
      agent_type_id: this.selectedAgentType,
      name: nameInput.value.trim(),
      is_active: enabledSwitch ? enabledSwitch.checked : true,
      config: selectedType.default_config || {}
    };
    
    try {
      // Send API request to create agent
      const response = await fetch(`/api/v1/projects/${this.projectId}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(agentData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add agent: ${response.statusText}`);
      }
      
      const newAgent = await response.json();
      
      // Show success message
      this.notifications.success(`Added ${selectedType.name} agent to project`);
      
      // Trigger event for agent creation
      this.dispatchEvent(new CustomEvent('agent-added', {
        bubbles: true,
        composed: true,
        detail: {
          projectId: this.projectId,
          agent: newAgent
        }
      }));
      
      // Close the overlay
      this.closeOverlay();
      
    } catch (error) {
      console.error('Error adding agent:', error);
      this.notifications.error(`Failed to add agent: ${error.message}`);
    }
  }
  
  /**
   * Close this overlay
   */
  closeOverlay() {
    const overlayPanel = this.closest('overlay-panel');
    if (overlayPanel) {
      overlayPanel.close();
    } else {
      // Fallback - trigger browser back if we're in an overlay route
      window.history.back();
    }
  }
  
  /**
   * Show error message in the component
   */
  showError(message) {
    const container = this.shadowRoot.querySelector('.overlay-content') || this.shadowRoot;
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn-secondary" id="close-error">Close</button>
      </div>
    `;
    
    const closeBtn = container.querySelector('#close-error');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeOverlay());
    }
  }
  
  disconnectedCallback() {
    console.log('NewAgentPage disconnected from DOM');
  }
}

customElements.define('new-agent-page', NewAgentPage);
