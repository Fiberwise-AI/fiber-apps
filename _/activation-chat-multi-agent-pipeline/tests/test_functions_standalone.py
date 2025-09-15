"""
Standalone tests for pipeline functions without SDK dependencies.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
import json


class MockChatMessageCounter:
    """Standalone version of ChatMessageCounter for testing."""
    
    def __init__(self):
        self.function_id = "count_chat_messages"
        self.version = "1.0.0"
    
    async def execute(self, input_data, context):
        try:
            chat_id = input_data.get('chat_id') or context.get('chat_id')
            params = input_data.get('params', {})
            
            if not chat_id:
                raise ValueError("chat_id is required")
            
            fiber = context.get('fiber')
            if not fiber:
                raise RuntimeError("FiberWise SDK not available")
            
            # Get messages
            messages = await self._get_chat_messages(fiber, chat_id)
            
            # Filter messages
            filtered = await self._filter_messages(
                messages,
                params.get('include_system_messages', False),
                params.get('exclude_agent_types', ['ChatSummarizerAgent']),
                params.get('min_message_length', 1)
            )
            
            # Analyze patterns
            analysis = await self._analyze_message_patterns(filtered)
            
            return {
                'output': {
                    'message_count': len(filtered),
                    'total_messages_retrieved': len(messages),
                    'filtered_count': len(messages) - len(filtered),
                    'chat_id': chat_id,
                    'analysis': analysis,
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat(),
                        'parameters_used': params
                    }
                },
                'status': 'completed'
            }
        except Exception as e:
            return {
                'output': {
                    'message_count': 0,
                    'error': str(e),
                    'chat_id': input_data.get('chat_id', 'unknown')
                },
                'status': 'failed',
                'error': str(e)
            }
    
    async def _get_chat_messages(self, fiber, chat_id):
        response = await fiber.agents.get_activations(
            context={"chat_id": chat_id},
            limit=100,
            sort_by="started_at",
            sort_dir="asc"
        )
        
        if isinstance(response, str) or not response:
            return []
        
        activations = response
        if isinstance(response, dict):
            activations = response.get('activations', response.get('items', []))
        
        if not isinstance(activations, list):
            return []
        
        messages = []
        for activation in activations:
            if not isinstance(activation, dict):
                continue
            
            message = {
                'id': activation.get('id'),
                'chat_id': chat_id,
                'agent_id': activation.get('agent_id'),
                'agent_name': activation.get('agent_name'),
                'input_data': activation.get('input_data', {}),
                'output_data': activation.get('output_data', {}),
                'role': activation.get('context', {}).get('role', 'unknown'),
                'started_at': activation.get('started_at')
            }
            messages.append(message)
        
        return messages
    
    async def _filter_messages(self, messages, include_system, exclude_types, min_length):
        filtered = []
        
        for msg in messages:
            # Skip system messages if not included
            if not include_system and msg.get('role') == 'system':
                continue
            
            # Skip excluded agent types
            agent_id = msg.get('agent_id', '') or ''
            agent_name = msg.get('agent_name', '') or ''
            
            should_exclude = False
            for exclude_type in exclude_types:
                if (exclude_type in agent_id or exclude_type in agent_name):
                    should_exclude = True
                    break
            
            if should_exclude:
                continue
            
            # Check message length
            input_data = msg.get('input_data', {})
            output_data = msg.get('output_data', {})
            
            input_text = input_data.get('prompt', '') if isinstance(input_data, dict) else str(input_data)
            output_text = output_data.get('text', '') if isinstance(output_data, dict) else str(output_data)
            
            total_length = len(str(input_text)) + len(str(output_text))
            if total_length < min_length:
                continue
            
            msg['processed_input_text'] = input_text
            msg['processed_output_text'] = output_text
            msg['message_length'] = total_length
            
            filtered.append(msg)
        
        return filtered
    
    async def _analyze_message_patterns(self, messages):
        if not messages:
            return {
                'user_messages': 0,
                'assistant_messages': 0,
                'conversation_turns': 0,
                'average_message_length': 0
            }
        
        user_messages = len([m for m in messages if m.get('role') == 'user'])
        assistant_messages = len([m for m in messages if m.get('role') == 'assistant'])
        
        # Calculate conversation turns
        turns = 0
        for i in range(len(messages) - 1):
            if (messages[i].get('role') == 'user' and 
                messages[i + 1].get('role') == 'assistant'):
                turns += 1
        
        # Calculate average length
        total_length = sum(m.get('message_length', 0) for m in messages)
        avg_length = total_length / len(messages) if messages else 0
        
        return {
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'conversation_turns': turns,
            'average_message_length': round(avg_length, 2),
            'total_characters': total_length
        }


class MockChatContextAnalyzer:
    """Standalone version of ChatContextAnalyzer for testing."""
    
    def __init__(self):
        self.function_id = "analyze_chat_context"
        self.version = "1.0.0"
    
    async def execute(self, input_data, context):
        try:
            message_count = input_data.get('output', {}).get('message_count', 0)
            chat_id = input_data.get('output', {}).get('chat_id') or context.get('chat_id')
            analysis_data = input_data.get('output', {}).get('analysis', {})
            params = input_data.get('params', {})
            
            if not chat_id:
                raise ValueError("chat_id is required")
            
            min_threshold = params.get('min_message_threshold', 3)
            
            # Determine if should summarize
            should_summarize = await self._should_summarize_conversation(
                message_count, analysis_data, min_threshold
            )
            
            # Get reasons
            reasons = await self._get_summarization_reasons(
                message_count, analysis_data, min_threshold
            )
            
            # Analyze quality
            quality_metrics = await self._analyze_conversation_quality(analysis_data)
            
            context_analysis = {
                'message_count': message_count,
                'should_summarize': should_summarize,
                'summarization_reasons': reasons,
                'quality_metrics': quality_metrics,
                'chat_metadata': {
                    'chat_id': chat_id,
                    'analysis_timestamp': datetime.utcnow().isoformat()
                }
            }
            
            return {
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
                'status': 'completed'
            }
        except Exception as e:
            return {
                'output': {
                    'should_summarize': False,
                    'error': str(e),
                    'chat_id': context.get('chat_id', 'unknown')
                },
                'status': 'failed',
                'error': str(e)
            }
    
    async def _should_summarize_conversation(self, count, analysis, threshold):
        if count < threshold:
            return False
        
        turns = analysis.get('conversation_turns', 0)
        if turns < 2:
            return False
        
        avg_length = analysis.get('average_message_length', 0)
        if avg_length < 10:
            return False
        
        return True
    
    async def _get_summarization_reasons(self, count, analysis, threshold):
        reasons = []
        
        if count >= threshold:
            reasons.append(f"Message count ({count}) exceeds threshold ({threshold})")
        else:
            reasons.append(f"Message count ({count}) below threshold ({threshold})")
        
        turns = analysis.get('conversation_turns', 0)
        if turns >= 2:
            reasons.append(f"Sufficient conversation turns ({turns})")
        else:
            reasons.append(f"Insufficient conversation turns ({turns})")
        
        return reasons
    
    async def _analyze_conversation_quality(self, analysis_data):
        user_msgs = analysis_data.get('user_messages', 0)
        assistant_msgs = analysis_data.get('assistant_messages', 0)
        turns = analysis_data.get('conversation_turns', 0)
        avg_length = analysis_data.get('average_message_length', 0)
        
        total_msgs = user_msgs + assistant_msgs
        
        engagement_score = min(100, turns * 20)
        balance_score = 0
        
        if total_msgs > 0:
            balance_ratio = min(user_msgs, assistant_msgs) / max(user_msgs, assistant_msgs, 1)
            balance_score = balance_ratio * 100
        
        length_score = min(100, avg_length / 50 * 100)
        overall_score = (engagement_score + balance_score + length_score) / 3
        
        return {
            'overall_quality_score': round(overall_score, 1),
            'engagement_score': round(engagement_score, 1),
            'balance_score': round(balance_score, 1),
            'message_length_score': round(length_score, 1)
        }


class TestStandaloneFunctions:
    """Test standalone function implementations."""
    
    @pytest.fixture
    def sample_activations(self):
        base_time = datetime.utcnow()
        return [
            {
                'id': 'activation-1',
                'agent_id': 'ChatAgent',
                'started_at': (base_time - timedelta(minutes=10)).isoformat(),
                'context': {'chat_id': 'test-chat', 'role': 'user'},
                'input_data': {'prompt': 'Hello'},
                'output_data': {'text': 'Hi there!'}
            },
            {
                'id': 'activation-2',
                'agent_id': 'ChatAgent',
                'started_at': (base_time - timedelta(minutes=8)).isoformat(),
                'context': {'chat_id': 'test-chat', 'role': 'assistant'},
                'input_data': {'prompt': 'How are you?'},
                'output_data': {'text': 'I am doing well, thanks!'}
            },
            {
                'id': 'activation-3',
                'agent_id': 'ChatSummarizerAgent',
                'started_at': (base_time - timedelta(minutes=6)).isoformat(),
                'context': {'chat_id': 'test-chat', 'role': 'system'},
                'input_data': {'chat_id': 'test-chat'},
                'output_data': {'text': 'Summary generated'}
            }
        ]
    
    @pytest.fixture
    def mock_fiber(self):
        fiber = MagicMock()
        fiber.agents = MagicMock()
        fiber.agents.get_activations = AsyncMock()
        return fiber
    
    @pytest.mark.asyncio
    async def test_count_chat_messages_success(self, mock_fiber, sample_activations):
        """Test successful message counting."""
        mock_fiber.agents.get_activations.return_value = sample_activations
        
        counter = MockChatMessageCounter()
        context = {'fiber': mock_fiber, 'chat_id': 'test-chat'}
        input_data = {
            'chat_id': 'test-chat',
            'params': {'exclude_agent_types': ['ChatSummarizerAgent']}
        }
        
        result = await counter.execute(input_data, context)
        
        assert result['status'] == 'completed'
        assert result['output']['message_count'] == 2  # Excluding summarizer
        assert result['output']['total_messages_retrieved'] == 3
        assert result['output']['chat_id'] == 'test-chat'
        
        # Verify analysis structure
        analysis = result['output']['analysis']
        assert 'user_messages' in analysis
        assert 'assistant_messages' in analysis
        assert 'conversation_turns' in analysis
    
    @pytest.mark.asyncio
    async def test_count_chat_messages_empty_response(self, mock_fiber):
        """Test handling of empty response."""
        mock_fiber.agents.get_activations.return_value = []
        
        counter = MockChatMessageCounter()
        context = {'fiber': mock_fiber, 'chat_id': 'test-chat'}
        input_data = {'chat_id': 'test-chat', 'params': {}}
        
        result = await counter.execute(input_data, context)
        
        assert result['status'] == 'completed'
        assert result['output']['message_count'] == 0
    
    @pytest.mark.asyncio
    async def test_count_chat_messages_missing_chat_id(self):
        """Test error handling for missing chat_id."""
        counter = MockChatMessageCounter()
        context = {}
        input_data = {'params': {}}
        
        result = await counter.execute(input_data, context)
        
        assert result['status'] == 'failed'
        assert 'chat_id is required' in result['error']
    
    @pytest.mark.asyncio
    async def test_count_chat_messages_api_error(self, mock_fiber):
        """Test API error handling."""
        mock_fiber.agents.get_activations.side_effect = Exception("API failed")
        
        counter = MockChatMessageCounter()
        context = {'fiber': mock_fiber, 'chat_id': 'test-chat'}
        input_data = {'chat_id': 'test-chat', 'params': {}}
        
        result = await counter.execute(input_data, context)
        
        assert result['status'] == 'failed'
        assert 'API failed' in result['error']
    
    @pytest.mark.asyncio
    async def test_analyze_chat_context_should_summarize(self):
        """Test context analysis that should trigger summarization."""
        analyzer = MockChatContextAnalyzer()
        context = {'chat_id': 'test-chat'}
        input_data = {
            'output': {
                'message_count': 5,
                'chat_id': 'test-chat',
                'analysis': {
                    'conversation_turns': 3,
                    'average_message_length': 25.0,
                    'user_messages': 3,
                    'assistant_messages': 2
                }
            },
            'params': {'min_message_threshold': 3}
        }
        
        result = await analyzer.execute(input_data, context)
        
        assert result['status'] == 'completed'
        assert result['output']['should_summarize'] is True
        
        # Verify context analysis structure
        context_analysis = result['output']['context_analysis']
        assert 'message_count' in context_analysis
        assert 'should_summarize' in context_analysis
        assert 'summarization_reasons' in context_analysis
        assert 'quality_metrics' in context_analysis
        assert 'chat_metadata' in context_analysis
    
    @pytest.mark.asyncio
    async def test_analyze_chat_context_should_not_summarize(self):
        """Test context analysis that should not trigger summarization."""
        analyzer = MockChatContextAnalyzer()
        context = {'chat_id': 'test-chat'}
        input_data = {
            'output': {
                'message_count': 1,  # Below threshold
                'chat_id': 'test-chat',
                'analysis': {
                    'conversation_turns': 0,
                    'average_message_length': 5.0
                }
            },
            'params': {'min_message_threshold': 3}
        }
        
        result = await analyzer.execute(input_data, context)
        
        assert result['status'] == 'completed'
        assert result['output']['should_summarize'] is False
        
        # Verify reasons explain why not
        reasons = result['output']['context_analysis']['summarization_reasons']
        assert any('below threshold' in reason for reason in reasons)
    
    @pytest.mark.asyncio
    async def test_message_filtering(self):
        """Test message filtering logic."""
        counter = MockChatMessageCounter()
        
        messages = [
            {
                'role': 'user',
                'agent_id': 'ChatAgent',
                'input_data': {'prompt': 'Hello'},
                'output_data': {'text': 'Hi'}
            },
            {
                'role': 'system',
                'agent_id': 'SystemAgent',
                'input_data': {'prompt': 'System'},
                'output_data': {'text': 'System response'}
            },
            {
                'role': 'assistant',
                'agent_id': 'ChatSummarizerAgent',
                'input_data': {'prompt': 'Summarize'},
                'output_data': {'text': 'Summary'}
            }
        ]
        
        # Filter excluding system and summarizer
        filtered = await counter._filter_messages(
            messages,
            include_system=False,
            exclude_types=['ChatSummarizerAgent'],
            min_length=1
        )
        
        assert len(filtered) == 1
        assert filtered[0]['agent_id'] == 'ChatAgent'
    
    @pytest.mark.asyncio
    async def test_conversation_analysis(self):
        """Test conversation pattern analysis."""
        counter = MockChatMessageCounter()
        
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
            }
        ]
        
        analysis = await counter._analyze_message_patterns(messages)
        
        assert analysis['user_messages'] == 1
        assert analysis['assistant_messages'] == 1
        assert analysis['conversation_turns'] == 1
        assert analysis['average_message_length'] == 25.0
    
    @pytest.mark.asyncio
    async def test_quality_metrics_calculation(self):
        """Test conversation quality metrics."""
        analyzer = MockChatContextAnalyzer()
        
        analysis_data = {
            'user_messages': 3,
            'assistant_messages': 3,
            'conversation_turns': 3,
            'average_message_length': 50.0
        }
        
        quality = await analyzer._analyze_conversation_quality(analysis_data)
        
        assert 'overall_quality_score' in quality
        assert 'engagement_score' in quality
        assert 'balance_score' in quality
        assert 'message_length_score' in quality
        
        # Should have high scores for balanced conversation
        assert quality['overall_quality_score'] > 80
        assert quality['balance_score'] == 100.0  # Perfect balance
    
    @pytest.mark.asyncio
    async def test_integration_data_flow(self, mock_fiber, sample_activations):
        """Test data flow between functions."""
        mock_fiber.agents.get_activations.return_value = sample_activations
        
        # Step 1: Count messages
        counter = MockChatMessageCounter()
        context = {'fiber': mock_fiber, 'chat_id': 'test-chat'}
        
        count_result = await counter.execute(
            {'chat_id': 'test-chat', 'params': {}},
            context
        )
        
        assert count_result['status'] == 'completed'
        
        # Step 2: Analyze using count result
        analyzer = MockChatContextAnalyzer()
        
        analyze_result = await analyzer.execute(
            {'output': count_result['output'], 'params': {}},
            context
        )
        
        assert analyze_result['status'] == 'completed'
        assert analyze_result['output']['message_count'] == count_result['output']['message_count']
        assert analyze_result['output']['chat_id'] == count_result['output']['chat_id']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])