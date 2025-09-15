"""
Tests for ChatAgent and ChatSummarizerAgent classes.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

# Import the agents to test
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.chat_agent import ChatAgent
from agents.chat_summarizer_agent import ChatSummarizerAgent


class TestChatAgent:
    """Test cases for ChatAgent class."""
    
    @pytest.mark.asyncio
    async def test_run_agent_basic_response(self, mock_fiber, mock_llm_service, agent_input_data, llm_response):
        """Test basic agent response generation."""
        # Setup mocks
        mock_fiber.agents.get_activations.return_value = []  # No history
        mock_llm_service.generate_completion.return_value = llm_response
        
        agent = ChatAgent()
        result = await agent.run_agent(agent_input_data, mock_fiber, mock_llm_service)
        
        # Verify LLM service was called
        mock_llm_service.generate_completion.assert_called_once()
        
        # Verify result
        assert isinstance(result, str)
        assert len(result) > 0
        assert result == llm_response['text']
    
    @pytest.mark.asyncio
    async def test_run_agent_empty_prompt(self, mock_fiber, mock_llm_service):
        """Test handling of empty prompt."""
        input_data = {'prompt': '', 'chat_id': 'test-chat'}
        
        agent = ChatAgent()
        result = await agent.run_agent(input_data, mock_fiber, mock_llm_service)
        
        assert isinstance(result, str)
        assert 'ready to help' in result.lower()
        # LLM should not be called for empty prompts
        mock_llm_service.generate_completion.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_run_agent_missing_llm_service(self, mock_fiber, agent_input_data):
        """Test handling when LLM service is unavailable."""
        agent = ChatAgent()
        result = await agent.run_agent(agent_input_data, mock_fiber, None)
        
        assert isinstance(result, str)
        assert 'access to an LLM service' in result
    
    @pytest.mark.asyncio
    async def test_run_agent_with_conversation_history(self, mock_fiber, mock_llm_service, agent_input_data, llm_response, sample_activations, mock_activation_response):
        """Test agent response with conversation history."""
        # Setup conversation history
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        mock_llm_service.generate_completion.return_value = llm_response
        
        agent = ChatAgent()
        result = await agent.run_agent(agent_input_data, mock_fiber, mock_llm_service)
        
        # Verify LLM was called with context
        mock_llm_service.generate_completion.assert_called_once()
        call_args = mock_llm_service.generate_completion.call_args
        prompt = call_args.kwargs['prompt']
        
        # Should contain conversation context
        assert 'previous conversation' in prompt.lower() or 'context' in prompt.lower()
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    @pytest.mark.asyncio
    async def test_run_agent_llm_error(self, mock_fiber, mock_llm_service, agent_input_data):
        """Test handling of LLM service errors."""
        mock_fiber.agents.get_activations.return_value = []
        mock_llm_service.generate_completion.side_effect = Exception("LLM service unavailable")
        
        agent = ChatAgent()
        result = await agent.run_agent(agent_input_data, mock_fiber, mock_llm_service)
        
        assert isinstance(result, str)
        assert 'error while generating' in result.lower()
    
    @pytest.mark.asyncio
    async def test_get_conversation_context_success(self, mock_fiber, sample_activations, mock_activation_response):
        """Test successful conversation context retrieval."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        agent = ChatAgent()
        context = await agent._get_conversation_context(mock_fiber, 'test-chat')
        
        assert context is not None
        assert isinstance(context, str)
        assert 'User:' in context
        assert 'Assistant:' in context
    
    @pytest.mark.asyncio
    async def test_get_conversation_context_no_chat_id(self, mock_fiber):
        """Test context retrieval without chat ID."""
        agent = ChatAgent()
        context = await agent._get_conversation_context(mock_fiber, None)
        
        assert context is None
    
    @pytest.mark.asyncio
    async def test_get_conversation_context_api_error(self, mock_fiber):
        """Test context retrieval with API error."""
        mock_fiber.agents.get_activations.side_effect = Exception("API error")
        
        agent = ChatAgent()
        context = await agent._get_conversation_context(mock_fiber, 'test-chat')
        
        assert context is None
    
    @pytest.mark.asyncio
    async def test_build_system_prompt(self):
        """Test system prompt building."""
        agent = ChatAgent()
        
        # Test without context
        prompt = agent._build_system_prompt()
        assert 'helpful' in prompt.lower()
        assert 'intelligent' in prompt.lower()
        assert 'assistant' in prompt.lower()
        
        # Test with context
        context = "User: Hello\nAssistant: Hi there!"
        prompt_with_context = agent._build_system_prompt(context)
        assert 'helpful' in prompt_with_context.lower()
        assert 'previous conversation' in prompt_with_context.lower()
        assert context in prompt_with_context
    
    @pytest.mark.asyncio
    async def test_generate_llm_response_success(self, mock_llm_service, llm_response):
        """Test successful LLM response generation."""
        mock_llm_service.generate_completion.return_value = llm_response
        
        agent = ChatAgent()
        result = await agent._generate_llm_response(
            mock_llm_service, 
            "System prompt",
            "User message"
        )
        
        assert result == llm_response['text']
        mock_llm_service.generate_completion.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_llm_response_with_assistant_prefix(self, mock_llm_service):
        """Test LLM response with 'Assistant:' prefix removal."""
        llm_response = {'text': 'Assistant: This is the response text'}
        mock_llm_service.generate_completion.return_value = llm_response
        
        agent = ChatAgent()
        result = await agent._generate_llm_response(
            mock_llm_service,
            "System prompt", 
            "User message"
        )
        
        assert result == "This is the response text"  # Prefix should be removed
    
    @pytest.mark.asyncio
    async def test_generate_llm_response_invalid_format(self, mock_llm_service):
        """Test handling of invalid LLM response format."""
        mock_llm_service.generate_completion.return_value = "Invalid string response"
        
        agent = ChatAgent()
        result = await agent._generate_llm_response(
            mock_llm_service,
            "System prompt",
            "User message"
        )
        
        assert 'unexpected response format' in result.lower()
    
    @pytest.mark.asyncio
    async def test_generate_llm_response_missing_text(self, mock_llm_service):
        """Test handling of LLM response missing text field."""
        mock_llm_service.generate_completion.return_value = {'status': 'completed'}  # Missing 'text'
        
        agent = ChatAgent()
        result = await agent._generate_llm_response(
            mock_llm_service,
            "System prompt",
            "User message"
        )
        
        assert 'incomplete response' in result.lower()


