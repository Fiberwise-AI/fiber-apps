"""
Summarizer Agent

Agent for generating summaries and insights from processed text data.
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


class SummarizerAgent(Agent):
    """Agent for generating summaries and insights from processed data"""
    
    def __init__(self):
        super().__init__(
            name="SummarizerAgent",
            description="Generates summaries and insights from processed text data",
            version="1.0.0"
        )
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        """Execute summary generation with real implementation"""
        
        try:
            # Extract processed data from previous step
            processed_data = input_data.get('processed_data')
            if not processed_data:
                raise AgentError("No processed data provided for summarization")
            
            summary_type = input_data.get('summary_type', 'comprehensive')
            
            print(f"[SummarizerAgent] Generating summary from processed data")
            print(f"[SummarizerAgent] Summary type: {summary_type}")
            
            # Real summary generation logic
            summary_data = {
                'text_statistics': {
                    'word_count': processed_data['word_count'],
                    'sentence_count': processed_data['sentence_count'],
                    'character_count': processed_data['character_count']
                },
                'sentiment_analysis': processed_data['sentiment'],
                'key_insights': self._generate_insights(processed_data),
                'summary': self._create_summary(processed_data, summary_type),
                'top_keywords': processed_data['keywords'][:3],
                'analysis_metadata': {
                    'analysis_type': processed_data.get('analysis_type', 'comprehensive'),
                    'processing_timestamp': context.get('start_time'),
                    'summary_type': summary_type
                }
            }
            
            return AgentResponse(
                success=True,
                data={'summary_data': summary_data},
                message=f"Successfully generated {summary_type} summary with {len(summary_data['key_insights'])} insights"
            )
            
        except Exception as e:
            print(f"[SummarizerAgent] Error: {str(e)}")
            return AgentResponse(
                success=False,
                error=f"Summary generation failed: {str(e)}"
            )
    
    def _generate_insights(self, processed_data: Dict[str, Any]) -> list:
        """Generate insights from processed data"""
        insights = []
        
        word_count = processed_data['word_count']
        sentence_count = processed_data['sentence_count']
        sentiment = processed_data['sentiment']
        keywords = processed_data['keywords']
        
        # Text length insights
        if word_count > 100:
            insights.append({
                'type': 'text_length',
                'insight': "This is a substantial piece of text with detailed content",
                'confidence': 0.9
            })
        elif word_count > 50:
            insights.append({
                'type': 'text_length',
                'insight': "This is a moderate-length text with good detail",
                'confidence': 0.8
            })
        else:
            insights.append({
                'type': 'text_length',
                'insight': "This is a concise text with brief content",
                'confidence': 0.7
            })
        
        # Sentence structure insights
        avg_words_per_sentence = word_count / max(sentence_count, 1)
        if avg_words_per_sentence > 20:
            insights.append({
                'type': 'structure',
                'insight': f"Text uses complex sentences with an average of {avg_words_per_sentence:.1f} words per sentence",
                'confidence': 0.8
            })
        elif avg_words_per_sentence > 10:
            insights.append({
                'type': 'structure',
                'insight': f"Text has moderately complex sentences ({avg_words_per_sentence:.1f} words per sentence)",
                'confidence': 0.7
            })
        else:
            insights.append({
                'type': 'structure',
                'insight': f"Text uses simple, concise sentences ({avg_words_per_sentence:.1f} words per sentence)",
                'confidence': 0.7
            })
        
        # Sentiment insights
        sentiment_confidence = sentiment.get('confidence', 0)
        if sentiment_confidence > 0.7:
            insights.append({
                'type': 'sentiment',
                'insight': f"Strong {sentiment['label']} sentiment detected with high confidence ({sentiment_confidence:.0%})",
                'confidence': sentiment_confidence
            })
        else:
            insights.append({
                'type': 'sentiment',
                'insight': f"Moderate {sentiment['label']} sentiment detected",
                'confidence': sentiment_confidence
            })
        
        # Keyword insights
        if keywords:
            top_keyword = keywords[0]['keyword']
            keyword_relevance = keywords[0]['relevance']
            insights.append({
                'type': 'content',
                'insight': f"Primary focus appears to be '{top_keyword}' with {keyword_relevance:.1f}% relevance",
                'confidence': min(keyword_relevance / 100, 0.9)
            })
        
        return insights
    
    def _create_summary(self, processed_data: Dict[str, Any], summary_type: str) -> str:
        """Create a summary from processed data"""
        word_count = processed_data['word_count']
        sentiment = processed_data['sentiment']['label']
        keywords = processed_data['keywords']
        
        summary_parts = []
        
        # Basic summary
        summary_parts.append(f"Text analysis of {word_count} words reveals {sentiment} sentiment.")
        
        # Add keyword information
        if keywords:
            if len(keywords) >= 3:
                keyword_list = ", ".join([k['keyword'] for k in keywords[:3]])
                summary_parts.append(f"Primary topics include: {keyword_list}.")
            else:
                keyword_list = ", ".join([k['keyword'] for k in keywords])
                summary_parts.append(f"Main topic: {keyword_list}.")
        
        # Add comprehensive details if requested
        if summary_type == 'comprehensive':
            sentence_count = processed_data['sentence_count']
            avg_sentence_length = word_count / max(sentence_count, 1)
            
            summary_parts.append(f"Structure consists of {sentence_count} sentences with average length of {avg_sentence_length:.1f} words.")
            
            sentiment_confidence = processed_data['sentiment']['confidence']
            summary_parts.append(f"Sentiment confidence: {sentiment_confidence:.0%}.")
        
        return " ".join(summary_parts)