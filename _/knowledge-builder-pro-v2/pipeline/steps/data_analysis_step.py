"""
Data Analysis Step

Step for analyzing patterns in research data with actual implementation logic.
"""

from typing import Dict, Any


class DataAnalysisStep:
    """Step for analyzing patterns and trends in research data"""
    
    def __init__(self):
        self.name = "data_analysis"
        self.description = "Analyze patterns and trends in research data"
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data analysis with actual implementation logic"""
        
        data = input_data['data']
        analysis_type = input_data.get('analysis_type', 'comprehensive')
        
        print(f"[DataAnalysisStep] Analyzing patterns in research data")
        print(f"[DataAnalysisStep] Analysis type: {analysis_type}")
        
        # Analyze themes across all sources
        all_content = []
        
        # Collect content from Wikipedia
        wikipedia_data = data.get('wikipedia_data', {})
        if wikipedia_data.get('success'):
            for article in wikipedia_data.get('articles', []):
                all_content.append({
                    'text': article.get('extract', ''),
                    'source': 'wikipedia',
                    'title': article.get('title', '')
                })
        
        # Collect content from web scraping
        web_data = data.get('web_scraped_data', {})
        if web_data.get('success'):
            for result in web_data.get('scraped_results', []):
                content = result.get('content', {})
                all_content.append({
                    'text': content.get('text', ''),
                    'source': 'web_scraped',
                    'title': result.get('title', ''),
                    'url': result.get('url', '')
                })
        
        # Perform actual pattern analysis
        pattern_analysis = {
            'common_themes': self._identify_common_themes(all_content),
            'source_analysis': self._analyze_source_distribution(all_content),
            'content_patterns': self._analyze_content_patterns(all_content),
            'insights': self._generate_pattern_insights(all_content, analysis_type)
        }
        
        return {
            'success': True,
            'data': {'processed_data': pattern_analysis},
            'step_name': self.name,
            'execution_time': 0.0,
            'metadata': {'description': self.description}
        }
    
    def _identify_common_themes(self, content_list: list) -> list:
        """Identify common themes from content analysis"""
        word_freq = {}
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'}
        
        for content in content_list:
            words = content['text'].lower().split()
            for word in words:
                clean_word = word.strip('.,!?;:"()[]{}').lower()
                if len(clean_word) > 3 and clean_word not in common_words:
                    word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
        
        # Get top themes
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        themes = []
        for word, freq in sorted_words:
            themes.append({
                'theme': word,
                'frequency': freq,
                'relevance': min(freq / max(word_freq.values()) * 100, 100) if word_freq else 0
            })
        
        return themes
    
    def _analyze_source_distribution(self, content_list: list) -> dict:
        """Analyze distribution of content sources"""
        source_counts = {}
        for content in content_list:
            source = content['source']
            source_counts[source] = source_counts.get(source, 0) + 1
        
        total = len(content_list)
        return {
            'source_counts': source_counts,
            'source_percentages': {k: (v / total) * 100 for k, v in source_counts.items()} if total > 0 else {},
            'source_diversity': len(source_counts)
        }
    
    def _analyze_content_patterns(self, content_list: list) -> dict:
        """Analyze patterns in content structure"""
        if not content_list:
            return {'average_content_length': 0, 'total_sources': 0, 'content_quality': 'no_data'}
            
        avg_length = sum(len(content['text']) for content in content_list) / len(content_list)
        
        return {
            'average_content_length': avg_length,
            'total_sources': len(content_list),
            'content_quality': 'high' if avg_length > 500 else 'medium' if avg_length > 200 else 'low'
        }
    
    def _generate_pattern_insights(self, content_list: list, analysis_type: str) -> list:
        """Generate insights from pattern analysis"""
        insights = []
        
        if not content_list:
            return insights
        
        # Source diversity insight
        source_types = set(content['source'] for content in content_list)
        if len(source_types) > 1:
            insights.append({
                'insight_type': 'source_diversity',
                'description': f"Research draws from {len(source_types)} different source types, indicating good diversity",
                'confidence': 0.9
            })
        
        # Content quality insight
        avg_length = sum(len(content['text']) for content in content_list) / len(content_list)
        if avg_length > 500:
            insights.append({
                'insight_type': 'content_quality',
                'description': f"Average content length of {avg_length:.0f} characters indicates high-quality, detailed sources",
                'confidence': 0.8
            })
        
        return insights