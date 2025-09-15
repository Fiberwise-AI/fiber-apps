"""
Wikipedia Research Step

Individual step file for Wikipedia API research using FiberWise platform.
Uses shared base classes and schemas from fiberwise-common.
"""

import sys
import os
from typing import Dict, Any, Type

# Add fiberwise-common to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'fiberwise-common'))

from fiberwise_common.pipeline_steps import (
    FunctionStep,
    StepInputSchema,
    StepOutputSchema,
    WikipediaResearchInputSchema,
    WikipediaResearchOutputSchema
)


class WikipediaResearchStep(FunctionStep):
    """Step for collecting Wikipedia research data with Pydantic schema validation"""
    
    def __init__(self, fiber_sdk=None):
        super().__init__(
            name="wikipedia_research",
            description="Collect comprehensive Wikipedia research data on a topic",
            function_name="wikipediaApiScraper",
            fiber_sdk=fiber_sdk
        )
    
    def define_input_schema(self) -> Type[StepInputSchema]:
        """Define Pydantic input schema"""
        return WikipediaResearchInputSchema
    
    def define_output_schema(self) -> Type[StepOutputSchema]:
        """Define Pydantic output schema"""
        return WikipediaResearchOutputSchema
    
    def prepare_function_params(self, input_data: Dict[str, Any], 
                              context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare Wikipedia API scraper parameters from validated input"""
        
        # Map research_scope to max_articles if not explicitly provided
        scope_mapping = {
            'narrow': 3,
            'broad': 8,
            'comprehensive': 15
        }
        
        research_scope = input_data.get('research_scope', 'broad')
        max_articles = input_data.get('max_articles', scope_mapping.get(research_scope, 8))
        
        return {
            'topic': input_data['research_topic'],
            'max_articles': max_articles,
            'include_references': True,
            'language': input_data.get('language', 'en')
        }