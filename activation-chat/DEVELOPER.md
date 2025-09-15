
# Activation Chat - Developer Guide

This document provides technical information for developers working with the Activation Chat application.

## Code Structure

```
/activation-chat
├── index.js           # Main entry point and FIBER initialization
├── chat-app.js        # Main application component
├── chat-app.html      # HTML template for chat app
├── chat-app.css       # CSS styles for chat app
├── chat-messages.js   # Component for displaying chat messages
├── chat-messages.html # HTML template for messages
├── chat-messages.css  # CSS styles for messages
├── chat-list.js       # Component for displaying chat sessions
├── chat-list.html     # HTML template for chat list
├── chat-list.css      # CSS styles for chat list
├── chat-input.js      # Component for message input
├── chat-input.html    # HTML template for input
└── chat-input.css     # CSS styles for input
```

## Architecture

### Web Component-Based Architecture

The application is built using Web Components, a set of native browser APIs that allow for the creation of custom, reusable HTML elements. The main components are:

- `chat-app`: The root component that orchestrates the entire application
- `chat-messages`: Displays chat messages and handles message updates
- `chat-list`: Shows available chat sessions and allows selection
- `chat-input`: Handles user input for sending new messages

These components communicate through custom events and property bindings.

### FIBER JavaScript SDK Integration

The application integrates with the FiberWise platform using the FIBER JavaScript SDK, which provides:

1. **Authentication**: Fiberwise Core - Handling user sessions and tokens
2. **Agent Activation**: Creating and retrieving agent activations
3. **Data Storage**: Managing chat sessions and metadata using Fiberwise Dynamic Data
4. **Real-time Updates**: WebSocket connections for live message updates using Fiberwise Realtime

## Data Flow

1. **User Authentication**: Handled automatically by the Fiberwise or Fiberwise Core
2. **Chat Selection**: 
   - User selects a chat from the list or creates a new one
   - Selected chat ID is passed to other components
3. **Message Loading**:
   - `chat-messages` loads activations filtered by the chat ID
   - Each activation represents one message exchange
4. **Message Sending**:
   - User submits text via `chat-input`
   - `chat-app` processes the input and creates a new activation
   - The activation is added to the UI immediately
5. **Real-time Updates**:
   - WebSocket connection receives updates when activations complete
   - `chat-messages` updates the UI based on these events

## Extending the Application

The SDK is initialized in `index.js` and exposed to all components:

```javascript
// Initialize FIBER SDK and expose it to components
import { FiberClient } from '@fiberwise/sdk';

// Create and initialize the client
export const FIBER = new FiberClient({
  appId: 'uuid',
  apiUrl: '/api/v1'  // Uses relative URL to current host
});
```

### Vite Build Integration

The application uses Vite for module bundling and development:

- HTML templates are imported using `?raw` suffix: `import htmlTemplate from './component.html?raw'`
- CSS is imported using `?inline` suffix: `import cssStyles from './component.css?inline'`

This approach allows for a clean separation of concerns while maintaining a component-focused structure.
### Adding New Features

To add new features to the Activation Chat:

1. **New Components**: Create new Web Components following the existing pattern
   ```javascript
   export class NewFeature extends HTMLElement {
     constructor() {
       super();
       this.attachShadow({ mode: 'open' });
     }
     // Component logic
   }
   customElements.define('new-feature', NewFeature);
   ```

2. **Extend Existing Components**: Add methods and properties to the existing components
   ```javascript
   // In chat-app.js
   async newMethod() {
     // Implementation
   }
   ```

3. **New Agent Types**: Configure different agent types by modifying the agent selection and activation logic in `chat-app.js`

### Customizing Appearance

1. **CSS Customization**: Update the corresponding CSS files for components
2. **Template Modifications**: Modify the HTML templates to change component structure
3. **Theming**: Add CSS variables to `chat-app.css` to create a theming system

### Integration with Other FiberWise Features

The FIBER SDK provides access to additional features:

1. **Custom Data Models**: Use `FIBER.data` to create and query custom data models
   ```javascript
   // Create chat metadata
   await FIBER.data.createItem('chat', { chat_id: chatId, tags: ['important'] });
   ```

2. **File Attachments**: Implement file uploads using `FIBER.files`
   ```javascript
   // Upload file attachment
   const fileRef = await FIBER.files.upload(file);
   ```

3. **Multiple Agents**: Configure different agent types for different conversation modes
   ```javascript
   // Select specific agent type
   await FIBER.agents.activate(specificAgentId, inputData, context);
   ```
