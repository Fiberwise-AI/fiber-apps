# Email Agent App - API Reference

This document details the API endpoints and interfaces available in the Email Agent App.

## EmailService API

The `emailService` is the primary interface for email operations.

### Search Emails

```javascript
/**
 * Search for emails
 * @param {string} providerId Provider ID
 * @param {string} query Search query
 * @param {number} maxResults Maximum results to return (default: 50)
 * @param {string} label Label/folder to search in (optional)
 * @param {number} daysBack Days back to search (default: 30)
 * @returns {Promise<Object>} Search results
 */
async searchEmails(providerId, query, maxResults, label, daysBack)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "messages": [
      {
        "id": "msg123",
        "thread_id": "thread123",
        "subject": "Meeting Tomorrow",
        "sender": "sender@example.com",
        "date": "2023-05-15T10:30:00Z",
        "is_read": false,
        "preview": "Hello, Let's meet tomorrow..."
      }
    ],
    "total_count": 1,
    "query": "meeting",
    "max_results": 50,
    "label": "INBOX",
    "days_back": 30
  }
}
```

### Get Email

```javascript
/**
 * Get email details
 * @param {string} providerId Provider ID
 * @param {string} messageId Message ID to retrieve
 * @returns {Promise<Object>} Email details
 */
async getEmail(providerId, messageId)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "id": "msg123",
    "thread_id": "thread123",
    "subject": "Meeting Tomorrow",
    "sender": "sender@example.com",
    "from": "Sender <sender@example.com>",
    "to": "recipient@example.com",
    "cc": [],
    "bcc": [],
    "date": "2023-05-15T10:30:00Z",
    "body_text": "Hello,\n\nLet's meet tomorrow at 10 AM to discuss the project.\n\nBest regards,\nSender",
    "body_html": "<p>Hello,</p><p>Let's meet tomorrow at 10 AM to discuss the project.</p><p>Best regards,<br>Sender</p>",
    "labels": ["INBOX", "UNREAD", "IMPORTANT"],
    "is_read": false,
    "has_attachments": false,
    "headers": {
      "Message-ID": "<message123@mail.example.com>"
    }
  }
}
```

### Create Draft

```javascript
/**
 * Create a draft email
 * @param {string} providerId Provider ID
 * @param {string} to Recipient(s)
 * @param {string} subject Email subject
 * @param {string} body Email body
 * @param {string} cc CC recipient(s) (optional)
 * @param {string} bcc BCC recipient(s) (optional)
 * @param {string} replyToMessageId Optional message ID to reply to
 * @returns {Promise<Object>} Draft creation result
 */
async createDraft(providerId, to, subject, body, cc, bcc, replyToMessageId)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "draft_id": "draft123",
    "message_id": "msg123",
    "provider_type": "google",
    "to": "recipient@example.com",
    "subject": "Meeting Tomorrow"
  }
}
```

### Send Email

```javascript
/**
 * Send an email
 * @param {string} providerId Provider ID
 * @param {string} to Recipient(s)
 * @param {string} subject Email subject
 * @param {string} body Email body
 * @param {string} cc CC recipient(s) (optional)
 * @param {string} bcc BCC recipient(s) (optional)
 * @param {string} replyToMessageId Optional message ID to reply to
 * @returns {Promise<Object>} Send result
 */
async sendEmail(providerId, to, subject, body, cc, bcc, replyToMessageId)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "message_id": "sent123",
    "thread_id": "thread123",
    "provider_type": "google",
    "to": "recipient@example.com",
    "subject": "Meeting Tomorrow",
    "sent": true
  }
}
```

### Analyze Email

```javascript
/**
 * Analyze an email with AI
 * @param {string} providerId Provider ID
 * @param {string} messageId Message ID to analyze
 * @returns {Promise<Object>} Analysis result
 */
async analyzeEmail(providerId, messageId)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "email": {
      "id": "msg123",
      "subject": "Meeting Tomorrow",
      "sender": "sender@example.com",
      "date": "2023-05-15T10:30:00Z"
    },
    "analysis": {
      "summary": "Email about scheduling a meeting tomorrow at 10 AM to discuss the project.",
      "topics": ["meeting", "project", "scheduling"],
      "sentiment": "neutral",
      "priority": "medium",
      "action_items": ["Attend meeting tomorrow at 10 AM"],
      "suggested_reply": "Thank you for the invitation. I'll join the meeting tomorrow at 10 AM to discuss the project.",
      "suggested_labels": ["Meetings", "Project"]
    },
    "provider_type": "google",
    "template_used": "email_analysis"
  }
}
```

