"""
Tests for count_chat_messages function.
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime

# Import the function to test
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from functions.count_chat_messages import ChatMessageCounter, count_chat_messages


class TestChatMessageCounter:
    """Test cases for ChatMessageCounter class."""
    
    @pytest.mark.asyncio
    async def test_execute_successful_count(self, mock_fiber, pipeline_context, count_function_input, sample_activations, mock_activation_response):
        """Test successful message counting."""
        # Setup mock response
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        # Create counter and execute
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, pipeline_context)
        
        # Verify result structure
        assert result['status'] == 'completed'
        assert 'output' in result
        assert 'message_count' in result['output']
        assert 'analysis' in result['output']
        assert 'function_metadata' in result['output']
        
        # Verify message count (should exclude ChatSummarizerAgent)
        assert result['output']['message_count'] == 4  # 5 total - 1 summarizer
        assert result['output']['total_messages_retrieved'] == 5
        assert result['output']['filtered_count'] == 1
        
        # Verify analysis structure
        analysis = result['output']['analysis']
        assert 'user_messages' in analysis
        assert 'assistant_messages' in analysis
        assert 'conversation_turns' in analysis
        assert 'average_message_length' in analysis
    
    @pytest.mark.asyncio
    async def test_execute_empty_response(self, mock_fiber, pipeline_context, count_function_input, empty_activations, mock_activation_response):
        """Test handling of empty activation response."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(empty_activations)
        
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, pipeline_context)
        
        assert result['status'] == 'completed'
        assert result['output']['message_count'] == 0
        assert result['output']['total_messages_retrieved'] == 0
    
    @pytest.mark.asyncio
    async def test_execute_missing_chat_id(self, pipeline_context):
        """Test error handling when chat_id is missing."""
        input_data = {'params': {}}
        context = {**pipeline_context}
        del context['chat_id']  # Remove chat_id from context
        
        counter = ChatMessageCounter()
        result = await counter.execute(input_data, context)
        
        assert result['status'] == 'failed'
        assert 'error' in result
        assert 'chat_id is required' in result['error']
    
    @pytest.mark.asyncio
    async def test_execute_missing_fiber_sdk(self, count_function_input):
        """Test error handling when FiberWise SDK is not available."""
        context = {'chat_id': 'test-chat'}  # Missing fiber key
        
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, context)
        
        assert result['status'] == 'failed'
        assert 'FiberWise SDK not available' in result['error']
    
    @pytest.mark.asyncio
    async def test_execute_api_error(self, mock_fiber, pipeline_context, count_function_input):
        """Test handling of API errors."""
        mock_fiber.agents.get_activations.side_effect = Exception("API connection failed")
        
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, pipeline_context)
        
        assert result['status'] == 'failed'
        assert 'API connection failed' in result['error']
    
    @pytest.mark.asyncio
    async def test_different_response_formats(self, mock_fiber, pipeline_context, count_function_input, sample_activations, mock_activation_response):
        """Test handling of different API response formats."""
        # Test dict format with 'activations' key
        mock_fiber.agents.get_activations.return_value = mock_activation_response.dict_format(sample_activations)
        
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, pipeline_context)
        
        assert result['status'] == 'completed'
        assert result['output']['message_count'] == 4
        
        # Test dict format with 'items' key
        mock_fiber.agents.get_activations.return_value = mock_activation_response.items_format(sample_activations)
        
        result = await counter.execute(count_function_input, pipeline_context)
        
        assert result['status'] == 'completed'
        assert result['output']['message_count'] == 4
    
    @pytest.mark.asyncio
    async def test_string_response_handling(self, mock_fiber, pipeline_context, count_function_input, mock_activation_response):
        """Test handling of string error responses."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.error_format()
        
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, pipeline_context)
        
        assert result['status'] == 'completed'
        assert result['output']['message_count'] == 0
    
    @pytest.mark.asyncio
    async def test_filtering_parameters(self, mock_fiber, pipeline_context, sample_activations, mock_activation_response):
        """Test various filtering parameters."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        # Test including system messages
        input_data = {
            'chat_id': 'test-chat',
            'params': {
                'include_system_messages': True,
                'exclude_agent_types': [],
                'min_message_length': 1
            }
        }
        
        counter = ChatMessageCounter()
        result = await counter.execute(input_data, pipeline_context)
        
        # Should include all messages now
        assert result['output']['message_count'] == 5
        
        # Test minimum message length filtering
        input_data['params']['min_message_length'] = 100  # Very high threshold
        
        result = await counter.execute(input_data, pipeline_context)
        
        # Should filter out short messages
        assert result['output']['message_count'] < 5
    
    @pytest.mark.asyncio
    async def test_message_analysis(self, mock_fiber, pipeline_context, count_function_input, sample_activations, mock_activation_response):
        """Test message pattern analysis."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        counter = ChatMessageCounter()
        result = await counter.execute(count_function_input, pipeline_context)
        
        analysis = result['output']['analysis']
        
        # Verify analysis fields
        assert isinstance(analysis['conversation_turns'], int)
        assert isinstance(analysis['average_message_length'], (int, float))
        assert 'time_span' in analysis
        assert 'most_active_agent' in analysis
        assert 'agent_distribution' in analysis
        
        # Verify time span calculation
        if analysis['time_span']:
            assert 'start' in analysis['time_span']
            assert 'end' in analysis['time_span']
            assert 'duration_seconds' in analysis['time_span']


class TestPipelineFunctionWrapper:
    """Test the pipeline function wrapper."""
    
    @pytest.mark.asyncio
    async def test_count_chat_messages_function(self, mock_fiber, pipeline_context, count_function_input, sample_activations, mock_activation_response):
        """Test the pipeline function wrapper."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        # Call the pipeline function wrapper
        result = await count_chat_messages(count_function_input, pipeline_context)
        
        assert result['status'] == 'completed'
        assert 'output' in result
        assert 'message_count' in result['output']


