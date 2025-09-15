/**
 * All Pages Component - Display all wiki pages
 */
import { FIBER } from '../../index.js';

export class AllPages extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pages = [];
  }

  async connectedCallback() {
    console.log('[AllPages] Connected to DOM');
    this.render();
    await this.loadPages();
  }

  async loadPages() {
    try {
      const response = await FIBER.data.listItems('wiki_pages', {
        orderBy: 'page_title ASC'
      });
      this.pages = response.items || [];
      this.renderPages();
    } catch (error) {
      console.error('Failed to load pages:', error);
      this.renderError();
    }
  }

  renderPages() {
    const container = this.shadowRoot.querySelector('#pages-list');
    if (!container) return;

    if (this.pages.length === 0) {
      container.innerHTML = '<p>No pages found. <a href="#" onclick="FIBER.router.navigateTo(\'/create\')">Create the first one!</a></p>';
      return;
    }

    container.innerHTML = this.pages.map(page => `
      <div class="page-item">
        <h4><a href="#" onclick="FIBER.router.navigateTo('/page/${page.page_slug}')">${page.page_title}</a></h4>
        <p class="summary">${page.summary || 'No summary available'}</p>
        <small class="meta">
          Last updated: ${new Date(page.updated_at).toLocaleDateString()} | 
          Views: ${page.view_count || 0}
        </small>
      </div>
      <hr>
    `).join('');
  }

  renderError() {
    const container = this.shadowRoot.querySelector('#pages-list');
    if (!container) return;

    container.innerHTML = '<p>Failed to load pages. Please try again.</p>';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
        * { box-sizing: border-box; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 1rem; }
        .btn-link { background: transparent; color: #3498db; text-decoration: none; border: none; cursor: pointer; }
        .page-item { margin-bottom: 1rem; }
        .page-item h4 { margin: 0 0 0.5rem 0; }
        .page-item h4 a { color: #2c3e50; text-decoration: none; }
        .page-item h4 a:hover { color: #3498db; }
        .summary { color: #6c757d; margin: 0.5rem 0; }
        .meta { color: #868e96; }
        h2 { color: #2c3e50; margin: 0 0 1rem 0; }
        hr { border: none; border-top: 1px solid #e0e0e0; margin: 1rem 0; }
      </style>
      
      <div class="container">
        <h2><i class="fas fa-list"></i> All Knowledge Pages</h2>
        <button onclick="FIBER.router.navigateTo('/')" class="btn-link">← Back to Home</button>
        
        <div id="pages-list">
          <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin"></i> Loading pages...
          </div>
        </div>
      </div>
    `;
  }
}