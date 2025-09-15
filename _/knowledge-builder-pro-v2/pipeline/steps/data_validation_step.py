"""
Data Validation Step

Individual step file for validating data quality and reliability.
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
    DataProcessingInputSchema,
    DataProcessingOutputSchema
)


class DataValidationStep(AgentStep):
    """Step for validating quality and reliability of research data"""
    
    def __init__(self, fiber_sdk=None):
        super().__init__(
            name="data_validation",
            description="Validate quality and reliability of research data",
            agent_name="data_processor_agent",
            fiber_sdk=fiber_sdk
        )
    
    def define_input_schema(self) -> Type[StepInputSchema]:
        """Define Pydantic input schema"""
        return DataProcessingInputSchema
    
    def define_output_schema(self) -> Type[StepOutputSchema]:
        """Define Pydantic output schema"""
        return DataProcessingOutputSchema
    
    def prepare_agent_params(self, input_data: Dict[str, Any], 
                           context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare data processor parameters for validation"""
        return {
            'mode': 'validate',
            'data': input_data['data'],
            'analysis_type': input_data.get('analysis_type', 'comprehensive')
        }