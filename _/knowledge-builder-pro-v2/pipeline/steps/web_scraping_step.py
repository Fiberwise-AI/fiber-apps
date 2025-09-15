"""
Web Scraping Step

Individual step file for Playwright web scraping using FiberWise platform.
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
    WebScrapingInputSchema,
    WebScrapingOutputSchema
)


class WebScrapingStep(AgentStep):
    """Step for web scraping using Playwright with Pydantic schema validation"""
    
    def __init__(self, fiber_sdk=None):
        super().__init__(
            name="web_scraping",
            description="Scrape web content using Playwright agent",
            agent_name="PlaywrightScraperAgent",
            fiber_sdk=fiber_sdk
        )
    
    def define_input_schema(self) -> Type[StepInputSchema]:
        """Define Pydantic input schema"""
        return WebScrapingInputSchema
    
    def define_output_schema(self) -> Type[StepOutputSchema]:
        """Define Pydantic output schema"""
        return WebScrapingOutputSchema
    
    def prepare_agent_params(self, input_data: Dict[str, Any], 
                           context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare Playwright scraper parameters from validated input"""
        
        wikipedia_data = input_data.get('wikipedia_data', {})
        max_sources = input_data.get('max_sources', 10)
        scraping_mode = input_data.get('scraping_mode', 'discover_and_scrape')
        
        # Extract URLs from Wikipedia references if available
        reference_urls = []
        if wikipedia_data.get('references'):
            reference_urls = [
                ref.get('url', '') for ref in wikipedia_data['references'][:max_sources//2]
            ]
            reference_urls = [url for url in reference_urls if url]
        
        if reference_urls and scraping_mode == 'discover_and_scrape':
            # Use targeted scraping if we have specific URLs
            return {
                'mode': 'scrape_urls',
                'urls': reference_urls,
                'research_topic': input_data['research_topic'],
                'max_depth': 2
            }
        else:
            # Use discovery mode
            return {
                'mode': scraping_mode,
                'research_topic': input_data['research_topic'],
                'max_sources': max_sources,
                'max_depth': 2
            }