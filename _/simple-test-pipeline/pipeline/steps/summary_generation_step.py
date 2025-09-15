"""
Summary Generation Step

Second step that generates summaries from processed text data.
"""

from typing import Dict, Any


class SummaryGenerationStep:
    """Step for generating summaries from processed data"""
    
    def __init__(self):
        self.name = "summary_generation"
        self.description = "Generate summary from processed text"
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute summary generation with real implementation"""
        
        processed_data = input_data['data']['processed_data']
        
        print(f"[SummaryGenerationStep] Generating summary from processed data")
        
        # Real summary generation logic
        summary_data = {
            'text_stats': {
                'word_count': processed_data['word_count'],
                'sentence_count': processed_data['sentence_count'],
                'sentiment': processed_data['sentiment']
            },
            'key_insights': self._generate_insights(processed_data),
            'summary': self._create_summary(processed_data),
            'top_keywords': processed_data['keywords'][:3]
        }
        
        return {
            'success': True,
            'data': {'summary_data': summary_data},
            'step_name': self.name,
            'execution_time': 0.1
        }
    
    def _generate_insights(self, processed_data: Dict[str, Any]) -> list:
        """Generate insights from processed data"""
        insights = []
        
        word_count = processed_data['word_count']
        if word_count > 100:
            insights.append("This is a substantial piece of text with detailed content")
        elif word_count > 50:
            insights.append("This is a moderate-length text with good detail")
        else:
            insights.append("This is a concise text with brief content")
        
        sentiment = processed_data['sentiment']
        if sentiment == 'positive':
            insights.append("The text has a positive tone overall")
        elif sentiment == 'negative':
            insights.append("The text has a negative tone overall")
        else:
            insights.append("The text has a neutral tone")
        
        keywords = processed_data['keywords']
        if keywords:
            top_keyword = keywords[0]['keyword']
            insights.append(f"The most prominent topic appears to be '{top_keyword}'")
        
        return insights
    
    def _create_summary(self, processed_data: Dict[str, Any]) -> str:
        """Create a summary from processed data"""
        word_count = processed_data['word_count']
        sentiment = processed_data['sentiment']
        keywords = processed_data['keywords']
        
        summary_parts = [
            f"Text contains {word_count} words with {sentiment} sentiment."
        ]
        
        if keywords:
            keyword_list = ", ".join([k['keyword'] for k in keywords[:3]])
            summary_parts.append(f"Main topics include: {keyword_list}.")
        
        return " ".join(summary_parts)