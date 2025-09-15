import htmlContent from './project-settings.html?raw';

/**
 * Project Settings Component
 * Provides a dedicated overlay for managing project settings
 */
class ProjectSettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = htmlContent;
    
    const appBridge = document.querySelector('app-bus').appBridge;
    this.notifications = appBridge.notifications;
    this.currentProject = null;
    this.availableAgentTypes = [];
    this.isAgentsLoaded = false;
    // Add configuration for app slug
    this.appSlug = 'project-container';
    
    // Create a new instance of DynamicDataAPI
    this.dynamicDataApi = new DynamicDataAPI();
  }

  connectedCallback() {
    console.log('ProjectSettings connected to DOM');
    
    // Get project ID from attribute
    const projectId = this.getAttribute('id');
    if (!projectId) {
      this.showError('No project ID specified');
      return;
    }
    
    // Initialize the API
    if (window.projectContainer?.config?.id) {
      this.dynamicDataApi.initialize(window.APP_API, window.projectContainer.config.id);
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load project data and agent types
    this.loadProjectData(projectId);
    this.loadAgentTypes();
  }
  
  /**
   * Set up event listeners for tabs, forms, etc.
   */
  setupEventListeners() {
    // Tab switching
    const tabButtons = this.shadowRoot.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        this.switchSettingsTab(tabId);
      });
    });
    
    // Form submission
    const settingsForm = this.shadowRoot.getElementById('project-settings-form');
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProjectSettings();
    });
    
    // Add agent button
    const addAgentBtn = this.shadowRoot.getElementById('add-agent-btn');
    addAgentBtn.addEventListener('click', () => this.addAgentToProject());
  }
  
  /**
   * Load project data from API
   */
  async loadProjectData(projectId) {
    try {
      // Use dynamic data API endpoint
      const apiBase = `/api/v1/data/${this.appSlug}`;
      const response = await fetch(`${apiBase}/projects/items/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.statusText}`);
      }
      
      const project = await response.json();
      this.currentProject = project;
      
      // Update form fields - handle backward compatibility
      const nameInput = this.shadowRoot.getElementById('project-name');
      const descInput = this.shadowRoot.getElementById('project-description');
      
      nameInput.value = project.name || '';
      descInput.value = project.description || '';
      
      // Update title in overlay
      const titleEl = this.shadowRoot.querySelector('.settings-title');
      if (titleEl) {
        titleEl.textContent = `Project Settings: ${project.name || 'Project'}`;
      }
      
      // Load agents for this project
      this.loadProjectAgents(project.id || project.item_id);
      
    } catch (error) {
      console.error('Error loading project:', error);
      this.showError(`Failed to load project: ${error.message}`);
    }
  }
  
  /**
   * Load available agent types from API
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
      this.updateAgentTypeSelector();
      
    } catch (error) {
      console.error('Error loading agent types:', error);
      // Non-critical - just show a warning
      this.notifications.warning(`Failed to load agent types: ${error.message}`);
    }
  }
  
  /**
   * Update the agent type selector with available options
   */
  updateAgentTypeSelector() {
    if (!this.availableAgentTypes || this.availableAgentTypes.length === 0) return;
    
    const selector = this.shadowRoot.getElementById('agent-type-selector');
    if (!selector) return;
    
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
   * Load agents for a specific project
   */
  async loadProjectAgents(projectId) {
    if (!projectId) return;
    
    const agentsList = this.shadowRoot.getElementById('agents-list');
    if (!agentsList) return;
    
    // Show loading state
    agentsList.innerHTML = '<div class="loading-placeholder">Loading agents...</div>';
    
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/agents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load project agents: ${response.statusText}`);
      }
      
      const agents = await response.json();
      this.isAgentsLoaded = true;
      
      // Update the agents list
      this.renderAgentsList(agents);
      
    } catch (error) {
      console.error(`Error loading agents for project ${projectId}:`, error);
      agentsList.innerHTML = `<div class="error-message">Error loading agents: ${error.message}</div>`;
    }
  }
  
  /**
   * Render the list of agents for the current project
   */
  renderAgentsList(agents) {
    const agentsList = this.shadowRoot.getElementById('agents-list');
    if (!agentsList) return;
    
    if (!agents || agents.length === 0) {
      agentsList.innerHTML = '<div class="empty-message">No agents added to this project yet</div>';
      return;
    }
    
    // Create agent items
    const agentItems = agents.map(agent => `
      <div class="agent-item" data-agent-id="${agent.id}">
        <div class="agent-info">
          <div class="agent-name">${agent.name}</div>
          <div class="agent-type">${agent.agent_type_id}</div>
          <div class="agent-status ${agent.is_active ? 'active' : 'inactive'}">
            ${agent.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div class="agent-actions">
          <button class="btn-icon agent-edit-btn" title="Edit Agent">
            <i class="fas fa-cog"></i>
          </button>
          <button class="btn-icon agent-delete-btn" title="Remove Agent">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
    
    agentsList.innerHTML = agentItems;
    
    // Add event listeners to agent action buttons
    const editButtons = agentsList.querySelectorAll('.agent-edit-btn');
    const deleteButtons = agentsList.querySelectorAll('.agent-delete-btn');
    
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const agentItem = e.target.closest('.agent-item');
        const agentId = agentItem.getAttribute('data-agent-id');
        this.editAgent(agentId);
      });
    });
    
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const agentItem = e.target.closest('.agent-item');
        const agentId = agentItem.getAttribute('data-agent-id');
        this.confirmDeleteAgent(agentId);
      });
    });
  }
  
  /**
   * Switch between settings tabs
   */
  switchSettingsTab(tabId) {
    // Update active tab button
    const tabButtons = this.shadowRoot.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      if (button.getAttribute('data-tab') === tabId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Update active tab content
    const tabContents = this.shadowRoot.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      if (content.getAttribute('data-tab') === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }
  
  /**
   * Save project settings
   */
  async saveProjectSettings() {
    if (!this.currentProject) return;
    
    const nameInput = this.shadowRoot.getElementById('project-name');
    const descInput = this.shadowRoot.getElementById('project-description');
    
    const updatedData = {
      name: nameInput.value.trim(),
      description: descInput.value.trim()
    };
    
    try {
      // Use dynamic data API endpoint
      const apiBase = `/api/v1/data/${this.appSlug}`;
      const projectId = this.currentProject.id || this.currentProject.item_id;
      
      const response = await fetch(`${apiBase}/projects/items/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }
      
      const updatedProject = await response.json();
      this.currentProject = updatedProject;
      
      // Show success notification
      this.notifications.success('Project updated successfully');
      
      // Trigger a custom event for the parent to update its UI
      this.dispatchEvent(new CustomEvent('project-updated', {
        bubbles: true,
        composed: true,
        detail: updatedProject
      }));
      
    } catch (error) {
      console.error('Error updating project:', error);
      this.notifications.error(`Failed to update project: ${error.message}`);
    }
  }
  
  /**
   * Add a new agent to the current project
   */
  async addAgentToProject() {
    if (!this.currentProject) return;
    
    const agentTypeSelector = this.shadowRoot.getElementById('agent-type-selector');
    const selectedAgentTypeId = agentTypeSelector.value;
    
    if (!selectedAgentTypeId) {
      this.notifications.warning('Please select an agent type');
      return;
    }
    
    // Find the selected agent type details
    const selectedAgentType = this.availableAgentTypes.find(
      type => type.id === selectedAgentTypeId
    );
    
    if (!selectedAgentType) return;
    
    try {
      // Create agent data
      const agentData = {
        agent_type_id: selectedAgentTypeId,
        name: selectedAgentType.name, // Use agent type name as default
        is_active: true,
        config: selectedAgentType.default_config || {}
      };
      
      // Send API request to create agent
      const response = await fetch(`/api/v1/projects/${this.currentProject.id}/agents`, {
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
      this.notifications.success(`Added ${selectedAgentType.name} agent to project`);
      
      // Reset the selector
      agentTypeSelector.selectedIndex = 0;
      
      // Reload agents list
      this.loadProjectAgents(this.currentProject.id);
      
      // Dispatch event for agent added
      this.dispatchEvent(new CustomEvent('agent-added', {
        bubbles: true,
        composed: true,
        detail: {
          projectId: this.currentProject.id,
          agent: newAgent
        }
      }));
      
    } catch (error) {
      console.error('Error adding agent:', error);
      this.notifications.error(`Failed to add agent: ${error.message}`);
    }
  }
  
  /**
   * Show edit dialog for an agent
   */
  editAgent(agentId) {
    // For now, just log - to be implemented later
    console.log(`Edit agent: ${agentId}`);
    this.notifications.info('Agent editing coming soon');
  }
  
  /**
   * Confirm and delete an agent
   */
  async confirmDeleteAgent(agentId) {
    if (!this.currentProject || !agentId) return;
    
    if (!confirm('Are you sure you want to remove this agent from the project?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/projects/${this.currentProject.id}/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete agent: ${response.statusText}`);
      }
      
      // Show success message
      this.notifications.success('Agent removed from project');
      
      // Reload agents list
      this.loadProjectAgents(this.currentProject.id);
      
      // Dispatch event for agent removed
      this.dispatchEvent(new CustomEvent('agent-removed', {
        bubbles: true,
        composed: true,
        detail: {
          projectId: this.currentProject.id,
          agentId
        }
      }));
      
    } catch (error) {
      console.error('Error deleting agent:', error);
      this.notifications.error(`Failed to delete agent: ${error.message}`);
    }
  }
  
  /**
   * Show error message in the component
   */
  showError(message) {
    const container = this.shadowRoot.querySelector('.settings-body') || this.shadowRoot;
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `;
  }
  
  disconnectedCallback() {
    console.log('ProjectSettings disconnected from DOM');
    // Remove any listeners or cleanup tasks here
  }
}

customElements.define('project-settings', ProjectSettings);
