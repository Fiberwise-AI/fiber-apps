"""
Pipeline Registry for FiberWise Pipeline Tester Pro

Simple registry to manage available pipelines without complex infrastructure.
"""

from .complex_multi_agent import ComplexMultiAgentPipeline


# Registry of available pipelines
AVAILABLE_PIPELINES = {
    'complex-multi-agent': ComplexMultiAgentPipeline
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