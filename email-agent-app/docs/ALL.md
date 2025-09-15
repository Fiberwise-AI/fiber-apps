I'll create comprehensive documentation for the email-agent-app from both developer and marketing perspectives. Here are the documentation files I'll add:

### 1. Main README.md (Enhanced)

```markdown
# Email Agent App

A comprehensive email client application that leverages the EmailAgent to interact with multiple email providers (Google Gmail, Microsoft Outlook, Yahoo Mail) via OAuth.

![Email Agent App Screenshot](docs/images/email-app-screenshot.png)

## 🚀 Features

- **Multi-Provider Support** - Connect to Gmail, Outlook, and Yahoo Mail using secure OAuth
- **Universal Inbox** - Manage all your email accounts in one place
- **AI-Powered Analysis** - Get intelligent insights, summaries, and suggested replies
- **Real-time Notifications** - Stay updated with new email alerts
- **Advanced Search** - Find emails quickly with powerful filtering options
- **Smart Labeling** - Organize emails with AI-suggested categories
- **Customizable Templates** - Create and save your own AI prompt templates

## 📋 Quick Start

1. **Connect your email accounts** in the Settings page
2. **Search and view emails** from the main inbox
3. **Analyze emails with AI** by clicking the "Analyze" button
4. **Compose new emails** with the "Compose" button
5. **Manage labels** in the Labels section

## 🌟 AI-Powered Features

- **Email Summaries**: Get concise summaries of long email threads
- **Sentiment Analysis**: Understand the emotional tone of messages
- **Priority Detection**: Let AI help you focus on what matters
- **Action Item Extraction**: Never miss important tasks or deadlines
- **Smart Reply Suggestions**: Respond quickly with context-aware suggestions
- **Label Recommendations**: Keep your inbox organized automatically

## 💡 Use Cases

- **Executive Assistants**: Efficiently manage communication and prioritize messages
- **Customer Service Teams**: Analyze customer sentiment and respond appropriately
- **Sales Professionals**: Track important client communications and follow-ups
- **Project Managers**: Extract action items and organize project-related emails
- **Anyone with Email Overload**: Bring order and intelligence to your inbox

## 📖 Documentation

For detailed documentation, see:
- [User Guide](docs/USER_GUIDE.md) - Complete guide to using the app
- [Developer Documentation](docs/DEVELOPER.md) - Technical details for developers
- [API Reference](docs/API.md) - API documentation for integration
- [Architecture Overview](docs/ARCHITECTURE.md) - System design and components

## 📝 License

MIT

## 🤝 Credits

Developed by the FiberWise Core team
```

### 2. Developer Documentation

```markdown


Made changes.

# Email Agent App - Developer Documentation

This document provides technical information for developers who want to understand, modify, or extend the Email Agent App.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript with Web Components
- **Backend**: FiberWise Core platform with Python agents
- **Authentication**: OAuth 2.0 for email provider authentication
- **AI Integration**: FiberWise LLM service for email analysis

## 🔌 FiberWise SDK Integration

The app uses the FiberWise SDK for communication with the platform. The main integration points are:

```javascript
// Initialize the SDK
const FIBER = fiber.createInstance({ 
  baseUrl: window.location.origin + "/api/v1",
  appId: 'email-agent-app'
});

// Agent activation example
const result = await FIBER.agents.activate(
  agentId,
  input,
  context,
  metadata
);

// Realtime messaging
await FIBER.realtime.connect();
FIBER.realtime.on('message', handleMessage);
await FIBER.realtime.send('agent_update', updateData);

// Data operations
const response = await FIBER.data.query({
  model: 'email_analyses',
  where: filters,
  order_by: { analysis_date: 'desc' }
});

