"""
Text Processor Agent

Agent for processing and analyzing input text with keyword extraction and sentiment analysis.
"""

from typing import Dict, Any


class AgentResponse:
    def __init__(self, success: bool, data: Dict[str, Any] = None, message: str = "", error: str = ""):
        self.success = success
        self.data = data or {}
        self.message = message
        self.error = error


class AgentError(Exception):
    pass


class Agent:
    def __init__(self, name: str, description: str, version: str):
        self.name = name
        self.description = description
        self.version = version


class TextProcessorAgent(Agent):
    """Agent for processing and analyzing input text"""
    
    def __init__(self):
        super().__init__(
            name="TextProcessorAgent",
            description="Processes and analyzes input text to extract key information and sentiment",
            version="1.0.0"
        )
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        """Execute text processing with real implementation"""
        
        try:
            text = input_data.get('text', '')
            analysis_type = input_data.get('analysis_type', 'comprehensive')
            
            print(f"[TextProcessorAgent] Processing text: {len(text)} characters")
            print(f"[TextProcessorAgent] Analysis type: {analysis_type}")
            
            if not text.strip():
                raise AgentError("No text provided for processing")
            
            # Real text analysis logic
            processed_data = {
                'word_count': len(text.split()),
                'sentence_count': len([s for s in text.split('.') if s.strip()]),
                'character_count': len(text),
                'keywords': self._extract_keywords(text),
                'sentiment': self._analyze_sentiment(text),
                'original_text': text,
                'analysis_type': analysis_type
            }
            
            return AgentResponse(
                success=True,
                data={'processed_data': processed_data},
                message=f"Successfully processed text with {processed_data['word_count']} words"
            )
            
        except Exception as e:
            print(f"[TextProcessorAgent] Error: {str(e)}")
            return AgentResponse(
                success=False,
                error=f"Text processing failed: {str(e)}"
            )
    
    def _extract_keywords(self, text: str) -> list:
        """Extract keywords from text"""
        words = text.lower().split()
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'}
        
        word_freq = {}
        for word in words:
            clean_word = word.strip('.,!?;:"()[]{}').lower()
            if len(clean_word) > 3 and clean_word not in stop_words:
                word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
        
        # Return top 5 keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{'keyword': word, 'frequency': freq, 'relevance': (freq / max(word_freq.values())) * 100 if word_freq else 0} for word, freq in sorted_words]
    
    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Simple sentiment analysis"""
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best', 'awesome', 'outstanding', 'perfect']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'disgusting', 'pathetic', 'useless', 'wrong']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        total_sentiment_words = positive_count + negative_count
        
        if positive_count > negative_count:
            sentiment = 'positive'
            confidence = (positive_count / total_sentiment_words) if total_sentiment_words > 0 else 0.5
        elif negative_count > positive_count:
            sentiment = 'negative'
            confidence = (negative_count / total_sentiment_words) if total_sentiment_words > 0 else 0.5
        else:
            sentiment = 'neutral'
            confidence = 0.6
        
        return {
            'label': sentiment,
            'confidence': round(confidence, 2),
            'positive_indicators': positive_count,
            'negative_indicators': negative_count
        }