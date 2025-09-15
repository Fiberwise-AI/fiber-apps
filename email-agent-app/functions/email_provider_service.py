"""
Shared service for working with email providers across functions and agents
Provides common utilities and standardized interfaces for different email providers
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Provider-specific endpoint mappings
PROVIDER_ENDPOINTS = {
    "google": {
        "list_messages": "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        "get_message": "https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
        "list_labels": "https://gmail.googleapis.com/gmail/v1/users/me/labels",
        "modify_message": "https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        "send_message": "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        "drafts": "https://gmail.googleapis.com/gmail/v1/users/me/drafts"
    },
    "microsoft": {
        "list_messages": "https://graph.microsoft.com/v1.0/me/messages",
        "get_message": "https://graph.microsoft.com/v1.0/me/messages/{message_id}",
        "list_labels": "https://graph.microsoft.com/v1.0/me/mailFolders",
        "modify_message": "https://graph.microsoft.com/v1.0/me/messages/{message_id}",
        "send_message": "https://graph.microsoft.com/v1.0/me/sendMail",
        "drafts": "https://graph.microsoft.com/v1.0/me/mailFolders/drafts/messages"
    },
    "yahoo": {
        "list_messages": "https://mail.yahooapis.com/v1/users/me/messages",
        "get_message": "https://mail.yahooapis.com/v1/users/me/messages/{message_id}",
        "list_labels": "https://mail.yahooapis.com/v1/users/me/folders",
        "modify_message": "https://mail.yahooapis.com/v1/users/me/messages/{message_id}",
        "send_message": "https://mail.yahooapis.com/v1/users/me/messages",
        "drafts": "https://mail.yahooapis.com/v1/users/me/drafts"
    }
}

def build_search_params(
    provider_type: str,
    query: str = "", 
    max_results: int = 50,
    label: Optional[str] = None,
    days_back: int = 30
) -> Dict[str, Any]:
    """
    Build provider-specific search parameters
    
    Args:
        provider_type: Type of provider (google, microsoft, yahoo)
        query: Search query string
        max_results: Maximum number of results
        label: Label/folder to search in
        days_back: Number of days back to search
        
    Returns:
        Dictionary of query parameters
    """
    # Build query parameters based on provider type
    params = {}
    
    # Set up date filters
    date_start = datetime.now() - timedelta(days=days_back)
    date_end = datetime.now()
    
    if provider_type == "google":
        # Gmail API
        search_query = []
        
        # Add the user's query if provided
        if query:
            search_query.append(query)
        
        # Add date filter
        search_query.append(f"after:{date_start.strftime('%Y/%m/%d')}")
        
        # Add label filter if provided
        if label:
            params["labelIds"] = [label]
        
        params["q"] = " ".join(search_query)
        params["maxResults"] = max_results
        
    elif provider_type == "microsoft":
        # Microsoft Graph API
        search_query = []
        
        # Add the user's query if provided
        if query:
            search_query.append(f"contains(subject,'{query}')")
        
        # Add date filter
        search_query.append(f"receivedDateTime ge {date_start.isoformat()}Z")
        
        if search_query:
            params["$filter"] = " and ".join(search_query)
            
        params["$top"] = max_results
        params["$orderby"] = "receivedDateTime desc"
        
    elif provider_type == "yahoo":
        # Yahoo Mail API
        params["q"] = query if query else None
        params["limit"] = max_results
        params["sort"] = "dateDesc"
        
        # Add date filter
        params["date"] = f"from {date_start.strftime('%Y-%m-%d')} to {date_end.strftime('%Y-%m-%d')}"
        
        # Add folder filter if provided
        if label:
            params["folder"] = label
    
    return params

def get_label_endpoint(provider_type: str, label: Optional[str] = None) -> str:
    """
    Get the appropriate endpoint for a provider, potentially modified for a specific label
    
    Args:
        provider_type: Type of provider (google, microsoft, yahoo)
        label: Optional label/folder to search in
        
    Returns:
        The endpoint URL
    """
    endpoint = PROVIDER_ENDPOINTS[provider_type]["list_messages"]
    
    # For Microsoft, we need to modify the endpoint for folder-specific searches
    if provider_type == "microsoft" and label:
        endpoint = f"https://graph.microsoft.com/v1.0/me/mailFolders/{label}/messages"
    
    return endpoint

def normalize_messages(provider_type: str, response_data: Dict[str, Any], limit: int = 100) -> List[Dict[str, Any]]:
    """
    Normalize message list response from different providers
    
    Args:
        provider_type: Type of provider (google, microsoft, yahoo)
        response_data: Raw response data from the provider
        limit: Maximum number of messages to normalize
        
    Returns:
        List of normalized message objects
    """
    messages = []
    
    if provider_type == "google":
        # Gmail returns message references that need further fetching
        raw_messages = response_data.get("messages", [])
        messages = [
            {
                "id": msg.get("id"),
                "thread_id": msg.get("threadId"),
                "snippet": msg.get("snippet", "")
            }
            for msg in raw_messages[:limit]
        ]
    elif provider_type == "microsoft":
        # Microsoft Graph API returns message details directly
        raw_messages = response_data.get("value", [])
        messages = [
            {
                "id": msg.get("id"),
                "thread_id": msg.get("conversationId"),
                "subject": msg.get("subject", ""),
                "sender": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                "date": msg.get("receivedDateTime"),
                "is_unread": not msg.get("isRead", True),
                "is_starred": msg.get("importance") == "high",
                "preview": msg.get("bodyPreview", "")
            }
            for msg in raw_messages[:limit]
        ]
    elif provider_type == "yahoo":
        # Yahoo Mail API format
        raw_messages = response_data.get("messages", [])
        messages = [
            {
                "id": msg.get("id"),
                "thread_id": msg.get("threadId"),
                "subject": msg.get("subject", ""),
                "sender": msg.get("from", {}).get("email", ""),
                "date": msg.get("receivedDate"),
                "is_unread": not msg.get("isRead", True),
                "is_starred": msg.get("isStarred", False),
                "preview": msg.get("snippet", "")
            }
            for msg in raw_messages[:limit]
        ]
    
    return messages

def normalize_gmail_message(message_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize a Gmail message into standard format
    
    Args:
        message_data: Raw Gmail message data
        
    Returns:
        Normalized message object
    """
    # Extract headers
    headers = {}
    for header in message_data.get("payload", {}).get("headers", []):
        name = header.get("name", "").lower()
        value = header.get("value", "")
        headers[name] = value
    
    return {
        "id": message_data.get("id"),
        "thread_id": message_data.get("threadId"),
        "subject": headers.get("subject", "No subject"),
        "sender": headers.get("from", ""),
        "date": headers.get("date", ""),
        "is_unread": "UNREAD" in message_data.get("labelIds", []),
        "is_starred": "STARRED" in message_data.get("labelIds", []),
        "snippet": message_data.get("snippet", "")
    }
