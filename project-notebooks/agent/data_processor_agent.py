"""
Data Processor Agent - Processes data and stores results

This agent demonstrates how to use the PlatformService for data operations
and the LLMProviderService for text generation in a custom agent.
"""
from fiberwise import PlatformService
import asyncio
from typing import Dict, Any, Optional

async def run_agent(input_data: Dict[str, Any], platform: PlatformService) -> Dict[str, Any]:
    """
    Process data and store results.
    
    Args:
        input_data: Dictionary containing:
            - content: Text to analyze
            - chat_id: The ID of the current chat
        llm: LLM service for text generation
        platform: Platform service for data operations (optional)
    
    Returns:
        Dictionary with processing results
    """
    # Extract parameters
    content = input_data.get('content', '')
    chat_id = input_data.get('chat_id', 'unknown')
    platform.data.list()
    # Initialize result
    result = {
        "original_content": content,
        "chat_id": chat_id,
        "timestamp": "__CURRENT_TIMESTAMP__",
        "analysis": {}
    }
    
    # Get sentiment analysis using LLM
    try:
        prompt = f"""Analyze the sentiment and key themes of this text. 
                  Return a JSON object with sentiment (positive, negative, neutral) 
                  and an array of key themes.
                  
                  Text: {content}
                  
                  JSON:"""
        
        response = await llm.execute_llm_request(
            provider_id="",
            prompt=prompt,
            output_schema={"type": "json"}
        )
        
        if response.get('structured_data'):
            result["analysis"] = response['structured_data']
        else:
            result["analysis"] = {
                "sentiment": "unknown",
                "themes": []
            }
    except Exception as e:
        result["analysis_error"] = str(e)
    
    # Store result in data model if platform service is available
    if platform:
        try:
            # Create a processed message record
            stored_item = await platform.create_data_item("processed_messages", {
                "content": content,
                "chat_id": chat_id,
                "analysis": result["analysis"]
            })
            
            result["stored_item_id"] = stored_item.get("item_id")
        except Exception as e:
            result["storage_error"] = str(e)
    
    return result
