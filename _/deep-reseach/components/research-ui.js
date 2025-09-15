import { BaseComponent } from '/shared/BaseComponent.js';

export class ResearchUI extends BaseComponent {
    constructor() {
        super();
        this.state = {
            isLoading: false,
            logs: [],
            finalReport: null,
            sources: [],
            error: null
        };
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    async handleResearchSubmit(event) {
        event.preventDefault();
        const queryInput = this.shadowRoot.getElementById('research-query');
        const query = queryInput.value.trim();

        if (!query) {
            this.state.error = "Please enter a research topic.";
            this.render();
            return;
        }

        this.state = {
            isLoading: true,
            logs: [],
            finalReport: null,
            sources: [],
            error: null
        };
        this.render();

        try {
            const result = await this.componentHost.activateAgent('DeepResearchAgent', {
                prompt: query,
                log_callback: this.logMessage.bind(this)
            });

            this.state.finalReport = result.report;
            this.state.sources = result.sources;
        } catch (e) {
            console.error("Error activating agent:", e);
            this.state.error = `An error occurred: ${e.message || e}`;
        } finally {
            this.state.isLoading = false;
            this.render();
        }
    }

    logMessage(message) {
        this.state.logs.push({ text: message, timestamp: new Date() });
        this.render();
        // Auto-scroll logs
        const logContainer = this.shadowRoot.getElementById('log-container');
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: system-ui, sans-serif;
                    padding: 2rem;
                    max-width: 900px;
                    margin: 0 auto;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                h1 {
                    font-size: 1.875rem;
                    margin: 0;
                }
                .form-container {
                    display: flex;
                    gap: 0.5rem;
                }
                #research-query {
                    flex-grow: 1;
                    padding: 0.75rem;
                    font-size: 1rem;
                    border: 1px solid #ccc;
                    border-radius: 0.375rem;
                }
                #submit-btn {
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    background-color: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                }
                #submit-btn:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }
                .results-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .card {
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                }
                .card h2 {
                    margin-top: 0;
                    font-size: 1.25rem;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 0.5rem;
                    margin-bottom: 1rem;
                }
                #log-container {
                    max-height: 300px;
                    overflow-y: auto;
                    font-family: monospace;
                    font-size: 0.875rem;
                    background-color: #1f2937;
                    color: #d1d5db;
                    padding: 1rem;
                    border-radius: 0.375rem;
                }
                .log-entry {
                    white-space: pre-wrap;
                }
                #report-container {
                    white-space: pre-wrap;
                    line-height: 1.6;
                }
                .error {
                    color: #b91c1c;
                    background-color: #fee2e2;
                    padding: 1rem;
                    border-radius: 0.375rem;
                }
            </style>
            <div class="container">
                <h1>Deep Research Agent</h1>
                <form class="form-container">
                    <input type="text" id="research-query" placeholder="Enter a research topic..." ?disabled=${this.state.isLoading}>
                    <button type="submit" id="submit-btn" ?disabled=${this.state.isLoading}>
                        ${this.state.isLoading ? 'Researching...' : 'Start Research'}
                    </button>
                </form>

                ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}

                <div class="results-container">
                    ${this.state.isLoading || this.state.logs.length > 0 ? `
                        <div class="card">
                            <h2>Research Log</h2>
                            <div id="log-container">
                                ${this.state.logs.map(log => `<div class="log-entry">${log.text}</div>`).join('')}
                                ${this.state.isLoading ? `<div class="log-entry">...</div>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${this.state.finalReport ? `
                        <div class="card">
                            <h2>Final Report</h2>
                            <div id="report-container">${this.state.finalReport}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('form').addEventListener('submit', this.handleResearchSubmit.bind(this));
    }
}

customElements.define('research-ui', ResearchUI);