// Credential management
const connections = await FIBER.cred.listConnections();
const authUrl = FIBER.cred.getAuthUrl(providerId);
```

## 📦 Project Structure

```
email-agent-app/
├── components/              # Web components
│   ├── email-app.js         # Main application component
│   ├── email-search.js      # Email search functionality
│   ├── email-detail.js      # Email viewing with analysis
│   ├── email-compose.js     # Email composition
│   ├── email-settings.js    # Provider management
│   ├── label-manager.js     # Label management
│   ├── provider-connection.js # OAuth connection flow
│   ├── prompt-templates.js  # Custom AI prompts management
│   └── email-analytics.js   # Analytics dashboard
├── services/
│   ├── email-service.js     # Email operations service
│   └── data-service.js      # Data operations service
├── lib/
│   └── dynamic-data.js      # Data utilities
├── config/
│   └── oauth_config.json    # OAuth configuration
├── docs/                    # Documentation
├── index.js                 # App entry point
└── manifest.json            # App manifest
```

## 🔄 Component Lifecycle & Communication

Components communicate through custom events:

```javascript
// Dispatch an event
this.dispatchEvent(new CustomEvent('message-selected', {
  bubbles: true,
  composed: true,
  detail: { messageId }
}));

// Listen for an event
emailSearch.addEventListener('message-selected', (e) => {
  this.handleMessageSelected(e.detail.messageId);
});
```

Realtime updates are handled through the messaging system:

```javascript
FIBER.realtime.on('message', (message) => {
  if (message.type === 'agent_update') {
    // Handle agent update
  } else if (message.type === 'email_notification') {
    // Handle new email notification
  }
});
```

## 🏗️ Adding New Features

### Adding a New Email Provider

1. Add provider configuration to the `PROVIDER_ENDPOINTS` in `email_agent.py`
2. Add UI representation in `email-settings.js`
3. Implement provider-specific message parsing in the agent

### Creating a New AI Analysis Template

1. Add a new template to `DEFAULT_PROMPT_TEMPLATES` in `email_agent.py`
2. Create a new UI for the template in `prompt-templates.js`
3. Store template in the data store using `email_prompt_templates` model

### Adding a New Email Operation

1. Add the operation to the `run_agent` method in `email_agent.py`
2. Create a corresponding method in `email-service.js`
3. Add UI controls in the appropriate component

## 🧪 Testing

Run the tests using:

```bash
npm test
```

The tests include:
- Unit tests for components using Web Component Tester
- Integration tests for agent-email interaction
- End-to-end tests for the full application flow

## 🚀 Deployment

Deploy the app by adding it to your FiberWise Core platform:

1. Add the app to your FiberWise Core configuration
2. Make sure the EmailAgent is configured in your agent registry
3. Set up the required data models (`email_prompt_templates`, `email_analyses`)
4. Configure OAuth providers in your platform settings

## 🔒 Security Considerations

- OAuth tokens are managed by the platform's credential service
- Never store email credentials in the code or client-side storage
- Use proper input sanitization for email content display
- Consider implementing content security policies

## 🔄 Realtime Message Handling

The service supports these realtime message types:

- `agent_update`: Progress updates during email operations
- `email_notification`: Notifications for new emails
- `connection_status`: Updates on provider connection status
- `user_notification`: User-friendly notification messages

## 📘 API Documentation

For detailed API reference, see [API.md](API.md).
```

### 3. API Documentation

```markdown


Made changes.

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
```

### 4. Architecture Overview

```markdown


Made changes.

# Email Agent App - Architecture Overview

This document provides a comprehensive overview of the Email Agent App's architecture, components, and interactions.

## System Architecture

The Email Agent App follows a client-server architecture with these main components:

![Architecture Diagram](images/architecture-diagram.png)

### Client-Side Components

1. **Web UI**: Built with vanilla JavaScript and Web Components
2. **Services Layer**: Handles communication with the backend
3. **State Management**: Manages application state for UI components

### Server-Side Components

1. **Email Agent**: Python-based agent that interfaces with email providers
2. **Credential Service**: Manages OAuth tokens and provider authentication
3. **LLM Service**: Provides AI capabilities for email analysis
4. **Data Storage**: Persists user data like templates and analyses

## Component Diagram

```
+----------------------------------+
|           Email Agent App        |
+----------------------------------+
|                                  |
|  +------------------------------+|
|  |         Components           ||
|  |                              ||
|  |  +------------------------+  ||
|  |  |     email-app.js       |  ||
|  |  +------------------------+  ||
|  |  |    email-search.js     |  ||
|  |  +------------------------+  ||
|  |  |    email-detail.js     |  ||
|  |  +------------------------+  ||
|  |  |    email-compose.js    |  ||
|  |  +------------------------+  ||
|  |  |   provider-connection.js| ||
|  |  +------------------------+  ||
|  |  |    prompt-templates.js |  ||
|  |  +------------------------+  ||
|  |  |    email-analytics.js  |  ||
|  |  +------------------------+  ||
|  |                              ||
|  +------------------------------+|
|                                  |
|  +------------------------------+|
|  |          Services            ||
|  |                              ||
|  |  +------------------------+  ||
|  |  |    email-service.js    |  ||
|  |  +------------------------+  ||
|  |  |    data-service.js     |  ||
|  |  +------------------------+  ||
|  |                              ||
|  +------------------------------+|
|                                  |
+----------------------------------+
            |          |
            v          v
