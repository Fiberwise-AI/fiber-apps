/**
 * Data Test App Component
 * 
 * A professional web component for testing FiberWise data saving functionality
 * with modern UI, real-time updates, and comprehensive error handling.
 */
import { FIBER } from '../../index.js';

const styles = `
/* Data Test App Professional Styles */
:host {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
}

/* CSS Variables */
:host {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --secondary-color: #6b7280;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #06b6d4;
  --background: #f8fafc;
  --surface: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --border-radius: 8px;
  --transition: all 0.2s ease;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.app-header {
  background: var(--surface);
  border-radius: var(--border-radius);
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.header-title i {
  color: var(--primary-color);
  font-size: 2rem;
}

.header-title h1 {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.header-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

.header-status {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.connection-status, .provider-warning, .provider-info, .provider-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--border-light);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
}

.provider-warning {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--error-color);
}

.provider-info {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: var(--success-color);
}

.provider-selector {
  background: var(--surface);
  border: 1px solid var(--border);
}

.setup-provider-btn {
  padding: 0.25rem 0.75rem;
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.setup-provider-btn:hover {
  background: #dc2626;
}

.provider-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.75rem;
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
}

.provider-name {
  font-weight: 600;
}

.model-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Agent Status Styles */
.agent-warning, .agent-info, .agent-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--border-light);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
}

.agent-warning {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--error-color);
}

.agent-info {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: var(--success-color);
}

.agent-selector {
  background: var(--surface);
  border: 1px solid var(--border);
}

.agent-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.75rem;
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
}

.agent-name {
  font-weight: 600;
}

.agent-status {
  display: none; /* Hidden by default */
}

.agent-status.visible {
  display: block;
}

.status-indicator {
  font-size: 0.75rem;
  color: var(--secondary-color);
}

.status-indicator.connected {
  color: var(--success-color);
}

.status-indicator.disconnected {
  color: var(--error-color);
}

/* Main Content */
.app-main {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 1024px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}

/* Sections */
.test-section,
.results-section,
.data-section {
  background: var(--surface);
  border-radius: var(--border-radius);
  padding: 2rem;
  box-shadow: var(--shadow);
}

.data-section {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.section-header h2 {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header h2 i {
  color: var(--primary-color);
}

.section-header p {
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

.section-actions {
  display: flex;
  gap: 0.75rem;
}

/* Forms */
.test-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group label i {
  color: var(--primary-color);
  width: 1rem;
  text-align: center;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-family: inherit;
  transition: var(--transition);
  background: var(--surface);
  color: var(--text-primary);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 5rem;
  line-height: 1.5;
}

.form-options {
  padding: 1rem;
  background: var(--border-light);
  border-radius: var(--border-radius);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  cursor: pointer;
}

.checkbox-label i {
  color: var(--primary-color);
}

.checkbox-help {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-left: 1.875rem;
  margin-top: 0.25rem;
}

/* Buttons */
.primary-button,
.secondary-button,
.toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}

.primary-button {
  background: var(--primary-color);
  color: white;
}

.primary-button:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.secondary-button {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.secondary-button:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--primary-color);
  background: var(--border-light);
}

.toggle-button {
  background: var(--border-light);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.toggle-button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.toggle-button:hover:not(:disabled) {
  background: var(--primary-hover);
  color: white;
  border-color: var(--primary-hover);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Results Display */
.results-display,
.data-display {
  min-height: 12rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--border);
}

.empty-state h3 {
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Result Cards */
.result-card,
.status-card {
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card.success,
.status-card.success {
  border-left: 4px solid var(--success-color);
  background: #f0fdf4;
}

.result-card.error,
.status-card.error {
  border-left: 4px solid var(--error-color);
  background: #fef2f2;
}

.result-card.info,
.status-card.info {
  border-left: 4px solid var(--info-color);
  background: #f0f9ff;
}

.result-header,
.status-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid var(--border-light);
}

.result-header i,
.status-header i {
  font-size: 1.25rem;
}

.result-card.success .result-header i,
.status-card.success .status-header i {
  color: var(--success-color);
}

.result-card.error .result-header i,
.status-card.error .status-header i {
  color: var(--error-color);
}

.result-card.info .result-header i,
.status-card.info .status-header i {
  color: var(--info-color);
}

.result-header h3,
.status-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.result-content,
.status-details {
  padding: 1.5rem;
}

.result-message {
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.result-detail {
  margin-bottom: 1rem;
}

.result-detail strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.result-detail p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.result-detail code {
  background: var(--border-light);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.75rem;
  color: var(--primary-color);
}

.code-block {
  background: var(--border-light);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 1rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.metadata-details {
  margin-top: 1rem;
}

.metadata-details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.json-display {
  background: var(--border-light);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 1rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--text-primary);
  white-space: pre;
  overflow-x: auto;
  max-height: 20rem;
  overflow-y: auto;
}

/* Data Grid */
.data-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data-header h3 i {
  color: var(--primary-color);
}

.data-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat i {
  color: var(--primary-color);
}

/* Record Cards */
.records-container {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

@media (max-width: 768px) {
  .records-container {
    grid-template-columns: 1fr;
  }
}

.record-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: var(--transition);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.record-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--border-light);
  border-bottom: 1px solid var(--border);
}

.record-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  color: white;
}

.category-general { background: var(--secondary-color); }
.category-email_analysis { background: var(--info-color); }
.category-text_processing { background: var(--success-color); }
.category-llm_test { background: var(--primary-color); }
.category-data_validation { background: var(--warning-color); }
.category-performance { background: var(--error-color); }

.record-content {
  padding: 1rem;
}

.record-field {
  margin-bottom: 1rem;
}

.record-field:last-child {
  margin-bottom: 0;
}

.record-field strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.record-field p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.analysis-text {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8125rem;
  background: var(--border-light);
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
  margin-top: 1rem;
}

.record-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.record-date i {
  color: var(--primary-color);
}

.metadata-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: var(--transition);
}

.metadata-btn:hover {
  background: var(--primary-hover);
}

/* Notifications */
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  min-width: 20rem;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification.success { border-left: 4px solid var(--success-color); }
.notification.error { border-left: 4px solid var(--error-color); }
.notification.warning { border-left: 4px solid var(--warning-color); }
.notification.info { border-left: 4px solid var(--info-color); }

.notification i {
  font-size: 1rem;
}

.notification.success i { color: var(--success-color); }
.notification.error i { color: var(--error-color); }
.notification.warning i { color: var(--warning-color); }
.notification.info i { color: var(--info-color); }

.notification span {
  flex: 1;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
}

.notification-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: var(--transition);
}

.notification-close:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }
  
  .app-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .section-actions {
    justify-content: center;
  }
  
  .notification {
    min-width: auto;
    margin: 0 1rem;
  }
}
`;

