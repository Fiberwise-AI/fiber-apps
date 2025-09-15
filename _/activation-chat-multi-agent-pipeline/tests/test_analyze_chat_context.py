"""
Tests for analyze_chat_context function.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

# Import the function to test
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from functions.analyze_chat_context import ChatContextAnalyzer, analyze_chat_context


class TestChatContextAnalyzer:
    """Test cases for ChatContextAnalyzer class."""
    
    @pytest.mark.asyncio
    async def test_execute_should_summarize_true(self, mock_fiber, pipeline_context, analyze_function_input, sample_activations, mock_activation_response):
        """Test context analysis that should trigger summarization."""
        # Setup mock to return conversation context
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(analyze_function_input, pipeline_context)
        
        # Verify result structure
        assert result['status'] == 'completed'
        assert 'output' in result
        assert result['output']['should_summarize'] is True
        assert 'context_analysis' in result['output']
        
        # Verify context analysis structure
        context_analysis = result['output']['context_analysis']
        assert 'message_count' in context_analysis
        assert 'should_summarize' in context_analysis
        assert 'summarization_reasons' in context_analysis
        assert 'quality_metrics' in context_analysis
        assert 'chat_metadata' in context_analysis
    
    @pytest.mark.asyncio
    async def test_execute_should_summarize_false(self, mock_fiber, pipeline_context, mock_activation_response):
        """Test context analysis that should not trigger summarization."""
        # Input with low message count
        input_data = {
            'output': {
                'message_count': 1,  # Below threshold
                'chat_id': 'test-chat',
                'analysis': {
                    'user_messages': 1,
                    'assistant_messages': 0,
                    'conversation_turns': 0,
                    'average_message_length': 5.0
                }
            },
            'params': {
                'min_message_threshold': 3,
                'analyze_topics': False
            }
        }
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(input_data, pipeline_context)
        
        assert result['status'] == 'completed'
        assert result['output']['should_summarize'] is False
        
        # Verify reasons explain why summarization was skipped
        reasons = result['output']['context_analysis']['summarization_reasons']
        assert any('below threshold' in reason for reason in reasons)
    
    @pytest.mark.asyncio
    async def test_execute_missing_chat_id(self, pipeline_context):
        """Test error handling when chat_id is missing."""
        input_data = {
            'output': {
                'message_count': 5
                # Missing chat_id
            }
        }
        context = {**pipeline_context}
        del context['chat_id']
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(input_data, context)
        
        assert result['status'] == 'failed'
        assert 'chat_id is required' in result['error']
    
    @pytest.mark.asyncio
    async def test_execute_api_error(self, mock_fiber, pipeline_context, analyze_function_input):
        """Test handling of API errors during context retrieval."""
        mock_fiber.agents.get_activations.side_effect = Exception("API failed")
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(analyze_function_input, pipeline_context)
        
        assert result['status'] == 'failed'
        assert 'API failed' in result['error']
    
    @pytest.mark.asyncio
    async def test_should_summarize_conversation_logic(self):
        """Test the summarization decision logic."""
        analyzer = ChatContextAnalyzer()
        
        # Test case: Should summarize (meets all criteria)
        should_summarize = await analyzer._should_summarize_conversation(
            message_count=5,
            analysis_data={
                'conversation_turns': 3,
                'average_message_length': 25.0,
                'time_span': {'duration_seconds': 300}  # 5 minutes
            },
            min_threshold=3
        )
        assert should_summarize is True
        
        # Test case: Should not summarize (low message count)
        should_summarize = await analyzer._should_summarize_conversation(
            message_count=2,
            analysis_data={
                'conversation_turns': 3,
                'average_message_length': 25.0,
                'time_span': {'duration_seconds': 300}
            },
            min_threshold=3
        )
        assert should_summarize is False
        
        # Test case: Should not summarize (too few turns)
        should_summarize = await analyzer._should_summarize_conversation(
            message_count=5,
            analysis_data={
                'conversation_turns': 1,
                'average_message_length': 25.0,
                'time_span': {'duration_seconds': 300}
            },
            min_threshold=3
        )
        assert should_summarize is False
        
        # Test case: Should not summarize (too short messages)
        should_summarize = await analyzer._should_summarize_conversation(
            message_count=5,
            analysis_data={
                'conversation_turns': 3,
                'average_message_length': 5.0,
                'time_span': {'duration_seconds': 300}
            },
            min_threshold=3
        )
        assert should_summarize is False
        
        # Test case: Should not summarize (too brief conversation)
        should_summarize = await analyzer._should_summarize_conversation(
            message_count=5,
            analysis_data={
                'conversation_turns': 3,
                'average_message_length': 25.0,
                'time_span': {'duration_seconds': 60}  # 1 minute
            },
            min_threshold=3
        )
        assert should_summarize is False
    
    @pytest.mark.asyncio
    async def test_get_summarization_reasons(self):
        """Test generation of summarization reasons."""
        analyzer = ChatContextAnalyzer()
        
        reasons = await analyzer._get_summarization_reasons(
            message_count=5,
            analysis_data={
                'conversation_turns': 3,
                'average_message_length': 25.0,
                'time_span': {'duration_seconds': 300}
            },
            min_threshold=3
        )
        
        assert len(reasons) >= 4
        assert any('exceeds threshold' in reason for reason in reasons)
        assert any('conversation turns' in reason for reason in reasons)
        assert any('message length' in reason for reason in reasons)
        assert any('duration' in reason for reason in reasons)
    
    @pytest.mark.asyncio
    async def test_get_recent_context_success(self, mock_fiber, sample_activations, mock_activation_response):
        """Test successful retrieval of recent conversation context."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        analyzer = ChatContextAnalyzer()
        context = await analyzer._get_recent_context(mock_fiber, 'test-chat', 10)
        
        assert context is not None
        assert isinstance(context, list)
        assert len(context) > 0
        
        # Verify context message structure
        for msg in context:
            assert 'timestamp' in msg
            assert 'agent_id' in msg
            assert 'role' in msg
            assert 'input' in msg
            assert 'output' in msg
            assert 'length' in msg
    
    @pytest.mark.asyncio
    async def test_get_recent_context_empty_response(self, mock_fiber, empty_activations, mock_activation_response):
        """Test handling of empty context response."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(empty_activations)
        
        analyzer = ChatContextAnalyzer()
        context = await analyzer._get_recent_context(mock_fiber, 'test-chat', 10)
        
        assert context is None
    
    @pytest.mark.asyncio
    async def test_get_recent_context_error_response(self, mock_fiber, mock_activation_response):
        """Test handling of error responses."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.error_format()
        
        analyzer = ChatContextAnalyzer()
        context = await analyzer._get_recent_context(mock_fiber, 'test-chat', 10)
        
        assert context is None
    
    @pytest.mark.asyncio
    async def test_analyze_topics_basic(self):
        """Test basic topic analysis."""
        analyzer = ChatContextAnalyzer()
        
        context_messages = [
            {
                'input': 'I need help with Python programming',
                'output': 'Sure! I can help you with Python development'
            },
            {
                'input': 'How do I create functions?',
                'output': 'Functions in Python are defined using the def keyword'
            },
            {
                'input': 'What about error handling?',
                'output': 'Python uses try-except blocks for error handling'
            }
        ]
        
        topic_analysis = await analyzer._analyze_topics(context_messages)
        
        assert 'keywords' in topic_analysis
        assert 'themes' in topic_analysis
        assert 'text_length' in topic_analysis
        assert 'unique_words' in topic_analysis
        
        # Should identify programming-related keywords
        keywords = topic_analysis['keywords']
        assert any('python' in keyword.lower() for keyword in keywords)
    
    @pytest.mark.asyncio
    async def test_analyze_topics_empty(self):
        """Test topic analysis with empty context."""
        analyzer = ChatContextAnalyzer()
        
        topic_analysis = await analyzer._analyze_topics([])
        
        assert topic_analysis['topics'] == []
        assert topic_analysis['themes'] == []
        assert topic_analysis['keywords'] == []
    
    @pytest.mark.asyncio
    async def test_identify_themes(self):
        """Test theme identification."""
        analyzer = ChatContextAnalyzer()
        
        # Technical theme
        keywords = ['python', 'programming', 'code', 'function', 'development']
        text = 'python programming code function development software api'
        themes = await analyzer._identify_themes(keywords, text)
        
        assert 'technical' in themes
        
        # Support theme
        keywords = ['help', 'problem', 'issue', 'solution']
        text = 'help problem issue solution troubleshoot question'
        themes = await analyzer._identify_themes(keywords, text)
        
        assert 'support' in themes
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_quality(self):
        """Test conversation quality analysis."""
        analyzer = ChatContextAnalyzer()
        
        analysis_data = {
            'user_messages': 3,
            'assistant_messages': 3,
            'conversation_turns': 3,
            'average_message_length': 50.0
        }
        
        quality_metrics = await analyzer._analyze_conversation_quality(analysis_data)
        
        assert 'overall_quality_score' in quality_metrics
        assert 'engagement_score' in quality_metrics
        assert 'balance_score' in quality_metrics
        assert 'message_length_score' in quality_metrics
        assert 'quality_indicators' in quality_metrics
        
        # Verify quality indicators
        indicators = quality_metrics['quality_indicators']
        assert 'has_meaningful_turns' in indicators
        assert 'balanced_participation' in indicators
        assert 'sufficient_detail' in indicators
        assert 'good_engagement' in indicators
        
        # Should have high quality scores for balanced conversation
        assert quality_metrics['overall_quality_score'] > 80
        assert quality_metrics['balance_score'] == 100  # Perfect balance
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_quality_poor(self):
        """Test quality analysis for poor conversation."""
        analyzer = ChatContextAnalyzer()
        
        analysis_data = {
            'user_messages': 5,
            'assistant_messages': 1,  # Unbalanced
            'conversation_turns': 1,  # Low engagement
            'average_message_length': 5.0  # Very short
        }
        
        quality_metrics = await analyzer._analyze_conversation_quality(analysis_data)
        
        # Should have lower quality scores
        assert quality_metrics['overall_quality_score'] < 50
        assert quality_metrics['balance_score'] < 50
        assert quality_metrics['engagement_score'] < 50


