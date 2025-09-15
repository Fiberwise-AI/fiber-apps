"""
Second agent for two-agent pipeline
"""
import logging
from typing import Dict, Any
from fiberwise_sdk import FiberAgent, LLMProviderService

logger = logging.getLogger(__name__)


class Agent2(FiberAgent):
    """
    Second processing agent
    """
    
    def __init__(self):
        super().__init__()
        self.agent_name = "Agent2"
        self._version = "0.1.0"
        
    async def run_agent(
        self, 
        input_data: Dict[str, Any], 
        fiber, 
        llm_service: LLMProviderService,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Second agent processing logic
        """
        message = input_data.get('message', 'No message')
        
        logger.info(f"Agent 2 processing: {message}")
        
        try:
            result = f"Agent 2 processed: {message}"
            
            return {
                "success": True,
                "result": result,
                "agent_name": "agent-2"
            }
            
        except Exception as e:
            logger.error(f"Agent 2 failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }