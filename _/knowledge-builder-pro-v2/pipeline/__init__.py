"""
Knowledge Builder Pro V2 - Pipeline Module

Main pipeline module with modular step architecture and shared schemas.
"""

from .main import (
    KnowledgeBuilderPipelineV2,
    execute_knowledge_building_pipeline,
    demonstrate_pipeline
)

# Import step registry for external access
from .steps import (
    AVAILABLE_STEPS,
    get_step_class,
    list_available_steps,
    create_step
)

__version__ = "2.0.0"
__description__ = "Knowledge Builder Pro V2 - Modular Pipeline Architecture"