"""
Summary Agent - Provides chat conversation summaries

This agent requires LLMProviderService for generating summaries, analyzing
sentiment, and extracting key points from conversations.
"""

import asyncio

async def run_agent(input_data, llm_provider_service=None):
    """
    Create a summary of chat messages in a conversation.
    
    Args:
        input_data: Dictionary containing:
            - messages: List of messages to summarize
            - chat_id: The ID of the current chat
            - max_length: Maximum length for summary
            - include_sentiment: Whether to include sentiment analysis
        llm_provider_service: LLM service for text generation (required)
    
    Returns:
        Dictionary with summary information and metadata
        
    Raises:
        ValueError: If required parameters or dependencies are missing
    """
    # Validate required dependency
    if not llm_provider_service:
        raise ValueError("LLMProviderService is required but not provided")
    
    # Extract input parameters (throw errors if required fields are missing)
    if 'messages' not in input_data:
        raise ValueError("Input must include 'messages' field")
    
    messages = input_data['messages']
    chat_id = input_data['chat_id']
    max_length = input_data.get('max_length', 200)
    include_sentiment = input_data.get('include_sentiment', True)
    
    # Handle empty messages
    if not messages:
        return {
            "summary": "No messages to summarize.",
            "message_count": 0,
            "sentiment": "neutral",
            "key_points": [],
            "chat_id": chat_id,
            "timestamp": "__CURRENT_TIMESTAMP__"
        }
    
    # Count messages
    message_count = len(messages)
    
    # Extract text content
    message_texts = [msg.get('content', '') for msg in messages if msg.get('content')]
    all_text = "\n".join(message_texts)
    
    # Generate summary using LLM
    summary_prompt = f"""Please summarize the following conversation in a concise way, 
                    keeping the summary under {max_length} characters:
                    
                    {all_text}
                    
                    Summary:"""
    
    summary_result = await llm_provider_service.execute_llm_request(
        provider_id="",
        prompt=summary_prompt,
        max_tokens=max_length
    )
    summary = summary_result.get('text', '')
    
    # Get sentiment analysis if requested
    sentiment = "neutral"
    if include_sentiment:
        sentiment_prompt = f"""Analyze the sentiment of this conversation and return only 
                          one word: positive, negative, or neutral.
                          
                          Conversation:
                          {all_text}
                          
                          Sentiment (one word only):"""
        
        sentiment_result = await llm_provider_service.execute_llm_request(
            provider_id="",
            prompt=sentiment_prompt,
            max_tokens=10,
            temperature=0.3
        )
        
        sentiment_text = sentiment_result.get('text', '').strip().lower()
        # Extract just the sentiment word
        if "positive" in sentiment_text:
            sentiment = "positive"
        elif "negative" in sentiment_text:
            sentiment = "negative"
        else:
            sentiment = "neutral"
    
    # Generate key points
    key_points_prompt = f"""
    Extract 3-5 key points from this conversation:
    
    {all_text}
    
    Format as bullet points, one per line:
    """
    
    key_points_result = await llm_provider_service.execute_llm_request(
        provider_id="",
        prompt=key_points_prompt,
        temperature=0.3,
        max_tokens=200
    )
    
    # Process the returned text into list items
    key_points = []
    if key_points_result.get('text'):
        # Split by lines and clean up bullet points
        text_lines = key_points_result['text'].strip().split('\n')
        key_points = [line.strip().lstrip('•-*').strip() for line in text_lines if line.strip()]
    
    return {
        "summary": summary,
        "message_count": message_count,
        "sentiment": sentiment,
        "key_points": key_points,
        "chat_id": chat_id,
        "timestamp": "__CURRENT_TIMESTAMP__"
    }
