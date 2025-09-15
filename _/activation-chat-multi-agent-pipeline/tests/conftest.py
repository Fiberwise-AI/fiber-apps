"""
Pytest configuration and fixtures for activation-chat-multi-agent-pipeline tests.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
from typing import Dict, Any, List


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_fiber():
    """Mock FiberWise SDK instance."""
    fiber = MagicMock()
    fiber.agents = MagicMock()
    fiber.agents.get_activations = AsyncMock()
    return fiber


@pytest.fixture
def mock_llm_service():
    """Mock LLM service instance."""
    llm_service = MagicMock()
    llm_service.generate_completion = AsyncMock()
    return llm_service


@pytest.fixture
def sample_chat_id():
    """Sample chat ID for testing."""
    return "chat-12345-test"


@pytest.fixture
def sample_activations():
    """Sample activation data for testing."""
    base_time = datetime.utcnow()
    
    return [
        {
            'id': 'activation-1',
            'agent_id': 'ChatAgent',
            'agent_name': 'ChatAgent',
            'started_at': (base_time - timedelta(minutes=10)).isoformat(),
            'status': 'completed',
            'context': {'chat_id': 'chat-12345-test', 'role': 'user'},
            'input_data': {'prompt': 'Hello, how are you?'},
            'output_data': {'text': 'Hello! I\'m doing well, thank you for asking. How can I help you today?'}
        },
        {
            'id': 'activation-2',
            'agent_id': 'ChatAgent',
            'agent_name': 'ChatAgent',
            'started_at': (base_time - timedelta(minutes=8)).isoformat(),
            'status': 'completed',
            'context': {'chat_id': 'chat-12345-test', 'role': 'assistant'},
            'input_data': {'prompt': 'I need help with Python programming'},
            'output_data': {'text': 'I\'d be happy to help you with Python programming! What specific topic or problem would you like to work on?'}
        },
        {
            'id': 'activation-3',
            'agent_id': 'ChatSummarizerAgent',
            'agent_name': 'ChatSummarizerAgent',
            'started_at': (base_time - timedelta(minutes=6)).isoformat(),
            'status': 'completed',
            'context': {'chat_id': 'chat-12345-test', 'role': 'system'},
            'input_data': {'chat_id': 'chat-12345-test'},
            'output_data': {'text': 'Conversation summary generated'}
        },
        {
            'id': 'activation-4',
            'agent_id': 'ChatAgent',
            'agent_name': 'ChatAgent',
            'started_at': (base_time - timedelta(minutes=4)).isoformat(),
            'status': 'completed',
            'context': {'chat_id': 'chat-12345-test', 'role': 'user'},
            'input_data': {'prompt': 'Can you explain list comprehensions?'},
            'output_data': {'text': 'List comprehensions are a concise way to create lists in Python. Here\'s how they work...'}
        },
        {
            'id': 'activation-5',
            'agent_id': 'ChatAgent',
            'agent_name': 'ChatAgent',
            'started_at': (base_time - timedelta(minutes=2)).isoformat(),
            'status': 'completed',
            'context': {'chat_id': 'chat-12345-test', 'role': 'assistant'},
            'input_data': {'prompt': 'That\'s very helpful, thank you!'},
            'output_data': {'text': 'You\'re welcome! Feel free to ask if you have more Python questions.'}
        }
    ]


@pytest.fixture
def empty_activations():
    """Empty activation list for testing edge cases."""
    return []


@pytest.fixture
def pipeline_context(mock_fiber):
    """Mock pipeline execution context."""
    return {
        'fiber': mock_fiber,
        'chat_id': 'chat-12345-test',
        'execution_id': 'exec-12345',
        'pipeline_id': 'conditional-chat-summarization',
        'metadata': {
            'user_id': 'user-123',
            'app_id': 'activation-chat-multi-agent'
        }
    }


@pytest.fixture
def count_function_input():
    """Input data for count_chat_messages function."""
    return {
        'chat_id': 'chat-12345-test',
        'params': {
            'include_system_messages': False,
            'exclude_agent_types': ['ChatSummarizerAgent'],
            'min_message_length': 1
        }
    }


@pytest.fixture
def analyze_function_input():
    """Input data for analyze_chat_context function."""
    return {
        'output': {
            'message_count': 4,
            'chat_id': 'chat-12345-test',
            'analysis': {
                'user_messages': 2,
                'assistant_messages': 2,
                'conversation_turns': 2,
                'average_message_length': 45.5,
                'time_span': {
                    'duration_seconds': 480  # 8 minutes
                }
            }
        },
        'params': {
            'min_message_threshold': 3,
            'context_window': 20,
            'analyze_topics': True
        }
    }


@pytest.fixture
def llm_response():
    """Sample LLM service response."""
    return {
        'text': 'This is a sample LLM generated response for testing purposes.',
        'status': 'completed'
    }


@pytest.fixture
def agent_input_data():
    """Sample input data for agent testing."""
    return {
        'prompt': 'Hello, can you help me with Python?',
        'chat_id': 'chat-12345-test',
        'message_count': 5,
        'should_summarize': True,
        'context_analysis': {
            'conversation_context': [
                {'input': 'Hello', 'output': 'Hi there!'},
                {'input': 'How are you?', 'output': 'I\'m doing well, thanks!'}
            ]
        }
    }


@pytest.fixture
def summarizer_context_analysis():
    """Sample context analysis for summarizer agent."""
    return {
        'message_count': 5,
        'should_summarize': True,
        'conversation_context': [
            {
                'timestamp': '2024-01-01T10:00:00Z',
                'role': 'user',
                'input': 'Hello, how are you?',
                'output': '',
                'agent_id': 'ChatAgent'
            },
            {
                'timestamp': '2024-01-01T10:01:00Z',
                'role': 'assistant',
                'input': '',
                'output': 'Hello! I\'m doing well, thank you.',
                'agent_id': 'ChatAgent'
            },
            {
                'timestamp': '2024-01-01T10:02:00Z',
                'role': 'user',
                'input': 'Can you help with Python?',
                'output': '',
                'agent_id': 'ChatAgent'
            },
            {
                'timestamp': '2024-01-01T10:03:00Z',
                'role': 'assistant',
                'input': '',
                'output': 'Of course! I\'d be happy to help with Python programming.',
                'agent_id': 'ChatAgent'
            }
        ],
        'quality_metrics': {
            'overall_quality_score': 85.0,
            'engagement_score': 80.0,
            'balance_score': 90.0
        }
    }


class MockActivationResponse:
    """Helper class to simulate different API response formats."""
    
    @staticmethod
    def dict_format(activations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Return activations in dict format with 'activations' key."""
        return {'activations': activations}
    
    @staticmethod
    def items_format(activations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Return activations in dict format with 'items' key."""
        return {'items': activations}
    
    @staticmethod
    def list_format(activations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Return activations as direct list."""
        return activations
    
    @staticmethod
    def error_format() -> str:
        """Return error response as string."""
        return "Error: Unable to retrieve activations"


@pytest.fixture
def mock_activation_response():
    """Mock activation response helper."""
    return MockActivationResponse