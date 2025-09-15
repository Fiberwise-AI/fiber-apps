import { FIBER } from './index.js';
import htmlTemplate from './chat-messages.html?raw';
import cssStyles from './chat-messages.css?inline';

export class ChatMessages extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.messages = [];
    this.chatId = null;
    this.loading = false;
    this.error = null;
    this.providers = [];
    this.selectedProviderId = null;
    this.agents = []; // Add agents array
  }

  clearChat() {
    this.chatId = null;
    this.messages = [];
    this.error = null;
    this.loading = false;
    this.render();
  }

  createNewChat() {
    this.clearChat();
  }

  getChatInputValue() {
    const chatInput = document.querySelector('chat-input');
    return chatInput?.value || '';
  }
  
  scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = this.shadowRoot.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 0);
  }

  static get observedAttributes() {
    return ['chat-id', 'providers-data', 'selected-provider-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'chat-id') {
      if (newValue !== oldValue) {
        this.chatId = newValue;
        this.messages = []; // Clear previous messages
        this.render(); // Show empty state immediately
        if (newValue) {
          this.loadMessages();
        }
      }
    } else if (name === 'providers-data') {
      try {
        if (newValue) {
          this.providers = JSON.parse(newValue);
          this.render();
        }
      } catch (e) {
        console.error('Error parsing providers data:', e);
      }
    } else if (name === 'selected-provider-id') {
      this.selectedProviderId = newValue;
      this.render();
    }
  }

  setProviders(providers) {
    this.providers = providers;
    this.setAttribute('providers-data', JSON.stringify(providers));
  }

  setSelectedProvider(providerId) {
    this.selectedProviderId = providerId;
    this.setAttribute('selected-provider-id', providerId);
  }

  setAgents(agents) {
    this.agents = agents;
    this.render(); // Re-render to update agent names in messages
  }

  getAgentName(agentId) {
    if (!agentId) return 'Unknown Agent';
    const agent = this.agents.find(a => a.agent_id === agentId);
    return agent ? (agent.name || agent.agent_id) : agentId;
  }

  getAgentIcon(agentId) {
    // You can customize this based on agent type or name
    if (!agentId) return 'fas fa-robot';
    const agent = this.agents.find(a => a.agent_id === agentId);
    const agentName = (agent?.name || agent?.agent_id || '').toLowerCase();
    
    if (agentName.includes('summarizer') || agentName.includes('summary')) {
      return 'fas fa-file-alt';
    } else if (agentName.includes('chat') || agentName.includes('conversation')) {
      return 'fas fa-comments';
    } else if (agentName.includes('analyze') || agentName.includes('analysis')) {
      return 'fas fa-chart-bar';
    } else {
      return 'fas fa-robot';
    }
  }

  async loadMessages() {
    console.log('Loading messages for chat ID:', this.chatId);
    if (!this.chatId) {
      this.messages = [];
      this.render();
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      this.render();
      
      const response = await FIBER.agents.getActivations({
        context: { chat_id: this.chatId },
        limit: 100,
        sort_by: 'started_at',
        sort_dir: 'ASC'
      });

      this.messages = response.map(activation => ({
        id: activation.id,
        chat_id: activation.context?.chat_id,
        agent_id: activation.agent_id, // Add agent_id to messages
        input_data: activation.input_data || { prompt: activation.input_summary },
        output_data: activation.output_data || { text: activation.output_summary },
        status: activation.status,
        started_at: activation.started_at,
        context: activation.context || {}
      }));
      
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Error loading messages:', error);
      this.error = error;
      this.loading = false;
      this.render();
    }
  }

  // Add method to update an activation when a WebSocket event is received
  async updateActivation(activationId, status) {
    console.log(`Updating activation ${activationId} with status ${status}`);
    
    // Find the message that needs updating
    const messageIndex = this.messages.findIndex(msg => msg.id === activationId);
    if (messageIndex === -1) {
      console.log(`Activation ${activationId} not found in messages, reloading all messages`);
      return this.loadMessages(); // Reload all if we can't find it
    }
    
    try {
      // Fetch the updated activation details
      const updatedActivation = await FIBER.agents.getActivation(activationId);
      
      // Update our local message copy
      this.messages[messageIndex] = {
        id: updatedActivation.id,
        chat_id: updatedActivation.context?.chat_id,
        agent_id: updatedActivation.agent_id, // Add agent_id to updated messages
        input_data: updatedActivation.input_data || { prompt: updatedActivation.input_summary },
        output_data: updatedActivation.output_data || { text: updatedActivation.output_summary },
        status: updatedActivation.status,
        started_at: updatedActivation.started_at,
        context: updatedActivation.context || {}
      };
      
      // Re-render just this message
      const messageElement = this.shadowRoot.querySelector(`.activation-message[data-id="${activationId}"]`);
      if (messageElement) {
        messageElement.outerHTML = this.renderMessage(this.messages[messageIndex]);
        this.setupRetryHandlers();
      } else {
        // If we can't find the element, do a full re-render
        this.render();
      }
    } catch (error) {
      console.error(`Error updating activation ${activationId}:`, error);
    }
  }

  render() {
    let content = '';
    
    // Check for no providers first
    if (this.providers.length === 0) {
      content = `
        <div class="empty-state">
          <i class="fas fa-plug empty-icon"></i>
          <h3>No LLM Providers Available</h3>
          <p>You need to add an LLM provider before you can send messages</p>
          <button class="primary-button" id="setup-provider-btn">
            <i class="fas fa-cog"></i> Set Up LLM Provider
          </button>
        </div>
      `;
    } else if (!this.chatId) {
      content = `
        <div class="new-chat-state">
          <div class="new-chat-icon"><i class="fas fa-comment-alt"></i></div>
          <h3 class="new-chat-title">New Chat</h3>
          <p class="new-chat-subtitle">Start a new conversation by typing your first message below</p>
          ${this.renderProviderSelector()}
        </div>
      `;
    } else if (this.error) {
      content = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error loading messages</h3>
          <p>${this.error.message}</p>
          <button class="retry-btn">Retry</button>
        </div>
      `;
    } else if (this.loading) {
      content = '<div class="loading-container"><div class="spinner"></div></div>';
    } else if (this.messages.length === 0) {
      content = `
        <div class="empty-state">
          <i class="fas fa-comments empty-icon"></i>
          <h3>No messages yet</h3>
          <p>Send your first message to start the conversation</p>
          ${this.renderProviderSelector()}
        </div>
      `;
    } else {
      // Removed settings button, just show messages
      content = `
        <div class="messages-list">
          ${this.messages.map(activation => this.renderMessage(activation)).join('')}
        </div>
      `;
    }

    // Use the imported HTML template and CSS styles without settings panel
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate.replace('${content}', content)}
    `;

    this.setupRetryHandlers();
    this.setupProviderHandlers();
    this.scrollToBottom();
  }

  renderProviderSelector() {
    if (this.providers.length === 0) return '';
    
    // When there's only one provider, just show its name
    if (this.providers.length === 1) {
      const provider = this.providers[0];
      return `
        <div class="provider-info">
          <span class="provider-label">Using LLM Provider:</span>
          <span class="provider-name">${provider.name || provider.provider_id}</span>
        </div>
      `;
    }
    
    // For multiple providers, show dropdown selector
    return `
      <div class="provider-selector">
        <label for="provider-select">LLM Provider:</label>
        <select id="provider-select">
          ${this.providers.map(provider => `
            <option value="${provider.provider_id}" 
              ${provider.provider_id === this.selectedProviderId ? 'selected' : ''}>
              ${provider.name || provider.provider_id} (${provider.default_model})
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  setupProviderHandlers() {
    const providerSelect = this.shadowRoot.querySelector('#provider-select');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        const providerId = e.target.value;
        this.selectedProviderId = providerId;
        
        // Notify parent component of provider change
        this.dispatchEvent(new CustomEvent('provider-selected', {
          detail: { providerId },
          bubbles: true,
          composed: true
        }));
      });
    }

    const setupProviderBtn = this.shadowRoot.querySelector('#setup-provider-btn');
    if (setupProviderBtn) {
      setupProviderBtn.addEventListener('click', () => {
        try {
          // Navigate to global settings using absolute flag
          FIBER.router.navigateTo('/settings/llm-providers', { absolute: true });
        } catch (error) {
          console.warn('[ChatMessagesMultiAgent] Navigation failed:', error);
        }
      });
    }
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

  getMessageContent(activation) {
    const inputMessage = activation.input_data?.prompt || 
                       JSON.stringify(activation.input_data, null, 2);
    
    if (activation.output_data) {
      // Handle different output data formats
      let outputText;
      
      // If output_data is a string (plain text response from ChatAgent)
      if (typeof activation.output_data === 'string') {
        outputText = activation.output_data;
      }
      // If output_data has a text property (structured response)
      else if (activation.output_data.text !== undefined) {
        // Special case: Check for {text: null} pattern that indicates empty response
        if (activation.output_data.text === null) {
          return {
            input: inputMessage,
            output: '<div class="empty-message">No content returned from the model</div>',
            status: 'completed',
            showLoading: false
          };
        }
        outputText = activation.output_data.text;
      }
      // Check if this is a ChatSummarizerAgent with structured output
      else if (activation.agent_id && (
        activation.agent_id.toLowerCase().includes('summarizer') ||
        this.getAgentName(activation.agent_id).toLowerCase().includes('summarizer')
      ) && activation.output_data.analysis) {
        outputText = this.formatSummarizerOutput(activation.output_data);
      }
      // Fallback to JSON stringification for unknown structures
      else {
        outputText = JSON.stringify(activation.output_data, null, 2);
      }
      
      return {
        input: inputMessage,
        output: outputText || '<div class="empty-message">No content returned</div>',
        status: activation.status,
        showLoading: false
      };
    }

    if (activation.isTyping) {
      return {
        input: inputMessage,
        output: '<div class="typing-indicator"><span></span><span></span><span></span></div>',
        status: 'typing',
        showLoading: true
      };
    }

    if (activation.status === 'pending' || activation.status === 'processing' || activation.status === 'running') {
      return {
        input: inputMessage,
        output: '<div class="loading-message"><div class="loading-spinner"></div><span>Processing...</span></div>',
        status: 'pending',
        showLoading: true
      };
    }

    if (activation.status === 'failed') {
      return {
        input: inputMessage,
        output: `<div class="error-message">Error: ${activation.error || 'Failed to process'}</div>`,
        status: 'failed',
        showLoading: false
      };
    }

    // No output data and unknown status - likely still loading
    return {
      input: inputMessage,
      output: '<div class="loading-message"><div class="loading-spinner"></div><span>Waiting for response...</span></div>',
      status: 'loading',
      showLoading: true
    };
  }

  formatSummarizerOutput(outputData) {
    // Handle error responses from the summarizer agent
    if (outputData.status === 'error') {
      return `
        <div class="analysis-error">
          <h4 class="analysis-title error-title"><i class="fas fa-exclamation-triangle"></i> Analysis Error</h4>
          <div class="error-content">
            <p><strong>Error:</strong> ${outputData.error || 'Unknown error occurred'}</p>
            ${outputData.available_messages !== undefined ? `
              <div class="error-details">
                <p><strong>Available Messages:</strong> ${outputData.available_messages}</p>
                ${outputData.summarizer_messages !== undefined ? `<p><strong>Summarizer Messages:</strong> ${outputData.summarizer_messages}</p>` : ''}
                ${outputData.non_summarizer_messages !== undefined ? `<p><strong>Non-Summarizer Messages:</strong> ${outputData.non_summarizer_messages}</p>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    if (!outputData.analysis) {
      return typeof outputData === 'string' ? outputData : JSON.stringify(outputData, null, 2);
    }

    const analysis = outputData.analysis;
    let formattedHtml = '';

    // Summary section
    if (analysis.summary) {
      formattedHtml += `
        <div class="analysis-section">
          <h4 class="analysis-title"><i class="fas fa-file-text"></i> Summary</h4>
          <div class="analysis-content">${analysis.summary}</div>
        </div>
      `;
    }

    // Key insights section
    if (analysis.insights && Array.isArray(analysis.insights)) {
      formattedHtml += `
        <div class="analysis-section">
          <h4 class="analysis-title"><i class="fas fa-lightbulb"></i> Key Insights</h4>
          <ul class="insights-list">
            ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Topics section
    if (analysis.topics && Array.isArray(analysis.topics)) {
      formattedHtml += `
        <div class="analysis-section">
          <h4 class="analysis-title"><i class="fas fa-tags"></i> Topics Discussed</h4>
          <div class="topics-grid">
            ${analysis.topics.map(topic => `
              <div class="topic-item">
                <div class="topic-name">${topic.topic}</div>
                <div class="topic-description">${topic.description}</div>
                <div class="topic-coverage">${topic.coverage}% coverage</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Statistics section
    if (analysis.statistics) {
      formattedHtml += `
        <div class="analysis-section">
          <h4 class="analysis-title"><i class="fas fa-chart-bar"></i> Conversation Statistics</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${analysis.message_count || 0}</div>
              <div class="stat-label">Total Messages</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${analysis.statistics.conversation_turns || 0}</div>
              <div class="stat-label">Conversation Turns</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${analysis.participants?.length || 0}</div>
              <div class="stat-label">Participants</div>
            </div>
          </div>
        </div>
      `;
    }

    return formattedHtml || '<div class="empty-message">Analysis completed but no structured data available</div>';
  }

  renderMessage(activation) {
    const {input, output, status, showLoading} = this.getMessageContent(activation);
    const showRetry = status === 'failed' || (!activation.output_data && status !== 'pending' && !showLoading);
    const agentName = this.getAgentName(activation.agent_id);
    const agentIcon = this.getAgentIcon(activation.agent_id);
    
    // Check if this is a ChatSummarizerAgent activation
    const isSummarizerAgent = activation.agent_id && (
      activation.agent_id.toLowerCase().includes('summarizer') ||
      agentName.toLowerCase().includes('summarizer') ||
      agentName.toLowerCase().includes('summary')
    );

    if (isSummarizerAgent) {
      return this.renderSummarizerMessage(activation, {input, output, status, showLoading}, agentName, agentIcon, showRetry);
    }

    return `
      <div class="activation-message ${status} ${showLoading ? 'loading' : ''}" data-id="${activation.id}">
        <div class="message-time">${this.formatDate(activation.started_at || activation.created_at)}</div>
        <div class="input-bubble">
          <div class="message-header">
            <i class="fas fa-user user-icon"></i>
            <span class="message-label">User</span>
          </div>
          <div class="message-content">${input}</div>
        </div>
        <div class="output-bubble ${!activation.output_data ? 'pending' : ''}">
          <div class="message-header">
            <i class="${agentIcon} agent-icon"></i>
            <span class="message-label">${agentName}</span>
            ${showLoading ? '<div class="loading-indicator"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>' : ''}
          </div>
          <div class="message-content">${output}</div>
        </div>
        ${showRetry ? `
          <button class="retry-btn" data-message-id="${activation.id}">
            <i class="fas fa-redo"></i> Retry
          </button>
        ` : ''}
      </div>
    `;
  }

  renderSummarizerMessage(activation, {input, output, status, showLoading}, agentName, agentIcon, showRetry) {
    const inputPrompt = activation.input_data?.prompt;
    const hasUserRequest = inputPrompt && inputPrompt.trim() && 
                          inputPrompt !== 'Please proceed with your task.' && 
                          inputPrompt !== 'Please analyze this conversation and provide insights.';

    return `
      <div class="activation-message system-message ${status} ${showLoading ? 'loading' : ''}" data-id="${activation.id}">
        <div class="message-time">${this.formatDate(activation.started_at || activation.created_at)}</div>
        
        ${hasUserRequest ? `
          <div class="user-request-section">
            <div class="message-header">
              <i class="fas fa-user user-icon"></i>
              <span class="message-label">User Request</span>
            </div>
            <div class="message-content">${inputPrompt}</div>
          </div>
        ` : ''}
        
        <div class="system-analysis-section">
          <div class="message-header">
            <i class="${agentIcon} system-icon"></i>
            <span class="message-label">${agentName} Analysis</span>
            ${showLoading ? '<div class="loading-indicator"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>' : ''}
          </div>
          <div class="message-content system-content">${output}</div>
        </div>
        
        ${showRetry ? `
          <button class="retry-btn" data-message-id="${activation.id}">
            <i class="fas fa-redo"></i> Retry Analysis
          </button>
        ` : ''}
      </div>
    `;
  }

  setupRetryHandlers() {
    if (!this.chatId) return;

    this.shadowRoot.querySelectorAll('.retry-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const messageId = btn.dataset.messageId;
        const message = this.messages.find(m => m.id === messageId);
        
        if (!message?.input_data) return;

        try {
          const retryActivation = await FIBER.agents.activate(
            message.agent_id,
            { prompt: message.input_data.prompt, chat_id: message.chat_id },
            { chat_id: message.chat_id, previous_message_id: message.id }
          );
            
          this.dispatchEvent(new CustomEvent('message-updated', {
            detail: { messageId: message.id, newMessage: retryActivation },
            bubbles: true,
            composed: true
          }));
        } catch (error) {
          console.error('Error retrying message:', error);
          this.dispatchEvent(new CustomEvent('notification', {
            detail: { message: 'Failed to retry message', type: 'error' },
            bubbles: true,
            composed: true
          }));
        }
      });
    });
  }
}

customElements.define('chat-messages', ChatMessages);
