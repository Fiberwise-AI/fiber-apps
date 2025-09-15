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
      this.selectedAgentId = response[0]?.agent_id || null;
      this.appAgents = response || [];
      return response.items || [];
    } catch (error) {
      console.error('Error loading agents:', error);
      //this.showNotification('Failed to load agents', 'error');
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
      // this.sessions.unshift(chatRecord);
      this.currentChatId = chatRecord.item_id;
      this.messages = [];
      
      // Update URL to reflect the new chat
      this.updateUrl(this.currentChatId);
      
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

      // Make a single activation call
      const activation = await FIBER.agents.activate(
        this.selectedAgentId,
        { prompt: prompt, chat_id: this.currentChatId },
        context,
        metadata
      );
      
      if (activation) {
        this.render();
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
    
    // Agent selection dropdown logic
    const agentSelect = this.shadowRoot.querySelector('#agent-select');
    if (agentSelect) {
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
    }

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
    console.log('asdfafdads[ActivationChat] Providers:', this.providers);
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
      // Enable/disable based on provider availability
      if (this.providers.length === 0) {
        chatInput.setAttribute('disabled', 'true');
      } else {
        chatInput.removeAttribute('disabled');
      }
      
      chatInput.addEventListener('message-sent', (e) => {
        this.sendMessage(e.detail.content);
      });
    }
    
    // Populate agent selection dropdown
    const agentSelect = this.shadowRoot.querySelector('#agent-select');
    const triggerAgentBtn = this.shadowRoot.querySelector('#trigger-agent-btn');
    
    if (agentSelect) {
      agentSelect.innerHTML = `
        <option value="">Select an agent</option>
        ${this.appAgents?.map(agent => `
          <option value="${agent.agent_id}" ${agent.agent_id === this.selectedAgentId ? 'selected' : ''}>
            ${agent.name || agent.agent_id}
          </option>
        `).join('') || ''}
      `;
      
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
    
    // Setup provider button handler
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
    
    this.setupEventListeners();
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
