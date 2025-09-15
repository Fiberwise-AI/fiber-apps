"""
Generic email agent that uses OAuth credentials to access email services
across different providers (Google, Microsoft, Yahoo)

This agent demonstrates the FiberWise agent development pattern with dependency injection.
It handles email operations across multiple providers while following the platform spec.

Architecture:
- Inherits from FiberAgent for proper SDK integration
- Uses run_agent method for activation processor compatibility  
- Leverages dependency injection for FiberApp and services
- Implements comprehensive email operations across providers
"""

import asyncio
import base64
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union, Literal
from enum import Enum
from pydantic import BaseModel, Field, validator, model_validator

from fiberwise_sdk import FiberApp, FiberAgent
from fiberwise_sdk.llm_provider_service import LLMProviderService
from fiberwise_sdk.credential_agent_service import BaseCredentialService

# Set up logger
logger = logging.getLogger(__name__)

# Define Pydantic models for input validation

class OperationType(str, Enum):
    """Supported email operations"""
    SEARCH_EMAILS = "search_emails"
    GET_EMAIL = "get_email"
    CREATE_DRAFT = "create_draft"
    SEND_EMAIL = "send_email"
    ANALYZE_EMAIL = "analyze_email"
    UPDATE_LABELS = "update_labels"
    LIST_LABELS = "list_labels"
    CHECK_CONNECTION = "check_connection"
    GET_ACCOUNT_STATS = "get_account_stats"
    GET_INBOX = "get_inbox"

class BaseEmailInput(BaseModel):
    """Base model for all email operations"""
    connection_id: str
    operation: OperationType
    user_id: Optional[str] = None
    app_id: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional fields 

class SearchEmailsInput(BaseEmailInput):
    """Input model for search_emails operation"""
    operation: Literal[OperationType.SEARCH_EMAILS] = OperationType.SEARCH_EMAILS
    query: str = ""
    max_results: int = 50
    label: Optional[str] = None
    days_back: int = 30
    
    @validator('max_results')
    def validate_max_results(cls, v):
        if v < 1 or v > 500:
            raise ValueError('max_results must be between 1 and 500')
        return v

class GetEmailInput(BaseEmailInput):
    """Input model for get_email operation"""
    operation: Literal[OperationType.GET_EMAIL] = OperationType.GET_EMAIL
    message_id: str

class CreateDraftInput(BaseEmailInput):
    """Input model for create_draft operation"""
    operation: Literal[OperationType.CREATE_DRAFT] = OperationType.CREATE_DRAFT
    to: str
    subject: str
    body: str
    cc: Optional[str] = None
    bcc: Optional[str] = None
    reply_to_message_id: Optional[str] = None

class SendEmailInput(BaseEmailInput):
    """Input model for send_email operation"""
    operation: Literal[OperationType.SEND_EMAIL] = OperationType.SEND_EMAIL
    to: str
    subject: str
    body: str
    cc: Optional[str] = None
    bcc: Optional[str] = None
    reply_to_message_id: Optional[str] = None
    
    @validator('to')
    def validate_recipients(cls, v):
        if not v or not v.strip():
            raise ValueError('recipient(s) are required')
        return v

class AnalyzeEmailInput(BaseEmailInput):
    """Input model for analyze_email operation"""
    operation: Literal[OperationType.ANALYZE_EMAIL] = OperationType.ANALYZE_EMAIL
    message_id: str
    template_name: str = "email_analysis"
    template_vars: Optional[Dict[str, Any]] = None

class UpdateLabelsInput(BaseEmailInput):
    """Input model for update_labels operation"""
    operation: Literal[OperationType.UPDATE_LABELS] = OperationType.UPDATE_LABELS
    message_id: str
    add_labels: List[str] = Field(default_factory=list)
    remove_labels: List[str] = Field(default_factory=list)
    
    @model_validator(mode='after')
    def check_labels(self):
        add_labels = self.add_labels or []
        remove_labels = self.remove_labels or []
        if not add_labels and not remove_labels:
            raise ValueError('at least one label must be specified for adding or removing')
        return self

class ListLabelsInput(BaseEmailInput):
    """Input model for list_labels operation"""
    operation: Literal[OperationType.LIST_LABELS] = OperationType.LIST_LABELS

class CheckConnectionInput(BaseEmailInput):
    """Input model for check_connection operation"""
    operation: Literal[OperationType.CHECK_CONNECTION] = OperationType.CHECK_CONNECTION

class GetAccountStatsInput(BaseEmailInput):
    """Input model for get_account_stats operation"""
    operation: Literal[OperationType.GET_ACCOUNT_STATS] = OperationType.GET_ACCOUNT_STATS


