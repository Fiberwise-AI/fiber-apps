"""
Text Processing Step

First step that processes and analyzes input text.
"""

from typing import Dict, Any


class TextProcessingStep:
    """Step for processing and analyzing input text"""
    
    def __init__(self):
        self.name = "text_processing"
        self.description = "Process and analyze input text"
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute text processing with real implementation"""
        
        text = input_data.get('text', '')
        
        print(f"[TextProcessingStep] Processing text: {len(text)} characters")
        
        # Real text analysis logic
        processed_data = {
            'word_count': len(text.split()),
            'sentence_count': len(text.split('.')),
            'keywords': self._extract_keywords(text),
            'sentiment': self._analyze_sentiment(text),
            'original_text': text
        }
        
        return {
            'success': True,
            'data': {'processed_data': processed_data},
            'step_name': self.name,
            'execution_time': 0.1
        }
    
    def _extract_keywords(self, text: str) -> list:
        """Extract keywords from text"""
        words = text.lower().split()
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        word_freq = {}
        for word in words:
            clean_word = word.strip('.,!?;:"()[]{}').lower()
            if len(clean_word) > 3 and clean_word not in stop_words:
                word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
        
        # Return top 5 keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{'keyword': word, 'frequency': freq} for word, freq in sorted_words]
    
    def _analyze_sentiment(self, text: str) -> str:
        """Simple sentiment analysis"""
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'