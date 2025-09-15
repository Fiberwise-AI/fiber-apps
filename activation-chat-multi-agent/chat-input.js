import htmlTemplate from './chat-input.html?raw';
import cssStyles from './chat-input.css?inline';

export class ChatInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.value = '';
    this.isSubmitting = false; // Add flag to prevent multiple submissions
    this.selectedAgentName = '';
    this.showDetailedRequest = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Listen for edit-and-retry events from chat-messages
    this.addEventListener('edit-and-retry', (e) => {
      this.handleEditAndRetry(e.detail);
    });
  }

  render() {
    const isSummarizerAgent = this.selectedAgentName && this.selectedAgentName.toLowerCase().includes('summarizer');
    
    let template;
    if (isSummarizerAgent && !this.showDetailedRequest && !this.forceNormalInput) {
      // Show simplified UI for ChatSummarizerAgent
      template = `
        <div class="chat-input-container summarizer-mode">
          <div class="summarizer-info">
            <i class="fas fa-robot"></i>
            <span>ChatSummarizerAgent will analyze the conversation</span>
          </div>
          <div class="summarizer-actions">
            <button id="quick-analyze-button" class="quick-analyze-button">
              <i class="fas fa-play"></i> Analyze Conversation
            </button>
            <button id="detailed-request-button" class="detailed-request-button">
              <i class="fas fa-plus"></i> Add Detailed Request
            </button>
          </div>
        </div>
      `;
    } else {
      // Show regular text input for other agents or when detailed request is enabled
      const placeholder = isSummarizerAgent 
        ? "Enter your detailed request for the analysis..." 
        : "Type your message here...";
      
      template = `
        <div class="chat-input-container">
          ${isSummarizerAgent && this.showDetailedRequest ? `
            <div class="detailed-request-header">
              <span>Detailed request for ChatSummarizerAgent:</span>
              <button id="cancel-detailed-button" class="cancel-detailed-button">
                <i class="fas fa-times"></i>
              </button>
            </div>
          ` : ''}
          <textarea id="message-input" placeholder="${placeholder}" rows="1"></textarea>
          <button id="send-button" class="send-button">
            <i class="fas fa-send"></i>
          </button>
        </div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${template}
    `;
  }

  setupEventListeners() {
    const input = this.shadowRoot.getElementById('message-input');
    const sendButton = this.shadowRoot.getElementById('send-button');
    const quickAnalyzeButton = this.shadowRoot.getElementById('quick-analyze-button');
    const detailedRequestButton = this.shadowRoot.getElementById('detailed-request-button');
    const cancelDetailedButton = this.shadowRoot.getElementById('cancel-detailed-button');

    // Handle regular text input
    if (input) {
      input.addEventListener('input', (e) => {
        this.value = e.target.value;
        
        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // Handle summarizer mode buttons
    if (quickAnalyzeButton) {
      quickAnalyzeButton.addEventListener('click', () => {
        this.value = ''; // Send empty message for quick analysis
        this.sendMessage();
        // Switch to normal chat mode immediately after sending
        this.switchToNormalChatMode();
      });
    }

    if (detailedRequestButton) {
      detailedRequestButton.addEventListener('click', () => {
        this.showDetailedRequest = true;
        this.render();
        this.setupEventListeners();
        // Focus on the input after rendering
        setTimeout(() => {
          const newInput = this.shadowRoot.getElementById('message-input');
          if (newInput) newInput.focus();
        }, 0);
      });
    }

    if (cancelDetailedButton) {
      cancelDetailedButton.addEventListener('click', () => {
        this.showDetailedRequest = false;
        this.value = '';
        this.render();
        this.setupEventListeners();
      });
    }
  }

  sendMessage() {
    // Prevent multiple submissions
    if (this.isSubmitting) return;
    
    const input = this.shadowRoot.getElementById('message-input');
    const message = this.value.trim();
    
    // Allow sending empty messages
    // Set submitting flag
    this.isSubmitting = true;
    
    this.dispatchEvent(new CustomEvent('message-sent', {
      detail: { content: message },
      bubbles: true,
      composed: true
    }));
    
    // Clear input - only if input element exists
    this.value = '';
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    
    // Keep send button enabled for empty messages
    const sendButton = this.shadowRoot.getElementById('send-button');
    if (sendButton) {
      sendButton.disabled = false;
    }
    
    // Reset submitting flag after a short delay
    setTimeout(() => {
      this.isSubmitting = false;
      // Note: UI state changes are now handled immediately in the click handlers
      // to prevent flickering
    }, 500);
  }

  updateSelectedAgent(agentName) {
    const oldAgentName = this.selectedAgentName;
    this.selectedAgentName = agentName;
    
    // Reset detailed request mode and force normal input flag when agent changes
    if (oldAgentName !== agentName) {
      this.showDetailedRequest = false;
      this.forceNormalInput = false;
      this.value = '';
    }
    
    this.render();
    this.setupEventListeners();
  }

  // Add method to force switch to normal chat mode (for after analyze button is clicked)
  switchToNormalChatMode() {
    // After analysis, reset to first chat agent
    this.showDetailedRequest = false;
    this.forceNormalInput = false; // Don't force, actually reset agent
    
    // Dispatch event to parent to reset agent selection to first agent
    this.dispatchEvent(new CustomEvent('reset-to-first-agent', {
      bubbles: true,
      composed: true
    }));
    
    this.render();
    this.setupEventListeners();
  }

  focus() {
    const input = this.shadowRoot.getElementById('message-input');
    if (input) {
      input.focus();
    }
  }

  handleEditAndRetry(detail) {
    const { editedPrompt, originalMessageId, originalMessage } = detail;
    
    // Set the input value to the edited prompt
    const input = this.shadowRoot.getElementById('message-input');
    if (input) {
      input.value = editedPrompt;
      this.value = editedPrompt;
      
      // Auto-resize the textarea
      input.style.height = 'auto';
      input.style.height = (input.scrollHeight) + 'px';
      
      // Focus the input
      input.focus();
    }

    // Dispatch event to notify that we're preparing for an edit retry
    this.dispatchEvent(new CustomEvent('prepare-edit-retry', {
      detail: {
        originalMessageId,
        originalMessage,
        editedPrompt
      },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('chat-input', ChatInput);
