/**
 * Activation Chat App Component
 * 
 * Main component that implements a chat interface using agent activations
 * as the message store.
 */
import htmlTemplate from './chat-app.html?raw';
import cssStyles from './chat-app.css?inline';
import { FIBER } from './index.js';
import './chat-messages.js';
import './chat-list.js';
import './chat-input.js';

// import './SystemPromptEditor.js';
// import './NotificationSystem.js';

export class ActivationChatApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // App state
    this.isLoading = true;
    this.currentChatId = null;
    this.selectedAgentId = null;
    this.isStreaming = false;
    
    // Add LLM provider state
    this.providers = [];
    this.selectedProviderId = null;
    
    // Add settings state
    this.isSettingsPanelOpen = false;
    this.modelSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: 'You are a helpful AI assistant.',
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    };
  }

  connectedCallback() {
    if (!this.initialized) {
      console.log('[ActivationChat] Initializing component');
      this.initialized = true;
      
      // Handle browser history navigation
      window.addEventListener('popstate', (event) => {
        if (event.state && event.state.chatId) {
          this.loadSessionMessages(event.state.chatId);
        }
      });
      
      this.init();
    }
  }
  
  async init() {
    console.log('[ActivationChat] Running init(asdfas)');
    
    try {
      await FIBER.realtime.connect()
      // Set up WebSocket event handler for activation updates
      FIBER.realtime.on('message', (message) => {
        if (message.type === 'activation_completed') {
          this.handleActivationCompleted(message);
        }
      });
      
      await this.loadProviders();

      await this.loadAgents();

      // Check if we have a session ID in the URL
      const urlSessionId = this.getSessionIdFromUrl();

      if (urlSessionId) {
        this.currentChatId = urlSessionId;
        await this.loadSessionMessages(urlSessionId);
      } else {
        this.currentChatId = null;
        this.messages = [];
      }

      this.isLoading = false;
      this.render();
      this.setupEventListeners();

      // Update the agent selection after everything is rendered
      this.updateAgentSelection();

      this.scrollToBottom();
    } catch (error) {
      console.error('Error initializing chat app:', error);
      this.isLoading = false;
      this.render();
    }
  }

  // Parse URL parameters to get session ID
  getSessionIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('chatId');
  }

  updateUrl(sessionId) {
    if (!sessionId) return;
    
    // Only update URL if we're on a page that supports chat parameters
    // Avoid updating URL if we're on other app pages to prevent navigation issues
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/app/') && !currentPath.includes('/chat')) {
      console.log('[ActivationChat] Skipping URL update - not on chat page');
      return;
    }
    
    const url = new URL(window.location.href);
    url.searchParams.set('chatId', sessionId);
    history.pushState({ chatId: sessionId }, '', url);
  }

  async loadProviders() {
    try {
      console.log('[ActivationChat] Loading providers', FIBER.apps);
      const response = await FIBER.apps.listModelProviders();
      this.providers = Array.isArray(response) ? response : (response.items || []);
      console.log('[ActivationChat] Providers loaded:', this.providers);
      this.selectedProviderId = this.providers[0]?.provider_id || null;
      console.log('[ActivationChat] Selected provider ID:', this.selectedProviderId);
      return this.providers;
    } catch (error) {
      console.error('Error loading providers:', error);
      //this.showNotification('Failed to load providers', 'error');
      return [];
    }
  }
  async loadAgents() {
    try {
      console.log('[ActivationChat] Loading agents');
      const response = await FIBER.agents.list();
      console.log('[ActivationChat] Raw agents response:', response);
      console.log('[ActivationChat] Response type:', typeof response);
      console.log('[ActivationChat] Response keys:', response ? Object.keys(response) : 'null');

      // Extract agents array from response - could be direct array or nested in data/items
      let agents = [];
      if (Array.isArray(response)) {
        agents = response;
      } else if (response && response.items) {
        agents = response.items;
      } else if (response && response.data) {
        agents = response.data;
      }

      console.log('[ActivationChat] Processed agents:', agents);
      console.log('[ActivationChat] Agents length:', agents.length);

      if (agents.length > 0) {
        console.log('[ActivationChat] First agent structure:', agents[0]);
        console.log('[ActivationChat] First agent keys:', Object.keys(agents[0]));
        console.log('[ActivationChat] First agent id:', agents[0].id);
      }

      this.appAgents = agents || [];
      this.selectedAgentId = agents.length > 0 ? agents[0]?.id || null : null;

      console.log('[ActivationChat] Final selectedAgentId:', this.selectedAgentId);
      console.log('[ActivationChat] Available agents:', this.appAgents.map(a => ({ id: a.id, name: a.name })));

      return agents;
    } catch (error) {
      console.error('Error loading agents:', error);
      this.appAgents = [];
      this.selectedAgentId = null;
      return [];
    }
  }
  async loadSessions() {
    try {
      console.log('[ActivationChat] Loading chat sessions');
      
      // Get all sessions from the database directly using the Chat model
      const response = await FIBER.data.listItems('chats', {
        limit: 100,
        sort: [{ field: 'created_at', direction: 'desc' }]
      });
      
      this.sessions = response.items || [];
      return this.sessions;
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      this.showNotification('Failed to load chat sessions', 'error');
      return [];
    }
  }
  
  async loadSessionMessages(chatId) {
    this.currentChatId = chatId;
    this.updateUrl(chatId);
    this.render();
    this.scrollToBottom();
  }
  
  async createNewSession(title) {
    try {
      // First create the chat record in the data model
      const chatRecord = await FIBER.data.createItem('chats', { title: title });
      
      // Add to sessions list and select it
      if (!this.sessions) this.sessions = [];
      this.sessions.unshift(chatRecord);
      this.currentChatId = chatRecord.item_id;
      this.messages = [];
      
      // Update URL to reflect the new chat
      this.updateUrl(this.currentChatId);
      
      // Update the UI to show the new session
      this.render();
      
      // Refresh the sidebar to show the new session
      const sessionList = this.shadowRoot.querySelector('chat-list');
      if (sessionList) {
        await sessionList.refreshSessions();
        sessionList.setCurrentChatId(this.currentChatId);
      }

      // Update chat messages component to show the new session
      const chatMessages = this.shadowRoot.querySelector('chat-messages');
      if (chatMessages) {
        chatMessages.setAttribute('chat-id', this.currentChatId);
      }
      
      this.isCreatingSession = false;     
      return chatRecord;
    } catch (error) {
      console.error('Error creating new session:', error);
      this.showNotification('Failed to create new chat session', 'error');
      throw error;
    }
  }


  async sendMessage(content) {
    console.log('[ActivationChat] Sending message:', content);
    
    try {
      // Check if we have providers available
      if (!this.providers || this.providers.length === 0) {
        console.error('[ActivationChat] No LLM providers available');
        this.showNotification('No LLM providers available. Please add a provider before sending messages.', 'error');
        return;
      }

      // Check if we have a selected provider
      if (!this.selectedProviderId) {
        console.error('[ActivationChat] No provider selected');
        this.showNotification('No provider selected. Please select an LLM provider.', 'error');
        return;
      }
      
      // Check if we have a selected agent
      if (!this.selectedAgentId) {
        console.error('[ActivationChat] No agent selected');
        // Try to reload agents and select the first one
        await this.loadAgents();
        if (!this.selectedAgentId) {
          console.error('[ActivationChat] Still no agent available after reload');
          throw new Error('No agent available. Please ensure agents are properly configured.');
        }
      }

      if (!this.currentChatId) {
        // Create a new session with a default title if content is empty
        const title = content.trim() ? content.substring(0, 15) : 'Agent Activation';
        await this.createNewSession(title);
      }

      const metadata = {};
      if (this.selectedProviderId) {
        const provider = this.providers.find(p => p.provider_id === this.selectedProviderId);
        console.log('[ActivationChat] Found provider for metadata:', provider);
        if (provider) {
          metadata.provider_id = provider.provider_id;
          metadata.model_id = provider.default_model;
          
          // Add all model settings to metadata
          metadata.temperature = this.modelSettings.temperature;
          metadata.max_tokens = this.modelSettings.maxTokens;
          metadata.top_p = this.modelSettings.topP;
          metadata.frequency_penalty = this.modelSettings.frequencyPenalty;
          metadata.presence_penalty = this.modelSettings.presencePenalty;
        }
      }

      // Use a default prompt if content is empty
      const prompt = content.trim();

      // Build context with provider_id
      const context = { 
        chat_id: this.currentChatId,
        system_prompt: this.modelSettings.systemPrompt
      };
      
      // Add provider_id to context as well
      if (this.selectedProviderId) {
        context.provider_id = this.selectedProviderId;
      }

      console.log(`[ActivationChat] About to activate agent`);
      console.log(`[ActivationChat] - selectedAgentId: "${this.selectedAgentId}"`);
      console.log(`[ActivationChat] - selectedAgentId type: ${typeof this.selectedAgentId}`);
      console.log(`[ActivationChat] - selectedAgentId === null: ${this.selectedAgentId === null}`);
      console.log(`[ActivationChat] - selectedAgentId === undefined: ${this.selectedAgentId === undefined}`);
      console.log(`[ActivationChat] - appAgents length: ${this.appAgents?.length || 0}`);
      console.log(`[ActivationChat] - prompt: "${prompt}"`);

      // Make a single activation call
      const activation = await FIBER.agents.activate(
        this.selectedAgentId,
        { prompt: prompt, chat_id: this.currentChatId },
        context,
        metadata
      );
      
      if (activation) {
        // Add the message immediately to show pending state
        const chatMessages = this.shadowRoot.querySelector('chat-messages');
        if (chatMessages) {
          // Use setTimeout to ensure the DOM is stable after any URL changes
          setTimeout(() => {
            chatMessages.addPendingMessage(activation.id, prompt, this.selectedAgentId);
          }, 0);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Only render on error to show error state
      this.render();
    }
  }

  setupEventListeners() {
    // New chat button logic
    const newChatBtn = this.shadowRoot.querySelector('#new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        // Clear the active chat and messages
        this.currentChatId = null;
        this.messages = [];
        
        // Reset URL by removing chatId parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('chatId');
        history.pushState({}, '', url);
        
        // Render the empty state
        this.render();
      });
    }
    
    // Settings button logic
    const settingsBtn = this.shadowRoot.querySelector('#settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.toggleSettingsPanel(true);
      });
    }
    
    // Close settings button
    const closeSettingsBtn = this.shadowRoot.querySelector('#close-settings');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.toggleSettingsPanel(false);
      });
    }
    
    // Settings overlay (for clicking outside to close)
    const settingsOverlay = this.shadowRoot.querySelector('#settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', () => {
        this.toggleSettingsPanel(false);
      });
    }
    
    // Setup provider selection in settings
    const providerSelect = this.shadowRoot.querySelector('#provider-select');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.selectedProviderId = e.target.value;
        
        // Update chat-messages component
        const chatMessages = this.shadowRoot.querySelector('chat-messages');
        if (chatMessages) {
          chatMessages.setSelectedProvider(this.selectedProviderId);
        }
      });
    }
    
    // Setup system prompt text area
    const systemPromptInput = this.shadowRoot.querySelector('#system-prompt');
    if (systemPromptInput) {
      systemPromptInput.addEventListener('change', (e) => {
        this.modelSettings.systemPrompt = e.target.value;
      });
    }
    
    // Setup sliders and inputs for model settings
    const sliders = this.shadowRoot.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      const valueDisplay = slider.nextElementSibling;
      
      // Update display on input
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
      });
      
      // Update settings on change
      slider.addEventListener('change', () => {
        if (slider.id === 'temperature') {
          this.modelSettings.temperature = parseFloat(slider.value);
        } else if (slider.id === 'max-tokens') {
          this.modelSettings.maxTokens = parseInt(slider.value);
        } else if (slider.id === 'top-p') {
          this.modelSettings.topP = parseFloat(slider.value);
        } else if (slider.id === 'frequency-penalty') {
          this.modelSettings.frequencyPenalty = parseFloat(slider.value);
        } else if (slider.id === 'presence-penalty') {
          this.modelSettings.presencePenalty = parseFloat(slider.value);
        }
      });
    });
    
    // Reset button
    const resetButton = this.shadowRoot.querySelector('#reset-settings');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetSettings();
        this.render();
      });
    }
    
    // Save button (just close panel as settings are saved automatically)
    const saveButton = this.shadowRoot.querySelector('#save-settings');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.toggleSettingsPanel(false);
      });
    }
    
    // Agent selection dropdown logic - this will be set up once and reused
    this.setupAgentSelectionHandler();

    // Trigger agent button logic  
    const triggerAgentBtn = this.shadowRoot.querySelector('#trigger-agent-btn');
    if (triggerAgentBtn) {
      triggerAgentBtn.addEventListener('click', () => {
        this.triggerSelectedAgent();
      });
    }
  }
  
  resetSettings() {
    this.modelSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: 'You are a helpful AI assistant.',
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    };
  }
  
  toggleSettingsPanel(isOpen) {
    this.isSettingsPanelOpen = isOpen === undefined ? !this.isSettingsPanelOpen : isOpen;
    
    const panel = this.shadowRoot.querySelector('#settings-panel');
    const overlay = this.shadowRoot.querySelector('#settings-overlay');
    
    if (panel && overlay) {
      if (this.isSettingsPanelOpen) {
        panel.classList.add('open');
        overlay.classList.add('open');
      } else {
        panel.classList.remove('open');
        overlay.classList.remove('open');
      }
    }
  }
  
  renderProviderSelector() {
    if (this.providers.length === 0) return '<p>No providers available</p>';
    
    // When there's only one provider, just show its name
    if (this.providers.length === 1) {
      const provider = this.providers[0];
      return `
        <div class="provider-info">
          <span class="provider-name">${provider.name || provider.provider_id}</span>
          ${provider.default_model ? `<span class="model-name">(${provider.default_model})</span>` : ''}
        </div>
      `;
    }
    
    // For multiple providers, show dropdown selector
    return `
      <select id="provider-select" class="provider-select">
        ${this.providers.map(provider => `
          <option value="${provider.provider_id}" 
            ${provider.provider_id === this.selectedProviderId ? 'selected' : ''}>
            ${provider.name || provider.provider_id} ${provider.default_model ? `(${provider.default_model})` : ''}
          </option>
        `).join('')}
      </select>
    `;
  }
  
  renderSettingsPanel() {
    return `
      <div id="settings-panel" class="settings-panel ${this.isSettingsPanelOpen ? 'open' : ''}">
        <div class="settings-header">
          <h3>Chat Settings</h3>
          <button id="close-settings" class="close-settings">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h4>LLM Provider</h4>
            ${this.renderProviderSelector()}
          </div>
          
          <div class="settings-section">
            <h4>System Prompt</h4>
            <div class="setting-item">
              <label for="system-prompt">Instructions for the AI model:</label>
              <textarea id="system-prompt">${this.modelSettings.systemPrompt}</textarea>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>Generation Settings</h4>
            <div class="setting-item">
              <label for="temperature">Temperature: (higher = more creative, lower = more deterministic)</label>
              <input type="range" id="temperature" min="0" max="1" step="0.1" value="${this.modelSettings.temperature}">
              <span class="value-display">${this.modelSettings.temperature}</span>
            </div>
            
            <div class="setting-item">
              <label for="max-tokens">Max Tokens: (maximum response length)</label>
              <input type="range" id="max-tokens" min="256" max="4096" step="256" value="${this.modelSettings.maxTokens}">
              <span class="value-display">${this.modelSettings.maxTokens}</span>
            </div>
            
            <div class="setting-item">
              <label for="top-p">Top P: (nucleus sampling)</label>
              <input type="range" id="top-p" min="0.1" max="1" step="0.1" value="${this.modelSettings.topP}">
              <span class="value-display">${this.modelSettings.topP}</span>
            </div>
            
            <div class="setting-item">
              <label for="frequency-penalty">Frequency Penalty: (reduces repetition)</label>
              <input type="range" id="frequency-penalty" min="0" max="2" step="0.1" value="${this.modelSettings.frequencyPenalty}">
              <span class="value-display">${this.modelSettings.frequencyPenalty}</span>
            </div>
            
            <div class="setting-item">
              <label for="presence-penalty">Presence Penalty: (encourages new topics)</label>
              <input type="range" id="presence-penalty" min="0" max="2" step="0.1" value="${this.modelSettings.presencePenalty}">
              <span class="value-display">${this.modelSettings.presencePenalty}</span>
            </div>
          </div>
          
          <div class="setting-buttons">
            <button id="reset-settings" class="reset-button">Reset Defaults</button>
            <button id="save-settings" class="save-button">Save Settings</button>
          </div>
        </div>
      </div>
      <div id="settings-overlay" class="settings-overlay ${this.isSettingsPanelOpen ? 'open' : ''}"></div>
    `;
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatMessages = this.shadowRoot.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 0);
  }

  render() {
    console.log('[ActivationChat] Rendering component');
    // Inject HTML template and CSS
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
      ${this.renderSettingsPanel()}
    `;
    
    // Check if there are no providers and show empty state
    console.log('[ActivationChat] Providers:', this.providers);
    if (this.providers.length === 0) {
      const chatMessages = this.shadowRoot.querySelector('chat-messages');
      console.log('[ActivationChat] No providers found, showing empty state', chatMessages);
      if (chatMessages) {
        chatMessages.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-plug empty-icon"></i>
            <h3>No LLM Providers Available</h3>
            <p>You need to add an LLM provider before you can send messages</p>
            <button class="primary-button" id="setup-provider-btn">
              <i class="fas fa-cog"></i> Set Up LLM Provider
            </button>
          </div>
        `;
      }
      
      // Disable the chat input
      const chatInput = this.shadowRoot.querySelector('chat-input');
      if (chatInput) {
        chatInput.setAttribute('disabled', 'true');
      }
    }
    
    // Setup session list component - Fix the element name from chat-session-list to chat-list
    const sessionList = this.shadowRoot.querySelector('chat-list');
    if (sessionList) {
      // Don't use attributes for data, use the setter method instead
      if (this.currentChatId) {
        sessionList.setCurrentChatId(this.currentChatId);
      }
      
      sessionList.addEventListener('chat-selected', (e) => {
        console.log('Chat selected:', e.detail);
        this.loadSessionMessages(e.detail.chatId);
        this.updateUrl(e.detail.chatId);
      });

    }

    // Setup chat messages component
    const chatMessages = this.shadowRoot.querySelector('chat-messages');
    if (chatMessages) {
      chatMessages.setAttribute('chat-id', this.currentChatId || '');
      
      // Pass providers data to the chat-messages component
      chatMessages.setProviders(this.providers);
      if (this.selectedProviderId) {
        chatMessages.setSelectedProvider(this.selectedProviderId);
      }
      
      // Pass agents data to the chat-messages component
      if (this.appAgents) {
        chatMessages.setAgents(this.appAgents);
      }
      
      chatMessages.addEventListener('retry-message', (e) => {
        this.retryMessage(e.detail.messageId);
      });
      
      chatMessages.addEventListener('messages-loaded', (e) => {
        this.messages = e.detail.messages;
      });
      
      // Listen for provider selection events
      chatMessages.addEventListener('provider-selected', (e) => {
        this.selectedProviderId = e.detail.providerId;
        console.log('Provider selected:', this.selectedProviderId);
      });
    }

    // Setup chat input component
    const chatInput = this.shadowRoot.querySelector('chat-input');
    if (chatInput) {
      // Hide/show based on provider availability
      if (this.providers.length === 0) {
        chatInput.style.display = 'none';
        chatInput.setAttribute('disabled', 'true');
      } else {
        chatInput.style.display = 'block';
        chatInput.removeAttribute('disabled');
      }
      
      chatInput.addEventListener('message-sent', (e) => {
        this.sendMessage(e.detail.content);
      });
      
      chatInput.addEventListener('reset-to-first-agent', (e) => {
        // Reset to first agent
        if (this.appAgents && this.appAgents.length > 0) {
          this.selectedAgentId = this.appAgents[0].id;

          // Update the dropdown UI
          const agentSelect = this.shadowRoot.querySelector('#agent-select');
          if (agentSelect) {
            agentSelect.value = this.selectedAgentId;
          }

          // Update chat input with the first agent name
          const firstAgentName = this.appAgents[0].name;
          chatInput.updateSelectedAgent(firstAgentName);
        }
      });
    }

    // Hide/show header buttons based on provider availability
    const settingsBtn = this.shadowRoot.querySelector('#settings-btn');
    const newChatBtn = this.shadowRoot.querySelector('#new-chat-btn');
    
    if (this.providers.length === 0) {
      if (settingsBtn) settingsBtn.style.display = 'none';
      if (newChatBtn) newChatBtn.style.display = 'none';
    } else {
      if (settingsBtn) settingsBtn.style.display = 'block';
      if (newChatBtn) newChatBtn.style.display = 'block';
    }
    
    // Populate agent selection dropdown
    const agentSelect = this.shadowRoot.querySelector('#agent-select');
    const triggerAgentBtn = this.shadowRoot.querySelector('#trigger-agent-btn');
    const agentSelectionContainer = this.shadowRoot.querySelector('.agent-selection');

    if (agentSelect) {
      agentSelect.innerHTML = `
        <option value="">Select an agent</option>
        ${this.appAgents?.map(agent => `
          <option value="${agent.id}" ${agent.id === this.selectedAgentId ? 'selected' : ''}>
            ${agent.name}
          </option>
        `).join('') || ''}
      `;

      // Explicitly set the selected value to ensure it's properly selected
      if (this.selectedAgentId) {
        agentSelect.value = this.selectedAgentId;
      }
      
      // Hide/show agent selection based on provider availability
      if (this.providers.length === 0) {
        if (agentSelectionContainer) {
          agentSelectionContainer.style.display = 'none';
        } else {
          agentSelect.style.display = 'none';
          if (triggerAgentBtn) triggerAgentBtn.style.display = 'none';
        }
      } else {
        if (agentSelectionContainer) {
          agentSelectionContainer.style.display = 'block';
        } else {
          agentSelect.style.display = 'block';
          if (triggerAgentBtn) triggerAgentBtn.style.display = 'block';
        }
        
        // Disable agent select if no agents available
        if (!this.appAgents || this.appAgents.length === 0) {
          agentSelect.disabled = true;
          if (triggerAgentBtn) {
            triggerAgentBtn.disabled = true;
          }
        } else {
          agentSelect.disabled = false;
          // Enable/disable trigger button based on agent selection
          if (triggerAgentBtn) {
            triggerAgentBtn.disabled = !this.selectedAgentId;
          }
        }
      }
    }
    
    // Only set up event listeners once during render, not in setupEventListeners
    this.setupRenderSpecificHandlers();
  }

  setupAgentSelectionHandler() {
    // Set up agent selection handler that will persist across renders
    const agentSelect = this.shadowRoot.querySelector('#agent-select');
    if (agentSelect && !agentSelect.hasAttribute('data-handler-set')) {
      agentSelect.addEventListener('change', (e) => {
        this.selectedAgentId = e.target.value;
        console.log('Agent selected:', this.selectedAgentId);
        
        // Get the selected agent name
        const selectedOption = e.target.options[e.target.selectedIndex];
        const agentName = selectedOption ? selectedOption.text : '';
        
        // Update chat input with selected agent info
        const chatInput = this.shadowRoot.querySelector('chat-input');
        if (chatInput) {
          chatInput.updateSelectedAgent(agentName);
        }
        
        // Enable/disable trigger button based on selection
        const triggerAgentBtn = this.shadowRoot.querySelector('#trigger-agent-btn');
        if (triggerAgentBtn) {
          triggerAgentBtn.disabled = !this.selectedAgentId;
        }
      });
      
      // Mark that handler has been set to prevent duplicates
      agentSelect.setAttribute('data-handler-set', 'true');
    }
  }

  updateAgentSelection() {
    const agentSelect = this.shadowRoot.querySelector('#agent-select');
    if (agentSelect && this.selectedAgentId) {
      agentSelect.value = this.selectedAgentId;

      // Also update the chat input with the selected agent name
      const chatInput = this.shadowRoot.querySelector('chat-input');
      if (chatInput && this.appAgents) {
        const selectedAgent = this.appAgents.find(agent => agent.id === this.selectedAgentId);
        if (selectedAgent) {
          const agentName = selectedAgent.name;
          chatInput.updateSelectedAgent(agentName);
        }
      }
    }
  }

  setupRenderSpecificHandlers() {
    // Set up agent selection handler 
    this.setupAgentSelectionHandler();
    
    // Handle provider button
    const setupProviderBtn = this.shadowRoot.querySelector('#setup-provider-btn');
    if (setupProviderBtn) {
      setupProviderBtn.addEventListener('click', () => {
        try {
          // Navigate to global settings using absolute flag
          FIBER.router.navigateTo('/settings/llm-providers', { absolute: true });
        } catch (error) {
          console.warn('[ActivationChatMultiAgent] Navigation failed:', error);
        }
      });
    }
  }

  // Add handler for activation_completed WebSocket events
  async handleActivationCompleted(message) {
    console.log('[ActivationChat] Received activation update:', message);
    
    // Check if this update is for our current chat
    if (this.currentChatId && message.context && message.context.chat_id === this.currentChatId) {
      const chatMessages = this.shadowRoot.querySelector('chat-messages');
      if (chatMessages) {
        // Tell the chat-messages component to update this activation
        chatMessages.updateActivation(message.activation_id, message.status);
        chatMessages.scrollToBottom();

      }
    }
  }
  
  // Add a method to check if we can send messages
  canSendMessages() {
    return this.providers.length > 0 && this.selectedProviderId !== null;
  }
}

customElements.define('chat-app-multi', ActivationChatApp);
