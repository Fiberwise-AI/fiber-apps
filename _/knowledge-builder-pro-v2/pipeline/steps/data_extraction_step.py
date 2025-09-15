"""
Data Extraction Step

Step for extracting key information from research data with actual implementation logic.
"""

from typing import Dict, Any


class DataExtractionStep:
    """Step for extracting key information from research data"""
    
    def __init__(self):
        self.name = "data_extraction"
        self.description = "Extract key information from research data"
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data extraction with actual implementation logic"""
        
        data = input_data['data']
        analysis_type = input_data.get('analysis_type', 'comprehensive')
        
        print(f"[DataExtractionStep] Extracting key information from research data")
        print(f"[DataExtractionStep] Analysis type: {analysis_type}")
        
        extracted_info = {
            'key_concepts': [],
            'important_facts': [],
            'statistical_data': [],
            'references': [],
            'metadata': {}
        }
        
        # Process Wikipedia data
        wikipedia_data = data.get('wikipedia_data', {})
        if wikipedia_data.get('success'):
            for article in wikipedia_data.get('articles', []):
                # Extract key concepts from titles and summaries
                extracted_info['key_concepts'].append({
                    'concept': article.get('title', ''),
                    'description': self._truncate_text(article.get('extract', ''), 200),
                    'source': 'wikipedia',
                    'confidence': 0.9
                })
                
                # Extract references
                for ref in article.get('references', []):
                    extracted_info['references'].append({
                        'url': ref.get('url', ''),
                        'title': ref.get('title', ''),
                        'source_type': 'wikipedia_reference',
                        'reliability': 'high'
                    })
        
        # Process web scraped data
        web_data = data.get('web_scraped_data', {})
        if web_data.get('success'):
            for result in web_data.get('scraped_results', []):
                content = result.get('content', {})
                
                if content.get('text'):
                    # Extract important facts from content
                    text_snippets = content['text'][:500].split('. ')[:3]
                    for snippet in text_snippets:
                        if len(snippet.strip()) > 20:
                            extracted_info['important_facts'].append({
                                'fact': snippet.strip(),
                                'source': result.get('url', ''),
                                'confidence': 0.7,
                                'extraction_method': 'text_analysis'
                            })
                
                # Extract statistical data (look for numbers)
                if content.get('text'):
                    statistical_matches = self._extract_statistical_data(content['text'])
                    extracted_info['statistical_data'].extend(statistical_matches)
        
        # Add extraction metadata
        extracted_info['metadata'] = {
            'extraction_timestamp': context.get('start_time'),
            'analysis_type': analysis_type,
            'total_concepts': len(extracted_info['key_concepts']),
            'total_facts': len(extracted_info['important_facts']),
            'total_references': len(extracted_info['references']),
            'total_statistics': len(extracted_info['statistical_data'])
        }
        
        return {
            'success': True,
            'data': {'processed_data': extracted_info},
            'step_name': self.name,
            'execution_time': 0.0,
            'metadata': {'description': self.description}
        }
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to maximum length"""
        if len(text) <= max_length:
            return text
        return text[:max_length] + '...'
    
    def _extract_statistical_data(self, text: str) -> list:
        """Extract statistical data from text"""
        import re
        
        statistical_data = []
        
        # Look for percentage patterns
        percentage_pattern = r'(\d+(?:\.\d+)?)\s*%'
        percentages = re.findall(percentage_pattern, text)
        for percent in percentages:
            statistical_data.append({
                'type': 'percentage',
                'value': float(percent),
                'unit': '%',
                'context': 'extracted_from_text'
            })
        
        # Look for number patterns with common units
        number_pattern = r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|thousand|years?|people|users?|dollars?|\$)?'
        numbers = re.findall(number_pattern, text, re.IGNORECASE)
        for number, unit in numbers:
            if unit:  # Only include numbers with units
                clean_number = number.replace(',', '')
                try:
                    value = float(clean_number)
                    statistical_data.append({
                        'type': 'quantitative',
                        'value': value,
                        'unit': unit,
                        'context': 'extracted_from_text'
                    })
                except ValueError:
                    continue
        
        return statistical_data[:5]  # Limit to 5 statistical points