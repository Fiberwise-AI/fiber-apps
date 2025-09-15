"""
Chat Summarizer Agent for Activation Chat Multi-Agent App

This agent demonstrates the FiberWise agent development pattern with dependency injection.
It accesses chat history through agent activations and provides intelligent conversation 
summaries, insights, and analysis using the FiberWise SDK.

Architecture:
- Inherits from FiberAgent for proper SDK integration
- Uses run_agent method for activation processor compatibility  
- Leverages dependency injection for FiberApp and LLMService
- Implements comprehensive conversation analysis capabilities
"""

import json
import logging
import time
from typing import Optional, List
from datetime import datetime
from fiberwise_sdk import FiberApp, FiberAgent
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

class ChatMessage(BaseModel):
    content: str = Field(..., description="Message content")
    role: str = Field(..., description="Message role (user/assistant)")
    timestamp: Optional[datetime] = Field(None, description="Message timestamp")
    activation_id: Optional[str] = Field(None, description="Related activation ID")

class ConversationStats(BaseModel):
    total_messages: int = Field(0, description="Total number of messages")
    user_messages: int = Field(0, description="Number of user messages")
    assistant_messages: int = Field(0, description="Number of assistant messages")
    participants: List[str] = Field(default_factory=list, description="List of participants")
    duration_minutes: int = Field(0, description="Conversation duration in minutes")
    start_time: Optional[datetime] = Field(None, description="Conversation start time")
    end_time: Optional[datetime] = Field(None, description="Conversation end time")

class ConversationTopic(BaseModel):
    topic: str = Field(..., description="Topic name")
    description: str = Field(..., description="Topic description")
    coverage: float = Field(..., description="Topic coverage percentage")


# Set up logger
logger = logging.getLogger(__name__)

