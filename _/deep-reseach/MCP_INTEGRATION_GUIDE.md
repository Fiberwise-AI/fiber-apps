# MCP Integration Guide for the FiberWise Platform

## 1. Introduction to MCP

The Model-Controller-Personality (MCP) framework is a system for hosting agentic tools on remote servers. Integrating such a framework into the FiberWise platform offers several advantages for applications like the Deep Research agent:

*   **Decoupling Tool Logic**: Complex tool logic can be developed, managed, and scaled independently of the agents that use them.
*   **Stateful Tools**: Remote servers can maintain state across multiple tool calls or agent activations, which is difficult with stateless local tools.
*   **Shared Tools**: A single MCP tool server can be shared and reused by multiple different agents across various FiberWise apps, promoting consistency and reducing code duplication.

This document outlines a practical approach for integrating MCP servers as a source of external tools for agents within the FiberWise platform.

## 2. Proposed Integration Architecture

To integrate MCP seamlessly and securely, we will leverage existing FiberWise services and patterns. The proposed architecture involves creating a dedicated service to handle all interactions with MCP servers.

### A. MCP Service (`MCPService`)

I propose creating a new injectable service within `fiberwise-common`, named `MCPService`. This service will act as the centralized client for all MCP interactions.

*   **Responsibilities**:
    *   Encapsulate the `MultiServerMCPClient` logic for connecting to one or more MCP servers.
    *   Manage authentication and retrieval of API keys from FiberWise's secrets management service.
    *   Fetch tool schemas from MCP servers.
    *   Execute tool calls and return results to the calling agent or service.
*   **Implementation**: This would be a new Python class, `MCPService`, in `fiberwise-common/services/mcp_service.py`. It would be registered with the `ServiceFactory` to make it injectable into other services and agents.

### B. Configuration and Secrets Management

To answer the question posed in `DEEP_RESEARCH_IMPLEMENTATION_PLAN.md`, we will not rely on environment variables for production.

*   **Proposal**: MCP server URLs and API keys will be stored using FiberWise's built-in secrets management service. The `MCPService` will be responsible for securely retrieving these credentials. This aligns with best practices for a production environment.

### C. Agent and Pipeline Integration

MCP tools can be exposed to the FiberWise platform in two primary ways:

#### 1. Agent-Level Integration (Dynamic Tools)

Agents can be dynamically equipped with tools from an MCP server at runtime.

*   **Manifest Declaration**: In an app's `app_manifest.yaml`, an agent definition could specify the MCP servers it needs access to:
    ```yaml
    agents:
      - name: DeepResearchAgent
        ...
        config:
          mcp_servers:
            - name: "tavily_server"
              secret_key: "TAVILY_MCP_CONFIG" # Key to look up in secrets store
    ```
*   **Agent Implementation**: The `DeepResearchAgent` in `agents/research_agent.py` would be injected with the `MCPService`. In its `__init__` or `activate` method, it would use the service to fetch the available tools and make them available to the LLM. This replaces the need for a local `tools/web_tools.py`.

#### 2. Pipeline-Level Integration (Function Nodes)

MCP tools can be exposed as reusable "Function" nodes within the FiberWise Pipeline editor. This allows non-developers to orchestrate workflows that leverage powerful, externally-hosted tools.

*   **Proposal**: The `PipelineService.execute_function` method in `fiberwise-common/services/pipeline_service.py` would be updated. It would recognize a specific `functionId` prefix, such as `mcp::`.
*   **Execution Flow**: When a node with `functionId: "mcp::tavily_search"` is executed, the `PipelineService` would:
    1.  Be injected with the `MCPService`.
    2.  Parse the `functionId` to identify the MCP server and tool name.
    3.  Call the `MCPService` to execute the tool with the provided `params`.
    4.  Return the result as the node's output.

## 3. Next Steps for Implementation

1.  **Develop `MCPService`**: Create the new service in `fiberwise-common` to handle communication and credential management for MCP servers.
2.  **Update `AgentService`**: Modify the agent activation logic to allow for the injection of the `MCPService` and the dynamic binding of MCP tools.
3.  **Refactor `DeepResearchAgent`**: Update the `deep-reseach` app's agent to use the `MCPService` instead of local tools, and update its `app_manifest.yaml` accordingly.
4.  **(Optional) Enhance `PipelineService`**: Implement the logic in `execute_function` to allow MCP tools to be called from pipeline nodes, further integrating MCP into the low-code capabilities of the FiberWise platform.
