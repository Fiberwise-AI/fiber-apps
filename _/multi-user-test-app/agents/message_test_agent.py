"""
Message Test Agent for demonstrating user isolation functionality.
This agent helps test how user isolation works by creating messages for different scenarios.
"""

from typing import Dict, Any, List
import uuid
import json
from datetime import datetime
from fiberwise_common.agents.base_agent import BaseAgent
from fiberwise_common.services.database_service import DatabaseService


class MessageTestAgent(BaseAgent):
    """Agent for testing user isolation with messages."""
    
    def __init__(self):
        super().__init__()
        self.db_service = DatabaseService()
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute message testing operations based on input commands.
        
        Available commands:
        - create_test_message: Create a test message
        - get_user_messages: Get messages for current user
        - simulate_multi_user: Simulate different user scenarios (admin only)
        """
        command = input_data.get('command', 'create_test_message')
        
        if command == 'create_test_message':
            return await self._create_test_message(input_data)
        elif command == 'get_user_messages':
            return await self._get_user_messages(input_data)
        elif command == 'simulate_multi_user':
            return await self._simulate_multi_user_scenario(input_data)
        elif command == 'explain_isolation':
            return await self._explain_isolation()
        else:
            return {
                'success': False,
                'error': f'Unknown command: {command}',
                'available_commands': [
                    'create_test_message',
                    'get_user_messages', 
                    'simulate_multi_user',
                    'explain_isolation'
                ]
            }
    
    async def _create_test_message(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a test message with user isolation."""
        try:
            message_text = input_data.get('message_text', 'Test message from agent')
            category = input_data.get('category', 'test')
            user_note = input_data.get('user_note', 'Created by MessageTestAgent')
            
            # Create message - user_id will be automatically assigned by the system
            message_data = {
                'message_id': str(uuid.uuid4()),
                'message_text': message_text,
                'message_category': category,
                'user_note': user_note,
                'created_at': datetime.utcnow().isoformat()
            }
            
            # With user_isolation: enforced, the system will automatically:
            # 1. Add user_id from current session
            # 2. Ensure only this user can see this message
            # 3. Prevent modification of user_id field
            
            result = await self.db_service.create_record('user_messages', message_data)
            
            return {
                'success': True,
                'message': 'Test message created successfully',
                'data': {
                    'message_id': message_data['message_id'],
                    'message_text': message_text,
                    'category': category,
                    'isolation_info': {
                        'user_isolation': 'enforced',
                        'auto_user_assignment': True,
                        'protect_user_id': True
                    }
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to create test message: {str(e)}'
            }
    
    async def _get_user_messages(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get messages for the current user (demonstrates isolation)."""
        try:
            # With user isolation enforced, this will only return messages for current user
            messages = await self.db_service.get_records('user_messages')
            
            return {
                'success': True,
                'message': f'Retrieved {len(messages)} messages for current user',
                'data': {
                    'message_count': len(messages),
                    'messages': messages,
                    'isolation_note': 'Only messages for current user returned due to user_isolation: enforced'
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to retrieve messages: {str(e)}'
            }
    
    async def _simulate_multi_user_scenario(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate multi-user scenario for testing (admin only)."""
        # This would typically require admin privileges to bypass user isolation
        return {
            'success': False,
            'message': 'Multi-user simulation requires admin privileges',
            'info': {
                'why_restricted': 'With user_isolation: enforced, agents cannot bypass user isolation',
                'testing_approach': [
                    'Login as different users in separate browser sessions',
                    'Create messages as each user',
                    'Observe that each user only sees their own data',
                    'Check database directly to see user_id separation'
                ]
            }
        }
    
    async def _explain_isolation(self) -> Dict[str, Any]:
        """Explain how user isolation works in this app."""
        return {
            'success': True,
            'message': 'User isolation explanation',
            'data': {
                'current_config': {
                    'user_isolation': 'enforced',
                    'auto_user_assignment': True,
                    'protect_user_id': True
                },
                'how_it_works': {
                    'enforced': 'All database operations are filtered by current user_id',
                    'auto_assignment': 'New records automatically get user_id from current session', 
                    'protection': 'Users cannot modify user_id field to access others data'
                },
                'alternatives': {
                    'optional': 'User isolation can be bypassed in certain cases',
                    'disabled': 'No user isolation - all users share same data'
                },
                'testing_steps': [
                    '1. Create messages as User A',
                    '2. Logout and login as User B', 
                    '3. Try to access User A messages (should fail)',
                    '4. Create messages as User B',
                    '5. Verify User B only sees their messages'
                ]
            }
        }


# Register the agent
agent = MessageTestAgent()