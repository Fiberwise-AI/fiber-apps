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

  setSelectedProvider(authenticatorId) {
    this.selectedProviderId = authenticatorId;
    this.setAttribute('selected-provider-id', authenticatorId);
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
        sortBy: 'started_at',
        sortDir: 'asc'
      });

      this.messages = response.map(activation => ({
        id: activation.id,
        chat_id: activation.context?.chat_id,
        input_data: activation.input_data || { prompt: activation.input_summary },
        output_data: activation.output_data || (activation.output_summary ? { text: activation.output_summary } : null),
        status: activation.status,
        started_at: activation.started_at,
        context: activation.context || {},
        error: activation.error,
        error_message: activation.error_message
      })).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Error loading messages:', error);
      this.error = error;
      this.loading = false;
      this.render();
    }
  }

  // Add method to refresh messages without showing loading state
  async refreshMessages() {
    if (!this.chatId) return;
    
    try {
      const response = await FIBER.agents.getActivations({
        context: { chat_id: this.chatId },
        limit: 100,
        sortBy: 'started_at',
        sortDir: 'asc'
      });

      this.messages = response.map(activation => ({
        id: activation.id,
        chat_id: activation.context?.chat_id,
        input_data: activation.input_data || { prompt: activation.input_summary },
        output_data: activation.output_data || (activation.output_summary ? { text: activation.output_summary } : null),
        status: activation.status,
        started_at: activation.started_at,
        context: activation.context || {},
        error: activation.error,
        error_message: activation.error_message
      })).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      
      this.render();
      console.log('[ChatMessages] Messages refreshed with updated logic');
    } catch (error) {
      console.error('Error refreshing messages:', error);
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
      // Show messages with provider selector at the top
      content = `
        ${this.renderProviderSelector()}
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
          <span class="provider-name">${provider.name || provider.authenticator_id}</span>
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
              ${provider.name || provider.provider_id}${provider.default_model ? ` (${provider.default_model})` : ''}
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
        })).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      });
    }

    const setupBtn = this.shadowRoot.querySelector('#setup-provider-btn');
    if (setupBtn) {
      setupBtn.addEventListener('click', () => {
        try {
          // Navigate to global settings using absolute flag
          FIBER.router.navigateTo('/settings/llm-providers', { absolute: true });
        } catch (error) {
          console.warn('[ChatMessages] Navigation failed:', error);
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
      // Special case: Check for {text: null} pattern that indicates empty response
      if (activation.output_data.text === null && Object.keys(activation.output_data).length === 1) {
        return {
          input: inputMessage,
          output: '<div class="empty-message">No content returned from the model</div>',
          status: 'completed'
        };
      }
      
      return {
        input: inputMessage,
        output: typeof activation.output_data === 'string' 
          ? activation.output_data 
          : activation.output_data.response || activation.output_data.text || JSON.stringify(activation.output_data, null, 2),
        status: activation.status || 'completed'  // Default to completed if we have output
      };
    }

    if (activation.isTyping) {
      return {
        input: inputMessage,
        output: '<div class="typing-indicator"><span></span><span></span><span></span></div>',
        status: 'typing'
      };
    }

    if (activation.status === 'pending' || activation.status === 'running') {
      return {
        input: inputMessage,
        output: '<div class="pending-message">Waiting for response...</div>',
        status: 'pending'
      };
    }

    if (activation.status === 'failed' || activation.status === 'error') {
      return {
        input: inputMessage,
        output: `<div class="error-message">Error: ${activation.error || activation.error_message || 'Failed to process'}</div>`,
        status: 'failed'
      };
    }

    // For completed status but no output data, this might be a synchronization issue
    if (activation.status === 'completed') {
      return {
        input: inputMessage,
        output: '<div class="pending-message">Processing response...</div>',
        status: 'pending'
      };
    }

    return {
      input: inputMessage,
      output: '<div class="pending-message">Processing...</div>',
      status: 'unknown'
    };
  }

  renderMessage(activation) {
    const {input, output, status} = this.getMessageContent(activation);
    
    // Only show retry button for truly failed activations or those that have been stuck without output for a while
    const showRetry = status === 'failed' || 
                     (status === 'unknown' && !activation.output_data && activation.status !== 'completed' && activation.status !== 'pending' && activation.status !== 'running');

    return `
      <div class="activation-message ${status}" data-id="${activation.id}">
        <div class="message-time">${this.formatDate(activation.started_at || activation.created_at)}</div>
        <div class="input-bubble">
          <div class="message-label">Input:</div>
          <div class="message-content">${input}</div>
        </div>
        <div class="output-bubble ${!activation.output_data ? 'pending' : ''}">
          <div class="message-label">Output:</div>
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
            message.input_data,
            { chat_id: message.chat_id, previous_message_id: message.id }
          );
            
          this.dispatchEvent(new CustomEvent('message-updated', {
            detail: { messageId: message.id, newMessage: retryActivation },
            bubbles: true,
            composed: true
          })).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        } catch (error) {
          console.error('Error retrying message:', error);
          this.dispatchEvent(new CustomEvent('notification', {
            detail: { message: 'Failed to retry message', type: 'error' },
            bubbles: true,
            composed: true
          })).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        }
      });
    });
  }
}

customElements.define('chat-messages', ChatMessages);
