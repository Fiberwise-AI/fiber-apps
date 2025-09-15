# Agent Development Guide

This guide helps developers create custom agents for the FiberWise platform.

## c:\Users\david\code\FiberWiseCore\apps\activation-chat-multi-agent\agents\test_agent.py

Let's update the test agent with comprehensive documentation:

````python
import json
import logging
import time
from typing import Dict, Any, Optional, List

from fiberwise import FiberWise, BaseAgent

from worker.llm_provider_service import LLMProviderService
# Set up logger
logger = logging.getLogger(__name__)

class TestAgent(BaseAgent):
    """
    Basic test agent implementation.
    
    FiberWise agents should inherit from BaseAgent and implement run_agent method.
    Agents can leverage the FiberWise SDK and other injected dependencies.
    """
   
    async def run_agent(self, input_data: Dict[str, Any], fiber: FiberWise, llm_provider_service: LLMProviderService) -> Dict[str, Any]:
        """
        Process the input data and return results.
        
        The run_agent method is the main entry point for agent execution.
        Dependencies like the FiberWise SDK client are automatically injected.
        
        Args:
            input_data: The input data for the agent to process
            fiber: Injected FiberWise SDK client with authenticated context
            llm_provider_service: Optional service for LLM model access
            
        Returns:
            Dictionary containing processing results
            
        Examples:
            # Access platform data
            items = await fiber.data.items.list()
            
            # Activate another agent
            result = await fiber.agents.activate("other-agent-id", {"message": "Hello"})
            
            # Call a function
            func_result = await fiber.func.invoke("function-id", {"param": "value"})
            
            # Generate text with LLM
            llm_response = await llm_provider_service.execute_llm_request(
                provider_id="openai",
                model_id="gpt-4",
                prompt="Generate a response to: " + input_data.get("message", "")
            )
        """
        # Log incoming request data
        logger.info(f"Processing input with TestAgent: {input_data}")
        
        # Example of using the SDK to list all agents in the app
        agents = await fiber.agents.list()
        
        # Process data and return results
        result = {
            "status": "success",
            "message": f"Processed: {input_data.get('message', 'No message provided')}",
            "timestamp": time.time(),
            "available_agents": agents
        }
        
        return result
````

## Creating a new agent

Here's a template for creating a new agent:

````python


Made changes.

import logging
from typing import Dict, Any, Optional

from fiberwise import FiberWise, BaseAgent

logger = logging.getLogger(__name__)

class MyCustomAgent(BaseAgent):
    """
    Custom agent implementation.
    
    Describe what your agent does here.
    """
   
    async def run_agent(self, input_data: Dict[str, Any], fiber: FiberWise) -> Dict[str, Any]:
        """
        Process input data and return results.
        
        Args:
            input_data: The input data for the agent to process
            fiber: FiberWise SDK client (injected automatically)
            
        Returns:
            Dictionary with processing results
        """
        logger.info(f"Processing with MyCustomAgent: {input_data}")
        
        # Your agent logic here
        # Example: use the fiber SDK to access platform resources
        
        return {
            "status": "success",
            "data": "Your processed result here"
        }
````

## FiberWise SDK Components

The SDK client (`fiber`) provides access to these components:

1. **Data API** (`fiber.data`): Access and manage items, collections, and schemas
   ```python
   items = await fiber.data.items.list(collection="my-collection")
   await fiber.data.items.create(collection="my-collection", data={"key": "value"})
   ```

2. **Agents API** (`fiber.agents`): List, get, and activate other agents
   ```python
   agents = await fiber.agents.list()
   result = await fiber.agents.activate("agent-id", {"param": "value"})
   ```

3. **Functions API** (`fiber.func`): Invoke serverless functions
   ```python
   result = await fiber.func.invoke("function-id", {"param": "value"})
   ```

4. **Apps API** (`fiber.apps`): Access application information
   ```python
   app_info = await fiber.apps.get_current()
   ```

5. **Realtime API** (`fiber.realtime`): Connect to realtime events
   ```python
   await fiber.realtime.subscribe("channel", callback_function)
   ```

## Agent Context and Authentication

Each agent execution automatically receives:

- An authenticated SDK instance with the proper scopes
- Context about the current activation
- Access to platform services based on dependencies

The platform handles authentication using short-lived agent API keys, so your agent code can focus on business logic.

## Dependency Injection

The platform automatically injects dependencies based on parameter names and types in your `run_agent` method:

```python
# Common dependencies
async def run_agent(self, input_data, fiber: FiberWise):  # fiber SDK always injected
    # ...

# Additional service dependencies
async def run_agent(self, input_data, fiber: FiberWise, llm_provider_service: LLMProviderService):
    # Access to LLM services
    # ...
```

## Best Practices

1. Use typed parameters for clearer code and better IDE support
2. Handle exceptions gracefully and return meaningful error information
3. Keep agent logic modular and focused on specific tasks
4. Use logging for debugging and monitoring
5. Be mindful of resource usage in long-running agents

Made changes.