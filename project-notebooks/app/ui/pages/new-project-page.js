import htmlContent from './new-project-page.html?raw';
import styles from './new-project-page.css?raw';
import { APPSTATE } from '../../../index.js';

class NewProjectPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = htmlContent; 
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    this.shadowRoot.appendChild(styleElement);
    
    // // Get AppBridge for navigation and notifications
    // const appBridge = document.querySelector('app-bus').appBridge;
    // this.appBridge = appBridge;
    // this.notifications = appBridge.notifications;
    
    // Initialize DynamicData client from APPSTATE
    this.dynamicClient = APPSTATE.dynamicDataClient;
    
    // Initialize form state
    this.formState = {
      name: '',
      description: '',
      projectTemplate: 'general',
      agents: []
    };
    
    // Reference to available agent types
    this.availableAgentTypes = [];
  }

  connectedCallback() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    this.setupElements();
    this.setupEventListeners();
   // this.loadAgentTypes();
  }

  setupElements() {
    // Get form elements
    this.form = this.shadowRoot.getElementById('newProjectForm');
    this.nameInput = this.shadowRoot.getElementById('projectName');
    this.descriptionInput = this.shadowRoot.getElementById('projectDescription');
    this.templateSelect = this.shadowRoot.getElementById('projectTemplate');
    this.agentsContainer = this.shadowRoot.getElementById('agentsContainer');
    this.agentTypeSelector = this.shadowRoot.getElementById('agentTypeSelector');
    this.createBtn = this.shadowRoot.getElementById('createBtn');
    this.cancelBtn = this.shadowRoot.getElementById('cancelBtn');
    this.submitSpinner = this.shadowRoot.getElementById('submitSpinner');
    this.nameError = this.shadowRoot.getElementById('nameError');
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Input validation
    this.nameInput.addEventListener('input', () => {
      this.formState.name = this.nameInput.value;
      this.validateName();
    });
    
    this.descriptionInput.addEventListener('input', () => {
      this.formState.description = this.descriptionInput.value;
    });
    
    this.templateSelect.addEventListener('change', () => {
      this.formState.projectTemplate = this.templateSelect.value;
    });
    
    // Agent buttons
    this.shadowRoot.getElementById('addAgentBtn').addEventListener('click', () => this.addAgent());
    
    // Cancel button
    this.cancelBtn.addEventListener('click', () => this.cancelCreate());
  }

  async loadAgentTypes() {
    try {
      // Use DynamicData client to fetch agent types
      const result = await this.dynamicClient.listItems('agent_types');
      this.availableAgentTypes = result.items || [];
      
      console.log(`[NewProjectPage] Loaded ${this.availableAgentTypes.length} agent types`);
      
      // Populate the agent type selector
      this.populateAgentTypeSelector();
      
      // Show empty state message if no agents are selected yet
      this.updateAgentsContainer();
      
    } catch (error) {
      console.error('[NewProjectPage] Error loading agent types:', error);
      this.notifications.error('Failed to load agent types');
    }
  }

  populateAgentTypeSelector() {
    // Keep the default empty option
    let options = '<option value="">Select an agent to add...</option>';
    
    // Add an option for each agent type
    options += this.availableAgentTypes.map(agent => 
      `<option value="${agent.data.slug}">${agent.data.name}</option>`
    ).join('');
    
    this.agentTypeSelector.innerHTML = options;
  }

  addAgent() {
    const selectedAgentSlug = this.agentTypeSelector.value;
    if (!selectedAgentSlug) return;
    
    // Find the selected agent type
    const agentType = this.availableAgentTypes.find(a => a.data.slug === selectedAgentSlug);
    if (!agentType) return;
    
    // Add this agent to our form state
    const newAgent = {
      id: Date.now().toString(), // Temporary ID for DOM purposes
      type_id: agentType.item_id,
      slug: agentType.data.slug,
      name: agentType.data.name,
      config: { ...agentType.data.default_config } // Clone default config
    };
    
    this.formState.agents.push(newAgent);
    
    // Update the UI
    this.updateAgentsContainer();
    
    // Reset the selector
    this.agentTypeSelector.value = '';
  }

  updateAgentsContainer() {
    if (this.formState.agents.length === 0) {
      this.agentsContainer.innerHTML = `
        <div class="empty-agents">
          <p>No agents added yet. Select an agent type to add.</p>
        </div>
      `;
      return;
    }
    
    // Render each agent
    this.agentsContainer.innerHTML = this.formState.agents.map(agent => `
      <div class="agent-entry" data-agent-id="${agent.id}">
        <div class="agent-header">
          <span class="agent-title">${agent.name}</span>
          <button type="button" class="agent-remove" data-agent-id="${agent.id}">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners for remove buttons
    this.agentsContainer.querySelectorAll('.agent-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const agentId = btn.getAttribute('data-agent-id');
        this.removeAgent(agentId);
      });
    });
  }

  removeAgent(agentId) {
    this.formState.agents = this.formState.agents.filter(a => a.id !== agentId);
    this.updateAgentsContainer();
  }

  validateName() {
    const name = this.formState.name;
    
    if (!name || name.length < 3) {
      this.nameError.textContent = 'Project name must be at least 3 characters';
      this.nameError.style.display = 'block';
      return false;
    }
    
    this.nameError.style.display = 'none';
    return true;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!this.validateName()) return;
    
    // Show loading state
    this.setLoading(true);
    
    try {
      // Prepare project data
      const projectData = {
        name: this.formState.name,
        description: this.formState.description,
        status: 'active',
        tags: [],
        settings: {
          theme: 'default',
          visibility: 'private'
        }
      };
      
      // Create project with DynamicData client
      console.log('[NewProjectPage] Creating project:', projectData);
      const project = await this.dynamicClient.createItem('projects', projectData);
      console.log('[NewProjectPage] Project created:', project);
      
      // If we have agents to add, create those too
      if (this.formState.agents.length > 0) {
        await this.createProjectAgents(project.item_id);
      }
      
      // Show success notification
      //this.notifications.success('Project created successfully');
      
      // Navigate to the project dashboard
      this.appBridge._router.navigateTo(`/projects/${project.item_id}`);
      
    } catch (error) {
      console.error('[NewProjectPage] Error creating project:', error);
      this.notifications.error(`Failed to create project: ${error.message || 'Unknown error'}`);
      this.setLoading(false);
    }
  }

  async createProjectAgents(projectId) {
    // Create each agent instance for the project
    for (const agent of this.formState.agents) {
      try {
        const agentData = {
          name: agent.name,
          agent_type_id: agent.type_id,
          config: agent.config,
          is_active: true
        };
        
        // Create the agent
        const createdAgent = await this.dynamicClient.createItem('project_agents', agentData);
        console.log(`[NewProjectPage] Created agent: ${agent.name}`, createdAgent);
        
        // Link the agent to the project
        const assignmentData = {
          agent_instance_id: createdAgent.item_id,
          entity_type: 'project',
          entity_id: projectId,
          assignment_name: `${agent.name} for Project`,
          is_active: true
        };
        
        await this.dynamicClient.createItem('agent_assignments', assignmentData);
        console.log(`[NewProjectPage] Assigned agent to project`);
        
      } catch (error) {
        console.error(`[NewProjectPage] Error creating agent ${agent.name}:`, error);
        // Continue with other agents even if one fails
      }
    }
  }

  cancelCreate() {
    this.appBridge._router.navigateTo('/projects');
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.createBtn.disabled = true;
      this.submitSpinner.classList.remove('hidden');
      this.createBtn.querySelector('.btn-text').textContent = 'Creating...';
    } else {
      this.createBtn.disabled = false;
      this.submitSpinner.classList.add('hidden');
      this.createBtn.querySelector('.btn-text').textContent = 'Create Project';
    }
  }
}

customElements.define('new-project-page', NewProjectPage);
export default NewProjectPage;
