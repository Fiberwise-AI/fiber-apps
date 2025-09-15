"""
Hypothesis Testing Step

Individual step file for hypothesis generation and testing.
Uses shared base classes and schemas from fiberwise-common.
"""

import sys
import os
from typing import Dict, Any, Type

# Add fiberwise-common to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'fiberwise-common'))

from fiberwise_common.pipeline_steps import (
    AgentStep,
    StepInputSchema,
    StepOutputSchema,
    AgentConversationInputSchema,
    AgentConversationOutputSchema
)


class HypothesisTestingStep(AgentStep):
    """Step for hypothesis generation and testing"""
    
    def __init__(self, fiber_sdk=None):
        super().__init__(
            name="hypothesis_testing",
            description="Generate and test research hypotheses",
            agent_name="hypothesis_agent",
            fiber_sdk=fiber_sdk
        )
    
    def define_input_schema(self) -> Type[StepInputSchema]:
        """Define Pydantic input schema"""
        return AgentConversationInputSchema
    
    def define_output_schema(self) -> Type[StepOutputSchema]:
        """Define Pydantic output schema"""
        return AgentConversationOutputSchema
    
    def prepare_agent_params(self, input_data: Dict[str, Any], 
                           context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare hypothesis testing parameters"""
        return {
            'research_topic': input_data['research_topic'],
            'processed_data': input_data['processed_data'],
            'conversation_context': input_data.get('conversation_context', {}),
            'analysis_focus': input_data.get('analysis_focus', 'hypothesis_generation')
        }