+------------------+  +------------------+
|   FiberWise SDK  |  |  Email Providers |
+------------------+  +------------------+
|  agents          |  |  Gmail           |
|  realtime        |  |  Outlook         |
|  data            |  |  Yahoo Mail      |
|  cred            |  |                  |
+------------------+  +------------------+
            |                  |
            v                  v
+----------------------------------+
|        FiberWise Platform        |
+----------------------------------+
|                                  |
|  +------------------------------+|
|  |        Email Agent           ||
|  |                              ||
|  |  +-----------------------+   ||
|  |  | Provider Connectors   |   ||
|  |  | - Google              |   ||
|  |  | - Microsoft           |   ||
|  |  | - Yahoo               |   ||
|  |  +-----------------------+   ||
|  |                              ||
|  |  +-----------------------+   ||
|  |  | Email Operations      |   ||
|  |  | - Search              |   ||
|  |  | - Fetch               |   ||
|  |  | - Compose             |   ||
|  |  | - Send                |   ||
|  |  | - Analyze             |   ||
|  |  +-----------------------+   ||
|  |                              ||
|  +------------------------------+|
|                                  |
|  +------------------------------+|
|  |      LLM Integration         ||
|  +------------------------------+|
|                                  |
|  +------------------------------+|
|  |     Data Storage             ||
|  +------------------------------+|
|                                  |
+----------------------------------+
```

## Component Interactions

### Email Search Flow

1. User enters search query in `email-search.js`
2. Component calls `emailService.searchEmails()`
3. Service creates unique task ID and sends initial progress update
4. Service calls `FIBER.agents.activate()` with search parameters
5. Agent processes request and searches the provider's API
6. Agent returns search results through FiberWise
7. Service receives results and dispatches completion notification
8. Component updates UI with search results

### Email Analysis Flow

1. User selects email in `email-detail.js` and clicks "Analyze"
2. Component calls `emailService.analyzeEmail()`
3. Service creates unique task ID and sends initial progress update
4. Service calls `FIBER.agents.activate()` with message ID
5. Agent fetches email content from provider
6. Agent sends progress updates through realtime channel
7. Agent uses LLM service to analyze email content
8. Agent returns analysis results and saves to data store
9. Service receives results and dispatches completion notification
10. Component updates UI with analysis results

### Authentication Flow

1. User clicks "Connect" for an email provider in `email-settings.js`
2. Component creates `provider-connection.js` instance
3. Connection component gets auth URL from `dataService.getAuthUrl()`
4. User completes OAuth flow in popup window
5. Platform handles token exchange and credential storage
6. Connection component receives success callback
7. Component refreshes provider list using `dataService.getConnections()`

## Data Models

### Email Prompt Template

Stores customizable AI prompt templates for email analysis:

```
email_prompt_templates
- template_id: uuid (PK)
- user_id: string
- app_id: string
- template_name: string
- template_content: text
- description: string
- created_at: timestamp
- updated_at: timestamp
```

### Email Analysis

Stores results of email analyses:

```
email_analyses
- analysis_id: uuid (PK)
- user_id: string
- provider_id: string
- message_id: string
- subject: string
- sender: string
- analysis_date: timestamp
- summary: text
- sentiment: string
- priority: string
- topics: json
- action_items: json
- suggested_labels: json
- template_used: string
- created_at: timestamp
```

## Security Architecture

### Authentication

- OAuth 2.0 is used for all email provider authentication
- Tokens are stored and managed by the FiberWise credential service
- No credentials are stored in client-side code or storage

### Data Protection

- Email content is processed in memory and not persisted unless explicitly saved
- Analysis results are stored with appropriate user and app identifiers
- All API calls require valid authentication

### Communication Security

- All communication with email providers uses HTTPS
- Realtime messaging is secured with WebSocket over TLS
- Input validation is performed on both client and server sides

## External Integrations

### Email Provider APIs

- **Gmail API**: Used for Google email operations
- **Microsoft Graph API**: Used for Outlook operations
- **Yahoo Mail API**: Used for Yahoo Mail operations

### LLM Providers

The app can use any LLM provider configured in the FiberWise platform:

- OpenAI (GPT models)
- Anthropic (Claude models)
- Microsoft Azure OpenAI
- Any other provider implemented by the platform

## Performance Considerations

- Email search results are paginated to manage large inboxes
- Email content is loaded on-demand to reduce initial load time
- AI analysis is performed asynchronously with progress updates
- Realtime updates minimize the need for polling
```

