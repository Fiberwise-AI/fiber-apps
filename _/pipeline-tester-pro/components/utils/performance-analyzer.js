/**
 * Performance Analyzer Utility
 * 
 * UI interface for the Python analyzePipelinePerformance function via FiberWise SDK.
 * All actual performance analysis is handled by the Python function.
 */

export class PerformanceAnalyzer {
  constructor(fiberInstance) {
    this.fiber = fiberInstance;
    this.analysisCache = new Map();
    this.performanceHistory = [];
    this.thresholds = {
      responseTime: {
        excellent: 100,
        good: 500,
        acceptable: 2000,
        poor: 10000
      },
      throughput: {
        high: 1000,
        medium: 100,
        low: 10
      },
      errorRate: {
        excellent: 0.001,
        good: 0.01,
        acceptable: 0.05,
        poor: 0.1
      }
    };
  }

  async init() {
    console.log('[PerformanceAnalyzer] Initializing performance analyzer...');
    
    // Initialize performance monitoring
    this.startPerformanceMonitoring();
    
    // Load historical performance data
    await this.loadPerformanceHistory();
  }

  /**
   * Analyze pipeline performance using the FiberWise function
   */
  async analyzePerformance(executionLogs, options = {}) {
    try {
      const analysisParams = {
        execution_logs: executionLogs,
        analysis_type: options.analysisType || 'timing',
        time_window: options.timeWindow || '1h'
      };

      console.log('[PerformanceAnalyzer] Starting performance analysis...');

      // Use FiberWise SDK to call the performance analysis function
      const result = await this.fiber.func.activate('analyzePipelinePerformance', analysisParams);

      if (result && result.output) {
        const analysis = result.output;
        
        // Cache the analysis results
        const cacheKey = this.generateCacheKey(analysisParams);
        this.analysisCache.set(cacheKey, {
          analysis,
          timestamp: Date.now(),
          ttl: 300000 // 5 minutes TTL
        });

        // Add to performance history
        this.addToHistory(analysis);

        return {
          success: true,
          analysis: analysis.performance_summary,
          bottlenecks: analysis.bottlenecks,
          recommendations: analysis.recommendations,
          chartsData: analysis.charts_data,
          metadata: analysis.analysis_metadata
        };
      } else {
        throw new Error('Invalid response from performance analysis function');
      }

    } catch (error) {
      console.error('[PerformanceAnalyzer] Analysis failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackAnalysis: await this.performFallbackAnalysis(executionLogs)
      };
    }
  }

