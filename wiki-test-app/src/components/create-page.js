/**
 * Create Page Component
 */
import htmlTemplate from './create-page.html?raw';
import cssStyles from './create-page.css?inline';
import { FIBER } from '../../index.js';

export class CreatePage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentUser = null;
  }

  async connectedCallback() {
    console.log('[CreatePage] Connected to DOM');
    this.render();
    
    // Load current user
    try {
      this.currentUser = await FIBER.auth.getCurrentUser();
    } catch (error) {
      console.warn('Failed to load current user:', error);
    }
  }

  generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  }

  async createPage() {
    const title = this.shadowRoot.querySelector('#pageTitle').value.trim();
    const content = this.shadowRoot.querySelector('#pageContent').value.trim();
    const summary = this.shadowRoot.querySelector('#pageSummary').value.trim();

    if (!title || !content) {
      this.showError('Title and content are required');
      return;
    }

    const slug = this.generateSlug(title);

    try {
      // Create page using FIBER SDK - API will handle user tracking
      const page = await FIBER.data.createItem('wiki_pages', {
        page_title: title,
        page_slug: slug,
        content: content,
        summary: summary,
        view_count: 0
      });

      // Create edit history - API will handle user tracking
      await FIBER.data.createItem('edit_history', {
        page_id: page.item_id,
        edit_type: 'create',
        new_content: content,
        edit_summary: `Created page: ${title}`,
        characters_changed: content.length
      });

      this.showSuccess('Page created successfully!');
      
      // Navigate back home after 1 second
      setTimeout(() => {
        FIBER.router.navigateTo('/');
      }, 1000);

    } catch (error) {
      console.error('Failed to create page:', error);
      this.showError('Failed to create page. Please try again.');
    }
  }

  showError(message) {
    const container = this.shadowRoot.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 1rem; background: #f8d7da; color: #721c24; border: 1px solid #f44336; border-radius: 4px; margin-top: 1rem;">
          ${message}
        </div>
      `;
    }
  }

  showSuccess(message) {
    const container = this.shadowRoot.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 1rem; background: #d4edda; color: #155724; border: 1px solid #4caf50; border-radius: 4px; margin-top: 1rem;">
          ${message}
        </div>
      `;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
    `;

    // Attach event listeners after render
    setTimeout(() => {
      const backBtn = this.shadowRoot.querySelector('#back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => FIBER.router.navigateTo('/'));
      }

      const createBtn = this.shadowRoot.querySelector('#create-btn');
      if (createBtn) {
        createBtn.addEventListener('click', () => this.createPage());
      }
    }, 0);
  }
}