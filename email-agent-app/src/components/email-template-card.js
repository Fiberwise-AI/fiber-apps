import Mustache from 'mustache';

export class EmailTemplateCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.template = null;
  }
  
  static get observedAttributes() {
    return ['template-id', 'template-name', 'description'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    // Get template data from attributes
    const templateId = this.getAttribute('template-id');
    const templateName = this.getAttribute('template-name') || 'Unnamed Template';
    const description = this.getAttribute('description') || 'No description';
    const isSelected = this.hasAttribute('selected');
    
    // Define our Mustache-style template
    const htmlTemplate = `
      <div class="template-card {{#isSelected}}selected{{/isSelected}}">
        <div class="template-name">{{templateName}}</div>
        <div class="template-description">{{description}}</div>
        
        {{#showPreview}}
        <div class="template-preview">{{preview}}</div>
        {{/showPreview}}
        
        <div class="template-actions">
          <button class="action-button" title="Apply Template" data-action="apply">
            <i class="fas fa-play"></i>
          </button>
          <button class="action-button" title="Edit Template" data-action="edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-button" title="Delete Template" data-action="delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    // Define the CSS styles
    const styles = `
      <style>
        .template-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        
        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.12);
        }
        
        .template-card.selected {
          border: 2px solid #4f46e5;
        }
        
        .template-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #111827;
        }
        
        .template-description {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0 0 1rem 0;
          flex-grow: 1;
        }
        
        .template-preview {
          font-size: 0.75rem;
          color: #6b7280;
          background-color: #f9fafb;
          padding: 0.75rem;
          border-radius: 0.375rem;
          white-space: pre-wrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          max-height: 4.5rem;
          margin-bottom: 1rem;
        }
        
        .template-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        
        .action-button {
          padding: 0.5rem;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          border-radius: 0.25rem;
        }
        
        .action-button:hover {
          background-color: #f9fafb;
          color: #111827;
        }
      </style>
    `;
    
    // Prepare data for the template
    const templateData = {
      templateId,
      templateName,
      description,
      isSelected,
      showPreview: this.hasAttribute('preview'),
      preview: this.getAttribute('preview') || 'No preview available'
    };
    
    // Process the template with Mustache instead of processTemplate
    const processedHTML = Mustache.render(htmlTemplate, templateData);
    
    // Set the processed HTML
    this.shadowRoot.innerHTML = styles + processedHTML;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  addEventListeners() {
    const card = this.shadowRoot.querySelector('.template-card');
    if (card) {
      card.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('template-selected', {
          bubbles: true,
          composed: true,
          detail: { templateId: this.getAttribute('template-id') }
        }));
      });
    }
    
    const actionButtons = this.shadowRoot.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        
        const action = button.dataset.action;
        this.dispatchEvent(new CustomEvent(`template-${action}`, {
          bubbles: true,
          composed: true,
          detail: { 
            templateId: this.getAttribute('template-id'),
            templateName: this.getAttribute('template-name')
          }
        }));
      });
    });
  }
}

customElements.define('email-template-card', EmailTemplateCard);