### 5. User Guide

```markdown


Made changes.

# Email Agent App - User Guide

This comprehensive guide will help you get the most out of the Email Agent App's features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting Email Accounts](#connecting-email-accounts)
3. [Navigating the Interface](#navigating-the-interface)
4. [Managing Emails](#managing-emails)
5. [Composing Emails](#composing-emails)
6. [Email Analysis with AI](#email-analysis-with-ai)
7. [Managing Labels](#managing-labels)
8. [Customizing AI Templates](#customizing-ai-templates)
9. [Email Analytics](#email-analytics)
10. [Troubleshooting](#troubleshooting)

## Getting Started

The Email Agent App provides a unified interface for managing emails across multiple providers with powerful AI-assisted features.

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Email accounts with Gmail, Outlook, or Yahoo Mail

### First Launch

Upon first launching the app, you'll see the main dashboard with a prompt to connect your email accounts. Before you can use the app, you'll need to connect at least one email provider.

## Connecting Email Accounts

1. Click the **Settings** button in the top right corner
2. In the settings page, find the "Available Email Providers" section
3. Click the **Connect** button next to the provider you want to add
4. A popup window will appear with connection details
5. Click **Connect** to start the OAuth authentication flow
6. Log in to your email provider and grant the requested permissions
7. Once connected, the provider will appear in your "Connected Accounts" list
8. You can connect multiple accounts from different providers

### Connection Status

Connected accounts show a green "Connected" badge. You can:
- Click **Configure** to access provider-specific settings
- Click **Disconnect** to remove the connection

## Navigating the Interface

The app interface consists of several key areas:

### Header Bar

- **App title**: Click to return to the main view
- **Compose** button: Create a new email
- **Settings** button: Access app settings

### Sidebar

- **Provider selector**: Switch between connected email accounts
- **Folder navigation**: Access different email folders
  - Inbox: Primary incoming mail
  - Sent: Emails you've sent
  - Drafts: Saved email drafts
  - Starred: Important flagged emails
  - Labels: Access and manage custom labels

### Main Content Area

This area changes based on your current view:
- Email list: Shows search results or folder contents
- Email detail: Displays the selected email with analysis
- Compose view: Email composition interface
- Labels view: Label management interface

## Managing Emails

### Searching Emails

1. Select the provider and folder from the sidebar
2. Use the search bar at the top of the email list
3. Enter keywords, sender name, or other search criteria
4. Results will display as you type or when you press Enter
5. Use the advanced filters to refine your search:
   - Date range
   - Has attachments
   - From specific sender
   - With specific label

### Viewing Emails

1. Click on any email in the search results or folder view
2. The email content will display in the main area
3. Use the action buttons to:
   - Reply to the email
   - Mark as read/unread
   - Star/unstar the email
   - Apply labels
   - Delete the email
   - Analyze with AI

### Managing Email Status

- **Read/Unread**: Click the envelope icon to toggle
- **Starred**: Click the star icon to toggle
- **Important**: Click the important icon to toggle

## Composing Emails

### Creating a New Email

1. Click the **Compose** button in the header
2. Enter recipient email address(es) in the "To" field
3. Click "Add Cc/Bcc" to expand those fields if needed
4. Enter a subject for your email
5. Type your message in the body area
6. Click **Send** to send immediately or **Save Draft** to save for later

### Replying to an Email

1. Open the email you want to reply to
2. Click the **Reply** button
3. The compose form will appear with:
   - Recipient pre-filled with the original sender
   - Subject prefixed with "Re:"
   - Original message quoted below your cursor
4. Type your response
5. Click **Send** when ready

### Email Formatting

The compose form supports basic text formatting. You can:
- Use paragraph breaks for readability
- Include links (they'll become clickable)
- Quote previous messages with ">" prefix

## Email Analysis with AI

One of the most powerful features is AI-powered email analysis.

### Analyzing an Email

1. Open the email you want to analyze
2. Click the **Analyze** button
3. The system will process the email and provide insights, including:
   - Summary: A concise overview of the email content
   - Topics: Main subjects discussed in the email
   - Sentiment: The emotional tone (positive, negative, neutral)
   - Priority: Suggested importance level
   - Action Items: Tasks or follow-ups mentioned in the email
   - Suggested Reply: AI-generated response template
   - Suggested Labels: Recommended categories for the email

### Using Analysis Results

- Click **Apply Labels** to automatically add suggested labels
- Click **Use Reply** to start a new reply with the AI suggestion
- View action items to identify follow-up tasks

## Managing Labels

Labels help you organize emails by category or project.

### Viewing Labels

1. Click **Labels** in the sidebar
2. See all system and custom labels with email counts

### Creating New Labels

1. In the Labels view, click **Add Label**
2. Enter a name for your label
3. Click **Save**

### Applying Labels to Emails

1. Open an email
2. Click the **Labels** button
3. Check the boxes for labels you want to apply
4. Click **Apply**

### Removing Labels

1. Open an email
2. Click the **Labels** button
3. Uncheck labels you want to remove
4. Click **Apply**

## Customizing AI Templates

You can customize how AI analyzes your emails by creating templates.

### Accessing Templates

1. Go to Settings
2. Click the **Prompt Templates** tab

### Creating a New Template

1. Click **Add Template**
2. Enter a name and description
3. Create your template using variable placeholders:
   - `{sender}`: Email sender
   - `{subject}`: Email subject
   - `{body}`: Email content
   - `{date}`: Email date
4. Click **Save Template**

### Using Custom Templates

1. Open an email
2. Click the **Analyze** button
3. Select your custom template from the dropdown
4. Click **Analyze**

## Email Analytics

The analytics dashboard provides insights into your email usage and AI analysis.

### Accessing Analytics

Click **Analytics** in the main navigation

### Available Analytics

- **Email Volume**: Emails received over time
- **Sentiment Analysis**: Distribution of positive/negative/neutral emails
- **Priority Distribution**: High/medium/low priority breakdown
- **Top Topics**: Most common subjects in your emails
- **Top Labels**: Most frequently used labels
- **Response Times**: How quickly you respond to emails

### Filtering Analytics

Use the timeframe selector to view:
- Last week
- Last month
- Last year
- All time

## Troubleshooting

### Connection Issues

If you can't connect to an email provider:
1. Check your internet connection
2. Ensure you're using the correct login credentials
3. Verify that you haven't revoked the app's access in your provider settings
4. Try disconnecting and reconnecting the account

### Search Problems

If search results aren't appearing:
1. Verify that your provider connection is active
2. Try more general search terms
3. Check that you're searching in the correct folder
4. Ensure your OAuth token hasn't expired

### Analysis Errors

If email analysis fails:
1. Check that the email content is accessible
2. Verify that the LLM service is available
3. Try using a different analysis template
4. Check for special characters or extremely long content that might cause issues

### Sending Failures

If you can't send emails:
1. Verify that your provider connection has the necessary permissions
2. Check that all recipient addresses are valid
3. Ensure you have internet connectivity
4. Look for any error messages in the notification area
```

This comprehensive documentation package provides:

1. A marketing-oriented README with highlights of the app's features and capabilities
2. Detailed developer documentation explaining the SDK usage and technical implementation
3. A comprehensive API reference for integration
4. A clear architectural overview showing system components and how they interact
5. A user guide for end-users

These documents together provide a complete picture of the Email Agent App from both developer and marketing perspectives.

Made changes.