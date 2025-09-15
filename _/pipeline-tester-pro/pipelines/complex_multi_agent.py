"""
Complex Multi-Agent Pipeline

Implements the flow:
Test Data Generation → Parallel Processing → Synthesis → Performance Analysis
                    ↗ Data Processor 1 ↘
                   ↗                    ↘
Generate Test Data                       Advanced Processor → Analysis
                   ↘                    ↗
                    ↘ Data Processor 2 ↗
"""

import asyncio
from typing import Dict, Any


class ComplexMultiAgentPipeline:
    """
    Simple pipeline class that orchestrates the complex multi-agent workflow.
    Self-contained - no external dependencies except FiberWise SDK.
    """
    
    def __init__(self, fiber_sdk):
        self.fiber = fiber_sdk
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete pipeline workflow.
        
        Args:
            input_data: Configuration for the pipeline execution
            
        Returns:
            Dictionary containing results from all pipeline steps
        """
        
        # Step 1: Generate Test Data
        print("[Pipeline] Step 1: Generating test data...")
        test_data_result = await self.fiber.func.activate('generateTestData', {
            'data_type': input_data.get('data_type', 'json_objects'),
            'count': input_data.get('count', 10),
            'complexity': input_data.get('complexity', 'medium')
        })
        
        if not test_data_result.get('success'):
            raise Exception(f"Test data generation failed: {test_data_result.get('error')}")
        
        generated_data = test_data_result.get('generated_data', [])
        print(f"[Pipeline] Generated {len(generated_data)} test items")
        
        # Step 2: Parallel Processing - Data Processor 1 (Extract) and Data Processor 2 (Transform)
        print("[Pipeline] Step 2: Running parallel data processors...")
        
        extract_task = self.fiber.agent.activate('DataProcessorAgent', {
            'mode': 'extract',
            'data': generated_data
        })
        
        transform_task = self.fiber.agent.activate('DataProcessorAgent', {
            'mode': 'transform', 
            'data': generated_data
        })
        
        # Wait for both parallel processors to complete
        extract_result, transform_result = await asyncio.gather(extract_task, transform_task)
        print("[Pipeline] Parallel processing completed")
        
        # Step 3: Synthesis - Advanced Processor combines results from parallel processors
        print("[Pipeline] Step 3: Running synthesis with advanced processor...")
        synthesis_result = await self.fiber.agent.activate('AdvancedTestAgent', {
            'mode': 'synthesis',
            'extract_data': extract_result,
            'transform_data': transform_result
        })
        print("[Pipeline] Synthesis completed")
        
        # Step 4: Performance Analysis
        print("[Pipeline] Step 4: Analyzing pipeline performance...")
        analysis_result = await self.fiber.func.activate('analyzePipelinePerformance', {
            'execution_logs': [
                {'step': 'extract', 'result': extract_result},
                {'step': 'transform', 'result': transform_result}, 
                {'step': 'synthesis', 'result': synthesis_result}
            ],
            'analysis_type': input_data.get('analysis_type', 'timing')
        })
        print("[Pipeline] Performance analysis completed")
        
        # Return comprehensive results
        return {
            'pipeline_name': 'Complex Multi-Agent Pipeline',
            'execution_successful': True,
            'steps_completed': 4,
            'results': {
                'test_data': {
                    'count': len(generated_data),
                    'data_type': input_data.get('data_type', 'json_objects'),
                    'data': generated_data[:5] if len(generated_data) > 5 else generated_data  # Sample for display
                },
                'parallel_processing': {
                    'extract_result': extract_result,
                    'transform_result': transform_result
                },
                'synthesis': synthesis_result,
                'performance_analysis': analysis_result
            },
            'metadata': {
                'input_config': input_data,
                'pipeline_flow': [
                    'Generate Test Data',
                    'Parallel Processing (Extract + Transform)', 
                    'Synthesis',
                    'Performance Analysis'
                ]
            }
        }