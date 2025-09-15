
import { emailService } from '../services/email-service.js';
import { dataService } from '../services/data-service.js';

export class EmailDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.email = null;
    this.analysis = null;
    this.analyzing = false;
    this.connectionId = null;
    this.messageId = null;
  }

  static get observedAttributes() {
    return ['connection-id', 'message-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'connection-id') {
      this.connectionId = newValue;
    } else if (name === 'message-id') {
      this.messageId = newValue;
    }
    
    // Load email when both attributes are available
    if (this.connectionId && this.messageId && (oldValue !== newValue)) {
      this.loadEmail(this.connectionId, this.messageId);
    }
  }

  connectedCallback() {
    this.connectionId = this.getAttribute('connection-id');
    this.messageId = this.getAttribute('message-id');
    this.render();
    
    // Load email if attributes are available
    if (this.connectionId && this.messageId) {
      this.loadEmail(this.connectionId, this.messageId);
    }
  }

  async loadEmail(connectionId, messageId) {
    try {
      console.log('Loading email:', connectionId, messageId);
      const response = await emailService.getEmail(connectionId, messageId);
      if (response && response.status === 'success') {
        this.email = response.result;
      } else {
        this.email = null;
        console.error('Failed to load email:', response);
      }
    } catch (error) {
      console.error('Error loading email:', error);
      this.email = null;
    }
    this.render();
  }

  async analyzeEmail(connectionId, messageId) {
    try {
      this.analyzing = true;
      this.render();
      
      const response = await emailService.analyzeEmail(connectionId, messageId);
      
      if (response && response.status === 'success') {
        this.analysis = response.result.analysis;
        this.showAnalysis = true;
        
        // Save analysis to data store
        try {
          const analysisData = {
            connection_id: connectionId,
            message_id: messageId,
            subject: this.email.subject,
            sender: this.email.sender,
            summary: this.analysis.summary,
            sentiment: this.analysis.sentiment,
            priority: this.analysis.priority,
            topics: this.analysis.topics,
            action_items: this.analysis.action_items,
            suggested_labels: this.analysis.suggested_labels,
            template_used: response.result.template_used || 'default'
          };
          
          await dataService.saveEmailAnalysis(analysisData);
        } catch (saveError) {
          console.error('Error saving analysis:', saveError);
          // Continue even if saving fails
        }
      } else {
        this.dispatchEvent(new CustomEvent('notification', {
          bubbles: true,
          composed: true,
          detail: { 
            message: (response && response.message) || 'Failed to analyze email',
            type: 'error'
          }
        }));
        this.analysis = null;
      }
    } catch (error) {
      // ...existing error handling...
    } finally {
      this.analyzing = false;
      this.render();
    }
  }

  handleReply() {
    if (this.email) {
      this.dispatchEvent(new CustomEvent('reply-click', {
        bubbles: true,
        composed: true,
        detail: { messageId: this.messageId }
      }));
    }
  }


  toggleStar() {
    // Toggle star action
  }

  toggleImportant() {
    // Toggle important action
  }

  markAsRead() {
    // Mark as read action
  }

  markAsUnread() {
    // Mark as unread action
  }

  toggleAnalysisView() {
    if (this.analysis) {
      this.analysis = null;
      this.render();
    } else if (this.connectionId && this.messageId) {
      this.analyzeEmail(this.connectionId, this.messageId);
    }
  }

  updateTaskProgress(progressData) {
    console.log('[EmailDetail] Received task progress update:', progressData);
    
    // Update analyzing state and progress
    if (progressData.status === 'started' || progressData.status === 'fetching' || 
        progressData.status === 'processing' || progressData.status === 'analyzing' || 
        progressData.status === 'generating') {
      this.analyzing = true;
      this.currentProgress = progressData.progress || 0;
      this.currentStatus = progressData.message || 'Processing...';
    } else if (progressData.status === 'completed') {
      this.analyzing = false;
      this.currentProgress = 1;
      this.currentStatus = 'Analysis complete';
      
      // If we have analysis results in the progress data, use them
      if (progressData.result) {
        this.analysis = progressData.result;
      }
    } else if (progressData.status === 'failed') {
      this.analyzing = false;
      this.currentProgress = 0;
      this.currentStatus = 'Analysis failed';
    }
    
    // Re-render to show updated progress
    this.render();
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
          --success-color: #10b981;
          --error-color: #ef4444;
          --warning-color: #f59e0b;
        }
        
        .email-container {
          background-color: var(--surface-color);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        
        .email-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--surface-color);
        }
        
        .email-header h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .email-meta {
          display: grid;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .email-meta strong {
          color: var(--text-primary);
        }
        
        .email-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .action-button {
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .action-button:hover {
          background-color: #4338ca;
        }
        
        .action-button.secondary {
          background-color: var(--background-color);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        
        .action-button.secondary:hover {
          background-color: var(--border-color);
        }
        
        .progress-container {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        
        .progress-fill {
          height: 100%;
          background-color: var(--primary-color);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-status {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-align: center;
        }
        
        .analysis-container {
          padding: 1.5rem;
          background-color: #f8fafc;
          border-bottom: 1px solid var(--border-color);
        }
        
        .analysis-section {
          margin-bottom: 1rem;
        }
        
        .analysis-section:last-child {
          margin-bottom: 0;
        }
        
        .analysis-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .analysis-section p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        .email-body {
          padding: 1.5rem;
          line-height: 1.6;
          color: var(--text-primary);
        }
        
        .html-frame {
          width: 100%;
          border: none;
          min-height: 300px;
        }
        
        .email-labels {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background-color: var(--background-color);
        }
        
        .label-badge {
          padding: 0.25rem 0.5rem;
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .label-badge.system {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        
        .loading-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
        }
        
        .spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid var(--border-color);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      
      ${this.email ? `
        <div class="email-container">
          <div class="email-header">
            <h2>${this.email.subject || 'No subject'}</h2>
            <div class="email-meta">
              <div><strong>From:</strong> ${this.email.sender || this.email.from || 'Unknown sender'}</div>
              <div><strong>To:</strong> ${this.email.to || this.email.recipients || 'Unknown recipient'}</div>
              <div><strong>Date:</strong> ${this.email.date ? new Date(this.email.date).toLocaleString() : 'Unknown date'}</div>
            </div>
            <div class="email-actions">
              <button class="action-button" id="analyze-button" ${this.analyzing ? 'disabled' : ''}>
                <i class="fas ${this.analyzing ? 'fa-spinner fa-spin' : 'fa-brain'}"></i>
                ${this.analyzing ? 'Analyzing...' : 'Analyze Email'}
              </button>
              <button class="action-button secondary" id="reply-button">
                <i class="fas fa-reply"></i> Reply
              </button>
            </div>
            
            ${this.analyzing ? `
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${(this.currentProgress || 0) * 100}%"></div>
                </div>
                <div class="progress-status">${this.currentStatus || 'Processing...'}</div>
              </div>
            ` : ''}
          </div>
          
          ${this.analysis ? `
            <div class="analysis-container">
              <div class="analysis-section">
                <h4>Summary</h4>
                <p>${this.analysis.summary || 'No summary available'}</p>
              </div>
              
              <div class="analysis-section">
                <h4>Sentiment</h4>
                <p>${this.analysis.sentiment || 'Unknown'}</p>
              </div>
              
              <div class="analysis-section">
                <h4>Priority</h4>
                <p>${this.analysis.priority || 'Unknown'}</p>
              </div>
              
              ${this.analysis.suggested_reply ? `
                <div class="analysis-section">
                  <h4>Suggested Reply</h4>
                  <p>${this.analysis.suggested_reply}</p>
                </div>
              ` : ''}
              
              ${this.analysis.action_items && this.analysis.action_items.length > 0 ? `
                <div class="analysis-section">
                  <h4>Action Items</h4>
                  <ul style="margin: 0; padding-left: 1.5rem;">
                    ${this.analysis.action_items.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="email-body">
            ${this.email.body_html ? `
              <iframe srcdoc="${this.email.body_html.replace(/"/g, '&quot;')}" class="html-frame"></iframe>
            ` : `
              <div>${this.email.body_text ? this.email.body_text.replace(/\n/g, '<br>') : 'No content available'}</div>
            `}
          </div>
          
          ${this.email.labels && this.email.labels.length > 0 ? `
            <div class="email-labels">
              ${this.email.labels.map(label => {
                const isSystemLabel = ['INBOX', 'SENT', 'DRAFT', 'UNREAD', 'STARRED', 'IMPORTANT', 'SPAM', 'TRASH'].includes(label);
                return `<span class="label-badge ${isSystemLabel ? 'system' : ''}">${label}</span>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="email-container">
          <div class="loading-state">
            ${this.connectionId && this.messageId ? `
              <div class="spinner"></div>
              <p>Loading email...</p>
            ` : `
              <p>Select an email to view its contents.</p>
            `}
          </div>
        </div>
      `}
    `;
    
    // Add event listeners
    const analyzeButton = this.shadowRoot.querySelector('#analyze-button');
    if (analyzeButton && !this.analyzing) {
      analyzeButton.addEventListener('click', () => this.toggleAnalysisView());
    }
    
    const replyButton = this.shadowRoot.querySelector('#reply-button');
    if (replyButton) {
      replyButton.addEventListener('click', () => this.handleReply());
    }

    
    // Adjust iframe height if HTML content
    if (this.email && this.email.body_html) {
      const iframe = this.shadowRoot.querySelector('.html-frame');
      if (iframe) {
        iframe.onload = () => {
          try {
            iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 20 + 'px';
          } catch (e) {
            // Handle cross-origin issues
            iframe.style.height = '400px';
          }
        };
      }
    }
  }
}

if (!customElements.get('email-detail')) {
  customElements.define('email-detail', EmailDetail);
}
