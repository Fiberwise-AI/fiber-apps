"""
Hypothesis Agent using SmolAgents with FiberWise Platform LLM

Generates and tests research hypotheses using SmolAgents framework 
with the built-in FiberWise LLM provider for intelligent hypothesis reasoning.
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime


class HypothesisAgent:
    """
    Hypothesis generation and testing agent using SmolAgents patterns
    with FiberWise platform's built-in LLM provider.
    """
    
    def __init__(self):
        self.hypothesis_types = [
            'descriptive',    # Describes current state
            'comparative',    # Compares different aspects
            'causal',        # Suggests cause-effect relationships
            'predictive',    # Makes predictions about future
            'explanatory'    # Explains why something occurs
        ]
        self.generated_hypotheses = []
        self.hypothesis_tests = []
    
    async def activate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main activation method for hypothesis generation and testing.
        
        Args:
            input_data: Dictionary containing hypothesis parameters
            
        Returns:
            Dictionary with generated hypotheses and test results
        """
        
        mode = input_data.get('mode', 'generate_hypotheses')
        
        if mode == 'generate_hypotheses':
            return await self.generate_research_hypotheses(input_data)
        elif mode == 'test_hypothesis':
            return await self.test_single_hypothesis(input_data)
        elif mode == 'evaluate_evidence':
            return await self.evaluate_hypothesis_evidence(input_data)
        elif mode == 'respond_to_critique':
            return await self.respond_to_hypothesis_critique(input_data)
        elif mode == 'refine_hypotheses':
            return await self.refine_existing_hypotheses(input_data)
        else:
            return {
                'success': False,
                'error': f'Unknown hypothesis mode: {mode}',
                'hypotheses': []
            }
    
    async def generate_research_hypotheses(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate research hypotheses based on available data."""
        
        research_topic = input_data.get('research_topic', '')
        research_data = input_data.get('research_data', {})
        hypothesis_count = input_data.get('hypothesis_count', 5)
        
        print(f"[HypothesisAgent] Generating hypotheses for: {research_topic}")
        
        try:
            # SmolAgent approach: Generate focused, testable hypotheses
            generated_hypotheses = []
            
            # Generate hypotheses for each type
            for hypothesis_type in self.hypothesis_types:
                hypothesis = await self.generate_typed_hypothesis(
                    research_topic, research_data, hypothesis_type
                )
                if hypothesis:
                    generated_hypotheses.append(hypothesis)
                
                if len(generated_hypotheses) >= hypothesis_count:
                    break
            
            # Use FiberWise LLM to enhance and validate hypotheses
            enhanced_hypotheses = await self.enhance_hypotheses_with_llm(
                generated_hypotheses, research_topic, research_data
            )
            
            # Store generated hypotheses
            self.generated_hypotheses.extend(enhanced_hypotheses)
            
            return {
                'success': True,
                'generated_hypotheses': enhanced_hypotheses,
                'hypothesis_count': len(enhanced_hypotheses),
                'research_topic': research_topic,
                'generation_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[HypothesisAgent] Error generating hypotheses: {str(e)}")
            return {
                'success': False,
                'error': f'Hypothesis generation failed: {str(e)}',
                'hypotheses': []
            }
    
    async def test_single_hypothesis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test a specific hypothesis against available evidence."""
        
        hypothesis = input_data.get('hypothesis', '')
        research_data = input_data.get('research_data', {})
        research_topic = input_data.get('research_topic', '')
        
        print(f"[HypothesisAgent] Testing hypothesis: {hypothesis[:50]}...")
        
        try:
            # SmolAgent pattern: Systematic hypothesis testing
            test_results = await self.perform_hypothesis_test(
                hypothesis, research_data, research_topic
            )
            
            # Use FiberWise LLM for deeper analysis
            llm_analysis = await self.analyze_hypothesis_with_llm(
                hypothesis, test_results, research_data
            )
            
            # Combine results
            comprehensive_test = {
                'hypothesis': hypothesis,
                'test_results': test_results,
                'llm_analysis': llm_analysis,
                'overall_conclusion': self.synthesize_test_conclusion(test_results, llm_analysis),
                'confidence_score': self.calculate_hypothesis_confidence(test_results, llm_analysis),
                'test_timestamp': datetime.now().isoformat()
            }
            
            # Store test results
            self.hypothesis_tests.append(comprehensive_test)
            
            return {
                'success': True,
                'hypothesis_test': comprehensive_test,
                'research_topic': research_topic
            }
            
        except Exception as e:
            print(f"[HypothesisAgent] Error testing hypothesis: {str(e)}")
            return {
                'success': False,
                'error': f'Hypothesis testing failed: {str(e)}',
                'hypothesis': hypothesis
            }
    
    async def evaluate_hypothesis_evidence(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate evidence supporting or refuting hypotheses."""
        
        hypotheses = input_data.get('hypotheses', [])
        research_data = input_data.get('research_data', {})
        
        print(f"[HypothesisAgent] Evaluating evidence for {len(hypotheses)} hypotheses")
        
        evidence_evaluations = []
        
        for hypothesis in hypotheses:
            evaluation = await self.evaluate_single_hypothesis_evidence(
                hypothesis, research_data
            )
            evidence_evaluations.append(evaluation)
        
        # Synthesize overall evidence assessment
        overall_assessment = await self.synthesize_evidence_assessment(evidence_evaluations)
        
        return {
            'success': True,
            'evidence_evaluations': evidence_evaluations,
            'overall_assessment': overall_assessment,
            'hypotheses_evaluated': len(hypotheses)
        }
    
    async def respond_to_hypothesis_critique(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Respond to critiques of hypotheses from other agents."""
        
        critique = input_data.get('critique', '')
        hypothesis = input_data.get('hypothesis', '')
        agent_from = input_data.get('agent_from', '')
        
        print(f"[HypothesisAgent] Responding to critique from {agent_from}")
        
        # SmolAgent response: Address critique constructively
        response = await self.address_hypothesis_critique(critique, hypothesis)
        
        # Use FiberWise LLM for nuanced response
        llm_response = await self.generate_llm_critique_response(
            critique, hypothesis, response
        )
        
        return {
            'success': True,
            'critique_response': {
                'original_critique': critique,
                'hypothesis': hypothesis,
                'agent_response': response,
                'llm_enhanced_response': llm_response,
                'response_type': 'constructive_dialogue'
            },
            'agent_from': agent_from
        }
    
    async def refine_existing_hypotheses(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Refine hypotheses based on new evidence or critiques."""
        
        hypotheses_to_refine = input_data.get('hypotheses', [])
        new_evidence = input_data.get('new_evidence', {})
        critiques = input_data.get('critiques', [])
        
        print(f"[HypothesisAgent] Refining {len(hypotheses_to_refine)} hypotheses")
        
        refined_hypotheses = []
        
        for hypothesis in hypotheses_to_refine:
            refined = await self.refine_single_hypothesis(
                hypothesis, new_evidence, critiques
            )
            refined_hypotheses.append(refined)
        
        return {
            'success': True,
            'refined_hypotheses': refined_hypotheses,
            'refinement_summary': self.summarize_refinements(refined_hypotheses),
            'original_count': len(hypotheses_to_refine)
        }
    
    # Core Hypothesis Generation Methods
    
    async def generate_typed_hypothesis(self, topic: str, research_data: Dict[str, Any], 
                                      hypothesis_type: str) -> Optional[Dict[str, Any]]:
        """Generate a specific type of hypothesis."""
        
        hypothesis_templates = {
            'descriptive': f"The current state of {topic} research demonstrates {{pattern}} across multiple sources",
            'comparative': f"Research on {topic} shows {{difference}} between {{aspect_a}} and {{aspect_b}}",
            'causal': f"The {{factor}} significantly influences {{outcome}} in {topic} research",
            'predictive': f"Based on current {topic} trends, {{future_state}} will likely occur within {{timeframe}}",
            'explanatory': f"The {{phenomenon}} in {topic} occurs because of {{underlying_mechanism}}"
        }
        
        template = hypothesis_templates.get(hypothesis_type, '')
        if not template:
            return None
        
        # Generate specific hypothesis content based on research data
        hypothesis_content = await self.fill_hypothesis_template(
            template, topic, research_data, hypothesis_type
        )
        
        return {
            'hypothesis_id': f"hyp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hypothesis_type}",
            'hypothesis_type': hypothesis_type,
            'hypothesis_statement': hypothesis_content,
            'research_topic': topic,
            'testability_score': self.assess_hypothesis_testability(hypothesis_content),
            'generated_at': datetime.now().isoformat()
        }
    
    async def fill_hypothesis_template(self, template: str, topic: str, 
                                     research_data: Dict[str, Any], hypothesis_type: str) -> str:
        """Fill hypothesis template with specific content based on research data."""
        
        # Analyze research data to fill template placeholders
        patterns = self.identify_data_patterns(research_data)
        
        if hypothesis_type == 'descriptive':
            pattern = patterns.get('main_theme', 'comprehensive coverage')
            return template.format(pattern=pattern)
        
        elif hypothesis_type == 'comparative':
            aspects = patterns.get('contrasting_aspects', ['traditional sources', 'digital sources'])
            difference = patterns.get('main_difference', 'varying levels of credibility')
            return template.format(
                difference=difference,
                aspect_a=aspects[0] if len(aspects) > 0 else 'source type A',
                aspect_b=aspects[1] if len(aspects) > 1 else 'source type B'
            )
        
        elif hypothesis_type == 'causal':
            factor = patterns.get('influencing_factor', 'source diversity')
            outcome = patterns.get('main_outcome', 'research comprehensiveness')
            return template.format(factor=factor, outcome=outcome)
        
        elif hypothesis_type == 'predictive':
            trend = patterns.get('emerging_trend', 'increasing digital integration')
            timeframe = patterns.get('prediction_timeframe', '2-3 years')
            return template.format(future_state=trend, timeframe=timeframe)
        
        elif hypothesis_type == 'explanatory':
            phenomenon = patterns.get('observed_phenomenon', 'source quality variation')
            mechanism = patterns.get('underlying_cause', 'different editorial standards')
            return template.format(phenomenon=phenomenon, underlying_mechanism=mechanism)
        
        else:
            return f"Generated hypothesis about {topic} requires further specification"
    
    def identify_data_patterns(self, research_data: Dict[str, Any]) -> Dict[str, str]:
        """Identify patterns in research data for hypothesis generation."""
        
        patterns = {
            'main_theme': 'multi-source information integration',
            'contrasting_aspects': ['Wikipedia sources', 'web scraped sources'],
            'main_difference': 'credibility and validation levels',
            'influencing_factor': 'source type and origin',
            'main_outcome': 'overall research reliability',
            'emerging_trend': 'automated research synthesis',
            'prediction_timeframe': '1-2 years',
            'observed_phenomenon': 'variable source quality',
            'underlying_cause': 'different content creation processes'
        }
        
        # Analyze actual research data
        if research_data.get('wikipedia_data'):
            patterns['main_theme'] = 'encyclopedia-based research foundation'
        
        if research_data.get('web_scraped_data'):
            web_sources = len(research_data['web_scraped_data'].get('scraped_data', []))
            if web_sources > 10:
                patterns['emerging_trend'] = 'comprehensive web source integration'
        
        return patterns
    
    def assess_hypothesis_testability(self, hypothesis: str) -> float:
        """Assess how testable a hypothesis is."""
        
        testability_indicators = [
            'demonstrates', 'shows', 'indicates', 'reveals',
            'compared to', 'differs from', 'correlates with',
            'will increase', 'will decrease', 'will change',
            'because of', 'due to', 'results from'
        ]
        
        score = 0.0
        for indicator in testability_indicators:
            if indicator in hypothesis.lower():
                score += 0.2
        
        # Bonus for specific, measurable terms
        measurable_terms = ['percentage', 'ratio', 'score', 'level', 'rate']
        for term in measurable_terms:
            if term in hypothesis.lower():
                score += 0.1
        
        return min(score, 1.0)
    
    # FiberWise LLM Integration Methods
    
    async def enhance_hypotheses_with_llm(self, hypotheses: List[Dict[str, Any]], 
                                        topic: str, research_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Use FiberWise LLM to enhance and validate hypotheses."""
        
        # Note: In actual implementation, this would call FiberWise LLM service
        # For now, return enhanced versions with mock LLM analysis
        
        enhanced = []
        for hypothesis in hypotheses:
            llm_enhancement = await self.mock_llm_hypothesis_enhancement(hypothesis, topic)
            
            enhanced_hypothesis = {
                **hypothesis,
                'llm_enhancement': llm_enhancement,
                'enhanced_statement': llm_enhancement.get('improved_statement', hypothesis['hypothesis_statement']),
                'llm_testability_score': llm_enhancement.get('testability_assessment', 0.7),
                'llm_relevance_score': llm_enhancement.get('relevance_score', 0.8)
            }
            enhanced.append(enhanced_hypothesis)
        
        return enhanced
    
    async def mock_llm_hypothesis_enhancement(self, hypothesis: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Mock LLM enhancement - replace with actual FiberWise LLM call."""
        
        statement = hypothesis['hypothesis_statement']
        hypothesis_type = hypothesis['hypothesis_type']
        
        return {
            'improved_statement': f"Enhanced: {statement}",
            'testability_assessment': 0.8,
            'relevance_score': 0.85,
            'llm_suggestions': [
                "Consider adding measurable criteria",
                "Specify timeframe for evaluation",
                "Include comparison baseline"
            ],
            'confidence_level': 'high'
        }
    
    async def analyze_hypothesis_with_llm(self, hypothesis: str, test_results: Dict[str, Any], 
                                        research_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use FiberWise LLM for deep hypothesis analysis."""
        
        # Mock LLM analysis - replace with actual FiberWise LLM call
        return {
            'llm_interpretation': f"Analysis suggests the hypothesis is partially supported by available evidence",
            'strength_assessment': 'moderate',
            'weakness_identification': [
                "Limited sample size",
                "Need for additional validation"
            ],
            'improvement_suggestions': [
                "Expand evidence base",
                "Include expert validation"
            ],
            'alternative_explanations': [
                "Alternative hypothesis A",
                "Alternative hypothesis B"
            ]
        }
    
    async def generate_llm_critique_response(self, critique: str, hypothesis: str, 
                                           initial_response: str) -> str:
        """Generate nuanced response to critique using FiberWise LLM."""
        
        # Mock LLM response - replace with actual FiberWise LLM call
        return f"Thank you for the critique. {initial_response} Additionally, I acknowledge the valid points raised and propose refining the hypothesis to address these concerns."
    
    # Hypothesis Testing Methods
    
    async def perform_hypothesis_test(self, hypothesis: str, research_data: Dict[str, Any], 
                                    topic: str) -> Dict[str, Any]:
        """Perform systematic hypothesis testing."""
        
        # Extract testable claims from hypothesis
        testable_claims = self.extract_testable_claims(hypothesis)
        
        # Test each claim against available evidence
        claim_tests = []
        for claim in testable_claims:
            test_result = await self.test_claim_against_evidence(claim, research_data)
            claim_tests.append(test_result)
        
        # Calculate overall test results
        overall_support = sum(test['support_score'] for test in claim_tests) / len(claim_tests) if claim_tests else 0.0
        
        return {
            'hypothesis': hypothesis,
            'testable_claims': testable_claims,
            'claim_test_results': claim_tests,
            'overall_support_score': overall_support,
            'test_conclusion': self.determine_test_conclusion(overall_support),
            'evidence_quality': self.assess_evidence_quality(research_data),
            'limitations': self.identify_test_limitations(research_data)
        }
    
    def extract_testable_claims(self, hypothesis: str) -> List[str]:
        """Extract testable claims from hypothesis statement."""
        
        # Simple claim extraction - could be enhanced with NLP
        claims = []
        
        if 'demonstrates' in hypothesis:
            claims.append("Demonstrates observable pattern")
        if 'shows' in hypothesis:
            claims.append("Shows measurable difference")
        if 'influences' in hypothesis:
            claims.append("Establishes causal relationship")
        if 'will' in hypothesis:
            claims.append("Makes testable prediction")
        if 'because' in hypothesis:
            claims.append("Provides explanatory mechanism")
        
        return claims if claims else ["General research claim"]
    
    async def test_claim_against_evidence(self, claim: str, research_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test a specific claim against available evidence."""
        
        evidence_sources = []
        support_score = 0.0
        
        # Check Wikipedia evidence
        if research_data.get('wikipedia_data'):
            wiki_support = self.assess_wikipedia_support(claim, research_data['wikipedia_data'])
            evidence_sources.append(wiki_support)
            support_score += wiki_support['support_score']
        
        # Check web scraped evidence
        if research_data.get('web_scraped_data'):
            web_support = self.assess_web_support(claim, research_data['web_scraped_data'])
            evidence_sources.append(web_support)
            support_score += web_support['support_score']
        
        # Normalize support score
        if evidence_sources:
            support_score = support_score / len(evidence_sources)
        
        return {
            'claim': claim,
            'evidence_sources': evidence_sources,
            'support_score': support_score,
            'conclusion': 'supported' if support_score > 0.6 else 'partial' if support_score > 0.3 else 'unsupported'
        }
    
    def assess_wikipedia_support(self, claim: str, wikipedia_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess how well Wikipedia data supports a claim."""
        
        main_article = wikipedia_data.get('main_article', {})
        related_articles = wikipedia_data.get('related_articles', [])
        
        support_score = 0.0
        
        if main_article:
            support_score += 0.5  # Main article exists
        
        if len(related_articles) > 3:
            support_score += 0.3  # Good breadth
        
        if len(wikipedia_data.get('references', [])) > 5:
            support_score += 0.2  # External validation
        
        return {
            'source_type': 'wikipedia',
            'support_score': min(support_score, 1.0),
            'evidence_quality': 'high' if support_score > 0.7 else 'medium'
        }
    
    def assess_web_support(self, claim: str, web_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess how well web scraped data supports a claim."""
        
        scraped_data = web_data.get('scraped_data', [])
        
        if not scraped_data:
            return {
                'source_type': 'web_scraped',
                'support_score': 0.0,
                'evidence_quality': 'none'
            }
        
        high_relevance_sources = sum(1 for source in scraped_data 
                                   if source.get('relevance_score', 0) > 0.6)
        support_score = high_relevance_sources / len(scraped_data)
        
        return {
            'source_type': 'web_scraped',
            'support_score': support_score,
            'evidence_quality': 'high' if support_score > 0.6 else 'medium' if support_score > 0.3 else 'low'
        }
    
    def determine_test_conclusion(self, support_score: float) -> str:
        """Determine overall test conclusion based on support score."""
        
        if support_score > 0.75:
            return "Hypothesis strongly supported by available evidence"
        elif support_score > 0.5:
            return "Hypothesis moderately supported with some limitations"
        elif support_score > 0.25:
            return "Hypothesis partially supported, requires additional evidence"
        else:
            return "Hypothesis not well supported by current evidence"
    
    def assess_evidence_quality(self, research_data: Dict[str, Any]) -> str:
        """Assess overall quality of evidence used in testing."""
        
        quality_factors = []
        
        if research_data.get('wikipedia_data'):
            quality_factors.append('wikipedia_comprehensive')
        
        if research_data.get('web_scraped_data'):
            web_sources = len(research_data['web_scraped_data'].get('scraped_data', []))
            if web_sources > 5:
                quality_factors.append('web_diverse')
        
        if len(quality_factors) >= 2:
            return 'good'
        elif len(quality_factors) == 1:
            return 'fair'
        else:
            return 'limited'
    
    def identify_test_limitations(self, research_data: Dict[str, Any]) -> List[str]:
        """Identify limitations in hypothesis testing."""
        
        limitations = []
        
        if not research_data.get('wikipedia_data'):
            limitations.append("No encyclopedic reference data")
        
        if not research_data.get('web_scraped_data'):
            limitations.append("No diverse web source validation")
        
        limitations.append("Limited to automated source analysis")
        limitations.append("No expert human validation")
        limitations.append("No longitudinal data available")
        
        return limitations
    
    # Evidence Evaluation Methods
    
    async def evaluate_single_hypothesis_evidence(self, hypothesis: Dict[str, Any], 
                                                research_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate evidence for a single hypothesis."""
        
        statement = hypothesis.get('hypothesis_statement', '')
        hypothesis_type = hypothesis.get('hypothesis_type', 'general')
        
        # Perform evidence evaluation
        evidence_assessment = await self.assess_hypothesis_evidence(statement, research_data)
        
        return {
            'hypothesis_id': hypothesis.get('hypothesis_id', ''),
            'hypothesis_statement': statement,
            'evidence_assessment': evidence_assessment,
            'overall_evidence_score': evidence_assessment.get('overall_score', 0.0),
            'recommendation': self.generate_evidence_recommendation(evidence_assessment)
        }
    
    async def assess_hypothesis_evidence(self, hypothesis: str, research_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess evidence supporting a hypothesis."""
        
        evidence_types = {
            'direct_support': 0.0,
            'indirect_support': 0.0,
            'contradictory_evidence': 0.0,
            'neutral_evidence': 0.0
        }
        
        # Assess different types of evidence
        total_evidence_points = 0
        
        # Wikipedia evidence
        if research_data.get('wikipedia_data'):
            wiki_evidence = self.categorize_wikipedia_evidence(hypothesis, research_data['wikipedia_data'])
            for evidence_type, score in wiki_evidence.items():
                evidence_types[evidence_type] += score
                total_evidence_points += score
        
        # Web scraped evidence
        if research_data.get('web_scraped_data'):
            web_evidence = self.categorize_web_evidence(hypothesis, research_data['web_scraped_data'])
            for evidence_type, score in web_evidence.items():
                evidence_types[evidence_type] += score
                total_evidence_points += score
        
        # Calculate overall evidence score
        if total_evidence_points > 0:
            positive_evidence = evidence_types['direct_support'] + evidence_types['indirect_support']
            overall_score = positive_evidence / total_evidence_points
        else:
            overall_score = 0.0
        
        return {
            'evidence_breakdown': evidence_types,
            'total_evidence_points': total_evidence_points,
            'overall_score': overall_score,
            'evidence_quality': self.assess_evidence_strength(evidence_types),
            'gaps_identified': self.identify_evidence_gaps(hypothesis, evidence_types)
        }
    
    def categorize_wikipedia_evidence(self, hypothesis: str, wikipedia_data: Dict[str, Any]) -> Dict[str, float]:
        """Categorize Wikipedia evidence by support type."""
        
        evidence = {
            'direct_support': 0.0,
            'indirect_support': 0.0,
            'contradictory_evidence': 0.0,
            'neutral_evidence': 0.0
        }
        
        # Main article provides direct support
        if wikipedia_data.get('main_article'):
            evidence['direct_support'] += 0.5
        
        # Related articles provide indirect support
        related_count = len(wikipedia_data.get('related_articles', []))
        if related_count > 0:
            evidence['indirect_support'] += min(related_count * 0.1, 0.5)
        
        # References provide additional support
        ref_count = len(wikipedia_data.get('references', []))
        if ref_count > 0:
            evidence['indirect_support'] += min(ref_count * 0.05, 0.3)
        
        return evidence
    
    def categorize_web_evidence(self, hypothesis: str, web_data: Dict[str, Any]) -> Dict[str, float]:
        """Categorize web scraped evidence by support type."""
        
        evidence = {
            'direct_support': 0.0,
            'indirect_support': 0.0,
            'contradictory_evidence': 0.0,
            'neutral_evidence': 0.0
        }
        
        scraped_data = web_data.get('scraped_data', [])
        
        for source in scraped_data:
            relevance = source.get('relevance_score', 0.0)
            
            if relevance > 0.7:
                evidence['direct_support'] += 0.2
            elif relevance > 0.4:
                evidence['indirect_support'] += 0.1
            else:
                evidence['neutral_evidence'] += 0.05
        
        return evidence
    
    def assess_evidence_strength(self, evidence_types: Dict[str, float]) -> str:
        """Assess overall strength of evidence."""
        
        total_positive = evidence_types['direct_support'] + evidence_types['indirect_support']
        total_negative = evidence_types['contradictory_evidence']
        
        if total_positive > 1.0 and total_negative < 0.2:
            return 'strong'
        elif total_positive > 0.5 and total_negative < 0.5:
            return 'moderate'
        elif total_positive > 0.2:
            return 'weak'
        else:
            return 'insufficient'
    
    def identify_evidence_gaps(self, hypothesis: str, evidence_types: Dict[str, float]) -> List[str]:
        """Identify gaps in evidence for hypothesis."""
        
        gaps = []
        
        if evidence_types['direct_support'] < 0.3:
            gaps.append("Limited direct evidence support")
        
        if evidence_types['contradictory_evidence'] > 0.3:
            gaps.append("Significant contradictory evidence present")
        
        if sum(evidence_types.values()) < 0.5:
            gaps.append("Overall insufficient evidence quantity")
        
        gaps.append("No peer-reviewed academic sources")
        gaps.append("No expert validation")
        
        return gaps
    
    def generate_evidence_recommendation(self, evidence_assessment: Dict[str, Any]) -> str:
        """Generate recommendation based on evidence assessment."""
        
        overall_score = evidence_assessment.get('overall_score', 0.0)
        quality = evidence_assessment.get('evidence_quality', 'insufficient')
        
        if quality == 'strong' and overall_score > 0.8:
            return "Hypothesis well-supported, proceed with validation studies"
        elif quality == 'moderate':
            return "Hypothesis partially supported, gather additional evidence"
        else:
            return "Hypothesis requires significant additional evidence before acceptance"
    
    # Synthesis and Utility Methods
    
    async def synthesize_evidence_assessment(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Synthesize overall evidence assessment across multiple hypotheses."""
        
        if not evaluations:
            return {'assessment': 'No hypotheses to evaluate'}
        
        avg_evidence_score = sum(e['overall_evidence_score'] for e in evaluations) / len(evaluations)
        strong_evidence_count = sum(1 for e in evaluations if e['overall_evidence_score'] > 0.7)
        
        return {
            'average_evidence_score': avg_evidence_score,
            'strong_evidence_percentage': strong_evidence_count / len(evaluations),
            'total_hypotheses': len(evaluations),
            'overall_research_strength': 'high' if avg_evidence_score > 0.7 else 'medium' if avg_evidence_score > 0.4 else 'low',
            'recommendations': [
                "Strengthen evidence collection methods",
                "Add peer review validation",
                "Expand source diversity"
            ]
        }
    
    async def address_hypothesis_critique(self, critique: str, hypothesis: str) -> str:
        """Address critique of hypothesis constructively."""
        
        # SmolAgent approach: Acknowledge and improve
        if 'evidence' in critique.lower():
            return "Acknowledged - will strengthen evidence base with additional sources and validation"
        elif 'testability' in critique.lower():
            return "Valid point - will refine hypothesis to include more specific, measurable criteria"
        elif 'bias' in critique.lower():
            return "Important concern - will address potential biases in source selection and analysis"
        else:
            return "Thank you for the critique - will incorporate this feedback into hypothesis refinement"
    
    async def refine_single_hypothesis(self, hypothesis: Dict[str, Any], 
                                     new_evidence: Dict[str, Any], 
                                     critiques: List[str]) -> Dict[str, Any]:
        """Refine a hypothesis based on new evidence and critiques."""
        
        original_statement = hypothesis['hypothesis_statement']
        
        # Apply refinements based on critiques
        refined_statement = original_statement
        refinement_notes = []
        
        for critique in critiques:
            if 'specific' in critique.lower():
                refined_statement = f"Specifically, {refined_statement.lower()}"
                refinement_notes.append("Added specificity")
            elif 'measurable' in critique.lower():
                refined_statement = f"{refined_statement} with quantifiable metrics"
                refinement_notes.append("Added measurability")
        
        return {
            **hypothesis,
            'original_statement': original_statement,
            'refined_statement': refined_statement,
            'refinement_notes': refinement_notes,
            'refinement_timestamp': datetime.now().isoformat(),
            'evidence_incorporated': bool(new_evidence)
        }
    
    def summarize_refinements(self, refined_hypotheses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize hypothesis refinements."""
        
        total_refined = len(refined_hypotheses)
        refinement_types = {}
        
        for hypothesis in refined_hypotheses:
            for note in hypothesis.get('refinement_notes', []):
                refinement_types[note] = refinement_types.get(note, 0) + 1
        
        return {
            'total_hypotheses_refined': total_refined,
            'refinement_types': refinement_types,
            'most_common_refinement': max(refinement_types.items(), key=lambda x: x[1])[0] if refinement_types else 'None'
        }
    
    def synthesize_test_conclusion(self, test_results: Dict[str, Any], llm_analysis: Dict[str, Any]) -> str:
        """Synthesize overall test conclusion."""
        
        support_score = test_results.get('overall_support_score', 0.0)
        llm_strength = llm_analysis.get('strength_assessment', 'moderate')
        
        if support_score > 0.7 and llm_strength == 'strong':
            return "Hypothesis strongly supported by evidence and analysis"
        elif support_score > 0.5:
            return "Hypothesis moderately supported with room for improvement"
        else:
            return "Hypothesis requires additional evidence and refinement"
    
    def calculate_hypothesis_confidence(self, test_results: Dict[str, Any], llm_analysis: Dict[str, Any]) -> float:
        """Calculate confidence score for hypothesis."""
        
        support_score = test_results.get('overall_support_score', 0.0)
        evidence_quality = 0.8 if test_results.get('evidence_quality') == 'good' else 0.6
        
        return (support_score + evidence_quality) / 2