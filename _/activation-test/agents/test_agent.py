"""
Simple test agent for activation testing
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def run(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simple test agent that processes a message
    
    Args:
        input_data: Agent input with 'message' field
        context: Service context with injected services
    
    Returns:
        Dict with processed result
    """
    message = input_data.get('message', 'Hello World')
    
    logger.info(f"Test agent processing: {message}")
    
    try:
        # Use LLM service if available
        if 'llm_service' in context:
            llm_service = context['llm_service']
            response = await llm_service.generate(f"Respond to this message: {message}")
            result = response.get('text', 'LLM processing complete')
        else:
            result = f"Processed: {message}"
        
        return {
            "success": True,
            "result": result,
            "agent_name": "test-agent",
            "message_processed": message
        }
        
    except Exception as e:
        logger.error(f"Test agent failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }