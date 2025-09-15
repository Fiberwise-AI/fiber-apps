import { FIBER } from './index.js';
import htmlTemplate from './chat-messages.html?raw';
import cssStyles from './chat-messages.css?inline';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
    
    // Configure marked for better rendering
    marked.setOptions({
      breaks: true,      // Convert single line breaks to <br>
      gfm: true,         // Enable GitHub Flavored Markdown
      sanitize: false    // We'll use DOMPurify for sanitization
    });
  }

  clearChat() {
    this.chatId = null;
    this.messages = [];
    this.error = null;
    this.loading = false;
    this.render();
  }

  async deleteChat() {
    if (!this.chatId) return;
    
    try {
      // Just clear the local messages for now (UI-only delete)
      // TODO: Add actual backend deletion when API is available
      this.messages = [];
      this.render();
      
      // Notify parent that chat was cleared
      this.dispatchEvent(new CustomEvent('chat-deleted', {
        detail: { chatId: this.chatId },
        bubbles: true,
        composed: true
      }));
      
      this.dispatchEvent(new CustomEvent('notification', {
        detail: { message: 'Chat cleared from view', type: 'success' },
        bubbles: true,
        composed: true
      }));
      
      console.log(`Cleared chat ${this.chatId} from view`);
      
    } catch (error) {
      console.error('Error clearing chat:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        detail: { message: 'Failed to clear chat', type: 'error' },
        bubbles: true,
        composed: true
      }));
    }
  }

  async deleteMessage(messageId) {
    try {
      // Call the backend API to delete the activation permanently
      const appId = FIBER.apps.getAppId();
      
      if (!appId) {
        throw new Error('App ID not available');
      }
      
      const response = await fetch(`/api/v1/apps/${appId}/agents/activations/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete message: ${response.status}`);
      }
      
      // Remove from local messages after successful deletion
      this.messages = this.messages.filter(msg => msg.id !== messageId);
      this.render();
      
      this.dispatchEvent(new CustomEvent('notification', {
        detail: { message: 'Message deleted permanently', type: 'success' },
        bubbles: true,
        composed: true
      }));
      
    } catch (error) {
      console.error('Error deleting message:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        detail: { message: `Failed to delete message: ${error.message}`, type: 'error' },
        bubbles: true,
        composed: true
      }));
    }
  }

  async editMessage(messageId) {
    try {
      // Find the message to edit
      const message = this.messages.find(msg => msg.id === messageId);
      if (!message || !message.input_data) {
        throw new Error('Message not found or has no input to edit');
      }

      // Parse the input data to get the original prompt
      let inputData;
      try {
        inputData = typeof message.input_data === 'string' ? JSON.parse(message.input_data) : message.input_data;
      } catch {
        inputData = { prompt: message.input_data };
      }

      const originalPrompt = inputData.prompt || inputData.user_input || inputData.message || 'No prompt found';

      // Show a dialog to edit the prompt
      const editedPrompt = prompt('Edit your message:', originalPrompt);
      if (!editedPrompt || editedPrompt.trim() === '') {
        return; // User cancelled or entered empty prompt
      }

      if (editedPrompt.trim() === originalPrompt.trim()) {
        return; // No changes made
      }

      // Dispatch event to trigger new activation with the edited prompt
      // The chat-input component will handle creating the new activation
      this.dispatchEvent(new CustomEvent('edit-and-retry', {
        detail: { 
          editedPrompt: editedPrompt.trim(),
          originalMessageId: messageId,
          originalMessage: message
        },
        bubbles: true,
        composed: true
      }));

    } catch (error) {
      console.error('Error editing message:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        detail: { message: `Failed to edit message: ${error.message}`, type: 'error' },
        bubbles: true,
        composed: true
      }));
    }
  }

  isEditedMessage(activation) {
    // Check if the metadata contains edit tracking information
    try {
      const metadata = typeof activation.metadata === 'string' 
        ? JSON.parse(activation.metadata) 
        : activation.metadata;
      
      return metadata?.edit_chain?.parent_activation_id || 
             metadata?.edit_chain?.edit_generation > 0 ||
             false;
    } catch (error) {
      return false;
    }
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
    const agent = this.agents.find(a => a.id === agentId);
    return agent ? (agent.name || agent.id) : agentId;
  }

  getAgentIcon(agentId) {
    // You can customize this based on agent type or name
    if (!agentId) return 'fas fa-robot';
    const agent = this.agents.find(a => a.id === agentId);
    const agentName = (agent?.name || agent?.id || '').toLowerCase();
    
    if (agentName.includes('summarizer') || agentName.includes('summary')) {
      return 'fas fa-file';
    } else if (agentName.includes('chat') || agentName.includes('conversation')) {
      return 'fas fa-comments';
    } else if (agentName.includes('analyze') || agentName.includes('analysis')) {
      return 'fas fa-chart-line';
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

      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response length:', response?.length);

      this.messages = response.map(activation => ({
        id: activation.id,
        chat_id: activation.context?.chat_id,
        agent_id: activation.agent_id, // Add agent_id to messages
        input_data: activation.input_data || { prompt: activation.input_summary },
        output_data: activation.output_data || { text: activation.output_summary },
        status: activation.status,
        started_at: activation.started_at,
        context: activation.context || {}
      })).sort((a, b) => {
        // Additional client-side sorting to ensure proper chronological order (oldest first)
        const dateA = new Date(a.started_at || 0);
        const dateB = new Date(b.started_at || 0);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('Processed messages:', this.messages);
      console.log('Messages count:', this.messages.length);
      
      // Debug logging for initial load
      console.log('Messages loaded from API (should be oldest to newest):');
      this.messages.forEach((msg, index) => {
        const date = new Date(msg.started_at || 0);
        console.log(`${index}: ${msg.started_at} (parsed: ${date.getTime()}) - ${msg.id}`);
      });
      
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Error loading messages:', error);
      this.error = error;
      this.loading = false;
      this.render();
    }
  }

  // Add a pending message immediately for better UX
  addPendingMessage(activationId, prompt, agentId) {
    const pendingMessage = {
      id: activationId,
      chat_id: this.chatId,
      agent_id: agentId,
      input_data: { prompt: prompt },
      output_data: null,
      status: 'pending',
      started_at: new Date().toISOString(),
      context: { chat_id: this.chatId }
    };
    
    // Add to end of messages array (newest message)
    this.messages.push(pendingMessage);
    
    // Re-render and scroll to bottom
    this.render();
    this.scrollToBottom();
  }

  // Add method to update an activation when a WebSocket event is received
  async updateActivation(activationId, status) {
    console.log(`Updating activation ${activationId} with status ${status}`);
    
    // Find the message that needs updating
    const messageIndex = this.messages.findIndex(msg => msg.id === activationId);
    if (messageIndex === -1) {
      console.log(`Activation ${activationId} not found in messages, fetching and adding new message`);
      try {
        // Fetch the new activation details
        const newActivation = await FIBER.agents.getActivation(activationId);
        
        // Create new message object
        const newMessage = {
          id: newActivation.id,
          chat_id: newActivation.context?.chat_id,
          agent_id: newActivation.agent_id,
          input_data: newActivation.input_data || { prompt: newActivation.input_summary },
          output_data: newActivation.output_data || { text: newActivation.output_summary },
          status: newActivation.status,
          started_at: newActivation.started_at,
          context: newActivation.context || {}
        };
        
        // Add to messages array at the end (newest message)
        this.messages.push(newMessage);
        
        // Re-sort to ensure proper chronological order
        this.messages.sort((a, b) => {
          const dateA = new Date(a.started_at || 0);
          const dateB = new Date(b.started_at || 0);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Re-render and scroll to bottom
        this.render();
        this.scrollToBottom();
        return;
      } catch (error) {
        console.error(`Error fetching new activation ${activationId}:`, error);
        // Fall back to reloading all messages if fetch fails
        return this.loadMessages();
      }
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
    console.log('=== RENDER DEBUG ===');
    console.log('providers.length:', this.providers.length);
    console.log('chatId:', this.chatId);
    console.log('error:', this.error);
    console.log('loading:', this.loading);
    console.log('messages.length:', this.messages.length);
    console.log('messages data:', this.messages);
    
    let content = '';
    
    // Handle different states in priority order (messages first, then provider issues)
    if (this.error) {
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
    } else if (!this.chatId) {
      // No chat selected - check providers
      if (this.providers.length === 0) {
        content = `
          <div class="empty-state">
            <i class="fas fa-plug"></i>
            <h3>No LLM Providers Available</h3>
            <p>You need to add an LLM provider before you can send messages</p>
            <button class="primary-button" id="setup-provider-btn">
              <i class="fas fa-cog"></i> Set Up LLM Provider
            </button>
          </div>
        `;
      } else {
        content = `
          <div class="new-chat-state">
            <div class="new-chat-icon"><i class="fas fa-comment"></i></div>
            <h3 class="new-chat-title">New Chat</h3>
            <p class="new-chat-subtitle">Start a new conversation by typing your first message below</p>
            ${this.renderProviderSelector()}
          </div>
        `;
      }
    } else if (this.messages.length === 0) {
      // Chat selected but no messages - check providers
      if (this.providers.length === 0) {
        content = `
          <div class="empty-state">
            <i class="fas fa-plug"></i>
            <h3>No LLM Providers Available</h3>
            <p>You need to add an LLM provider before you can send messages</p>
            <button class="primary-button" id="setup-provider-btn">
              <i class="fas fa-cog"></i> Set Up LLM Provider
            </button>
          </div>
        `;
      } else {
        content = `
          <div class="empty-state">
            <i class="fas fa-comments"></i>
            <h3>No messages yet</h3>
            <p>Send your first message to start the conversation</p>
            ${this.renderProviderSelector()}
          </div>
        `;
      }
    } else {
      // Show messages with delete chat button
      console.log('RENDERING MESSAGES:', this.messages.length, 'messages');
      console.log('Messages to render:', this.messages);
      
      content = `
        <div class="messages-header">
          <div class="messages-title">
            <i class="fas fa-comments"></i>
            <span>Chat Messages</span>
          </div>
          <div class="messages-actions">
            <button class="delete-chat-btn" id="delete-chat-btn" title="Clear all messages from view">
              <i class="fas fa-eye-slash"></i> Clear Chat
            </button>
          </div>
        </div>
        <div class="messages-list">
          ${this.messages.map(activation => this.renderMessage(activation)).join('')}
        </div>
      `;
    }

    console.log('Final rendered content preview:', content.substring(0, 200));
    
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

  formatMarkdown(text) {
    if (!text || typeof text !== 'string') return text;
    
    try {
      // Parse markdown to HTML
      const html = marked.parse(text);
      
      // Sanitize the HTML to prevent XSS attacks
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                       'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'hr', 'table', 
                       'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'target', 'rel']
      });
    } catch (error) {
      console.error('Error formatting markdown:', error);
      // Fallback to escaped plain text
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  formatSummarizerOutput(outputData) {
    // Handle error responses from the summarizer agent
    if (outputData && outputData.status === 'error') {
      let errorMarkdown = `## ⚠️ Analysis Error\n\n**Error:** ${outputData.error || 'Unknown error occurred'}\n\n`;
      
      if (outputData.available_messages !== undefined) {
        errorMarkdown += `**Available Messages:** ${outputData.available_messages}\n`;
        if (outputData.summarizer_messages !== undefined) {
          errorMarkdown += `**Summarizer Messages:** ${outputData.summarizer_messages}\n`;
        }
        if (outputData.non_summarizer_messages !== undefined) {
          errorMarkdown += `**Non-Summarizer Messages:** ${outputData.non_summarizer_messages}\n`;
        }
      }
      
      return errorMarkdown;
    }

    if (!outputData || !outputData.analysis) {
      return "**Analysis Error:** Unable to format summarizer output";
    }

    const analysis = outputData.analysis;
    let markdown = '';

    // Summary section
    if (analysis.summary) {
      markdown += `## 📋 Conversation Summary\n\n${analysis.summary}\n\n`;
    }

    // Insights section
    if (analysis.insights && Array.isArray(analysis.insights) && analysis.insights.length > 0) {
      markdown += `## 💡 Key Insights\n\n`;
      analysis.insights.forEach(insight => {
        markdown += `- ${insight}\n`;
      });
      markdown += `\n`;
    }

    // Topics section
    if (analysis.topics && Array.isArray(analysis.topics) && analysis.topics.length > 0) {
      markdown += `## 🏷️ Topics Discussed\n\n`;
      analysis.topics.forEach(topic => {
        if (topic.topic && topic.description) {
          markdown += `**${topic.topic}** (${topic.coverage || 0}%)\n${topic.description}\n\n`;
        }
      });
    }

    // Statistics section
    if (analysis.statistics) {
      const stats = analysis.statistics;
      markdown += `## 📊 Conversation Statistics\n\n`;
      if (stats.total_messages) markdown += `- **Total Messages:** ${stats.total_messages}\n`;
      if (stats.user_messages) markdown += `- **User Messages:** ${stats.user_messages}\n`;
      if (stats.assistant_messages) markdown += `- **Assistant Messages:** ${stats.assistant_messages}\n`;
      if (stats.duration_minutes) markdown += `- **Duration:** ${stats.duration_minutes} minutes\n`;
      if (stats.participants && stats.participants.length) markdown += `- **Participants:** ${stats.participants.join(', ')}\n`;
      markdown += `\n`;
    }

    return markdown || "**Analysis Complete:** No specific insights generated";
  }

  getMessageContent(activation) {
    const inputMessage = activation.input_data?.prompt || 
                       JSON.stringify(activation.input_data, null, 2);
    
    // Check if this is an edited message
    const isEdited = this.isEditedMessage(activation);
    const editIndicator = isEdited ? '<span class="edit-indicator" title="This message was edited">(edited)</span> ' : '';
    
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
            input: editIndicator + inputMessage,
            output: '<div class="empty-message">No content returned from the model</div>',
            status: 'completed',
            showLoading: false
          };
        }
        outputText = activation.output_data.text;
      }
      // Check if this is a ChatSummarizerAgent with structured output
      else if (activation.output_data.analysis) {
        // If it has an analysis field, it's from the summarizer agent
        outputText = this.formatSummarizerOutput(activation.output_data);
      }
      // Fallback to JSON stringification for unknown structures
      else {
        outputText = JSON.stringify(activation.output_data, null, 2);
      }
      
      return {
        input: editIndicator + inputMessage,
        output: outputText ? this.formatMarkdown(outputText) : '<div class="empty-message">No content returned</div>',
        status: activation.status,
        showLoading: false
      };
    }

    if (activation.isTyping) {
      return {
        input: editIndicator + inputMessage,
        output: '<div class="typing-indicator"><span></span><span></span><span></span></div>',
        status: 'typing',
        showLoading: true
      };
    }

    if (activation.status === 'pending' || activation.status === 'processing' || activation.status === 'running') {
      return {
        input: editIndicator + inputMessage,
        output: '<div class="loading-message"><div class="loading-spinner"></div><span>Processing...</span></div>',
        status: 'pending',
        showLoading: true
      };
    }

    if (activation.status === 'failed') {
      return {
        input: editIndicator + inputMessage,
        output: `<div class="error-message">Error: ${activation.error || 'Failed to process'}</div>`,
        status: 'failed',
        showLoading: false
      };
    }

    // No output data and unknown status - likely still loading
    return {
      input: editIndicator + inputMessage,
      output: '<div class="loading-message"><div class="loading-spinner"></div><span>Waiting for response...</span></div>',
      status: 'loading',
      showLoading: true
    };
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
        <div class="message-header-row">
          <div class="message-time">${this.formatDate(activation.started_at || activation.created_at)}</div>
          <div class="message-actions">
            <button class="edit-message-btn" data-message-id="${activation.id}" title="Edit and retry this message">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-message-btn" data-message-id="${activation.id}" title="Delete this message permanently">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
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
        <div class="message-header-row">
          <div class="message-time">${this.formatDate(activation.started_at || activation.created_at)}</div>
          <div class="message-actions">
            <button class="edit-message-btn" data-message-id="${activation.id}" title="Edit and retry this message">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-message-btn" data-message-id="${activation.id}" title="Delete this message permanently">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
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

    // Handle retry buttons
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

    // Handle individual message delete buttons
    this.shadowRoot.querySelectorAll('.delete-message-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const messageId = btn.dataset.messageId;
        
        // Show confirmation dialog
        if (confirm('Delete this message permanently? This action cannot be undone and will remove the message from the database.')) {
          await this.deleteMessage(messageId);
        }
      });
    });

    // Handle individual message edit buttons
    this.shadowRoot.querySelectorAll('.edit-message-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const messageId = btn.dataset.messageId;
        await this.editMessage(messageId);
      });
    });

    // Handle delete chat button
    const deleteChatBtn = this.shadowRoot.getElementById('delete-chat-btn');
    if (deleteChatBtn) {
      deleteChatBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        // Show confirmation dialog
        if (confirm('Clear all messages from this chat view? (Note: This only clears messages from the UI, it does not delete them from the database)')) {
          await this.deleteChat();
        }
      });
    }
  }
}

customElements.define('chat-messages', ChatMessages);
