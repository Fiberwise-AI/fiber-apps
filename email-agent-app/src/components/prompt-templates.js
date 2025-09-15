import { FIBER } from '../../index.js';
import { dataService } from '../services/data-service.js';
import './email-template-card.js';
import html from './prompt-templates.html?raw'; 
import Mustache from 'mustache'; // Import Mustache library

export class PromptTemplates extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.templates = [];
    this.loading = true;
    this.error = null;
    this.editingTemplate = null;
    this.selectedTemplateId = null;
  }

  connectedCallback() {
    this.render();
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      this.loading = true;
      this.render();

      // Load templates using the data service
      this.templates = await dataService.getPromptTemplates();
      this.error = null;
    } catch (error) {
      console.error('Error loading templates:', error);
      this.error = error.message || 'An error occurred while loading templates';
      this.templates = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async saveTemplate(template) {
    try {
      this.loading = true;
      this.render();

      const response = await dataService.savePromptTemplate(template);

      if (response && response.success) {
        this.editingTemplate = null;
        await this.loadTemplates();
        this.showNotification('Template saved successfully', 'success');
      } else {
        throw new Error(response?.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async deleteTemplate(templateId) {
    try {
      if (!confirm('Are you sure you want to delete this template?')) {
        return;
      }

      this.loading = true;
      this.render();

      const response = await dataService.deletePromptTemplate(templateId);

      if (response && response.success) {
        await this.loadTemplates();
        this.showNotification('Template deleted successfully', 'success');
      } else {
        throw new Error(response?.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async applyTemplateToAgent(templateId) {
    try {
      const template = this.templates.find(t => t.template_id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Update the template configuration using FIBER.data instead of agents.activate
      const response = await FIBER.data.update({
        model: 'agent_templates',
        where: { agent_id: 'email-agent' },
        data: {
          template_name: template.template_name,
          template_content: template.template_content,
          updated_at: new Date().toISOString()
        }
      });

      if (response && response.success) {
        this.showNotification(`Template "${template.template_name}" successfully applied`, 'success');
      } else {
        throw new Error(response?.message || 'Failed to apply template');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  editTemplate(template) {
    this.editingTemplate = template ? { ...template } : {
      template_name: '',
      template_content: '',
      description: ''
    };
    this.render();
  }

  cancelEdit() {
    this.editingTemplate = null;
    this.render();
  }

  selectTemplate(templateId) {
    this.selectedTemplateId = templateId === this.selectedTemplateId ? null : templateId;
    this.render();
  }

  handleTemplateFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const template = {
      template_id: this.editingTemplate.template_id,
      template_name: form.template_name.value,
      template_content: form.template_content.value,
      description: form.description.value
    };
    this.saveTemplate(template);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = this.shadowRoot.querySelector('.notification-container');
    if (container) {
      container.appendChild(notification);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    }
  }

  render() {
    // Create a Mustache-style template for the component
    const template = html;
    
    // Prepare data for the template
    const templateData = {
      loading: this.loading,
      error: this.error,
      editingTemplate: this.editingTemplate,
      templates: this.templates.map(template => ({
        ...template,
        selected: template.template_id === this.selectedTemplateId,
        // Truncate long content for preview
        preview_content: template.template_content.substring(0, 150) + 
                        (template.template_content.length > 150 ? '...' : '')
      }))
    };
    
    // Process the template with Mustache
    this.shadowRoot.innerHTML = Mustache.render(template, {
      ...templateData,
      // If editing, provide the template properties directly
      ...(this.editingTemplate || {})
    });
    
    // Add event listeners
    this.addEventListeners();
  }
  
  addEventListeners() {
    if (!this.loading) {
      if (this.editingTemplate) {
        // Template form listeners
        this.shadowRoot.querySelector('#template-form')?.addEventListener('submit', e => this.handleTemplateFormSubmit(e));
        this.shadowRoot.querySelector('#cancel-button')?.addEventListener('click', () => this.cancelEdit());
        
        // Example template buttons
        this.shadowRoot.querySelector('#use-example-1')?.addEventListener('click', () => {
          const templateContentField = this.shadowRoot.querySelector('#template_content');
          if (templateContentField) {
            templateContentField.value = `Analyze the following email:

From: {sender}
Date: {date}
Subject: {subject}

Body:
{body}

Please provide a structured analysis with:
1. A brief summary (2-3 sentences)
2. The main topics or themes (up to 5)
3. Detected sentiment (positive, negative, or neutral)
4. Priority level (high, medium, low)
5. Any action items or next steps required
6. Suggested reply if a response is needed
7. Suggested categories or labels for this email`;
          }
        });
        
        this.shadowRoot.querySelector('#use-example-2')?.addEventListener('click', () => {
          const templateContentField = this.shadowRoot.querySelector('#template_content');
          if (templateContentField) {
            templateContentField.value = `Create a brief, professional reply to the following email:

From: {sender}
Subject: {subject}

{body}

Keep the reply under 3 sentences. Be direct and helpful.
Sign off as {user_name}`;
          }
        });
        
        this.shadowRoot.querySelector('#use-example-3')?.addEventListener('click', () => {
          const templateContentField = this.shadowRoot.querySelector('#template_content');
          if (templateContentField) {
            templateContentField.value = `Summarize the following email conversation:

{email_thread}

Provide a concise summary covering:
1. The key participants
2. The main topics discussed
3. Any decisions made or conclusions reached
4. Outstanding questions or action items`;
          }
        });
      } else {
        // Add template button
        this.shadowRoot.querySelector('#add-template-button')?.addEventListener('click', () => this.editTemplate());
        
        // Listen for events from email-template-card components
        this.shadowRoot.addEventListener('template-selected', (e) => {
          this.selectTemplate(e.detail.templateId);
        });
        
        this.shadowRoot.addEventListener('template-edit', (e) => {
          const template = this.templates.find(t => t.template_id === e.detail.templateId);
          if (template) this.editTemplate(template);
        });
        
        this.shadowRoot.addEventListener('template-delete', (e) => {
          this.deleteTemplate(e.detail.templateId);
        });
        
        this.shadowRoot.addEventListener('template-apply', (e) => {
          this.applyTemplateToAgent(e.detail.templateId);
        });
      }
    }
  }
}

customElements.define('prompt-templates', PromptTemplates);
