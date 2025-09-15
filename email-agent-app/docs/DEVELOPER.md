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

