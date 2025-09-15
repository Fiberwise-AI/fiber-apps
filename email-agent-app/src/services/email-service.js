/**
 * Email Service
 * 
 * Service that communicates with the EmailAgent to perform
 * operations on emails from different providers.
 */
import { FIBER } from '../../index.js';

class EmailService {
  constructor() {
    this.agentId = 'email-agent'; // ID of the email agent defined in the manifest
    this.messageTypes = {
      CONNECT: 'connect',
      DISCONNECT: 'disconnect',
      SEARCH: 'search',
      FETCH: 'fetch',
      ANALYZE: 'analyze',
      SEND: 'send',
      DRAFT: 'draft',
      LABEL: 'label',
      FOLDER: 'folder',
      ERROR: 'error',
      SUCCESS: 'success',
      WARNING: 'warning',
      INFO: 'info',
      NEW_EMAIL: 'new_email',
      STATUS_UPDATE: 'status_update'
    };
    this.realtimeConnected = false;
  }

  /**
   * Connect method for legacy compatibility
   * Realtime connection is now handled by the app component
   */
  async connect() {
    if (this.realtimeConnected) {
      console.log('[EmailService] Service already initialized');
      return;
    }

    this.realtimeConnected = true;
    console.log('[EmailService] Service initialized (realtime handled by app component)');
    
    // Send notification that service is ready
    this.sendNotification({
      type: this.messageTypes.CONNECT,
      title: 'Service Connected',
      message: 'Email service is now connected and ready',
      level: 'success'
    });
  }
  
