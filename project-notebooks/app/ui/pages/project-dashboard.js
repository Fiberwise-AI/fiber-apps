import htmlContent from './project-dashboard.html?raw';
import styles from './project-dashboard.css?raw';
import { APPSTATE } from '../../../index.js';

class ProjectDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = htmlContent;
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    this.shadowRoot.appendChild(styleElement);
    this.projectId = null;
    this.project = null;
    const appBridge = document.querySelector('app-bus').appBridge;
    this.appBridge = appBridge;
    this.notifications = appBridge.notifications;
    
    // Initialize DynamicData client from APPSTATE
    this.dynamicClient = APPSTATE.dynamicDataClient;

    // Add app slug configuration
    this.appSlug = 'project-container';

    // Chat state for handling notebook creation flow
    this.chatState = {
      isCreatingNotebook: false,
      currentStep: null,
      notebookData: {},
      conversationId: null
    };

    // Command patterns for notebook creation
    this.notebookCreationPatterns = [
      /create(?:\s+new)?\s+notebook(?:\s+(?:called|named)\s+"?([^"]+)"?)?/i,
      /new\s+notebook(?:\s+(?:called|named)\s+"?([^"]+)"?)?/i,
      /create\s+(\w+)(?:\s+notebook)(?:\s+(?:called|named)\s+"?([^"]+)"?)?/i,
      /start(?:\s+new)?\s+notebook(?:\s+(?:called|named)\s+"?([^"]+)"?)?/i,
      /paste\s+notebook/i
    ];

    // Define conversation flow steps for notebook creation
    this.notebookCreationSteps = [
      {
        id: 'name',
        prompt: 'What would you like to name your new notebook?',
        validate: (value) => value.trim().length >= 3 ? true : 'Notebook name must be at least 3 characters'
      },
      {
        id: 'type',
        prompt: 'What type of notebook would you like to create? Options: general, research, blog, report, script, idea, summary, chat',
        default: 'general',
        validate: (value) => ['general', 'research', 'blog', 'report', 'script', 'idea', 'summary', 'chat'].includes(value.toLowerCase()) ?
          true : 'Please select a valid notebook type'
      },
      {
        id: 'content',
        prompt: 'Do you want to start with any initial content? Type your content or "no" to skip.',
        optional: true
      },
      {
        id: 'agents',
        prompt: 'Would you like to assign any AI agents to your notebook? Options: research, writing, creative, idea, summary, fact-check, seo (comma-separated, or "no" to skip)',
        optional: true,
        process: (value) => {
          if (value.toLowerCase() === 'no') return [];
          return value.split(',').map(agent => agent.trim().toLowerCase());
        }
      },
      {
        id: 'confirm',
        prompt: (data) => `I'll create a ${data.type} notebook named "${data.name}"${data.content ? ' with your initial content' : ''}${data.agents?.length ? ` and assign ${data.agents.join(', ')} agents` : ''}. Is that correct? (yes/no)`,
        validate: (value) => ['yes', 'no'].includes(value.toLowerCase()) ? true : 'Please answer yes or no'
      }
    ];
  }

  connectedCallback() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // // Get project ID from either data-id attribute or route params
    // this.projectId = this.getAttribute('data-id') ||
    //                 Router.getInstance().getRouteParams('/projects/:id').id;
    // Get project ID from attribute (handles both projectId and project-id formats)
    this.projectId = this.getAttribute('projectId') || 
                    this.getAttribute('project-id') || 
                    this.getAttribute('data-id');

    if (this.projectId) {
        console.log('[ProjectDashboard] Project ID found:', this.projectId);
    } else {
        console.warn('[ProjectDashboard] Project ID not found from attributes (checked projectId, project-id, data-id)');
        // Attempt to get from URL as a fallback (less ideal for component reuse)
        const pathParts = window.location.pathname.split('/');
        const projectIndex = pathParts.indexOf('projects');
        if (projectIndex !== -1 && projectIndex < pathParts.length - 1) {
            const potentialId = pathParts[projectIndex + 1];
            // Basic check if it looks like an ID (numeric or UUID)
            if (/^\d+$/.test(potentialId) || /^[0-9a-fA-F-]{36}$/.test(potentialId)) {
                this.projectId = potentialId;
                console.log('[ProjectDashboard] Fallback: Project ID extracted from URL:', this.projectId);
            }
        }
    }

    if (!this.projectId) {
      console.error('Project ID not found in attributes or URL');
      this.renderError('Error loading project: No project ID provided or found.');
      // Ensure the loading state is cleared
      this.clearLoading();
      return;
    }

    console.log(`[ProjectDashboard] Loading project with ID: ${this.projectId}`);


    this.setupElements();
    this.setupEventListeners();
    this.loadProjectData();
    this.addAgentButton();
    
    // Initialize plugin tabs after project is loaded
    this.initializePluginTabs();
  }

  setupElements() {
    this.projectNameEl = this.shadowRoot.getElementById('project-title');
    this.projectStatusEl = this.shadowRoot.getElementById('project-status'); // Assuming this exists or will be added
    this.projectDescEl = this.shadowRoot.getElementById('project-description');
    this.notebookListComponent = this.shadowRoot.getElementById('notebook-list-component'); // Get notebook list element
    this.newNotebookBtn = this.shadowRoot.getElementById('new-notebook-btn');
    this.settingsBtn = this.shadowRoot.getElementById('settings-btn');
    this.dashboardTabsEl = this.shadowRoot.getElementById('dashboard-tabs');
    this.tabContentContainer = this.shadowRoot.getElementById('tab-content-container');
    this.defaultView = this.shadowRoot.getElementById('default-view');
    
    // Debug which elements were found/not found
    console.debug('[ProjectDashboard] Element references:', {
      projectNameEl: !!this.projectNameEl,
      projectStatusEl: !!this.projectStatusEl,
      projectDescEl: !!this.projectDescEl,
      notebookListComponent: !!this.notebookListComponent,
      newNotebookBtn: !!this.newNotebookBtn,
      settingsBtn: !!this.settingsBtn,
      dashboardTabsEl: !!this.dashboardTabsEl,
      tabContentContainer: !!this.tabContentContainer,
      defaultView: !!this.defaultView
    });
  }

  setupEventListeners() {
    this.newNotebookBtn?.addEventListener('click', () => this.navigateToNewNotebook());
    this.settingsBtn?.addEventListener('click', () => this.navigateToSettings());

    // Setup editable fields (if needed)
    // [this.projectNameEl, this.projectStatusEl, this.projectDescEl].forEach(el => {
    //   el?.addEventListener('click', (e) => this.handleFieldEdit(e.target));
    // });

    // Chat input handler (if chat exists)
    // this.chatInput?.addEventListener('keydown', (e) => {
    //   if (e.key === 'Enter') {
    //     this.handleChatCommand(e.target.value);
    //     e.target.value = '';
    //   }
    // });

    // Listen for notebook-created events (if needed for refresh)
    // this.addEventListener('notebook-created', (e) => {
    //   this.handleNotebookCreated(e.detail.notebook);
    // });
  }

  async loadProjectData() {
    this.renderLoading(); // Show loading state
    try {
      // Load project data
      const project = await this.fetchProject();
      this.project = project; // Store project data

      this.renderProject(project);

      // Pass project ID to the notebook-list component
      if (this.notebookListComponent && this.projectId) {
        console.log(`[ProjectDashboard] Setting projectId=${this.projectId} on notebook-list component.`);
        this.notebookListComponent.setAttribute('projectId', this.projectId);
      } else if (!this.notebookListComponent) {
        console.error('[ProjectDashboard] Notebook list component not found in the shadow DOM.');
      }

      // Fetch and render other related data like plugins if needed
      // const plugins = await this.fetchProjectPlugins();
      // this.updatePluginsTab(plugins); // Example

      this.clearLoading(); // Clear loading state on success

    } catch (error) {
      this.notifications.error('Failed to load project data');
      console.error('[ProjectDashboard] Error loading project ', error);
      this.renderError(`Failed to load project: ${error.message}`); // Show error state
    }
  }

  async fetchProject() {
    try {
      // Use DynamicData client instead of direct fetch
      if (!this.dynamicClient) {
        console.error('[ProjectDashboard] DynamicData client not initialized');
        throw new Error('DynamicData client not available');
      }

      console.log(`[ProjectDashboard] Fetching project ${this.projectId} using DynamicData client`);
      const project = await this.dynamicClient.getItem('projects', this.projectId);
      
      console.log('[ProjectDashboard] Project data retrieved:', project);
      return project;
    } catch (error) {
      console.error('[ProjectDashboard] Error in fetchProject:', error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  }

  // Removed fetchNotebooks - notebook-list component handles this now

  async fetchProjectPlugins() {
    // This function remains if you need to load plugins separately for the dashboard
    try {
      console.log(`[ProjectDashboard] Fetching plugins for project ${this.projectId}...`);
      const response = await fetch(`/api/v1/projects/${this.projectId}/plugins`);

      if (!response.ok) {
        console.warn(`[ProjectDashboard] Project plugins API returned status: ${response.status}`);
        if (response.status === 404) {
          console.info("[ProjectDashboard] Plugins API endpoint may not be implemented yet");
          return [];
        }
        throw new Error(`Failed to fetch project plugins: ${response.statusText}`);
      }

      const plugins = await response.json();
      console.log(`[ProjectDashboard] Loaded ${plugins.length} plugins for project ${this.projectId}`);
      return plugins;
    } catch (error) {
      console.error('[ProjectDashboard] Error fetching project plugins:', error);
      return [];
    }
  }

  updatePluginsTab(plugins) {
    // This function remains if you have a plugins tab/section
    const enabledCount = plugins?.filter(p => p.is_enabled)?.length || 0;
    // Example: Find a tab element and update its content
    // const pluginsTab = this.shadowRoot.querySelector('.tab-button[data-tab="plugins"]');
    // if (pluginsTab && enabledCount > 0) {
    //   pluginsTab.innerHTML = `Plugins <span class="badge">${enabledCount}</span>`;
    // }
  }

  renderProject(project) {
    console.log('[ProjectDashboard] Rendering project:', project);

    // Ensure elements exist before trying to update them
    if (!this.projectNameEl || !this.projectDescEl) {
      this.setupElements(); // Re-find elements if needed
    }

    if (this.projectNameEl) {
      this.projectNameEl.textContent = project.data.name || 'Unnamed Project';
      this.projectNameEl.classList.remove('loading'); // Remove loading class if present
    } else {
      console.warn('[ProjectDashboard] Project name element not found when trying to render');
    }

    if (this.projectStatusEl) {
      // Handle potential field name changes for status - backward compatibility
      this.projectStatusEl.textContent = project.status || 
                                         project.project_status ||
                                         'Active';
    }

    if (this.projectDescEl) {
      this.projectDescEl.textContent = project.data.description || 'No description provided.';
      this.projectDescEl.style.display = 'block'; // Ensure it's visible
    }

    // Update notebook list component if it exists
    if (this.notebookListComponent && this.projectId) {
      console.log(`[ProjectDashboard] Setting projectId=${this.projectId} on notebook-list component.`);
      // Force clear and re-render by removing and re-setting the attribute
      this.notebookListComponent.removeAttribute('projectId');
      // Wait for removal to take effect
      setTimeout(() => {
        this.notebookListComponent.setAttribute('projectId', this.projectId);
        // Also call loadNotebooks directly to ensure refresh
        if (typeof this.notebookListComponent.loadNotebooks === 'function') {
          this.notebookListComponent.loadNotebooks();
        }
      }, 0);
    }

    // Handle project settings (with defaults if not set)
    const settings = project.data.settings || {};
    this.projectSettings = {
      theme: settings.theme || 'default',
      visibility: settings.visibility || 'private',
      enableComments: settings.enableComments !== false, // default to true
      notificationsEnabled: settings.notificationsEnabled !== false, // default to true
      // Add other settings with defaults as needed
    };
    
    // You could apply settings to the UI here
    if (this.projectSettings.theme) {
      this.applyTheme(this.projectSettings.theme);
    }
  }

  // Removed renderNotebooks - notebook-list component handles this now

  // formatNotebookType(type) {
  //   // This might still be useful if other parts of the dashboard need it,
  //   // otherwise, it can be removed if only notebook-list uses it.
  //   if (!type) return 'General';
  //   const typeMap = {
  //     'general': 'General Writing',
  //     'research': 'Research',
  //     'blog': 'Blog Post',
  //     'report': 'Report',
  //     'script': 'Script',
  //     'idea': 'Ideas',
  //     'summary': 'Summary',
  //     'chat': 'Chat-Driven'
  //   };
  //   return typeMap[type.toLowerCase()] || type;
  // }

  navigateToNewNotebook() {
    // Navigate to the dedicated new notebook page/overlay route
    this.appBridge._router.navigateTo(`/projects/${this.projectId}/notebooks/new`);

    // Optional: Dispatch analytics event
    this.dispatchEvent(new CustomEvent('analytics-event', {
      bubbles: true,
      composed: true,
      detail: {
        event: 'new_notebook_started',
        projectId: this.projectId,
        source: 'project_dashboard'
      }
    }));
  }

  navigateToSettings() {
    // Navigate to the project settings page/overlay route
    this.appBridge._router.navigateTo(`/projects/${this.projectId}/settings`);

    // Optional: Dispatch analytics event
    this.dispatchEvent(new CustomEvent('analytics-event', {
      bubbles: true,
      composed: true,
      detail: {
        event: 'project_settings_opened',
        projectId: this.projectId,
        source: 'project_dashboard'
      }
    }));
  }

  // Removed handleNotebookCreated - notebook-list handles its own refresh

  handleFieldEdit(element) {
    // TODO: Implement inline editing if required for dashboard fields
    console.warn('[ProjectDashboard] Inline editing not fully implemented.');
    // const currentValue = element.textContent;
    // const input = document.createElement('input');
    // input.value = currentValue;
    // element.replaceWith(input);
    // input.focus();
    // ... add blur/keydown listeners to save ...
  }

  async updateProjectField(field, value) {
    try {
      if (!this.dynamicClient) {
        console.error('[ProjectDashboard] DynamicData client not initialized');
        throw new Error('DynamicData client not available');
      }

      // Use DynamicData client for partial update
      await this.dynamicClient.updateItem('projects', this.projectId, { [field]: value });
      
      this.notifications.success(`Project ${field} updated.`);
      
    } catch (error) {
      this.notifications.error(`Failed to update project ${field}: ${error.message}`);
      console.error(`[ProjectDashboard] Error updating project field ${field}:`, error);
    }
  }

  // Method to update a specific setting
  async updateProjectSetting(settingName, value) {
    try {
      if (!this.dynamicClient) {
        console.error('[ProjectDashboard] DynamicData client not initialized');
        throw new Error('DynamicData client not available');
      }

      // Get current project data first
      const project = await this.dynamicClient.getItem('projects', this.projectId);
      
      // Get existing settings or create new settings object
      const settings = project.data.settings || {};
      
      // Update the specific setting
      settings[settingName] = value;
      
      // Update the project with the new settings
      await this.dynamicClient.updateItem('projects', this.projectId, {
        settings: settings
      });
      
      // Update local settings object
      this.projectSettings[settingName] = value;
      
      this.notifications.success(`Project setting "${settingName}" updated.`);
      
      // Optionally apply the setting immediately
      if (settingName === 'theme') {
        this.applyTheme(value);
      }
      
    } catch (error) {
      this.notifications.error(`Failed to update project setting: ${error.message}`);
      console.error(`[ProjectDashboard] Error updating project setting:`, error);
    }
  }

  // Example method that would use a setting
  applyTheme(theme) {
    const dashboard = this.shadowRoot.getElementById('project-dashboard');
    if (dashboard) {
      // Remove any existing theme classes
      dashboard.classList.remove('theme-default', 'theme-dark', 'theme-light');
      // Add the new theme class
      dashboard.classList.add(`theme-${theme}`);
    }
  }

  // --- Chat related methods ---
  // These can be kept if the dashboard retains chat functionality,
  // otherwise, they can be removed.

  async handleChatCommand(command) {
    if (!command.trim()) return;

    // Add user message to chat
    this.addChatMessage('user', command);

    // Check if we're in the middle of creating a notebook
    if (this.chatState.isCreatingNotebook) {
      await this.processNotebookCreationStep(command);
      return;
    }

    // Check if this is a notebook creation command
    const notebookCommand = this.checkForNotebookCreationCommand(command);
    if (notebookCommand) {
      // Start notebook creation conversation
      this.startNotebookCreation(notebookCommand);
      return;
    }

    // Handle other commands or provide help
    if (command.toLowerCase().includes('help')) {
      this.showHelpMessage();
    } else {
      this.addChatMessage('assistant', `I understand you want to: "${command}". You can try commands like "create new notebook", "update project description", or "help" for more options.`);
    }
  }

  checkForNotebookCreationCommand(command) {
    for (const pattern of this.notebookCreationPatterns) {
      const match = command.match(pattern);
      if (match) {
        // Extract notebook type and name if provided in command
        const result = { matched: true };

        if (pattern.toString().includes('(\\w+)')) {
          // This pattern captures notebook type
          const possibleType = match[1]?.toLowerCase();
          const validTypes = ['general', 'research', 'blog', 'report', 'script', 'idea', 'summary', 'chat'];
          if (possibleType && validTypes.includes(possibleType)) {
            result.type = possibleType;
            result.name = match[2]; // Name might be in the second capture group
          } else {
            result.name = match[1]; // Name is in first capture group
          }
        } else {
          // Simple pattern that might just capture name
          result.name = match[1];
        }

        return result;
      }
    }
    return null;
  }

  startNotebookCreation(commandDetails) {
    // Generate a unique ID for this conversation
    this.chatState.conversationId = Date.now().toString();

    // Initialize notebook creation state
    this.chatState.isCreatingNotebook = true;
    this.chatState.notebookData = {};

    // If name was provided in command, store it
    if (commandDetails.name) {
      this.chatState.notebookData.name = commandDetails.name;
    }

    // If type was provided in command, store it
    if (commandDetails.type) {
      this.chatState.notebookData.type = commandDetails.type;
    }

    // Welcome message
    this.addChatMessage('assistant', 'I\'ll help you create a new notebook! Let\'s get started.');

    // Move to the first step or skip if we already have data from the command
    this.moveToNextCreationStep();
  }

  moveToNextCreationStep() {
    // Find the next step that needs to be completed
    const nextStep = this.notebookCreationSteps.find(step => {
      // Skip step if we already have data for it from the initial command
      if (this.chatState.notebookData[step.id] !== undefined) {
        return false;
      }
      return true;
    });

    if (!nextStep) {
      // All steps completed, create the notebook
      this.createNotebookFromChat();
      return;
    }

    this.chatState.currentStep = nextStep;

    // Handle prompts that are functions
    const prompt = typeof nextStep.prompt === 'function'
      ? nextStep.prompt(this.chatState.notebookData)
      : nextStep.prompt;

    this.addChatMessage('assistant', prompt);
  }

  async processNotebookCreationStep(input) {
    const currentStep = this.chatState.currentStep;
    if (!currentStep) {
      // Something went wrong, reset state
      this.resetChatState();
      this.addChatMessage('assistant', 'Sorry, something went wrong with the notebook creation process. Please try again.');
      return;
    }

    // Handle special case for "cancel"
    if (input.toLowerCase() === 'cancel') {
      this.cancelNotebookCreation();
      return;
    }

    // Handle empty optional steps
    if (currentStep.optional && (input.toLowerCase() === 'no' || input.toLowerCase() === 'skip')) {
      // For optional steps, "no" or "skip" means continue
      if (currentStep.process) {
        this.chatState.notebookData[currentStep.id] = currentStep.process(input);
      } else {
        this.chatState.notebookData[currentStep.id] = null;
      }
      this.moveToNextCreationStep();
      return;
    }

    // Handle confirmation step
    if (currentStep.id === 'confirm') {
      if (input.toLowerCase() === 'yes') {
        // User confirmed, create the notebook
        await this.createNotebookFromChat();
      } else {
        // User wants to start over
        this.addChatMessage('assistant', 'No problem, let\'s start over. What would you like to name your notebook?');
        this.chatState.notebookData = {};
        this.chatState.currentStep = this.notebookCreationSteps[0];
      }
      return;
    }

    // Validate the input if validation function exists
    if (currentStep.validate) {
      const validationResult = currentStep.validate(input);
      if (validationResult !== true) {
        this.addChatMessage('assistant', validationResult);
        return;
      }
    }

    // Process and store the input
    if (currentStep.process) {
      this.chatState.notebookData[currentStep.id] = currentStep.process(input);
    } else {
      this.chatState.notebookData[currentStep.id] = input.trim();
    }

    // Move to the next step
    this.moveToNextCreationStep();
  }

  async createNotebookFromChat() {
    // Start loading indicator
    this.addChatMessage('assistant', 'Creating your notebook...');

    try {
      // Format the data for API request
      const notebookData = {
        title: this.chatState.notebookData.name,
        type: this.chatState.notebookData.type || 'general',
        project_id: this.projectId,
        content: this.chatState.notebookData.content || null,
        agents: this.chatState.notebookData.agents || []
      };

      // Use DynamicData client to create notebook
      const notebook = await this.dynamicClient.createItem('notebooks', notebookData);

      // Success message with clickable link
      this.addChatMessage('assistant', `
        <div class="success-message">
          <p>✅ Notebook "${notebook.data.title}" created successfully!</p>
          <a href="/projects/${this.projectId}/notebooks/${notebook.item_id}" class="notebook-link">
            <i class="fas fa-external-link-alt"></i> Open Notebook
          </a>
        </div>
      `, true);

      // Reset chat state
      this.resetChatState();

      // Refresh notebooks list by triggering the notebook-list component to reload
      if (this.notebookListComponent) {
          this.notebookListComponent.loadNotebooks();
      }
    } catch (error) {
      this.addChatMessage('assistant', `Error: ${error.message || 'Failed to create notebook'}. Let's try again. What would you like to name your notebook?`);
      // Reset state but keep isCreatingNotebook true to continue the flow
      this.chatState.notebookData = {};
      this.chatState.currentStep = this.notebookCreationSteps[0];
    }
  }

  cancelNotebookCreation() {
    this.addChatMessage('assistant', 'Notebook creation cancelled. How else can I help you?');
    this.resetChatState();
  }

  resetChatState() {
    this.chatState = {
      isCreatingNotebook: false,
      currentStep: null,
      notebookData: {},
      conversationId: null
    };
  }

  showHelpMessage() {
    this.addChatMessage('assistant', `
      <div class="help-message">
        <p><strong>Here are some commands you can try:</strong></p>
        <ul>
          <li><code>create new notebook</code> - Start a guided notebook creation process</li>
          <li><code>new notebook named "My Research"</code> - Create a notebook with a specific name</li>
          <li><code>create research notebook called "Literature Review"</code> - Create a notebook with a specific type</li>
          <li><code>update project description</code> - Update the project description</li>
          <li><code>add team member @username</code> - Add a team member to the project</li>
          <li><code>set status to On Hold</code> - Change project status</li>
        </ul>
      </div>
    `, true);
  }

  addChatMessage(role, content, isHTML = false) {
    // Assumes a chat messages container exists in the template
    const messagesContainer = this.shadowRoot.getElementById('chat-messages');
    if (!messagesContainer) {
        console.warn("[ProjectDashboard] Chat messages container not found.");
        return;
    }

    const messageEl = document.createElement('div');
    messageEl.className = `${role}-message`; // Apply role-specific class

    if (isHTML) {
      messageEl.innerHTML = content;
    } else {
      messageEl.textContent = content;
    }

    messagesContainer.appendChild(messageEl);
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add data attributes for styling or tracking if needed
    if (this.chatState.conversationId) {
      messageEl.dataset.conversation = this.chatState.conversationId;
    }

    return messageEl;
  }

  // --- Loading and Error States ---

  renderLoading() {
    // Add loading state to specific elements rather than replacing entire content
    if (this.projectNameEl) {
      this.projectNameEl.textContent = 'Loading project...';
      this.projectNameEl.classList.add('loading');
    }
    if (this.projectDescEl) {
      this.projectDescEl.style.display = 'none'; // Hide until loaded
    }
  }

  clearLoading() {
    // Simply remove the loading class/message if present
    const loadingEl = this.shadowRoot.querySelector('.loading');
    if (loadingEl) {
      loadingEl.remove();
    }
    // Don't re-render the entire shadow DOM - we want to keep our rendered project data
  }

  renderError(message) {
    // Display an error message prominently
    const dashboardEl = this.shadowRoot.getElementById('project-dashboard');
     if (dashboardEl) {
        dashboardEl.innerHTML = `
          <div class="error">
            <p>Error loading project: ${message}</p>
            <button id="retry-load-btn" class="btn btn-secondary">Retry</button>
            <button id="back-to-projects-btn" class="btn btn-secondary">Back to Projects</button>
          </div>
        `;
        this.shadowRoot.getElementById('retry-load-btn')?.addEventListener('click', () => this.loadProjectData());
        this.shadowRoot.getElementById('back-to-projects-btn')?.addEventListener('click', () => this.appBridge._router.navigateTo('/projects'));
     }
  }

  /**
   * Add the "Add Agent" button to the project dashboard header
   */
  addAgentButton() {
    // Find the dashboard actions container or create one if it doesn't exist
    let actionsContainer = this.shadowRoot.querySelector('.dashboard-actions');
    if (!actionsContainer) {
      const dashboardHeader = this.shadowRoot.querySelector('.dashboard-header') || this.shadowRoot.querySelector('header');
      
      if (!dashboardHeader) {
        console.warn('Could not find dashboard header to add agent button');
        return;
      }
      
      actionsContainer = document.createElement('div');
      actionsContainer.className = 'dashboard-actions';
      dashboardHeader.appendChild(actionsContainer);
    }
    
    // Create the Add Agent button
    const addAgentBtn = document.createElement('button');
    addAgentBtn.id = 'add-agent-btn';
    addAgentBtn.className = 'btn btn-primary';
    addAgentBtn.innerHTML = '<i class="fas fa-robot"></i> Add Agent';
    
    // Add click handler
    addAgentBtn.addEventListener('click', () => this.openNewAgentOverlay());
    
    // Add to the container
    actionsContainer.appendChild(addAgentBtn);
  }

  /**
   * Open the new agent overlay for this project
   */
  openNewAgentOverlay() {
    if (!this.projectId) {
      this.notifications.warning('No project selected');
      return;
    }
    
    // Navigate to the new agent route with this project's ID
    this.appBridge._router.navigateTo(`/projects/${this.projectId}/agents/new`, { 
      forceOverlay: true
    });
  }

  /**
   * Display agents section in the dashboard
   */
  renderAgentsSection() {
    // ...existing code for rendering agents list...
    
    // Add a "Manage Agents" link if needed
    const manageAgentsLink = document.createElement('a');
    manageAgentsLink.href = '#';
    manageAgentsLink.className = 'manage-agents-link';
    manageAgentsLink.textContent = 'Manage All Agents';
    manageAgentsLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.openNewAgentOverlay();
    });
    
    // Add the link to the agents section
    const agentsSection = this.shadowRoot.querySelector('.project-agents-section');
    if (agentsSection) {
      agentsSection.appendChild(manageAgentsLink);
    }
  }

  /**
   * Initialize and load tabs based on available plugins
   */
  async initializePluginTabs() {
    // First, check if we have access to the plugin manager
    const pluginManager = this.centralPluginManager || 
                          window.narratrPluginManager || 
                          window.app?.pluginManager;
                          
    if (!pluginManager) {
      console.warn('[ProjectDashboard] No plugin manager available, skipping tab initialization');
      return;
    }
    
    try {
      // Get all main-content components that should be rendered as tabs
      const mainContentComponents = pluginManager.getComponentsByType('main-content');
      console.log(`[ProjectDashboard] Found ${mainContentComponents.length} main-content components`);
      
      // If no components found, show default view
      if (!mainContentComponents || mainContentComponents.length === 0) {
        this.defaultView.style.display = 'grid';
        return;
      }
      
      // Hide default view
      this.defaultView.style.display = 'none';
      
      // Clear any existing tabs
      if (this.dashboardTabsEl) {
        this.dashboardTabsEl.innerHTML = '';
      }
      
      // Create tabs for each main-content component
      mainContentComponents.forEach((component, index) => {
        this.createTabForComponent(component, index === 0);
      });
      
    } catch (error) {
      console.error('[ProjectDashboard] Error initializing plugin tabs:', error);
      // Fall back to default view on error
      this.defaultView.style.display = 'grid';
    }
  }

  /**
   * Create a tab for a specific component
   * @param {Object} component - The component configuration
   * @param {boolean} isActive - Whether this tab should be active by default
   */
  createTabForComponent(component, isActive = false) {
    if (!this.dashboardTabsEl || !this.tabContentContainer) {
      console.warn('[ProjectDashboard] Tab containers not found, skipping tab creation');
      return;
    }
    
    const tabId = `tab-${component.id || component.type}`;
    const contentId = `content-${component.id || component.type}`;
    
    // Create tab button
    const tabButton = document.createElement('button');
    tabButton.className = `tab-button ${isActive ? 'active' : ''}`;
    tabButton.setAttribute('data-tab', contentId);
    tabButton.innerHTML = `
      ${component.icon ? `<i class="${component.icon}"></i> ` : ''}
      ${component.title || component.id || 'Tab'}
    `;
    
    // Create tab content container
    const contentContainer = document.createElement('div');
    contentContainer.className = `tab-content ${isActive ? 'active' : ''}`;
    contentContainer.id = contentId;
    
    // Add click handler to tab button
    tabButton.addEventListener('click', () => {
      this.activateTab(contentId);
    });
    
    // Add tab button to tabs container
    this.dashboardTabsEl.appendChild(tabButton);
    
    // Add content container to tab content container
    this.tabContentContainer.appendChild(contentContainer);
    
    // Render component in the content container
    this.renderTabComponent(component, contentContainer);
    
    // If this is the active tab, make sure it's visible
    if (isActive) {
      this.activateTab(contentId);
    }
  }

  /**
   * Activate a specific tab
   * @param {string} tabId - ID of the tab to activate
   */
  activateTab(tabId) {
    // Get all tab buttons and content
    const tabButtons = this.shadowRoot.querySelectorAll('.tab-button');
    const tabContents = this.shadowRoot.querySelectorAll('.tab-content');
    
    // Deactivate all tabs
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    
    // Activate the selected tab
    const selectedButton = this.shadowRoot.querySelector(`.tab-button[data-tab="${tabId}"]`);
    const selectedContent = this.shadowRoot.getElementById(tabId);
    
    if (selectedButton) {
      selectedButton.classList.add('active');
    }
    
    if (selectedContent) {
      selectedContent.classList.add('active');
    }
  }

  /**
   * Render a component in a tab
   * @param {Object} component - Component configuration
   * @param {HTMLElement} container - Container element to render into
   */
  renderTabComponent(component, container) {
    try {
      // If component has a createComponent method, use it
      if (component.createComponent && typeof component.createComponent === 'function') {
        const componentInstance = component.createComponent();
        if (componentInstance) {
          // Set project ID if the component accepts it
          if (this.projectId) {
            componentInstance.setAttribute('projectId', this.projectId);
          }
          
          // Append to container
          container.appendChild(componentInstance);
        }
      } 
      // If component has a componentClass, instantiate it
      else if (component.componentClass) {
        const ComponentClass = component.componentClass;
        const componentInstance = new ComponentClass();
        
        // Set project ID if the component accepts it
        if (this.projectId) {
          componentInstance.setAttribute('projectId', this.projectId);
        }
        
        // Append to container
        container.appendChild(componentInstance);
      }
      // Otherwise, show an error
      else {
        container.innerHTML = `
          <div class="error-message">
            <p>Unable to render component: ${component.id || 'Unknown'}</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('[ProjectDashboard] Error rendering tab component:', error);
      container.innerHTML = `
        <div class="error-message">
          <p>Error rendering component: ${error.message}</p>
        </div>
      `;
    }
  }
}

customElements.define('project-dashboard', ProjectDashboard);
export default ProjectDashboard;
