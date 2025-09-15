"""
DataTestAgent - A simple agent to test data saving functionality.

This agent demonstrates how to save data to the FiberWise platform data models.
"""

import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from fiberwise_sdk import FiberApp, FiberAgent
from fiberwise_sdk.llm_provider_service import LLMProviderService

logger = logging.getLogger(__name__)


class DataTestAgent(FiberAgent):
    """
    A simple agent that tests data saving functionality.
    
    This agent:
    1. Receives test input data
    2. Performs simple analysis (with or without LLM)
    3. Saves results to the test_analyses data model
    4. Returns confirmation of save operation
    """
    
        
    async def run_agent(
        self, 
        input_data: Dict[str, Any], 
        fiber, 
        llm_service: Optional[LLMProviderService] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process test input and save results to the data model.
        
        Args:
            input_data: Contains test message and metadata
            fiber: FiberWise SDK instance for platform access
            llm_service: Optional LLM service for analysis
            
        Returns:
            Dictionary with save results and confirmation
        """
        logger.info(f"DataTestAgent processing: {input_data}")
        
        # Extract input parameters
        test_message = input_data.get("test_message", "Default test message")
        test_category = input_data.get("test_category", "general")
        use_llm = input_data.get("use_llm", False)
        
        # Extract provider_id from context or metadata
        context = input_data.get("_context", {})
        metadata = input_data.get("_metadata", {})
        provider_id = context.get("provider_id") or metadata.get("provider_id")
        
        logger.info(f"DataTestAgent extracted context: {context}")
        logger.info(f"DataTestAgent extracted metadata: {metadata}")
        logger.info(f"DataTestAgent extracted provider_id: {provider_id}")
        
        # Perform simple analysis
        if use_llm and llm_service:
            try:
                logger.info(f"Using LLM service for analysis with provider_id: {provider_id}")
                llm_result = await llm_service.generate_completion(
                    prompt=f"Analyze this test message and provide insights: {test_message}",
                    provider_id=provider_id,
                    temperature=0.7,
                    max_tokens=500
                )
                
                logger.info(f"LLM service returned: {llm_result} (type: {type(llm_result)})")
                
                # Handle different response formats like in the chat agents
                if llm_result:
                    if isinstance(llm_result, dict):
                        # Check for status/text pattern
                        if llm_result.get('status') == 'completed' and llm_result.get('text'):
                            analysis_result = llm_result['text'].strip()
                        elif llm_result.get('text'):
                            analysis_result = llm_result['text'].strip()
                        else:
                            analysis_result = f"LLM returned response but no text: {llm_result}"
                    elif isinstance(llm_result, str):
                        analysis_result = llm_result.strip()
                    else:
                        analysis_result = f"LLM returned unexpected format: {type(llm_result)}"
                else:
                    analysis_result = "LLM service returned empty response"
                    
            except Exception as e:
                logger.error(f"LLM analysis failed: {e}")
                analysis_result = f"LLM analysis error: {str(e)}"
        else:
            # Simple non-LLM analysis
            word_count = len(test_message.split())
            char_count = len(test_message)
            analysis_result = f"Simple analysis: {word_count} words, {char_count} characters"
        
        # Prepare metadata
        metadata = {
            "timestamp": datetime.now().isoformat(),
            "analysis_type": "llm" if (use_llm and llm_service) else "simple",
            "input_length": len(test_message),
            "processing_agent": "DataTestAgent"
        }
        
        # Test data save operation
        try:
            logger.info("Attempting to save data to test_analyses model")
            
            save_result = await fiber.data.create_item(
                model_id="test_analyses",
                data={
                    "test_message": test_message,
                    "analysis_result": analysis_result,
                    "test_category": test_category,
                    "metadata": json.dumps(metadata)
                }
            )
            
            logger.info(f"Save result: {save_result}")
            
            # Check if save was successful - API returns the created item directly
            if save_result:
                # Extract record ID from the response
                record_id = None
                if isinstance(save_result, dict):
                    # Try different possible locations for the ID
                    record_id = (save_result.get("item_id") or 
                               save_result.get("id") or
                               (save_result.get("data", {}) or {}).get("test_id"))
                
                logger.info(f"Data saved successfully with ID: {record_id}")
                
                return {
                    "status": "success",
                    "message": "Data saved successfully to test_analyses model",
                    "record_id": record_id,
                    "test_message": test_message,
                    "analysis_result": analysis_result,
                    "metadata": metadata,
                    "save_result": save_result
                }
            else:
                logger.error(f"Save failed: No result returned")
                
                return {
                    "status": "error", 
                    "message": "Data save failed: No response from server",
                    "test_message": test_message,
                    "analysis_result": analysis_result,
                    "save_result": save_result
                }
                
        except Exception as e:
            logger.error(f"Exception during data save: {e}")
            
            return {
                "status": "error",
                "message": f"Exception during save: {str(e)}",
                "test_message": test_message,
                "analysis_result": analysis_result,
                "exception": str(e)
            }
