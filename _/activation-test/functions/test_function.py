"""
Simple test function for activation testing
"""
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

def run(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simple test function that processes a message
    
    Args:
        input_data: Function input with 'message' field
    
    Returns:
        Dict with processed result
    """
    message = input_data.get('message', 'Hello World')
    
    logger.info(f"Test function processing: {message}")
    
    try:
        # Simple processing
        result = f"Function processed: {message.upper()}"
        
        return {
            "result": result,
            "status": "success",
            "function_name": "test_function",
            "processed_at": datetime.now().isoformat(),
            "original_message": message
        }
        
    except Exception as e:
        logger.error(f"Test function failed: {str(e)}")
        return {
            "result": None,
            "status": "error",
            "error": str(e)
        }