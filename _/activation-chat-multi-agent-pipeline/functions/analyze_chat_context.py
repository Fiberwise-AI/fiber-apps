"""
Analyze Chat Context Function

This function analyzes conversation context to determine if summarization
is needed and extracts relevant metadata for subsequent pipeline processing.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ChatContextAnalyzer:
    """
    Function implementation for analyzing chat context in pipeline execution.
    
    This function processes message count and chat history to:
    1. Determine if summarization is needed based on thresholds
    2. Extract conversation topics and themes
    3. Analyze conversation quality and engagement
    4. Provide context metadata for subsequent nodes
    """
    
    def __init__(self):
        self.function_id = "analyze_chat_context"
        self.version = "1.0.0"
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main execution function for analyzing chat context.
        
        Args:
            input_data: Input from previous pipeline node (message count data)
            context: Pipeline execution context with services and metadata
            
        Returns:
            Dictionary with context analysis and summarization decision
        """
        try:
            # Extract data from previous node
            message_count = input_data.get('output', {}).get('message_count', 0)
            chat_id = input_data.get('output', {}).get('chat_id') or context.get('chat_id')
            analysis_data = input_data.get('output', {}).get('analysis', {})
            
            # Get function parameters
            params = input_data.get('params', {})
            min_message_threshold = params.get('min_message_threshold', 3)
            context_window = params.get('context_window', 20)
            analyze_topics = params.get('analyze_topics', True)
            
            logger.info(f"Analyzing context for chat_id: {chat_id}, message_count: {message_count}")
            
            if not chat_id:
                raise ValueError("chat_id is required for context analysis")
            
            # Get FiberWise SDK instance from context
            fiber = context.get('fiber')
            if not fiber:
                raise RuntimeError("FiberWise SDK not available in execution context")
            
            # Determine if summarization should occur
            should_summarize = await self._should_summarize_conversation(
                message_count, 
                analysis_data, 
                min_message_threshold
            )
            
            # Get recent conversation context if summarization is needed
            conversation_context = None
            topic_analysis = None
            
            if should_summarize and analyze_topics:
                conversation_context = await self._get_recent_context(
                    fiber, 
                    chat_id, 
                    context_window
                )
                
                if conversation_context:
                    topic_analysis = await self._analyze_topics(conversation_context)
            
            # Analyze conversation quality metrics
            quality_metrics = await self._analyze_conversation_quality(analysis_data)
            
            # Build comprehensive context analysis
            context_analysis = {
                'message_count': message_count,
                'should_summarize': should_summarize,
                'summarization_reasons': await self._get_summarization_reasons(
                    message_count, 
                    analysis_data, 
                    min_message_threshold
                ),
                'conversation_context': conversation_context,
                'topic_analysis': topic_analysis,
                'quality_metrics': quality_metrics,
                'chat_metadata': {
                    'chat_id': chat_id,
                    'analysis_timestamp': datetime.utcnow().isoformat(),
                    'context_window_size': len(conversation_context) if conversation_context else 0,
                    'analysis_parameters': params
                }
            }
            
            # Build result for next pipeline node
            result = {
                'output': {
                    'should_summarize': should_summarize,
                    'context_analysis': context_analysis,
                    'message_count': message_count,
                    'chat_id': chat_id,
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat(),
                        'parameters_used': params
                    }
                },
                'status': 'completed',
                'execution_time_ms': 0  # Will be calculated by pipeline engine
            }
            
            logger.info(f"Context analysis completed: should_summarize={should_summarize}")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing chat context: {str(e)}", exc_info=True)
            return {
                'output': {
                    'should_summarize': False,
                    'error': str(e),
                    'chat_id': context.get('chat_id', 'unknown'),
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat(),
                        'error_occurred': True
                    }
                },
                'status': 'failed',
                'error': str(e)
            }
    
    async def _should_summarize_conversation(
        self, 
        message_count: int, 
        analysis_data: Dict[str, Any], 
        min_threshold: int
    ) -> bool:
        """
        Determine if conversation should be summarized based on various factors.
        
        Args:
            message_count: Number of meaningful messages in conversation
            analysis_data: Message analysis from previous function
            min_threshold: Minimum message threshold for summarization
            
        Returns:
            Boolean indicating if summarization should occur
        """
        # Basic threshold check
        if message_count < min_threshold:
            return False
        
        # Check conversation quality indicators
        conversation_turns = analysis_data.get('conversation_turns', 0)
        avg_message_length = analysis_data.get('average_message_length', 0)
        
        # Require at least 2 conversation turns for meaningful summarization
        if conversation_turns < 2:
            return False
        
        # Require reasonable average message length (not just short responses)
        if avg_message_length < 10:
            return False
        
        # Check time span - don't summarize very brief conversations
        time_span = analysis_data.get('time_span')
        if time_span and time_span.get('duration_seconds'):
            duration_minutes = time_span['duration_seconds'] / 60
            # Require at least 2 minutes of conversation
            if duration_minutes < 2:
                return False
        
        return True
    
    async def _get_summarization_reasons(
        self, 
        message_count: int, 
        analysis_data: Dict[str, Any], 
        min_threshold: int
    ) -> List[str]:
        """
        Get reasons why summarization was or wasn't recommended.
        
        Args:
            message_count: Number of meaningful messages
            analysis_data: Message analysis data
            min_threshold: Minimum threshold setting
            
        Returns:
            List of reason strings
        """
        reasons = []
        
        if message_count >= min_threshold:
            reasons.append(f"Message count ({message_count}) exceeds threshold ({min_threshold})")
        else:
            reasons.append(f"Message count ({message_count}) below threshold ({min_threshold})")
        
        conversation_turns = analysis_data.get('conversation_turns', 0)
        if conversation_turns >= 2:
            reasons.append(f"Sufficient conversation turns ({conversation_turns})")
        else:
            reasons.append(f"Insufficient conversation turns ({conversation_turns})")
        
        avg_length = analysis_data.get('average_message_length', 0)
        if avg_length >= 10:
            reasons.append(f"Good average message length ({avg_length:.1f} chars)")
        else:
            reasons.append(f"Short average message length ({avg_length:.1f} chars)")
        
        time_span = analysis_data.get('time_span')
        if time_span and time_span.get('duration_seconds'):
            duration_minutes = time_span['duration_seconds'] / 60
            if duration_minutes >= 2:
                reasons.append(f"Sufficient conversation duration ({duration_minutes:.1f} minutes)")
            else:
                reasons.append(f"Brief conversation duration ({duration_minutes:.1f} minutes)")
        
        return reasons
    
    async def _get_recent_context(
        self, 
        fiber, 
        chat_id: str, 
        context_window: int
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve recent conversation context for analysis.
        
        Args:
            fiber: FiberWise SDK instance
            chat_id: Chat session identifier
            context_window: Number of recent messages to include
            
        Returns:
            List of recent message dictionaries
        """
        try:
            # Get recent activations
            response = await fiber.agents.get_activations(
                context={"chat_id": chat_id},
                limit=context_window,
                sort_by="started_at",
                sort_dir="desc"  # Most recent first
            )
            
            if isinstance(response, str) or not response:
                return None
            
            # Extract activations
            activations = response
            if isinstance(response, dict):
                activations = response.get('activations', response.get('items', []))
            
            if not isinstance(activations, list):
                return None
            
            # Convert to context format
            context_messages = []
            for activation in reversed(activations):  # Chronological order
                if not isinstance(activation, dict):
                    continue
                
                input_data = activation.get('input_data', {})
                output_data = activation.get('output_data', {})
                
                # Extract text content
                input_text = ''
                if isinstance(input_data, dict):
                    input_text = input_data.get('prompt', input_data.get('text', ''))
                elif isinstance(input_data, str):
                    input_text = input_data
                
                output_text = ''
                if isinstance(output_data, dict):
                    output_text = output_data.get('text', output_data.get('response', ''))
                elif isinstance(output_data, str):
                    output_text = output_data
                
                # Skip messages without meaningful content
                if not input_text.strip() and not output_text.strip():
                    continue
                
                context_message = {
                    'timestamp': activation.get('started_at'),
                    'agent_id': activation.get('agent_id'),
                    'role': activation.get('context', {}).get('role', 'unknown'),
                    'input': input_text.strip(),
                    'output': output_text.strip(),
                    'length': len(input_text) + len(output_text)
                }
                
                context_messages.append(context_message)
            
            return context_messages if context_messages else None
            
        except Exception as e:
            logger.error(f"Error getting recent context: {str(e)}")
            return None
    
    async def _analyze_topics(self, context_messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform basic topic analysis on conversation context.
        
        Args:
            context_messages: List of recent conversation messages
            
        Returns:
            Topic analysis dictionary
        """
        if not context_messages:
            return {'topics': [], 'themes': [], 'keywords': []}
        
        # Combine all text for analysis
        all_text = []
        for msg in context_messages:
            if msg.get('input'):
                all_text.append(msg['input'])
            if msg.get('output'):
                all_text.append(msg['output'])
        
        combined_text = ' '.join(all_text).lower()
        
        # Simple keyword extraction (could be enhanced with NLP)
        words = combined_text.split()
        word_freq = {}
        
        # Count word frequency, excluding common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that',
            'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
            'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
            'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'when',
            'where', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'can', 'may', 'might', 'must'
        }
        
        for word in words:
            # Clean word (remove punctuation)
            cleaned_word = ''.join(c for c in word if c.isalnum())
            if len(cleaned_word) > 3 and cleaned_word not in stop_words:
                word_freq[cleaned_word] = word_freq.get(cleaned_word, 0) + 1
        
        # Get top keywords
        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        keywords = [word for word, count in top_keywords]
        
        # Identify potential themes based on keyword clusters
        themes = await self._identify_themes(keywords, combined_text)
        
        return {
            'keywords': keywords,
            'keyword_frequencies': dict(top_keywords),
            'themes': themes,
            'text_length': len(combined_text),
            'unique_words': len(word_freq),
            'total_words': len(words)
        }
    
    async def _identify_themes(self, keywords: List[str], text: str) -> List[str]:
        """
        Identify conversation themes based on keywords and content.
        
        Args:
            keywords: Top keywords from conversation
            text: Combined conversation text
            
        Returns:
            List of identified themes
        """
        themes = []
        
        # Define theme patterns (could be enhanced with ML)
        theme_patterns = {
            'technical': ['code', 'programming', 'software', 'development', 'bug', 'error', 'function', 'api'],
            'business': ['strategy', 'planning', 'revenue', 'customer', 'market', 'sales', 'growth'],
            'support': ['help', 'problem', 'issue', 'solution', 'fix', 'troubleshoot', 'question'],
            'educational': ['learn', 'explain', 'understand', 'example', 'tutorial', 'guide', 'how'],
            'creative': ['design', 'creative', 'art', 'visual', 'aesthetic', 'style', 'inspiration'],
            'data': ['data', 'analysis', 'report', 'statistics', 'metrics', 'database', 'query']
        }
        
        for theme, patterns in theme_patterns.items():
            matches = sum(1 for pattern in patterns if pattern in text)
            if matches >= 2:  # Require multiple keyword matches
                themes.append(theme)
        
        return themes
    
    async def _analyze_conversation_quality(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze conversation quality metrics.
        
        Args:
            analysis_data: Message analysis from count function
            
        Returns:
            Quality metrics dictionary
        """
        user_messages = analysis_data.get('user_messages', 0)
        assistant_messages = analysis_data.get('assistant_messages', 0)
        conversation_turns = analysis_data.get('conversation_turns', 0)
        avg_length = analysis_data.get('average_message_length', 0)
        total_messages = user_messages + assistant_messages
        
        # Calculate quality scores (0-100)
        engagement_score = min(100, conversation_turns * 20)  # Max at 5 turns
        balance_score = 0
        
        if total_messages > 0:
            # Ideal ratio is roughly equal user/assistant messages
            balance_ratio = min(user_messages, assistant_messages) / max(user_messages, assistant_messages, 1)
            balance_score = balance_ratio * 100
        
        length_score = min(100, avg_length / 50 * 100)  # Target 50+ char average
        
        overall_score = (engagement_score + balance_score + length_score) / 3
        
        return {
            'overall_quality_score': round(overall_score, 1),
            'engagement_score': round(engagement_score, 1),
            'balance_score': round(balance_score, 1),
            'message_length_score': round(length_score, 1),
            'quality_indicators': {
                'has_meaningful_turns': conversation_turns >= 2,
                'balanced_participation': balance_score >= 50,
                'sufficient_detail': avg_length >= 20,
                'good_engagement': conversation_turns >= 3
            }
        }


# Function factory for pipeline system
async def analyze_chat_context(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pipeline function entry point for analyzing chat context.
    
    Args:
        input_data: Data from previous pipeline node
        context: Pipeline execution context with services
        
    Returns:
        Function execution result dictionary
    """
    analyzer = ChatContextAnalyzer()
    return await analyzer.execute(input_data, context)


# Export function metadata for pipeline registration
FUNCTION_METADATA = {
    'id': 'analyze_chat_context',
    'name': 'Analyze Chat Context',
    'description': 'Analyzes conversation context to determine summarization needs and extract topics',
    'version': '1.0.0',
    'input_schema': {
        'type': 'object',
        'properties': {
            'output': {
                'type': 'object',
                'properties': {
                    'message_count': {'type': 'integer'},
                    'chat_id': {'type': 'string'},
                    'analysis': {'type': 'object'}
                }
            },
            'params': {
                'type': 'object',
                'properties': {
                    'min_message_threshold': {
                        'type': 'integer',
                        'default': 3,
                        'description': 'Minimum messages required for summarization'
                    },
                    'context_window': {
                        'type': 'integer',
                        'default': 20,
                        'description': 'Number of recent messages to analyze'
                    },
                    'analyze_topics': {
                        'type': 'boolean',
                        'default': True,
                        'description': 'Whether to perform topic analysis'
                    }
                }
            }
        }
    },
    'output_schema': {
        'type': 'object',
        'properties': {
            'should_summarize': {
                'type': 'boolean',
                'description': 'Whether conversation should be summarized'
            },
            'context_analysis': {
                'type': 'object',
                'description': 'Comprehensive context analysis and metadata'
            }
        }
    }
}