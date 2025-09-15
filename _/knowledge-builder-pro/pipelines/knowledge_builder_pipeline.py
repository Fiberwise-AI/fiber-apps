"""
Knowledge Builder Pipeline

Deep research pipeline implementing:
Wikipedia API Scraper → Playwright Web Scraper → Data Processor → Conversational Analysis → Knowledge Synthesis

Uses SmolAgents with FiberWise platform LLM for intelligent agent conversations
and collaborative research synthesis.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from datetime import datetime


class KnowledgeBuilderPipeline:
    """
    Comprehensive knowledge building pipeline that orchestrates
    multiple research agents for deep topic analysis.
    """
    
    def __init__(self, fiber_sdk):
        self.fiber = fiber_sdk
        self.execution_log = []
        self.agent_conversations = []
        self.research_state = {}
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete knowledge building pipeline.
        
        Pipeline Flow:
        1. Wikipedia API Research
        2. Playwright Web Scraping  
        3. Data Processing & Quality Assessment
        4. Agent Conversations & Hypothesis Testing
        5. Knowledge Synthesis
        
        Args:
            input_data: Pipeline configuration and research topic
            
        Returns:
            Comprehensive knowledge base with agent insights
        """
        
        research_topic = input_data.get('research_topic', '')
        research_scope = input_data.get('research_scope', 'broad')
        max_sources = input_data.get('max_sources', 15)
        enable_agent_conversations = input_data.get('enable_agent_conversations', True)
        synthesis_depth = input_data.get('synthesis_depth', 'detailed')
        
        print(f"[KnowledgeBuilderPipeline] Starting deep research on: {research_topic}")
        print(f"[KnowledgeBuilderPipeline] Scope: {research_scope}, Max sources: {max_sources}")
        
        try:
            # Initialize research state
            self.research_state = {
                'topic': research_topic,
                'scope': research_scope,
                'start_time': datetime.now().isoformat(),
                'phase': 'initialization',
                'sources_collected': 0,
                'conversations_count': 0
            }
            
            # Step 1: Wikipedia API Research
            print("[KnowledgeBuilderPipeline] Phase 1: Wikipedia API Research")
            self.research_state['phase'] = 'wikipedia_research'
            wikipedia_data = await self.conduct_wikipedia_research(research_topic, research_scope)
            
            # Step 2: Playwright Web Scraping
            print("[KnowledgeBuilderPipeline] Phase 2: Web Scraping with Playwright")
            self.research_state['phase'] = 'web_scraping'
            web_scraped_data = await self.conduct_web_scraping(research_topic, max_sources, wikipedia_data)
            
            # Step 3: Data Processing & Quality Assessment
            print("[KnowledgeBuilderPipeline] Phase 3: Data Processing & Analysis")
            self.research_state['phase'] = 'data_processing'
            processed_data = await self.process_and_analyze_data(research_topic, wikipedia_data, web_scraped_data)
            
            # Step 4: Agent Conversations & Collaborative Analysis
            if enable_agent_conversations:
                print("[KnowledgeBuilderPipeline] Phase 4: Agent Conversations & Hypothesis Testing")
                self.research_state['phase'] = 'agent_collaboration'
                conversation_results = await self.facilitate_agent_conversations(research_topic, processed_data)
            else:
                conversation_results = {'conversations': [], 'insights': []}
            
            # Step 5: Knowledge Synthesis
            print("[KnowledgeBuilderPipeline] Phase 5: Knowledge Synthesis")
            self.research_state['phase'] = 'synthesis'
            knowledge_base = await self.synthesize_knowledge(
                research_topic, processed_data, conversation_results, synthesis_depth
            )
            
            # Finalize execution
            self.research_state['phase'] = 'completed'
            self.research_state['end_time'] = datetime.now().isoformat()
            
            # Prepare comprehensive results
            pipeline_results = {
                'research_topic': research_topic,
                'execution_successful': True,
                'research_summary': {
                    'wikipedia_articles': len(wikipedia_data.get('related_articles', [])) + (1 if wikipedia_data.get('main_article') else 0),
                    'web_sources': len(web_scraped_data.get('scraped_data', [])),
                    'agent_conversations': len(conversation_results.get('conversations', [])),
                    'knowledge_elements': len(knowledge_base.get('knowledge_elements', []))
                },
                'research_data': {
                    'wikipedia_research': wikipedia_data,
                    'web_scraping_results': web_scraped_data,
                    'processed_analysis': processed_data,
                    'agent_conversations': conversation_results,
                    'final_knowledge_base': knowledge_base
                },
                'execution_metadata': {
                    'pipeline_version': '1.0.0',
                    'execution_time': self.calculate_execution_time(),
                    'research_state': self.research_state,
                    'execution_log': self.execution_log,
                    'quality_score': self.calculate_research_quality_score(knowledge_base)
                }
            }
            
            print(f"[KnowledgeBuilderPipeline] Research completed successfully!")
            print(f"[KnowledgeBuilderPipeline] Knowledge elements: {len(knowledge_base.get('knowledge_elements', []))}")
            
            return pipeline_results
            
        except Exception as e:
            print(f"[KnowledgeBuilderPipeline] Pipeline execution failed: {str(e)}")
            
            # Return error state with partial results
            return {
                'research_topic': research_topic,
                'execution_successful': False,
                'error': str(e),
                'partial_results': getattr(self, 'research_state', {}),
                'execution_log': self.execution_log
            }
    
    async def conduct_wikipedia_research(self, topic: str, scope: str) -> Dict[str, Any]:
        """Conduct comprehensive Wikipedia research."""
        
        # Determine research parameters based on scope
        scope_params = {
            'narrow': {'max_articles': 3, 'include_references': True},
            'broad': {'max_articles': 8, 'include_references': True},
            'comprehensive': {'max_articles': 15, 'include_references': True}
        }
        
        params = scope_params.get(scope, scope_params['broad'])
        
        try:
            wikipedia_result = await self.fiber.func.activate('wikipediaApiScraper', {
                'topic': topic,
                'max_articles': params['max_articles'],
                'include_references': params['include_references'],
                'language': 'en'
            })
            
            if wikipedia_result.get('success'):
                self.log_execution_step(
                    'wikipedia_research',
                    f"Successfully retrieved {len(wikipedia_result.get('related_articles', []))} related articles",
                    wikipedia_result.get('metadata', {})
                )
                return wikipedia_result
            else:
                raise Exception(f"Wikipedia research failed: {wikipedia_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.log_execution_step('wikipedia_research', f"Failed: {str(e)}", {'error': str(e)})
            return {
                'success': False,
                'error': str(e),
                'main_article': None,
                'related_articles': [],
                'references': []
            }
    
    async def conduct_web_scraping(self, topic: str, max_sources: int, wikipedia_data: Dict[str, Any]) -> Dict[str, Any]:
        """Conduct web scraping using Playwright agent."""
        
        try:
            # Extract URLs from Wikipedia references for targeted scraping
            reference_urls = []
            if wikipedia_data.get('references'):
                reference_urls = [ref.get('url', '') for ref in wikipedia_data['references'][:max_sources//2]]
                reference_urls = [url for url in reference_urls if url]  # Remove empty URLs
            
            # If we have specific URLs, scrape them
            if reference_urls:
                scraping_result = await self.fiber.agent.activate('PlaywrightScraperAgent', {
                    'mode': 'scrape_urls',
                    'urls': reference_urls,
                    'research_topic': topic
                })
            else:
                # Otherwise, discover and scrape relevant URLs
                scraping_result = await self.fiber.agent.activate('PlaywrightScraperAgent', {
                    'mode': 'discover_and_scrape',
                    'research_topic': topic,
                    'max_sources': max_sources
                })
            
            if scraping_result.get('success'):
                scraped_count = len(scraping_result.get('scraped_data', []))
                self.log_execution_step(
                    'web_scraping',
                    f"Successfully scraped {scraped_count} web sources",
                    scraping_result.get('metadata', {})
                )
                self.research_state['sources_collected'] += scraped_count
                return scraping_result
            else:
                raise Exception(f"Web scraping failed: {scraping_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.log_execution_step('web_scraping', f"Failed: {str(e)}", {'error': str(e)})
            return {
                'success': False,
                'error': str(e),
                'scraped_data': []
            }
    
    async def process_and_analyze_data(self, topic: str, wikipedia_data: Dict[str, Any], 
                                     web_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and analyze all collected research data."""
        
        try:
            # Combine all research data
            combined_data = {
                'wikipedia_data': wikipedia_data,
                'web_scraped_data': web_data
            }
            
            # Process with DataProcessorAgent
            processing_result = await self.fiber.agent.activate('DataProcessorAgent', {
                'mode': 'analyze',
                'data': combined_data,
                'research_topic': topic
            })
            
            if processing_result.get('success'):
                self.log_execution_step(
                    'data_processing',
                    "Successfully processed and analyzed research data",
                    {'data_quality': processing_result.get('data_quality', 'unknown')}
                )
                return processing_result
            else:
                raise Exception(f"Data processing failed: {processing_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.log_execution_step('data_processing', f"Failed: {str(e)}", {'error': str(e)})
            return {
                'success': False,
                'error': str(e),
                'processed_data': {}
            }
    
    async def facilitate_agent_conversations(self, topic: str, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Facilitate conversations between research agents using SmolAgents patterns."""
        
        try:
            # Step 1: Research Coordinator initiates conversations
            coordination_result = await self.fiber.agent.activate('ResearchCoordinatorAgent', {
                'mode': 'coordinate_research',
                'research_topic': topic,
                'research_data': processed_data.get('processed_data', {}),
                'project_id': f"kb_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            })
            
            conversations = coordination_result.get('agent_conversations', [])
            
            # Step 2: Domain Expert provides analysis
            expert_analysis = await self.fiber.agent.activate('DomainExpertAgent', {
                'mode': 'analyze_research',
                'research_topic': topic,
                'research_data': processed_data.get('processed_data', {})
            })
            
            # Step 3: Hypothesis Agent generates and tests hypotheses
            hypothesis_results = await self.fiber.agent.activate('HypothesisAgent', {
                'mode': 'generate_hypotheses',
                'research_topic': topic,
                'research_data': processed_data.get('processed_data', {}),
                'hypothesis_count': 5
            })
            
            # Step 4: Test generated hypotheses
            if hypothesis_results.get('success'):
                for hypothesis in hypothesis_results.get('generated_hypotheses', [])[:3]:  # Test top 3
                    test_result = await self.fiber.agent.activate('HypothesisAgent', {
                        'mode': 'test_hypothesis',
                        'hypothesis': hypothesis['hypothesis_statement'],
                        'research_data': processed_data.get('processed_data', {}),
                        'research_topic': topic
                    })
                    conversations.append({
                        'type': 'hypothesis_test',
                        'content': test_result
                    })
            
            # Step 5: Domain Expert responds to hypotheses
            if hypothesis_results.get('success'):
                for hypothesis in hypothesis_results.get('generated_hypotheses', [])[:2]:  # Respond to top 2
                    expert_response = await self.fiber.agent.activate('DomainExpertAgent', {
                        'mode': 'respond_to_agent',
                        'conversation': {
                            'agent_from': 'HypothesisAgent',
                            'message_type': 'hypothesis',
                            'message_content': hypothesis['hypothesis_statement'],
                            'conversation_id': f"conv_{len(conversations)}"
                        },
                        'context_data': processed_data.get('processed_data', {})
                    })
                    conversations.append({
                        'type': 'expert_response',
                        'content': expert_response
                    })
            
            self.research_state['conversations_count'] = len(conversations)
            self.log_execution_step(
                'agent_conversations',
                f"Facilitated {len(conversations)} agent conversations",
                {'conversation_types': [c.get('type', 'unknown') for c in conversations]}
            )
            
            return {
                'success': True,
                'conversations': conversations,
                'coordination_results': coordination_result,
                'expert_analysis': expert_analysis,
                'hypothesis_results': hypothesis_results,
                'conversation_summary': self.summarize_conversations(conversations)
            }
            
        except Exception as e:
            self.log_execution_step('agent_conversations', f"Failed: {str(e)}", {'error': str(e)})
            return {
                'success': False,
                'error': str(e),
                'conversations': []
            }
    
    async def synthesize_knowledge(self, topic: str, processed_data: Dict[str, Any], 
                                 conversation_results: Dict[str, Any], depth: str) -> Dict[str, Any]:
        """Synthesize all research into a comprehensive knowledge base."""
        
        try:
            # Prepare synthesis input
            synthesis_input = {
                'research_topic': topic,
                'wikipedia_data': processed_data.get('processed_data', {}).get('wikipedia_data', {}),
                'web_data': processed_data.get('processed_data', {}).get('web_scraped_data', {}),
                'agent_insights': conversation_results.get('expert_analysis', {}),
                'hypotheses': conversation_results.get('hypothesis_results', {}),
                'conversations': conversation_results.get('conversations', []),
                'synthesis_depth': depth
            }
            
            # Use synthesizeKnowledge function
            synthesis_result = await self.fiber.func.activate('synthesizeKnowledge', {
                'project_id': f"kb_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'synthesis_mode': depth if depth in ['comprehensive', 'summary', 'insights_only'] else 'comprehensive'
            })
            
            if synthesis_result.get('success'):
                # Enhance synthesis with agent conversation insights
                enhanced_knowledge_base = await self.enhance_knowledge_with_conversations(
                    synthesis_result.get('knowledge_base', {}),
                    conversation_results
                )
                
                self.log_execution_step(
                    'knowledge_synthesis',
                    "Successfully synthesized comprehensive knowledge base",
                    {
                        'knowledge_elements': len(enhanced_knowledge_base.get('knowledge_elements', [])),
                        'confidence_score': enhanced_knowledge_base.get('overall_confidence', 0.0)
                    }
                )
                
                return enhanced_knowledge_base
            else:
                raise Exception(f"Knowledge synthesis failed: {synthesis_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.log_execution_step('knowledge_synthesis', f"Failed: {str(e)}", {'error': str(e)})
            
            # Create fallback knowledge base
            return await self.create_fallback_knowledge_base(topic, processed_data, conversation_results)
    
    async def enhance_knowledge_with_conversations(self, knowledge_base: Dict[str, Any], 
                                                 conversation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance knowledge base with insights from agent conversations."""
        
        enhanced_kb = knowledge_base.copy()
        
        # Add agent conversation insights
        conversation_insights = []
        for conversation in conversation_results.get('conversations', []):
            if conversation.get('type') == 'expert_response':
                insight = conversation.get('content', {}).get('response', '')
                if insight:
                    conversation_insights.append(insight)
        
        enhanced_kb['agent_insights'] = conversation_insights
        
        # Add hypothesis analysis
        hypothesis_results = conversation_results.get('hypothesis_results', {})
        if hypothesis_results.get('success'):
            enhanced_kb['research_hypotheses'] = hypothesis_results.get('generated_hypotheses', [])
        
        # Add expert analysis summary
        expert_analysis = conversation_results.get('expert_analysis', {})
        if expert_analysis.get('success'):
            enhanced_kb['expert_assessment'] = expert_analysis.get('expert_analysis', {})
        
        # Calculate enhanced confidence score
        enhanced_kb['overall_confidence'] = self.calculate_enhanced_confidence(enhanced_kb)
        
        return enhanced_kb
    
    async def create_fallback_knowledge_base(self, topic: str, processed_data: Dict[str, Any], 
                                           conversation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create a fallback knowledge base when synthesis fails."""
        
        # Extract key information from available data
        wikipedia_data = processed_data.get('processed_data', {}).get('wikipedia_data', {})
        web_data = processed_data.get('processed_data', {}).get('web_scraped_data', {})
        
        knowledge_elements = []
        
        # Extract from Wikipedia
        if wikipedia_data.get('main_article'):
            knowledge_elements.append({
                'type': 'primary_definition',
                'source': 'wikipedia',
                'content': wikipedia_data['main_article'].get('summary', ''),
                'confidence': 0.8
            })
        
        # Extract from web sources
        for source in web_data.get('scraped_data', [])[:5]:  # Top 5 sources
            if source.get('relevance_score', 0) > 0.6:
                knowledge_elements.append({
                    'type': 'supporting_evidence',
                    'source': 'web_scraping',
                    'content': source.get('title', '') + ': ' + source.get('content', '')[:200] + '...',
                    'confidence': source.get('relevance_score', 0.5)
                })
        
        return {
            'research_topic': topic,
            'knowledge_elements': knowledge_elements,
            'creation_method': 'fallback_synthesis',
            'overall_confidence': 0.6,
            'limitations': [
                'Automated synthesis failed - manual fallback used',
                'Limited depth of analysis',
                'Reduced confidence in synthesized knowledge'
            ]
        }
    
    # Utility Methods
    
    def log_execution_step(self, step_name: str, message: str, metadata: Dict[str, Any] = None):
        """Log pipeline execution steps."""
        
        log_entry = {
            'step': step_name,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        self.execution_log.append(log_entry)
        print(f"[KnowledgeBuilderPipeline] {step_name}: {message}")
    
    def calculate_execution_time(self) -> str:
        """Calculate total pipeline execution time."""
        
        start_time = self.research_state.get('start_time')
        end_time = self.research_state.get('end_time')
        
        if start_time and end_time:
            start_dt = datetime.fromisoformat(start_time)
            end_dt = datetime.fromisoformat(end_time)
            duration = end_dt - start_dt
            return f"{duration.total_seconds():.2f} seconds"
        
        return "Unknown"
    
    def calculate_research_quality_score(self, knowledge_base: Dict[str, Any]) -> float:
        """Calculate overall research quality score."""
        
        factors = []
        
        # Knowledge base completeness
        if knowledge_base.get('knowledge_elements'):
            factors.append(min(len(knowledge_base['knowledge_elements']) / 10, 1.0))
        
        # Agent conversation quality
        conversation_count = self.research_state.get('conversations_count', 0)
        if conversation_count > 0:
            factors.append(min(conversation_count / 5, 1.0))
        
        # Source diversity
        sources_collected = self.research_state.get('sources_collected', 0)
        if sources_collected > 0:
            factors.append(min(sources_collected / 15, 1.0))
        
        # Overall confidence
        if knowledge_base.get('overall_confidence'):
            factors.append(knowledge_base['overall_confidence'])
        
        return sum(factors) / len(factors) if factors else 0.5
    
    def summarize_conversations(self, conversations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize agent conversations."""
        
        conversation_types = {}
        for conv in conversations:
            conv_type = conv.get('type', 'unknown')
            conversation_types[conv_type] = conversation_types.get(conv_type, 0) + 1
        
        return {
            'total_conversations': len(conversations),
            'conversation_types': conversation_types,
            'primary_themes': ['hypothesis_testing', 'expert_analysis', 'evidence_evaluation']
        }
    
    def calculate_enhanced_confidence(self, knowledge_base: Dict[str, Any]) -> float:
        """Calculate enhanced confidence score including agent insights."""
        
        base_confidence = knowledge_base.get('overall_confidence', 0.5)
        
        # Boost confidence based on agent insights
        agent_insights = knowledge_base.get('agent_insights', [])
        if len(agent_insights) > 3:
            base_confidence += 0.1
        
        # Boost confidence based on hypothesis testing
        hypotheses = knowledge_base.get('research_hypotheses', [])
        if len(hypotheses) > 2:
            base_confidence += 0.1
        
        # Boost confidence based on expert assessment
        if knowledge_base.get('expert_assessment'):
            base_confidence += 0.05
        
        return min(base_confidence, 1.0)