"""
Direct implementation of get_recent_emails function
Fetches the most recent emails from a provider without searching
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from fiberwise_sdk import FiberApp
from fiberwise_sdk.credential_agent_service import BaseCredentialService

logger = logging.getLogger(__name__)

# Provider endpoints configuration
PROVIDER_ENDPOINTS = {
    "google": {
        "list_messages": "https://gmail.googleapis.com/gmail/v1/users/me/messages"
    }
}

def normalize_gmail_message(msg_data):
    """Simple message normalizer for Gmail"""
    headers = msg_data.get('payload', {}).get('headers', [])
    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
    from_addr = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
    date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
    
    return {
        'id': msg_data.get('id'),
        'subject': subject,
        'sender': from_addr,  # Changed from 'from' to 'sender' to match frontend expectations
        'from': from_addr,    # Keep 'from' for backward compatibility
        'date': date,
        'snippet': msg_data.get('snippet', '')
    }

async def run(input_data: Dict[str, Any], fiber: FiberApp, cred_service: BaseCredentialService) -> Dict[str, Any]:
    """
    Function to fetch the most recent emails directly from a provider
    
    Args:
        input_data: Function input parameters
            - authenticator_id (str): The ID of the user's email connection
            - limit (int): Maximum number of emails to fetch (10, 50, or 100)
            - label (str): Email label/folder to fetch from (e.g., INBOX, SENT)
        fiber: FiberWise SDK instance (injected by the platform)
        cred_service: OAuth credential service (injected by the platform)
            
    Returns:
        Dict with status, messages, and total count
    """
    authenticator_id = input_data.get("authenticator_id")
    limit = input_data.get("limit", 10)
    label = input_data.get("label", "INBOX")
    
    if not authenticator_id:
        return {"status": "error", "message": "authenticator_id is required"}
    
    # DEBUG: Check what we actually received
    logger.info(f"=== FUNCTION DEBUG ===")
    logger.info(f"fiber type: {type(fiber)}")
    logger.info(f"fiber instance: {fiber}")
    if hasattr(fiber, 'config'):
        logger.info(f"fiber.config: {fiber.config}")
        if hasattr(fiber.config, 'get_all'):
            logger.info(f"fiber.config.get_all(): {fiber.config.get_all()}")
    if hasattr(fiber, 'data'):
        logger.info(f"fiber.data type: {type(fiber.data)}")
    logger.info(f"=== END DEBUG ===")
    
    # Credential service is injected via dependency injection
    
    try:
        # Get provider information
        provider_info = await cred_service.get_provider_info(authenticator_id)
        logger.info(f"Provider info received: {provider_info}")
        authenticator_name = provider_info.get("name", "").lower()
        provider_brand = provider_info.get("brand", "").lower()
        logger.info(f"Authenticator name: '{authenticator_name}', Provider brand: '{provider_brand}'")
        logger.info(f"Brand detection result: brand='{provider_brand}', will be detected as google: {('google' in provider_brand or 'gmail' in provider_brand or 'google' in authenticator_name)}")
        
        # Determine provider type from brand or name
        provider_type = None
        if "google" in provider_brand or "gmail" in provider_brand or "google" in authenticator_name:
            provider_type = "google"
        else:
            # For now, default to Google since it's the only supported provider
            # TODO: Add support for Outlook, Yahoo, etc.
            logger.warning(f"Unknown provider brand '{provider_brand}', defaulting to Google")
            provider_type = "google"
        
        if provider_type not in PROVIDER_ENDPOINTS:
            return {
                "status": "error",
                "message": f"Unsupported provider type: {provider_type}"
            }
        
        # Configure for Google Gmail
        endpoint = PROVIDER_ENDPOINTS["google"]["list_messages"]
        
        # For Gmail, we just need labelIds and maxResults
        params = {
            "maxResults": limit,
            "labelIds": [label]
        }
        
        # Make the API request using the credential service
        result = await cred_service.make_authenticated_request(
            credential_id=authenticator_id,
            url=endpoint,
            method="GET",
            params=params
        )
        
        # Process the response
        if result.get("success", False):
            messages = []
            
            # Process Gmail response
            raw_messages = result.get("data", {}).get("messages", [])
            
            # For Gmail, fetch full message details for each message ID
            for msg_ref in raw_messages[:limit]:
                msg_id = msg_ref.get("id")
                msg_endpoint = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}"
                
                msg_result = await cred_service.make_authenticated_request(
                    credential_id=authenticator_id,
                    url=msg_endpoint,
                    method="GET"
                )
                
                if msg_result.get("success", False):
                    msg_data = msg_result.get("data", {})
                    messages.append(normalize_gmail_message(msg_data))
            
            # Save messages to dynamic data storage for inbox caching
            # This is optional - if it fails, the function still succeeds
            try:
                await save_messages_to_cache(fiber, authenticator_id, label, messages)
            except Exception as cache_error:
                logger.warning(f"Caching failed but continuing: {cache_error}")
            
            return {
                "status": "success",
                "messages": messages,
                "total_count": len(messages)
            }
        else:
            return {
                "status": "error",
                "message": result.get("error", "Failed to fetch emails")
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

async def save_messages_to_cache(fiber: FiberApp, authenticator_id: str, label: str, messages: List[Dict]):
    """
    Save messages to dynamic data storage for inbox caching
    Uses the last message ID for incremental loading
    
    The FiberApp instance is injected by the platform with proper context (user_id, app_id) already set.
    """
    try:
        # Check if FiberApp has proper configuration
        if not hasattr(fiber, 'config') or not fiber.config:
            logger.warning("FiberApp instance missing configuration, skipping cache")
            return
            
        # Debug: Check what's available in the fiber instance
        logger.debug(f"FiberApp config available: {hasattr(fiber, 'config')}")
        if hasattr(fiber, 'config') and fiber.config:
            if hasattr(fiber.config, 'get'):
                # FiberWiseConfig object
                app_id_in_config = fiber.config.get('app_id', 'NOT_SET')
                user_id_in_config = fiber.config.get('user_id', 'NOT_SET')
                logger.info(f"FiberApp config - app_id: {app_id_in_config}, user_id: {user_id_in_config}")
            else:
                # Regular dict config
                app_id_in_config = getattr(fiber.config, 'app_id', 'NOT_SET')
                user_id_in_config = getattr(fiber.config, 'user_id', 'NOT_SET')
                logger.info(f"FiberApp config (dict) - app_id: {app_id_in_config}, user_id: {user_id_in_config}")
        
        logger.info(f"Caching {len(messages)} messages for {authenticator_id}/{label}")
            
        # Save each message to dynamic data
        for message in messages:
            message_data = {
                "connection_id": authenticator_id,
                "message_id": message.get("id"),
                "subject": message.get("subject", ""),
                "sender": message.get("sender", ""),
                "sender_name": message.get("from", "").split("<")[0].strip(),  # Extract name from "Name <email>"
                "body_preview": message.get("snippet", "")[:500],  # Truncate for performance
                "message_date": message.get("date", ""),
                "labels": [label],
                "last_sync_id": message.get("id")  # Use message ID for incremental sync
            }
            
            try:
                # Save to dynamic data using FIBER SDK
                await fiber.data.create_item(
                    model_id="cached_messages",
                    data=message_data
                )
            except Exception as item_error:
                logger.warning(f"Failed to cache individual message {message.get('id')}: {item_error}")
                # Continue with other messages
                continue
            
        logger.info(f"Saved {len(messages)} messages to cache for {authenticator_id}/{label}")
        
    except Exception as e:
        # Don't fail the main function if caching fails
        logger.warning(f"Failed to cache messages: {e}")
