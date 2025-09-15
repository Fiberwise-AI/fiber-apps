/**
 * Create Project Action
 * Floating action button for creating new projects
 */

export class CreateProjectAction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  addEventListeners() {
    const actionButton = this.shadowRoot.querySelector('.action-button');
    if (actionButton) {
      actionButton.addEventListener('click', this.handleClick.bind(this));
    }
  }
  
  removeEventListeners() {
    const actionButton = this.shadowRoot.querySelector('.action-button');
    if (actionButton) {
      actionButton.removeEventListener('click', this.handleClick.bind(this));
    }
  }
  
  handleClick() {
    // Navigate to new project route
    if (window.router) {
      window.router.navigate('/projects/new');
    }
  }

  render() {
    const title = this.getAttribute('title') || 'Create New Project';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .action-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: var(--color-primary, #0066cc);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          position: relative;
        }
        
        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          background-color: var(--color-primary-dark, #0056b3);
        }
        
        .action-button i {
          font-size: 24px;
        }
        
        .tooltip {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          white-space: nowrap;
        }
        
        .action-button:hover .tooltip {
          opacity: 1;
        }
      </style>
      
      <button class="action-button" aria-label="${title}">
        <i class="fas fa-plus"></i>
        <span class="tooltip">${title}</span>
      </button>
    `;
  }
}

customElements.define('create-project-action', CreateProjectAction);
