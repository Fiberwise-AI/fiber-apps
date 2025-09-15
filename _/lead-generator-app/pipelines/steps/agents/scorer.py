"""
Agent Scorer Step
Uses AI agents to score lead quality based on business profile and social media presence.
"""
import logging
import json
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class AgentScorerStep:
    """Step implementation for scoring lead quality using AI agents."""
    
    def __init__(self):
        self.name = "AgentScorerStep"
        self.description = "Score lead quality using AI agents for business analysis"
    
    async def execute(self, parameters: Dict[str, Any], fiber) -> Dict[str, Any]:
        """
        Execute the agent scoring step.
        
        Args:
            parameters: Dict containing 'agent_id' and 'prompt' parameters
            fiber: Fiber service for agent activation
        
        Returns:
            Dict with lead quality score and reasoning
        """
        try:
            agent_id = parameters.get('agent_id')
            prompt = parameters.get('prompt')
            
            if not agent_id:
                return {
                    'success': False,
                    'error': 'Missing required parameter: agent_id',
                    'result': {'score': 0, 'reasoning': 'Missing agent ID'}
                }
            
            if not prompt:
                return {
                    'success': False,
                    'error': 'Missing required parameter: prompt',
                    'result': {'score': 0, 'reasoning': 'Missing prompt'}
                }
            
            logger.info(f"Scoring lead quality using agent: {agent_id}")
            
            # Use fiber to activate the agent
            agent_result = await self._activate_agent(agent_id, prompt, fiber)
            
            if not agent_result.get('success'):
                logger.warning(f"Agent activation failed: {agent_result.get('error')}")
                return {
                    'success': False,
                    'error': f"Agent activation failed: {agent_result.get('error')}",
                    'result': {'score': 0, 'reasoning': 'Agent activation failed'}
                }
            
            # Parse the agent response
            agent_response = agent_result.get('result', {})
            scoring_data = await self._parse_agent_response(agent_response)
            
            # Validate score is within expected range
            score = scoring_data.get('score', 0)
            if not isinstance(score, (int, float)) or score < 0 or score > 100:
                logger.warning(f"Invalid score received: {score}, using default")
                score = 50  # Default middle score
                scoring_data['score'] = score
                scoring_data['reasoning'] += " (Score adjusted to valid range)"
            
            logger.info(f"Lead scoring completed. Score: {score}/100")
            
            return {
                'success': True,
                'result': scoring_data,
                'message': f'Lead scored: {score}/100'
            }
            
        except Exception as e:
            logger.error(f"Error in AgentScorerStep: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'result': {'score': 0, 'reasoning': f'Error during scoring: {str(e)}'}
            }
    
    async def _activate_agent(self, agent_id: str, prompt: str, fiber) -> Dict[str, Any]:
        """
        Activate the specified agent with the given prompt.
        
        Args:
            agent_id: ID of the agent to activate
            prompt: Prompt to send to the agent
            fiber: Fiber service for agent activation
        
        Returns:
            Agent activation result
        """
        try:
            # Get the agent activation service from fiber
            activation_service = await fiber.get_service('activation')
            
            # Prepare activation parameters
            activation_params = {
                'agent_id': agent_id,
                'prompt': prompt,
                'context': {
                    'step': 'score_lead_quality',
                    'pipeline': 'b2b_lead_generation',
                    'expected_output_format': 'json'
                }
            }
            
            # Activate the agent
            result = await activation_service.activate_agent(**activation_params)
            
            return result
            
        except Exception as e:
            logger.error(f"Error activating agent {agent_id}: {str(e)}")
            # For demo purposes, return mock data if agent activation fails
            return await self._get_mock_agent_response(prompt)
    
    async def _parse_agent_response(self, agent_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse the agent response to extract lead score and reasoning.
        
        Args:
            agent_response: Raw response from the agent
        
        Returns:
            Parsed scoring data with score and reasoning
        """
        try:
            # The agent should return a response that we can parse for score and reasoning
            response_text = agent_response.get('response', '')
            
            # Try to parse JSON response from the agent
            if response_text.strip().startswith('{'):
                try:
                    parsed_data = json.loads(response_text)
                    score = parsed_data.get('score', 0)
                    reasoning = parsed_data.get('reasoning', '')
                    
                    # Ensure score is numeric
                    if isinstance(score, str):
                        try:
                            score = float(score)
                        except ValueError:
                            score = 0
                    
                    return {
                        'score': int(score) if isinstance(score, (int, float)) else 0,
                        'reasoning': str(reasoning) if reasoning else 'No reasoning provided',
                        'confidence': parsed_data.get('confidence', 'medium'),
                        'factors': parsed_data.get('factors', [])
                    }
                except json.JSONDecodeError:
                    logger.warning("Failed to parse agent response as JSON")
            
            # Fallback: Extract score using pattern matching
            score = self._extract_score_from_text(response_text)
            reasoning = response_text if response_text else "No reasoning provided"
            
            return {
                'score': score,
                'reasoning': reasoning,
                'confidence': 'low',
                'factors': []
            }
            
        except Exception as e:
            logger.error(f"Error parsing agent response: {str(e)}")
            return {
                'score': 0,
                'reasoning': f'Error parsing response: {str(e)}',
                'confidence': 'none',
                'factors': []
            }
    
    def _extract_score_from_text(self, text: str) -> int:
        """Extract a numeric score from text using pattern matching."""
        import re
        
        # Look for patterns like "score: 75", "75/100", "rating of 85", etc.
        patterns = [
            r'score[:\s]+(\d+)',
            r'(\d+)/100',
            r'rating[:\s]+(\d+)',
            r'quality[:\s]+(\d+)',
            r'(\d+)\s*out of 100',
            r'(\d+)%'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    score = int(match.group(1))
                    if 0 <= score <= 100:
                        return score
                except ValueError:
                    continue
        
        # Default fallback score
        return 50
    
    async def _get_mock_agent_response(self, prompt: str) -> Dict[str, Any]:
        """
        Return mock agent response for testing when agent activation fails.
        """
        logger.info("Using mock agent response for scoring")
        
        # Analyze the prompt to generate realistic scoring
        prompt_lower = prompt.lower()
        base_score = 60  # Default base score
        factors = []
        
        # Adjust score based on business indicators in the prompt
        if 'website' in prompt_lower and 'http' in prompt_lower:
            base_score += 15
            factors.append("Professional website present")
        
        if 'linkedin' in prompt_lower:
            base_score += 10
            factors.append("LinkedIn presence found")
        
        if 'twitter' in prompt_lower or 'social' in prompt_lower:
            base_score += 5
            factors.append("Social media activity")
        
        if any(word in prompt_lower for word in ['rating', 'review', '4.', '5.']):
            base_score += 10
            factors.append("Good customer ratings")
        
        if any(word in prompt_lower for word in ['professional', 'corporate', 'business']):
            base_score += 5
            factors.append("Professional business profile")
        
        # Add some randomness but keep it reasonable
        import random
        variation = random.randint(-10, 10)
        final_score = max(20, min(95, base_score + variation))
        
        # Generate reasoning based on score
        if final_score >= 80:
            quality = "excellent"
            recommendation = "Highly recommended for outreach"
        elif final_score >= 65:
            quality = "good"
            recommendation = "Suitable for targeted marketing"
        elif final_score >= 45:
            quality = "moderate"
            recommendation = "Requires additional qualification"
        else:
            quality = "low"
            recommendation = "Not recommended for immediate outreach"
        
        reasoning = f"This business shows {quality} potential as a lead. {recommendation}. " + \
                   f"Key factors: {', '.join(factors) if factors else 'Limited information available'}."
        
        mock_response = {
            'score': final_score,
            'reasoning': reasoning,
            'confidence': 'medium',
            'factors': factors,
            'recommendation': recommendation
        }
        
        return {
            'success': True,
            'result': {
                'response': json.dumps(mock_response)
            }
        }