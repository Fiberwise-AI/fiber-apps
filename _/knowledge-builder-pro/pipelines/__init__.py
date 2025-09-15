"""
Pipeline Registry for Knowledge Builder Pro

Simple registry for the knowledge building pipeline without complex infrastructure.
"""

from .knowledge_builder_pipeline import KnowledgeBuilderPipeline


# Registry of available pipelines
AVAILABLE_PIPELINES = {
    'knowledge-builder': KnowledgeBuilderPipeline
}


def get_pipeline(pipeline_name: str):
    """
    Get a pipeline class by name.
    
    Args:
        pipeline_name: Name of the pipeline to retrieve
        
    Returns:
        Pipeline class or None if not found
    """
    return AVAILABLE_PIPELINES.get(pipeline_name)


def list_available_pipelines():
    """
    Get list of all available pipeline names.
    
    Returns:
        List of pipeline names
    """
    return list(AVAILABLE_PIPELINES.keys())