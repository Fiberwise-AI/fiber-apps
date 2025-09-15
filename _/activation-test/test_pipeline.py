"""
2-agent, 2-step test pipeline
"""
from typing import Dict, Any
from fiberwise_sdk import FiberApp


async def execute(input_data: Dict[str, Any], context: Dict[str, Any], fiber: FiberApp) -> Dict[str, Any]:
    """Execute 2-step pipeline: test-agent -> test-agent-2"""
    
    try:
        # Step 1: First agent
        step1_result = await fiber.agent.activate('test-agent', input_data)
        
        # Step 2: Second agent with first agent's result
        step2_input = {
            'message': step1_result.get('result', 'No result from agent 1')
        }
        step2_result = await fiber.agent.activate('test-agent-2', step2_input)
        
        return {
            'success': True,
            'final_result': step2_result.get('result'),
            'pipeline_name': 'test_pipeline',
            'step1_result': step1_result,
            'step2_result': step2_result
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'pipeline_name': 'test_pipeline'
        }