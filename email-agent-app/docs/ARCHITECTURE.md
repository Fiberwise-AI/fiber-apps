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

