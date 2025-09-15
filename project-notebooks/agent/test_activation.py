"""
Test Agent Activation Module

This module provides test agent implementations for the FiberWise platform.
The agents defined here will be loaded and registered when the app starts.
"""

import json
import logging
import time
from typing import Dict, Any, Optional, List
import re

# Set up logger
logger = logging.getLogger(__name__)

class TestAgent:
    """
    Test agent implementation supporting multiple agent types.
    
    Can be configured to process different kinds of inputs based on agent_type:
    - llm: Chat and text generation
    - email-processor: Email content analysis
    - social-processor: Social media content processing
    - custom: Custom processing functions
    """
    
    def __init__(self, agent_type: str, config: Optional[Dict[str, Any]] = None, 
                 llm_provider_service=None, database_service=None):
        """
        Initialize the test agent.
        
        Args:
            agent_type: The type identifier for this agent
            config: Optional configuration settings for the agent
            llm_provider_service: LLM Provider Service (injected)
            database_service: Database Service (injected)
        """
        self.agent_type = agent_type
        self.config = config or {}
        self.llm_provider_service = llm_provider_service
        self.database_service = database_service
        
        # Get capabilities from config
        self.capabilities = self.config.get("capabilities", [])
        
        logger.info(f"Initializing TestAgent of type '{agent_type}' with config: {config}")
        logger.info(f"Services available: LLM Provider: {llm_provider_service is not None}, Database: {database_service is not None}")
    
    async def run_agent(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the input data and return results.
        
        Args:
            input_data: The input data for the agent to process
            
        Returns:
            Processing results
        """
        logger.info(f"Processing input with TestAgent '{self.agent_type}': {input_data}")
        
        # Basic processing for all agent types
        processing_time = self.config.get("processing_time", 1)
        time.sleep(processing_time)
        
        # Process based on agent type
        if "llm" in self.agent_type or "chat" in self.agent_type:
            return await self._process_llm_request(input_data)
        elif "email" in self.agent_type:
            return await self._process_email(input_data)
        elif "social" in self.agent_type:
            return await self._process_social_media(input_data)
        else:
            # Default custom processing
            return await self._process_custom(input_data)
    
    async def _process_llm_request(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process an LLM or chat request"""
        if not self.llm_provider_service:
            return {
                "status": "failed",
                "error": "LLM Provider Service not available"
            }
        
        # Extract provider information from input data or config
        provider_id = input_data.get('provider_id') or self.config.get('provider_id')
        model_id = input_data.get('model_id') or self.config.get('model_id')
        message = input_data.get('message') or input_data.get('prompt', '')
        
        if not provider_id:
            return {
                "status": "failed",
                "error": "No provider_id specified in input or config"
            }
        
        try:
            # Execute LLM request using the injected provider service
            result = await self.llm_provider_service.execute_llm_request(
                provider_id=provider_id,
                prompt=message,
                model_id=model_id
            )
            return result
        except Exception as e:
            logger.error(f"Error executing LLM request: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def _process_email(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process email content"""
        from_address = input_data.get('from', '')
        to_address = input_data.get('to', '')
        subject = input_data.get('subject', '')
        body = input_data.get('body', '')
        
        # Extract content using simple rules
        processed_text = body
        
        # Remove quoted replies
        processed_text = re.sub(r'^>.*$', '', processed_text, flags=re.MULTILINE)
        
        # Extract signature (simplified)
        signature = ""
        signature_markers = ["--", "Best regards", "Thanks", "Sent from my iPhone"]
        for marker in signature_markers:
            marker_pos = processed_text.find(marker)
            if marker_pos > 0:
                signature = processed_text[marker_pos:]
                processed_text = processed_text[:marker_pos].strip()
                break
        
        # Detect intent
        intent = "inquiry"
        if any(kw in subject.lower() or kw in body.lower() for kw in ["buy", "purchase", "pricing"]):
            intent = "sales"
        elif any(kw in subject.lower() or kw in body.lower() for kw in ["help", "support", "issue"]):
            intent = "support"
        
        # Extract entities (simplified)
        entities = []
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, body)
        entities.extend(emails)
        
        # Store in database if available
        if self.database_service and input_data.get('store_result', False):
            try:
                await self.database_service.execute(
                    "INSERT INTO email_processing (from_address, to_address, subject, intent) VALUES ($1, $2, $3, $4)",
                    from_address, to_address, subject, intent
                )
            except Exception as e:
                logger.error(f"Database operation failed: {e}")
        
        return {
            "processed_text": processed_text,
            "intent": intent,
            "key_entities": entities,
            "signature": signature
        }