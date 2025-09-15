# Deep Research Agent: Implementation Plan & Request for Details

## 1. Overall Assessment

This document outlines the next steps for implementing the full multi-agent "Deep Research from Scratch" system. The provided 5-notebook plan is an excellent, logical roadmap that follows best practices for building complex agentic systems.

To translate this plan into a robust FiberWise application, we first need to clarify several key architectural points and gather specific assets (like prompts and schemas). This report details what is missing and what I need from you to proceed.

## 2. Key Architectural Decisions Required

Before diving into the code, we need to align on these high-level architectural decisions.

### A. State Management Strategy
The notebooks can rely on in-memory state, but a web application needs a persistent strategy to handle multi-step processes that can take time.

*   **Challenge**: How is state (e.g., the research brief, gathered context, current phase) passed between the `scoping`, `research`, and `writing` phases?
*   **Proposal**: We create a new model in `app_manifest.yaml` (e.g., `research_jobs`) to store the state of each research task. The agent's execution logic will read from and write to this database record.
*   **❓ Action Item**: Do you agree with this database-centric approach for state management?

### B. User Interaction Model for Clarification
Notebook 1, "Scoping," mentions asking the user for clarification. The current `research-ui.js` is a simple "fire-and-forget" form.

*   **Challenge**: How should the agent pause its work, ask the user a question, and wait for a response?
*   **Proposal**: When clarification is needed, the agent updates the `research_jobs` record with a `NEEDS_CLARIFICATION` status and the question to ask. The UI polls this status and, when it sees the new status, displays a modal or a chat input to the user.
*   **❓ Action Item**: Please confirm this user interaction model or describe your desired user experience for the clarification step.

### C. Configuration and Secrets Management
The agent requires API keys for services like OpenAI and Tavily. The current code suggests environment variables.

*   **Challenge**: Storing secrets directly in environment variables may not be ideal for a scalable or production environment.
*   **Proposal**: We should leverage FiberWise's built-in secrets management service to securely store and retrieve API keys.
*   **❓ Action Item**: Should we integrate with a central secrets store, or are environment variables sufficient for the initial implementation?

## 3. Specific Details Needed for Implementation

Thank you for providing the `1_scoping.ipynb` notebook. It contains a detailed implementation of the scoping workflow and answers many of the initial questions. The plan has been updated to reflect this progress.

### Phase 1: Scoping (`1_scoping.ipynb`) - **Partially Specified**
*   **Pydantic Schemas**: **COMPLETE**. The notebook provides the Python code for `ClarifyWithUser` and `ResearchQuestion` in `state_scope.py`.
*   **Prompts**: **PARTIALLY COMPLETE**. The notebook provides the `clarify_with_user_instructions` prompt. However, the `transform_messages_into_research_topic_prompt` is imported but its content is not included.
*   **Date-Aware Logic**: **COMPLETE**. The logic is confirmed to be an injection of the current date into the prompts.
*   **❓ Action Item**: Please provide the full text for the `transform_messages_into_research_topic_prompt`.

### Phase 2: Research Agent (`2_research_agent.ipynb`)
*   **Agent Style**: The notebook describes a ReAct-style agent loop. The current `research_agent.py` is a simpler sequential chain. Should I refactor the existing agent to be a true ReAct agent, for example, by using a framework like LangGraph?
*   **Content Summarization**: Please clarify the "content summarization" step for search results. Is this a separate LLM call for each scraped web page? If so, what is the prompt for this summarization task?

### Phase 3: MCP Integration (`3_research_agent_mcp.ipynb`) - **PLANNING COMPLETE**
A separate document, `MCP_INTEGRATION_GUIDE.md`, has been created to outline the strategy for integrating remote agentic tools via the Model-Controller-Personality (MCP) framework. This plan details how to create a common `MCPService` to manage connections and how to expose MCP tools to both agents and pipelines.

*   **MCP Tools**: **DEFINED**. The integration plan specifies that MCP tools will be dynamically fetched from the remote MCP server.
*   **MCP Client**: **DEFINED**. The plan proposes creating a custom, injectable `MCPService` within `fiberwise-common` to encapsulate the `MultiServerMCPClient`.

### Phase 4: Supervisor (`4_research_supervisor.ipynb`)
*   **Supervisor Tools**: Please provide the Pydantic schemas for the `ConductResearch` and `ResearchComplete` tools that the supervisor will use to delegate tasks to worker agents.
*   **Supervisor Prompt**: Please provide the full prompt for the supervisor agent, including its instructions for planning and parallel research.
*   **Context Aggregation**: When the parallel research agents complete their work, how should their findings be aggregated before being passed to the final writer? Is it a simple concatenation, or is there an intermediate synthesis step?

### Phase 5: Full System (`5_full_agent.ipynb`)
*   **UI Updates**: How should the `research-ui.js` component be updated to visualize the multi-agent process? For example, should it show the supervisor's plan and the real-time status of each parallel researcher?
*   **Final Writer Prompt**: The current `writer_prompt.py` is designed for a single, consolidated block of text. Please provide an updated prompt that can synthesize a high-quality report from the multiple, potentially overlapping, research contexts provided by the different worker agents.

## 4. Proposed Next Steps

1.  **You Provide**: Please review this document and provide the requested details, starting with the architectural decisions in Section 2, followed by the assets for Phase 1.
2.  **I Will**: Once I receive the details for Phase 1, I will begin by implementing the required Pydantic schemas and refactoring the agent based on your architectural decisions.
3.  **Iterate**: We will proceed through the 5 phases incrementally, ensuring each step is solid before moving to the next.

I am ready to begin as soon as you provide the necessary clarifications.
