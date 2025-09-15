"""
Chat models for the pipeline app.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


class ChatInput(BaseModel):
    """Model for chat agent input data."""
    prompt: str = Field(..., description="User message prompt")
    chat_id: Optional[str] = Field(None, description="Chat session ID")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Request metadata")
    
    @property
    def provider_id(self) -> Optional[str]:
        """Get provider_id from context or metadata."""
        return self.context.get("provider_id") or self.metadata.get("provider_id")


class ChatOutput(BaseModel):
    """Model for chat agent output data."""
    text: str = Field(..., description="Generated response text")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Response metadata")


class ChatMessage(BaseModel):
    """Model for individual chat messages."""
    content: str = Field(..., description="Message content")
    role: str = Field(..., description="Message role (user/assistant)")
    timestamp: Optional[datetime] = Field(None, description="Message timestamp")
    activation_id: Optional[str] = Field(None, description="Related activation ID")


class ConversationStats(BaseModel):
    """Model for conversation analysis statistics."""
    total_messages: int = Field(0, description="Total number of messages")
    user_messages: int = Field(0, description="Number of user messages")
    assistant_messages: int = Field(0, description="Number of assistant messages")
    participants: List[str] = Field(default_factory=list, description="List of participants")
    duration_minutes: int = Field(0, description="Conversation duration in minutes")
    start_time: Optional[datetime] = Field(None, description="Conversation start time")
    end_time: Optional[datetime] = Field(None, description="Conversation end time")


class ConversationTopic(BaseModel):
    """Model for conversation topic analysis."""
    topic: str = Field(..., description="Topic name")
    description: str = Field(..., description="Topic description")
    coverage: float = Field(..., description="Topic coverage percentage")