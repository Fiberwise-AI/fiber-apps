import { FIBER } from '../../index.js';
import { emailService } from '../services/email-service.js';

export class EmailSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.authenticatorId = null;
    this.searchLabel = 'INBOX';
    this.searchParams = {
      query: '',
      maxResults: 50,
      daysBack: 30
    };
    this.loading = false;
    this.error = null;
    this.emails = [];
  }
  
  static get observedAttributes() {
    return ['connection-id', 'search-label'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    // Only reload emails if this is an actual change (not initial setting)
    if (name === 'connection-id' && oldValue !== newValue && oldValue !== null) {
      this.connectionId = newValue;
      this.emails = [];
      this.render();
    } else if (name === 'search-label' && oldValue !== newValue && oldValue !== null) {
      this.searchLabel = newValue;
      this.emails = [];
      this.render();
    }
  }
  
  connectedCallback() {
    this.connectionId = this.getAttribute('connection-id');
    this.searchLabel = this.getAttribute('search-label') || 'INBOX';
    this.render();
    
    // Only try to load cached messages on connect (no OAuth calls)
    if (this.connectionId) {
      this.loadCachedMessagesOnly();
    }
  }
  
  async searchEmails() {
    if (!this.connectionId) return;
    
    try {
      this.loading = true;
      this.render();
      
      const response = await emailService.searchEmails(
        this.connectionId,
        this.searchParams.query,
        this.searchParams.maxResults,
        this.searchLabel,
        this.searchParams.daysBack
      );
      
      if (response && response.status === 'success') {
        this.emails = response.result.messages || [];
        this.error = null;
      } else {
        this.error = (response && response.message) || 'Failed to search emails';
        this.emails = [];
      }
    } catch (error) {
      console.error('Error searching emails:', error);
      this.error = error.message || 'An error occurred while searching';
      this.emails = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }
  
  async loadRecentEmails(limit) {
    if (!this.connectionId) return;
    
    try {
      this.loading = true;
      this.render();
      
      // Call the function directly instead of using the agent
      const result = await FIBER.func.activate('get_recent_emails', {
        authenticator_id: this.connectionId,
        limit: limit,
        label: this.searchLabel
      });
      
      if (result && result.status === 'completed' && result.result && result.result.status === 'success') {
        this.emails = result.result.messages || [];
        this.searchParams.maxResults = limit;
        this.error = null;
      } else {
        this.error = (result.result && result.result.message) || result.message || 'Failed to load recent emails';
        this.emails = [];
      }
    } catch (error) {
      console.error('Error loading recent emails:', error);
      this.error = error.message || 'An error occurred while loading emails';
      this.emails = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async loadCachedMessagesOnly() {
    if (!this.connectionId) return;
    
    try {
      this.loading = true;
      this.render();
      
      // Only load from cached messages, no OAuth fallback
      const cachedEmails = await this.loadCachedMessages(this.searchParams.maxResults);
      
      this.emails = cachedEmails || [];
      this.error = null;
      
    } catch (error) {
      console.error('Error loading cached messages only:', error);
      this.emails = [];
      this.error = null; // Don't show error, just show empty state
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async loadEmailsWithCaching(limit) {
    if (!this.connectionId) return;
    
    try {
      this.loading = true;
      this.render();
      
      // First, try to load from cached messages
      const cachedEmails = await this.loadCachedMessages(limit);
      
      if (cachedEmails && cachedEmails.length > 0) {
        this.emails = cachedEmails;
        this.searchParams.maxResults = limit;
        this.error = null;
        this.loading = false;
        this.render();
        return;
      }
      
      // If no cached messages, fallback to loading recent emails
      console.log('No cached messages found, loading from provider...');
      await this.loadRecentEmails(limit);
      
    } catch (error) {
      console.error('Error loading emails with caching:', error);
      // Fallback to loading recent emails if caching fails
      await this.loadRecentEmails(limit);
    }
  }

  async loadCachedMessages(limit) {
    try {
      // Load cached messages using FIBER.data.listItems
      const result = await FIBER.data.listItems('cached_messages', {
        limit: limit * 2 // Get more to account for filtering
        // Note: removed sort parameter as API doesn't support it yet
      });
      
      if (result && result.items) {
        // Filter by connection and label client-side
        const filteredMessages = result.items
          .filter(msg => 
            msg.data.connection_id === this.connectionId && 
            msg.data.labels && msg.data.labels.includes(this.searchLabel)
          )
          .map(msg => ({
            id: msg.data.message_id,
            subject: msg.data.subject,
            sender: msg.data.sender,
            from: msg.data.sender,
            date: msg.data.message_date,
            snippet: msg.data.body_preview
          }))
          .sort((a, b) => {
            // Sort by message date, newest first
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          })
          .slice(0, limit); // Limit to requested amount after sorting
        
        console.log(`Loaded ${filteredMessages.length} cached messages`);
        return filteredMessages;
      }
      
      return [];
      
    } catch (error) {
      console.error('Error loading cached messages:', error);
      return [];
    }
  }
  
  handleSearch() {
    this.searchEmails();
  }
  
  handleResultsLimitChange(limit) {
    // Only load from cache when changing limits (no OAuth calls)
    this.searchParams.maxResults = limit;
    this.loadCachedMessagesOnly();
  }
  
  handleMessageClick(messageId) {
    this.dispatchEvent(new CustomEvent('message-selected', {
      bubbles: true,
      composed: true,
      detail: { messageId }
    }));
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show the full date
    return date.toLocaleDateString();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .search-container {
          display: flex;
          margin-bottom: 1rem;
        }
        
        .search-input {
          flex: 1;
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem 0 0 0.375rem;
          font-size: 0.875rem;
        }
        
        .search-button {
          padding: 0.5rem 1rem;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 0 0.375rem 0.375rem 0;
          cursor: pointer;
          font-weight: 500;
        }
        
        .search-button:hover {
          background-color: #4338ca;
        }
        
        .emails-list {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          overflow: hidden;
        }
        
        .email-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }
        
        .email-item:last-child {
          border-bottom: none;
        }
        
        .email-item:hover {
          background-color: #f9fafb;
        }
        
        .email-item.unread {
          background-color: #f3f4f6;
        }
        
        .email-item.unread .sender {
          font-weight: 600;
        }
        
        .email-status {
          display: flex;
          align-items: center;
          margin-right: 0.75rem;
          color: #6b7280;
        }
        
        .email-status .starred {
          color: #f59e0b;
        }
        
        .email-content {
          flex: 1;
          min-width: 0;
        }
        
        .sender {
          font-size: 0.875rem;
          color: #111827;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .subject {
          font-size: 0.875rem;
          color: #374151;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .preview {
          font-size: 0.75rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .email-date {
          font-size: 0.75rem;
          color: #6b7280;
          margin-left: 1rem;
          white-space: nowrap;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
        }
        
        .spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid rgba(79, 70, 229, 0.1);
          border-radius: 50%;
          border-top-color: #4f46e5;
          animation: spin 1s linear infinite;
          margin-right: 0.75rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container {
          padding: 1rem;
          background-color: #fee2e2;
          border-radius: 0.375rem;
          color: #b91c1c;
          margin-bottom: 1rem;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
        
        .results-limit-controls {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
        }
        
        .limit-button {
          padding: 0.25rem 0.5rem;
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .limit-button.active {
          background-color: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }
        
        .load-emails-button {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto 1rem auto;
          transition: background-color 0.2s;
        }
        
        .load-emails-button:hover {
          background-color: #4338ca;
        }
        
        .empty-state p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }
      </style>
      
      <div class="results-limit-controls">
        <button class="limit-button ${this.searchParams.maxResults === 10 ? 'active' : ''}" data-limit="10">10</button>
        <button class="limit-button ${this.searchParams.maxResults === 50 ? 'active' : ''}" data-limit="50">50</button>
        <button class="limit-button ${this.searchParams.maxResults === 100 ? 'active' : ''}" data-limit="100">100</button>
      </div>
      
      <div class="search-container">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search emails..." 
          value="${this.searchParams.query}"
        >
        <button class="search-button" id="search-button">
          <i class="fas fa-search"></i>
        </button>
      </div>
      
      ${this.error ? `
        <div class="error-container">
          ${this.error}
        </div>
      ` : ''}
      
      ${this.loading ? `
        <div class="loading-container">
          <div class="spinner"></div>
          <div>Loading emails...</div>
        </div>
      ` : this.emails.length === 0 ? `
        <div class="empty-state">
          <button class="load-emails-button" id="load-emails-button">
            <i class="fas fa-envelope"></i> Load Recent Emails
          </button>
          <p>Click to load recent emails from ${this.searchLabel}</p>
        </div>
      ` : `
        <div class="emails-list">
          ${this.emails.map(email => `
            <div class="email-item ${email.is_unread ? 'unread' : ''}" data-id="${email.id}">
              <div class="email-status">
                <i class="fas ${email.is_starred ? 'fa-star starred' : 'fa-regular fa-star'}"></i>
              </div>
              <div class="email-content">
                <div class="sender">${email.sender || email.sender_name || email.from || ''}</div>
                <div class="subject">${email.subject || 'No subject'}</div>
                <div class="preview">${email.snippet || email.preview || ''}</div>
              </div>
              <div class="email-date">${this.formatDate(email.date)}</div>
            </div>
          `).join('')}
        </div>
      `}
    `;
    
    // Add event listeners
    const searchInput = this.shadowRoot.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchParams.query = e.target.value;
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }
    
    const searchButton = this.shadowRoot.querySelector('#search-button');
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        this.handleSearch();
      });
    }
    
    const emailItems = this.shadowRoot.querySelectorAll('.email-item');
    emailItems.forEach(item => {
      item.addEventListener('click', () => {
        this.handleMessageClick(item.dataset.id);
      });
    });
    
    // Add event listeners for limit buttons
    const limitButtons = this.shadowRoot.querySelectorAll('.limit-button');
    limitButtons.forEach(button => {
      button.addEventListener('click', () => {
        const limit = parseInt(button.dataset.limit);
        this.handleResultsLimitChange(limit);
      });
    });
    
    // Add event listener for load emails button
    const loadEmailsButton = this.shadowRoot.querySelector('#load-emails-button');
    if (loadEmailsButton) {
      loadEmailsButton.addEventListener('click', () => {
        // Always fetch fresh from OAuth (which saves to cache) 
        this.loadRecentEmails(this.searchParams.maxResults);
      });
    }
    
  }
}

customElements.define('email-search', EmailSearch);
