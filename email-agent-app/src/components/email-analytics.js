import { dataService } from '../services/data-service.js';

export class EmailAnalytics extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.analyses = [];
    this.loading = true;
    this.error = null;
    this.stats = {
      totalAnalyzed: 0,
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
      priorityBreakdown: { high: 0, medium: 0, low: 0 },
      topTopics: [],
      topLabels: []
    };
    this.timeframe = 'month'; // week, month, year, all
  }

  connectedCallback() {
    this.render();
    this.loadAnalyses();
  }

  async loadAnalyses() {
    try {
      this.loading = true;
      this.render();

      // Load analytics data using the data service
      const analyticsData = await dataService.getEmailAnalyticsData({
        timeframe: this.timeframe
      });
      
      this.analyses = analyticsData.analyses || [];
      this.stats = analyticsData.stats || this.stats;
      this.error = null;
    } catch (error) {
      console.error('Error loading analyses:', error);
      this.error = error.message || 'An error occurred while loading analyses';
      this.analyses = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }

  changeTimeframe(timeframe) {
    this.timeframe = timeframe;
    this.loadAnalyses();
  }

  // ...existing code...

  render() {
    // ...existing render code...
    
    // Add event listeners for timeframe buttons
    if (!this.loading) {
      this.shadowRoot.querySelectorAll('.timeframe-button').forEach(button => {
        button.addEventListener('click', () => {
          this.changeTimeframe(button.dataset.timeframe);
        });
      });
    }
  }
}

customElements.define('email-analytics', EmailAnalytics);