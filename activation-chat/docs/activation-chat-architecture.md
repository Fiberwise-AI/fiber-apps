# Activation Chat Architecture

This document provides detailed technical diagrams explaining how the Activation Chat app is structured and how it uses agent activations as a chat message store.

## System Architecture

```mermaid
graph TD
    subgraph "Frontend"SS
        A[Chat UI Component]
        B[Message Input]
        C[Message Display]
        D[Session Manager]
    end
    
    subgraph "SDK Layer"
        E[FIBER SDK]
        F[Agent Module]
        G[Activation Extensions]
    end
    
    subgraph "Backend"
        H[FiberWise API]
        I[Agent Execution]
        J[Database]
    end
    
    A -->|Contains| B
    A -->|Contains| C
    A -->|Contains| D
    
    B -->|User Input| E
    D -->|Session Actions| E
    
    E -->|Uses| F
    E -->|Uses| G
    
    F -->|Activates| H
    G -->|Queries| H
    
    H -->|Triggers| I
    H -->|Reads/Writes| J
    I -->|Stores Results| J
    
    J -->|Returns Data| H
    H -->|Returns Data| E
    E -->|Updates| A
    A -->|Renders| C
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as Activation Chat App
    participant SDK as FIBER SDK
    participant API as FiberWise API
    participant DB as Agent Activations DB
    participant Agent as Chat Agent
    participant LLM as LLM Provider
    
    User->>UI: Enter message
    UI->>SDK: agents.activate(agentId, message, userContext)
    SDK->>API: POST /agents/{id}/activate
    API->>DB: Create user message activation
    API->>UI: Return activation ID
    
    UI->>SDK: agents.activate(agentId, message, assistantContext)
    SDK->>API: POST /agents/{id}/activate
    API->>Agent: Trigger agent execution
    Agent->>LLM: Generate response
    LLM->>Agent: Return generated text
    Agent->>DB: Store response in activation
    API->>UI: Return activation with response
    
    UI->>User: Display AI response
    
    User->>UI: Request chat history
    UI->>SDK: agents.getActivations(agentId, {context: {chat_id}})
    SDK->>API: GET /agent-activations?context=...
    API->>DB: Query activations
    DB->>API: Return filtered activations
    API->>SDK: Return activation records
    SDK->>UI: Return formatted messages
    UI->>User: Display chat history
```

## Context Data Structure

```mermaid
classDiagram
    class AgentActivation {
        +UUID activation_id
        +UUID agent_id
        +String agent_type_id
        +String status
        +DateTime started_at
        +DateTime completed_at
        +JSON input_data
        +JSON output_data
        +JSON context
    }
    
    class ActivationContext {
        +String chat_id
        +String session_title
        +String session_type
        +String role
        +String system_prompt
        +UUID previous_message_id
    }
    
    AgentActivation "1" --> "1" ActivationContext : contains
```

## Session Management Flow

```mermaid
stateDiagram-v2
    [*] --> LoadApp
    LoadApp --> QuerySessions
    
    QuerySessions --> NoSessions
    QuerySessions --> ExistingSessions
    
    NoSessions --> CreateDefault
    CreateDefault --> LoadSession
    
    ExistingSessions --> SelectRecent
    SelectRecent --> LoadSession
    
    state LoadSession {
        [*] --> FetchMessages
        FetchMessages --> DisplayMessages
        DisplayMessages --> ReadyToChat
    }
    
    LoadSession --> UserInput
    
    state UserInput {
        [*] --> SendMessage
        SendMessage --> ShowTyping
        ShowTyping --> ReceiveResponse
        ReceiveResponse --> UpdateUI
        UpdateUI --> [*]
    }
    
    UserInput --> LoadSession
```

## Component Tree

```mermaid
graph TD
    A[activation-chat-app] -->|contains| B[app-sidebar]
    A -->|contains| C[chat-container]
    
    B -->|contains| D[sidebar-header]
    B -->|contains| E[sessions-list]
    
    C -->|contains| F[chat-header]
    C -->|contains| G[chat-messages]
    C -->|contains| H[chat-input]
    
    D -->|contains| I[new-chat-button]
    E -->|contains| J[session-item]
    F -->|contains| K[toggle-sidebar]
    F -->|contains| L[edit-system-prompt]
    G -->|contains| M[message]
    H -->|contains| N[message-form]
    
    M -->|types| O[user-message]
    M -->|types| P[assistant-message]
    M -->|types| Q[system-message]
    
    N -->|contains| R[textarea]
    N -->|contains| S[send-button]
    
    classDef component fill:#e1f5fe,stroke:#01579b
    classDef container fill:#e8f5e9,stroke:#2e7d32
    classDef item fill:#fff8e1,stroke:#ffa000
    classDef message fill:#f3e5f5,stroke:#7b1fa2
    
    class A,B,C container
    class D,E,F,G,H component
    class I,J,K,L,N,R,S item
    class M,O,P,Q message
```

## Context-Based Message Retrieval

```mermaid
graph LR
    A[Agent Activations] -->|"context->>'session_id' = ?
                             AND context->>'session_type' = 'chat'"| B[Filter by Session]
    B -->|"ORDER BY started_at ASC"| C[Sort by Time]
    C -->|"context->>'role'"| D[Group by Role]
    D --> E[Transform to Messages]
    
    subgraph "User Messages"
        F["input_data.message"]
    end
    
    subgraph "Assistant Messages"
        G["output_data.text"]
    end
    
    E --> F
    E --> G
```
