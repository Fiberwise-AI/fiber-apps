import { FIBER } from './index.js';
import '@fortawesome/fontawesome-free/css/all.css';

export class ChatList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sessions = [];
    this.currentChatId = null;
    this.loading = false;
    this.error = null;
    this.editingSessionId = null;
  }

  connectedCallback() {
    this.loadSessions();
  }

  async loadSessions() {
    try {
      this.loading = true;
      this.error = null;
      this.render();
      
      // Load chat sessions from the database
      const response = await FIBER.data.listItems('chats', {
        limit: 100,
        sort: [{ field: 'created_at', direction: 'desc' }]
      });
      
      this.sessions = response.items || [];
      this.loading = false;
      this.render();
      
      // Emit event with loaded sessions
      this.dispatchEvent(new CustomEvent('sessions-loaded', {
        detail: { sessions: this.sessions },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      this.error = error;
      this.loading = false;
      this.render();
    }
  }

  // Add method to set current chat ID programmatically
  setCurrentChatId(chatId) {
    this.currentChatId = chatId;
    this.render();
  }

  // Add method to refresh sessions (useful when new sessions are created)
  async refreshSessions() {
    await this.loadSessions();
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

  render() {
    this.shadowRoot.innerHTML = `
    
      <style>
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .session-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }
        .session-item:hover {
          background-color: #f3f4f6;
        }
        .session-item.active {
          background-color: #ede9fe;
          border-left: 3px solid var(--primary-color);
        }
        .loading-container {
          display: flex;
          justify-content: center;
          padding: 1rem;
        }
        .error-message {
          color: var(--error-color);
          padding: 1rem;
          text-align: center;
        }
        .session-info {
          flex: 1;
          min-width: 0;
        }
        .session-title {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .session-input {
          width: 100%;
          padding: 2px 4px;
          border: 1px solid #4285f4;
          border-radius: 3px;
          font-size: 14px;
        }
        .session-date {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .edit-icon {
          opacity: 0;
          color: #666;
          cursor: pointer;
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          transition: opacity 0.2s;
          background: none;
          border: none;
          font-size: 14px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background-color: #f0f0f0;
        }
        .session-item:hover .edit-icon {
          opacity: 1;
        }
        .edit-icon:hover {
          background-color: #e0e0e0;
          color: #333;
        }
      </style>
      
      ${this.loading ? `
        <div class="loading-container">
          <div class="spinner"></div>
        </div>
      ` : this.error ? `
        <div class="error-message">
          Failed to load sessions: ${this.error.message}
          <button class="retry-btn">Retry</button>
        </div>
      ` : `
        <div class="sessions-list">
          ${this.sessions.map(session => `
            <div class="session-item ${session.item_id === this.currentChatId ? 'active' : ''}" 
                 data-chat-id="${session.item_id}">
              <i class="fas fa-comments"></i>
              <div class="session-info">
                ${this.editingSessionId === session.item_id ? 
                  `<input class="session-input" type="text" value="${session.data.title}" data-session-id="${session.item_id}">` :
                  `<div class="session-title">${session.data.title}</div>`
                }
                <div class="session-date">${this.formatDate(session.created_at)}</div>
              </div>
              <button class="edit-icon" title="Edit title" data-action="edit" data-chat-id="${session.item_id}">
                <i class="fas fa-pencil-alt"></i>
              </button>
            </div>
          `).join('')}
        </div>
      `}
    `;

    // Set up click handlers for session selection
    this.shadowRoot.querySelectorAll('.session-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Only select the chat if we're not clicking the edit button or editing input
        if (!e.target.closest('.edit-icon') && !e.target.closest('.session-input')) {
          const chatId = item.dataset.chatId;
          this.currentChatId = chatId; 
          
          console.log('Dispatching chat-selected event with chatId:', chatId);
          const event = new CustomEvent('chat-selected', {
            detail: { chatId },
            bubbles: true,
            composed: true
          });
          this.dispatchEvent(event);
        }
      });
    });
    
    // Set up handlers for edit icons
    this.shadowRoot.querySelectorAll('.edit-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent chat selection
        const chatId = icon.dataset.chatId;
        this.editingSessionId = chatId;
        this.render();
        
        // Focus the input after rendering
        setTimeout(() => {
          const input = this.shadowRoot.querySelector('.session-input');
          if (input) {
            input.focus();
            input.select();
          }
        }, 10);
      });
    });
    
    // Set up handlers for title input fields
    this.shadowRoot.querySelectorAll('.session-input').forEach(input => {
      // Save on Enter key
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const sessionId = input.dataset.sessionId;
          const newTitle = input.value.trim();
          
          if (newTitle) {
            await this.updateSessionTitle(sessionId, newTitle);
          }
          
          this.editingSessionId = null;
          this.render();
        } else if (e.key === 'Escape') {
          // Cancel editing on Escape
          this.editingSessionId = null;
          this.render();
        }
      });
      
      // Save on blur (when focus is lost)
      input.addEventListener('blur', async () => {
        const sessionId = input.dataset.sessionId;
        const newTitle = input.value.trim();
        
        if (newTitle) {
          await this.updateSessionTitle(sessionId, newTitle);
        }
        
        this.editingSessionId = null;
        this.render();
      });
    });
  }
  
  async updateSessionTitle(sessionId, newTitle) {
    try {
      // Find the session in our local array
      const session = this.sessions.find(s => s.item_id === sessionId);
      if (!session) return;
      
      // Update the session in the database
      await FIBER.data.updateItem('chats', sessionId, { 
        ...session.data,
        title: newTitle 
      });
      
      // Update our local copy
      session.data.title = newTitle;
      
      // Dispatch an event to notify other components
      this.dispatchEvent(new CustomEvent('session-updated', {
        detail: { sessionId, newTitle },
        bubbles: true,
        composed: true
      }));
      
      console.log(`Updated session ${sessionId} title to "${newTitle}"`);
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  }
}

customElements.define('chat-list', ChatList);
