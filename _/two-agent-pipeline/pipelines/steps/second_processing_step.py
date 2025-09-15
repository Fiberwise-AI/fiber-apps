"""
Second processing step class
"""
from typing import Dict, Any
from fiberwise_sdk import FiberApp


class SecondProcessingStep:
    """Second step that calls agent-2"""
    
    async def execute(self, input_data: Dict[str, Any], fiber: FiberApp) -> Dict[str, Any]:
        result = await fiber.agent.activate('agent-2', input_data)
        return {
            'success': True,
            'result': result
        }