import { emailService } from '../services/email-service.js';
import { dataService } from '../services/data-service.js';
import { FIBER } from '../../index.js';
import './email-detail.js';

export class EmailDetailPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.connectionId = null;
    this.messageId = null;
    this.loading = true;
    this.error = null;
    this.email = null;
  }

  async connectedCallback() {
    if (!this.initialized) {
      this.initialized = true;
      
      // Extract route params first
      this.extractRouteParams();
      this.render();
      
      // Connect to realtime after rendering
      try {
        await FIBER.realtime.connect();
        console.log('[EmailDetailPage] Realtime connection established');
        
        // Set up realtime message listeners
        FIBER.realtime.on('message', (message) => {
          this.handleRealtimeMessage(message);
        });
      } catch (error) {
        console.error('[EmailDetailPage] Failed to connect to realtime:', error);
      }
      
      // Load email if we have valid params
      if (this.connectionId && this.messageId) {
        this.loadEmail();
      } else {
        this.error = 'Invalid email URL - missing connection or message ID';
        this.loading = false;
        this.render();
      }
    }
  }

  extractRouteParams() {
    const routeParams = FIBER.router.getParams();
    console.log('Route params:', routeParams);
    
    if (routeParams.connectionId && routeParams.messageId) {
      this.connectionId = routeParams.connectionId;
      this.messageId = routeParams.messageId;
    }
  }

  async loadEmail() {
    try {
      this.loading = true;
      this.render();

      const response = await emailService.getEmail(this.connectionId, this.messageId);
      
      if (response && response.status === 'success') {
        this.email = response.result;
        this.error = null;
      } else {
        this.error = (response && response.message) || 'Failed to load email';
        this.email = null;
      }
    } catch (error) {
      console.error('Error loading email:', error);
      this.error = error.message || 'An error occurred while loading the email';
      this.email = null;
    } finally {
      this.loading = false;
      this.render();
    }
  }

  handleBack() {
    FIBER.router.navigate('/');
  }

  handleReply() {
    FIBER.router.navigate('/', { 
      compose: 'reply', 
      messageId: this.messageId, 
      connectionId: this.connectionId 
    });
  }

  handleRealtimeMessage(message) {
    console.log('[EmailDetailPage] Received realtime message:', message);
    
    // Handle task progress updates for this specific email
    if (message.type === 'task_progress') {
      const taskId = message.task_id;
      
      // Check if this update is for the current email being analyzed
      if (taskId && taskId.includes(this.messageId)) {
        console.log('[EmailDetailPage] Task progress for current email:', message);
        
        // Find the email-detail component and update its progress
        const emailDetailComponent = this.shadowRoot.querySelector('email-detail');
        if (emailDetailComponent) {
          emailDetailComponent.updateTaskProgress(message);
        }
        
        // Show notification for significant progress updates
        if (message.status === 'completed') {
          this.showNotification('Email analysis completed successfully!', 'success');
        } else if (message.status === 'failed') {
          this.showNotification('Email analysis failed', 'error');
        }
      }
    }
  }

  showNotification(message, type = 'info') {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      z-index: 1000;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --primary-color: #4f46e5;
          --secondary-color: #6b7280;
          --background-color: #f9fafb;
          --surface-color: #ffffff;
          --border-color: #e5e7eb;
          --text-primary: #111827;
          --text-secondary: #4b5563;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background-color: var(--background-color);
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: var(--surface-color);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-primary);
          text-decoration: none;
          transition: background-color 0.2s;
        }

        .back-button:hover {
          background-color: var(--border-color);
        }

        .page-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .breadcrumb {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .breadcrumb a {
          color: var(--primary-color);
          text-decoration: none;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: var(--text-secondary);
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid var(--border-color);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-container {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 0.5rem;
          padding: 1.5rem;
          color: #b91c1c;
          text-align: center;
        }

        .error-title {
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .error-message {
          margin: 0;
          font-size: 0.875rem;
        }

        .email-content {
          background-color: var(--surface-color);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .url-info {
          background-color: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #0c4a6e;
        }

        .url-info strong {
          font-weight: 600;
        }
      </style>

      <div class="page-container">
        <div class="page-header">
          <button class="back-button" id="back-button">
            <i class="fas fa-arrow-left"></i>
            Back to Inbox
          </button>
          <div>
            <h1 class="page-title">Email Details</h1>
            <div class="breadcrumb">
              <a href="/email-agent-app">Email App</a> / 
              Email Details
            </div>
          </div>
        </div>

        ${this.connectionId && this.messageId ? `
          <div class="url-info">
            <strong>Direct Link:</strong> This email can be bookmarked and shared using this URL.
            Connection: ${this.connectionId} | Message: ${this.messageId}
          </div>
        ` : ''}

        ${this.loading ? `
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading email details...</p>
          </div>
        ` : this.error ? `
          <div class="error-container">
            <div class="error-title">Unable to Load Email</div>
            <div class="error-message">${this.error}</div>
          </div>
        ` : this.email ? `
          <div class="email-content">
            <email-detail 
              connection-id="${this.connectionId}" 
              message-id="${this.messageId}">
            </email-detail>
          </div>
        ` : `
          <div class="error-container">
            <div class="error-title">Invalid Email URL</div>
            <div class="error-message">Please check the URL and try again.</div>
          </div>
        `}
      </div>
    `;

    // Add event listeners
    const backButton = this.shadowRoot.querySelector('#back-button');
    if (backButton) {
      backButton.addEventListener('click', () => this.handleBack());
    }

    // Listen for events from the email-detail component
    const emailDetail = this.shadowRoot.querySelector('email-detail');
    if (emailDetail) {
      emailDetail.addEventListener('reply-click', () => this.handleReply());
    }
  }
}

customElements.define('email-detail-page', EmailDetailPage);