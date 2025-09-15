"""
Save Result Step
Saves the test result to the database.
"""
import logging
import asyncio
import uuid
from typing import Dict, Any
from datetime import datetime

from fiberwise_sdk.fiber import FiberApp

logger = logging.getLogger(__name__)

class SaveResultStep:
    """Step implementation for saving test results to the database."""
    
    def __init__(self):
        self.name = "SaveResultStep"
        self.description = "Save test result to the database"
    
    async def execute(self, parameters: Dict[str, Any], fiber: FiberApp) -> Dict[str, Any]:
        """
        Execute the save result step.
        
        Args:
            parameters: Dict containing result data to save
            fiber: Fiber service for database access
        
        Returns:
            Dict with success status and result ID
        """
        try:
            # Extract parameters
            input_number = parameters.get('input_number')
            doubled_number = parameters.get('doubled_number')
            session_id = parameters.get('session_id')
            
            if input_number is None:
                return {
                    'success': False,
                    'error': 'Missing required parameter: input_number',
                    'result': {'result_id': None}
                }
            
            if doubled_number is None:
                return {
                    'success': False,
                    'error': 'Missing required parameter: doubled_number',
                    'result': {'result_id': None}
                }
            
            logger.info(f"Saving result: {input_number} -> {doubled_number}")
            
            # Prepare result data for the database model
            result_data = {
                'input_number': int(input_number),
                'doubled_number': int(doubled_number),
                'pipeline_session_id': session_id
            }
            
            # Save to database using fiber's data service
            result_record = await self._save_to_database(result_data, fiber)
            
            if not result_record:
                return {
                    'success': False,
                    'error': 'Failed to save result to database',
                    'result': {'result_id': None}
                }
            
            result_id = result_record.get('item_id') or result_record.get('result_id')
            logger.info(f"Successfully saved result with ID: {result_id}")
            
            return {
                'success': True,
                'result': {
                    'success': True,
                    'result_id': result_id
                },
                'message': f'Successfully saved result: {input_number} -> {doubled_number}'
            }
            
        except Exception as e:
            logger.error(f"Error in SaveResultStep: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'result': {'result_id': None}
            }
    
    async def _save_to_database(self, result_data: Dict[str, Any], fiber) -> Dict[str, Any]:
        """
        Save the result to the database using the test-results model.
        
        Args:
            result_data: Result data to save
            fiber: FiberApp instance for database access
        
        Returns:
            Created result record
        """
        try:
            # Use the FiberApp.data factory to create the item (correct API)
            result_record = await fiber.data.create_item(
                model_id='test-results',
                data=result_data
            )
            
            logger.info(f"Created result record via FiberApp.data: {result_record}")
            return result_record
            
        except Exception as e:
            logger.error(f"Database error using FiberApp.data: {str(e)}")
            raise