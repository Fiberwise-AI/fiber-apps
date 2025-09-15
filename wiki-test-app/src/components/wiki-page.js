/**
 * Wiki Page Component - Display a single wiki page
 */
import { FIBER } from '../../index.js';

export class WikiPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.page = null;
    this.slug = null;
  }

  async connectedCallback() {
    console.log('[WikiPage] Connected to DOM');
    this.slug = this.getAttribute('slug');
    this.render();
    await this.loadPage();
  }

  async loadPage() {
    if (!this.slug) return;

    try {
      const response = await FIBER.data.listItems('wiki_pages', {
        filter: JSON.stringify({ page_slug: this.slug }),
        context: 'user'
      });
      
      if (response.items && response.items.length > 0) {
        this.page = response.items[0];
        
        // TODO: Implement view count increment when partial updates are supported
        // For now, just render the page without incrementing view count
        
        this.renderPage();
      } else {
        this.renderNotFound();
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      this.renderError();
    }
  }

  renderPage() {
    const container = this.shadowRoot.querySelector('#page-content');
    if (!container || !this.page) return;

    const pageData = this.page.data || this.page;

    container.innerHTML = `
      <h1>${pageData.page_title}</h1>
      <div class="meta">
        <small>
          Last updated: ${new Date(this.page.updated_at).toLocaleDateString()}
          | Views: ${pageData.view_count || 0}
        </small>
      </div>
      <div class="content">${pageData.content.replace(/\n/g, '<br>')}</div>
      
      <div class="actions">
        <button id="edit-btn" class="btn btn-primary">
          <i class="fas fa-edit"></i> Edit Page
        </button>
        <button id="history-btn" class="btn btn-secondary">
          <i class="fas fa-history"></i> View History
        </button>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const editBtn = this.shadowRoot.querySelector('#edit-btn');
      const historyBtn = this.shadowRoot.querySelector('#history-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          FIBER.router.navigateTo(`/edit/${this.slug}`);
        });
      }
      
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          FIBER.router.navigateTo(`/history/${this.slug}`);
        });
      }
    }, 0);
  }

  renderNotFound() {
    const container = this.shadowRoot.querySelector('#page-content');
    if (!container) return;

    container.innerHTML = `
      <h1>Page Not Found</h1>
      <p>The page "${this.slug}" does not exist.</p>
      <button onclick="FIBER.router.navigateTo('/create')" class="btn btn-primary">
        <i class="fas fa-plus"></i> Create This Page
      </button>
    `;
  }

  renderError() {
    const container = this.shadowRoot.querySelector('#page-content');
    if (!container) return;

    container.innerHTML = `
      <h1>Error</h1>
      <p>Failed to load the page. Please try again.</p>
    `;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
        * { box-sizing: border-box; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 1rem; }
        .btn-link { background: transparent; color: #3498db; text-decoration: none; border: none; cursor: pointer; }
        .meta { color: #6c757d; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e0e0e0; }
        .content { line-height: 1.6; margin-bottom: 2rem; }
        .actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-secondary:hover { background: #545b62; }
        h1 { color: #2c3e50; margin: 0 0 1rem 0; }
      </style>
      
      <div class="container">
        <button onclick="FIBER.router.navigateTo('/')" class="btn-link">← Back to Home</button>
        
        <div id="page-content">
          <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin"></i> Loading page...
          </div>
        </div>
      </div>
    `;
  }
}