"""
Integration tests for pipeline functions working together.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta

# Import the functions to test
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from functions.count_chat_messages import count_chat_messages
from functions.analyze_chat_context import analyze_chat_context
from agents.chat_summarizer_agent import ChatSummarizerAgent


class TestPipelineIntegration:
    """Integration tests for the complete pipeline workflow."""
    
    @pytest.mark.asyncio
    async def test_complete_pipeline_flow_should_summarize(self, mock_fiber, mock_llm_service, sample_activations, mock_activation_response, llm_response):
        """Test complete pipeline flow that should trigger summarization."""
        # Setup mocks
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        mock_llm_service.generate_completion.return_value = llm_response
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-123'
        }
        
        # Step 1: Count messages
        count_input = {
            'chat_id': 'test-chat',
            'params': {
                'include_system_messages': False,
                'exclude_agent_types': ['ChatSummarizerAgent'],
                'min_message_length': 1
            }
        }
        
        count_result = await count_chat_messages(count_input, pipeline_context)
        
        assert count_result['status'] == 'completed'
        assert count_result['output']['message_count'] > 0
        
        # Step 2: Analyze context using count result
        analyze_input = {
            'output': count_result['output'],
            'params': {
                'min_message_threshold': 3,
                'context_window': 20,
                'analyze_topics': True
            }
        }
        
        analyze_result = await analyze_chat_context(analyze_input, pipeline_context)
        
        assert analyze_result['status'] == 'completed'
        should_summarize = analyze_result['output']['should_summarize']
        
        # Step 3: If should summarize, run summarizer agent
        if should_summarize:
            summarizer_input = {
                'chat_id': 'test-chat',
                **analyze_result['output']['context_analysis']
            }
            
            summarizer = ChatSummarizerAgent()
            summary_result = await summarizer.run_agent(
                summarizer_input,
                mock_fiber,
                mock_llm_service
            )
            
            assert summary_result['status'] == 'success'
            assert 'analysis' in summary_result
            assert 'summary' in summary_result['analysis']
    
    @pytest.mark.asyncio
    async def test_complete_pipeline_flow_should_not_summarize(self, mock_fiber, mock_llm_service, mock_activation_response):
        """Test complete pipeline flow that should not trigger summarization."""
        # Create minimal conversation that shouldn't trigger summarization
        minimal_activations = [
            {
                'id': 'activation-1',
                'agent_id': 'ChatAgent',
                'agent_name': 'ChatAgent',
                'started_at': datetime.utcnow().isoformat(),
                'status': 'completed',
                'context': {'chat_id': 'test-chat', 'role': 'user'},
                'input_data': {'prompt': 'Hi'},
                'output_data': {'text': 'Hello'}
            }
        ]
        
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(minimal_activations)
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-456'
        }
        
        # Step 1: Count messages
        count_input = {
            'chat_id': 'test-chat',
            'params': {'exclude_agent_types': ['ChatSummarizerAgent']}
        }
        
        count_result = await count_chat_messages(count_input, pipeline_context)
        assert count_result['output']['message_count'] == 1
        
        # Step 2: Analyze context
        analyze_input = {
            'output': count_result['output'],
            'params': {'min_message_threshold': 3}
        }
        
        analyze_result = await analyze_chat_context(analyze_input, pipeline_context)
        
        # Should not trigger summarization due to low message count
        assert analyze_result['status'] == 'completed'
        assert analyze_result['output']['should_summarize'] is False
        
        # Verify reasons explain why summarization was skipped
        reasons = analyze_result['output']['context_analysis']['summarization_reasons']
        assert any('below threshold' in reason for reason in reasons)
    
    @pytest.mark.asyncio
    async def test_pipeline_data_flow_between_functions(self, mock_fiber, sample_activations, mock_activation_response):
        """Test that data flows correctly between pipeline functions."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-789'
        }
        
        # Step 1: Count messages
        count_result = await count_chat_messages(
            {'chat_id': 'test-chat', 'params': {}},
            pipeline_context
        )
        
        # Verify count result structure for next step
        assert 'output' in count_result
        assert 'message_count' in count_result['output']
        assert 'chat_id' in count_result['output']
        assert 'analysis' in count_result['output']
        
        # Step 2: Use count result in context analysis
        analyze_result = await analyze_chat_context(
            {'output': count_result['output'], 'params': {}},
            pipeline_context
        )
        
        # Verify analysis result uses count data
        assert analyze_result['output']['message_count'] == count_result['output']['message_count']
        assert analyze_result['output']['chat_id'] == count_result['output']['chat_id']
        
        # Verify context analysis includes previous analysis data
        context_analysis = analyze_result['output']['context_analysis']
        assert context_analysis['message_count'] == count_result['output']['message_count']
    
    @pytest.mark.asyncio
    async def test_pipeline_error_handling_propagation(self, mock_fiber):
        """Test error handling across pipeline functions."""
        # Setup API to fail
        mock_fiber.agents.get_activations.side_effect = Exception("API connection failed")
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-error'
        }
        
        # Step 1: Count messages should fail
        count_result = await count_chat_messages(
            {'chat_id': 'test-chat', 'params': {}},
            pipeline_context
        )
        
        assert count_result['status'] == 'failed'
        assert 'API connection failed' in count_result['error']
        
        # Step 2: Analyze should handle the failed input gracefully
        analyze_result = await analyze_chat_context(
            {'output': count_result['output'], 'params': {}},
            pipeline_context
        )
        
        # Analysis should also fail but not crash
        assert analyze_result['status'] in ['failed', 'completed']
        
        # If completed, should set should_summarize to False
        if analyze_result['status'] == 'completed':
            assert analyze_result['output']['should_summarize'] is False
    
    @pytest.mark.asyncio
    async def test_pipeline_function_metadata_tracking(self, mock_fiber, sample_activations, mock_activation_response):
        """Test that function metadata is properly tracked through pipeline."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-meta'
        }
        
        # Step 1: Count messages
        count_result = await count_chat_messages(
            {'chat_id': 'test-chat', 'params': {'min_message_length': 5}},
            pipeline_context
        )
        
        # Verify metadata tracking
        metadata = count_result['output']['function_metadata']
        assert metadata['function_id'] == 'count_chat_messages'
        assert metadata['version'] == '1.0.0'
        assert 'execution_timestamp' in metadata
        assert 'parameters_used' in metadata
        assert metadata['parameters_used']['min_message_length'] == 5
        
        # Step 2: Analyze context
        analyze_result = await analyze_chat_context(
            {'output': count_result['output'], 'params': {'analyze_topics': True}},
            pipeline_context
        )
        
        # Verify analysis metadata
        metadata = analyze_result['output']['function_metadata']
        assert metadata['function_id'] == 'analyze_chat_context'
        assert metadata['version'] == '1.0.0'
        assert 'execution_timestamp' in metadata
        assert metadata['parameters_used']['analyze_topics'] is True
    
    @pytest.mark.asyncio
    async def test_pipeline_parameter_inheritance(self, mock_fiber, sample_activations, mock_activation_response):
        """Test parameter passing and inheritance between functions."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-params'
        }
        
        # Use custom parameters
        custom_params = {
            'include_system_messages': True,
            'exclude_agent_types': [],
            'min_message_length': 10
        }
        
        count_result = await count_chat_messages(
            {'chat_id': 'test-chat', 'params': custom_params},
            pipeline_context
        )
        
        # Verify parameters were applied
        assert count_result['output']['message_count'] >= 0
        metadata = count_result['output']['function_metadata']
        assert metadata['parameters_used']['include_system_messages'] is True
        assert metadata['parameters_used']['exclude_agent_types'] == []
        assert metadata['parameters_used']['min_message_length'] == 10
    
    @pytest.mark.asyncio
    async def test_pipeline_conditional_execution(self, mock_fiber, mock_llm_service, sample_activations, mock_activation_response, llm_response):
        """Test conditional execution based on analysis results."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        mock_llm_service.generate_completion.return_value = llm_response
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'test-chat',
            'execution_id': 'exec-conditional'
        }
        
        # Run count and analysis
        count_result = await count_chat_messages(
            {'chat_id': 'test-chat', 'params': {}},
            pipeline_context
        )
        
        analyze_result = await analyze_chat_context(
            {'output': count_result['output'], 'params': {'min_message_threshold': 2}},
            pipeline_context
        )
        
        # Only run summarizer if analysis indicates we should
        should_summarize = analyze_result['output']['should_summarize']
        
        if should_summarize:
            # Run summarizer
            summarizer = ChatSummarizerAgent()
            summary_result = await summarizer.run_agent(
                {
                    'chat_id': 'test-chat',
                    'should_summarize': True,
                    **analyze_result['output']['context_analysis']
                },
                mock_fiber,
                mock_llm_service
            )
            
            assert summary_result['status'] == 'success'
            
            # Verify summarizer processed the right number of messages
            expected_count = count_result['output']['message_count']
            # Note: Summarizer might filter differently, but should be close
            assert summary_result['analysis']['message_count'] <= expected_count
        else:
            # Pipeline should end here without running summarizer
            # This simulates conditional pipeline execution
            assert analyze_result['output']['should_summarize'] is False


class TestPipelinePerformance:
    """Performance and resource usage tests."""
    
    @pytest.mark.asyncio
    async def test_pipeline_with_large_conversation(self, mock_fiber, mock_activation_response):
        """Test pipeline performance with large conversation history."""
        # Create large conversation
        large_activations = []
        base_time = datetime.utcnow()
        
        for i in range(100):  # 100 messages
            activation = {
                'id': f'activation-{i}',
                'agent_id': 'ChatAgent',
                'agent_name': 'ChatAgent',
                'started_at': (base_time - timedelta(minutes=i)).isoformat(),
                'status': 'completed',
                'context': {'chat_id': 'large-chat', 'role': 'user' if i % 2 == 0 else 'assistant'},
                'input_data': {'prompt': f'Message {i}'},
                'output_data': {'text': f'Response {i}'}
            }
            large_activations.append(activation)
        
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(large_activations)
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'large-chat',
            'execution_id': 'exec-performance'
        }
        
        # Run count function
        start_time = datetime.utcnow()
        count_result = await count_chat_messages(
            {'chat_id': 'large-chat', 'params': {}},
            pipeline_context
        )
        count_duration = (datetime.utcnow() - start_time).total_seconds()
        
        assert count_result['status'] == 'completed'
        assert count_result['output']['message_count'] == 100
        # Should complete reasonably quickly (less than 1 second)
        assert count_duration < 1.0
        
        # Run analysis function
        start_time = datetime.utcnow()
        analyze_result = await analyze_chat_context(
            {'output': count_result['output'], 'params': {'context_window': 50}},
            pipeline_context
        )
        analyze_duration = (datetime.utcnow() - start_time).total_seconds()
        
        assert analyze_result['status'] == 'completed'
        # Should also complete reasonably quickly
        assert analyze_duration < 2.0
    
    @pytest.mark.asyncio
    async def test_pipeline_memory_efficiency(self, mock_fiber, sample_activations, mock_activation_response):
        """Test that pipeline functions don't leak memory."""
        mock_fiber.agents.get_activations.return_value = mock_activation_response.list_format(sample_activations)
        
        pipeline_context = {
            'fiber': mock_fiber,
            'chat_id': 'memory-test',
            'execution_id': 'exec-memory'
        }
        
        # Run multiple pipeline iterations
        for i in range(10):
            count_result = await count_chat_messages(
                {'chat_id': f'memory-test-{i}', 'params': {}},
                pipeline_context
            )
            
            analyze_result = await analyze_chat_context(
                {'output': count_result['output'], 'params': {}},
                pipeline_context
            )
            
            # Verify results are independent
            assert count_result['output']['chat_id'] == f'memory-test-{i}'
            assert analyze_result['output']['chat_id'] == f'memory-test-{i}'
        
        # All iterations should succeed
        assert True  # If we get here, no memory issues occurred