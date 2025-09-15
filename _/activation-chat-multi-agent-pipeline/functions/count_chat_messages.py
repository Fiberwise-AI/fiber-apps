"""
Count Chat Messages Function

This function analyzes chat history from agent activations to count meaningful
conversation messages, excluding system messages and specific agent types.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatMessageCounter:
    """
    Function implementation for counting chat messages in pipeline execution.
    
    This function integrates with the FiberWise pipeline system to:
    1. Retrieve chat history from agent activations
    2. Filter out system messages and specified agent types
    3. Count meaningful conversation messages
    4. Return structured data for subsequent pipeline nodes
    """
    
    def __init__(self):
        self.function_id = "count_chat_messages"
        self.version = "1.0.0"
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main execution function for counting chat messages.
        
        Args:
            input_data: Input from previous pipeline node or trigger
            context: Pipeline execution context with services and metadata
            
        Returns:
            Dictionary with message count and analysis data
        """
        try:
            # Extract parameters from input
            chat_id = input_data.get('chat_id') or context.get('chat_id')
            params = input_data.get('params', {})
            
            # Configuration parameters
            include_system_messages = params.get('include_system_messages', False)
            exclude_agent_types = params.get('exclude_agent_types', ['ChatSummarizerAgent'])
            min_message_length = params.get('min_message_length', 1)
            
            logger.info(f"Counting messages for chat_id: {chat_id}")
            logger.debug(f"Parameters: include_system={include_system_messages}, exclude_agents={exclude_agent_types}")
            
            if not chat_id:
                raise ValueError("chat_id is required for message counting")
            
            # Get FiberWise SDK instance from context
            fiber = context.get('fiber')
            if not fiber:
                raise RuntimeError("FiberWise SDK not available in execution context")
            
            # Retrieve chat messages from activations
            messages = await self._get_chat_messages(fiber, chat_id)
            
            # Filter messages based on parameters
            filtered_messages = await self._filter_messages(
                messages, 
                include_system_messages, 
                exclude_agent_types,
                min_message_length
            )
            
            # Analyze message patterns
            analysis = await self._analyze_message_patterns(filtered_messages)
            
            # Build result
            result = {
                'output': {
                    'message_count': len(filtered_messages),
                    'total_messages_retrieved': len(messages),
                    'filtered_count': len(messages) - len(filtered_messages),
                    'chat_id': chat_id,
                    'analysis': analysis,
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
            
            logger.info(f"Message count completed: {result['output']['message_count']} meaningful messages found")
            return result
            
        except Exception as e:
            logger.error(f"Error counting chat messages: {str(e)}", exc_info=True)
            return {
                'output': {
                    'message_count': 0,
                    'error': str(e),
                    'chat_id': input_data.get('chat_id', 'unknown'),
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
    
    async def _get_chat_messages(self, fiber, chat_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve chat messages from agent activations.
        
        Args:
            fiber: FiberWise SDK instance
            chat_id: Chat session identifier
            
        Returns:
            List of message dictionaries
        """
        try:
            # Query agent activations for this chat
            response = await fiber.agents.get_activations(
                context={"chat_id": chat_id},
                limit=100,  # Reasonable limit for analysis
                sort_by="started_at",
                sort_dir="asc"
            )
            
            # Handle different response formats
            if isinstance(response, str):
                logger.warning(f"API returned string response: {response[:100]}...")
                return []
            
            if not response:
                logger.info(f"No activations found for chat {chat_id}")
                return []
            
            # Extract activations from response
            activations = response
            if isinstance(response, dict):
                activations = response.get('activations', response.get('items', []))
            
            if not isinstance(activations, list):
                logger.warning(f"Unexpected activations format: {type(activations)}")
                return []
            
            # Convert activations to message format
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
                    'status': activation.get('status'),
                    'started_at': activation.get('started_at'),
                    'context': activation.get('context', {}),
                    'role': activation.get('context', {}).get('role', 'unknown')
                }
                
                messages.append(message)
            
            logger.debug(f"Retrieved {len(messages)} messages from {len(activations)} activations")
            return messages
            
        except Exception as e:
            logger.error(f"Error retrieving chat messages: {str(e)}")
            return []
    
    async def _filter_messages(
        self, 
        messages: List[Dict[str, Any]], 
        include_system_messages: bool,
        exclude_agent_types: List[str],
        min_message_length: int
    ) -> List[Dict[str, Any]]:
        """
        Filter messages based on configuration parameters.
        
        Args:
            messages: List of message dictionaries
            include_system_messages: Whether to include system messages
            exclude_agent_types: Agent types to exclude from count
            min_message_length: Minimum message length to include
            
        Returns:
            Filtered list of messages
        """
        filtered = []
        
        for msg in messages:
            # Skip system messages if not included
            if not include_system_messages and msg.get('role') == 'system':
                continue
            
            # Skip excluded agent types
            agent_id = msg.get('agent_id', '')
            agent_name = msg.get('agent_name', '')
            
            should_exclude = False
            for exclude_type in exclude_agent_types:
                if (exclude_type in agent_id or 
                    exclude_type in agent_name or
                    exclude_type.lower() in agent_id.lower() or
                    exclude_type.lower() in agent_name.lower()):
                    should_exclude = True
                    break
            
            if should_exclude:
                logger.debug(f"Excluding message from {agent_id}/{agent_name}")
                continue
            
            # Check message content length
            input_text = ''
            output_text = ''
            
            input_data = msg.get('input_data', {})
            if isinstance(input_data, dict):
                input_text = input_data.get('prompt', input_data.get('text', ''))
            elif isinstance(input_data, str):
                input_text = input_data
            
            output_data = msg.get('output_data', {})
            if isinstance(output_data, dict):
                output_text = output_data.get('text', output_data.get('response', ''))
            elif isinstance(output_data, str):
                output_text = output_data
            
            # Check if message meets length requirement
            total_length = len(str(input_text)) + len(str(output_text))
            if total_length < min_message_length:
                continue
            
            # Add processed message data
            msg['processed_input_text'] = input_text
            msg['processed_output_text'] = output_text
            msg['message_length'] = total_length
            
            filtered.append(msg)
        
        logger.debug(f"Filtered {len(messages)} messages to {len(filtered)} meaningful messages")
        return filtered
    
    async def _analyze_message_patterns(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze patterns in the filtered messages.
        
        Args:
            messages: List of filtered message dictionaries
            
        Returns:
            Analysis results dictionary
        """
        if not messages:
            return {
                'user_messages': 0,
                'assistant_messages': 0,
                'conversation_turns': 0,
                'average_message_length': 0,
                'time_span': None,
                'most_active_agent': None
            }
        
        # Count message types
        user_messages = len([m for m in messages if m.get('role') == 'user'])
        assistant_messages = len([m for m in messages if m.get('role') == 'assistant'])
        
        # Calculate conversation turns (user → assistant pairs)
        conversation_turns = 0
        for i in range(len(messages) - 1):
            if (messages[i].get('role') == 'user' and 
                messages[i + 1].get('role') == 'assistant'):
                conversation_turns += 1
        
        # Calculate average message length
        total_length = sum(m.get('message_length', 0) for m in messages)
        avg_length = total_length / len(messages) if messages else 0
        
        # Calculate time span
        timestamps = [m.get('started_at') for m in messages if m.get('started_at')]
        time_span = None
        if len(timestamps) >= 2:
            timestamps.sort()
            try:
                start_time = datetime.fromisoformat(timestamps[0].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(timestamps[-1].replace('Z', '+00:00'))
                time_span = {
                    'start': timestamps[0],
                    'end': timestamps[-1],
                    'duration_seconds': (end_time - start_time).total_seconds()
                }
            except Exception as e:
                logger.warning(f"Error calculating time span: {e}")
        
        # Find most active agent
        agent_counts = {}
        for msg in messages:
            agent_id = msg.get('agent_id', 'unknown')
            agent_counts[agent_id] = agent_counts.get(agent_id, 0) + 1
        
        most_active_agent = max(agent_counts.items(), key=lambda x: x[1])[0] if agent_counts else None
        
        return {
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'other_messages': len(messages) - user_messages - assistant_messages,
            'conversation_turns': conversation_turns,
            'average_message_length': round(avg_length, 2),
            'total_characters': total_length,
            'time_span': time_span,
            'most_active_agent': most_active_agent,
            'agent_distribution': agent_counts
        }


# Function factory for pipeline system
async def count_chat_messages(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pipeline function entry point for counting chat messages.
    
    This function will be called by the FiberWise pipeline execution engine
    with the appropriate input data and execution context.
    
    Args:
        input_data: Data from previous pipeline node or trigger
        context: Pipeline execution context with services
        
    Returns:
        Function execution result dictionary
    """
    counter = ChatMessageCounter()
    return await counter.execute(input_data, context)


# Export function metadata for pipeline registration
FUNCTION_METADATA = {
    'id': 'count_chat_messages',
    'name': 'Count Chat Messages',
    'description': 'Analyzes chat history to count meaningful conversation messages',
    'version': '1.0.0',
    'input_schema': {
        'type': 'object',
        'properties': {
            'chat_id': {
                'type': 'string',
                'description': 'Chat session identifier'
            },
            'params': {
                'type': 'object',
                'properties': {
                    'include_system_messages': {
                        'type': 'boolean',
                        'default': False,
                        'description': 'Include system messages in count'
                    },
                    'exclude_agent_types': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'default': ['ChatSummarizerAgent'],
                        'description': 'Agent types to exclude from count'
                    },
                    'min_message_length': {
                        'type': 'integer',
                        'default': 1,
                        'description': 'Minimum total message length to include'
                    }
                }
            }
        },
        'required': ['chat_id']
    },
    'output_schema': {
        'type': 'object',
        'properties': {
            'message_count': {
                'type': 'integer',
                'description': 'Number of meaningful messages found'
            },
            'analysis': {
                'type': 'object',
                'description': 'Detailed message analysis and patterns'
            }
        }
    }
}