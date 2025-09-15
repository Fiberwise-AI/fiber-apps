class PipelineTestApp extends HTMLElement {
    constructor() {
        super();
        this.isLoggedIn = false;
        this.currentUser = null;
        this.testResults = [];
        this.pipelines = [];
    }

    connectedCallback() {
        this.checkAuthAndRender();
    }

    async checkAuthAndRender() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.isLoggedIn = true;
                await this.loadData();
                this.render();
            } else {
                this.renderLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.renderLogin();
        }
    }

    async loadData() {
        try {
            // Load pipelines
            const pipelineResponse = await fetch('/api/v1/pipelines', {
                credentials: 'include'
            });
            if (pipelineResponse.ok) {
                this.pipelines = await pipelineResponse.json();
            }

            // Load test results
            const resultsResponse = await fetch('/api/v1/data/test_results', {
                credentials: 'include'
            });
            if (resultsResponse.ok) {
                const data = await resultsResponse.json();
                this.testResults = data.items || [];
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    renderLogin() {
        this.innerHTML = `
            <div class="container mt-4">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">Pipeline Test App</h5>
                                <p class="card-text">Please log in to use the pipeline testing interface.</p>
                                <a href="/auth/login" class="btn btn-primary">Login</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        this.innerHTML = `
            <div class="container mt-4">
                <div class="row">
                    <div class="col-12">
                        <h2><i class="fas fa-flask me-2"></i>Pipeline Test App</h2>
                        <p class="text-muted">Test pipeline execution with manual triggers</p>
                    </div>
                </div>

                <div class="row">
                    <!-- Pipeline Trigger Section -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-play me-2"></i>Execute Pipeline</h5>
                            </div>
                            <div class="card-body">
                                <form id="pipelineForm">
                                    <div class="mb-3">
                                        <label for="testName" class="form-label">Test Name</label>
                                        <input type="text" class="form-control" id="testName" 
                                               placeholder="Enter test name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="inputText" class="form-label">Input Text</label>
                                        <textarea class="form-control" id="inputText" rows="3" 
                                                  placeholder="Enter text to process through pipeline" required></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="pipelineSelect" class="form-label">Pipeline</label>
                                        <select class="form-control" id="pipelineSelect" required>
                                            <option value="">Select a pipeline...</option>
                                            ${this.pipelines.map(pipeline => 
                                                `<option value="${pipeline.pipeline_id}">${pipeline.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <button type="submit" class="btn btn-primary" id="executeBtn">
                                        <i class="fas fa-rocket me-2"></i>Execute Pipeline
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Results Section -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-list me-2"></i>Test Results</h5>
                                <button class="btn btn-sm btn-outline-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.loadData(); this.parentElement.parentElement.parentElement.parentElement.render();">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                            </div>
                            <div class="card-body">
                                <div id="resultsContainer">
                                    ${this.renderResults()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pipeline Status Section -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-info-circle me-2"></i>Available Pipelines</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderPipelineInfo()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderResults() {
        if (this.testResults.length === 0) {
            return '<p class="text-muted">No test results yet. Execute a pipeline to see results here.</p>';
        }

        return this.testResults
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(result => `
                <div class="border-bottom mb-2 pb-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="mb-1">${result.test_name}</h6>
                        <span class="badge ${result.status === 'completed' ? 'bg-success' : result.status === 'failed' ? 'bg-danger' : 'bg-warning'}">${result.status}</span>
                    </div>
                    <p class="mb-1 text-muted small">${result.input_data}</p>
                    ${result.pipeline_result ? `<p class="mb-1 small"><strong>Result:</strong> ${result.pipeline_result}</p>` : ''}
                    <small class="text-muted">${new Date(result.created_at).toLocaleString()}</small>
                </div>
            `).join('');
    }

    renderPipelineInfo() {
        if (this.pipelines.length === 0) {
            return '<p class="text-muted">No pipelines found. Make sure the app is properly installed.</p>';
        }

        return `
            <div class="row">
                ${this.pipelines.map(pipeline => `
                    <div class="col-md-6 mb-3">
                        <div class="border rounded p-3">
                            <h6>${pipeline.name}</h6>
                            <p class="text-muted small">${pipeline.description || 'No description'}</p>
                            <span class="badge ${pipeline.is_active ? 'bg-success' : 'bg-secondary'}">
                                ${pipeline.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupEventListeners() {
        const form = this.querySelector('#pipelineForm');
        if (form) {
            form.addEventListener('submit', (e) => this.executePipeline(e));
        }
    }

    async executePipeline(e) {
        e.preventDefault();
        
        const executeBtn = this.querySelector('#executeBtn');
        const testName = this.querySelector('#testName').value;
        const inputText = this.querySelector('#inputText').value;
        const pipelineId = this.querySelector('#pipelineSelect').value;

        if (!pipelineId) {
            alert('Please select a pipeline');
            return;
        }

        executeBtn.disabled = true;
        executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Executing...';

        try {
            // First, create a test record
            const testRecord = await fetch('/api/v1/data/test_results', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    test_name: testName,
                    input_data: inputText,
                    status: 'running'
                })
            });

            if (!testRecord.ok) {
                throw new Error('Failed to create test record');
            }

            const testData = await testRecord.json();

            // Execute the pipeline
            const pipelineResponse = await fetch(`/api/v1/pipelines/${pipelineId}/execute`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input_data: {
                        input_text: inputText,
                        test_id: testData.test_id
                    }
                })
            });

            if (pipelineResponse.ok) {
                const result = await pipelineResponse.json();
                
                // Update test record with results
                await fetch(`/api/v1/data/test_results/${testData.test_id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pipeline_result: JSON.stringify(result.output),
                        status: 'completed'
                    })
                });

                alert('Pipeline executed successfully!');
            } else {
                const error = await pipelineResponse.text();
                
                // Update test record with error
                await fetch(`/api/v1/data/test_results/${testData.test_id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pipeline_result: `Error: ${error}`,
                        status: 'failed'
                    })
                });

                alert('Pipeline execution failed: ' + error);
            }

            // Refresh data and UI
            await this.loadData();
            this.render();

        } catch (error) {
            console.error('Pipeline execution error:', error);
            alert('Error executing pipeline: ' + error.message);
        } finally {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<i class="fas fa-rocket me-2"></i>Execute Pipeline';
        }
    }
}

customElements.define('pipeline-test-app', PipelineTestApp);