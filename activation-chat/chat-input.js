import htmlTemplate from './chat-input.html?raw';
import cssStyles from './chat-input.css?inline';

export class ChatInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.value = '';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
    `;
  }

  setupEventListeners() {
    const input = this.shadowRoot.getElementById('message-input');
    const sendButton = this.shadowRoot.getElementById('send-button');

    if (input) {
      input.addEventListener('input', (e) => {
        this.value = e.target.value;
        
        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
        
        // Enable/disable send button based on content
        if (sendButton) {
          sendButton.disabled = !this.value.trim();
        }
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
  }

  sendMessage() {
    const input = this.shadowRoot.getElementById('message-input');
    const message = this.value.trim();
    
    if (message) {
      this.dispatchEvent(new CustomEvent('message-sent', {
        detail: { content: message },
        bubbles: true,
        composed: true
      }));
      
      // Clear input
      this.value = '';
      input.value = '';
      input.style.height = 'auto';
      
      // Disable send button
      const sendButton = this.shadowRoot.getElementById('send-button');
      if (sendButton) {
        sendButton.disabled = true;
      }
    }
  }
}

customElements.define('chat-input', ChatInput);
