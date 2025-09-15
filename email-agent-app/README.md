# Email Agent App for Fiberwise

A full-featured, AI-powered email client built on the Fiberwise platform. This app demonstrates advanced OAuth integration, multi-provider support, and deep AI features using the Fiberwise SDK and agent activations. Manage Gmail, Outlook, and Yahoo Mail in one place, with intelligent analysis and automation.

---

## 🚀 Features
- **Multi-Provider OAuth**: Connect Gmail, Outlook, Yahoo Mail via secure OAuth
- **Universal Inbox**: Manage all accounts in one UI
- **AI-Powered Analysis**: Summaries, sentiment, action items, smart replies
- **Real-time Notifications**: Instant updates for new mail
- **Advanced Search & Filtering**: Find emails fast
- **Smart Labeling**: AI-suggested categories and organization
- **Custom Templates**: Save and reuse prompt templates

---

## Project Structure
```
email-agent-app/
├── app_manifest.yaml           # App blueprint: models, agents, routes
├── index.js                    # Main entry point, initializes the app
├── src/components/             # Web components for UI (email-app.js, email-connections.js, etc.)
├── src/lib/                    # SDK integration, credential service, dynamic data helpers
├── src/services/               # Data and email service logic
├── agents/email_agent.py       # Python agent for email analysis
├── functions/                  # Serverless/email utility functions
├── docs/                       # User, developer, and architecture docs
└── .fiber/                     # Local instance config
```

---

## Quick Start
1. **Install dependencies**
	```bash
	npm install
	```
2. **Install the app on Fiberwise**
	```bash
	fiber app install
	```
3. **Connect your email accounts** in the app's Settings page
4. **Start using the universal inbox, AI features, and analytics!**

---

## How It Works
- **App Manifest (`app_manifest.yaml`)**: Declares models, agents, and OAuth providers
- **Web Components**: Modular UI (see `src/components/`)
- **Credential Service**: Handles OAuth flows and provider connections (`src/lib/credential-service.js`)
- **Data Service**: Manages email data, sync, and queries (`src/services/data-service.js`)
- **Agent Activations**: AI features powered by agent activations (summaries, sentiment, etc.)
- **SDK Usage**: Uses `FIBER.agents.activate()` for AI, `FIBER.data` for custom models

---

## Key Files
- `index.js`: App bootstrap, SDK integration, and web component registration
- `src/components/email-app.js`: Main app shell and routing
- `src/components/email-connections.js`: OAuth provider management UI
- `src/lib/credential-service.js`: Handles OAuth and provider logic
- `src/services/data-service.js`: Data sync and query logic
- `agents/email_agent.py`: Python agent for AI-powered analysis
- `docs/ARCHITECTURE.md`: Deep dive into system design

---

## Tutorials & Docs
- [User Guide](docs/USER_GUIDE.md)
- [Developer Documentation](docs/DEVELOPER.md)
- [API Reference](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Fiberwise SDK Technical Deep Dive](../../site-docs-fiberwise-ai/FIBERWISE_SDK_TECHNICAL_DEEP_DIVE.md)
- [App Bootstrap Flow](../../site-docs-fiberwise-ai/FIBERWISE_APP_BOOTSTRAP_FLOW.md)

---

## Example: Connecting a Provider
```js
// src/components/email-connections.js
async connectProvider(providerId) {
  await this.credentialService.connect(providerId);
  // Initialize Oauth Flow
}
```

- [Architecture Docs](docs/ARCHITECTURE.md)
