"""
Domain Expert Agent using SmolAgents with Gemini API

Provides specialized domain expertise and critical analysis using 
Hugging Face SmolAgents framework with Google Gemini API for 
intelligent conversations about research topics.
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from datetime import datetime


class DomainExpertAgent:
    """
    Domain expert agent that provides specialized knowledge and critique
    using SmolAgents patterns with Gemini API for intelligent analysis.
    """
    
    def __init__(self):
        self.expert_domains = [
            'general_research_methodology',
            'data_analysis',
            'information_science',
            'academic_research',
            'source_evaluation'
        ]
        self.conversation_memory = []
        self.expertise_level = "advanced"
        
        # Initialize Gemini API (API key should be set via environment variable)
        # genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = None  # Will be initialized when API key is available
    
    async def activate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main activation method for domain expert analysis.
        
        Args:
            input_data: Dictionary containing expert analysis parameters
            
        Returns:
            Dictionary with expert analysis and recommendations
        """
        
        mode = input_data.get('mode', 'analyze_research')
        
        if mode == 'analyze_research':
            return await self.analyze_research_data(input_data)
        elif mode == 'critique_methodology':
            return await self.critique_methodology(input_data)
        elif mode == 'evaluate_sources':
            return await self.evaluate_sources(input_data)
        elif mode == 'respond_to_agent':
            return await self.respond_to_agent_conversation(input_data)
        elif mode == 'generate_insights':
            return await self.generate_expert_insights(input_data)
        else:
            return {
                'success': False,
                'error': f'Unknown expert mode: {mode}',
                'analysis': {}
            }
    
    async def analyze_research_data(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provide comprehensive expert analysis of research data."""
        
        research_topic = input_data.get('research_topic', '')
        research_data = input_data.get('research_data', {})
        
        print(f"[DomainExpertAgent] Analyzing research data for: {research_topic}")
        
        try:
            # Use SmolAgent pattern: focused, specific analysis
            analysis_results = {}
            
            # Analyze Wikipedia data quality
            if research_data.get('wikipedia_data'):
                wiki_analysis = await self.analyze_wikipedia_quality(
                    research_data['wikipedia_data'], research_topic
                )
                analysis_results['wikipedia_analysis'] = wiki_analysis
            
            # Analyze web scraped data quality
            if research_data.get('web_scraped_data'):
                web_analysis = await self.analyze_web_sources_quality(
                    research_data['web_scraped_data'], research_topic
                )
                analysis_results['web_sources_analysis'] = web_analysis
            
            # Generate overall research assessment with Gemini
            overall_assessment = await self.generate_gemini_assessment(
                research_topic, research_data
            )
            analysis_results['overall_assessment'] = overall_assessment
            
            # Provide expert recommendations
            recommendations = await self.generate_expert_recommendations(
                research_topic, research_data, analysis_results
            )
            analysis_results['expert_recommendations'] = recommendations
            
            return {
                'success': True,
                'expert_analysis': analysis_results,
                'confidence_score': self.calculate_analysis_confidence(analysis_results),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[DomainExpertAgent] Error during research analysis: {str(e)}")
            return {
                'success': False,
                'error': f'Expert analysis failed: {str(e)}',
                'analysis': {}
            }
    
    async def critique_methodology(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provide expert critique of research methodology."""
        
        research_topic = input_data.get('research_topic', '')
        methodology = input_data.get('methodology', {})
        
        print(f"[DomainExpertAgent] Critiquing methodology for: {research_topic}")
        
        # SmolAgent approach: structured, specific critique
        critique = {
            'strengths': [],
            'weaknesses': [],
            'improvements': [],
            'biases': [],
            'limitations': []
        }
        
        # Analyze data collection methodology
        data_sources = methodology.get('data_sources', [])
        if 'wikipedia' in str(data_sources).lower():
            critique['strengths'].append("Wikipedia provides comprehensive, crowd-sourced information")
            critique['weaknesses'].append("Wikipedia may lack peer-review rigor of academic sources")
            critique['biases'].append("Potential bias toward popular/recent topics in Wikipedia")
        
        if 'web_scraping' in str(data_sources).lower():
            critique['strengths'].append("Web scraping captures diverse, current perspectives")
            critique['weaknesses'].append("Web sources vary greatly in credibility and accuracy")
            critique['improvements'].append("Implement source credibility scoring system")
        
        # Use Gemini for deeper methodology analysis
        gemini_critique = await self.generate_gemini_methodology_critique(
            research_topic, methodology
        )
        critique['ai_analysis'] = gemini_critique
        
        return {
            'success': True,
            'methodology_critique': critique,
            'research_topic': research_topic
        }
    
    async def evaluate_sources(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate the quality and credibility of research sources."""
        
        sources = input_data.get('sources', [])
        research_topic = input_data.get('research_topic', '')
        
        print(f"[DomainExpertAgent] Evaluating {len(sources)} sources for: {research_topic}")
        
        source_evaluations = []
        
        for source in sources:
            evaluation = await self.evaluate_single_source(source, research_topic)
            source_evaluations.append(evaluation)
        
        # Generate overall source quality assessment
        overall_quality = await self.assess_overall_source_quality(source_evaluations)
        
        return {
            'success': True,
            'source_evaluations': source_evaluations,
            'overall_quality_assessment': overall_quality,
            'sources_evaluated': len(sources)
        }
    
    async def respond_to_agent_conversation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Respond to conversations from other agents using SmolAgent patterns."""
        
        conversation = input_data.get('conversation', {})
        agent_from = conversation.get('agent_from', '')
        message_type = conversation.get('message_type', '')
        message_content = conversation.get('message_content', '')
        context_data = input_data.get('context_data', {})
        
        print(f"[DomainExpertAgent] Responding to {message_type} from {agent_from}")
        
        # SmolAgent response patterns based on message type
        if message_type == 'question':
            response = await self.answer_research_question(message_content, context_data)
        elif message_type == 'hypothesis':
            response = await self.evaluate_hypothesis(message_content, context_data)
        elif message_type == 'insight':
            response = await self.critique_insight(message_content, context_data)
        else:
            response = await self.provide_general_expert_response(message_content, context_data)
        
        return {
            'success': True,
            'response': response,
            'conversation_id': conversation.get('conversation_id', ''),
            'response_type': f"{message_type}_response"
        }
    
    async def generate_expert_insights(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate expert insights using Gemini API for deep analysis."""
        
        research_topic = input_data.get('research_topic', '')
        research_data = input_data.get('research_data', {})
        focus_area = input_data.get('focus_area', 'general')
        
        print(f"[DomainExpertAgent] Generating expert insights on: {research_topic}")
        
        # Generate insights using Gemini
        gemini_insights = await self.generate_gemini_insights(
            research_topic, research_data, focus_area
        )
        
        # Structure insights using SmolAgent patterns
        structured_insights = {
            'key_findings': gemini_insights.get('key_findings', []),
            'critical_gaps': gemini_insights.get('critical_gaps', []),
            'research_opportunities': gemini_insights.get('research_opportunities', []),
            'methodological_concerns': gemini_insights.get('methodological_concerns', []),
            'expert_recommendations': gemini_insights.get('expert_recommendations', [])
        }
        
        return {
            'success': True,
            'expert_insights': structured_insights,
            'focus_area': focus_area,
            'insight_confidence': gemini_insights.get('confidence_score', 0.7)
        }
    
    # Gemini API Integration Methods
    
    async def generate_gemini_assessment(self, research_topic: str, research_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use Gemini API for comprehensive research assessment."""
        
        try:
            # Prepare prompt for Gemini
            prompt = f"""
            As a domain expert, analyze this research on "{research_topic}".
            
            Research Data Summary:
            - Wikipedia data: {len(research_data.get('wikipedia_data', {}).get('related_articles', []))} articles
            - Web sources: {len(research_data.get('web_scraped_data', {}).get('scraped_data', []))} sources
            
            Provide analysis in JSON format:
            {{
                "comprehensiveness": "assessment of topic coverage",
                "source_diversity": "evaluation of source variety",
                "credibility_assessment": "overall credibility evaluation",
                "research_depth": "assessment of research depth",
                "key_strengths": ["strength1", "strength2"],
                "main_limitations": ["limitation1", "limitation2"],
                "confidence_score": 0.8
            }}
            """
            
            # Note: In actual implementation, you would call Gemini API here
            # For now, return a structured mock response
            mock_assessment = {
                "comprehensiveness": f"Research on {research_topic} shows good breadth with multiple source types",
                "source_diversity": "Combines encyclopedic and web sources for balanced perspective",
                "credibility_assessment": "Mixed credibility - Wikipedia reliable, web sources need validation",
                "research_depth": "Surface-level analysis suitable for overview, needs deeper academic sources",
                "key_strengths": [
                    "Comprehensive Wikipedia coverage",
                    "Current web source information",
                    "Multiple perspective integration"
                ],
                "main_limitations": [
                    "Limited academic peer-reviewed sources",
                    "Potential web source credibility issues",
                    "May miss historical/archival perspectives"
                ],
                "confidence_score": 0.75
            }
            
            return mock_assessment
            
        except Exception as e:
            print(f"[DomainExpertAgent] Gemini assessment error: {str(e)}")
            return {
                "error": f"Gemini analysis failed: {str(e)}",
                "confidence_score": 0.0
            }
    
    async def generate_gemini_methodology_critique(self, research_topic: str, methodology: Dict[str, Any]) -> Dict[str, Any]:
        """Use Gemini for detailed methodology critique."""
        
        # Mock Gemini response - replace with actual API call
        return {
            "methodology_assessment": f"The {research_topic} research methodology shows promise but needs refinement",
            "recommendations": [
                "Integrate academic database searches",
                "Implement source credibility scoring",
                "Add expert validation step"
            ],
            "rigor_score": 0.7
        }
    
    async def generate_gemini_insights(self, research_topic: str, research_data: Dict[str, Any], focus_area: str) -> Dict[str, Any]:
        """Generate deep insights using Gemini API."""
        
        # Mock Gemini insights - replace with actual API call
        return {
            "key_findings": [
                f"Research on {research_topic} reveals significant knowledge consolidation",
                "Multiple perspectives identified but need expert validation",
                "Current research shows both depth and breadth opportunities"
            ],
            "critical_gaps": [
                "Limited longitudinal analysis",
                "Insufficient expert validation",
                "Need for systematic literature review"
            ],
            "research_opportunities": [
                "Cross-disciplinary analysis potential",
                "Comparative study opportunities",
                "Empirical validation needs"
            ],
            "methodological_concerns": [
                "Source selection bias",
                "Limited quality control",
                "Need for systematic evaluation"
            ],
            "expert_recommendations": [
                "Implement peer review process",
                "Add expert interviews",
                "Conduct systematic source evaluation"
            ],
            "confidence_score": 0.8
        }
    
    # Analysis Helper Methods
    
    async def analyze_wikipedia_quality(self, wikipedia_data: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Analyze quality of Wikipedia research data."""
        
        main_article = wikipedia_data.get('main_article', {})
        related_articles = wikipedia_data.get('related_articles', [])
        references = wikipedia_data.get('references', [])
        
        quality_assessment = {
            'coverage_score': 0.8 if main_article else 0.0,
            'breadth_score': min(len(related_articles) / 10, 1.0),  # Normalize to 0-1
            'reference_score': min(len(references) / 20, 1.0),  # Normalize to 0-1
            'overall_quality': 'good' if main_article and len(related_articles) > 3 else 'fair',
            'strengths': [
                "Comprehensive main article coverage",
                f"Good breadth with {len(related_articles)} related articles",
                f"External validation with {len(references)} references"
            ],
            'concerns': [
                "Wikipedia bias toward popular topics",
                "Potential accuracy limitations",
                "May lack latest research developments"
            ]
        }
        
        return quality_assessment
    
    async def analyze_web_sources_quality(self, web_data: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Analyze quality of web scraped sources."""
        
        scraped_data = web_data.get('scraped_data', [])
        
        if not scraped_data:
            return {
                'quality_score': 0.0,
                'overall_assessment': 'No web sources available'
            }
        
        # Calculate quality metrics
        total_sources = len(scraped_data)
        high_relevance_sources = sum(1 for source in scraped_data 
                                   if source.get('relevance_score', 0) > 0.6)
        substantial_content = sum(1 for source in scraped_data 
                                if source.get('word_count', 0) > 500)
        
        quality_assessment = {
            'total_sources': total_sources,
            'high_relevance_ratio': high_relevance_sources / total_sources,
            'substantial_content_ratio': substantial_content / total_sources,
            'quality_score': (high_relevance_sources + substantial_content) / (total_sources * 2),
            'assessment': 'good' if high_relevance_sources / total_sources > 0.6 else 'fair',
            'recommendations': [
                "Verify source credibility manually",
                "Cross-reference with academic sources",
                "Check publication dates for currency"
            ]
        }
        
        return quality_assessment
    
    async def evaluate_single_source(self, source: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Evaluate a single research source."""
        
        url = source.get('url', '')
        title = source.get('title', '')
        content_length = len(source.get('content', ''))
        relevance_score = source.get('relevance_score', 0.0)
        
        # Simple credibility assessment based on URL patterns
        credibility_indicators = {
            'academic': any(domain in url for domain in ['.edu', 'scholar.', 'academia.', 'researchgate.']),
            'government': any(domain in url for domain in ['.gov', '.org']),
            'news_media': any(domain in url for domain in ['bbc.', 'reuters.', 'ap.', 'npr.']),
            'commercial': '.com' in url
        }
        
        credibility_score = 0.0
        if credibility_indicators['academic']:
            credibility_score = 0.9
        elif credibility_indicators['government']:
            credibility_score = 0.8
        elif credibility_indicators['news_media']:
            credibility_score = 0.7
        elif credibility_indicators['commercial']:
            credibility_score = 0.5
        else:
            credibility_score = 0.3
        
        return {
            'url': url,
            'title': title,
            'credibility_score': credibility_score,
            'relevance_score': relevance_score,
            'content_quality': 'high' if content_length > 1000 else 'medium' if content_length > 300 else 'low',
            'source_type': next(k for k, v in credibility_indicators.items() if v),
            'overall_rating': (credibility_score + relevance_score) / 2
        }
    
    async def assess_overall_source_quality(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess overall quality of all sources."""
        
        if not evaluations:
            return {'assessment': 'No sources to evaluate'}
        
        avg_credibility = sum(e['credibility_score'] for e in evaluations) / len(evaluations)
        avg_relevance = sum(e['relevance_score'] for e in evaluations) / len(evaluations)
        high_quality_sources = sum(1 for e in evaluations if e['overall_rating'] > 0.7)
        
        return {
            'average_credibility': avg_credibility,
            'average_relevance': avg_relevance,
            'high_quality_percentage': high_quality_sources / len(evaluations),
            'total_sources': len(evaluations),
            'overall_assessment': 'excellent' if avg_credibility > 0.8 else 'good' if avg_credibility > 0.6 else 'fair'
        }
    
    # Conversation Response Methods
    
    async def answer_research_question(self, question: str, context: Dict[str, Any]) -> str:
        """Answer research questions from other agents."""
        
        # SmolAgent pattern: direct, focused answers
        if 'methodology' in question.lower():
            return "The current methodology combines Wikipedia and web scraping. Consider adding academic databases for increased rigor."
        elif 'limitation' in question.lower():
            return "Key limitations include source credibility variation and potential bias toward popular topics."
        elif 'bias' in question.lower():
            return "Potential biases include Wikipedia's crowd-sourced nature and web source commercial interests."
        else:
            return f"Based on the research data, this question requires consideration of source diversity and methodological rigor."
    
    async def evaluate_hypothesis(self, hypothesis: str, context: Dict[str, Any]) -> str:
        """Evaluate hypotheses proposed by other agents."""
        
        if 'comprehensive' in hypothesis.lower():
            return "Hypothesis partially supported - research shows breadth but may lack depth in specialized areas."
        elif 'gap' in hypothesis.lower():
            return "Hypothesis well-supported - clear gaps exist in academic validation and longitudinal analysis."
        else:
            return "Hypothesis requires additional evidence from peer-reviewed sources for validation."
    
    async def critique_insight(self, insight: str, context: Dict[str, Any]) -> str:
        """Provide critique of insights from other agents."""
        
        return f"Insight shows merit but would benefit from expert validation and cross-referencing with academic literature."
    
    async def provide_general_expert_response(self, message: str, context: Dict[str, Any]) -> str:
        """Provide general expert response to agent communications."""
        
        return "Expert analysis suggests this requires further investigation with academic sources and peer review."
    
    # Utility Methods
    
    def calculate_analysis_confidence(self, analysis_results: Dict[str, Any]) -> float:
        """Calculate confidence score for analysis results."""
        
        confidence_factors = []
        
        if 'wikipedia_analysis' in analysis_results:
            wiki_score = analysis_results['wikipedia_analysis'].get('coverage_score', 0.0)
            confidence_factors.append(wiki_score)
        
        if 'web_sources_analysis' in analysis_results:
            web_score = analysis_results['web_sources_analysis'].get('quality_score', 0.0)
            confidence_factors.append(web_score)
        
        if 'overall_assessment' in analysis_results:
            overall_score = analysis_results['overall_assessment'].get('confidence_score', 0.0)
            confidence_factors.append(overall_score)
        
        return sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5
    
    async def generate_expert_recommendations(self, topic: str, research_data: Dict[str, Any], analysis: Dict[str, Any]) -> List[str]:
        """Generate expert recommendations based on analysis."""
        
        recommendations = [
            "Integrate academic database searches (PubMed, JSTOR, Google Scholar)",
            "Implement systematic source credibility evaluation",
            "Add expert interviews or surveys for validation",
            "Consider longitudinal analysis for trend identification",
            "Develop peer review process for research quality assurance"
        ]
        
        # Customize recommendations based on analysis
        if analysis.get('wikipedia_analysis', {}).get('coverage_score', 0) < 0.7:
            recommendations.append("Expand Wikipedia research with more related articles")
        
        if analysis.get('web_sources_analysis', {}).get('quality_score', 0) < 0.6:
            recommendations.append("Improve web source selection criteria and validation")
        
        return recommendations[:5]  # Return top 5 recommendations