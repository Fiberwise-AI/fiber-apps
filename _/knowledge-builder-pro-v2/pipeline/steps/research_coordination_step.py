"""
Research Coordination Step

Individual step file for coordinating research process with agents.
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


class ResearchCoordinationStep(AgentStep):
    """Step for coordinating and orchestrating research process"""
    
    def __init__(self, fiber_sdk=None):
        super().__init__(
            name="research_coordination",
            description="Coordinate and orchestrate research process",
            agent_name="research_coordinator_agent",
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
        """Prepare research coordinator parameters"""
        return {
            'research_topic': input_data['research_topic'],
            'processed_data': input_data['processed_data'],
            'conversation_context': input_data.get('conversation_context', {}),
            'analysis_focus': input_data.get('analysis_focus', 'coordination')
        }