"""
Knowledge Builder Pro V2 - Pipeline Steps

Individual step implementations with actual logic.
Each step is in its own file for maximum modularity and maintainability.
"""

# Import all individual steps
from .wikipedia_research_step import WikipediaResearchStep
from .web_scraping_step import WebScrapingStep
from .data_extraction_step import DataExtractionStep
from .data_transformation_step import DataTransformationStep
from .data_analysis_step import DataAnalysisStep
from .data_validation_step import DataValidationStep
from .research_coordination_step import ResearchCoordinationStep
from .domain_expert_step import DomainExpertStep
from .hypothesis_testing_step import HypothesisTestingStep
from .knowledge_synthesis_step import KnowledgeSynthesisStep

# Version info
__version__ = "2.0.0"
__description__ = "Knowledge Builder Pro V2 - Modular Pipeline Steps"