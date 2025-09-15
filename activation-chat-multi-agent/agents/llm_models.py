"""
LLM Response models for the chat agents.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class LLMStatus(str, Enum):
    """Status enum for LLM responses."""
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"


class LLMResponse(BaseModel):
    """Standardized LLM response model."""
    status: LLMStatus = Field(..., description="Status of the LLM request")
    text: str = Field(default="", description="Generated text response")
    model: Optional[str] = Field(None, description="Model used for generation")
    error: Optional[str] = Field(None, description="Error message if status is failed")
    
    def get_text_or_error(self) -> str:
        """Get text content or return error message."""
        if self.status == LLMStatus.COMPLETED and self.text.strip():
            return self.text.strip()
        elif self.status == LLMStatus.FAILED and self.error:
            return f"LLM Error: {self.error}"
        elif self.status == LLMStatus.COMPLETED and not self.text.strip():
            return "LLM returned empty response"
        else:
            return f"Unexpected LLM status: {self.status}"