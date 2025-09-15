"""
Simple Text Processing Pipeline

A 2-step pipeline that can be activated with 'fiber activate ./simple_text_pipeline.py'
Clean implementation without external dependencies.
"""

from typing import Dict, Any
from datetime import datetime


class SimpleTextPipeline:
    """2-step text processing pipeline that can be activated by fiber CLI"""
    
    def __init__(self):
        self.name = "simple_text_pipeline"
        self.description = "2-step pipeline for text processing and summary generation"
    
    async def execute_step(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the 2-step text processing pipeline"""
        
        text = input_data.get('text', '')
        analysis_type = input_data.get('analysis_type', 'comprehensive')
        
        if not text.strip():
            return {'error': 'No text provided for processing'}
        
        print(f"[SimpleTextPipeline] Starting 2-step pipeline execution")
        print(f"[SimpleTextPipeline] Input text: {len(text)} characters")
        print(f"[SimpleTextPipeline] Analysis type: {analysis_type}")
        
        # Step 1: Text Processing
        print(f"\n=== STEP 1: TEXT PROCESSING ===")
        step1_result = await self._text_processing_step(text, analysis_type)
        
        if not step1_result['success']:
            return {'error': f"Step 1 failed: {step1_result['error']}"}
        
        processed_data = step1_result['processed_data']
        print(f"Step 1 completed: {processed_data['word_count']} words, {processed_data['sentiment']['label']} sentiment")
        
        # Step 2: Summary Generation  
        print(f"\n=== STEP 2: SUMMARY GENERATION ===")
        step2_result = await self._summary_generation_step(processed_data, analysis_type)
        
        if not step2_result['success']:
            return {'error': f"Step 2 failed: {step2_result['error']}"}
        
        summary_data = step2_result['summary_data']
        print(f"Step 2 completed: Summary generated with {len(summary_data['key_insights'])} insights")
        
        # Combine results
        final_result = {
            'summary': summary_data['summary'],
            'word_count': processed_data['word_count'],
            'sentiment': processed_data['sentiment']['label'],
            'keywords': [k['keyword'] for k in processed_data['keywords'][:5]],
            'insights': [insight['insight'] for insight in summary_data['key_insights']]
        }
        
        print(f"\n=== PIPELINE COMPLETED ===")
        print(f"Summary: {final_result['summary']}")
        print(f"Keywords: {', '.join(final_result['keywords'])}")
        
        return final_result
    
    async def _text_processing_step(self, text: str, analysis_type: str) -> Dict[str, Any]:
        """Step 1: Text processing and analysis"""
        
        try:
            words = text.split()
            sentences = [s.strip() for s in text.split('.') if s.strip()]
            
            # Extract keywords
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'}
            
            word_freq = {}
            for word in words:
                clean_word = word.strip('.,!?;:"()[]{}').lower()
                if len(clean_word) > 3 and clean_word not in stop_words:
                    word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
            
            # Top keywords
            sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            keywords = [{'keyword': word, 'frequency': freq, 'relevance': (freq / max(word_freq.values())) * 100 if word_freq else 0} for word, freq in sorted_words]
            
            # Sentiment analysis
            positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best', 'awesome']
            negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'disgusting']
            
            text_lower = text.lower()
            positive_count = sum(1 for word in positive_words if word in text_lower)
            negative_count = sum(1 for word in negative_words if word in text_lower)
            
            if positive_count > negative_count:
                sentiment = {'label': 'positive', 'confidence': 0.8}
            elif negative_count > positive_count:
                sentiment = {'label': 'negative', 'confidence': 0.8}
            else:
                sentiment = {'label': 'neutral', 'confidence': 0.6}
            
            processed_data = {
                'word_count': len(words),
                'sentence_count': len(sentences),
                'character_count': len(text),
                'keywords': keywords,
                'sentiment': sentiment,
                'analysis_type': analysis_type
            }
            
            return {
                'success': True,
                'processed_data': processed_data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Text processing failed: {str(e)}"
            }
    
    async def _summary_generation_step(self, processed_data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
        """Step 2: Summary generation and insights"""
        
        try:
            word_count = processed_data['word_count']
            sentiment = processed_data['sentiment']
            keywords = processed_data['keywords']
            
            # Generate insights
            insights = []
            
            if word_count > 100:
                insights.append({'insight': 'This is a substantial piece of text with detailed content', 'confidence': 0.9})
            elif word_count > 50:
                insights.append({'insight': 'This is a moderate-length text with good detail', 'confidence': 0.8})
            else:
                insights.append({'insight': 'This is a concise text with brief content', 'confidence': 0.7})
            
            insights.append({
                'insight': f"{sentiment['label'].capitalize()} sentiment detected with {sentiment['confidence']:.0%} confidence",
                'confidence': sentiment['confidence']
            })
            
            if keywords:
                top_keyword = keywords[0]['keyword']
                insights.append({
                    'insight': f"Primary focus appears to be '{top_keyword}' based on keyword analysis",
                    'confidence': 0.8
                })
            
            # Create summary
            summary_parts = [f"Text analysis of {word_count} words reveals {sentiment['label']} sentiment."]
            
            if keywords:
                keyword_list = ", ".join([k['keyword'] for k in keywords[:3]])
                summary_parts.append(f"Primary topics include: {keyword_list}.")
            
            if analysis_type == 'comprehensive':
                sentence_count = processed_data['sentence_count']
                avg_sentence_length = word_count / max(sentence_count, 1)
                summary_parts.append(f"Text structure consists of {sentence_count} sentences with average length of {avg_sentence_length:.1f} words.")
            
            summary = " ".join(summary_parts)
            
            summary_data = {
                'summary': summary,
                'key_insights': insights,
                'analysis_type': analysis_type
            }
            
            return {
                'success': True,
                'summary_data': summary_data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Summary generation failed: {str(e)}"
            }


# Pipeline factory function for fiber activate command
async def execute(input_data: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Entry point for fiber activate command.
    
    This function will be called when running:
    fiber activate ./simple_text_pipeline.py --input-data '{"text": "Your text here"}'
    """
    pipeline = SimpleTextPipeline()
    result_data = await pipeline.execute_step(input_data, context or {})
    
    return {
        'success': True if 'error' not in result_data else False,
        'data': result_data,
        'step_name': pipeline.name,
        'execution_time': 0.0,
        'timestamp': datetime.now().isoformat()
    }


# Direct execution for testing
if __name__ == "__main__":
    import asyncio
    
    # Test data
    test_input = {
        'text': 'Artificial intelligence is transforming the world in amazing ways. Machine learning algorithms are becoming more sophisticated and powerful. This technology enables computers to learn from data and make intelligent decisions.',
        'analysis_type': 'comprehensive'
    }
    
    async def main():
        result = await execute(test_input)
        print(f"\nFinal Result:")
        print(f"Success: {result['success']}")
        if result['success']:
            data = result['data']
            print(f"Summary: {data['summary']}")
            print(f"Keywords: {', '.join(data['keywords'])}")
            print(f"Sentiment: {data['sentiment']}")
        else:
            print(f"Error: {result['data'].get('error')}")
    
    asyncio.run(main())