export class DataTestApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.connectionStatus = false;

        // Add LLM provider state
        this.providers = [];
        this.selectedProviderId = null;

        // Add agent state
        this.agents = [];
        this.selectedAgentId = null;
    }

    async connectedCallback() {
        console.log('[DataTestApp] connectedCallback called');
        try {
            // Load providers and agents first
            await this.loadProviders();
            await this.loadAgents();

            this.render();
            console.log('[DataTestApp] render() completed');
            this.bindEvents();
            console.log('[DataTestApp] bindEvents() completed');
            this.setupRealtimeConnection();
            console.log('[DataTestApp] setupRealtimeConnection() completed');
            
            // Auto-load records when component starts
            setTimeout(() => {
                console.log('[DataTestApp] Auto-loading records on startup');
                this.handleLoadData();
            }, 1000);
        } catch (error) {
            console.error('[DataTestApp] Error in connectedCallback:', error);
        }
    }

    async loadProviders() {
        try {
            console.log('[DataTestApp] Loading providers', FIBER.apps);
            const response = await FIBER.apps.listModelProviders();
            this.providers = Array.isArray(response) ? response : (response.items || []);
            console.log('[DataTestApp] Providers loaded:', this.providers);
            this.selectedProviderId = this.providers[0]?.provider_id || null;
            console.log('[DataTestApp] Selected provider ID:', this.selectedProviderId);
            return this.providers;
        } catch (error) {
            console.error('Error loading providers:', error);
            return [];
        }
    }

    async loadAgents() {
        try {
            console.log('[DataTestApp] Loading agents');
            const response = await FIBER.agents.list();
            console.log('[DataTestApp] Raw agents response:', response);

            // Extract agents array from response
            let agents = [];
            if (Array.isArray(response)) {
                agents = response;
            } else if (response && response.items) {
                agents = response.items;
            } else if (response && response.data) {
                agents = response.data;
            }

            this.agents = agents || [];
            this.selectedAgentId = agents.length > 0 ? agents[0]?.id || null : null;
            console.log('[DataTestApp] Agents loaded:', this.agents);
            console.log('[DataTestApp] Selected agent ID:', this.selectedAgentId);
            return this.agents;
        } catch (error) {
            console.error('Error loading agents:', error);
            this.agents = [];
            this.selectedAgentId = null;
            return [];
        }
    }

    renderProviderStatus() {
        if (this.providers.length === 0) {
            return `
                <div class="provider-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>No LLM Providers</span>
                    <button id="setupProviderBtn" class="setup-provider-btn">
                        <i class="fas fa-plus"></i> Setup Provider
                    </button>
                </div>
            `;
        }
        
        if (this.providers.length === 1) {
            const provider = this.providers[0];
            return `
                <div class="provider-info">
                    <i class="fas fa-robot"></i>
                    <span class="provider-name">${provider.name || provider.provider_id}</span>
                    ${provider.default_model ? `<span class="model-name">(${provider.default_model})</span>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="provider-selector">
                <i class="fas fa-robot"></i>
                <select id="providerSelect" class="provider-select">
                    ${this.providers.map(provider => `
                        <option value="${provider.provider_id}"
                          ${provider.provider_id === this.selectedProviderId ? 'selected' : ''}>
                            ${provider.name || provider.provider_id} ${provider.default_model ? `(${provider.default_model})` : ''}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    renderAgentStatus() {
        if (this.agents.length === 0) {
            return `
                <div class="agent-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>No Agents Available</span>
                </div>
            `;
        }

        if (this.agents.length === 1) {
            const agent = this.agents[0];
            return `
                <div class="agent-info">
                    <i class="fas fa-user-robot"></i>
                    <span class="agent-name">${agent.name || agent.id}</span>
                </div>
            `;
        }

        return `
            <div class="agent-selector">
                <i class="fas fa-user-robot"></i>
                <select id="agentSelect" class="agent-select">
                    ${this.agents.map(agent => `
                        <option value="${agent.id}"
                          ${agent.id === this.selectedAgentId ? 'selected' : ''}>
                            ${agent.name || agent.id}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    render() {
        console.log('[DataTestApp] render() method called');
        console.log('[DataTestApp] shadowRoot exists:', !!this.shadowRoot);
        
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            
            <div class="app-container">
                <header class="app-header">
                    <div class="header-content">
                        <div class="header-title">
                            <i class="fas fa-database"></i>
                            <h1>Data Save Test App</h1>
                        </div>
                        <div class="header-subtitle">
                            Test FiberWise data saving functionality with real-time updates
                        </div>
                    </div>
                    <div class="header-status">
                        <div class="provider-status" id="providerStatus">
                            ${this.renderProviderStatus()}
                        </div>
                        <div class="agent-status" id="agentStatus">
                            ${this.renderAgentStatus()}
                        </div>
                        <div class="connection-status" id="connectionStatus">
                            <i class="fas fa-circle status-indicator"></i>
                            <span>Connecting...</span>
                        </div>
                    </div>
                </header>

                <main class="app-main">
                    <section class="test-section">
                        <div class="section-header">
                            <h2><i class="fas fa-play-circle"></i> Run Data Test</h2>
                            <p>Test the data saving functionality by sending a message to the DataTestAgent</p>
                        </div>

                        <form id="dataTestForm" class="test-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="testMessage">
                                        <i class="fas fa-edit"></i>
                                        Test Message
                                    </label>
                                    <textarea 
                                        id="testMessage" 
                                        name="test_message" 
                                        rows="3" 
                                        placeholder="Enter your test message to analyze and save..."
                                        required>Hello, this is a test message for data saving functionality.</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="testCategory">
                                        <i class="fas fa-tags"></i>
                                        Category
                                    </label>
                                    <select id="testCategory" name="test_category">
                                        <option value="general">General Test</option>
                                        <option value="email_analysis">Email Analysis</option>
                                        <option value="text_processing">Text Processing</option>
                                        <option value="llm_test">LLM Analysis</option>
                                        <option value="data_validation">Data Validation</option>
                                        <option value="performance">Performance Test</option>
                                    </select>
                                    <small style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem;">
                                        Used for organizing and filtering test records. Affects the color coding of saved records.
                                    </small>
                                </div>
                            </div>

                            <div class="form-options">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="useLlm" name="use_llm" />
                                    <i class="fas fa-brain"></i>
                                    Use AI/LLM for analysis
                                    <span class="checkbox-help">Enable AI-powered analysis of your test message</span>
                                </label>
                            </div>
                            
                            <button type="submit" id="testSaveBtn" class="primary-button">
                                <i class="fas fa-rocket"></i>
                                <span>Run Test</span>
                            </button>
                        </form>
                    </section>
                    
                    <section class="results-section">
                        <div class="section-header">
                            <h2><i class="fas fa-chart-line"></i> Test Results</h2>
                            <div class="section-actions">
                                <button id="clearResultsBtn" class="secondary-button">
                                    <i class="fas fa-broom"></i>
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div id="testResults" class="results-display">
                            <div class="empty-state">
                                <i class="fas fa-flask"></i>
                                <h3>Ready to test</h3>
                                <p>Click "Run Test" to execute a data save test</p>
                            </div>
                        </div>
                    </section>
                    
                    <section class="data-section">
                        <div class="section-header">
                            <h2><i class="fas fa-table"></i> Saved Records</h2>
                            <div class="section-actions">
                                <button id="autoRefreshBtn" class="toggle-button active" data-active="true">
                                    <i class="fas fa-sync-alt"></i>
                                    Auto-refresh
                                </button>
                                <button id="loadDataBtn" class="primary-button">
                                    <i class="fas fa-download"></i>
                                    Load Records
                                </button>
                            </div>
                        </div>
                        <div id="savedDataList" class="data-display">
                            <div class="empty-state">
                                <i class="fas fa-database"></i>
                                <h3>No records loaded</h3>
                                <p>Click "Load Records" to view saved data</p>
                            </div>
                        </div>
                    </section>
                </main>

                <div id="notification-container" class="notification-container"></div>
            </div>
        `;
    }

    bindEvents() {
        // Form submission
        const form = this.shadowRoot.getElementById('dataTestForm');
        form?.addEventListener('submit', (e) => this.handleTestSave(e));
        
        // Load data button
        const loadDataBtn = this.shadowRoot.getElementById('loadDataBtn');
        loadDataBtn?.addEventListener('click', () => this.handleLoadData());
        
        // Clear results button
        const clearResultsBtn = this.shadowRoot.getElementById('clearResultsBtn');
        clearResultsBtn?.addEventListener('click', () => this.clearResults());
        
        // Auto-refresh toggle
        const autoRefreshBtn = this.shadowRoot.getElementById('autoRefreshBtn');
        autoRefreshBtn?.addEventListener('click', () => this.toggleAutoRefresh());
        
        // Provider setup button
        const setupProviderBtn = this.shadowRoot.getElementById('setupProviderBtn');
        setupProviderBtn?.addEventListener('click', () => this.handleSetupProvider());
        
        // Provider selection dropdown
        const providerSelect = this.shadowRoot.getElementById('providerSelect');
        providerSelect?.addEventListener('change', (e) => {
            this.selectedProviderId = e.target.value;
            console.log('[DataTestApp] Provider changed to:', this.selectedProviderId);
        });

        // LLM analysis checkbox
        const useLlmCheckbox = this.shadowRoot.getElementById('useLlm');
        useLlmCheckbox?.addEventListener('change', (e) => {
            this.toggleAgentVisibility(e.target.checked);
        });

        // Agent selection dropdown
        const agentSelect = this.shadowRoot.getElementById('agentSelect');
        agentSelect?.addEventListener('change', (e) => {
            this.selectedAgentId = e.target.value;
            console.log('[DataTestApp] Agent changed to:', this.selectedAgentId);
        });
    }

    toggleAgentVisibility(show) {
        const agentStatus = this.shadowRoot.getElementById('agentStatus');
        if (show) {
            agentStatus?.classList.add('visible');
        } else {
            agentStatus?.classList.remove('visible');
        }
    }

    async setupRealtimeConnection() {
        const statusEl = this.shadowRoot.getElementById('connectionStatus');
        
        try {
            await FIBER.realtime.connect();
            this.connectionStatus = true;
            
            statusEl.innerHTML = `
                <i class="fas fa-circle status-indicator connected"></i>
                <span>Connected</span>
            `;
            
            FIBER.realtime.on('message', (message) => {
                this.handleRealtimeMessage(message);
            });
            
            this.showNotification('Real-time connection established', 'success');
            
        } catch (error) {
            console.warn('Real-time connection failed:', error);
            statusEl.innerHTML = `
                <i class="fas fa-circle status-indicator disconnected"></i>
                <span>Offline Mode</span>
            `;
            this.showNotification('Running in offline mode', 'warning');
        }
    }

    async handleTestSave(event) {
        event.preventDefault();
        
        const button = this.shadowRoot.getElementById('testSaveBtn');
        const resultsDiv = this.shadowRoot.getElementById('testResults');
        
        // Update button state
        this.setButtonLoading(button, true);
        
        try {
            // Get form data
            const formData = new FormData(event.target);
            const testData = {
                test_message: formData.get('test_message'),
                test_category: formData.get('test_category'),
                use_llm: formData.has('use_llm')
            };

            // Determine which agent to use
            let targetAgent;
            let agentName;

            if (testData.use_llm) {
                if (!this.selectedAgentId) {
                    throw new Error('Please select an agent for LLM analysis or uncheck the LLM option.');
                }

                // Use selected agent for LLM analysis
                targetAgent = this.agents.find(agent => agent.id === this.selectedAgentId);
                agentName = targetAgent?.name || 'Selected Agent';

                if (!targetAgent) {
                    throw new Error('Selected agent not found. Please refresh and try again.');
                }
            } else {
                // Use default DataTestAgent for regular data saving
                const agents = await FIBER.agents.list();
                targetAgent = agents.find(agent => agent.name === 'DataTestAgent');
                agentName = 'DataTestAgent';

                if (!targetAgent) {
                    throw new Error('DataTestAgent not found. Please ensure the app is properly installed.');
                }
            }

            // Show initial status
            this.displayStatus(resultsDiv, `Activating ${agentName}...`, 'info', 'fas fa-cog fa-spin');

            // Prepare metadata with provider_id
            const metadata = {};
            if (this.selectedProviderId) {
                const provider = this.providers.find(p => p.provider_id === this.selectedProviderId);
                console.log('[DataTestApp] Found provider for metadata:', provider);
                if (provider) {
                    metadata.provider_id = provider.provider_id;
                    metadata.model_id = provider.default_model;
                }
            }

            // Build context with provider_id
            const context = {};
            if (this.selectedProviderId) {
                context.provider_id = this.selectedProviderId;
            }

            console.log('[DataTestApp] Agent activation context:', context);
            console.log('[DataTestApp] Agent activation metadata:', metadata);

            // Execute the agent
            const result = await FIBER.agents.activate(
                targetAgent.id,
                testData,
                context,
                metadata
            );
            
            if (result?.status === 'queued') {
                this.displayStatus(resultsDiv, 'Test queued for execution', 'info', 'fas fa-clock', {
                    activationId: result.activation_id,
                    message: 'Your test has been queued and will be processed shortly. Real-time updates will notify when complete.'
                });
            } else {
                this.displayResults(result, resultsDiv);
            }

        } catch (error) {
            console.error('Test failed:', error);
            this.displayError(error, resultsDiv);
            this.showNotification(`Test failed: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async handleLoadData() {
        const loadBtn = this.shadowRoot.getElementById('loadDataBtn');
        const dataListDiv = this.shadowRoot.getElementById('savedDataList');
        
        this.setButtonLoading(loadBtn, true);
        
        try {
            const result = await FIBER.data.listItems('test_analyses', {
                page: 1,
                limit: 20,
                sort: 'created_at',
                order: 'desc'
            });

            this.displaySavedData(result, dataListDiv);
            this.showNotification(`Loaded ${this.getItemsCount(result)} records`, 'success');

        } catch (error) {
            console.error('Failed to load data:', error);
            this.displayError(error, dataListDiv);
            this.showNotification(`Failed to load data: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(loadBtn, false);
        }
    }

    handleRealtimeMessage(message) {
        console.log('Real-time message:', message);
        
        if (message.type === 'activation_completed') {
            this.showNotification('Agent execution completed', 'success');
            
            // Auto-refresh data if enabled
            const autoRefreshBtn = this.shadowRoot.getElementById('autoRefreshBtn');
            if (autoRefreshBtn?.dataset.active === 'true') {
                setTimeout(() => this.handleLoadData(), 1000);
            }
        }
        
        if (message.type === 'data_model_change' && message.model_slug === 'test_analyses') {
            this.showNotification('New record saved', 'success');
            
            // Auto-refresh data if enabled
            const autoRefreshBtn = this.shadowRoot.getElementById('autoRefreshBtn');
            if (autoRefreshBtn?.dataset.active === 'true') {
                setTimeout(() => this.handleLoadData(), 1000);
            }
        }
    }

    displayResults(result, container) {
        const status = result?.status || 'unknown';
        const isSuccess = status === 'success';
        
        const html = `
            <div class="result-card ${isSuccess ? 'success' : 'error'}">
                <div class="result-header">
                    <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <h3>Test ${status.toUpperCase()}</h3>
                </div>
                
                <div class="result-content">
                    ${result.message ? `<p class="result-message">${result.message}</p>` : ''}
                    
                    ${result.record_id ? `
                        <div class="result-detail">
                            <strong>Record ID:</strong>
                            <code>${result.record_id}</code>
                        </div>
                    ` : ''}
                    
                    ${result.test_message ? `
                        <div class="result-detail">
                            <strong>Test Message:</strong>
                            <p>${result.test_message}</p>
                        </div>
                    ` : ''}
                    
                    ${result.analysis_result ? `
                        <div class="result-detail">
                            <strong>Analysis Result:</strong>
                            <div class="code-block">${result.analysis_result}</div>
                        </div>
                    ` : ''}
                    
                    ${result.metadata ? `
                        <details class="metadata-details">
                            <summary><strong>Metadata</strong></summary>
                            <pre class="json-display">${JSON.stringify(result.metadata, null, 2)}</pre>
                        </details>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    displaySavedData(result, container) {
        const items = this.extractItems(result);
        
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No records found</h3>
                    <p>No saved test records were found in the database</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="data-grid">
                <div class="data-header">
                    <h3><i class="fas fa-list"></i> ${items.length} Record${items.length !== 1 ? 's' : ''}</h3>
                    <div class="data-stats">
                        <span class="stat">
                            <i class="fas fa-calendar"></i>
                            Last updated: ${new Date().toLocaleString()}
                        </span>
                    </div>
                </div>
                
                <div class="records-container">
                    ${items.map(item => this.renderRecordCard(item)).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderRecordCard(item) {
        const data = this.extractItemData(item);
        const testId = data.test_id || item.item_id || item.id || 'N/A';
        const message = data.test_message || 'No message';
        const category = data.test_category || 'general';
        const analysis = data.analysis_result || 'No analysis';
        const created = data.created_at || item.created_at;
        const metadata = data.metadata;

        return `
            <div class="record-card">
                <div class="record-header">
                    <span class="record-id">
                        <i class="fas fa-hashtag"></i>
                        ${testId.substring(0, 8)}...
                    </span>
                    <span class="category-badge category-${category}">
                        ${category}
                    </span>
                </div>
                
                <div class="record-content">
                    <div class="record-field">
                        <strong>Message:</strong>
                        <p>${message}</p>
                    </div>
                    
                    <div class="record-field">
                        <strong>Analysis:</strong>
                        <p class="analysis-text">${analysis}</p>
                    </div>
                    
                    <div class="record-footer">
                        <span class="record-date">
                            <i class="fas fa-clock"></i>
                            ${new Date(created).toLocaleString()}
                        </span>
                        ${metadata ? `
                            <button class="metadata-btn" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                                <i class="fas fa-info-circle"></i>
                                Metadata
                            </button>
                            <div class="metadata-popup" style="display: none;">
                                <pre>${metadata}</pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    displayStatus(container, message, type = 'info', icon = 'fas fa-info-circle', details = null) {
        const html = `
            <div class="status-card ${type}">
                <div class="status-header">
                    <i class="${icon}"></i>
                    <h3>${message}</h3>
                </div>
                ${details ? `
                    <div class="status-details">
                        ${details.activationId ? `<p><strong>Activation ID:</strong> <code>${details.activationId}</code></p>` : ''}
                        ${details.message ? `<p>${details.message}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
        container.innerHTML = html;
    }

    displayError(error, container) {
        const html = `
            <div class="result-card error">
                <div class="result-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                </div>
                <div class="result-content">
                    <p class="error-message">${error.message || error}</p>
                    ${error.stack ? `<details><summary>Stack Trace</summary><pre>${error.stack}</pre></details>` : ''}
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    clearResults() {
        const resultsDiv = this.shadowRoot.getElementById('testResults');
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-flask"></i>
                <h3>Results cleared</h3>
                <p>Click "Run Test" to execute a new test</p>
            </div>
        `;
    }

    toggleAutoRefresh() {
        const btn = this.shadowRoot.getElementById('autoRefreshBtn');
        const isActive = btn.dataset.active === 'true';
        
        btn.dataset.active = !isActive;
        btn.classList.toggle('active', !isActive);
        btn.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            Auto-refresh ${!isActive ? 'ON' : 'OFF'}
        `;
        
        this.showNotification(`Auto-refresh ${!isActive ? 'enabled' : 'disabled'}`, 'info');
    }

    handleSetupProvider() {
        try {
            // Navigate to LLM providers settings page
            window.open('http://localhost:5757/settings/llm-providers', '_blank');
        } catch (error) {
            console.error('[DataTestApp] Failed to open provider settings:', error);
            this.showNotification('Please navigate to Settings > LLM Providers to add a provider', 'info');
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Working...</span>';
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText;
            button.disabled = false;
        }
    }

    showNotification(message, type = 'info', duration = 4000) {
        const container = this.shadowRoot.getElementById('notification-container');
        const notification = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle', 
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    // Helper methods
    extractItems(result) {
        return result?.items || result?.data || result || [];
    }

    extractItemData(item) {
        if (item.data) return item.data;
        if (typeof item.item_data === 'string') return JSON.parse(item.item_data);
        if (item.item_data) return item.item_data;
        return item;
    }

    getItemsCount(result) {
        const items = this.extractItems(result);
        return Array.isArray(items) ? items.length : 0;
    }
}

// Register the custom element
customElements.define('data-test-app', DataTestApp);