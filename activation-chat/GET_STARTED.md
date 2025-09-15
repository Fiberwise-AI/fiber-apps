You are absolutely right to point that out. The error "unsupported markdown list" typically happens when the Markdown parser is strict and encounters non-standard syntax (like GitHub's `[ ]` checklists) or when there isn't a proper blank line separating a paragraph from the start of a list.

I have corrected the document by removing the `[ ]` checklist syntax and ensuring proper spacing around all lists to guarantee compatibility with a wider range of Markdown parsers.

Here is the revised, more compatible Markdown content.

***

# AI Chat App Tutorial

Build a complete, AI-powered chat assistant on the Fiberwise platform. Go from zero to a deployed app in under 15 minutes.

⏱️ 15 minutes | 📚 Beginner | :robot: AI App

## :robot: What You'll Build

A production-ready, intelligent chat application that uses Fiberwise agent activations for storing conversations. Think of it as your own personal ChatGPT, powered by the Fiberwise platform.

*   **Interactive Chat UI:** A clean, modern interface for real-time conversations.
*   **Intelligent AI Agent:** Powered by a flexible assistant agent you can customize.
*   **Conversation History:** Automatically saves and retrieves chat sessions.
*   **One-Click Deploy:** Ready to be deployed live on the Fiberwise platform.

## 📋 Prerequisites: Your Setup Checklist

Before you begin, you need a fully configured Fiberwise environment. This is the foundation for building any app on the platform.

### 🔧 Required Setup

*   **Instance Running:** You have a Fiberwise instance up and running. ([Installation Guide](/getting-started/installation))
*   **CLI Ready:** The Fiberwise CLI is installed and configured to connect to your instance. ([CLI Setup Guide](/getting-started/cli-setup))
*   **API Key:** Your CLI is authenticated with a Fiberwise API key. ([API Key Guide](/getting-started/cli-setup#api-keys))
*   **LLM Provider Connected:** You have connected at least one LLM provider (like OpenAI or Anthropic). **This is essential for the AI agent to function.** ([LLM Setup Guide](/getting-started/llm-providers))

> **✅ All Set?**
> Once these requirements are met, you are ready to start building the chat app. If not, please complete the linked guides first.

## Step 1: Get the Code

First, clone the official Fiberwise example apps repository, which contains the "Activation Chat" project. Then, navigate into the project directory and open it in your favorite code editor.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/fiberwise-ai/fiber-apps.git
    ```

2.  **Navigate to the Project Directory**
    ```bash
    cd fiber-apps/activation-chat
    ```

3.  **Open in Your Code Editor**
    Open the current directory (`activation-chat`) in an editor like VS Code to explore the files.
    ```bash
    code .
    ```

## Step 2: Understanding the App's Blueprint

Before installing, let's look at the key concepts that define the application. This will help you understand what happens in the next step.

### The Manifest: `app_manifest.yaml`

This is the most important file. It's the blueprint that tells Fiberwise what resources your app needs. It defines the app itself, the data models it uses, and the AI agent that powers the chat.

> #### 💡 Key Concept: The Manifest
> The manifest is a declarative file that defines all the backend resources for your app. When you run `fiber app install`, the CLI reads this file and automatically provisions everything your app needs on the platform.

### Project Structure

The app is built from several modern web components that handle different parts of the UI. This separation makes the code clean and easy to maintain.

```
activation-chat/
├── 📄 app_manifest.yaml           # ← The app's blueprint
├── 🎯 index.js                    # Main entry point, initializes the app
├── 💬 chat-app.js                 # The main component that orchestrates everything
├── 💭 chat-messages.js            # Displays the list of messages for a session
└── ... (other UI components & styles)
```

## Step 3: Install and Run the App

Now it's time to bring the application to life. This two-step process installs the frontend dependencies and then installs the app onto the Fiberwise platform.

1.  **Install Frontend Dependencies**
    This command reads `package.json` and installs the necessary Node.js packages for the frontend UI.
    ```bash
    npm install
    ```

2.  **Install the App to Fiberwise**
    This command uses the Fiberwise CLI to read your `app_manifest.yaml` and create all the necessary resources (the app, the agent, the data model) on your instance.
    ```bash
    fiber app install ./
    ```
    > #### ✅ Expected Output
    > ```
    > Installing app: Activation Chat
    > App installed successfully!
    > App ID: activation-chat
    > Status: Active ✓
    > ```

## Step 4: Send Your First Message

Your chat app is now live on your Fiberwise instance. Let's send a message to see it in action.

1.  **Open Your App**
    Navigate to your app in a browser. By default, the URL will be:
    `http://localhost:8000/activation-chat`

2.  **Start a Conversation**
    Type a message like "Hello, who are you?" into the input box and press Enter.

3.  **See the Magic!**
    You will see your message appear instantly, followed shortly by a response from the AI. You've just completed a full loop: from UI to AI and back!

    ![Activation Chat Screenshot](/docs/screenshot.png)

## Step 5: Deep Dive - How Did That Work?

What just happened when you sent that message? Let's trace the data flow from your browser to the Fiberwise platform and back.

#### 1. The UI Captures Your Input (`chat-input.js`)

The `<chat-input>` component captures your text and fires a custom `message-sent` event that the main app component can listen to.

#### 2. The App Component Makes the SDK Call (`chat-app.js`)

The main `<chat-app>` component listens for the event and calls the core function of the application: **`FIBER.agents.activate()`**. This is where the magic begins.

> #### 💡 Key Concept: Agent Activation
> An **activation** is a record of a single run of an agent. It stores the agent's inputs, outputs, status (e.g., pending, completed), and context. This app uses activations as its message store.

```javascript
// In chat-app.js -> sendMessage()
const activation = await FIBER.agents.activate(
  this.selectedAgentId, // The ID of our chat agent
  { prompt: content },   // The user's message as input
  {
    chat_id: this.currentChatId, // Context to group messages
    system_prompt: this.modelSettings.systemPrompt
  },
  metadata // Additional settings like temperature
);
```

#### 3. The Fiberwise Platform Takes Over

When the platform receives the `activate` call:

1.  It immediately creates a new **activation** with a `pending` status.
2.  It triggers the "Chat Agent" (defined in your manifest) and passes it the `prompt`.
3.  The agent calls the connected LLM Provider (e.g., OpenAI).
4.  When the LLM responds, the agent saves the text as the activation's `output`.
5.  Finally, the activation's status is updated to `completed`.

#### 4. Real-time Update to the UI

How does the UI know when the response is ready? The app listens for real-time events from the platform using a WebSocket connection.

```javascript
// In chat-app.js -> init()
FIBER.realtime.on('message', (message) => {
  // We listen for the specific event that tells us an activation is done
  if (message.type === 'activation_completed') {
    // We find the 'pending' message in the UI and update it
    // with the final output from the activation.
    this.handleActivationCompleted(message);
  }
});
```

### Complete Data Flow

```mermaid
graph TD
    User[👤 Types & Sends Message] -->|"message-sent" event| ChatInput[chat-input.js]
    ChatInput -->|Calls sendMessage()| ChatApp[chat-app.js]
    ChatApp -->|"FIBER.agents.activate()"| SDK[🔧 Fiberwise SDK]
    SDK -->|"POST /activations"| API[🌐 Fiberwise API]
    API -->|Creates 'pending' activation & Triggers Agent| Agent[:robot: Chat Agent]
    Agent -->|Calls LLM| LLM[🧠 LLM Provider]
    LLM -->|"Returns response"| Agent
    Agent -->|"Saves output, marks activation 'completed'"| API
    subgraph Real-time Update
        API -->|"Sends 'activation_completed' event"| WebSocket
        WebSocket -->|"Notifies UI via FIBER.realtime.on()"| ChatApp
    end
    ChatApp -->|"Updates the UI"| UIRefresh[📱 UI]

    classDef user fill:#e3f2fd;
    classDef component fill:#f3e5f5;
    classDef system fill:#e8f5e8;
    class User,ChatInput,ChatApp,UIRefresh component;
    class SDK,API,Agent,LLM,WebSocket system;
```

## 🏆 Congratulations!

You've successfully installed, run, and understood a production-grade AI application on Fiberwise. You now know the core pattern for building apps on the platform.

## 🚀 Next Steps

### 🏗️ Build Your Own App

Use what you've learned to start building your own custom AI application from scratch.
[Start Building](/getting-started/app-development)

### :robot: Explore Agent Development

Dive deeper into creating custom, powerful agents for any use case.
[Agent Development Guide](/concepts/agents)

### 📚 Browse More Examples

Check out other example applications in the `fiber-apps` repository for more patterns.
[More Examples on GitHub](https://github.com/fiberwise-ai/fiber-apps)