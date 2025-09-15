#!/usr/bin/env python3
"""
Simple Test Pipeline Main

Clean 2-step pipeline execution with real step logic.
"""

import asyncio
import json
import sys
import os
from datetime import datetime

# Add steps to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'steps'))

from text_processing_step import TextProcessingStep
from summary_generation_step import SummaryGenerationStep


def load_app_manifest():
    """Load app manifest configuration"""
    manifest_path = os.path.join(os.path.dirname(__file__), '..', 'app_manifest.json')
    with open(manifest_path, 'r') as f:
        return json.load(f)


async def run_pipeline(input_text: str):
    """Run the simple 2-step pipeline"""
    
    manifest = load_app_manifest()
    start_time = datetime.now()
    
    # Use app manifest values
    pipeline_context = {
        'pipeline_name': manifest['pipeline_config']['pipeline_name'],
        'pipeline_version': manifest['pipeline_config']['pipeline_version'],
        'start_time': start_time.isoformat()
    }
    
    print(f"Starting {pipeline_context['pipeline_name']} v{pipeline_context['pipeline_version']}")
    print(f"Input text: {input_text[:50]}...")
    print()
    
    # Step 1: Text Processing
    step1 = TextProcessingStep()
    step1_input = {'text': input_text}
    step1_result = await step1.execute(step1_input, pipeline_context)
    
    if not step1_result['success']:
        print(f"Step 1 failed: {step1_result}")
        return
    
    print(f"Step 1 completed: {step1_result['data']['processed_data']['word_count']} words processed")
    print()
    
    # Step 2: Summary Generation
    step2 = SummaryGenerationStep()
    step2_input = step1_result  # Pass step1 output to step2
    step2_result = await step2.execute(step2_input, pipeline_context)
    
    if not step2_result['success']:
        print(f"Step 2 failed: {step2_result}")
        return
    
    print(f"Step 2 completed: Summary generated")
    print()
    
    # Display results
    summary_data = step2_result['data']['summary_data']
    
    print("=== PIPELINE RESULTS ===")
    print(f"Summary: {summary_data['summary']}")
    print(f"Top Keywords: {', '.join([k['keyword'] for k in summary_data['top_keywords']])}")
    print(f"Insights:")
    for insight in summary_data['key_insights']:
        print(f"  - {insight}")
    
    end_time = datetime.now()
    execution_time = (end_time - start_time).total_seconds()
    print(f"\nPipeline completed in {execution_time:.2f} seconds")


if __name__ == "__main__":
    test_text = """
    Artificial intelligence is transforming the world in amazing ways. 
    Machine learning algorithms are becoming more sophisticated and powerful. 
    This technology enables computers to learn from data and make intelligent decisions. 
    AI applications are expanding across industries like healthcare, finance, and transportation. 
    The future looks bright for artificial intelligence development and innovation.
    """
    
    asyncio.run(run_pipeline(test_text))