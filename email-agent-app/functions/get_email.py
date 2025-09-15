"""
Function to get detailed email content by message ID
TEST UPDATE: This comment was modified again to force update detection
"""

import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import base64
import email
from email.mime.text import MIMEText

from fiberwise_sdk import FiberApp
from fiberwise_sdk.credential_agent_service import BaseCredentialService

# Provider endpoints configuration
PROVIDER_ENDPOINTS = {
    "google": {
        "get_message": "https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}"
    }
}

def normalize_gmail_message_full(msg_data):
    """Full message normalizer for Gmail with body content"""
    headers = msg_data.get('payload', {}).get('headers', [])
    
    # Extract headers
    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
    from_addr = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
    to_addr = next((h['value'] for h in headers if h['name'] == 'To'), 'Unknown')
    date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
    message_id_header = next((h['value'] for h in headers if h['name'] == 'Message-ID'), '')
    
    # Extract body content
    body_text = ""
    body_html = ""
    
    payload = msg_data.get('payload', {})
    
    def extract_body_from_part(part):
        nonlocal body_text, body_html
        
        mime_type = part.get('mimeType', '')
        body = part.get('body', {})
        
        if mime_type == 'text/plain' and body.get('data'):
            body_text = base64.urlsafe_b64decode(body['data']).decode('utf-8', errors='ignore')
        elif mime_type == 'text/html' and body.get('data'):
            body_html = base64.urlsafe_b64decode(body['data']).decode('utf-8', errors='ignore')
        
        # Handle multipart messages
        if 'parts' in part:
            for subpart in part['parts']:
                extract_body_from_part(subpart)
    
    # Extract body from payload
    if payload.get('mimeType') == 'text/plain' and payload.get('body', {}).get('data'):
        body_text = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
    elif payload.get('mimeType') == 'text/html' and payload.get('body', {}).get('data'):
        body_html = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
    elif 'parts' in payload:
        extract_body_from_part(payload)
    
    # Get labels
    label_ids = msg_data.get('labelIds', [])
    
    return {
        'id': msg_data.get('id'),
        'thread_id': msg_data.get('threadId'),
        'subject': subject,
        'sender': from_addr,
        'from': from_addr,
        'to': to_addr,
        'recipients': to_addr,
        'date': date,
        'message_id': message_id_header,
        'snippet': msg_data.get('snippet', ''),
        'body_text': body_text,
        'body_html': body_html,
        'labels': label_ids,
        'size_estimate': msg_data.get('sizeEstimate', 0),
        'is_unread': 'UNREAD' in label_ids,
        'is_starred': 'STARRED' in label_ids,
        'is_important': 'IMPORTANT' in label_ids
    }

async def run(input_data: Dict[str, Any], fiber: FiberApp, cred_service: BaseCredentialService) -> Dict[str, Any]:
    """
    Function to get detailed email content by message ID
    
    Args:
        input_data: Function input parameters
            - authenticator_id (str): The ID of the user's email connection
            - message_id (str): The ID of the message to fetch
        fiber: FiberWise SDK instance (injected by the platform)
        cred_service: OAuth credential service (injected by the platform)
            
    Returns:
        Dict with status and email details
    """
    authenticator_id = input_data.get("authenticator_id")
    message_id = input_data.get("message_id")
    
    if not authenticator_id:
        return {"status": "error", "message": "authenticator_id is required"}
    
    if not message_id:
        return {"status": "error", "message": "message_id is required"}
    
    try:
        # Get provider information
        provider_info = await cred_service.get_provider_info(authenticator_id)
        authenticator_name = provider_info.get("name", "").lower()
        
        # For now, assume Google Gmail since that's what we're testing
        # TODO: Implement proper provider detection based on authenticator name or brand
        provider_type = "google"
        
        if provider_type not in PROVIDER_ENDPOINTS:
            return {
                "status": "error",
                "message": f"Unsupported provider type: {provider_type}"
            }
        
        # Configure for Google Gmail
        endpoint = PROVIDER_ENDPOINTS["google"]["get_message"].format(message_id=message_id)
        
        # For Gmail, we want the full message format
        params = {
            "format": "full"
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
            msg_data = result.get("data", {})
            email_details = normalize_gmail_message_full(msg_data)
            
            return {
                "status": "success",
                "email": email_details
            }
        else:
            return {
                "status": "error",
                "message": result.get("error", "Failed to fetch email")
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }