"""
Knowledge Synthesis Step

Individual step file for knowledge synthesis and final output generation.
Uses shared base classes and schemas from fiberwise-common.
"""

import sys
import os
import time
from typing import Dict, Any, Type

# Add fiberwise-common to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'fiberwise-common'))

from fiberwise_common.pipeline_steps import (
    FunctionStep,
    StepInputSchema,
    StepOutputSchema,
    KnowledgeSynthesisInputSchema,
    KnowledgeSynthesisOutputSchema
)


class KnowledgeSynthesisStep(FunctionStep):
    """Step for knowledge synthesis and final output generation"""
    
    def __init__(self, fiber_sdk=None):
        super().__init__(
            name="knowledge_synthesis",
            description="Synthesize research data into comprehensive knowledge base",
            function_name="synthesizeKnowledge",
            fiber_sdk=fiber_sdk
        )
    
    def define_input_schema(self) -> Type[StepInputSchema]:
        """Define Pydantic input schema"""
        return KnowledgeSynthesisInputSchema
    
    def define_output_schema(self) -> Type[StepOutputSchema]:
        """Define Pydantic output schema"""
        return KnowledgeSynthesisOutputSchema
    
    def prepare_function_params(self, input_data: Dict[str, Any], 
                              context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare knowledge synthesis parameters"""
        
        # Create unique project ID
        project_id = f"kb_{input_data['research_topic'].replace(' ', '_')}_{int(time.time())}"
        
        return {
            'project_id': project_id,
            'synthesis_mode': input_data.get('synthesis_mode', 'comprehensive')
        }