### Update Labels

```javascript
/**
 * Update email labels
 * @param {string} providerId Provider ID
 * @param {string} messageId Message ID to update
 * @param {Array} addLabels Labels to add
 * @param {Array} removeLabels Labels to remove
 * @returns {Promise<Object>} Update result
 */
async updateLabels(providerId, messageId, addLabels, removeLabels)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "message_id": "msg123",
    "labels_added": ["Work", "Follow-up"],
    "labels_removed": ["UNREAD"],
    "provider_type": "google",
    "updated": true,
    "current_labels": ["INBOX", "IMPORTANT", "Work", "Follow-up"]
  }
}
```

### List Labels

```javascript
/**
 * List available labels/folders
 * @param {string} providerId Provider ID
 * @returns {Promise<Object>} List of labels
 */
async listLabels(providerId)
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "labels": [
      {"id": "INBOX", "name": "INBOX", "type": "system"},
      {"id": "SENT", "name": "SENT", "type": "system"},
      {"id": "Work", "name": "Work", "type": "user"},
      {"id": "Personal", "name": "Personal", "type": "user"}
    ],
    "provider_type": "google",
    "total_count": 4
  }
}
```

## DataService API

The `dataService` provides methods for working with stored data.

### Get Connections

```javascript
/**
 * Get connections for the current user
 * @returns {Promise<Array>} List of connections
 */
async getConnections()
```

### Save Email Analysis

```javascript
/**
 * Save email analysis to the data store
 * @param {Object} analysisData Analysis data to save
 * @returns {Promise<Object>} Save result
 */
async saveEmailAnalysis(analysisData)
```

### Get Prompt Templates

```javascript
/**
 * Get prompt templates for the current user
 * @returns {Promise<Array>} Templates
 */
async getPromptTemplates()
```

### Save Prompt Template

```javascript
/**
 * Save a prompt template
 * @param {Object} template Template data
 * @returns {Promise<Object>} Save result
 */
async savePromptTemplate(template)
```

## Realtime Events

### Agent Updates

```json
{
  "type": "agent_update",
  "task_id": "email_agent_analyze_email_20230515123456_123456789",
  "status": "completed",
  "progress": 1.0,
  "message": "Email analysis completed successfully",
  "agent_id": "email_agent",
  "service_provider_id": "google-abc123",
  "message_id": "msg123",
  "operation": "analyze_email",
  "timestamp": "2023-05-15T12:34:56.789Z"
}
```

### Email Notifications

```json
{
  "type": "email_notification",
  "subtype": "new_email",
  "service_provider_id": "google-abc123",
  "subject": "New Project Opportunity",
  "sender": "client@example.com",
  "message_id": "msg456",
  "preview": "Hello, I'd like to discuss a new project opportunity...",
  "timestamp": "2023-05-15T14:30:00.000Z"
}
```

### Connection Status

```json
{
  "type": "connection_status",
  "service_provider_id": "google-abc123",
  "status": "connected",
  "provider_name": "Gmail",
  "timestamp": "2023-05-15T09:00:00.000Z"
}
```

### User Notifications

```json
{
  "type": "user_notification",
  "notification_type": "success",
  "title": "Email Sent",
  "message": "Your email has been sent successfully",
  "level": "success",
  "agent_id": "email_agent",
  "timestamp": "2023-05-15T15:45:00.000Z",
  "data": {
    "task_id": "email_agent_send_email_20230515154500_123456789",
    "provider_id": "google-abc123"
  }
}
```

## Custom Events

The application uses the following custom events for component communication:

- `agent-update`: Dispatched when an agent sends a status update
- `email-notification`: Dispatched when a new email is received
- `connection-status`: Dispatched when provider connection status changes
- `email-service-notification`: Dispatched to show user notifications
- `message-selected`: Dispatched when a user selects an email
- `reply-click`: Dispatched when a user clicks reply
- `email-sent`: Dispatched when an email is sent
- `compose-cancelled`: Dispatched when compose is cancelled
