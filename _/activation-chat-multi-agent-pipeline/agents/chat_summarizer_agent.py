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

from ..models import LLMResponse, ChatInput, ChatOutput, ChatMessage, ConversationStats, ConversationTopic


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
                input_data.get("summary_type", "comprehensive")
            )
            
            # Extract key insights
            insights = await self._extract_conversation_insights(
                llm_service, 
                analysis_messages
            )
            
            # Generate topic analysis
            topics = await self._analyze_conversation_topics(
                llm_service, 
                analysis_messages
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
                activations = response.get('activations') or response.get('items') or []
            
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
                
                # Determine role and content
                input_content = input_data.get("prompt", activation.get("input_summary", ""))
                output_content = output_text
                
                # Create ChatMessage objects for both user input and assistant output
                if input_content.strip():
                    user_message = ChatMessage(
                        content=input_content,
                        role="user",
                        timestamp=self._parse_timestamp(activation.get("started_at")),
                        activation_id=activation.get("id")
                    )
                    messages.append(user_message)
                
                if output_content.strip():
                    assistant_message = ChatMessage(
                        content=output_content,
                        role="assistant", 
                        timestamp=self._parse_timestamp(activation.get("completed_at") or activation.get("started_at")),
                        activation_id=activation.get("id")
                    )
                    messages.append(assistant_message)
                
                # Debug logging for message processing
                logger.info(f"Processed activation - Input: '{input_content[:50]}...', Output: '{output_content[:50]}...'")
            
            logger.info(f"Retrieved {len(messages)} messages for chat {chat_id}")
            return messages
            
        except Exception as e:
            logger.error(f"Error retrieving chat history: {str(e)}")
            return []
    
    def _parse_timestamp(self, timestamp_str: str) -> Optional[datetime]:
        """Parse timestamp string to datetime object."""
        if not timestamp_str:
            return None
        try:
            # Handle ISO format timestamps
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
    
    async def _analyze_conversation_structure(self, chat_history: List[ChatMessage]) -> ConversationStats:
        """Analyze the structure and flow of the conversation."""
        if not chat_history:
            return ConversationStats()
        
        user_messages = [msg for msg in chat_history if msg.role == "user"]
        assistant_messages = [msg for msg in chat_history if msg.role == "assistant"]
        
        # Calculate participants
        participants = list(set([msg.role for msg in chat_history]))
        
        # Calculate duration
        timestamps = [msg.timestamp for msg in chat_history if msg.timestamp]
        start_time = min(timestamps) if timestamps else None
        end_time = max(timestamps) if timestamps else None
        duration_minutes = 0
        if start_time and end_time:
            duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        return ConversationStats(
            total_messages=len(chat_history),
            user_messages=len(user_messages),
            assistant_messages=len(assistant_messages),
            participants=participants,
            duration_minutes=duration_minutes,
            start_time=start_time,
            end_time=end_time
        )
    
    async def _generate_conversation_summary(
        self, 
        llm_service: LLMProviderService, 
        chat_history: List[ChatMessage], 
        summary_type: str = "comprehensive"
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
        chat_history: List[ChatMessage]
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
        chat_history: List[ChatMessage]
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
                temperature=0.3,
                max_tokens=300
            )
            
            # Parse and validate LLM response
            llm_response = LLMResponse.model_validate(response)
            response_text = llm_response.get_text_or_error()
            if not llm_response.text.strip():
                return [ConversationTopic(topic="Error", description="No text in LLM response", coverage=0)]
            
            # Try to parse JSON response
            try:
                topics_data = json.loads(response_text)
                if isinstance(topics_data, list):
                    return [ConversationTopic.model_validate(topic) for topic in topics_data]
                else:
                    return [ConversationTopic(topic="General Discussion", description="Unable to parse specific topics", coverage=100)]
            except (json.JSONDecodeError, Exception):
                # Fallback: extract topics from text
                return [ConversationTopic(topic="General Discussion", description="Unable to parse specific topics", coverage=100)]
                
        except Exception as e:
            logger.error(f"Error analyzing topics: {str(e)}")
            return [ConversationTopic(topic="Error", description=f"Error analyzing topics: {str(e)}", coverage=0)]
    
    def _format_conversation_for_llm(self, chat_history: List[ChatMessage]) -> str:
        """Format conversation history for LLM processing."""
        formatted_messages = []
        
        for msg in chat_history:
            # Format based on role and content
            if msg.role == "user":
                formatted_messages.append(f"User: {msg.content}")
            elif msg.role == "assistant":
                formatted_messages.append(f"Assistant: {msg.content}")
            else:
                formatted_messages.append(f"{msg.role.title()}: {msg.content}")
        
        conversation_text = "\n\n".join(formatted_messages)
        
        # Debug logging to see what we're sending to LLM
        logger.info(f"Formatted conversation for LLM ({len(formatted_messages)} messages):\n{conversation_text}")
        
        return conversation_text
    
    def _calculate_conversation_span(self, chat_history: List[Dict[str, Any]]) -> Dict[str, Any]:
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
    
    def _identify_participants(self, chat_history: List[Dict[str, Any]]) -> List[str]:
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