class ChatSummarizerAgent(FiberAgent):
    """
    Chat Processing Agent that summarizes conversations by accessing activation history.
    
    This agent demonstrates how to:
    1. Retrieve chat history from agent activations via FiberApp SDK
    2. Process conversation context and flow analysis
    3. Generate intelligent summaries using LLM service dependency injection
    4. Provide actionable conversation insights and topic analysis
    5. Handle error cases gracefully with proper logging
    
    Dependency Injection:
    - fiber: FiberApp SDK instance for platform API access
    - llm_service: LLMProviderService for AI-powered text generation
    
    Execution Pattern:
    The activation processor detects this class inherits from FiberAgent and calls 
    the run_agent method with proper dependency injection.
    """
   
    async def run_agent(self, input_data: dict, fiber: FiberApp, llm_service: LLMProviderService) -> dict:
        """
        Process chat history and generate conversation summaries.
        
        Args:
            input_data: The input data containing chat_id and analysis parameters
            fiber: FiberApp SDK instance for API access
            llm_service: LLM service for generating summaries
            
        Returns:
            Comprehensive conversation analysis and summary
        """
        try:
            chat_id = input_data.get("chat_id")
            
            # Extract provider_id from context or metadata (same as chat agent)
            context = input_data.get("_context", {})
            metadata = input_data.get("_metadata", {})
            provider_id = context.get("provider_id") or metadata.get("provider_id")
            
            logger.info(f"ChatSummarizerAgent received input_data keys: {list(input_data.keys())}")
            logger.info(f"ChatSummarizerAgent extracted context: {context}")
            logger.info(f"ChatSummarizerAgent extracted metadata: {metadata}")
            logger.info(f"ChatSummarizerAgent processing summary for chat {chat_id} with provider_id={provider_id}")
            
            if not chat_id:
                return {
                    "status": "error",
                    "error": "chat_id is required for conversation analysis",
                    "timestamp": time.time()
                }
            
            logger.info(f"Processing conversation summary for chat_id: {chat_id}")
            
            # Retrieve chat history from activations
            chat_history = await self._get_chat_history(fiber, chat_id)
            
            if not chat_history:
                return {
                    "status": "error",
                    "error": "No conversation history found for this chat",
                    "chat_id": chat_id,
                    "timestamp": time.time()
                }
            
            # Filter out this summarizer agent's own activations to check for actual conversation
            # Debug: Log message structure to understand what fields are available
            if chat_history:
                sample_msg = chat_history[0]
                logger.info(f"Sample message structure - Keys: {list(sample_msg.keys())}")
                logger.info(f"Sample message agent_id: {sample_msg.get('agent_id')}")
                logger.info(f"Sample message full: {sample_msg}")
            
            non_summarizer_messages = []
            for msg in chat_history:
                agent_id = msg.get("agent_id")
                agent_name = msg.get("agent_name") 
                
                # Check multiple possible ways the agent might be identified
                is_summarizer = (
                    agent_id == "ChatSummarizerAgent" or
                    agent_name == "ChatSummarizerAgent" or
                    (agent_id and "summarizer" in agent_id.lower()) or
                    (agent_name and "summarizer" in agent_name.lower())
                )
                
                if not is_summarizer:
                    non_summarizer_messages.append(msg)
                else:
                    logger.info(f"Filtered out summarizer message - agent_id: {agent_id}, agent_name: {agent_name}")
            
            logger.info(f"Filtering results - Total messages: {len(chat_history)}, Non-summarizer: {len(non_summarizer_messages)}")
            
            # Check if there are any meaningful messages to analyze (excluding this agent's own messages)
            if not non_summarizer_messages:
                return {
                    "status": "error",
                    "error": "No conversation messages found to analyze. Chat appears to contain only summarizer activations.",
                    "chat_id": chat_id,
                    "timestamp": time.time(),
                    "available_messages": len(chat_history),
                    "summarizer_messages": len(chat_history) - len(non_summarizer_messages)
                }
            
            # Also check for messages with actual content
            messages_with_content = [
                msg for msg in non_summarizer_messages
                if (msg.get("input") and msg.get("input").strip()) or 
                   (msg.get("output") and msg.get("output").strip())
            ]
            
            if not messages_with_content:
                return {
                    "status": "error", 
                    "error": "No meaningful conversation content found to analyze. All messages appear to be empty.",
                    "chat_id": chat_id,
                    "timestamp": time.time(),
                    "total_messages": len(chat_history),
                    "non_summarizer_messages": len(non_summarizer_messages)
                }
            
            logger.info(f"Found {len(messages_with_content)} meaningful messages to analyze (filtered from {len(chat_history)} total)")
            
            # Use the filtered messages with content for analysis
            analysis_messages = messages_with_content
            # Use the filtered messages with content for analysis
            analysis_messages = messages_with_content
            
            # Analyze conversation structure
            conversation_stats = await self._analyze_conversation_structure(analysis_messages)
            
            # Generate conversation summary using LLM
            summary = await self._generate_conversation_summary(
                llm_service, 
                analysis_messages, 
                input_data.get("summary_type", "comprehensive"),
                provider_id=provider_id
            )
            
            # Extract key insights
            insights = await self._extract_conversation_insights(
                llm_service, 
                analysis_messages,
                provider_id=provider_id
            )
            
            # Generate topic analysis
            topics = await self._analyze_conversation_topics(
                llm_service, 
                analysis_messages,
                provider_id=provider_id
            )
            
            return {
                "status": "success",
                "chat_id": chat_id,
                "analysis": {
                    "summary": summary,
                    "insights": insights,
                    "topics": topics,
                    "statistics": conversation_stats,
                    "message_count": len(analysis_messages),
                    "total_activations": len(chat_history),
                    "conversation_span": self._calculate_conversation_span(analysis_messages),
                    "participants": self._identify_participants(analysis_messages)
                },
                "timestamp": time.time(),
                "agent_version": "1.0.0"
            }
            
        except Exception as e:
            logger.error(f"Error processing conversation summary: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "error": f"Failed to process conversation: {str(e)}",
                "chat_id": input_data.get("chat_id", "unknown"),
                "timestamp": time.time()
            }
    
    async def _get_chat_history(self, fiber: FiberApp, chat_id: str) -> List[ChatMessage]:
        """
        Retrieve chat history from agent activations.
        
        Args:
            fiber: FiberApp SDK instance
            chat_id: Chat session identifier
            
        Returns:
            List of activation records representing the conversation
        """
        try:
            # Use the same pattern as the chat-messages component
            response = await fiber.agents.get_activations(
                context={"chat_id": chat_id},
                limit=100,
                sort_by="started_at",
                sort_dir="asc"
            )
            
            # Debug logging to see what we actually got
            logger.info(f"Raw API response for chat {chat_id}: {type(response)} - {response}")
            
            # If response is a string, it's probably an error message
            if isinstance(response, str):
                logger.error(f"get_activations returned string instead of dict: {response}")
                return []
            
            # Handle case where response is None or empty
            if not response:
                logger.warning(f"No activations found for chat {chat_id}")
                return []
            
            # Handle different response structures - could be dict with 'activations' key or direct list
            activations = response
            if isinstance(response, dict):
                activations = response.get('activations', response.get('items', []))
            
            # Ensure activations is a list
            if not isinstance(activations, list):
                logger.warning(f"Unexpected activations type: {type(activations)}")
                return []
            
            # Process activations into conversation messages
            messages = []
            for i, activation in enumerate(activations):
                if not isinstance(activation, dict):
                    logger.warning(f"Skipping invalid activation: {type(activation)}")
                    continue
                
                # Debug: Log raw activation structure for first few messages
                if i < 3:
                    logger.info(f"Raw activation {i} keys: {list(activation.keys())}")
                    logger.info(f"Raw activation {i} agent_id: {activation.get('agent_id')}")
                    logger.info(f"Raw activation {i} agent_name: {activation.get('agent_name')}")
                    logger.info(f"Raw activation {i} full structure: {activation}")
                
                # Safely access nested dictionaries
                context = activation.get("context") or {}
                input_data = activation.get("input_data") or {}
                output_data = activation.get("output_data") or {}
                
                # Handle output_data which can be a string or dict
                if isinstance(output_data, str):
                    output_text = output_data
                elif isinstance(output_data, dict):
                    output_text = output_data.get("response", output_data.get("text", ""))
                else:
                    output_text = activation.get("output_summary", "")
                
                message = {
                    "id": activation.get("id"),
                    "chat_id": context.get("chat_id"),
                    "role": context.get("role", "unknown"),
                    "input": input_data.get("prompt", activation.get("input_summary", "")),
                    "output": output_text,
                    "timestamp": activation.get("started_at"),
                    "status": activation.get("status"),
                    "agent_id": activation.get("agent_id"),
                    "agent_name": activation.get("agent_name")  # Add agent_name field too
                }
                messages.append(message)
                
                # Debug logging for message processing
                logger.info(f"Processed message - Input: '{message.get('input')}', Output: '{message.get('output')}'")
            
            logger.info(f"Retrieved {len(messages)} messages for chat {chat_id}")
            return messages
            
        except Exception as e:
            logger.error(f"Error retrieving chat history: {str(e)}")
            return []
    
    async def _analyze_conversation_structure(self, chat_history: List[ChatMessage]) -> ConversationStats:
        """Analyze the structure and flow of the conversation."""
        stats = {
            "total_messages": len(chat_history),
            "user_messages": len([msg for msg in chat_history if msg.get("role") == "user"]),
            "assistant_messages": len([msg for msg in chat_history if msg.get("role") == "assistant"]),
            "system_messages": len([msg for msg in chat_history if msg.get("role") == "system"]),
            "average_user_message_length": 0,
            "average_assistant_message_length": 0,
            "conversation_turns": 0
        }
        
        user_lengths = []
        assistant_lengths = []
        
        for msg in chat_history:
            if msg.get("role") == "user" and msg.get("input"):
                user_lengths.append(len(msg["input"]))
            elif msg.get("role") == "assistant" and msg.get("output"):
                assistant_lengths.append(len(msg["output"]))
        
        if user_lengths:
            stats["average_user_message_length"] = sum(user_lengths) / len(user_lengths)
        if assistant_lengths:
            stats["average_assistant_message_length"] = sum(assistant_lengths) / len(assistant_lengths)
        
        # Count conversation turns (user message followed by assistant response)
        turns = 0
        for i in range(len(chat_history) - 1):
            if (chat_history[i].get("role") == "user" and 
                chat_history[i + 1].get("role") == "assistant"):
                turns += 1
        
        stats["conversation_turns"] = turns
        return stats
    
    async def _generate_conversation_summary(
        self, 
        llm_service: LLMProviderService, 
        chat_history: List[ChatMessage], 
        summary_type: str = "comprehensive",
        provider_id: Optional[str] = None
    ) -> str:
        """Generate an intelligent conversation summary using LLM."""
        
        # Build conversation context for the LLM
        conversation_text = self._format_conversation_for_llm(chat_history)
        
        summary_prompts = {
            "brief": "Provide a brief 1-2 sentence summary of this conversation:",
            "comprehensive": "Provide a comprehensive summary of this conversation, including main topics, key decisions, and important points discussed:",
            "action_items": "Identify and summarize any action items, decisions, or next steps from this conversation:",
            "key_points": "Extract and summarize the key points and main themes from this conversation:"
        }
        
        prompt = summary_prompts.get(summary_type, summary_prompts["comprehensive"])
        
        full_prompt = f"""
{prompt}

Conversation History:
{conversation_text}

Please provide a clear, structured summary that captures the essence of the discussion.
"""
        
        try:
            response = await llm_service.generate_completion(
                prompt=full_prompt,
                provider_id=provider_id,
                temperature=0.3,
                max_tokens=500
            )
            
            # Parse and validate LLM response
            llm_response = LLMResponse.model_validate(response)
            return llm_response.get_text_or_error()
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return f"Error generating summary: {str(e)}"
    
    async def _extract_conversation_insights(
        self, 
        llm_service: LLMProviderService, 
        chat_history: List[ChatMessage],
        provider_id: Optional[str] = None
    ) -> List[str]:
        """Extract key insights and observations from the conversation."""
        
        conversation_text = self._format_conversation_for_llm(chat_history)
        
        prompt = f"""
Analyze this conversation and provide 3-5 key insights or observations. Focus on:
- Patterns in the discussion
- Problem-solving approaches used
- Communication style and effectiveness
- Areas where the conversation was most productive

Conversation History:
{conversation_text}

Please provide insights as a simple list:
"""
        
        try:
            response = await llm_service.generate_completion(
                prompt=prompt,
                provider_id=provider_id,
                temperature=0.4,
                max_tokens=300
            )
            
            # Parse and validate LLM response
            llm_response = LLMResponse.model_validate(response)
            insights_text = llm_response.get_text_or_error()
            if not llm_response.text.strip():
                return ["Unable to extract insights: No text in LLM response"]
            
            # Parse insights into a list (simple split by lines)
            insights = [
                line.strip().lstrip("- ").lstrip("• ").lstrip("* ")
                for line in insights_text.split("\n")
                if line.strip() and not line.strip().startswith("Insights:")
            ]
            
            return insights[:5] if insights else ["No specific insights identified"]
            
        except Exception as e:
            logger.error(f"Error extracting insights: {str(e)}")
            return [f"Error extracting insights: {str(e)}"]
    
    async def _analyze_conversation_topics(
        self, 
        llm_service: LLMProviderService, 
        chat_history: List[ChatMessage],
        provider_id: Optional[str] = None
    ) -> List[ConversationTopic]:
        """Identify and analyze the main topics discussed."""
        
        conversation_text = self._format_conversation_for_llm(chat_history)
        
        prompt = f"""
Identify the main topics discussed in this conversation. For each topic, provide:
- Topic name
- Brief description
- Approximate portion of conversation (percentage)

Conversation History:
{conversation_text}

Format your response as JSON with this structure:
[
  {{"topic": "Topic Name", "description": "Brief description", "coverage": 30}},
  {{"topic": "Another Topic", "description": "Brief description", "coverage": 20}}
]
"""
        
        try:
            response = await llm_service.generate_completion(
                prompt=prompt,
                provider_id=provider_id,
                temperature=0.3,
                max_tokens=300
            )
            
            # Parse and validate LLM response
            llm_response = LLMResponse.model_validate(response)
            response_text = llm_response.get_text_or_error()
            if not llm_response.text.strip():
                return [{"topic": "Error", "description": "No text in LLM response", "coverage": 0}]
            
            # Try to parse JSON response
            try:
                topics = json.loads(response_text)
                return topics if isinstance(topics, list) else []
            except json.JSONDecodeError:
                # Fallback: extract topics from text
                return [{"topic": "General Discussion", "description": "Unable to parse specific topics", "coverage": 100}]
                
        except Exception as e:
            logger.error(f"Error analyzing topics: {str(e)}")
            return [{"topic": "Error", "description": f"Error analyzing topics: {str(e)}", "coverage": 0}]
    
    def _format_conversation_for_llm(self, chat_history: List[ChatMessage]) -> str:
        """Format conversation history for LLM processing."""
        formatted_messages = []
        
        for msg in chat_history:
            # Handle the actual structure from activations
            input_text = msg.get("input", "")
            output_text = msg.get("output", "")
            
            # Add user input if present
            if input_text:
                formatted_messages.append(f"User: {input_text}")
            
            # Add assistant output if present  
            if output_text:
                formatted_messages.append(f"Assistant: {output_text}")
        
        conversation_text = "\n\n".join(formatted_messages)
        
        # Debug logging to see what we're sending to LLM
        logger.info(f"Formatted conversation for LLM ({len(formatted_messages)} messages):\n{conversation_text}")
        
        return conversation_text
    
    def _calculate_conversation_span(self, chat_history: List[ChatMessage]) -> dict:
        """Calculate the time span of the conversation."""
        if not chat_history:
            return {"duration": 0, "start_time": None, "end_time": None}
        
        timestamps = [msg.get("timestamp") for msg in chat_history if msg.get("timestamp")]
        
        if not timestamps:
            return {"duration": 0, "start_time": None, "end_time": None}
        
        # Sort timestamps
        timestamps.sort()
        start_time = timestamps[0]
        end_time = timestamps[-1]
        
        try:
            # Parse timestamps if they are strings
            if isinstance(start_time, str):
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                duration = (end_dt - start_dt).total_seconds()
            else:
                duration = end_time - start_time
            
            return {
                "duration_seconds": duration,
                "start_time": start_time,
                "end_time": end_time,
                "duration_formatted": self._format_duration(duration)
            }
            
        except Exception as e:
            logger.error(f"Error calculating conversation span: {str(e)}")
            return {"duration": 0, "start_time": start_time, "end_time": end_time}
    
    def _format_duration(self, seconds: float) -> str:
        """Format duration in a human-readable way."""
        if seconds < 60:
            return f"{int(seconds)} seconds"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours} hour{'s' if hours != 1 else ''} {minutes} minute{'s' if minutes != 1 else ''}"
    
    def _identify_participants(self, chat_history: List[ChatMessage]) -> List[str]:
        """Identify unique participants in the conversation."""
        participants = set()
        
        for msg in chat_history:
            role = msg.get("role")
            agent_id = msg.get("agent_id")
            
            if role == "user":
                participants.add("User")
            elif role == "assistant":
                if agent_id:
                    participants.add(f"Assistant ({agent_id})")
                else:
                    participants.add("Assistant")
            elif role == "system":
                participants.add("System")
        
        return list(participants)