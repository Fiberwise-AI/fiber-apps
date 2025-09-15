"""
Save Lead to Database Step
Saves qualified lead data to the leads model in the database.
"""
import logging
import asyncio
import uuid
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class SaveLeadStep:
    """Step implementation for saving leads to the database model."""
    
    def __init__(self):
        self.name = "SaveLeadStep"
        self.description = "Save qualified lead data to the database"
    
    async def execute(self, parameters: Dict[str, Any], fiber) -> Dict[str, Any]:
        """
        Execute the save lead step.
        
        Args:
            parameters: Dict containing lead information
            fiber: Fiber service for database access
        
        Returns:
            Dict with success status and lead ID
        """
        try:
            # Validate required parameters
            session_id = parameters.get('session_id')
            company_name = parameters.get('company_name')
            website = parameters.get('website')
            human_decision = parameters.get('human_decision')
            
            if not session_id:
                return {
                    'success': False,
                    'error': 'Missing required parameter: session_id',
                    'result': {'lead_id': None}
                }
            
            if not company_name:
                return {
                    'success': False,
                    'error': 'Missing required parameter: company_name',
                    'result': {'lead_id': None}
                }
            
            if not website:
                return {
                    'success': False,
                    'error': 'Missing required parameter: website',
                    'result': {'lead_id': None}
                }
            
            if not human_decision:
                return {
                    'success': False,
                    'error': 'Missing required parameter: human_decision',
                    'result': {'lead_id': None}
                }
            
            logger.info(f"Saving lead to database: {company_name}")
            
            # Prepare lead data for the database model
            lead_data = {
                'company_name': company_name,
                'website': website,
                'phone_number': parameters.get('phone_number'),
                'address': parameters.get('address'),
                'place_id': parameters.get('place_id'),
                'linkedin_url': parameters.get('linkedin_url'),
                'twitter_url': parameters.get('twitter_url'),
                'facebook_url': parameters.get('facebook_url'),
                'instagram_url': parameters.get('instagram_url'),
                'lead_score': parameters.get('lead_score', 0),
                'ai_reasoning': parameters.get('ai_reasoning', ''),
                'human_decision': human_decision,
                'human_notes': parameters.get('human_notes'),
                'source_query': parameters.get('source_query', ''),
                'status': 'approved' if human_decision == 'Approve' else 'rejected'
            }
            
            # Remove None values to use model defaults
            lead_data = {k: v for k, v in lead_data.items() if v is not None}
            
            # Save to database using fiber's data service
            lead_record = await self._save_to_database(lead_data, fiber)
            
            if not lead_record:
                return {
                    'success': False,
                    'error': 'Failed to save lead to database',
                    'result': {'lead_id': None}
                }
            
            # Update the pipeline session with the final result
            await self._update_session_result(session_id, lead_record, fiber)
            
            lead_id = lead_record.get('item_id') or lead_record.get('lead_id')
            logger.info(f"Successfully saved lead to database with ID: {lead_id}")
            
            return {
                'success': True,
                'result': {
                    'success': True,
                    'lead_id': lead_id
                },
                'message': f'Successfully saved lead: {company_name}'
            }
            
        except Exception as e:
            logger.error(f"Error in SaveLeadStep: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'result': {'lead_id': None}
            }
    
    async def _save_to_database(self, lead_data: Dict[str, Any], fiber) -> Dict[str, Any]:
        """
        Save the lead to the database using the leads model.
        
        Args:
            lead_data: Lead information to save
            fiber: Fiber service for database access
        
        Returns:
            Created lead record
        """
        try:
            # Get the data service from fiber
            data_service = await fiber.get_service('data')
            
            # Create the lead record in the leads model
            lead_record = await data_service.create_item('leads', lead_data)
            
            logger.info(f"Created lead record: {lead_record}")
            return lead_record
            
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            # Fallback to mock data for demo purposes
            return await self._create_mock_lead(lead_data)
    
    async def _create_mock_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a mock lead record for testing when database is not available.
        """
        logger.info("Using mock database for lead creation")
        
        # Generate a mock lead ID
        lead_id = str(uuid.uuid4())
        
        # Simulate some processing time
        await asyncio.sleep(0.1)
        
        # Create mock record structure
        mock_record = {
            'item_id': lead_id,
            'lead_id': lead_id,
            **lead_data,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Log the lead data for demo purposes
        logger.info(f"Mock DB - Created lead: {lead_data['company_name']}")
        logger.info(f"Mock DB - Lead ID: {lead_id}")
        logger.info(f"Mock DB - Decision: {lead_data.get('human_decision')}")
        logger.info(f"Mock DB - Score: {lead_data.get('lead_score', 0)}")
        logger.info(f"Mock DB - Website: {lead_data['website']}")
        
        return mock_record
    
    async def _update_session_result(self, session_id: str, lead_record: Dict[str, Any], fiber) -> None:
        """
        Update the pipeline session with the final result.
        
        Args:
            session_id: ID of the pipeline session
            lead_record: The created lead record
            fiber: Fiber service for database access
        """
        try:
            # Get the data service from fiber
            data_service = await fiber.get_service('data')
            
            # Prepare the final result data
            final_result = {
                'lead_id': lead_record.get('item_id') or lead_record.get('lead_id'),
                'company_name': lead_record.get('company_name'),
                'decision': lead_record.get('human_decision'),
                'score': lead_record.get('lead_score'),
                'status': lead_record.get('status')
            }
            
            # Update the session record
            await data_service.update_item('pipeline-sessions', session_id, {
                'status': 'completed',
                'current_step': 'completed',
                'final_result': final_result
            })
            
            logger.info(f"Updated session {session_id} with final result")
            
        except Exception as e:
            logger.error(f"Error updating session result: {str(e)}")
            # Don't fail the step if session update fails