class TestPipelineFunctionWrapper:
    """Test the pipeline function wrapper."""
    
    @pytest.mark.asyncio
    async def test_analyze_chat_context_function(self, mock_fiber, pipeline_context, analyze_function_input, sample_activations, mock_activation_response):
        """Test the pipeline function wrapper."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        # Call the pipeline function wrapper
        result = await analyze_chat_context(analyze_function_input, pipeline_context)
        
        assert result['status'] == 'completed'
        assert 'output' in result
        assert 'should_summarize' in result['output']
        assert 'context_analysis' in result['output']


class TestParameterHandling:
    """Test parameter handling and configuration."""
    
    @pytest.mark.asyncio
    async def test_custom_parameters(self, mock_fiber, pipeline_context, mock_activation_response, sample_activations):
        """Test custom parameter configuration."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        # Custom parameters
        input_data = {
            'output': {
                'message_count': 2,  # Below default threshold
                'chat_id': 'test-chat',
                'analysis': {
                    'conversation_turns': 2,
                    'average_message_length': 25.0,
                    'time_span': {'duration_seconds': 300}
                }
            },
            'params': {
                'min_message_threshold': 1,  # Lower threshold
                'context_window': 5,  # Smaller context
                'analyze_topics': False  # Disable topic analysis
            }
        }
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(input_data, pipeline_context)
        
        assert result['status'] == 'completed'
        # Should summarize with lower threshold
        assert result['output']['should_summarize'] is True
        
        # Topic analysis should be None since it's disabled
        context_analysis = result['output']['context_analysis']
        assert context_analysis['topic_analysis'] is None
    
    @pytest.mark.asyncio
    async def test_default_parameters(self, mock_fiber, pipeline_context, mock_activation_response, sample_activations):
        """Test default parameter behavior."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        # Input without params (should use defaults)
        input_data = {
            'output': {
                'message_count': 5,
                'chat_id': 'test-chat',
                'analysis': {
                    'conversation_turns': 3,
                    'average_message_length': 25.0,
                    'time_span': {'duration_seconds': 300}
                }
            }
            # No params key
        }
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(input_data, pipeline_context)
        
        assert result['status'] == 'completed'
        assert result['output']['should_summarize'] is True
        
        # Should have used default parameters
        metadata = result['output']['function_metadata']
        assert 'parameters_used' in metadata


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    @pytest.mark.asyncio
    async def test_malformed_input_data(self, pipeline_context):
        """Test handling of malformed input data."""
        # Missing 'output' key
        input_data = {'params': {}}
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(input_data, pipeline_context)
        
        # Should handle gracefully and not crash
        assert result['status'] in ['completed', 'failed']
    
    @pytest.mark.asyncio
    async def test_context_retrieval_timeout(self, mock_fiber, pipeline_context, analyze_function_input):
        """Test handling of context retrieval timeout."""
        # Simulate timeout by raising exception
        mock_fiber.agents.get_activations.side_effect = TimeoutError("Request timeout")
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(analyze_function_input, pipeline_context)
        
        assert result['status'] == 'failed'
        assert 'timeout' in result['error'].lower()
    
    @pytest.mark.asyncio
    async def test_invalid_timestamp_format(self, mock_fiber, pipeline_context, analyze_function_input, mock_activation_response):
        """Test handling of invalid timestamp formats."""
        # Create activations with malformed timestamps
        invalid_activations = [
            {
                'id': 'test-1',
                'started_at': 'invalid-timestamp',
                'input_data': {'prompt': 'test'},
                'output_data': {'text': 'response'}
            }
        ]
        
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(invalid_activations)
        
        analyzer = ChatContextAnalyzer()
        result = await analyzer.execute(analyze_function_input, pipeline_context)
        
        # Should handle gracefully without crashing
        assert result['status'] == 'completed'