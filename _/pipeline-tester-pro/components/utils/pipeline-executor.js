/**
 * Pipeline Executor Utility
 * 
 * Handles pipeline execution, monitoring, and result processing
 */

export class PipelineExecutor {
  constructor(fiberInstance) {
    this.fiber = fiberInstance;
    this.activeExecutions = new Map();
    this.executionHistory = [];
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };
  }

  async init() {
    console.log('[PipelineExecutor] Initializing pipeline executor...');
    // Any initialization logic here
  }

  /**
   * Execute a pipeline with monitoring and metrics collection
   */
  async executePipeline(pipelineId, inputData, options = {}) {
    const executionId = this.generateExecutionId();
    const startTime = performance.now();
    
    const execution = {
      id: executionId,
      pipelineId,
      inputData,
      startTime,
      status: 'running',
      progress: 0,
      nodeResults: {},
      error: null
    };

    this.activeExecutions.set(executionId, execution);
    this.metrics.totalExecutions++;

    try {
      // Execute the pipeline via API
      const response = await fetch(`/api/v1/pipelines/${pipelineId}/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_data: inputData,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update execution status
      execution.status = 'completed';
      execution.result = result;
      execution.endTime = performance.now();
      execution.duration = execution.endTime - startTime;
      execution.progress = 100;

      this.metrics.successfulExecutions++;
      this.updateAverageExecutionTime(execution.duration);

      // Move to history
      this.executionHistory.unshift(execution);
      this.activeExecutions.delete(executionId);

      return {
        success: true,
        executionId,
        result,
        duration: execution.duration
      };

    } catch (error) {
      console.error('[PipelineExecutor] Execution failed:', error);
      
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = performance.now();
      execution.duration = execution.endTime - startTime;

      this.metrics.failedExecutions++;

      // Move to history
      this.executionHistory.unshift(execution);
      this.activeExecutions.delete(executionId);

      return {
        success: false,
        executionId,
        error: error.message,
        duration: execution.duration
      };
    }
  }

  /**
   * Get real-time status of an execution
   */
  getExecutionStatus(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      return {
        id: executionId,
        status: execution.status,
        progress: execution.progress,
        duration: performance.now() - execution.startTime,
        nodeResults: execution.nodeResults
      };
    }

    // Check history
    const historicalExecution = this.executionHistory.find(ex => ex.id === executionId);
    if (historicalExecution) {
      return {
        id: executionId,
        status: historicalExecution.status,
        progress: 100,
        duration: historicalExecution.duration,
        result: historicalExecution.result,
        error: historicalExecution.error
      };
    }

    return null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(0, limit);
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalExecutions > 0 
        ? (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100 
        : 0,
      activeExecutions: this.activeExecutions.size
    };
  }

  /**
   * Cancel an active execution
   */
  async cancelExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found or already completed`);
    }

    try {
      // If there's an API to cancel executions, call it here
      // For now, we'll just mark it as cancelled locally
      execution.status = 'cancelled';
      execution.endTime = performance.now();
      execution.duration = execution.endTime - execution.startTime;

      this.executionHistory.unshift(execution);
      this.activeExecutions.delete(executionId);

      return true;
    } catch (error) {
      console.error('[PipelineExecutor] Failed to cancel execution:', error);
      return false;
    }
  }

  /**
   * Validate pipeline input before execution
   */
  async validateInput(pipelineId, inputData) {
    try {
      // Use the validation function if available
      const response = await this.fiber.func.activate('validatePipelineInput', {
        pipeline_id: pipelineId,
        input_data: inputData,
        validation_mode: 'strict'
      });

      return response;
    } catch (error) {
      console.warn('[PipelineExecutor] Input validation unavailable, skipping validation');
      return { is_valid: true, validation_errors: [] };
    }
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update running average execution time
   */
  updateAverageExecutionTime(newDuration) {
    const totalDurations = this.metrics.averageExecutionTime * (this.metrics.successfulExecutions - 1) + newDuration;
    this.metrics.averageExecutionTime = totalDurations / this.metrics.successfulExecutions;
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };
  }
}