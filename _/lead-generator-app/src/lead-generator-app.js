/**
 * Lead Generator App Component
 * 
 * Main component that implements lead generation pipeline with web interface
 */
import htmlTemplate from './lead-generator-app.html?raw';
import cssStyles from './lead-generator-app.css?inline';
import { FIBER } from '../index.js';

export class LeadGeneratorApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // App state
    this.isLoading = true;
    this.currentView = 'pipeline'; // pipeline, execution, review, leads
    this.currentSession = null;
    this.currentPipelineExecution = null;
    this.leads = [];
    this.pendingReviewData = null;
  }

  connectedCallback() {
    if (!this.initialized) {
      console.log('[LeadGenerator] Initializing component');
      this.initialized = true;
      this.init();
    }
  }
  
  async init() {
    console.log('[LeadGenerator] Running init()');
    
    try {
      // Connect to realtime updates for pipeline execution
      await FIBER.realtime.connect();
      FIBER.realtime.on('message', (message) => {
        if (message.type === 'pipeline_execution_updated') {
          this.handlePipelineUpdate(message);
        }
      });
      
      // Load existing leads
      await this.loadLeads();
      
      this.isLoading = false;
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing lead generator app:', error);
      this.isLoading = false;
      this.render();
    }
  }

  async loadLeads() {
    try {
      console.log('[LeadGenerator] Loading leads');
      
      const response = await FIBER.data.listItems('leads', {
        limit: 100,
        sort: [{ field: 'created_at', direction: 'desc' }]
      });
      
      this.leads = response.items || [];
      console.log('[LeadGenerator] Loaded leads:', this.leads);
      return this.leads;
    } catch (error) {
      console.error('Error loading leads:', error);
      this.showMessage('Failed to load leads', 'error');
      return [];
    }
  }

  async startPipeline(businessType, location) {
    try {
      console.log('[LeadGenerator] Starting pipeline:', { businessType, location });
      
      // Create a pipeline session
      const sessionData = {
        business_type: businessType,
        location: location,
        status: 'running',
        current_step: 'find_businesses'
      };
      
      const session = await FIBER.data.createItem('pipeline-sessions', sessionData);
      this.currentSession = session;
      
      console.log('[LeadGenerator] Created session:', session);
      
      // Execute the pipeline
      const pipelineInput = {
        business_type: businessType,
        location: location
      };
      
      const execution = await FIBER.pipelines.execute(
        'B2B Lead Generation Pipeline',
        pipelineInput,
        { session_id: session.item_id }
      );
      
      this.currentPipelineExecution = execution;
      
      // Switch to execution view
      this.currentView = 'execution';
      this.render();
      
      this.showMessage(`Pipeline started for ${businessType} in ${location}`, 'success');
      
      return execution;
    } catch (error) {
      console.error('Error starting pipeline:', error);
      this.showMessage('Failed to start pipeline: ' + error.message, 'error');
      throw error;
    }
  }

  async submitReview(decision, notes) {
    try {
      console.log('[LeadGenerator] Submitting review:', { decision, notes });
      
      if (!this.pendingReviewData) {
        throw new Error('No pending review data');
      }
      
      // Submit the human input step
      const reviewResult = await FIBER.pipelines.submitHumanInput(
        this.currentPipelineExecution.id,
        'human_review_lead',
        {
          decision: decision,
          notes: notes || ''
        }
      );
      
      console.log('[LeadGenerator] Review submitted:', reviewResult);
      
      // Switch back to execution view to show completion
      this.currentView = 'execution';
      this.updateStepStatus('human_review_lead', 'completed');
      this.updateStepStatus('save_lead_to_database', 'running');
      this.render();
      
      this.showMessage(`Lead ${decision.toLowerCase()}ed successfully`, 'success');
      
      return reviewResult;
    } catch (error) {
      console.error('Error submitting review:', error);
      this.showMessage('Failed to submit review: ' + error.message, 'error');
      throw error;
    }
  }

  handlePipelineUpdate(message) {
    console.log('[LeadGenerator] Pipeline update:', message);
    
    const { step_id, status, data } = message;
    
    // Update step status in UI
    this.updateStepStatus(step_id, status);
    
    // Handle specific step completions
    if (status === 'completed') {
      if (step_id === 'score_lead_quality') {
        // Next step is human review - prepare the data
        this.prepareHumanReview(data);
      } else if (step_id === 'save_lead_to_database') {
        // Pipeline completed - refresh leads and show success
        this.handlePipelineCompletion();
      }
    } else if (status === 'waiting_for_human_input' && step_id === 'human_review_lead') {
      // Show review panel
      this.showReviewPanel(data);
    }
  }

  updateStepStatus(stepId, status) {
    const stepElement = this.shadowRoot.querySelector(`#step-${stepId.replace('_', '-')}`);
    if (stepElement) {
      // Remove existing status classes
      stepElement.classList.remove('active', 'completed', 'error');
      
      // Add new status
      if (status === 'running') {
        stepElement.classList.add('active');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-spinner fa-spin running';
        }
      } else if (status === 'completed') {
        stepElement.classList.add('completed');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-check completed';
        }
      } else if (status === 'error') {
        stepElement.classList.add('error');
        const statusIcon = stepElement.querySelector('.step-status i');
        if (statusIcon) {
          statusIcon.className = 'fas fa-times error';
        }
      }
    }
  }

  prepareHumanReview(pipelineData) {
    console.log('[LeadGenerator] Preparing human review with data:', pipelineData);
    this.pendingReviewData = pipelineData;
  }

  showReviewPanel(reviewData) {
    console.log('[LeadGenerator] Showing review panel with data:', reviewData);
    
    // Store the review data
    this.pendingReviewData = reviewData;
    
    // Switch to review view
    this.currentView = 'review';
    this.render();
    
    // Populate review form with data
    this.populateReviewForm(reviewData);
  }

  populateReviewForm(data) {
    const steps = data.steps || {};
    
    // Company info
    const businessDetails = steps.get_top_business_details?.result || {};
    const socialData = steps.enrich_with_socials?.result || {};
    const scoringData = steps.score_lead_quality?.result || {};
    
    // Populate fields
    this.shadowRoot.querySelector('#review-company-name').textContent = 
      businessDetails.name || 'Unknown Company';
    
    const websiteLink = this.shadowRoot.querySelector('#review-website');
    if (businessDetails.website) {
      websiteLink.href = businessDetails.website;
      websiteLink.textContent = businessDetails.website;
      websiteLink.style.display = 'inline';
    } else {
      websiteLink.style.display = 'none';
    }
    
    this.shadowRoot.querySelector('#review-phone').textContent = 
      businessDetails.phone_number || '-';
    
    this.shadowRoot.querySelector('#review-address').textContent = 
      businessDetails.address || '-';
    
    const linkedinLink = this.shadowRoot.querySelector('#review-linkedin');
    if (socialData.linkedin_url) {
      linkedinLink.href = socialData.linkedin_url;
      linkedinLink.textContent = 'View Profile';
      linkedinLink.style.display = 'inline';
    } else {
      linkedinLink.style.display = 'none';
    }
    
    const twitterLink = this.shadowRoot.querySelector('#review-twitter');
    if (socialData.twitter_url) {
      twitterLink.href = socialData.twitter_url;
      twitterLink.textContent = 'View Profile';
      twitterLink.style.display = 'inline';
    } else {
      twitterLink.style.display = 'none';
    }
    
    // AI score and reasoning
    this.shadowRoot.querySelector('#review-score').textContent = 
      scoringData.score || '0';
    
    this.shadowRoot.querySelector('#review-reasoning').textContent = 
      scoringData.reasoning || 'No AI analysis available';
  }

  async handlePipelineCompletion() {
    console.log('[LeadGenerator] Pipeline completed');
    
    // Update session status
    if (this.currentSession) {
      await FIBER.data.updateItem('pipeline-sessions', this.currentSession.item_id, {
        status: 'completed',
        current_step: 'completed'
      });
    }
    
    // Reload leads to show the new one
    await this.loadLeads();
    
    // Show success message
    this.showMessage('Pipeline completed successfully! Lead saved to database.', 'success');
    
    // Reset state
    setTimeout(() => {
      this.resetPipeline();
    }, 3000);
  }

  resetPipeline() {
    this.currentView = 'pipeline';
    this.currentSession = null;
    this.currentPipelineExecution = null;
    this.pendingReviewData = null;
    this.render();
  }

  showMessage(message, type = 'info') {
    const container = this.shadowRoot.querySelector('#message-container');
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                      type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }

  setupEventListeners() {
    // New pipeline button
    const newPipelineBtn = this.shadowRoot.querySelector('#new-pipeline-btn');
    if (newPipelineBtn) {
      newPipelineBtn.addEventListener('click', () => {
        this.currentView = 'pipeline';
        this.render();
      });
    }
    
    // View leads button
    const viewLeadsBtn = this.shadowRoot.querySelector('#view-leads-btn');
    if (viewLeadsBtn) {
      viewLeadsBtn.addEventListener('click', () => {
        this.currentView = 'leads';
        this.render();
        this.renderLeads();
      });
    }
    
    // Pipeline form submission
    const pipelineForm = this.shadowRoot.querySelector('#pipeline-form');
    if (pipelineForm) {
      pipelineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const businessType = this.shadowRoot.querySelector('#business-type').value;
        const location = this.shadowRoot.querySelector('#location').value;
        
        if (businessType && location) {
          await this.startPipeline(businessType, location);
        }
      });
    }
    
    // Cancel pipeline button
    const cancelBtn = this.shadowRoot.querySelector('#cancel-pipeline-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetPipeline();
      });
    }
    
    // Review form submission
    const reviewForm = this.shadowRoot.querySelector('#review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const decision = this.shadowRoot.querySelector('input[name="decision"]:checked')?.value;
        const notes = this.shadowRoot.querySelector('#review-notes').value;
        
        if (decision) {
          await this.submitReview(decision, notes);
        }
      });
    }
    
    // Review cancel button
    const reviewCancelBtn = this.shadowRoot.querySelector('#review-cancel-btn');
    if (reviewCancelBtn) {
      reviewCancelBtn.addEventListener('click', () => {
        this.currentView = 'execution';
        this.render();
      });
    }
    
    // Leads filter
    const leadsFilter = this.shadowRoot.querySelector('#leads-filter');
    if (leadsFilter) {
      leadsFilter.addEventListener('change', () => {
        this.renderLeads();
      });
    }
    
    // Refresh leads button
    const refreshLeadsBtn = this.shadowRoot.querySelector('#refresh-leads-btn');
    if (refreshLeadsBtn) {
      refreshLeadsBtn.addEventListener('click', async () => {
        await this.loadLeads();
        this.renderLeads();
      });
    }
  }

  renderLeads() {
    const container = this.shadowRoot.querySelector('#leads-list');
    const emptyState = this.shadowRoot.querySelector('#leads-empty');
    const filter = this.shadowRoot.querySelector('#leads-filter').value;
    
    let filteredLeads = this.leads;
    
    if (filter !== 'all') {
      filteredLeads = this.leads.filter(lead => {
        if (filter === 'approved') return lead.human_decision === 'Approve';
        if (filter === 'rejected') return lead.human_decision === 'Reject';
        if (filter === 'new') return !lead.human_decision || lead.status === 'new';
        return true;
      });
    }
    
    if (filteredLeads.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = filteredLeads.map(lead => `
      <div class="lead-item">
        <div class="lead-header">
          <div class="lead-title">${lead.company_name}</div>
          <div class="lead-score">${lead.lead_score || 0}/100</div>
        </div>
        <div class="lead-details">
          <div class="lead-detail">
            <i class="fas fa-globe"></i>
            <span>${lead.website || 'No website'}</span>
          </div>
          <div class="lead-detail">
            <i class="fas fa-phone"></i>
            <span>${lead.phone_number || 'No phone'}</span>
          </div>
          <div class="lead-detail">
            <i class="fas fa-map-marker-alt"></i>
            <span>${lead.address || 'No address'}</span>
          </div>
          <div class="lead-detail">
            <i class="fab fa-linkedin"></i>
            <span>${lead.linkedin_url ? 'LinkedIn' : 'No LinkedIn'}</span>
          </div>
        </div>
        <div class="lead-status">
          <div class="status-badge ${(lead.human_decision === 'Approve' ? 'approved' : 
                                    lead.human_decision === 'Reject' ? 'rejected' : 'new')}">
            ${lead.human_decision || 'New'}
          </div>
          <div class="lead-date">
            ${new Date(lead.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    `).join('');
  }

  render() {
    console.log('[LeadGenerator] Rendering component, view:', this.currentView);
    
    // Inject HTML template and CSS
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
    `;
    
    // Show/hide panels based on current view
    const panels = {
      'pipeline': '#pipeline-panel',
      'execution': '#execution-panel',
      'review': '#review-panel',
      'leads': '#leads-panel'
    };
    
    Object.entries(panels).forEach(([view, selector]) => {
      const panel = this.shadowRoot.querySelector(selector);
      if (panel) {
        if (view === this.currentView) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    });
    
    // Set up event listeners after render
    setTimeout(() => {
      this.setupEventListeners();
      
      if (this.currentView === 'leads') {
        this.renderLeads();
      }
    }, 0);
  }
}

customElements.define('lead-generator-app', LeadGeneratorApp);