  /**
   * Get real-time performance metrics
   */
  async getRealTimeMetrics(pipelineId = null) {
    try {
      // Get recent execution logs from FiberWise
      const executionLogs = await this.getRecentExecutionLogs(pipelineId);
      
      if (!executionLogs || executionLogs.length === 0) {
        return this.getEmptyMetrics();
      }

      // Perform quick analysis for real-time display
      const metrics = {
        currentThroughput: this.calculateCurrentThroughput(executionLogs),
        averageResponseTime: this.calculateAverageResponseTime(executionLogs),
        errorRate: this.calculateErrorRate(executionLogs),
        successRate: this.calculateSuccessRate(executionLogs),
        activeExecutions: await this.getActiveExecutionCount(),
        lastUpdated: new Date().toISOString()
      };

      // Add performance ratings
      metrics.ratings = {
        throughput: this.rateThroughput(metrics.currentThroughput),
        responseTime: this.rateResponseTime(metrics.averageResponseTime),
        errorRate: this.rateErrorRate(metrics.errorRate)
      };

      return metrics;

    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to get real-time metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get recent execution logs from FiberWise
   */
  async getRecentExecutionLogs(pipelineId = null, limit = 100) {
    try {
      let query = {
        limit,
        sort: 'started_at:desc'
      };

      if (pipelineId) {
        query.filter = `pipeline_id:${pipelineId}`;
      }

      // Use FiberWise SDK to get execution logs
      // This assumes execution logs are stored in a data model
      const response = await this.fiber.data.get('execution_logs', query);

      if (response && response.items) {
        return response.items;
      } else {
        console.warn('[PerformanceAnalyzer] No execution logs found');
        return [];
      }

    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to fetch execution logs:', error);
      return [];
    }
  }

  /**
   * Get optimization recommendations based on current performance
   */
  async getOptimizationRecommendations(timeWindow = '1h') {
    try {
      const executionLogs = await this.getRecentExecutionLogs(null, 200);
      
      if (!executionLogs || executionLogs.length === 0) {
        return {
          recommendations: ['No recent execution data available for analysis'],
          priority: 'low',
          category: 'data_availability'
        };
      }

      // Use the performance analysis function to get detailed recommendations
      const analysisResult = await this.analyzePerformance(executionLogs, {
        analysisType: 'comprehensive',
        timeWindow
      });

      if (analysisResult.success) {
        return {
          recommendations: analysisResult.recommendations,
          bottlenecks: analysisResult.bottlenecks,
          priority: this.calculateRecommendationPriority(analysisResult.bottlenecks),
          category: 'performance_optimization',
          timestamp: new Date().toISOString()
        };
      } else {
        return this.getFallbackRecommendations(executionLogs);
      }

    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to get recommendations:', error);
      return {
        recommendations: ['Unable to generate recommendations due to analysis error'],
        priority: 'medium',
        category: 'error_recovery'
      };
    }
  }

  /**
   * Generate performance trend analysis
   */
  async generateTrendAnalysis(timeWindow = '24h') {
    try {
      // Get historical data
      const historicalData = this.getHistoricalData(timeWindow);
      
      if (historicalData.length < 2) {
        return {
          trend: 'insufficient_data',
          message: 'Not enough historical data for trend analysis'
        };
      }

      // Calculate trends
      const trends = {
        responseTime: this.calculateTrend(historicalData, 'averageResponseTime'),
        throughput: this.calculateTrend(historicalData, 'throughput'),
        errorRate: this.calculateTrend(historicalData, 'errorRate'),
        successRate: this.calculateTrend(historicalData, 'successRate')
      };

      // Overall trend assessment
      const overallTrend = this.assessOverallTrend(trends);

      return {
        trends,
        overallTrend,
        timeWindow,
        dataPoints: historicalData.length,
        analysis: this.generateTrendInsights(trends)
      };

    } catch (error) {
      console.error('[PerformanceAnalyzer] Trend analysis failed:', error);
      return {
        trend: 'error',
        message: 'Failed to generate trend analysis'
      };
    }
  }

  /**
   * Start real-time performance monitoring
   */
  startPerformanceMonitoring() {
    // Set up periodic performance data collection
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.getRealTimeMetrics();
        this.addToHistory({
          timestamp: new Date().toISOString(),
          ...metrics
        });

        // Trigger performance events if needed
        this.checkPerformanceAlerts(metrics);

      } catch (error) {
        console.error('[PerformanceAnalyzer] Monitoring error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Perform fallback analysis when main analysis fails
   */
  async performFallbackAnalysis(executionLogs) {
    try {
      const fallbackAnalysis = {
        totalExecutions: executionLogs.length,
        timeRange: this.getTimeRange(executionLogs),
        basicMetrics: {
          averageResponseTime: this.calculateAverageResponseTime(executionLogs),
          errorRate: this.calculateErrorRate(executionLogs),
          throughput: this.calculateCurrentThroughput(executionLogs)
        },
        recommendations: [
          'Basic analysis performed due to detailed analysis failure',
          'Check system resources and connectivity',
          'Review execution logs for errors'
        ]
      };

      return fallbackAnalysis;

    } catch (error) {
      console.error('[PerformanceAnalyzer] Fallback analysis failed:', error);
      return {
        error: 'Complete analysis failure',
        recommendations: ['Manual investigation required']
      };
    }
  }

  // Utility methods for calculations

  calculateCurrentThroughput(executionLogs) {
    if (!executionLogs || executionLogs.length === 0) return 0;

    // Calculate executions per hour based on recent data
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentExecutions = executionLogs.filter(log => {
      const logTime = new Date(log.started_at || log.timestamp);
      return logTime >= oneHourAgo;
    });

    return recentExecutions.length;
  }

  calculateAverageResponseTime(executionLogs) {
    if (!executionLogs || executionLogs.length === 0) return 0;

    const durations = executionLogs
      .map(log => log.duration_ms)
      .filter(duration => duration != null);

    if (durations.length === 0) return 0;

    return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  }

  calculateErrorRate(executionLogs) {
    if (!executionLogs || executionLogs.length === 0) return 0;

    const failedCount = executionLogs.filter(log => 
      log.status === 'failed' || log.status === 'error'
    ).length;

    return Number((failedCount / executionLogs.length).toFixed(4));
  }

  calculateSuccessRate(executionLogs) {
    return 1 - this.calculateErrorRate(executionLogs);
  }

  async getActiveExecutionCount() {
    try {
      // Query for currently running executions
      const response = await this.fiber.data.get('execution_logs', {
        filter: 'status:running',
        limit: 1000
      });

      return response && response.items ? response.items.length : 0;

    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to get active execution count:', error);
      return 0;
    }
  }

  // Rating methods
  rateThroughput(throughput) {
    if (throughput >= this.thresholds.throughput.high) return 'high';
    if (throughput >= this.thresholds.throughput.medium) return 'medium';
    return 'low';
  }

  rateResponseTime(responseTime) {
    if (responseTime <= this.thresholds.responseTime.excellent) return 'excellent';
    if (responseTime <= this.thresholds.responseTime.good) return 'good';
    if (responseTime <= this.thresholds.responseTime.acceptable) return 'acceptable';
    return 'poor';
  }

  rateErrorRate(errorRate) {
    if (errorRate <= this.thresholds.errorRate.excellent) return 'excellent';
    if (errorRate <= this.thresholds.errorRate.good) return 'good';
    if (errorRate <= this.thresholds.errorRate.acceptable) return 'acceptable';
    return 'poor';
  }

  // Helper methods
  generateCacheKey(params) {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  addToHistory(data) {
    this.performanceHistory.push({
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });

    // Keep only last 1000 entries
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
  }

  getHistoricalData(timeWindow) {
    const now = new Date();
    let cutoffTime;

    // Parse time window
    const match = timeWindow.match(/^(\d+)([hdw])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 'h':
          cutoffTime = new Date(now.getTime() - value * 60 * 60 * 1000);
          break;
        case 'd':
          cutoffTime = new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
          break;
        case 'w':
          cutoffTime = new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24h
      }
    } else {
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24h
    }

    return this.performanceHistory.filter(entry => {
      const entryTime = new Date(entry.timestamp);
      return entryTime >= cutoffTime;
    });
  }

  calculateTrend(data, metric) {
    if (data.length < 2) return { trend: 'insufficient_data', change: 0 };

    const recent = data.slice(-Math.ceil(data.length / 3)); // Last third
    const older = data.slice(0, Math.floor(data.length / 3)); // First third

    const recentAvg = recent.reduce((sum, item) => sum + (item[metric] || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + (item[metric] || 0), 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    let trend;
    if (Math.abs(change) < 5) trend = 'stable';
    else if (change > 0) trend = 'increasing';
    else trend = 'decreasing';

    return { trend, change: Math.round(change * 100) / 100 };
  }

  assessOverallTrend(trends) {
    const trendScores = {
      responseTime: trends.responseTime.trend === 'decreasing' ? 1 : (trends.responseTime.trend === 'stable' ? 0 : -1),
      throughput: trends.throughput.trend === 'increasing' ? 1 : (trends.throughput.trend === 'stable' ? 0 : -1),
      errorRate: trends.errorRate.trend === 'decreasing' ? 1 : (trends.errorRate.trend === 'stable' ? 0 : -1),
      successRate: trends.successRate.trend === 'increasing' ? 1 : (trends.successRate.trend === 'stable' ? 0 : -1)
    };

    const totalScore = Object.values(trendScores).reduce((sum, score) => sum + score, 0);

    if (totalScore >= 2) return 'improving';
    if (totalScore <= -2) return 'degrading';
    return 'stable';
  }

  generateTrendInsights(trends) {
    const insights = [];

    if (trends.responseTime.trend === 'increasing') {
      insights.push(`Response time increasing by ${Math.abs(trends.responseTime.change)}%`);
    }
    if (trends.errorRate.trend === 'increasing') {
      insights.push(`Error rate trending upward by ${Math.abs(trends.errorRate.change)}%`);
    }
    if (trends.throughput.trend === 'decreasing') {
      insights.push(`Throughput declining by ${Math.abs(trends.throughput.change)}%`);
    }

    return insights.length > 0 ? insights : ['Performance metrics appear stable'];
  }

  checkPerformanceAlerts(metrics) {
    const alerts = [];

    if (metrics.ratings.responseTime === 'poor') {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `High response time detected: ${metrics.averageResponseTime}ms`
      });
    }

    if (metrics.ratings.errorRate === 'poor') {
      alerts.push({
        type: 'reliability',
        severity: 'high',
        message: `High error rate detected: ${(metrics.errorRate * 100).toFixed(2)}%`
      });
    }

    if (alerts.length > 0) {
      // Emit alerts (could be sent to monitoring systems)
      console.warn('[PerformanceAnalyzer] Performance alerts:', alerts);
    }

    return alerts;
  }

  calculateRecommendationPriority(bottlenecks) {
    if (!bottlenecks || bottlenecks.length === 0) return 'low';
    
    const highPriorityCount = bottlenecks.filter(b => b.priority === 'high').length;
    const mediumPriorityCount = bottlenecks.filter(b => b.priority === 'medium').length;

    if (highPriorityCount > 0) return 'high';
    if (mediumPriorityCount > 2) return 'high';
    if (mediumPriorityCount > 0) return 'medium';
    return 'low';
  }

  getFallbackRecommendations(executionLogs) {
    const recommendations = [];
    const errorRate = this.calculateErrorRate(executionLogs);
    const avgResponseTime = this.calculateAverageResponseTime(executionLogs);

    if (errorRate > 0.05) {
      recommendations.push({
        category: 'Error Rate',
        recommendation: 'High error rate detected - implement better error handling',
        priority: 'high'
      });
    }

    if (avgResponseTime > 2000) {
      recommendations.push({
        category: 'Performance',
        recommendation: 'High response times - consider optimization',
        priority: 'medium'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        category: 'General',
        recommendation: 'Performance appears stable - continue monitoring',
        priority: 'low'
      });
    }

    return {
      recommendations,
      priority: recommendations.some(r => r.priority === 'high') ? 'high' : 'medium',
      category: 'fallback_analysis'
    };
  }

  getEmptyMetrics() {
    return {
      currentThroughput: 0,
      averageResponseTime: 0,
      errorRate: 0,
      successRate: 1,
      activeExecutions: 0,
      lastUpdated: new Date().toISOString(),
      ratings: {
        throughput: 'low',
        responseTime: 'excellent',
        errorRate: 'excellent'
      }
    };
  }

  getTimeRange(executionLogs) {
    if (!executionLogs || executionLogs.length === 0) return null;

    const timestamps = executionLogs
      .map(log => new Date(log.started_at || log.timestamp))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (timestamps.length === 0) return null;

    return {
      start: timestamps[0].toISOString(),
      end: timestamps[timestamps.length - 1].toISOString(),
      duration: timestamps[timestamps.length - 1] - timestamps[0]
    };
  }

  async loadPerformanceHistory() {
    try {
      // Load recent performance data to populate history
      const recentLogs = await this.getRecentExecutionLogs(null, 500);
      
      // Group by time periods and create historical entries
      const timeGroups = this.groupLogsByTime(recentLogs, 'hour');
      
      for (const [timeKey, logs] of Object.entries(timeGroups)) {
        this.addToHistory({
          timestamp: timeKey,
          averageResponseTime: this.calculateAverageResponseTime(logs),
          throughput: logs.length,
          errorRate: this.calculateErrorRate(logs),
          successRate: this.calculateSuccessRate(logs)
        });
      }

      console.log(`[PerformanceAnalyzer] Loaded ${this.performanceHistory.length} historical data points`);

    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to load performance history:', error);
    }
  }

  groupLogsByTime(logs, interval = 'hour') {
    const groups = {};

    logs.forEach(log => {
      const timestamp = new Date(log.started_at || log.timestamp);
      let groupKey;

      if (interval === 'hour') {
        groupKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours()).toISOString();
      } else if (interval === 'day') {
        groupKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate()).toISOString();
      } else {
        groupKey = timestamp.toISOString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(log);
    });

    return groups;
  }
}