  /**
   * Handle agent update messages from realtime connection
   * @param {Object} message The update message
   */
  handleAgentUpdate(message) {
    console.log('[EmailService] Received agent update:', message);
    
    // Dispatch a custom event with the update details
    const event = new CustomEvent('agent-update', {
      bubbles: true,
      composed: true,
      detail: message
    });
    
    document.dispatchEvent(event);
    
    // Generate user-friendly notification based on update type
    if (message.status === 'failed') {
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Operation Failed',
        message: message.message || 'An operation failed. Please try again.',
        level: 'error',
        data: message
      });
    } else if (message.status === 'completed') {
      // Only notify for certain operations to avoid notification fatigue
      if (message.operation === 'analyze_email' || message.operation === 'send_email') {
        this.sendNotification({
          type: this.messageTypes.SUCCESS,
          title: message.operation === 'analyze_email' ? 'Analysis Complete' : 'Email Sent',
          message: message.message || 'Operation completed successfully',
          level: 'success',
          data: message
        });
      }
    }
  }
  
  /**
   * Handle email notifications from realtime connection
   * @param {Object} message The notification message
   */
  handleEmailNotification(message) {
    console.log('[EmailService] Received email notification:', message);
    
    // Dispatch a custom event for new emails or other notifications
    const event = new CustomEvent('email-notification', {
      bubbles: true,
      composed: true,
      detail: message
    });
    
    document.dispatchEvent(event);
    
    // Show notification for new emails
    if (message.subtype === 'new_email') {
      this.sendNotification({
        type: this.messageTypes.NEW_EMAIL,
        title: 'New Email',
        message: `New email from ${message.sender}: ${message.subject}`,
        level: 'info',
        data: message
      });
    }
  }
  
  /**
   * Handle connection status updates from realtime connection
   * @param {Object} message The connection status message
   */
  handleConnectionStatus(message) {
    console.log('[EmailService] Received connection status update:', message);
    
    // Dispatch a custom event for connection status changes
    const event = new CustomEvent('connection-status', {
      bubbles: true,
      composed: true,
      detail: message
    });
    
    document.dispatchEvent(event);
    
    // Show notification for connection changes
    const level = message.status === 'connected' ? 'success' : 
                 message.status === 'disconnected' ? 'warning' : 'info';
                 
    this.sendNotification({
      type: this.messageTypes.STATUS_UPDATE,
      title: `Provider ${message.status}`,
      message: `Email provider ${message.provider_name || message.service_provider_id} is ${message.status}`,
      level: level,
      data: message
    });
  }
  
  /**
   * Send a notification to the user
   * @param {Object} notification Notification details
   */
  sendNotification(notification) {
    // Create and dispatch a custom event for the notification
    const event = new CustomEvent('email-service-notification', {
      bubbles: true,
      composed: true,
      detail: {
        ...notification,
        timestamp: new Date().toISOString()
      }
    });
    
    document.dispatchEvent(event);
    
    // Also log to console for debugging
    console.log(`[EmailService] Notification (${notification.level}): ${notification.title} - ${notification.message}`);
  }
  
  /**
   * Send agent status update through realtime
   * @param {string} taskId The task or operation ID
   * @param {string} status Current status (e.g., 'running', 'completed', 'failed')
   * @param {number} progress Progress value (0.0 to 1.0)
   * @param {string} message Human-readable status message
   * @param {string} connectionId Email provider connection ID associated with this task
   * @param {string} messageId Email message ID if applicable
   */
  async sendAgentUpdate(taskId, status, progress, message, connectionId = null, messageId = null) {
    // This method is no longer needed - the Python agent sends realtime updates directly
    // Keeping for compatibility but not sending any updates
    console.log(`[EmailService] Task ${taskId}: ${status} - ${message} (${Math.round(progress * 100)}%)`);
    return true;
  }

  /**
   * Subscribe to email notifications for a provider
   * @param {string} connectionId Provider connection ID to subscribe to
   * @returns {Promise<boolean>} Success status
   */
  async subscribeToEmailNotifications(connectionId) {
    try {
      // Note: Email subscription would be handled by the backend/agent
      // For now, just log the subscription request
      console.log('[EmailService] Email subscription requested for:', connectionId);
      
      this.sendNotification({
        type: this.messageTypes.INFO,
        title: 'Notifications Enabled',
        message: 'You will now receive notifications for new emails',
        level: 'info'
      });
      
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to subscribe to email notifications:', error);
      
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Notification Setup Failed',
        message: 'Could not enable email notifications. Please try again.',
        level: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Unsubscribe from email notifications for a provider
   * @param {string} connectionId Provider connection ID to unsubscribe from
   * @returns {Promise<boolean>} Success status
   */
  async unsubscribeFromEmailNotifications(connectionId) {
    try {
      // Note: Email unsubscription would be handled by the backend/agent
      // For now, just log the unsubscription request
      console.log('[EmailService] Email unsubscription requested for:', connectionId);
      
      this.sendNotification({
        type: this.messageTypes.INFO,
        title: 'Notifications Disabled',
        message: 'You will no longer receive notifications for new emails',
        level: 'info'
      });
      
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to unsubscribe from email notifications:', error);
      return false;
    }
  }

  /**
   * Search for emails
   * @param {string} connectionId Connection ID
   * @param {string} query Search query
   * @param {number} maxResults Maximum results to return
   * @param {string} label Label/folder to search in
   * @param {number} daysBack Days back to search
   * @returns {Promise<Object>} Search results
   */
  async searchEmails(connectionId, query = '', maxResults = 50, label = null, daysBack = 30) {
    // Create a unique task ID for this search
    const taskId = `search_${Date.now()}`;
    
    try {
      // Send notification that search is starting
      this.sendNotification({
        type: this.messageTypes.SEARCH,
        title: 'Searching Emails',
        message: `Searching for "${query}" in ${label || 'all folders'}`,
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        `Starting email search for "${query}"`, 
        connectionId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'search_emails',
        connection_id: connectionId,
        query,
        max_results: maxResults,
        label,
        days_back: daysBack
      };

      // Create context object with operation identifiers
      const context = {
        operation_type: 'search',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Searching email account...', 
        connectionId
      );
      
      // Execute the search
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Cache the messages for faster future loading
      if (result.result?.messages?.length > 0) {
        try {
          await this.cacheMessages(result.result.messages, connectionId);
          console.log(`[EmailService] Cached ${result.result.messages.length} messages`);
        } catch (cacheError) {
          console.warn('[EmailService] Failed to cache messages:', cacheError);
          // Don't fail the search if caching fails
        }
      }
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        `Found ${result.result?.messages?.length || 0} emails matching your search`, 
        connectionId
      );
      
      // Send notification about search results
      this.sendNotification({
        type: this.messageTypes.SUCCESS,
        title: 'Search Complete',
        message: `Found ${result.result?.messages?.length || 0} emails matching "${query}"`,
        level: 'success'
      });
      
      return result;
    } catch (error) {
      console.error('Error searching emails:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Search failed: ${error.message}`, 
        connectionId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Search Failed',
        message: `Could not complete search: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Get email details
   * @param {string} connectionId Connection ID
   * @param {string} messageId Message ID to retrieve
   * @returns {Promise<Object>} Email details
   */
  async getEmail(connectionId, messageId) {
    try {
      // Use function to get email details (not agent - this is a basic operation)
      const result = await FIBER.func.activate('get_email', {
        authenticator_id: connectionId,
        message_id: messageId
      });
      
      if (result && result.status === 'completed' && result.result && result.result.status === 'success') {
        return {
          status: 'success',
          result: result.result.email
        };
      } else {
        return {
          status: 'error',
          message: (result.result && result.result.message) || result.message || 'Failed to fetch email'
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching email:', error);
      
      return {
        status: 'error',
        message: error.message || 'Failed to fetch email'
      };
    }
  }

  /**
   * Create a draft email
   * @param {string} connectionId Connection ID
   * @param {string} to Recipient(s)
   * @param {string} subject Email subject
   * @param {string} body Email body
   * @param {string} cc CC recipient(s)
   * @param {string} bcc BCC recipient(s)
   * @param {string} replyToMessageId Optional message ID to reply to
   * @returns {Promise<Object>} Draft creation result
   */
  async createDraft(connectionId, to, subject, body, cc = null, bcc = null, replyToMessageId = null) {
    const taskId = `draft_${Date.now()}`;
    const isReply = !!replyToMessageId;
    
    try {
      // Send notification that draft creation is starting
      this.sendNotification({
        type: this.messageTypes.DRAFT,
        title: isReply ? 'Creating Reply Draft' : 'Creating Draft',
        message: `Creating a draft email to ${to}`,
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        `Creating ${isReply ? 'reply ' : ''}draft`, 
        connectionId,
        replyToMessageId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'create_draft',
        connection_id: connectionId,
        to,
        subject,
        body,
        cc,
        bcc,
        reply_to_message_id: replyToMessageId
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'draft',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Creating draft in your account...', 
        connectionId
      );
      
      // Create the draft
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        'Draft created successfully', 
        connectionId
      );
      
      // Send success notification
      this.sendNotification({
        type: this.messageTypes.SUCCESS,
        title: 'Draft Created',
        message: `Your ${isReply ? 'reply ' : ''}draft to ${to} has been saved`,
        level: 'success'
      });
      
      return result;
    } catch (error) {
      console.error('Error creating draft:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Failed to create draft: ${error.message}`, 
        connectionId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Draft Creation Failed',
        message: `Could not create draft: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Send an email
   * @param {string} connectionId Connection ID
   * @param {string} to Recipient(s)
   * @param {string} subject Email subject
   * @param {string} body Email body
   * @param {string} cc CC recipient(s)
   * @param {string} bcc BCC recipient(s)
   * @param {string} replyToMessageId Optional message ID to reply to
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(connectionId, to, subject, body, cc = null, bcc = null, replyToMessageId = null) {
    const taskId = `send_${Date.now()}`;
    const isReply = !!replyToMessageId;
    
    try {
      // Send notification that email sending is starting
      this.sendNotification({
        type: this.messageTypes.SEND,
        title: isReply ? 'Sending Reply' : 'Sending Email',
        message: `Sending email to ${to}`,
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        `Preparing to send ${isReply ? 'reply ' : ''}email`, 
        connectionId,
        replyToMessageId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'send_email',
        connection_id: connectionId,
        to,
        subject,
        body,
        cc,
        bcc,
        reply_to_message_id: replyToMessageId
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'send',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Sending email...', 
        connectionId
      );
      
      // Send the email
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        'Email sent successfully', 
        connectionId
      );
      
      // Send success notification
      this.sendNotification({
        type: this.messageTypes.SUCCESS,
        title: 'Email Sent',
        message: `Your ${isReply ? 'reply ' : ''}email to ${to} has been sent`,
        level: 'success'
      });
      
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Failed to send email: ${error.message}`, 
        connectionId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Send Failed',
        message: `Could not send email: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Analyze an email with AI
   * @param {string} connectionId Connection ID
   * @param {string} messageId Message ID to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeEmail(connectionId, messageId) {
    // Create a unique task ID for this analysis
    const taskId = `analyze_${messageId}_${Date.now()}`;
    
    try {
      // Send notification that analysis is starting
      this.sendNotification({
        type: this.messageTypes.ANALYZE,
        title: 'Starting Analysis',
        message: 'AI is analyzing your email...',
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        'Starting email analysis...', 
        connectionId, 
        messageId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'analyze_email',
        connection_id: connectionId,
        message_id: messageId
      };

      // Create context object with identifiers - message_id is critical for tracking
      const context = {
        operation_type: 'analyze',
        task_id: taskId // Include task ID in context for correlation
      };
      
      // Metadata includes email service provider ID and can include model provider
      const metadata = {
        service_provider_id: connectionId
        // Optional model parameters can go here
        // provider_id: 'openai', // LLM provider ID
        // model_id: 'gpt-4'
      };
      
      // Send detailed progress updates
      await this.sendAgentUpdate(
        taskId, 
        'fetching', 
        0.2, 
        'Retrieving email content...', 
        connectionId, 
        messageId
      );
      
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.3, 
        'Processing email content...', 
        connectionId, 
        messageId
      );
      
      await this.sendAgentUpdate(
        taskId, 
        'analyzing', 
        0.5, 
        'AI is analyzing content...', 
        connectionId, 
        messageId
      );
      
      // Activate the agent
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send more detailed progress updates
      await this.sendAgentUpdate(
        taskId, 
        'generating', 
        0.8, 
        'Generating insights...', 
        connectionId, 
        messageId
      );
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        'Email analysis completed', 
        connectionId, 
        messageId
      );
      
      // Send success notification with some analysis details
      const analysis = result.result?.analysis;
      if (analysis) {
        this.sendNotification({
          type: this.messageTypes.SUCCESS,
          title: 'Analysis Complete',
          message: `Priority: ${analysis.priority || 'N/A'}, Sentiment: ${analysis.sentiment || 'N/A'}`,
          level: 'success',
          data: {
            summary: analysis.summary,
            priority: analysis.priority,
            sentiment: analysis.sentiment
          }
        });
      } else {
        this.sendNotification({
          type: this.messageTypes.SUCCESS,
          title: 'Analysis Complete',
          message: 'Email has been analyzed successfully',
          level: 'success'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error analyzing email:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Analysis failed: ${error.message}`, 
        connectionId, 
        messageId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Analysis Failed',
        message: `Could not analyze email: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Update email labels
   * @param {string} connectionId Connection ID
   * @param {string} messageId Message ID to update
   * @param {Array} addLabels Labels to add
   * @param {Array} removeLabels Labels to remove
   * @returns {Promise<Object>} Update result
   */
  async updateLabels(connectionId, messageId, addLabels = [], removeLabels = []) {
    const taskId = `labels_${messageId}_${Date.now()}`;
    
    try {
      // Prepare friendly message about label changes
      let labelMessage = '';
      if (addLabels.length > 0) {
        labelMessage += `Adding: ${addLabels.join(', ')}`;
      }
      if (removeLabels.length > 0) {
        if (labelMessage) labelMessage += ', ';
        labelMessage += `Removing: ${removeLabels.join(', ')}`;
      }
      
      // Send notification that label update is starting
      this.sendNotification({
        type: this.messageTypes.LABEL,
        title: 'Updating Labels',
        message: labelMessage || 'Updating email labels...',
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        'Starting label update...', 
        connectionId, 
        messageId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'update_labels',
        connection_id: connectionId,
        message_id: messageId,
        add_labels: addLabels,
        remove_labels: removeLabels
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'update_labels',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Updating labels...', 
        connectionId, 
        messageId
      );
      
      // Update the labels
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        'Labels updated successfully', 
        connectionId, 
        messageId
      );
      
      // Send success notification
      this.sendNotification({
        type: this.messageTypes.SUCCESS,
        title: 'Labels Updated',
        message: `Email labels have been updated: ${labelMessage}`,
        level: 'success'
      });
      
      return result;
    } catch (error) {
      console.error('Error updating labels:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Failed to update labels: ${error.message}`, 
        connectionId, 
        messageId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Label Update Failed',
        message: `Could not update labels: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }

  /**
   * List available labels/folders
   * @param {string} connectionId Connection ID
   * @returns {Promise<Object>} List of labels
   */
  async listLabels(connectionId) {
    const taskId = `list_labels_${Date.now()}`;
    
    try {
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        'Fetching available labels/folders...', 
        connectionId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'list_labels',
        connection_id: connectionId
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'list_labels',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Retrieving label information...', 
        connectionId
      );
      
      // List the labels
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        `Found ${result.result?.labels?.length || 0} labels/folders`, 
        connectionId
      );
      
      return result;
    } catch (error) {
      console.error('Error listing labels:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Failed to list labels: ${error.message}`, 
        connectionId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Could Not List Labels',
        message: `Failed to retrieve labels: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }
  
  /**
   * Stream process an email with real-time updates
   * @param {string} connectionId Connection ID
   * @param {string} messageId Message ID to analyze
   * @param {Object} options Streaming options with callbacks
   * @returns {Object} Stream controller
   */
  async streamProcessEmail(connectionId, messageId, options = {}) {
    // Create a unique task ID for this streaming operation
    const taskId = `stream_${messageId}_${Date.now()}`;
    
    try {
      // Send notification that streaming analysis is starting
      this.sendNotification({
        type: this.messageTypes.ANALYZE,
        title: 'Starting Real-time Analysis',
        message: 'AI is analyzing your email in real-time...',
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        'Starting streaming analysis...', 
        connectionId, 
        messageId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'analyze_email',
        connection_id: connectionId,
        message_id: messageId
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'analyze_stream',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Setup callbacks with progress updates
      const callbacks = {
        onMessage: async (chunk) => {
          // Update progress based on chunk counts (approximate)
          const progressIncrement = 0.1; // Increment by 10% per chunk
          this._currentStreamProgress = (this._currentStreamProgress || 0.1) + progressIncrement;
          // Cap at 0.9 (90%) until complete
          const progress = Math.min(this._currentStreamProgress, 0.9);
          
          await this.sendAgentUpdate(
            taskId, 
            'streaming', 
            progress, 
            'Receiving response stream...', 
            connectionId, 
            messageId
          );
          
          // For each chunk, send a more detailed notification at key points
          if (progress === 0.3 || progress === 0.5 || progress === 0.7) {
            this.sendNotification({
              type: this.messageTypes.INFO,
              title: 'Analysis Progress',
              message: `Real-time analysis is ${Math.round(progress * 100)}% complete`,
              level: 'info'
            });
          }
          
          // Call original callback if provided
          if (options.onMessage) {
            await options.onMessage(chunk);
          } else {
            console.log('Stream chunk:', chunk);
          }
        },
        
        onComplete: async (result) => {
          // Send completion update
          await this.sendAgentUpdate(
            taskId, 
            'completed', 
            1.0, 
            'Streaming analysis completed', 
            connectionId, 
            messageId
          );
          
          // Reset progress tracking
          this._currentStreamProgress = 0;
          
          // Send success notification
          this.sendNotification({
            type: this.messageTypes.SUCCESS,
            title: 'Real-time Analysis Complete',
            message: 'Your email has been analyzed successfully',
            level: 'success'
          });
          
          // Call original callback if provided
          if (options.onComplete) {
            await options.onComplete(result);
          } else {
            console.log('Stream complete:', result);
          }
        },
        
        onError: async (error) => {
          // Send error update
          await this.sendAgentUpdate(
            taskId, 
            'failed', 
            0, 
            `Streaming failed: ${error.message}`, 
            connectionId, 
            messageId
          );
          
          // Reset progress tracking
          this._currentStreamProgress = 0;
          
          // Send error notification
          this.sendNotification({
            type: this.messageTypes.ERROR,
            title: 'Analysis Failed',
            message: `Real-time analysis failed: ${error.message}`,
            level: 'error'
          });
          
          // Call original callback if provided
          if (options.onError) {
            await options.onError(error);
          } else {
            console.error('Stream error:', error);
          }
        }
      };
      
      // Return the streaming controller with our enhanced callbacks
      return await FIBER.agents.activateStreaming(
        this.agentId,
        input,
        context,
        metadata,
        callbacks
      );
    } catch (error) {
      console.error('[EmailService] Failed to start streaming:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Streaming setup failed: ${error.message}`, 
        connectionId, 
        messageId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Could Not Start Analysis',
        message: `Failed to start real-time analysis: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }
  
  /**
   * Check connection status with email provider
   * @param {string} connectionId Connection ID
   * @returns {Promise<Object>} Connection status
   */
  async checkConnectionStatus(connectionId) {
    const taskId = `connection_check_${Date.now()}`;
    
    try {
      // Send notification that connection check is starting
      this.sendNotification({
        type: this.messageTypes.INFO,
        title: 'Checking Connection',
        message: 'Verifying connection to email provider...',
        level: 'info'
      });
      
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        'Checking connection status...', 
        connectionId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'check_connection',
        connection_id: connectionId
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'connection',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Verifying credentials...', 
        connectionId
      );
      
      // Check connection
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        result.result?.connected ? 'Connection verified' : 'Connection failed', 
        connectionId
      );
      
      // Send appropriate notification
      if (result.result?.connected) {
        this.sendNotification({
          type: this.messageTypes.SUCCESS,
          title: 'Connection Verified',
          message: 'Successfully connected to your email account',
          level: 'success'
        });
      } else {
        this.sendNotification({
          type: this.messageTypes.WARNING,
          title: 'Connection Issues',
          message: result.result?.message || 'Could not connect to your email account',
          level: 'warning'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error checking connection:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Connection check failed: ${error.message}`, 
        connectionId
      );
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Connection Check Failed',
        message: `Could not verify connection: ${error.message}`,
        level: 'error'
      });
      
      throw error;
    }
  }
  
  /**
   * Get email account statistics and information
   * @param {string} connectionId Connection ID
   * @returns {Promise<Object>} Account statistics
   */
  async getAccountStats(connectionId) {
    const taskId = `account_stats_${Date.now()}`;
    
    try {
      // Send initial status update
      await this.sendAgentUpdate(
        taskId, 
        'started', 
        0.1, 
        'Fetching account statistics...', 
        connectionId
      );
      
      // Create input object with operation parameters
      const input = {
        operation: 'get_account_stats',
        connection_id: connectionId
      };

      // Create context object with identifiers
      const context = {
        operation_type: 'stats',
        task_id: taskId
      };
      
      // Metadata includes email service provider ID
      const metadata = {
        service_provider_id: connectionId
      };
      
      // Send processing update
      await this.sendAgentUpdate(
        taskId, 
        'processing', 
        0.5, 
        'Analyzing account data...', 
        connectionId
      );
      
      // Get account stats
      const result = await FIBER.agents.activate(this.agentId, input, context, metadata);
      
      // Send completion update
      await this.sendAgentUpdate(
        taskId, 
        'completed', 
        1.0, 
        'Account statistics retrieved', 
        connectionId
      );
      
      // No need for a notification here since this is typically used for UI display
      
      return result;
    } catch (error) {
      console.error('Error getting account stats:', error);
      
      // Send error update
      await this.sendAgentUpdate(
        taskId, 
        'failed', 
        0, 
        `Failed to get account stats: ${error.message}`, 
        connectionId
      );
      
      throw error;
    }
  }
  
  /**
   * List available LLM model providers
   * @returns {Promise<Array>} List of model providers
   */
  async getModelProviders() {
    try {
      const response = await FIBER.apps.listModelProviders();
      return response || [];
    } catch (error) {
      console.error('Error getting model providers:', error);
      
      // Send error notification
      this.sendNotification({
        type: this.messageTypes.ERROR,
        title: 'Provider List Failed',
        message: `Could not retrieve AI providers: ${error.message}`,
        level: 'error'
      });
      
      return [];
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
