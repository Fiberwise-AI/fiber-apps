"""
ChatAgent - A conversational AI agent for multi-turn chat interactions.

This agent provides intelligent conversation capabilities with context awareness,
personality consistency, and helpful response generation.
"""

import logging
from typing import Dict, Any, Optional
from fiberwise_sdk import FiberAgent
from fiberwise_sdk import LLMProviderService

# Embedded LLM response models (to avoid import issues in worker context)
from enum import Enum
from pydantic import BaseModel, Field

class LLMStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"

class LLMResponse(BaseModel):
    status: LLMStatus = Field(..., description="Status of the LLM request")
    text: str = Field(default="", description="Generated text response")
    model: Optional[str] = Field(None, description="Model used for generation")
    error: Optional[str] = Field(None, description="Error message if status is failed")
    
    def get_text_or_error(self) -> str:
        if self.status == LLMStatus.COMPLETED and self.text.strip():
            return self.text.strip()
        elif self.status == LLMStatus.FAILED and self.error:
            return f"LLM Error: {self.error}"
        elif self.status == LLMStatus.COMPLETED and not self.text.strip():
            return "LLM returned empty response"
        else:
            return f"Unexpected LLM status: {self.status}"

logger = logging.getLogger(__name__)


class ChatAgent(FiberAgent):
    """
    A sophisticated chat agent that provides engaging, helpful, and contextually 
    aware conversations with users.
    
    Features:
    - Context-aware conversation flow
    - Consistent personality and tone
    - Helpful and informative responses
    - Safety and content filtering
    - Multi-turn conversation memory
    """
    
    def __init__(self):
        super().__init__()
        self.agent_name = "ChatAgent"
        self._version = "0.0.1"
        
    async def run_agent(
        self, 
        input_data: Dict[str, Any], 
        fiber, 
        llm_service: LLMProviderService,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process user messages and generate contextually appropriate responses.
        
        Args:
            input_data: Contains user's message and chat context
            fiber: FiberWise SDK instance for platform access
            llm_service: LLM service for text generation
            
        Returns:
            Dictionary with generated response text
        """
        try:
            # Extract user input
            user_message = input_data.get("prompt", "").strip()
            chat_id = input_data.get("chat_id")
            
            # Extract provider_id from context or metadata
            context = input_data.get("_context", {})
            metadata = input_data.get("_metadata", {})
            provider_id = context.get("provider_id") or metadata.get("provider_id")
            
            logger.info(f"ChatAgent received input_data keys: {list(input_data.keys())}")
            logger.info(f"ChatAgent extracted context: {context}")
            logger.info(f"ChatAgent extracted metadata: {metadata}")
            logger.info(f"ChatAgent processing message in chat {chat_id} with provider_id={provider_id}")
            
            # Handle empty or missing messages
            if not user_message:
                return {
                    "text": "I'm here and ready to help! What would you like to talk about?"
                }
            
            # Get conversation context if available (excluding current message)
            conversation_context = await self._get_conversation_context(fiber, chat_id, exclude_current=user_message)
            logger.info(f"Conversation context (excluding current): {conversation_context}")
            
            # Build the system prompt with context
            system_prompt = self._build_system_prompt(conversation_context)
            
            # Generate response using LLM
            if llm_service:
                response_text = await self._generate_llm_response(
                    llm_service, 
                    system_prompt, 
                    user_message,
                    conversation_context,
                    provider_id=provider_id
                )
            else:
                # Return error when no LLM available
                return {
                    "text": "I apologize, but I don't have access to an LLM service to generate a response. Please check the system configuration."
                }
            
            return {
                "text": response_text
            }
            
        except Exception as e:
            logger.error(f"Error in ChatAgent: {str(e)}")
            return {
                "text": "I apologize, but I encountered an error while processing your message. Please try again."
            }
    
    async def _get_conversation_context(self, fiber, chat_id: str, exclude_current: str = None) -> Optional[str]:
        """
        Retrieve recent conversation history for context.
        
        Args:
            fiber: FiberWise SDK instance
            chat_id: Chat session identifier
            exclude_current: Current user message to exclude from context (to avoid duplication)
            
        Returns:
            Formatted conversation context string
        """
        if not chat_id:
            return None
            
        try:
            # Get recent activations for this chat
            response = await fiber.agents.get_activations(
                context={"chat_id": chat_id},
                limit=10,  # Last 10 exchanges
                sort_by="started_at",
                sort_dir="desc"
            )
            
            # Handle different response formats
            activations = None
            if isinstance(response, list):
                activations = response
            elif isinstance(response, dict) and 'data' in response:
                activations = response['data']
            elif isinstance(response, dict) and 'items' in response:
                activations = response['items']
            elif isinstance(response, str):
                # API returned error or HTML
                logger.warning(f"API returned string response: {response[:100]}...")
                return None
                
            if not activations or not isinstance(activations, list):
                return None
            
            # Format conversation history
            context_parts = []
            for activation in reversed(activations):  # Chronological order
                if not isinstance(activation, dict):
                    continue
                    
                # Safe access to nested data
                input_data = activation.get("input_data") or {}
                output_data = activation.get("output_data") or {}
                
                # Handle input_data as dict or direct access
                if isinstance(input_data, dict) and input_data.get("prompt"):
                    user_msg = input_data["prompt"]
                    # Skip the current message to avoid duplication
                    if exclude_current and user_msg.strip() == exclude_current.strip():
                        continue
                    context_parts.append(f"User: {user_msg}")
                
                # Handle output_data as dict, string, or direct access  
                if isinstance(output_data, dict):
                    ai_msg = output_data.get("text") or output_data.get("response")
                    if ai_msg:
                        context_parts.append(f"Assistant: {ai_msg}")
                elif isinstance(output_data, str):
                    context_parts.append(f"Assistant: {output_data}")
            
            return "\n".join(context_parts[-20:]) if context_parts else None  # Last 20 messages
            
        except Exception as e:
            logger.warning(f"Could not retrieve conversation context: {str(e)}")
            return None
    
    def _build_system_prompt(self, conversation_context: Optional[str] = None) -> str:
        """
        Build the system prompt for the LLM based on context.
        
        Args:
            conversation_context: Previous conversation history
            
        Returns:
            Complete system prompt string
        """
        base_prompt = """You are a helpful, intelligent, and engaging AI assistant. Your goal is to provide useful, accurate, and conversational responses to users.

Key guidelines:
- Be helpful and informative while maintaining a friendly, conversational tone
- Provide accurate information and acknowledge when you're uncertain
- Ask clarifying questions when needed to better understand user needs
- Keep responses concise but comprehensive
- Be respectful and professional at all times
- If asked about technical topics, provide clear explanations with examples when helpful
- Remember the conversation context and refer to previous messages when relevant

Response style:
- Use a warm, approachable tone
- Break down complex topics into digestible parts
- Offer follow-up suggestions or related information when appropriate
- Use formatting (lists, bullet points) to improve readability when helpful"""

        if conversation_context:
            context_prompt = f"""

Previous conversation context:
{conversation_context}

Please continue the conversation naturally, building on what has been discussed while addressing the user's current message."""
            return base_prompt + context_prompt
        
        return base_prompt
    
    async def _generate_llm_response(
        self, 
        llm_service: LLMProviderService, 
        system_prompt: str, 
        user_message: str,
        conversation_context: Optional[str] = None,
        provider_id: Optional[str] = None
    ) -> str:
        """
        Generate response using the LLM service.
        
        Args:
            llm_service: LLM service instance
            system_prompt: System instructions for the LLM
            user_message: User's input message
            conversation_context: Previous conversation history
            provider_id: LLM provider ID to use for generation
            
        Returns:
            Generated response text
        """
        try:
            # Prepare the prompt for the LLM
            if conversation_context:
                full_prompt = f"{system_prompt}\n\nUser: {user_message}"
            else:
                full_prompt = f"{system_prompt}\n\nUser: {user_message}\n\nAssistant:"
            
            # Generate response using the specified provider
            logger.info(f"About to call LLM service with {full_prompt}")
            response = await llm_service.generate_completion(
                prompt=full_prompt,
                provider_id=provider_id,
                temperature=0.7,  # Balanced creativity and consistency
                max_tokens=1000  # Reasonable response length
            )
            logger.info(f"LLM service call completed with provider_id: {provider_id}")
            
            # Add debug logging to see what we're getting
            logger.info(f"LLM service returned: {response} (type: {type(response)})")
            
            # Parse and validate LLM response
            llm_response = LLMResponse.model_validate(response)
            response_text = llm_response.get_text_or_error()
            
            # Clean up response if it starts with "Assistant:"
            if response_text.startswith("Assistant:"):
                response_text = response_text[10:].strip()
            
            return response_text
                
        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}")
            return "I apologize, but I encountered an error while generating a response. Please try again."


# Export the agent class for FiberWise to instantiate
__all__ = ["ChatAgent"]