class TestChatSummarizerAgent:
    """Test cases for ChatSummarizerAgent class."""
    
    @pytest.mark.asyncio
    async def test_run_agent_successful_analysis(self, mock_fiber, mock_llm_service, sample_activations, mock_activation_response, llm_response):
        """Test successful chat analysis and summarization."""
        # Setup mocks
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        mock_llm_service.generate_completion.return_value = llm_response
        
        input_data = {'chat_id': 'test-chat'}
        
        agent = ChatSummarizerAgent()
        result = await agent.run_agent(input_data, mock_fiber, mock_llm_service)
        
        # Verify successful result structure
        assert result['status'] == 'success'
        assert 'analysis' in result
        assert 'summary' in result['analysis']
        assert 'insights' in result['analysis']
        assert 'topics' in result['analysis']
        assert 'statistics' in result['analysis']
        
        # Verify message filtering worked (should exclude ChatSummarizerAgent messages)
        assert result['analysis']['message_count'] == 4  # 5 total - 1 summarizer
    
    @pytest.mark.asyncio
    async def test_run_agent_missing_chat_id(self, mock_fiber, mock_llm_service):
        """Test error handling when chat_id is missing."""
        input_data = {}  # No chat_id
        
        agent = ChatSummarizerAgent()
        result = await agent.run_agent(input_data, mock_fiber, mock_llm_service)
        
        assert result['status'] == 'error'
        assert 'chat_id is required' in result['error']
    
    @pytest.mark.asyncio
    async def test_run_agent_no_conversation_history(self, mock_fiber, mock_llm_service, empty_activations, mock_activation_response):
        """Test handling of empty conversation history."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(empty_activations)
        
        input_data = {'chat_id': 'test-chat'}
        
        agent = ChatSummarizerAgent()
        result = await agent.run_agent(input_data, mock_fiber, mock_llm_service)
        
        assert result['status'] == 'error'
        assert 'No conversation history found' in result['error']
    
    @pytest.mark.asyncio
    async def test_run_agent_only_summarizer_messages(self, mock_fiber, mock_llm_service, mock_activation_response):
        """Test handling when chat contains only summarizer messages."""
        # Create activations with only summarizer messages
        summarizer_only = [
            {
                'id': 'activation-1',
                'agent_id': 'ChatSummarizerAgent',
                'agent_name': 'ChatSummarizerAgent',
                'input_data': {'chat_id': 'test-chat'},
                'output_data': {'text': 'Summary generated'},
                'context': {'role': 'system'}
            }
        ]
        
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(summarizer_only)
        
        input_data = {'chat_id': 'test-chat'}
        
        agent = ChatSummarizerAgent()
        result = await agent.run_agent(input_data, mock_fiber, mock_llm_service)
        
        assert result['status'] == 'error'
        assert 'only summarizer activations' in result['error']
    
    @pytest.mark.asyncio
    async def test_run_agent_api_error(self, mock_fiber, mock_llm_service):
        """Test handling of API errors."""
        mock_fiber.agents.get_activations.side_effect = Exception("API connection failed")
        
        input_data = {'chat_id': 'test-chat'}
        
        agent = ChatSummarizerAgent()
        result = await agent.run_agent(input_data, mock_fiber, mock_llm_service)
        
        assert result['status'] == 'error'
        assert 'API connection failed' in result['error']
    
    @pytest.mark.asyncio
    async def test_get_chat_history_success(self, mock_fiber, sample_activations, mock_activation_response):
        """Test successful chat history retrieval."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        agent = ChatSummarizerAgent()
        history = await agent._get_chat_history(mock_fiber, 'test-chat')
        
        assert isinstance(history, list)
        assert len(history) == len(sample_activations)
        
        # Verify message structure
        for msg in history:
            assert 'id' in msg
            assert 'chat_id' in msg
            assert 'agent_id' in msg
            assert 'input' in msg
            assert 'output' in msg
    
    @pytest.mark.asyncio
    async def test_get_chat_history_different_response_formats(self, mock_fiber, sample_activations, mock_activation_response):
        """Test handling of different API response formats."""
        # Test dict format with 'activations' key
        mock_fiber.agents.get_activations.return_value = mock_activation_response.dict_format(sample_activations)
        
        agent = ChatSummarizerAgent()
        history = await agent._get_chat_history(mock_fiber, 'test-chat')
        
        assert len(history) == len(sample_activations)
        
        # Test dict format with 'items' key
        mock_fiber.agents.get_activations.return_value = mock_activation_response.items_format(sample_activations)
        
        history = await agent._get_chat_history(mock_fiber, 'test-chat')
        
        assert len(history) == len(sample_activations)
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_structure(self):
        """Test conversation structure analysis."""
        sample_messages = [
            {'role': 'user', 'input': 'Hello', 'output': ''},
            {'role': 'assistant', 'input': '', 'output': 'Hi there!'},
            {'role': 'user', 'input': 'How are you?', 'output': ''},
            {'role': 'assistant', 'input': '', 'output': 'I am doing well!'}
        ]
        
        agent = ChatSummarizerAgent()
        stats = await agent._analyze_conversation_structure(sample_messages)
        
        assert stats['total_messages'] == 4
        assert stats['user_messages'] == 2
        assert stats['assistant_messages'] == 2
        assert stats['conversation_turns'] == 2  # Two user->assistant pairs
    
    @pytest.mark.asyncio
    async def test_generate_conversation_summary(self, mock_llm_service, llm_response):
        """Test conversation summary generation."""
        mock_llm_service.generate_completion.return_value = llm_response
        
        chat_history = [
            {'input': 'Hello', 'output': 'Hi there!'},
            {'input': 'How can you help?', 'output': 'I can assist with many tasks'}
        ]
        
        agent = ChatSummarizerAgent()
        summary = await agent._generate_conversation_summary(mock_llm_service, chat_history)
        
        assert summary == llm_response['text']
        mock_llm_service.generate_completion.assert_called_once()
        
        # Verify prompt contains conversation history
        call_args = mock_llm_service.generate_completion.call_args
        prompt = call_args.args[0] if call_args.args else call_args.kwargs['prompt']
        assert 'Hello' in prompt
        assert 'Hi there!' in prompt
    
    @pytest.mark.asyncio
    async def test_generate_conversation_summary_llm_error(self, mock_llm_service):
        """Test summary generation with LLM error."""
        mock_llm_service.generate_completion.side_effect = Exception("LLM failed")
        
        chat_history = [{'input': 'Hello', 'output': 'Hi'}]
        
        agent = ChatSummarizerAgent()
        summary = await agent._generate_conversation_summary(mock_llm_service, chat_history)
        
        assert 'Error generating summary' in summary
    
    @pytest.mark.asyncio
    async def test_extract_conversation_insights(self, mock_llm_service):
        """Test conversation insights extraction."""
        llm_response = {
            'text': '''- The user is learning Python programming
- Good engagement and question-asking
- Technical discussion with practical examples
- User shows curiosity about advanced topics'''
        }
        mock_llm_service.generate_completion.return_value = llm_response
        
        chat_history = [
            {'input': 'I want to learn Python', 'output': 'Great choice!'},
            {'input': 'What are functions?', 'output': 'Functions are reusable code blocks'}
        ]
        
        agent = ChatSummarizerAgent()
        insights = await agent._extract_conversation_insights(mock_llm_service, chat_history)
        
        assert isinstance(insights, list)
        assert len(insights) > 0
        assert any('Python programming' in insight for insight in insights)
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_topics(self, mock_llm_service):
        """Test conversation topics analysis."""
        llm_response = {
            'text': '''[
                {"topic": "Python Programming", "description": "Learning Python basics", "coverage": 60},
                {"topic": "Functions", "description": "Understanding Python functions", "coverage": 40}
            ]'''
        }
        mock_llm_service.generate_completion.return_value = llm_response
        
        chat_history = [
            {'input': 'I want to learn Python', 'output': 'Great!'},
            {'input': 'What are functions?', 'output': 'Functions are code blocks'}
        ]
        
        agent = ChatSummarizerAgent()
        topics = await agent._analyze_conversation_topics(mock_llm_service, chat_history)
        
        assert isinstance(topics, list)
        assert len(topics) == 2
        assert topics[0]['topic'] == 'Python Programming'
        assert topics[1]['topic'] == 'Functions'
    
    @pytest.mark.asyncio
    async def test_analyze_conversation_topics_invalid_json(self, mock_llm_service):
        """Test topics analysis with invalid JSON response."""
        llm_response = {'text': 'Invalid JSON response'}
        mock_llm_service.generate_completion.return_value = llm_response
        
        chat_history = [{'input': 'Hello', 'output': 'Hi'}]
        
        agent = ChatSummarizerAgent()
        topics = await agent._analyze_conversation_topics(mock_llm_service, chat_history)
        
        assert isinstance(topics, list)
        assert len(topics) == 1
        assert topics[0]['topic'] == 'General Discussion'
    
    @pytest.mark.asyncio
    async def test_format_conversation_for_llm(self):
        """Test conversation formatting for LLM processing."""
        chat_history = [
            {'input': 'Hello there', 'output': 'Hi! How can I help?'},
            {'input': 'I need Python help', 'output': 'Sure, I can help with Python'},
            {'input': '', 'output': 'What specifically?'}  # Empty input
        ]
        
        agent = ChatSummarizerAgent()
        formatted = agent._format_conversation_for_llm(chat_history)
        
        assert 'User: Hello there' in formatted
        assert 'Assistant: Hi! How can I help?' in formatted
        assert 'User: I need Python help' in formatted
        assert 'Assistant: Sure, I can help with Python' in formatted
        assert 'Assistant: What specifically?' in formatted
    
    @pytest.mark.asyncio
    async def test_calculate_conversation_span(self):
        """Test conversation time span calculation."""
        chat_history = [
            {'timestamp': '2024-01-01T10:00:00Z'},
            {'timestamp': '2024-01-01T10:05:00Z'},
            {'timestamp': '2024-01-01T10:10:00Z'}
        ]
        
        agent = ChatSummarizerAgent()
        span = agent._calculate_conversation_span(chat_history)
        
        assert span['duration_seconds'] == 600  # 10 minutes
        assert span['start_time'] == '2024-01-01T10:00:00Z'
        assert span['end_time'] == '2024-01-01T10:10:00Z'
        assert '10 minute' in span['duration_formatted']
    
    @pytest.mark.asyncio
    async def test_format_duration(self):
        """Test duration formatting."""
        agent = ChatSummarizerAgent()
        
        # Test seconds
        assert 'seconds' in agent._format_duration(45)
        
        # Test minutes
        assert 'minute' in agent._format_duration(120)  # 2 minutes
        
        # Test hours
        assert 'hour' in agent._format_duration(3660)  # 1 hour 1 minute
    
    @pytest.mark.asyncio
    async def test_identify_participants(self):
        """Test participant identification."""
        chat_history = [
            {'role': 'user', 'agent_id': None},
            {'role': 'assistant', 'agent_id': 'ChatAgent'},
            {'role': 'system', 'agent_id': 'SystemAgent'},
            {'role': 'assistant', 'agent_id': 'ChatSummarizerAgent'}
        ]
        
        agent = ChatSummarizerAgent()
        participants = agent._identify_participants(chat_history)
        
        assert 'User' in participants
        assert 'Assistant (ChatAgent)' in participants
        assert 'System' in participants
        assert 'Assistant (ChatSummarizerAgent)' in participants