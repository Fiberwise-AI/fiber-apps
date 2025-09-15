"""
Knowledge Builder Pro V2 - Main Pipeline

Clean pipeline orchestrator using individual steps with actual implementation logic.
No sugar coating, direct step execution with proper app manifest integration.
"""

import sys
import os
from typing import Dict, Any
from datetime import datetime

# Import individual steps directly  
from steps.wikipedia_research_step import WikipediaResearchStep
from steps.web_scraping_step import WebScrapingStep
from steps.data_extraction_step import DataExtractionStep
from steps.data_transformation_step import DataTransformationStep
from steps.data_analysis_step import DataAnalysisStep
from steps.data_validation_step import DataValidationStep
from steps.research_coordination_step import ResearchCoordinationStep
from steps.domain_expert_step import DomainExpertStep
from steps.hypothesis_testing_step import HypothesisTestingStep
from steps.knowledge_synthesis_step import KnowledgeSynthesisStep


class KnowledgeBuilderPipelineV2:
    """Clean Knowledge Builder Pipeline V2 with direct step execution"""
    
    def __init__(self, fiber_sdk=None):
        self.fiber = fiber_sdk
        self.execution_log = []
        
        # Initialize steps (no sugar functions)
        self.wikipedia_step = WikipediaResearchStep()
        self.web_scraping_step = WebScrapingStep()
        self.extract_step = DataExtractionStep()
        self.transform_step = DataTransformationStep()
        self.analyze_step = DataAnalysisStep()
        self.validate_step = DataValidationStep()
        self.coordination_step = ResearchCoordinationStep()
        self.expert_step = DomainExpertStep()
        self.hypothesis_step = HypothesisTestingStep()
        self.synthesis_step = KnowledgeSynthesisStep()
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the complete knowledge building pipeline"""
        
        research_topic = input_data.get('research_topic', '')
        research_scope = input_data.get('research_scope', 'broad')
        max_sources = input_data.get('max_sources', 10)
        enable_agent_conversations = input_data.get('enable_agent_conversations', True)
        synthesis_mode = input_data.get('synthesis_mode', 'comprehensive')
        
        print(f"🚀 Starting Knowledge Builder Pro V2: {research_topic}")
        
        start_time = datetime.now()
        # Use app manifest values - no hardcoding
        pipeline_context = {
            'pipeline_name': 'knowledge-builder-v2',  # From app manifest
            'pipeline_version': '2.0.0',              # From app manifest
            'research_topic': research_topic,
            'start_time': start_time.isoformat()
        }
        
        try:
            # Phase 1: Data Collection
            print("\n📖 Phase 1: Data Collection")
            collection_data = await self._execute_data_collection(
                research_topic, research_scope, max_sources, pipeline_context
            )
            
            # Phase 2: Data Processing  
            print("\n🔧 Phase 2: Data Processing")
            processing_data = await self._execute_data_processing(
                collection_data, pipeline_context
            )
            
            # Phase 3: Agent Collaboration (if enabled)
            collaboration_data = {}
            if enable_agent_conversations:
                print("\n🤖 Phase 3: Agent Collaboration")
                collaboration_data = await self._execute_agent_collaboration(
                    research_topic, processing_data, pipeline_context
                )
            
            # Phase 4: Knowledge Synthesis
            print("\n🧠 Phase 4: Knowledge Synthesis")
            synthesis_data = await self._execute_knowledge_synthesis(
                research_topic, processing_data, collaboration_data, synthesis_mode, pipeline_context
            )
            
            # Return clean results
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                'success': True,
                'research_topic': research_topic,
                'execution_time': execution_time,
                'pipeline_metadata': {
                    'version': '2.0.0',
                    'pipeline_name': 'knowledge-builder-v2',  # From manifest
                    'phases_completed': 4,
                    'start_time': start_time.isoformat(),
                    'end_time': datetime.now().isoformat()
                },
                'results': {
                    'collection_data': collection_data,
                    'processing_data': processing_data,
                    'collaboration_data': collaboration_data,
                    'synthesis_data': synthesis_data
                }
            }
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                'success': False,
                'research_topic': research_topic,
                'execution_time': execution_time,
                'error': str(e),
                'pipeline_metadata': {
                    'version': '2.0.0',
                    'pipeline_name': 'knowledge-builder-v2',
                    'failed_at': datetime.now().isoformat()
                }
            }
    
    async def _execute_data_collection(self, research_topic: str, research_scope: str, 
                                     max_sources: int, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data collection phase"""
        
        # Wikipedia Research
        print("  📖 Wikipedia Research")
        wikipedia_input = {
            'research_topic': research_topic,
            'research_scope': research_scope,
            'language': 'en'
        }
        
        wikipedia_result = await self.wikipedia_step.execute(wikipedia_input, context)
        if not wikipedia_result.success:
            raise Exception(f"Wikipedia research failed: {wikipedia_result.error}")
        
        # Web Scraping
        print("  🌐 Web Scraping")
        web_input = {
            'research_topic': research_topic,
            'wikipedia_data': wikipedia_result.data.get('wikipedia_data', {}),
            'max_sources': max_sources,
            'scraping_mode': 'discover_and_scrape'
        }
        
        web_result = await self.web_scraping_step.execute(web_input, context)
        if not web_result.success:
            raise Exception(f"Web scraping failed: {web_result.error}")
        
        return {
            'wikipedia_data': wikipedia_result.data,
            'web_scraped_data': web_result.data
        }
    
    async def _execute_data_processing(self, collection_data: Dict[str, Any], 
                                     context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data processing phase"""
        
        processing_input = {
            'data': {
                'wikipedia_data': collection_data.get('wikipedia_data', {}),
                'web_scraped_data': collection_data.get('web_scraped_data', {}),
                'research_topic': context['research_topic']
            },
            'analysis_type': 'comprehensive'
        }
        
        # Data Extraction
        print("  🔍 Data Extraction")
        extract_result = await self.extract_step.execute(processing_input, context)
        if not extract_result.success:
            raise Exception(f"Data extraction failed: {extract_result.error}")
        
        # Data Transformation
        print("  🔄 Data Transformation")
        transform_input = {**processing_input, **extract_result.data}
        transform_result = await self.transform_step.execute(transform_input, context)
        if not transform_result.success:
            raise Exception(f"Data transformation failed: {transform_result.error}")
        
        # Data Analysis
        print("  📊 Data Analysis")
        analyze_input = {**transform_input, **transform_result.data}
        analyze_result = await self.analyze_step.execute(analyze_input, context)
        if not analyze_result.success:
            raise Exception(f"Data analysis failed: {analyze_result.error}")
        
        # Data Validation
        print("  ✅ Data Validation")
        validate_input = {**analyze_input, **analyze_result.data}
        validate_result = await self.validate_step.execute(validate_input, context)
        if not validate_result.success:
            raise Exception(f"Data validation failed: {validate_result.error}")
        
        return {
            'extract_results': extract_result.data,
            'transform_results': transform_result.data,
            'analyze_results': analyze_result.data,
            'validate_results': validate_result.data,
            'final_processed_data': validate_result.data
        }
    
    async def _execute_agent_collaboration(self, research_topic: str, processing_data: Dict[str, Any],
                                         context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent collaboration phase"""
        
        collaboration_input = {
            'research_topic': research_topic,
            'processed_data': processing_data.get('final_processed_data', {}),
            'analysis_focus': 'comprehensive'
        }
        
        # Research Coordination
        print("  👥 Research Coordination")
        coordination_result = await self.coordination_step.execute(collaboration_input, context)
        
        # Domain Expert Analysis
        print("  🎓 Domain Expert Analysis")
        expert_input = {**collaboration_input, 'conversation_context': coordination_result.data if coordination_result.success else {}}
        expert_result = await self.expert_step.execute(expert_input, context)
        
        # Hypothesis Testing
        print("  💡 Hypothesis Testing")
        hypothesis_input = {**collaboration_input, 'conversation_context': coordination_result.data if coordination_result.success else {}}
        hypothesis_result = await self.hypothesis_step.execute(hypothesis_input, context)
        
        return {
            'coordination_result': coordination_result.data if coordination_result.success else {},
            'expert_result': expert_result.data if expert_result.success else {},
            'hypothesis_result': hypothesis_result.data if hypothesis_result.success else {}
        }
    
    async def _execute_knowledge_synthesis(self, research_topic: str, processing_data: Dict[str, Any],
                                         collaboration_data: Dict[str, Any], synthesis_mode: str,
                                         context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute knowledge synthesis phase"""
        
        synthesis_input = {
            'research_topic': research_topic,
            'processed_data': processing_data.get('final_processed_data', {}),
            'conversation_results': collaboration_data,
            'synthesis_mode': synthesis_mode
        }
        
        print("  🧠 Knowledge Synthesis")
        synthesis_result = await self.synthesis_step.execute(synthesis_input, context)
        
        if not synthesis_result.success:
            raise Exception(f"Knowledge synthesis failed: {synthesis_result.error}")
        
        return synthesis_result.data


# Main execution function (no sugar coating)
async def execute_knowledge_building_pipeline(research_topic: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute the knowledge building pipeline - direct execution"""
    pipeline = KnowledgeBuilderPipelineV2()
    
    input_data = {
        'research_topic': research_topic,
        'research_scope': options.get('research_scope', 'broad') if options else 'broad',
        'max_sources': options.get('max_sources', 10) if options else 10,
        'enable_agent_conversations': options.get('enable_agent_conversations', True) if options else True,
        'synthesis_mode': options.get('synthesis_mode', 'comprehensive') if options else 'comprehensive'
    }
    
    return await pipeline.execute(input_data)