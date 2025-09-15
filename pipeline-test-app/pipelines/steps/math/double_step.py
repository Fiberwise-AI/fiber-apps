"""
Double Step
Super simple step that doubles a number.
"""
import logging
import asyncio
from typing import Dict, Any

logger = logging.getLogger(__name__)

class DoubleStep:
    """Step implementation for doubling a number."""
    
    def __init__(self):
        self.name = "DoubleStep"
        self.description = "Double a number by multiplying it by 2"
    
    async def execute(self, parameters: Dict[str, Any], fiber) -> Dict[str, Any]:
        """
        Execute the double number step.
        
        Args:
            parameters: Dict containing 'input_number' parameter
            fiber: Fiber service (not needed for this simple step)
        
        Returns:
            Dict with doubled number result
        """
        try:
            input_number = parameters.get('input_number')
            
            if input_number is None:
                return {
                    'success': False,
                    'error': 'Missing required parameter: input_number',
                    'result': {'doubled_number': 0}
                }
            
            # Validate input is a number
            try:
                number = int(input_number)
            except (ValueError, TypeError):
                return {
                    'success': False,
                    'error': f'input_number must be a number, got: {input_number}',
                    'result': {'doubled_number': 0}
                }
            
            logger.info(f"Doubling number: {number}")
            
            # Simulate some processing time
            await asyncio.sleep(1)
            
            # Double the number
            doubled_number = number * 2
            
            logger.info(f"Result: {number} x 2 = {doubled_number}")
            
            return {
                'success': True,
                'result': {'doubled_number': doubled_number},
                'message': f'Successfully doubled {number} to get {doubled_number}'
            }
            
        except Exception as e:
            logger.error(f"Error in DoubleStep: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'result': {'doubled_number': 0}
            }