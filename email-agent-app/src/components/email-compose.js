import { emailService } from '../services/email-service.js';

export class EmailCompose extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.authenticatorId = null;
    this.replyToMessageId = null;
    this.originalEmail = null;
    this.loading = false;
    this.sending = false;
    this.error = null;
    
    // Email fields
    this.emailData = {
      to: '',
      subject: '',
      body: '',
      cc: '',
      bcc: ''
    };
  }
  
  static get observedAttributes() {
    return ['connection-id', 'reply-to-message-id'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'connection-id' && oldValue !== newValue) {
      this.connectionId = newValue;
    } else if (name === 'reply-to-message-id' && oldValue !== newValue) {
      this.replyToMessageId = newValue;
      if (this.replyToMessageId && this.connectionId) {
        this.loadOriginalEmail();
      }
    }
  }
  
  connectedCallback() {
    this.connectionId = this.getAttribute('connection-id');
    this.replyToMessageId = this.getAttribute('reply-to-message-id');
    this.render();
    
    if (this.replyToMessageId && this.connectionId) {
      this.loadOriginalEmail();
    }
  }
  
  async loadOriginalEmail() {
    try {
      this.loading = true;
      this.render();
      
      const response = await emailService.getEmail(this.connectionId, this.replyToMessageId);
      
      if (response && response.status === 'success') {
        this.originalEmail = response.result;
        this.populateReplyFields();
      } else {
        this.error = (response && response.message) || 'Failed to load original email';
      }
    } catch (error) {
      console.error('Error loading original email:', error);
      this.error = error.message || 'An error occurred while loading the original email';
    } finally {
      this.loading = false;
      this.render();
    }
  }
  
  populateReplyFields() {
    if (!this.originalEmail) return;
    
    // Set the recipient to the original sender
    this.emailData.to = this.originalEmail.sender;
    
    // Set the subject (add Re: if not already present)
    const subject = this.originalEmail.subject || '';
    this.emailData.subject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    
    // Create a reply body template
    const date = new Date(this.originalEmail.date).toLocaleString();
    const originalText = this.originalEmail.body_text || '';
    const quotedText = originalText.split('\n').map(line => `> ${line}`).join('\n');
    
    this.emailData.body = `\n\n\nOn ${date}, ${this.originalEmail.sender} wrote:\n${quotedText}`;
  }
  
  handleInputChange(field, value) {
    this.emailData[field] = value;
  }
  
  async handleSend(asDraft = false) {
    const { to, subject, body, cc, bcc } = this.emailData;
    
    if (!to) {
      this.error = 'Recipient is required';
      this.render();
      return;
    }
    
    try {
      this.sending = true;
      this.error = null;
      this.render();
      
      let response;
      if (asDraft) {
        response = await emailService.createDraft(
          this.connectionId,
          to,
          subject,
          body,
          cc,
          bcc,
          this.replyToMessageId
        );
      } else {
        response = await emailService.sendEmail(
          this.connectionId,
          to,
          subject,
          body,
          cc,
          bcc,
          this.replyToMessageId
        );
      }
      
      if (response && response.status === 'success') {
        // Dispatch success notification
        this.dispatchEvent(new CustomEvent('notification', {
          bubbles: true,
          composed: true,
          detail: { 
            message: asDraft ? 'Draft saved successfully' : 'Email sent successfully',
            type: 'success'
          }
        }));
        
        // Dispatch email-sent event to navigate back to inbox
        this.dispatchEvent(new CustomEvent('email-sent', {
          bubbles: true,
          composed: true,
          detail: { asDraft }
        }));
        
        // Clear form
        this.resetForm();
      } else {
        this.error = (response && response.message) || `Failed to ${asDraft ? 'save draft' : 'send email'}`;
      }
    } catch (error) {
      console.error(`Error ${asDraft ? 'saving draft' : 'sending email'}:`, error);
      this.error = error.message || `An error occurred while ${asDraft ? 'saving draft' : 'sending email'}`;
    } finally {
      this.sending = false;
      this.render();
    }
  }
  
  resetForm() {
    this.emailData = {
      to: '',
      subject: '',
      body: '',
      cc: '',
      bcc: ''
    };
  }
  
  handleCancel() {
    // Dispatch cancel event to navigate back
    this.dispatchEvent(new CustomEvent('compose-cancelled', {
      bubbles: true,
      composed: true
    }));
  }
  
  toggleCcBcc() {
    const ccBccFields = this.shadowRoot.querySelector('.cc-bcc-fields');
    if (ccBccFields) {
      const isVisible = ccBccFields.style.display !== 'none';
      ccBccFields.style.display = isVisible ? 'none' : 'block';
    }
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .compose-container {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .compose-header {
          padding: 1.25rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .compose-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }
        
        .compose-form {
          padding: 1.25rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-row {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.5rem 0;
        }
        
        .form-label {
          width: 5rem;
          font-weight: 500;
          color: #374151;
        }
        
        .form-control {
          flex: 1;
          border: none;
          outline: none;
          padding: 0.5rem;
          font-size: 0.875rem;
          font-family: inherit;
        }
        
        .cc-bcc-toggle {
          margin-left: 5rem;
          color: #4f46e5;
          font-size: 0.875rem;
          cursor: pointer;
        }
        
        .cc-bcc-toggle:hover {
          text-decoration: underline;
        }
        
        .cc-bcc-fields {
          display: none;
        }
        
        .email-body {
          margin-top: 1rem;
        }
        
        .body-textarea {
          width: 100%;
          height: 300px;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          outline: none;
          resize: vertical;
          font-family: inherit;
          font-size: 0.875rem;
        }
        
        .form-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        
        .action-button {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          cursor: pointer;
        }
        
        .send-button {
          background-color: #4f46e5;
          color: white;
          border: none;
        }
        
        .send-button:hover {
          background-color: #4338ca;
        }
        
        .draft-button, .cancel-button {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #374151;
        }
        
        .draft-button:hover, .cancel-button:hover {
          background-color: #e5e7eb;
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
        
        .error-message {
          padding: 0.75rem;
          margin-bottom: 1rem;
          background-color: #fee2e2;
          border-radius: 0.375rem;
          color: #b91c1c;
        }
      </style>
      
      <div class="compose-container">
        <div class="compose-header">
          <h2 class="compose-title">${this.replyToMessageId ? 'Reply to Email' : 'Compose New Email'}</h2>
        </div>
        
        ${this.loading ? `
          <div class="loading-container">
            <div class="spinner"></div>
            <div>Loading original email...</div>
          </div>
        ` : `
          <div class="compose-form">
            ${this.error ? `
              <div class="error-message">${this.error}</div>
            ` : ''}
            
            <div class="form-group">
              <div class="form-row">
                <div class="form-label">To:</div>
                <input 
                  type="text" 
                  id="to-field" 
                  class="form-control" 
                  placeholder="Recipients" 
                  value="${this.emailData.to}"
                >
              </div>
              
              <div class="cc-bcc-toggle" id="cc-bcc-toggle">
                Add Cc/Bcc
              </div>
              
              <div class="cc-bcc-fields">
                <div class="form-row">
                  <div class="form-label">Cc:</div>
                  <input 
                    type="text" 
                    id="cc-field" 
                    class="form-control" 
                    placeholder="Carbon copy recipients" 
                    value="${this.emailData.cc}"
                  >
                </div>
                <div class="form-row">
                  <div class="form-label">Bcc:</div>
                  <input 
                    type="text" 
                    id="bcc-field" 
                    class="form-control" 
                    placeholder="Blind carbon copy recipients" 
                    value="${this.emailData.bcc}"
                  >
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-label">Subject:</div>
                <input 
                  type="text" 
                  id="subject-field" 
                  class="form-control" 
                  placeholder="Subject" 
                  value="${this.emailData.subject}"
                >
              </div>
            </div>
            
            <div class="email-body">
              <textarea 
                id="body-field" 
                class="body-textarea" 
                placeholder="Compose your email..."
              >${this.emailData.body}</textarea>
            </div>
            
            <div class="form-actions">
              <button class="action-button cancel-button" id="cancel-button">
                <i class="fas fa-times"></i> Cancel
              </button>
              <button class="action-button draft-button" id="draft-button" ${this.sending ? 'disabled' : ''}>
                <i class="fas fa-save"></i> Save Draft
              </button>
              <button class="action-button send-button" id="send-button" ${this.sending ? 'disabled' : ''}>
                ${this.sending ? `
                  <div class="spinner"></div> Sending...
                ` : `
                  <i class="fas fa-paper-plane"></i> Send
                `}
              </button>
            </div>
          </div>
        `}
      </div>
    `;
    
    // Add event listeners
    if (!this.loading) {
      // Field input handlers
      this.shadowRoot.querySelector('#to-field')?.addEventListener('input', (e) => {
        this.handleInputChange('to', e.target.value);
      });
      
      this.shadowRoot.querySelector('#cc-field')?.addEventListener('input', (e) => {
        this.handleInputChange('cc', e.target.value);
      });
      
      this.shadowRoot.querySelector('#bcc-field')?.addEventListener('input', (e) => {
        this.handleInputChange('bcc', e.target.value);
      });
      
      this.shadowRoot.querySelector('#subject-field')?.addEventListener('input', (e) => {
        this.handleInputChange('subject', e.target.value);
      });
      
      this.shadowRoot.querySelector('#body-field')?.addEventListener('input', (e) => {
        this.handleInputChange('body', e.target.value);
      });
      
      // Action buttons
      this.shadowRoot.querySelector('#cancel-button')?.addEventListener('click', () => {
        this.handleCancel();
      });
      
      this.shadowRoot.querySelector('#draft-button')?.addEventListener('click', () => {
        this.handleSend(true);
      });
      
      this.shadowRoot.querySelector('#send-button')?.addEventListener('click', () => {
        this.handleSend(false);
      });
      
      // CC/BCC toggle
      this.shadowRoot.querySelector('#cc-bcc-toggle')?.addEventListener('click', () => {
        this.toggleCcBcc();
      });
    }
  }
}

customElements.define('email-compose', EmailCompose);