class TestMessageFiltering:
    """Test message filtering logic."""
    
    @pytest.mark.asyncio
    async def test_filter_messages_basic(self):
        """Test basic message filtering."""
        counter = ChatMessageCounter()
        
        messages = [
            {
                'role': 'user',
                'agent_id': 'ChatAgent',
                'input_data': {'prompt': 'Hello'},
                'output_data': {'text': 'Hi there'},
            },
            {
                'role': 'system',
                'agent_id': 'SystemAgent',
                'input_data': {'prompt': 'System message'},
                'output_data': {'text': 'System response'},
            },
            {
                'role': 'assistant',
                'agent_id': 'ChatSummarizerAgent',
                'input_data': {'prompt': 'Summarize'},
                'output_data': {'text': 'Summary'},
            }
        ]
        
        # Filter excluding system messages and summarizer agent
        filtered = await counter._filter_messages(
            messages, 
            include_system_messages=False,
            exclude_agent_types=['ChatSummarizerAgent'],
            min_message_length=1
        )
        
        assert len(filtered) == 1
        assert filtered[0]['agent_id'] == 'ChatAgent'
    
    @pytest.mark.asyncio
    async def test_filter_messages_length_threshold(self):
        """Test message length filtering."""
        counter = ChatMessageCounter()
        
        messages = [
            {
                'role': 'user',
                'agent_id': 'ChatAgent',
                'input_data': {'prompt': 'Hi'},  # Short message
                'output_data': {'text': 'Hello'},
            },
            {
                'role': 'user',
                'agent_id': 'ChatAgent',
                'input_data': {'prompt': 'This is a much longer message that should pass the length filter'},
                'output_data': {'text': 'This is also a longer response'},
            }
        ]
        
        # Filter with high length threshold
        filtered = await counter._filter_messages(
            messages,
            include_system_messages=True,
            exclude_agent_types=[],
            min_message_length=50
        )
        
        assert len(filtered) == 1
        assert 'longer message' in filtered[0]['processed_input_text']


class TestAnalysisPatterns:
    """Test message pattern analysis."""
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_structure_empty(self):
        """Test analysis with empty message list."""
        counter = ChatMessageCounter()
        
        result = await counter._analyze_message_patterns([])
        
        assert result['user_messages'] == 0
        assert result['assistant_messages'] == 0
        assert result['conversation_turns'] == 0
        assert result['average_message_length'] == 0
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_structure_basic(self):
        """Test basic conversation analysis."""
        counter = ChatMessageCounter()
        
        messages = [
            {
                'role': 'user',
                'message_length': 20,
                'started_at': '2024-01-01T10:00:00Z'
            },
            {
                'role': 'assistant',
                'message_length': 30,
                'started_at': '2024-01-01T10:01:00Z'
            },
            {
                'role': 'user',
                'message_length': 25,
                'started_at': '2024-01-01T10:02:00Z'
            }
        ]
        
        result = await counter._analyze_message_patterns(messages)
        
        assert result['user_messages'] == 2
        assert result['assistant_messages'] == 1
        assert result['conversation_turns'] == 1  # One user→assistant turn
        assert result['average_message_length'] == 25.0  # (20+30+25)/3
    
    @pytest.mark.asyncio
    async def test_time_span_calculation(self):
        """Test conversation time span calculation."""
        counter = ChatMessageCounter()
        
        messages = [
            {'started_at': '2024-01-01T10:00:00Z', 'role': 'user', 'message_length': 10},
            {'started_at': '2024-01-01T10:05:00Z', 'role': 'assistant', 'message_length': 15},
        ]
        
        result = await counter._analyze_message_patterns(messages)
        
        assert result['time_span'] is not None
        assert result['time_span']['duration_seconds'] == 300  # 5 minutes
        assert result['time_span']['start'] == '2024-01-01T10:00:00Z'
        assert result['time_span']['end'] == '2024-01-01T10:05:00Z'