class EmailAgent(FiberAgent):
    """
    Agent for working with emails across different providers (Google, Microsoft, Yahoo)
    using OAuth credentials.
    
    This agent demonstrates how to:
    1. Handle multiple email providers through OAuth credentials
    2. Process various email operations (search, send, analyze, etc.)
    3. Use dependency injection for platform services
    4. Provide real-time updates through the FiberWise platform
    5. Follow the FiberAgent pattern for proper SDK integration
    
    Dependency Injection:
    - fiber: FiberApp SDK instance for platform API access
    - llm_service: LLMProviderService for AI-powered email analysis
    - oauth_service: BaseCredentialService for secure OAuth operations
    
    Execution Pattern:
    The activation processor detects this class inherits from FiberAgent and calls 
    the run_agent method with proper dependency injection.
    """
    
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
    
    # Default prompt templates
    DEFAULT_PROMPT_TEMPLATES = {
        "email_analysis": """
        Analyze the following email:
        
        From: {sender}
        Date: {date}
        Subject: {subject}
        
        Body:
        {body}
        
        Please provide a structured analysis with:
        1. A brief summary (2-3 sentences)
        2. The main topics or themes (up to 5)
        3. Detected sentiment (positive, negative, or neutral)
        4. Priority level (high, medium, low)
        5. Any action items or next steps required
        6. Suggested reply if a response is needed
        7. Suggested categories or labels for this email
        """,
        
        "email_summary": """
        Summarize the following email conversation:
        
        {email_thread}
        
        Provide a concise summary covering:
        1. The key participants
        2. The main topics discussed
        3. Any decisions made or conclusions reached
        4. Outstanding questions or action items
        """,
        
        "reply_suggestion": """
        Create a professional reply to the following email:
        
        From: {sender}
        Subject: {subject}
        
        {body}
        
        Reply in a {tone} tone. Include the following points in your response:
        {points_to_address}
        
        Sign off as {user_name}
        """
    }
    
    # Message types for consistent categorization
    MESSAGE_TYPES = {
        "CONNECT": "connect",
        "DISCONNECT": "disconnect",
        "SEARCH": "search",
        "FETCH": "fetch",
        "ANALYZE": "analyze",
        "SEND": "send",
        "DRAFT": "draft",
        "LABEL": "label",
        "FOLDER": "folder",
        "ERROR": "error",
        "SUCCESS": "success",
        "WARNING": "warning",
        "INFO": "info",
        "NEW_EMAIL": "new_email",
        "STATUS_UPDATE": "status_update"
    }
    
    def __init__(self):
        """Initialize the email agent"""
        self.last_results = {}  # Cache for last search results
        self.prompt_templates = self.DEFAULT_PROMPT_TEMPLATES.copy()
        self.realtime_connected = False
    
    async def ensure_realtime_connected(self, fiber: FiberApp) -> bool:
        """
        Ensure the realtime connection is established
        
        Args:
            fiber: FiberApp SDK instance
            
        Returns:
            bool: True if connected, False otherwise
        """
        if not hasattr(self, 'realtime_connected'):
            self.realtime_connected = False
            
        if not self.realtime_connected:
            try:
                # For agents, realtime connection may not be available in all contexts
                # This is acceptable - the agent can still function without realtime
                await fiber.realtime.connect()
                self.realtime_connected = True
                logger.info("[EmailAgent] Realtime connection established")
                
                # Send connection status message
                await self.send_notification(
                    fiber=fiber,
                    type=self.MESSAGE_TYPES["CONNECT"],
                    title="Agent Connected",
                    message="Email agent is now connected and ready",
                    level="success"
                )
                
                return True
            except Exception as e:
                logger.warning(f"[EmailAgent] Realtime connection not available: {str(e)}")
                # Don't treat this as a fatal error - agents can work without realtime
                self.realtime_connected = False
                return False
        return True
    
    async def send_notification(
        self,
        fiber: FiberApp,
        type: str,
        title: str,
        message: str,
        level: str = "info",
        data: Dict[str, Any] = None
    ) -> bool:
        """
        Send a user-friendly notification
        
        Args:
            fiber: FiberApp SDK instance
            type: Notification type from MESSAGE_TYPES
            title: Short notification title
            message: Detailed notification message
            level: Importance level (success, error, warning, info)
            data: Optional additional data
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Try to ensure realtime connection, but don't fail if it's not available
            realtime_available = await self.ensure_realtime_connected(fiber)
            
            if not realtime_available:
                # Log the notification instead of sending it via realtime
                logger.info(f"[EmailAgent] Notification (realtime unavailable): {title} - {message}")
                return True
                
            # Create the notification payload
            notification_data = {
                "type": "user_notification",
                "notification_type": type,
                "title": title,
                "message": message,
                "level": level,
                "agent_id": "email_agent",
                "timestamp": datetime.now().isoformat()
            }
            
            # Add optional data if provided
            if data:
                notification_data["data"] = data
                
            # Send the notification
            await fiber.realtime.send("notification", notification_data)
            logger.info(f"[EmailAgent] Sent notification: {title} - {message}")
            return True
        except Exception as e:
            logger.warning(f"[EmailAgent] Could not send notification: {str(e)}")
            # Log the notification as a fallback
            logger.info(f"[EmailAgent] Notification (fallback): {title} - {message}")
            return False
    
    async def send_agent_update(
        self,
        fiber: FiberApp,
        task_id: str,
        status: str,
        progress: float,
        message: str,
        provider_id: Optional[str] = None,
        message_id: Optional[str] = None,
        operation: Optional[str] = None
    ) -> bool:
        """
        Send an agent update through the realtime system
        
        Args:
            fiber: FiberWise SDK instance
            task_id: Unique ID for this task/operation
            status: Current status (e.g., started, processing, completed, failed)
            progress: Progress value between 0.0 and 1.0
            message: Human-readable status message
            provider_id: Optional provider ID for context
            message_id: Optional email message ID for context
            operation: Optional operation type
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure we have a realtime connection
            if not await self.ensure_realtime_connected(fiber):
                return False
                
            # Create the update payload
            update_data = {
                "type": "task_progress",
                "task_id": task_id,
                "status": status,
                "progress": progress,
                "message": message,
                "agent_id": "email_agent",
                "timestamp": datetime.now().isoformat()
            }
            
            # Add optional context info if provided
            if provider_id:
                update_data["service_provider_id"] = provider_id
            if message_id:
                update_data["message_id"] = message_id
            if operation:
                update_data["operation"] = operation
                
            # Send the update
            await fiber.realtime.send("agent_update", update_data)
            
            # For key progress points, also send user notifications
            if status == "completed":
                notification_type = self.MESSAGE_TYPES["SUCCESS"]
                level = "success"
                title = "Operation Completed"
                if operation:
                    if operation == "analyze_email":
                        title = "Analysis Complete"
                    elif operation == "search_emails":
                        title = "Search Complete"
                    elif operation == "send_email":
                        title = "Email Sent"
                
                await self.send_notification(
                    fiber=fiber,
                    type=notification_type,
                    title=title,
                    message=message,
                    level=level,
                    data={"task_id": task_id, "provider_id": provider_id}
                )
            elif status == "failed":
                await self.send_notification(
                    fiber=fiber,
                    type=self.MESSAGE_TYPES["ERROR"],
                    title="Operation Failed",
                    message=message,
                    level="error",
                    data={"task_id": task_id, "provider_id": provider_id}
                )
            
            return True
        except Exception as e:
            logger.error(f"[EmailAgent] Error sending agent update: {str(e)}")
            return False
    
    async def send_connection_status(
        self,
        fiber: FiberApp,
        provider_id: str,
        status: str,
        provider_name: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Send connection status update
        
        Args:
            fiber: FiberWise SDK instance
            provider_id: Email provider ID
            status: Status (connected, disconnected, error)
            provider_name: Optional friendly name for the provider
            error_message: Optional error message if status is error
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not await self.ensure_realtime_connected(fiber):
                return False
                
            # Create the connection status payload
            status_data = {
                "type": "connection_status",
                "service_provider_id": provider_id,
                "status": status,
                "timestamp": datetime.now().isoformat()
            }
            
            if provider_name:
                status_data["provider_name"] = provider_name
                
            if error_message and status == "error":
                status_data["error_message"] = error_message
                
            # Send the status update
            await fiber.realtime.send("connection_status", status_data)
            
            # Also send a user notification
            level = "success" if status == "connected" else "error" if status == "error" else "warning"
            title = f"Provider {status.capitalize()}"
            message = f"Email provider {provider_name or provider_id} is {status}"
            if error_message:
                message = f"{message}: {error_message}"
                
            await self.send_notification(
                fiber=fiber,
                type=self.MESSAGE_TYPES["STATUS_UPDATE"],
                title=title,
                message=message,
                level=level,
                data={"provider_id": provider_id}
            )
            
            return True
        except Exception as e:
            logger.error(f"[EmailAgent] Error sending connection status: {str(e)}")
            return False
    
    async def send_email_notification(
        self,
        fiber: FiberApp,
        provider_id: str,
        subtype: str,
        subject: str,
        sender: str,
        message_id: Optional[str] = None,
        preview: Optional[str] = None
    ) -> bool:
        """
        Send notification about a new email
        
        Args:
            fiber: FiberWise SDK instance
            provider_id: Email provider ID
            subtype: Notification subtype (new_email, important_email, etc.)
            subject: Email subject
            sender: Email sender
            message_id: Optional message ID
            preview: Optional message preview
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not await self.ensure_realtime_connected(fiber):
                return False
                
            # Create the email notification payload
            notification_data = {
                "type": "email_notification",
                "subtype": subtype,
                "service_provider_id": provider_id,
                "subject": subject,
                "sender": sender,
                "timestamp": datetime.now().isoformat()
            }
            
            if message_id:
                notification_data["message_id"] = message_id
                
            if preview:
                notification_data["preview"] = preview
                
            # Send the notification
            await fiber.realtime.send("email_notification", notification_data)
            
            # Also send a user notification
            title = "New Email" if subtype == "new_email" else "Email Notification"
            message = f"New email from {sender}: {subject}"
            
            await self.send_notification(
                fiber=fiber,
                type=self.MESSAGE_TYPES["NEW_EMAIL"],
                title=title,
                message=message,
                level="info",
                data={"provider_id": provider_id, "message_id": message_id}
            )
            
            return True
        except Exception as e:
            logger.error(f"[EmailAgent] Error sending email notification: {str(e)}")
            return False
    
    def _detect_provider_type_from_authenticator(self, provider_info: Dict[str, Any]) -> str:
        """
        Detect the provider type (google, microsoft, yahoo) from OAuth authenticator data.
        
        Args:
            provider_info: OAuth authenticator information
            
        Returns:
            Provider type string ("google", "microsoft", "yahoo") or empty string if unknown
        """
        # Log the complete provider info structure for debugging
        logger.info(f"Provider detection - Full provider_info: {provider_info}")
        
        # Get various fields that might contain provider information
        # Try multiple possible field names since the schema might vary
        auth_url = (provider_info.get("auth_url") or 
                   provider_info.get("authorization_url") or 
                   provider_info.get("authorize_url") or "").lower()
        
        token_url = (provider_info.get("token_url") or 
                    provider_info.get("access_token_url") or "").lower()
        
        scopes_url = (provider_info.get("scopes_url") or 
                     provider_info.get("scope_url") or "").lower()
        
        authenticator_name = (provider_info.get("authenticator_name") or 
                             provider_info.get("name") or 
                             provider_info.get("provider_name") or "").lower()
        
        authenticator_type = (provider_info.get("authenticator_type") or 
                             provider_info.get("type") or 
                             provider_info.get("provider_type") or "").lower()
        
        # Also check base_url, api_url, or any URL-like fields
        base_url = (provider_info.get("base_url") or 
                   provider_info.get("api_url") or 
                   provider_info.get("endpoint_url") or "").lower()
        
        # Log the extracted fields for debugging
        logger.info(f"Provider detection - auth_url: '{auth_url}'")
        logger.info(f"Provider detection - token_url: '{token_url}'")
        logger.info(f"Provider detection - authenticator_name: '{authenticator_name}'")
        logger.info(f"Provider detection - authenticator_type: '{authenticator_type}'")
        logger.info(f"Provider detection - base_url: '{base_url}'")
        
        # Combine all fields for comprehensive checking
        all_fields = f"{auth_url} {token_url} {scopes_url} {authenticator_name} {authenticator_type} {base_url}".lower()
        
        # Check for Google indicators
        google_indicators = [
            "googleapis.com", "google.com", "accounts.google", 
            "oauth2.googleapis", "gmail", "google"
        ]
        if any(indicator in all_fields for indicator in google_indicators):
            logger.info("Detected Google provider")
            return "google"
        
        # Check for Microsoft indicators  
        microsoft_indicators = [
            "microsoftonline.com", "login.microsoftonline", "graph.microsoft",
            "outlook.office365", "microsoft", "outlook", "office365", "azure"
        ]
        if any(indicator in all_fields for indicator in microsoft_indicators):
            logger.info("Detected Microsoft provider")
            return "microsoft"
        
        # Check for Yahoo indicators
        yahoo_indicators = [
            "yahoo.com", "login.yahoo", "api.login.yahoo", "yahoo"
        ]
        if any(indicator in all_fields for indicator in yahoo_indicators):
            logger.info("Detected Yahoo provider")
            return "yahoo"
        
        # Log the provider info for debugging unknown providers
        logger.warning(f"Unknown provider type for authenticator - all_fields: '{all_fields}'")
        logger.warning(f"Available fields in provider_info: {list(provider_info.keys())}")
        return ""

    async def run_agent(
        self, 
        input_data: Dict[str, Any], 
        fiber: FiberApp, 
        llm_service: LLMProviderService,
        oauth_service: BaseCredentialService
    ) -> Dict[str, Any]:
        """
        Process input data to perform email operations using credential service.
        
        Args:
            input_data: The input data for the agent
            fiber: FiberApp SDK instance injected by the platform
            llm_service: LLM service injected by the platform
            oauth_service: Credential service injected by the platform
            
        Returns:
            Processing results
        """
        logger.info(f"Processing email operation: {input_data}")
        
        # Extract operation from input data
        operation = input_data.get("operation", "search_emails")
        
        # Initialize connection_id early to ensure it's always available for error handling
        connection_id = input_data.get("connection_id") or input_data.get("authenticator_id")
        
        # Validate input data using appropriate model
        try:
            # Validate with operation-specific model (which inherits from BaseEmailInput)
            validated_input = None
            if operation == OperationType.SEARCH_EMAILS:
                validated_input = SearchEmailsInput(**input_data)
            elif operation == OperationType.GET_EMAIL:
                validated_input = GetEmailInput(**input_data)
            elif operation == OperationType.CREATE_DRAFT:
                validated_input = CreateDraftInput(**input_data)
            elif operation == OperationType.SEND_EMAIL:
                validated_input = SendEmailInput(**input_data)
            elif operation == OperationType.ANALYZE_EMAIL:
                validated_input = AnalyzeEmailInput(**input_data)
            elif operation == OperationType.UPDATE_LABELS:
                validated_input = UpdateLabelsInput(**input_data)
            elif operation == OperationType.LIST_LABELS:
                validated_input = ListLabelsInput(**input_data)
            elif operation == OperationType.CHECK_CONNECTION:
                validated_input = CheckConnectionInput(**input_data)
            elif operation == OperationType.GET_ACCOUNT_STATS:
                validated_input = GetAccountStatsInput(**input_data)
            else:
                return {
                    "status": "error",
                    "message": f"Unsupported operation: {operation}"
                }
            
            # Convert back to dict for backwards compatibility
            input_data = validated_input.dict()
            
            # Update connection_id in case it was provided differently in the validated input
            connection_id = connection_id or input_data.get("connection_id") or input_data.get("authenticator_id")
            if not connection_id:
                return {
                    "status": "error", 
                    "message": "connection_id or authenticator_id is required"
                }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Input validation failed: {str(e)}"
            }
            
        # Generate a unique task ID for this operation
        task_id = f"email_agent_{operation}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{id(input_data)}"
        
        # Send initial update - operation started
        await self.send_agent_update(
            fiber=fiber,
            task_id=task_id,
            status="started",
            progress=0.1,
            message=f"Starting email operation: {operation}",
            provider_id=connection_id,
            operation=operation
        )
        
        # Check if we need to load custom prompt templates
        user_id = input_data.get("user_id")
        app_id = input_data.get("app_id")
        
        if user_id and app_id:
            await self.load_user_prompt_templates(fiber, user_id, app_id)
        
        try:
            # Get provider info to determine the provider type
            await self.send_agent_update(
                fiber=fiber,
                task_id=task_id,
                status="connecting",
                progress=0.2,
                message="Getting provider information",
                provider_id=connection_id,
                operation=operation
            )
            
            provider_info = await oauth_service.get_provider_info(connection_id)
            
            # Check if the OAuth service returned an error
            if not provider_info.get("success", True) or "error" in provider_info:
                error_msg = provider_info.get("error", "Unknown error from OAuth service")
                logger.error(f"OAuth service error for authenticator {connection_id}: {error_msg}")
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="failed",
                    progress=0,
                    message=f"OAuth error: {error_msg}",
                    provider_id=connection_id,
                    operation=operation
                )
                
                return {
                    "status": "error",
                    "message": f"OAuth service error: {error_msg}. Authenticator ID: {connection_id}"
                }
            
            # Detect provider type from authenticator data (URLs, names, etc.)
            # Extract the nested provider_info from the response wrapper
            inner_provider_info = provider_info.get('provider_info', provider_info)
            provider_type = self._detect_provider_type_from_authenticator(inner_provider_info)
            
            # Log provider detection for debugging
            logger.info(f"Detected provider type '{provider_type}' from authenticator data: {inner_provider_info}")
            
            if provider_type not in self.PROVIDER_ENDPOINTS:
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="failed",
                    progress=0,
                    message=f"Unsupported provider type: {provider_type}",
                    provider_id=connection_id,
                    operation=operation
                )
                
                return {
                    "status": "error",
                    "message": f"Unsupported provider type: {provider_type}. Supported types: {', '.join(self.PROVIDER_ENDPOINTS.keys())}"
                }
            
            # Execute email operation based on the requested operation
            await self.send_agent_update(
                fiber=fiber,
                task_id=task_id,
                status="processing",
                progress=0.3,
                message=f"Processing {operation} operation",
                provider_id=connection_id,
                operation=operation
            )
            
            if operation == "search_emails":
                query = input_data.get("query", "")
                max_results = input_data.get("max_results", 10)
                label = input_data.get("label")
                days_back = input_data.get("days_back", 30)
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="searching",
                    progress=0.5,
                    message=f"Searching emails with query: {query}",
                    provider_id=connection_id,
                    operation=operation
                )
                
                result = await self.search_emails(
                    cred_service=oauth_service,
                    connection_id=connection_id, 
                    provider_type=provider_type,
                    query=query, 
                    max_results=max_results,
                    label=label,
                    days_back=days_back,
                    fiber=fiber
                )
                
            elif operation == "get_email":
                message_id = input_data.get("message_id")
                if not message_id:
                    await self.send_agent_update(
                        fiber=fiber,
                        task_id=task_id,
                        status="failed",
                        progress=0,
                        message="message_id is required for get_email operation",
                        provider_id=connection_id,
                        operation=operation
                    )
                    
                    return {
                        "status": "error", 
                        "message": "message_id is required for get_email operation"
                    }
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="fetching",
                    progress=0.5,
                    message=f"Fetching email with ID: {message_id}",
                    provider_id=connection_id,
                    message_id=message_id,
                    operation=operation
                )
                
                result = await self.get_email(
                    cred_service=oauth_service,
                    connection_id=connection_id,
                    provider_type=provider_type,
                    message_id=message_id
                )
                
            elif operation == "create_draft":
                to = input_data.get("to")
                subject = input_data.get("subject")
                body = input_data.get("body")
                
                if not all([to, subject, body]):
                    await self.send_agent_update(
                        fiber=fiber,
                        task_id=task_id,
                        status="failed",
                        progress=0,
                        message="to, subject, and body are required for create_draft operation",
                        provider_id=connection_id,
                        operation=operation
                    )
                    
                    return {
                        "status": "error", 
                        "message": "to, subject, and body are required for create_draft operation"
                    }
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="creating_draft",
                    progress=0.5,
                    message=f"Creating draft email to: {to}, subject: {subject}",
                    provider_id=connection_id,
                    operation=operation
                )
                
                result = await self.create_draft(
                    cred_service=oauth_service,
                    connection_id=connection_id,
                    provider_type=provider_type,
                    to=to,
                    subject=subject,
                    body=body,
                    cc=input_data.get("cc"),
                    bcc=input_data.get("bcc"),
                    reply_to_message_id=input_data.get("reply_to_message_id")
                )
                
            elif operation == "send_email":
                to = input_data.get("to")
                subject = input_data.get("subject")
                body = input_data.get("body")
                
                if not all([to, subject, body]):
                    await self.send_agent_update(
                        fiber=fiber,
                        task_id=task_id,
                        status="failed",
                        progress=0,
                        message="to, subject, and body are required for send_email operation",
                        provider_id=connection_id,
                        operation=operation
                    )
                    
                    return {
                        "status": "error", 
                        "message": "to, subject, and body are required for send_email operation"
                    }
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="sending",
                    progress=0.5,
                    message=f"Sending email to: {to}, subject: {subject}",
                    provider_id=connection_id,
                    operation=operation
                )
                
                result = await self.send_email(
                    cred_service=oauth_service,
                    connection_id=connection_id,
                    provider_type=provider_type,
                    to=to,
                    subject=subject,
                    body=body,
                    cc=input_data.get("cc"),
                    bcc=input_data.get("bcc"),
                    reply_to_message_id=input_data.get("reply_to_message_id")
                )
                
            elif operation == "analyze_email":
                message_id = input_data.get("message_id")
                if not message_id:
                    await self.send_agent_update(
                        fiber=fiber,
                        task_id=task_id,
                        status="failed",
                        progress=0,
                        message="message_id is required for analyze_email operation",
                        provider_id=connection_id,
                        operation=operation
                    )
                    
                    return {
                        "status": "error", 
                        "message": "message_id is required for analyze_email operation"
                    }
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="fetching",
                    progress=0.3,
                    message=f"Fetching email with ID: {message_id} for analysis",
                    provider_id=connection_id,
                    message_id=message_id,
                    operation=operation
                )
                
                # Send another update before LLM processing
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="analyzing",
                    progress=0.5,
                    message="Analyzing email content with AI",
                    provider_id=connection_id,
                    message_id=message_id,
                    operation=operation
                )
                
                result = await self.analyze_email(
                    fiber=fiber,
                    cred_service=oauth_service,
                    llm_service=llm_service,
                    connection_id=connection_id,
                    provider_type=provider_type,
                    message_id=message_id,
                    user_id=user_id,
                    app_id=app_id
                )
                
                # Send an update about saving analysis
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="saving",
                    progress=0.8,
                    message="Saving email analysis results",
                    provider_id=connection_id,
                    message_id=message_id,
                    operation=operation
                )
                
            elif operation == "update_labels":
                message_id = input_data.get("message_id")
                add_labels = input_data.get("add_labels", [])
                remove_labels = input_data.get("remove_labels", [])
                
                if not message_id:
                    await self.send_agent_update(
                        fiber=fiber,
                        task_id=task_id,
                        status="failed",
                        progress=0,
                        message="message_id is required for update_labels operation",
                        provider_id=connection_id,
                        operation=operation
                    )
                    
                    return {
                        "status": "error", 
                        "message": "message_id is required for update_labels operation"
                    }
                
                if not add_labels and not remove_labels:
                    await self.send_agent_update(
                        fiber=fiber,
                        task_id=task_id,
                        status="failed",
                        progress=0,
                        message="Either add_labels or remove_labels must be provided",
                        provider_id=connection_id,
                        operation=operation
                    )
                    
                    return {
                        "status": "error", 
                        "message": "Either add_labels or remove_labels must be provided"
                    }
                
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="updating",
                    progress=0.5,
                    message=f"Updating labels for message ID: {message_id}",
                    provider_id=connection_id,
                    message_id=message_id,
                    operation=operation
                )
                
                result = await self.update_labels(
                    cred_service=oauth_service,
                    connection_id=connection_id,
                    provider_type=provider_type,
                    message_id=message_id,
                    add_labels=add_labels,
                    remove_labels=remove_labels
                )
                
            elif operation == "list_labels":
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="listing",
                    progress=0.5,
                    message="Listing available email labels/folders",
                    provider_id=connection_id,
                    operation=operation
                )
                
                result = await self.list_labels(
                    cred_service=oauth_service,
                    connection_id=connection_id,
                    provider_type=provider_type
                )
                
            elif operation == "check_connection":
                provider_info = await oauth_service.get_provider_info(connection_id)
                provider_type = provider_info.get("provider_type", "").lower()
                
                if provider_type not in self.PROVIDER_ENDPOINTS:
                    return {
                        "status": "error",
                        "message": f"Unsupported provider type: {provider_type}"
                    }
                
                result = await self.check_connection(oauth_service, connection_id, provider_type)
                
                return {
                    "status": "success" if result.get("connected", False) else "error",
                    "connection_id": connection_id,
                    "provider_type": provider_type,
                    "operation": operation,
                    "result": result,
                    "timestamp": datetime.now().isoformat(),
                    "task_id": task_id
                }
            
            elif operation == "get_account_stats":
                provider_info = await oauth_service.get_provider_info(connection_id)
                provider_type = provider_info.get("provider_type", "").lower()
                
                if provider_type not in self.PROVIDER_ENDPOINTS:
                    return {
                        "status": "error",
                        "message": f"Unsupported provider type: {provider_type}"
                    }
                
                result = await self.get_account_stats(oauth_service, connection_id, provider_type)
                
                return {
                    "status": "success" if "error" not in result else "error",
                    "connection_id": connection_id,
                    "provider_type": provider_type,
                    "operation": operation,
                    "result": result,
                    "timestamp": datetime.now().isoformat(),
                    "task_id": task_id
                }
            
            else:
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="failed",
                    progress=0,
                    message=f"Unsupported operation: {operation}",
                    provider_id=connection_id,
                    operation=operation
                )
                
                return {
                    "status": "error",
                    "message": f"Unsupported operation: {operation}"
                }
            
            # Send completion update
            await self.send_agent_update(
                fiber=fiber,
                task_id=task_id,
                status="completed",
                progress=1.0,
                message=f"Operation {operation} completed successfully",
                provider_id=connection_id,
                message_id=input_data.get("message_id"),
                operation=operation
            )
                
            return {
                "status": "success",
                "connection_id": connection_id,
                "provider_type": provider_type,
                "operation": operation,
                "result": result,
                "timestamp": datetime.now().isoformat(),
                "task_id": task_id
            }
            
        except Exception as e:
            # Send error update (only if we have a valid connection_id and other required vars)
            if 'connection_id' in locals() and connection_id and 'task_id' in locals() and 'operation' in locals():
                await self.send_agent_update(
                    fiber=fiber,
                    task_id=task_id,
                    status="failed",
                    progress=0,
                    message=f"Operation failed: {str(e)}",
                    provider_id=connection_id,
                    message_id=input_data.get("message_id"),
                    operation=operation
                )
            
            return {
                "status": "error",
                "message": str(e),
                "connection_id": connection_id if connection_id else "unknown",
                "operation": operation if 'operation' in locals() else "unknown",
                "task_id": task_id if 'task_id' in locals() else "unknown"
            }
    
    async def check_connection(self, cred_service: BaseCredentialService, connection_id: str, provider_type: str) -> Dict[str, Any]:
        """
        Check if the connection is valid by making a simple API call
        
        Args:
            cred_service: Credential service for making authenticated requests
            connection_id: Connection ID to check
            provider_type: Type of provider
            
        Returns:
            Dict with connection status
        """
        try:
            # A simple way to check connection is to list labels
            await self.list_labels(cred_service, connection_id, provider_type)
            return {"connected": True}
        except Exception as e:
            return {"connected": False, "message": str(e)}

    async def get_account_stats(self, cred_service: BaseCredentialService, connection_id: str, provider_type: str) -> Dict[str, Any]:
        """
        Get basic account statistics
        
        Args:
            cred_service: Credential service for making authenticated requests
            connection_id: Connection ID to use
            provider_type: Type of provider
            
        Returns:
            Dict with account stats
        """
        if provider_type == "google":
            endpoint = "https://gmail.googleapis.com/gmail/v1/users/me/profile"
            result = await cred_service.make_authenticated_request(
                credential_id=connection_id,
                url=endpoint,
                method="GET"
            )
            if result.get("success"):
                return result.get("data")
            else:
                return {"error": result.get("error")}
        
        # TODO: Implement for other providers
        return {"error": f"get_account_stats not implemented for {provider_type}"}

    async def search_emails(
        self, 
        cred_service: BaseCredentialService, 
        connection_id: str, 
        provider_type: str,
        query: str = "", 
        max_results: int = 10,
        label: Optional[str] = None,
        days_back: int = 30,
        fiber = None
    ) -> Dict[str, Any]:
        """
        Search for emails using the provider's API
        
        Args:
            cred_service: Credential service for making authenticated requests
            provider_id: Provider ID (GUID) to use
            provider_type: Type of provider (google, microsoft, yahoo)
            query: Search query
            max_results: Maximum number of results to return
            label: Filter by label/folder
            days_back: How many days back to search
            
        Returns:
            Search results
        """
        # Get the appropriate endpoint for this provider
        endpoint = self.PROVIDER_ENDPOINTS[provider_type]["list_messages"]
        
        # Build the query parameters based on provider type
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
            
            # If label specified, use the appropriate folder endpoint
            if label:
                endpoint = f"https://graph.microsoft.com/v1.0/me/mailFolders/{label}/messages"
            
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
        
        # Make the authenticated request using the credential service
        result = await cred_service.make_authenticated_request(
            credential_id=connection_id,
            url=endpoint,
            method="GET",
            params=params
        )
        
        # Process and standardize the response format
        if result.get("success", False):
            messages = []
            
            # Extract and normalize the messages based on provider type
            if provider_type == "google":
                # Gmail returns message IDs that need to be fetched individually
                raw_messages = result.get("data", {}).get("messages", [])
                messages = [
                    {
                        "id": msg.get("id"),
                        "thread_id": msg.get("threadId"),
                        # Add minimal preview from snippet if available
                        "snippet": msg.get("snippet", "")
                    }
                    for msg in raw_messages
                ]
                
            elif provider_type == "microsoft":
                # Microsoft Graph API returns message details directly
                raw_messages = result.get("data", {}).get("value", [])
                messages = [
                    {
                        "id": msg.get("id"),
                        "thread_id": msg.get("conversationId"),
                        "subject": msg.get("subject", ""),
                        "sender": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                        "date": msg.get("receivedDateTime"),
                        "is_read": msg.get("isRead", False),
                        "preview": msg.get("bodyPreview", "")
                    }
                    for msg in raw_messages
                ]
                
            elif provider_type == "yahoo":
                # Yahoo Mail API format
                raw_messages = result.get("data", {}).get("messages", [])
                messages = [
                    {
                        "id": msg.get("id"),
                        "thread_id": msg.get("threadId"),
                        "subject": msg.get("subject", ""),
                        "sender": msg.get("from", {}).get("email", ""),
                        "date": msg.get("receivedDate"),
                        "is_read": msg.get("isRead", False)
                    }
                    for msg in raw_messages
                ]
            
            # Cache results for later use
            self.last_results[connection_id] = messages
            
            # Cache messages to database for faster inbox loading using fiber SDK
            try:
                cached_count = await self.cache_messages_to_db(messages, connection_id, provider_type, fiber)
                logger.info(f"Cached {cached_count} messages to database")
            except Exception as cache_error:
                logger.warning(f"Failed to cache messages to database: {cache_error}")
                # Don't fail the search if caching fails
            
            return {
                "messages": messages,
                "total_count": len(messages),
                "query": query,
                "max_results": max_results,
                "label": label,
                "days_back": days_back,
                "cached_count": locals().get('cached_count', 0)
            }
        else:
            raise Exception(f"Search failed: {result.get('error')}")
    
    async def cache_messages_to_db(
        self, 
        messages: List[Dict[str, Any]], 
        connection_id: str, 
        provider_type: str,
        fiber = None
    ) -> int:
        """
        Cache email messages to the database using fiber.data SDK for faster inbox loading
        
        Args:
            messages: List of message data from search results
            connection_id: Connection ID 
            provider_type: Provider type (google, microsoft, yahoo)
            fiber: FiberApp instance for data operations
        
        Returns:
            Number of messages successfully cached
        """
        if not fiber:
            logger.warning("No fiber instance available for caching")
            return 0
            
        cached_count = 0
        user_id = self.current_user_id or "unknown"
        
        for message in messages:
            try:
                # Check if message already cached to avoid duplicates
                existing = await self.check_message_cached(message.get("id"), connection_id, fiber)
                if existing:
                    logger.debug(f"Message {message.get('id')} already cached, skipping")
                    continue
                
                # Prepare cached message data
                cache_data = {
                    "user_id": user_id,
                    "connection_id": connection_id,
                    "message_id": message.get("id", ""),
                    "subject": message.get("subject", ""),
                    "sender": message.get("sender", ""),
                    "sender_name": message.get("sender_name", ""),
                    "recipients": json.dumps(message.get("recipients", [])),
                    "body_preview": self.truncate_text(message.get("preview", ""), 500),
                    "body_full": message.get("body", message.get("content", "")),
                    "thread_id": message.get("thread_id", ""),
                    "labels": json.dumps(message.get("labels", [])),
                    "is_read": message.get("is_read", False),
                    "has_attachments": message.get("has_attachments", False),
                    "importance": message.get("importance", "normal"),
                    "message_date": message.get("date", datetime.now().isoformat()),
                    "last_sync_id": message.get("sync_id", message.get("historyId", ""))
                }
                
                # Save to cached_messages model using fiber SDK
                result = await fiber.data.create_item(
                    model_id="cached_messages",
                    data=cache_data
                )
                
                if result:
                    cached_count += 1
                    logger.debug(f"Cached message: {message.get('subject', 'No Subject')}")
                    
            except Exception as e:
                logger.error(f"Failed to cache message {message.get('id', 'unknown')}: {e}")
                # Continue processing other messages
                
        return cached_count
    
    async def check_message_cached(self, message_id: str, connection_id: str, fiber) -> bool:
        """Check if a message is already cached"""
        try:
            # Using fiber.data to query for existing cached message
            # Note: This would need the actual query method from the fiber SDK
            # For now, we'll assume it doesn't exist and cache everything
            # In production, you'd implement a proper exists check
            return False
        except Exception as e:
            logger.debug(f"Error checking cached message: {e}")
            return False
    
    def truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to specified length"""
        if not text or len(text) <= max_length:
            return text
        return text[:max_length] + "..."
    
    async def get_inbox_from_cache(
        self,
        connection_id: str,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False,
        fiber = None
    ) -> Dict[str, Any]:
        """
        Get inbox messages from cached data for much faster loading
        
        Args:
            connection_id: Connection ID to get messages for
            user_id: User ID
            limit: Number of messages to retrieve
            offset: Offset for pagination  
            unread_only: Only return unread messages
            fiber: FiberApp instance for data operations
            
        Returns:
            Cached inbox messages
        """
        if not fiber:
            raise ValueError("Fiber instance required for cache operations")
            
        try:
            # This would use the fiber.data query functionality
            # For now returning a placeholder structure
            # In production, you'd implement proper querying with filters
            
            # Example of what the query would look like:
            # filters = {
            #     "connection_id": connection_id,
            #     "user_id": user_id
            # }
            # if unread_only:
            #     filters["is_read"] = False
            #     
            # result = await fiber.data.query_items(
            #     model_id="cached_messages", 
            #     filters=filters,
            #     limit=limit,
            #     offset=offset,
            #     order_by=[{"field": "message_date", "direction": "desc"}]
            # )
            
            return {
                "messages": [],  # Would contain cached messages
                "total_count": 0,
                "has_more": False,
                "from_cache": True
            }
            
        except Exception as e:
            logger.error(f"Failed to get inbox from cache: {e}")
            raise
    
    async def get_email(
        self, 
        cred_service: BaseCredentialService, 
        connection_id: str, 
        provider_type: str,
        message_id: str
    ) -> Dict[str, Any]:
        """
        Get a specific email with full details
        
        Args:
            cred_service: Credential service for making authenticated requests
            provider_id: Provider ID to use
            provider_type: Type of provider (google, microsoft, yahoo)
            message_id: ID of the email to retrieve
            
        Returns:
            Email details
        """
        # Get the appropriate endpoint for this provider
        endpoint_template = self.PROVIDER_ENDPOINTS[provider_type]["get_message"]
        endpoint = endpoint_template.replace("{message_id}", message_id)
        
        # Build the query parameters based on provider type
        params = {}
        
        if provider_type == "google":
            params["format"] = "full"  # Get full message details
        elif provider_type == "microsoft":
            params["$select"] = "id,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,isDraft,isRead,importance,hasAttachments"
        
        # Make the authenticated request
        result = await cred_service.make_authenticated_request(
            credential_id=connection_id,
            url=endpoint,
            method="GET",
            params=params
        )
        
        # Process and return results
        if result.get("success", False):
            email_data = result.get("data", {})
            
            # Standardize the email format based on provider type
            standardized_email = self._standardize_email_format(email_data, provider_type)
            return standardized_email
        else:
            raise Exception(f"Failed to fetch email: {result.get('error')}")
    
    def _standardize_email_format(self, email_data: Dict[str, Any], provider_type: str) -> Dict[str, Any]:
        """
        Standardize email format across different providers
        
        Args:
            email_data: Raw email data from the provider
            provider_type: Type of provider (google, microsoft, yahoo)
            
        Returns:
            Standardized email format
        """
        if provider_type == "google":
            # Gmail API format
            payload = email_data.get("payload", {})
            headers = {h["name"]: h["value"] for h in payload.get("headers", [])}
            
            # Extract body content
            body_text = ""
            body_html = ""
            
            def extract_body_from_parts(parts):
                nonlocal body_text, body_html
                for part in parts:
                    if part.get("mimeType") == "text/plain":
                        data = part.get("body", {}).get("data", "")
                        if data:
                            body_text = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                    elif part.get("mimeType") == "text/html":
                        data = part.get("body", {}).get("data", "")
                        if data:
                            body_html = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                    elif part.get("parts"):
                        extract_body_from_parts(part.get("parts", []))
            
            # Handle single part or multipart messages
            if payload.get("parts"):
                extract_body_from_parts(payload.get("parts", []))
            else:
                # Single part message
                if payload.get("mimeType") == "text/plain":
                    data = payload.get("body", {}).get("data", "")
                    if data:
                        body_text = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                elif payload.get("mimeType") == "text/html":
                    data = payload.get("body", {}).get("data", "")
                    if data:
                        body_html = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            
            return {
                "id": email_data.get("id"),
                "thread_id": email_data.get("threadId"),
                "subject": headers.get("Subject", ""),
                "sender": headers.get("From", ""),
                "date": headers.get("Date", ""),
                "body_text": body_text,
                "body_html": body_html,
                "headers": headers,
                "snippet": email_data.get("snippet", ""),
                "is_read": "UNREAD" not in email_data.get("labelIds", []),
                "provider_type": provider_type
            }
            
        elif provider_type == "microsoft":
            # Microsoft Graph API format
            return {
                "id": email_data.get("id"),
                "thread_id": email_data.get("conversationId"),
                "subject": email_data.get("subject", ""),
                "sender": email_data.get("from", {}).get("emailAddress", {}).get("address", ""),
                "date": email_data.get("receivedDateTime"),
                "body_text": email_data.get("body", {}).get("content", "") if email_data.get("body", {}).get("contentType") == "text" else "",
                "body_html": email_data.get("body", {}).get("content", "") if email_data.get("body", {}).get("contentType") == "html" else "",
                "headers": {},  # Microsoft Graph doesn't expose raw headers easily
                "snippet": email_data.get("bodyPreview", ""),
                "is_read": email_data.get("isRead", False),
                "provider_type": provider_type
            }
            
        elif provider_type == "yahoo":
            # Yahoo Mail API format
            return {
                "id": email_data.get("id"),
                "thread_id": email_data.get("threadId"),
                "subject": email_data.get("subject", ""),
                "sender": email_data.get("from", {}).get("email", ""),
                "date": email_data.get("receivedDate"),
                "body_text": email_data.get("body", {}).get("text", ""),
                "body_html": email_data.get("body", {}).get("html", ""),
                "headers": email_data.get("headers", {}),
                "snippet": email_data.get("snippet", ""),
                "is_read": email_data.get("isRead", False),
                "provider_type": provider_type
            }
        
        # Fallback for unknown providers
        return email_data

    async def create_draft(
        self, 
        cred_service: BaseCredentialService, 
        connection_id: str, 
        provider_type: str,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        reply_to_message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create an email draft
        
        Args:
            cred_service: Credential service for making authenticated requests
            provider_id: Provider ID to use
            provider_type: Type of provider (google, microsoft, yahoo)
            to: Recipient email address(es)
            subject: Email subject
            body: Email body content
            cc: Carbon copy recipients
            bcc: Blind carbon copy recipients
            reply_to_message_id: Optional ID of message to reply to
            
        Returns:
            Draft details
        """
        # Get the appropriate endpoint for this provider
        endpoint = self.PROVIDER_ENDPOINTS[provider_type]["drafts"]
        
        # Prepare request data based on provider type
        if provider_type == "google":
            # Gmail requires an RFC 2822 formatted message
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Check if this is a reply
            original_headers = {}
            if reply_to_message_id:
                # Get the original message
                original_email = await self.get_email(cred_service, connection_id, provider_type, reply_to_message_id)
                original_headers = original_email.get("headers", {})
                
                # Adjust subject for reply if needed
                if not subject.lower().startswith("re:"):
                    subject = f"Re: {original_email.get('subject', '')}"
            
            # Create the message
            message = MIMEMultipart()
            message["To"] = to
            message["Subject"] = subject
            
            if cc:
                message["Cc"] = cc
            if bcc:
                message["Bcc"] = bcc
                
            # Add In-Reply-To and References headers for replies
            if reply_to_message_id and "Message-ID" in original_headers:
                message["In-Reply-To"] = original_headers["Message-ID"]
                message["References"] = original_headers["Message-ID"]
            
            # Add the body
            message.attach(MIMEText(body, "plain"))
            
            # Encode the message
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Create the draft request
            json_data = {
                "message": {
                    "raw": encoded_message
                }
            }
            
        elif provider_type == "microsoft":
            # Microsoft Graph API format
            to_recipients = [{"emailAddress": {"address": email.strip()}} for email in to.split(";")]
            
            cc_recipients = []
            if cc:
                cc_recipients = [{"emailAddress": {"address": email.strip()}} for email in cc.split(";")]
                
            bcc_recipients = []
            if bcc:
                bcc_recipients = [{"emailAddress": {"address": email.strip()}} for email in bcc.split(";")]
            
            # Check if this is a reply
            conversation_id = None
            if reply_to_message_id:
                # Get the original message
                original_email = await self.get_email(cred_service, connection_id, provider_type, reply_to_message_id)
                conversation_id = original_email.get("thread_id")
                
                # Adjust subject for reply if needed
                if not subject.lower().startswith("re:"):
                    subject = f"Re: {original_email.get('subject', '')}"
            
            # Create the message
            json_data = {
                "subject": subject,
                "body": {
                    "contentType": "text",
                    "content": body
                },
                "toRecipients": to_recipients,
                "ccRecipients": cc_recipients,
                "bccRecipients": bcc_recipients,
                "isDraft": True
            }
            
            # Add conversation ID for replies
            if conversation_id:
                json_data["conversationId"] = conversation_id
                
        elif provider_type == "yahoo":
            # Yahoo Mail API format
            json_data = {
                "to": [{"email": email.strip()} for email in to.split(";")],
                "subject": subject,
                "body": {"text": body}
            }
            
            if cc:
                json_data["cc"] = [{"email": email.strip()} for email in cc.split(";")]
            if bcc:
                json_data["bcc"] = [{"email": email.strip()} for email in bcc.split(";")]
                
            # Add in-reply-to for replies
            if reply_to_message_id:
                json_data["inReplyTo"] = reply_to_message_id
        
        # Make the authenticated request
        result = await cred_service.make_authenticated_request(
            credential_id=connection_id,
            url=endpoint,
            method="POST",
            json_data=json_data
        )
        
        # Process and return results
        if result.get("success", False):
            draft_data = result.get("data", {})
            
            # Return a standardized response
            return {
                "draft_id": draft_data.get("id"),
                "message_id": draft_data.get("message", {}).get("id"),
                "provider_type": provider_type,
                "to": to,
                "subject": subject
            }
        else:
            raise Exception(f"Failed to create draft: {result.get('error')}")
    
    async def send_email(
        self, 
        cred_service: BaseCredentialService, 
        connection_id: str, 
        provider_type: str,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        reply_to_message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an email
        
        Args:
            cred_service: Credential service for making authenticated requests
            provider_id: Provider ID to use
            provider_type: Type of provider (google, microsoft, yahoo)
            to: Recipient email address(es)
            subject: Email subject
            body: Email body content
            cc: Carbon copy recipients
            bcc: Blind carbon copy recipients
            reply_to_message_id: Optional ID of message to reply to
            
        Returns:
            Send result
        """
        # Get the appropriate endpoint for this provider
        endpoint = self.PROVIDER_ENDPOINTS[provider_type]["send_message"]
        
        # Prepare request data based on provider type
        if provider_type == "google":
            # Gmail requires an RFC 2822 formatted message
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Check if this is a reply
            original_headers = {}
            if reply_to_message_id:
                # Get the original message
                original_email = await self.get_email(cred_service, connection_id, provider_type, reply_to_message_id)
                original_headers = original_email.get("headers", {})
                
                # Adjust subject for reply if needed
                if not subject.lower().startswith("re:"):
                    subject = f"Re: {original_email.get('subject', '')}"
            
            # Create the message
            message = MIMEMultipart()
            message["To"] = to
            message["Subject"] = subject
            
            if cc:
                message["Cc"] = cc
            if bcc:
                message["Bcc"] = bcc
                
            # Add In-Reply-To and References headers for replies
            if reply_to_message_id and "Message-ID" in original_headers:
                message["In-Reply-To"] = original_headers["Message-ID"]
                message["References"] = original_headers["Message-ID"]
            
            # Add the body
            message.attach(MIMEText(body, "plain"))
            
            # Encode the message
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Create the send request
            json_data = {
                "raw": encoded_message
            }
            
        elif provider_type == "microsoft":
            # Microsoft Graph API format
            to_recipients = [{"emailAddress": {"address": email.strip()}} for email in to.split(";")]
            
            cc_recipients = []
            if cc:
                cc_recipients = [{"emailAddress": {"address": email.strip()}} for email in cc.split(";")]
                
            bcc_recipients = []
            if bcc:
                bcc_recipients = [{"emailAddress": {"address": email.strip()}} for email in bcc.split(";")]
            
            # Check if this is a reply
            conversation_id = None
            if reply_to_message_id:
                # Get the original message
                original_email = await self.get_email(cred_service, connection_id, provider_type, reply_to_message_id)
                conversation_id = original_email.get("thread_id")
                
                # Adjust subject for reply if needed
                if not subject.lower().startswith("re:"):
                    subject = f"Re: {original_email.get('subject', '')}"
            
            # Create the message
            message = {
                "subject": subject,
                "body": {
                    "contentType": "text",
                    "content": body
                },
                "toRecipients": to_recipients,
                "ccRecipients": cc_recipients,
                "bccRecipients": bcc_recipients
            }
            
            # Add conversation ID for replies
            if conversation_id:
                message["conversationId"] = conversation_id
                
            # In Microsoft Graph, we wrap the message object
            json_data = {
                "message": message,
                "saveToSentItems": "true"
            }
                
        elif provider_type == "yahoo":
            # Yahoo Mail API format
            json_data = {
                "to": [{"email": email.strip()} for email in to.split(";")],
                "subject": subject,
                "body": {"text": body}
            }
            
            if cc:
                json_data["cc"] = [{"email": email.strip()} for email in cc.split(";")]
            if bcc:
                json_data["bcc"] = [{"email": email.strip()} for email in bcc.split(";")]
                
            # Add in-reply-to for replies
            if reply_to_message_id:
                json_data["inReplyTo"] = reply_to_message_id
        
        # Make the authenticated request
        result = await cred_service.make_authenticated_request(
            credential_id=connection_id,
            url=endpoint,
            method="POST",
            json_data=json_data
        )
        
        # Process and return results
        if result.get("success", False):
            send_data = result.get("data", {})
            
            # Return a standardized response
            return {
                "message_id": send_data.get("id"),
                "thread_id": send_data.get("threadId"),
                "provider_type": provider_type,
                "to": to,
                "subject": subject,
                "sent": True
            }
        else:
            raise Exception(f"Failed to send email: {result.get('error')}")
    
    async def update_labels(
        self, 
        cred_service: BaseCredentialService, 
        connection_id: str, 
        provider_type: str,
        message_id: str,
        add_labels: List[str] = None,
        remove_labels: List[str] = None
    ) -> Dict[str, Any]:
        """
        Update email labels/folders
        
        Args:
            cred_service: Credential service for making authenticated requests
            provider_id: Provider ID to use
            provider_type: Type of provider (google, microsoft, yahoo)
            message_id: ID of the email to update
            add_labels: Labels to add
            remove_labels: Labels to remove
            
        Returns:
            Update result
        """
        add_labels = add_labels or []
        remove_labels = remove_labels or []
        
        # Get the appropriate endpoint for this provider
        endpoint_template = self.PROVIDER_ENDPOINTS[provider_type]["modify_message"]
        endpoint = endpoint_template.replace("{message_id}", message_id)
        
        # Prepare request data based on provider type
        if provider_type == "google":
            # Gmail has a dedicated modify endpoint
            json_data = {
                "addLabelIds": add_labels,
                "removeLabelIds": remove_labels
            }
            
            method = "POST"
            
        elif provider_type == "microsoft":
            # For Microsoft, we update properties of the message
            # Convert Gmail-style labels to Outlook properties
            json_data = {}
            
            # Handle common flags like read/unread, flagged, etc.
            if "UNREAD" in add_labels:
                json_data["isRead"] = False
            if "UNREAD" in remove_labels:
                json_data["isRead"] = True
                
            # Handle importance
            if "IMPORTANT" in add_labels:
                json_data["importance"] = "high"
            if "IMPORTANT" in remove_labels:
                json_data["importance"] = "normal"
                
            # Handle categories (Microsoft's version of labels)
            categories = []
            # First get the current categories
            email = await self.get_email(cred_service, connection_id, provider_type, message_id)
            categories = email.get("categories", [])
            
            # Add new categories
            for label in add_labels:
                if label not in ["UNREAD", "IMPORTANT"] and label not in categories:
                    categories.append(label)
                    
            # Remove categories
            for label in remove_labels:
                if label not in ["UNREAD", "IMPORTANT"] and label in categories:
                    categories.remove(label)
                    
            if categories:
                json_data["categories"] = categories
                
            method = "PATCH"
            
        elif provider_type == "yahoo":
            # Yahoo uses a similar approach to Gmail
            json_data = {
                "addLabels": add_labels,
                "removeLabels": remove_labels
            }
            
            method = "PUT"
        
        # Make the authenticated request
        result = await cred_service.make_authenticated_request(
            credential_id=connection_id,
            url=endpoint,
            method=method,
            json_data=json_data
        )
        
        # Process and return results
        if result.get("success", False):
            update_data = result.get("data", {})
            
            # Return a standardized response
            return {
                "message_id": message_id,
                "labels_added": add_labels,
                "labels_removed": remove_labels,
                "provider_type": provider_type,
                "updated": True,
                "current_labels": update_data.get("labelIds", []) if provider_type == "google" else update_data.get("categories", [])
            }
        else:
            raise Exception(f"Failed to update labels: {result.get('error')}")
    
    async def list_labels(
        self, 
        cred_service: BaseCredentialService, 
        connection_id: str, 
        provider_type: str
    ) -> Dict[str, Any]:
        """
        List available email labels/folders
        
        Args:
            cred_service: Credential service for making authenticated requests
            provider_id: Provider ID to use
            provider_type: Type of provider (google, microsoft, yahoo)
            
        Returns:
            List of labels/folders
        """
        # Get the appropriate endpoint for this provider
        endpoint = self.PROVIDER_ENDPOINTS[provider_type]["list_labels"]
        
        # Make the authenticated request
        result = await cred_service.make_authenticated_request(
            credential_id=connection_id,
            url=endpoint,
            method="GET"
        )
        
        # Process and return results
        if result.get("success", False):
            raw_labels = result.get("data", {})
            
            # Standardize the labels format based on provider type
            standardized_labels = []
            
            if provider_type == "google":
                # Gmail labels
                for label in raw_labels.get("labels", []):
                    standardized_labels.append({
                        "id": label.get("id"),
                        "name": label.get("name"),
                        "type": label.get("type", "user")  # "system" or "user"
                    })
                    
            elif provider_type == "microsoft":
                # Microsoft folders
                for folder in raw_labels.get("value", []):
                    standardized_labels.append({
                        "id": folder.get("id"),
                        "name": folder.get("displayName"),
                        "type": "system" if folder.get("isHidden", False) else "user",
                        "total_items": folder.get("totalItemCount", 0),
                        "unread_items": folder.get("unreadItemCount", 0)
                    })
                    
            elif provider_type == "yahoo":
                # Yahoo folders
                for folder in raw_labels.get("folders", []):
                    standardized_labels.append({
                        "id": folder.get("id"),
                        "name": folder.get("name"),
                        "type": "system" if folder.get("isSystem", False) else "user",
                        "total_items": folder.get("count", 0),
                        "unread_items": folder.get("unread", 0)
                    })
            
            return {
                "labels": standardized_labels,
                "provider_type": provider_type,
                "total_count": len(standardized_labels)
            }
        else:
            raise Exception(f"Failed to list labels: {result.get('error')}")
    
    async def analyze_email(
        self, 
        fiber: FiberApp,
        cred_service: BaseCredentialService,
        llm_service: LLMProviderService,
        connection_id: str, 
        provider_type: str,
        message_id: str,
        template_name: str = "email_analysis",
        template_vars: Dict[str, Any] = None,
        user_id: str = None,
        app_id: str = None
    ) -> Dict[str, Any]:
        """
        Analyze an email using LLM to extract insights
        
        Args:
            cred_service: Credential service for making authenticated requests
            llm_service: LLM service for analysis
            provider_id: Provider ID to use
            provider_type: Type of provider (google, microsoft, yahoo)
            message_id: ID of the email to analyze
            template_name: Name of the prompt template to use
            template_vars: Additional variables to pass to the template
            user_id: User ID for storing results
            app_id: App ID for storing results
            
        Returns:
            Analysis results
        """
        # Validate that LLM service is available
        if llm_service is None:
            logger.error("LLM service is not available for email analysis")
            raise Exception("LLM service is not available. Email analysis requires an active LLM service connection.")
        
        # First, get the full email details
        email = await self.get_email(cred_service, connection_id, provider_type, message_id)
        
        # Prepare the email content for analysis
        subject = email.get("subject", "")
        sender = email.get("sender", "")
        body = email.get("body_text", "")
        date = email.get("date", "")
        
        # Get the appropriate prompt template
        template = self.prompt_templates.get(template_name, self.DEFAULT_PROMPT_TEMPLATES["email_analysis"])
        
        # Prepare template variables
        vars_dict = {
            "sender": sender,
            "date": date,
            "subject": subject,
            "body": body[:4000],  # Limit text to avoid token limits
        }
        
        # Add any additional template variables
        if template_vars:
            vars_dict.update(template_vars)
            
        # Format the prompt with variables
        analysis_prompt = template.format(**vars_dict)
        
        # Use the LLM service to analyze the email
        analysis_result = await llm_service.generate_completion(
            prompt=analysis_prompt + "\n\nPlease respond with a JSON object containing the following fields: summary, topics (array), sentiment (positive/negative/neutral), priority (high/medium/low), action_items (array), suggested_reply, suggested_labels (array).",
            model=None  # Use default model
        )
        
        # Return the analysis results
        if analysis_result and 'text' in analysis_result:
            try:
                # Parse the JSON response from the LLM
                import json
                analysis_text = analysis_result['text']
                
                # Try to extract JSON from the response (in case it's wrapped in markdown or other text)
                if '```json' in analysis_text:
                    start = analysis_text.find('```json') + 7
                    end = analysis_text.find('```', start)
                    analysis_text = analysis_text[start:end].strip()
                elif '{' in analysis_text and '}' in analysis_text:
                    start = analysis_text.find('{')
                    end = analysis_text.rfind('}') + 1
                    analysis_text = analysis_text[start:end]
                
                analysis_data = json.loads(analysis_text)
                
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                # Fallback: create a basic analysis structure
                analysis_data = {
                    "summary": analysis_result.get('text', '')[:200] + "..." if len(analysis_result.get('text', '')) > 200 else analysis_result.get('text', ''),
                    "topics": [],
                    "sentiment": "neutral",
                    "priority": "medium",
                    "action_items": [],
                    "suggested_reply": "",
                    "suggested_labels": []
                }
            
            # Save analysis to data model if user_id and app_id are provided
            if user_id and app_id:
                try:
                    # Save analysis using the fiber SDK
                    save_result = await fiber.data.create(
                        model="email_analyses",
                        data={
                            "user_id": user_id,
                            "app_id": app_id,
                            "connection_id": connection_id,
                            "message_id": message_id,
                            "subject": subject,
                            "sender": sender,
                            "analysis_date": datetime.now().isoformat(),
                            "summary": analysis_data.get("summary", ""),
                            "sentiment": analysis_data.get("sentiment", ""),
                            "priority": analysis_data.get("priority", ""),
                            "topics": json.dumps(analysis_data.get("topics", [])),
                            "action_items": json.dumps(analysis_data.get("action_items", [])),
                            "suggested_labels": json.dumps(analysis_data.get("suggested_labels", [])),
                            "template_used": template_name
                        }
                    )
                    
                    print(f"Email analysis saved: {save_result.get('success', False)}")
                except Exception as e:
                    print(f"Error saving email analysis: {str(e)}")
            
            # Return both the analysis and the original email data
            return {
                "email": {
                    "id": message_id,
                    "subject": subject,
                    "sender": sender,
                    "date": date
                },
                "analysis": analysis_data,
                "provider_type": provider_type,
                "template_used": template_name
            }
        else:
            raise Exception(f"Failed to analyze email: LLM service returned no response or invalid format")
    
    def _detect_provider_type_from_authenticator(self, provider_info: Dict[str, Any]) -> str:
        """
        Detect the provider type (google, microsoft, yahoo) from OAuth authenticator data.
        
        Args:
            provider_info: OAuth authenticator information
            
        Returns:
            Provider type string ("google", "microsoft", "yahoo") or empty string if unknown
        """
        # Get various fields that might contain provider information
        auth_url = provider_info.get("auth_url", "").lower()
        token_url = provider_info.get("token_url", "").lower() 
        scopes_url = provider_info.get("scopes_url", "").lower()
        authenticator_name = provider_info.get("authenticator_name", "").lower()
        authenticator_type = provider_info.get("authenticator_type", "").lower()
        
        # Check for Google indicators
        google_indicators = [
            "googleapis.com", "google.com", "accounts.google", 
            "oauth2.googleapis", "gmail", "google"
        ]
        if any(indicator in auth_url or indicator in token_url or 
               indicator in scopes_url or indicator in authenticator_name or
               indicator in authenticator_type for indicator in google_indicators):
            return "google"
        
        # Check for Microsoft indicators  
        microsoft_indicators = [
            "microsoftonline.com", "login.microsoftonline", "graph.microsoft",
            "outlook.office365", "microsoft", "outlook", "office365", "azure"
        ]
        if any(indicator in auth_url or indicator in token_url or
               indicator in scopes_url or indicator in authenticator_name or
               indicator in authenticator_type for indicator in microsoft_indicators):
            return "microsoft"
        
        # Check for Yahoo indicators
        yahoo_indicators = [
            "yahoo.com", "login.yahoo", "api.login.yahoo", "yahoo"
        ]
        if any(indicator in auth_url or indicator in token_url or
               indicator in scopes_url or indicator in authenticator_name or
               indicator in authenticator_type for indicator in yahoo_indicators):
            return "yahoo"
        
        # Log the provider info for debugging unknown providers
        logger.warning(f"Unknown provider type for authenticator: {provider_info}")
        return ""

    async def load_user_prompt_templates(self, fiber: FiberApp, user_id: str, app_id: str) -> None:
        """
        Load user-specific prompt templates from the data store
        
        Args:
            fiber: FiberWise SDK instance injected by the platform
            user_id: User ID to load templates for
            app_id: App ID to load templates for
        """
        try:
            # Query the EmailPromptTemplate model to get user-specific templates
            response = await fiber.data.query({
                "model": "email_prompt_templates",
                "where": {
                    "user_id": user_id,
                    "app_id": app_id
                }
            })
            
            if response.get("success") and response.get("data"):
                templates = response.get("data", [])
                
                # Update prompt templates with user-specific ones
                for template in templates:
                    template_name = template.get("template_name")
                    template_content = template.get("template_content")
                    
                    if template_name and template_content:
                        self.prompt_templates[template_name] = template_content
                
                print(f"Loaded {len(templates)} custom prompt templates for user {user_id}")
            
        except Exception as e:
            print(f"Error loading custom prompt templates: {str(e)}")
            # Use default templates if there's an error
            pass

    async def create_or_update_prompt_template(
        self, 
        fiber: FiberApp, 
        user_id: str, 
        app_id: str,
        template_name: str,
        template_content: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Create or update a custom prompt template
        
        Args:
            fiber: FiberWise SDK instance injected by the platform
            user_id: User ID who owns the template
            app_id: App ID the template belongs to
            template_name: Name of the template
            template_content: The prompt template content
            description: Optional description of the template
            
        Returns:
            Operation result
        """
        try:
            # Check if template already exists
            existing_template = await fiber.data.query({
                "model": "email_prompt_templates",
                "where": {
                    "user_id": user_id,
                    "app_id": app_id,
                    "template_name": template_name
                }
            })
            
            if existing_template.get("success") and existing_template.get("data"):
                # Update existing template
                template_id = existing_template["data"][0]["template_id"]
                result = await fiber.data.update({
                    "model": "email_prompt_templates",
                    "where": {"template_id": template_id},
                    "data": {
                        "template_content": template_content,
                        "description": description,
                        "updated_at": "CURRENT_TIMESTAMP"
                    }
                })
                
                if result.get("success"):
                    # Update in-memory cache
                    self.prompt_templates[template_name] = template_content
                    return {
                        "status": "success",
                        "message": "Prompt template updated successfully",
                        "template_id": template_id
                    }
            else:
                # Create new template
                result = await fiber.data.create({
                    "model": "email_prompt_templates",
                    "data": {
                        "user_id": user_id,
                        "app_id": app_id,
                        "template_name": template_name,
                        "template_content": template_content,
                        "description": description
                    }
                })
                
                if result.get("success"):
                    # Update in-memory cache
                    self.prompt_templates[template_name] = template_content
                    return {
                        "status": "success",
                        "message": "Prompt template created successfully",
                        "template_id": result.get("data", {}).get("template_id")
                    }
            
            return {
                "status": "error",
                "message": "Failed to create or update prompt template"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error creating/updating prompt template: {str(e)}"
            }
