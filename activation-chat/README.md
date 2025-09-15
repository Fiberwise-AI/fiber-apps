# Activation Chat

A chat application that leverages Fiberwise's agent activation system as its backend storage mechanism, demonstrating how to use activations for chat functionality.

![Activation Chat Screenshot](./docs/screenshot.png)

## Features

- **Session Management**: Create and manage chat sessions with customizable titles
- **Chat History**: View all previous conversations stored as agent activations
- **Markdown Support**: Rich text formatting for AI responses
- **Responsive Design**: Works on both desktop and mobile devices

## Architecture

Activation Chat uses the agent activation system instead of a traditional database table for storing chat messages. This approach provides several benefits:

1. **Unified Storage**: Chat messages use the same data model as other AI interactions
2. **Context-Based Filtering**: Leverages the JSONB context field for rich metadata
3. **Built-in History**: Takes advantage of existing activation history features
4. **Simplified Backend**: No need for separate message tables or APIs

### System Diagram

```mermaid
graph TD
    User[User] -->|Types Message| UI[Chat UI]
    UI -->|Create Activation| SDK[FIBER SDK]
    SDK -->|Agent Activate API| Backend[FiberWise API]
    Backend -->|Store| DB[(Agent Activations)]
    # Activation Chat App for Fiberwise

    A production-ready, AI-powered chat assistant built on the Fiberwise platform. This app demonstrates how to use Fiberwise agent activations, dynamic data models, and the SDK to create a modern, extensible chat experience—think of it as your own personal ChatGPT, fully open and customizable.

    ---

    ## Features
    - Real-time chat UI with web components
    - AI-powered responses using Fiberwise agent activations
    - Dynamic data storage for chat sessions and messages
    - Provider selection for LLMs (OpenAI, Anthropic, etc.)
    - Modern, modular codebase (vanilla JS, Vite, web components)
    - Full integration with Fiberwise SDK and platform APIs

    ---

    ## Project Structure
    ```
    activation-chat/
    ├── app_manifest.yaml           # App blueprint: models, agents, routes
    ├── index.js                    # Main entry point, initializes the app
    ├── chat-app.js                 # Main chat UI component
    ├── chat-messages.js            # Displays chat messages
    ├── chat-input.js               # User input component
    ├── chat-list.js                # (Optional) Session list
    ├── *.css, *.html               # Styles and templates for components
    ├── docs/activation-chat-architecture.md # Deep dive architecture
    └── .fiber/                     # Local instance config
    ```

    ---

    ## Quick Start

    1. **Clone the Example**
      ```bash
      git clone <your-fiberwise-apps-repo>
      cd activation-chat
      ```
    2. **Install Dependencies**
      ```bash
      npm install
      ```
    3. **Install the App on Fiberwise**
      ```bash
      fiber app install
      ```
    4. **Open the App**
      - Go to your Fiberwise instance and find "Activation Chat" in your apps list.
      - Open it and start chatting!

    ---

    ## How It Works

    - **App Manifest (`app_manifest.yaml`)**: Defines the app, its data models, and the chat agent.
    - **Agent Activations**: Each message is stored as an agent activation, with context and metadata for the LLM.
    - **Web Components**: UI is built from modular components (`chat-app.js`, `chat-messages.js`, etc.)
    - **SDK Usage**: Uses `FIBER.agents.activate()` to send/receive messages, and `FIBER.data` for any custom models.
    - **Provider Selection**: Users can select their preferred LLM provider before chatting.

    ---

    ## Key Files
    - `index.js`: App bootstrap, SDK integration, and web component registration
    - `chat-app.js`: Orchestrates chat UI, handles message events, and real-time updates
    - `chat-messages.js`: Renders the message list for a session
    - `chat-input.js`: Handles user input and message sending
    - `app_manifest.yaml`: App definition, agent config, and data models
    - `docs/activation-chat-architecture.md`: Technical deep dive and architecture diagrams

    ---

    ## Tutorials & Docs
    - [AI Chat App Tutorial](../../site-docs-fiberwise-ai/src/views/tutorials/tutorials-tutorial-1.html): Step-by-step guide to building and understanding this app
    - [Fiberwise SDK Technical Deep Dive](../../site-docs-fiberwise-ai/FIBERWISE_SDK_TECHNICAL_DEEP_DIVE.md)
    - [App Bootstrap Flow](../../site-docs-fiberwise-ai/FIBERWISE_APP_BOOTSTRAP_FLOW.md)

    ---

    ## Architecture Overview
    - **App loads via Fiberwise AppBridge and SDK**
    - **User sends message** → `FIBER.agents.activate()` creates an activation
    - **Agent runs with LLM provider** → AI response is generated
    - **Real-time updates** via `FIBER.realtime.on('message', ...)` update the UI
    - **All messages and sessions** are stored as activations (and optionally in custom models)

    ---

    ## Example: Sending a Message
    ```js
    // chat-app.js
    async sendMessage(content) {
      const activation = await FIBER.agents.activate(
       this.selectedAgentId,
       { prompt: content },
       { role: 'user' }
      );
      // Add message to UI, listen for AI response
    }
    ```

    ---

    ## License
    MIT (see LICENSE)

    ---

    ## Credits
    - Fiberwise Core Team
    - [Tutorial Source](../../site-docs-fiberwise-ai/src/views/tutorials/tutorials-tutorial-1.html)
    - [Activation Chat Architecture](docs/activation-chat-architecture.md)
    participant UI as Chat UI Component
    participant SDK as FIBER SDK
    participant API as FiberWise API
    participant DB as Agent Activations
    participant Agent as Chat Agent
    
    User->>UI: Type Message
    UI->>SDK: Create User Activation
    SDK->>API: POST /agents/{id}/activate
    API->>DB: Store User Message
    API->>Agent: Process Message
    Agent->>API: Return AI Response
    API->>DB: Store Assistant Response
    
    UI->>SDK: Request Message History
    SDK->>API: GET /agent-activations
    API->>DB: Query by chat_id
    DB->>API: Return Filtered Activations
    API->>SDK: Return Messages
    SDK->>UI: Render Chat History
