"""
Research Coordinator Agent using SmolAgents

Coordinates research process and manages agent conversations using 
Hugging Face SmolAgents for lightweight, collaborative AI.
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime


class ResearchCoordinatorAgent:
    """
    Research coordinator that manages the research process and facilitates
    agent-to-agent conversations using SmolAgents patterns.
    """
    
    def __init__(self):
        self.conversation_history = []
        self.research_state = {}
        self.available_agents = [
            'PlaywrightScraperAgent',
            'DataProcessorAgent', 
            'DomainExpertAgent',
            'HypothesisAgent'
        ]
    
    async def activate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main activation method for research coordination.
        
        Args:
            input_data: Dictionary containing coordination parameters
            
        Returns:
            Dictionary with coordination results and agent conversations
        """
        
        mode = input_data.get('mode', 'coordinate_research')
        
        if mode == 'coordinate_research':
            return await self.coordinate_research(input_data)
        elif mode == 'facilitate_conversation':
            return await self.facilitate_conversation(input_data)
        elif mode == 'synthesize_findings':
            return await self.synthesize_findings(input_data)
        else:
            return {
                'success': False,
                'error': f'Unknown coordination mode: {mode}',
                'conversations': []
            }
    
    async def coordinate_research(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Coordinate the overall research process with agent collaboration."""
        
        research_topic = input_data.get('research_topic', '')
        project_id = input_data.get('project_id', '')
        research_data = input_data.get('research_data', {})
        
        print(f"[ResearchCoordinator] Coordinating research on: {research_topic}")
        
        try:
            # Initialize research state
            self.research_state = {
                'project_id': project_id,
                'topic': research_topic,
                'phase': 'analysis',
                'findings': research_data,
                'agent_insights': {},
                'conversations': []
            }
            
            # Step 1: Initiate agent conversations about the research data
            conversation_results = await self.initiate_research_conversations(research_data, research_topic)
            
            # Step 2: Coordinate hypothesis generation and testing
            hypothesis_results = await self.coordinate_hypothesis_testing(research_data, research_topic)
            
            # Step 3: Facilitate expert domain analysis
            expert_analysis = await self.coordinate_expert_analysis(research_data, research_topic)
            
            # Step 4: Synthesize all agent insights
            synthesis = await self.synthesize_agent_insights()
            
            return {
                'success': True,
                'coordination_results': {
                    'conversations': conversation_results,
                    'hypothesis_testing': hypothesis_results,
                    'expert_analysis': expert_analysis,
                    'synthesis': synthesis
                },
                'research_state': self.research_state,
                'agent_conversations': self.conversation_history
            }
            
        except Exception as e:
            print(f"[ResearchCoordinator] Error during research coordination: {str(e)}")
            return {
                'success': False,
                'error': f'Research coordination failed: {str(e)}',
                'conversations': self.conversation_history
            }
    
    async def initiate_research_conversations(self, research_data: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Initiate conversations between agents about research findings."""
        
        print("[ResearchCoordinator] Initiating agent conversations...")
        
        # Conversation 1: Domain Expert questions Data Processor about findings
        expert_questions = await self.generate_expert_questions(research_data, topic)
        
        for question in expert_questions:
            conversation = await self.create_agent_conversation(
                agent_from='DomainExpertAgent',
                agent_to='DataProcessorAgent',
                message_type='question',
                content=question,
                context_data=research_data
            )
            self.conversation_history.append(conversation)
        
        # Conversation 2: Hypothesis Agent proposes theories to Domain Expert
        hypotheses = await self.generate_research_hypotheses(research_data, topic)
        
        for hypothesis in hypotheses:
            conversation = await self.create_agent_conversation(
                agent_from='HypothesisAgent',
                agent_to='DomainExpertAgent',
                message_type='hypothesis',
                content=hypothesis,
                context_data=research_data
            )
            self.conversation_history.append(conversation)
        
        # Conversation 3: Data Processor shares insights with all agents
        key_insights = await self.extract_key_insights(research_data)
        
        for insight in key_insights:
            # Broadcast insight to all agents
            for agent in self.available_agents:
                if agent != 'DataProcessorAgent':
                    conversation = await self.create_agent_conversation(
                        agent_from='DataProcessorAgent',
                        agent_to=agent,
                        message_type='insight',
                        content=insight,
                        context_data=research_data
                    )
                    self.conversation_history.append(conversation)
        
        return {
            'conversations_initiated': len(self.conversation_history),
            'expert_questions': len(expert_questions),
            'hypotheses_generated': len(hypotheses),
            'insights_shared': len(key_insights)
        }
    
    async def coordinate_hypothesis_testing(self, research_data: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Coordinate hypothesis generation and testing between agents."""
        
        print("[ResearchCoordinator] Coordinating hypothesis testing...")
        
        # Generate testable hypotheses based on research data
        hypotheses = await self.generate_testable_hypotheses(research_data, topic)
        
        tested_hypotheses = []
        
        for hypothesis in hypotheses:
            # Test hypothesis with available evidence
            test_results = await self.test_hypothesis_with_evidence(hypothesis, research_data)
            
            # Create conversation about hypothesis test results
            conversation = await self.create_agent_conversation(
                agent_from='HypothesisAgent',
                agent_to='DomainExpertAgent',
                message_type='hypothesis_test',
                content=f"Hypothesis: {hypothesis}\\nTest Results: {test_results['conclusion']}\\nConfidence: {test_results['confidence']}",
                context_data=test_results
            )
            self.conversation_history.append(conversation)
            
            tested_hypotheses.append({
                'hypothesis': hypothesis,
                'test_results': test_results,
                'conversation_id': conversation['conversation_id']
            })
        
        return {
            'hypotheses_tested': len(tested_hypotheses),
            'results': tested_hypotheses
        }
    
    async def coordinate_expert_analysis(self, research_data: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Coordinate domain expert analysis and critique."""
        
        print("[ResearchCoordinator] Coordinating expert analysis...")
        
        # Expert provides critique of research methodology
        methodology_critique = await self.generate_methodology_critique(research_data, topic)
        
        # Expert identifies potential biases or limitations
        bias_analysis = await self.analyze_research_biases(research_data, topic)
        
        # Expert suggests additional research directions
        future_directions = await self.suggest_future_research(research_data, topic)
        
        # Create conversations for each expert analysis
        analyses = [
            ('methodology_critique', methodology_critique),
            ('bias_analysis', bias_analysis),
            ('future_directions', future_directions)
        ]
        
        for analysis_type, analysis_content in analyses:
            conversation = await self.create_agent_conversation(
                agent_from='DomainExpertAgent',
                agent_to='ResearchCoordinatorAgent',
                message_type='analysis',
                content=f"{analysis_type}: {analysis_content}",
                context_data=research_data
            )
            self.conversation_history.append(conversation)
        
        return {
            'methodology_critique': methodology_critique,
            'bias_analysis': bias_analysis,
            'future_directions': future_directions,
            'expert_conversations': len(analyses)
        }
    
    async def synthesize_agent_insights(self) -> Dict[str, Any]:
        """Synthesize insights from all agent conversations."""
        
        print("[ResearchCoordinator] Synthesizing agent insights...")
        
        # Collect insights by message type
        insights_by_type = {
            'questions': [],
            'hypotheses': [],
            'insights': [],
            'analyses': [],
            'critiques': []
        }
        
        for conversation in self.conversation_history:
            msg_type = conversation['message_type']
            content = conversation['message_content']
            
            if msg_type == 'question':
                insights_by_type['questions'].append(content)
            elif msg_type in ['hypothesis', 'hypothesis_test']:
                insights_by_type['hypotheses'].append(content)
            elif msg_type == 'insight':
                insights_by_type['insights'].append(content)
            elif msg_type == 'analysis':
                insights_by_type['analyses'].append(content)
        
        # Generate synthesis based on conversation patterns
        synthesis = {
            'key_themes': await self.identify_key_themes(insights_by_type),
            'consensus_points': await self.find_consensus_points(insights_by_type),
            'disagreements': await self.identify_disagreements(insights_by_type),
            'research_gaps': await self.identify_research_gaps(insights_by_type),
            'confidence_levels': await self.assess_confidence_levels(insights_by_type)
        }
        
        return synthesis
    
    async def create_agent_conversation(self, agent_from: str, agent_to: str, message_type: str, 
                                      content: str, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a structured agent-to-agent conversation entry."""
        
        conversation_id = f"conv_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.conversation_history)}"
        
        conversation = {
            'conversation_id': conversation_id,
            'project_id': self.research_state.get('project_id', ''),
            'agent_from': agent_from,
            'agent_to': agent_to,
            'message_type': message_type,
            'message_content': content,
            'context_data': json.dumps(context_data) if context_data else '',
            'response_required': message_type in ['question', 'hypothesis'],
            'timestamp': datetime.now().isoformat()
        }
        
        return conversation
    
    # Helper methods for generating agent content
    
    async def generate_expert_questions(self, research_data: Dict[str, Any], topic: str) -> List[str]:
        """Generate expert questions about the research data."""
        
        # SmolAgent-style: Simple but focused questions
        questions = [
            f"What are the key limitations in the data collection methodology for {topic}?",
            f"How reliable are the sources used in this {topic} research?",
            f"What potential confounding factors should we consider in this {topic} analysis?",
            f"Are there any obvious biases in the {topic} data sources?",
            f"What additional data would strengthen the {topic} research conclusions?"
        ]
        
        # Filter questions based on available data
        relevant_questions = []
        if research_data.get('wikipedia_data'):
            relevant_questions.append(f"How comprehensive is the Wikipedia coverage of {topic}?")
        if research_data.get('web_scraped_data'):
            relevant_questions.append(f"What is the quality and credibility of the web sources for {topic}?")
        
        return questions[:3] + relevant_questions[:2]  # Limit to 5 questions
    
    async def generate_research_hypotheses(self, research_data: Dict[str, Any], topic: str) -> List[str]:
        """Generate research hypotheses based on the data."""
        
        hypotheses = [
            f"The primary factors influencing {topic} are well-documented in academic literature",
            f"There are significant knowledge gaps in current {topic} research",
            f"The available {topic} data suggests multiple competing theories",
            f"Recent developments have changed the understanding of {topic}",
            f"Cross-disciplinary approaches could enhance {topic} research"
        ]
        
        return hypotheses[:3]  # Limit to 3 hypotheses
    
    async def extract_key_insights(self, research_data: Dict[str, Any]) -> List[str]:
        """Extract key insights from research data to share with agents."""
        
        insights = []
        
        # Extract insights from Wikipedia data
        if research_data.get('wikipedia_data'):
            wiki_data = research_data['wikipedia_data']
            if wiki_data.get('main_article'):
                insights.append(f"Wikipedia analysis shows comprehensive coverage with {len(wiki_data.get('related_articles', []))} related articles")
            if wiki_data.get('references'):
                insights.append(f"Found {len(wiki_data['references'])} external references for further investigation")
        
        # Extract insights from web scraped data
        if research_data.get('web_scraped_data'):
            web_data = research_data['web_scraped_data']
            if web_data.get('scraped_data'):
                total_sources = len(web_data['scraped_data'])
                insights.append(f"Web scraping yielded {total_sources} additional sources")
                
                # Analyze content quality
                high_quality = sum(1 for source in web_data['scraped_data'] 
                                 if source.get('relevance_score', 0) > 0.5)
                insights.append(f"{high_quality}/{total_sources} web sources show high relevance scores")
        
        return insights[:5]  # Limit to 5 key insights
    
    async def generate_testable_hypotheses(self, research_data: Dict[str, Any], topic: str) -> List[str]:
        """Generate testable hypotheses from research data."""
        
        return [
            f"The current research on {topic} is comprehensive and up-to-date",
            f"There are conflicting viewpoints in the {topic} literature",
            f"The {topic} research shows clear practical applications"
        ]
    
    async def test_hypothesis_with_evidence(self, hypothesis: str, research_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test a hypothesis against available evidence."""
        
        # Simplified hypothesis testing - could be enhanced with ML
        evidence_count = 0
        total_sources = 0
        
        # Count evidence from different sources
        if research_data.get('wikipedia_data'):
            total_sources += 1
            if 'comprehensive' in hypothesis.lower():
                evidence_count += 1
        
        if research_data.get('web_scraped_data'):
            web_sources = len(research_data['web_scraped_data'].get('scraped_data', []))
            total_sources += web_sources
            if web_sources > 3:
                evidence_count += 1
        
        # Calculate confidence based on evidence
        confidence = evidence_count / max(total_sources, 1) if total_sources > 0 else 0.0
        
        if confidence > 0.7:
            conclusion = "Strongly supported by evidence"
        elif confidence > 0.4:
            conclusion = "Partially supported by evidence"
        else:
            conclusion = "Limited evidence support"
        
        return {
            'hypothesis': hypothesis,
            'evidence_count': evidence_count,
            'total_sources': total_sources,
            'confidence': confidence,
            'conclusion': conclusion
        }
    
    async def generate_methodology_critique(self, research_data: Dict[str, Any], topic: str) -> str:
        """Generate critique of research methodology."""
        return f"The {topic} research methodology combines Wikipedia API data with web scraping, providing broad coverage but may benefit from academic database integration."
    
    async def analyze_research_biases(self, research_data: Dict[str, Any], topic: str) -> str:
        """Analyze potential research biases."""
        return f"Potential bias: Wikipedia and web sources may overrepresent popular/recent viewpoints on {topic}. Consider academic and historical sources."
    
    async def suggest_future_research(self, research_data: Dict[str, Any], topic: str) -> str:
        """Suggest future research directions."""
        return f"Future research on {topic} should incorporate peer-reviewed academic sources and consider longitudinal analysis."
    
    async def identify_key_themes(self, insights_by_type: Dict[str, List[str]]) -> List[str]:
        """Identify key themes from agent conversations."""
        return ["Data quality assessment", "Source credibility evaluation", "Methodology improvement"]
    
    async def find_consensus_points(self, insights_by_type: Dict[str, List[str]]) -> List[str]:
        """Find consensus points among agents."""
        return ["Need for diverse source integration", "Importance of source credibility"]
    
    async def identify_disagreements(self, insights_by_type: Dict[str, List[str]]) -> List[str]:
        """Identify disagreements or conflicting viewpoints."""
        return ["Debate over comprehensiveness vs. depth of research"]
    
    async def identify_research_gaps(self, insights_by_type: Dict[str, List[str]]) -> List[str]:
        """Identify research gaps from conversations."""
        return ["Limited academic database integration", "Need for expert human validation"]
    
    async def assess_confidence_levels(self, insights_by_type: Dict[str, List[str]]) -> Dict[str, str]:
        """Assess confidence levels in different findings."""
        return {
            "data_collection": "High confidence",
            "source_quality": "Medium confidence", 
            "comprehensive_coverage": "Medium confidence"
        }