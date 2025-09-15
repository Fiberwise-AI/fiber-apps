"""
Data Transformation Step

Step for transforming data into structured formats with actual implementation logic.
"""

import sys
import os
from typing import Dict, Any, Type

# Add fiberwise-common to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'fiberwise-common'))

from fiberwise_common.pipeline_steps import (
    PipelineStep,
    StepInputSchema,
    StepOutputSchema,
    DataProcessingInputSchema,
    DataProcessingOutputSchema
)


class DataTransformationStep(PipelineStep):
    """Step for transforming data into structured format for analysis"""
    
    def __init__(self):
        super().__init__(
            name="data_transformation",
            description="Transform data into structured format for analysis"
        )
    
    def define_input_schema(self) -> Type[StepInputSchema]:
        return DataProcessingInputSchema
    
    def define_output_schema(self) -> Type[StepOutputSchema]:
        return DataProcessingOutputSchema
    
    async def execute_step(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data transformation with actual implementation logic"""
        
        data = input_data['data']
        analysis_type = input_data.get('analysis_type', 'comprehensive')
        
        print(f"[DataTransformationStep] Transforming data into structured format")
        print(f"[DataTransformationStep] Analysis type: {analysis_type}")
        
        structured_data = {
            'topics': {},
            'entities': [],
            'relationships': [],
            'timeline': [],
            'categories': {},
            'knowledge_graph': {}
        }
        
        # Transform Wikipedia data into structured topics
        wikipedia_data = data.get('wikipedia_data', {})
        if wikipedia_data.get('success'):
            for i, article in enumerate(wikipedia_data.get('articles', [])):
                topic_id = f"topic_{i + 1}"
                structured_data['topics'][topic_id] = {
                    'title': article.get('title', ''),
                    'summary': article.get('extract', ''),
                    'source': 'wikipedia',
                    'importance': 'high' if i == 0 else 'medium',  # First article is most important
                    'data_points': self._extract_data_points_from_text(article.get('extract', ''))
                }
        
        # Transform web data into entities and relationships
        web_data = data.get('web_scraped_data', {})
        if web_data.get('success'):
            for result in web_data.get('scraped_results', []):
                content = result.get('content', {})
                
                # Extract entities from headings
                for heading in content.get('headings', []):
                    if len(heading.strip()) > 5:  # Filter out short headings
                        structured_data['entities'].append({
                            'entity_id': f"entity_{len(structured_data['entities']) + 1}",
                            'name': heading.strip(),
                            'type': 'concept',
                            'source_url': result.get('url', ''),
                            'context': 'heading',
                            'confidence': 0.8
                        })
                
                # Create relationships between topics and web sources
                for topic_id, topic in structured_data['topics'].items():
                    if topic['title'].lower() in content.get('text', '').lower():
                        structured_data['relationships'].append({
                            'relationship_id': f"rel_{len(structured_data['relationships']) + 1}",
                            'from': topic_id,
                            'to': result.get('url', ''),
                            'relationship_type': 'mentioned_in',
                            'strength': 0.6,
                            'source': 'web_scraping'
                        })
        
        # Create timeline from extracted data if temporal information is available
        structured_data['timeline'] = self._create_timeline(structured_data)
        
        # Categorize data into meaningful groups
        structured_data['categories'] = self._categorize_research_data(structured_data)
        
        # Build knowledge graph connections
        structured_data['knowledge_graph'] = self._build_knowledge_graph(structured_data)
        
        analysis_results = [
            {
                'analysis_id': 'transform_001',
                'type': 'data_structuring',
                'result': f"Structured data into {len(structured_data['topics'])} topics, {len(structured_data['entities'])} entities, and {len(structured_data['relationships'])} relationships",
                'confidence': 0.85
            }
        ]
        
        return {
            'success': True,
            'processed_data': structured_data,
            'analysis_results': analysis_results
        }
    
    def _extract_data_points_from_text(self, text: str) -> list:
        """Extract structured data points from text"""
        if not text:
            return []
            
        sentences = text.split('. ')[:3]  # First 3 sentences
        data_points = []
        
        for sentence in sentences:
            clean_sentence = sentence.strip()
            if len(clean_sentence) > 10:
                data_points.append({
                    'point': clean_sentence,
                    'type': 'fact',
                    'confidence': 0.7
                })
        
        return data_points
    
    def _create_timeline(self, structured_data: dict) -> list:
        """Create timeline from structured data"""
        timeline = []
        
        # Look for temporal information in topics
        for topic_id, topic in structured_data['topics'].items():
            # Simple pattern matching for years
            import re
            year_pattern = r'\b(19|20)\d{2}\b'
            years = re.findall(year_pattern, topic['summary'])
            
            for year in years[:2]:  # Limit to 2 years per topic
                timeline.append({
                    'timeline_id': f"time_{len(timeline) + 1}",
                    'year': int(year),
                    'event': f"Related to {topic['title']}",
                    'source': topic_id,
                    'confidence': 0.6
                })
        
        # Sort timeline by year
        timeline.sort(key=lambda x: x['year'])
        return timeline
    
    def _categorize_research_data(self, structured_data: dict) -> dict:
        """Categorize research data into meaningful groups"""
        categories = {
            'primary_sources': [],
            'secondary_sources': [],
            'factual_content': [],
            'analytical_content': [],
            'temporal_content': []
        }
        
        # Categorize topics by source
        for topic_id, topic in structured_data['topics'].items():
            if topic['source'] == 'wikipedia':
                categories['secondary_sources'].append(topic_id)
                categories['factual_content'].append(topic_id)
            else:
                categories['primary_sources'].append(topic_id)
        
        # Categorize entities
        for entity in structured_data['entities']:
            if entity['context'] == 'heading':
                categories['analytical_content'].append(entity['entity_id'])
        
        # Categorize timeline items
        if structured_data['timeline']:
            categories['temporal_content'] = [item['timeline_id'] for item in structured_data['timeline']]
        
        return categories
    
    def _build_knowledge_graph(self, structured_data: dict) -> dict:
        """Build knowledge graph connections"""
        knowledge_graph = {
            'nodes': [],
            'edges': [],
            'clusters': {}
        }
        
        # Create nodes from topics
        for topic_id, topic in structured_data['topics'].items():
            knowledge_graph['nodes'].append({
                'node_id': topic_id,
                'label': topic['title'],
                'type': 'topic',
                'importance': topic['importance'],
                'source': topic['source']
            })
        
        # Create nodes from entities
        for entity in structured_data['entities'][:10]:  # Limit to 10 entities
            knowledge_graph['nodes'].append({
                'node_id': entity['entity_id'],
                'label': entity['name'],
                'type': 'entity',
                'importance': 'low',
                'source': 'web_scraping'
            })
        
        # Create edges from relationships
        for relationship in structured_data['relationships']:
            knowledge_graph['edges'].append({
                'edge_id': relationship['relationship_id'],
                'from': relationship['from'],
                'to': relationship['to'],
                'type': relationship['relationship_type'],
                'weight': relationship['strength']
            })
        
        # Create clusters based on source type
        knowledge_graph['clusters'] = {
            'wikipedia_cluster': [node['node_id'] for node in knowledge_graph['nodes'] if node['source'] == 'wikipedia'],
            'web_cluster': [node['node_id'] for node in knowledge_graph['nodes'] if node['source'] == 'web_scraping']
        }
        
        return knowledge_graph