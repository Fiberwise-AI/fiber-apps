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
  }

  render() {
    const isSummarizerAgent = this.selectedAgentName && this.selectedAgentName.toLowerCase().includes('summarizer');
    
    let template;
    if (isSummarizerAgent && !this.showDetailedRequest) {
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
            <i class="fas fa-paper-plane"></i>
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
    
    // Clear input
    this.value = '';
    input.value = '';
    input.style.height = 'auto';
    
    // Keep send button enabled for empty messages
    const sendButton = this.shadowRoot.getElementById('send-button');
    if (sendButton) {
      sendButton.disabled = false;
    }
    
    // Reset submitting flag after a short delay
    setTimeout(() => {
      this.isSubmitting = false;
    }, 500);
  }

  updateSelectedAgent(agentName) {
    const oldAgentName = this.selectedAgentName;
    this.selectedAgentName = agentName;
    
    // Reset detailed request mode when agent changes
    if (oldAgentName !== agentName) {
      this.showDetailedRequest = false;
      this.value = '';
    }
    
    this.render();
    this.setupEventListeners();
  }

  focus() {
    const input = this.shadowRoot.getElementById('message-input');
    if (input) {
      input.focus();
    }
  }
}

customElements.define('chat-input', ChatInput);
