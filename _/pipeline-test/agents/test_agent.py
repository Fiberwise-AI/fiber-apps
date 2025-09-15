"""
Simple Test Agent for Pipeline Testing

This agent provides LLM-powered responses for testing pipeline execution.
It processes input text and returns a structured response that can be used
in pipeline workflows.
"""

from typing import Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

class TestAgent:
    """
    Simple test agent that processes input and returns LLM-generated responses.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the test agent with configuration."""
        self.config = config or {}
        self.name = "TestAgent"
        self.version = "0.0.1"
        
    async def activate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main activation method for the agent.
        
        Args:
            context: Dictionary containing input data and execution context
            
        Returns:
            Dictionary with agent response and metadata
        """
        try:
            logger.info(f"TestAgent activated with context: {context}")
            
            # Extract input data
            input_data = context.get('input_data', {})
            input_text = input_data.get('input_text', '')
            test_id = input_data.get('test_id', 'unknown')
            
            # Get prompt template from config or use default
            prompt_template = self.config.get('prompt_template', 'Process this input: {input_text}')
            
            # Format the prompt
            formatted_prompt = prompt_template.format(input_text=input_text)
            
            # Simulate LLM processing (in a real implementation, this would call an LLM)
            response = await self._process_with_llm(formatted_prompt, input_text)
            
            # Prepare result
            result = {
                'agent_name': self.name,
                'agent_version': self.version,
                'test_id': test_id,
                'input_received': input_text,
                'processed_prompt': formatted_prompt,
                'llm_response': response,
                'status': 'completed',
                'metadata': {
                    'processing_method': 'simulated_llm',
                    'config_used': self.config
                }
            }
            
            logger.info(f"TestAgent completed processing for test_id: {test_id}")
            return result
            
        except Exception as e:
            logger.error(f"TestAgent activation failed: {str(e)}")
            return {
                'agent_name': self.name,
                'status': 'failed',
                'error': str(e),
                'input_received': context.get('input_data', {}).get('input_text', ''),
                'test_id': context.get('input_data', {}).get('test_id', 'unknown')
            }
    
    async def _process_with_llm(self, prompt: str, input_text: str) -> str:
        """
        Simulate LLM processing. In a real implementation, this would
        call an actual LLM service.
        
        Args:
            prompt: Formatted prompt for the LLM
            input_text: Original input text
            
        Returns:
            Simulated LLM response
        """
        # This is a simple simulation - replace with actual LLM call
        if not input_text.strip():
            return "I received an empty input. Please provide some text to process."
        
        # Simulate different types of responses based on input
        input_lower = input_text.lower()
        
        if 'hello' in input_lower or 'hi' in input_lower:
            return f"Hello! I see you greeted me with: '{input_text}'. How can I help you today?"
        
        elif 'test' in input_lower:
            return f"I'm processing your test input: '{input_text}'. This is a simulated LLM response for pipeline testing purposes."
        
        elif 'question' in input_lower or '?' in input_text:
            return f"You asked: '{input_text}'. While I'm just a test agent, I'd be happy to help if I were a real LLM!"
        
        elif len(input_text.split()) > 10:
            return f"I received a longer text with {len(input_text.split())} words. Here's my analysis: The text appears to be about {input_text.split()[0]} and mentions several key concepts. This is a simulated analysis for testing."
        
        else:
            return f"I processed your input: '{input_text}'. Length: {len(input_text)} characters, {len(input_text.split())} words. This response demonstrates basic text analysis capabilities for pipeline testing."
    
    def get_agent_info(self) -> Dict[str, Any]:
        """
        Return information about this agent.
        
        Returns:
            Dictionary with agent metadata
        """
        return {
            'name': self.name,
            'version': self.version,
            'description': 'Simple test agent for pipeline execution testing',
            'capabilities': [
                'text_processing',
                'simulated_llm_response',
                'pipeline_integration'
            ],
            'config_options': [
                'prompt_template'
            ]
        }


# Factory function for creating agent instances (required by FiberWise)
def create_agent(config: Optional[Dict[str, Any]] = None) -> TestAgent:
    """
    Factory function to create TestAgent instances.
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        TestAgent instance
    """
    return TestAgent(config)