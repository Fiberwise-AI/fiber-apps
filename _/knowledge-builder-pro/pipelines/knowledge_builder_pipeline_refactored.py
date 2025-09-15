"""
Knowledge Builder Pipeline (Refactored)

Refactored version using the shared FiberWise pipeline steps library.
This demonstrates how to use the standardized step components for cleaner,
more maintainable pipeline code.
"""

import sys
import os

# Add the shared pipeline steps to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'docs'))

from pipeline_steps import (
    WikipediaResearchStep,
    WebScrapingStep,
    ProcessingPipeline,
    MultiAgentCollaborationStep,
    SynthesisStep,
    PipelineRunner
)
from typing import Dict, Any
from datetime import datetime


class KnowledgeBuilderPipelineRefactored:
    """
    Refactored Knowledge Builder Pipeline using shared step components.
    
    Pipeline Flow:
    1. Wikipedia Research Step
    2. Web Scraping Step
    3. Data Processing Pipeline (Extract → Transform → Analyze → Validate)
    4. Multi-Agent Collaboration Step
    5. Knowledge Synthesis Step
    """
    
    def __init__(self, fiber_sdk):
        self.fiber = fiber_sdk
        self.runner = PipelineRunner(fiber_sdk)
        self.execution_log = []
        
        # Initialize pipeline steps
        self.wikipedia_step = WikipediaResearchStep(fiber_sdk)
        self.web_scraping_step = WebScrapingStep(fiber_sdk)
        self.processing_pipeline = ProcessingPipeline(fiber_sdk)
        self.collaboration_step = MultiAgentCollaborationStep(fiber_sdk)
        self.synthesis_step = SynthesisStep(fiber_sdk)
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the knowledge building pipeline using shared steps.
        
        Args:
            input_data: Pipeline configuration with research_topic and options
            
        Returns:
            Comprehensive knowledge base with execution metadata
        """
        
        research_topic = input_data.get('research_topic', '')
        research_scope = input_data.get('research_scope', 'broad')
        max_sources = input_data.get('max_sources', 10)
        enable_agent_conversations = input_data.get('enable_agent_conversations', True)
        synthesis_mode = input_data.get('synthesis_mode', 'comprehensive')
        
        print(f"[KnowledgeBuilderPipelineRefactored] Starting research on: {research_topic}")
        print(f"[KnowledgeBuilderPipelineRefactored] Using shared pipeline steps library")
        
        start_time = datetime.now()
        pipeline_context = {
            'pipeline_name': 'knowledge_builder_refactored',
            'research_topic': research_topic,
            'start_time': start_time.isoformat()
        }
        
        try:
            # Prepare initial input with step-specific parameters
            step_input = {
                'research_topic': research_topic,
                'research_scope': research_scope,
                'max_sources': max_sources,
                'synthesis_mode': synthesis_mode
            }
            
            # Step 1: Wikipedia Research
            print("[KnowledgeBuilderPipelineRefactored] Step 1: Wikipedia Research")
            wikipedia_result = await self.wikipedia_step.execute(step_input, pipeline_context)
            
            if not wikipedia_result.success:
                raise Exception(f"Wikipedia research failed: {wikipedia_result.error}")
            
            # Merge Wikipedia data into input for next step
            step_input.update(wikipedia_result.data)
            
            # Step 2: Web Scraping
            print("[KnowledgeBuilderPipelineRefactored] Step 2: Web Scraping")
            web_scraping_result = await self.web_scraping_step.execute(step_input, pipeline_context)
            
            if not web_scraping_result.success:
                raise Exception(f"Web scraping failed: {web_scraping_result.error}")
            
            # Merge web scraping data
            step_input.update(web_scraping_result.data)
            
            # Step 3: Data Processing Pipeline
            print("[KnowledgeBuilderPipelineRefactored] Step 3: Data Processing")
            
            # Prepare processing input with combined data
            processing_input = {
                'data': {
                    'wikipedia_data': step_input.get('wikipedia_data', {}),
                    'web_scraped_data': step_input.get('web_scraped_data', {}),
                    'research_topic': research_topic
                },
                'analysis_type': 'comprehensive'
            }
            
            processing_result = await self.processing_pipeline.run_full_processing(
                processing_input, pipeline_context
            )
            
            if not processing_result['success']:
                raise Exception(f"Data processing failed: {processing_result.get('error', 'Unknown error')}")
            
            step_input['processed_data'] = processing_result['data']
            
            # Step 4: Multi-Agent Collaboration (if enabled)
            if enable_agent_conversations:
                print("[KnowledgeBuilderPipelineRefactored] Step 4: Multi-Agent Collaboration")
                collaboration_result = await self.collaboration_step.execute(step_input, pipeline_context)
                
                if collaboration_result['success']:
                    step_input['conversation_results'] = collaboration_result['data']
                else:
                    print(f"⚠️ Agent collaboration failed: {collaboration_result.get('error', 'Unknown error')}")
                    # Continue with empty conversation results
                    step_input['conversation_results'] = {'conversations': [], 'insights': []}
            else:
                step_input['conversation_results'] = {'conversations': [], 'insights': []}
            
            # Step 5: Knowledge Synthesis
            print("[KnowledgeBuilderPipelineRefactored] Step 5: Knowledge Synthesis")
            synthesis_result = await self.synthesis_step.execute(step_input, pipeline_context)
            
            if not synthesis_result.success:
                raise Exception(f"Knowledge synthesis failed: {synthesis_result.error}")
            
            # Calculate execution metrics
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            # Prepare comprehensive results
            pipeline_results = {
                'success': True,
                'research_topic': research_topic,
                'execution_successful': True,
                'research_summary': {
                    'wikipedia_articles': len(step_input.get('wikipedia_data', {}).get('articles', [])),
                    'web_sources': len(step_input.get('web_scraped_data', {}).get('scraped_results', [])),
                    'agent_conversations': len(step_input.get('conversation_results', {}).get('conversations', [])),
                    'knowledge_elements': len(synthesis_result.data.get('knowledge_base', {}).get('knowledge_elements', []))
                },
                'research_data': {
                    'wikipedia_research': step_input.get('wikipedia_data', {}),
                    'web_scraping_results': step_input.get('web_scraped_data', {}),
                    'processed_analysis': step_input.get('processed_data', {}),
                    'agent_conversations': step_input.get('conversation_results', {}),
                    'final_knowledge_base': synthesis_result.data.get('knowledge_base', {})
                },
                'execution_metadata': {
                    'pipeline_version': '2.0.0-refactored',
                    'pipeline_type': 'shared_steps',
                    'execution_time': execution_time,
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'steps_executed': [
                        {'step': 'wikipedia_research', 'success': wikipedia_result.success, 'time': wikipedia_result.execution_time},
                        {'step': 'web_scraping', 'success': web_scraping_result.success, 'time': web_scraping_result.execution_time},
                        {'step': 'data_processing', 'success': processing_result['success'], 'time': 0},  # Processing pipeline handles its own timing
                        {'step': 'agent_collaboration', 'success': enable_agent_conversations and step_input.get('conversation_results', {}) != {}, 'enabled': enable_agent_conversations},
                        {'step': 'knowledge_synthesis', 'success': synthesis_result.success, 'time': synthesis_result.execution_time}
                    ],
                    'quality_score': self.calculate_quality_score(synthesis_result.data)
                }
            }
            
            # Add step results to final output
            pipeline_results['step_results'] = {
                'wikipedia_research': wikipedia_result.to_dict(),
                'web_scraping': web_scraping_result.to_dict(),
                'data_processing': processing_result,
                'agent_collaboration': step_input.get('conversation_results', {}),
                'knowledge_synthesis': synthesis_result.to_dict()
            }
            
            print(f"[KnowledgeBuilderPipelineRefactored] Pipeline completed successfully!")
            print(f"[KnowledgeBuilderPipelineRefactored] Total execution time: {execution_time:.2f} seconds")
            print(f"[KnowledgeBuilderPipelineRefactored] Knowledge elements: {len(synthesis_result.data.get('knowledge_base', {}).get('knowledge_elements', []))}")
            
            return pipeline_results
            
        except Exception as e:
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            print(f"[KnowledgeBuilderPipelineRefactored] Pipeline execution failed: {str(e)}")
            
            return {
                'success': False,
                'research_topic': research_topic,
                'execution_successful': False,
                'error': str(e),
                'execution_metadata': {
                    'pipeline_version': '2.0.0-refactored',
                    'pipeline_type': 'shared_steps',
                    'execution_time': execution_time,
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'failed_at': datetime.now().isoformat()
                },
                'partial_results': step_input if 'step_input' in locals() else {}
            }
    
    def calculate_quality_score(self, synthesis_data: Dict[str, Any]) -> float:
        """Calculate overall quality score for the research results"""
        try:
            confidence_scores = synthesis_data.get('confidence_scores', {})
            
            if not confidence_scores:
                return 0.5  # Default score if no confidence data
            
            # Average the confidence scores
            scores = [v for v in confidence_scores.values() if isinstance(v, (int, float))]
            
            if scores:
                return sum(scores) / len(scores)
            else:
                return 0.5
                
        except Exception:
            return 0.5


# For backward compatibility, create an alias
KnowledgeBuilderPipeline = KnowledgeBuilderPipelineRefactored