/**
 * Wiki Home Component
 * Main component for the wiki app
 */
import htmlTemplate from './wiki-home.html?raw';
import cssStyles from './wiki-home.css?inline';
import { FIBER } from '../../index.js';

export class WikiHome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // App state
    this.isLoading = true;
    this.currentUser = null;
    this.recentPages = [];
    this.recentEdits = [];
    this.currentView = 'home';
  }

  connectedCallback() {
    console.log('[WikiHome] Connected to DOM');
    this.render();
    this.loadData();
  }

  async loadData() {
    try {
      // Load current user using FIBER auth
      this.currentUser = await FIBER.auth.getCurrentUser();
      
      // Load recent pages using FIBER SDK with context filter
      const pagesResponse = await FIBER.data.listItems('wiki_pages', {
        limit: 5,
        orderBy: 'updated_at DESC',
        context: 'user'
      });
      this.recentPages = pagesResponse.items || [];

      // Load recent edits with context filter
      const editsResponse = await FIBER.data.listItems('edit_history', {
        limit: 10,
        orderBy: 'created_at DESC',
        context: 'user'
      });
      this.recentEdits = editsResponse.items || [];
      
      // Debug: Check what data we're getting
      console.log('Recent edits data:', this.recentEdits);

      this.isLoading = false;
      this.updateDisplay();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.isLoading = false;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const userDisplay = this.shadowRoot.querySelector('#current-user-display');
    if (userDisplay && this.currentUser) {
      const displayName = this.currentUser.full_name || 
                         `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim() ||
                         this.currentUser.username ||
                         this.currentUser.email ||
                         'User';
      userDisplay.textContent = displayName;
    }

    this.renderRecentPages();
    this.renderRecentEdits();
  }

  renderRecentPages() {
    const container = this.shadowRoot.querySelector('#recent-pages-list');
    if (!container) return;

    if (this.recentPages.length === 0) {
      container.innerHTML = '<p class="text-muted">No pages yet. Create the first one!</p>';
      return;
    }

    container.innerHTML = this.recentPages.map(page => {
      const pageData = page.data || page;
      const pageSlug = pageData.page_slug;
      const pageTitle = pageData.page_title;
      
      if (!pageSlug || !pageTitle) {
        console.warn('Missing page data:', page);
        return '';
      }
      
      return `
        <div class="mb-2">
          <strong>
            <a href="#" onclick="this.getRootNode().host.viewPage('${pageSlug}')" class="text-decoration-none">
              ${pageTitle}
            </a>
          </strong>
          <br>
          <small class="text-muted">
            Last edited ${new Date(page.updated_at).toLocaleDateString()}
          </small>
        </div>
        <hr class="my-2">
      `;
    }).filter(html => html).join('');
  }

  renderRecentEdits() {
    const container = this.shadowRoot.querySelector('#recent-edits-list');
    if (!container) return;

    if (this.recentEdits.length === 0) {
      container.innerHTML = '<p class="text-muted">No edit history yet.</p>';
      return;
    }

    container.innerHTML = this.recentEdits.map(edit => {
      const editData = edit.data || edit;
      
      return `
        <div class="mb-2">
          <strong>${editData.user_id}</strong>
          <span class="badge bg-primary">${editData.edit_type}</span>
          <br>
          <small>${editData.edit_summary || 'No summary'}</small>
          <br>
          <small class="text-muted">${new Date(edit.created_at).toLocaleString()}</small>
        </div>
        <hr class="my-2">
      `;
    }).join('');
  }

  // Navigation methods using FIBER router
  navigateToCreate() {
    FIBER.router.navigateTo('/create');
  }

  navigateToAllPages() {
    FIBER.router.navigateTo('/all-pages');
  }

  viewPage(slug) {
    FIBER.router.navigateTo(`/page/${slug}`);
  }

  // Removed renderCreatePage - now handled by separate create-page component

  showError(message) {
    const container = this.shadowRoot.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger alert-dismissible mt-3">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }
  }

  showSuccess(message) {
    const container = this.shadowRoot.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-success alert-dismissible mt-3">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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
      const createBtn = this.shadowRoot.querySelector('#create-page-btn');
      if (createBtn) {
        createBtn.addEventListener('click', () => this.navigateToCreate());
      }
    }, 0);
  }
}

// Export only - registration handled in index.js