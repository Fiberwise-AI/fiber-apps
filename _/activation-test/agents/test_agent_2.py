"""
Second test agent for activation testing
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def run(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Second test agent that processes a message
    
    Args:
        input_data: Agent input with 'message' field
        context: Service context with injected services
    
    Returns:
        Dict with processed result
    """
    message = input_data.get('message', 'Hello from Agent 2')
    
    logger.info(f"Test agent 2 processing: {message}")
    
    try:
        # Use LLM service if available
        if 'llm_service' in context:
            llm_service = context['llm_service']
            response = await llm_service.generate(f"Agent 2 analysis of: {message}")
            result = response.get('text', 'Agent 2 LLM processing complete')
        else:
            result = f"Agent 2 processed: {message}"
        
        return {
            "success": True,
            "result": result,
            "agent_name": "test-agent-2",
            "message_processed": message
        }
        
    except Exception as e:
        logger.error(f"Test agent 2 failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }