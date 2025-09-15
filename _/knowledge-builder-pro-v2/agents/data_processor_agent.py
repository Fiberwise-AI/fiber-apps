"""
Data Processor Agent

Agent for processing and analyzing research data from various sources.
Handles extraction, transformation, and analysis of Wikipedia and web scraped data.
"""

import json
from typing import Dict, Any, List
from datetime import datetime


async def data_processor_agent(mode: str, data: Dict[str, Any], analysis_type: str = 'comprehensive') -> Dict[str, Any]:
    """
    Process research data based on specified mode and analysis type.
    
    Args:
        mode: Processing mode ('extract', 'transform', 'analyze', 'validate')
        data: Input data to process
        analysis_type: Type of analysis ('comprehensive', 'summary', 'insights')
        
    Returns:
        Processed data with analysis results
    """
    
    print(f"[DataProcessor] Processing data in {mode} mode")
    print(f"[DataProcessor] Analysis type: {analysis_type}")
    
    try:
        if mode == 'extract':
            return await extract_key_information(data, analysis_type)
        elif mode == 'transform':
            return await transform_data_structure(data, analysis_type)
        elif mode == 'analyze':
            return await analyze_patterns(data, analysis_type)
        elif mode == 'validate':
            return await validate_data_quality(data, analysis_type)
        else:
            return {
                'success': False,
                'error': f'Unknown processing mode: {mode}',
                'processed_data': {},
                'analysis_results': []
            }
            
    except Exception as e:
        print(f"[DataProcessor] Processing failed: {str(e)}")
        return {
            'success': False,
            'error': f'Data processing failed: {str(e)}',
            'processed_data': {},
            'analysis_results': []
        }


async def extract_key_information(data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
    """Extract key information from research data."""
    
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
                'description': article.get('extract', '')[:200] + '...' if len(article.get('extract', '')) > 200 else article.get('extract', ''),
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
            # Extract important facts from content
            content = result.get('content', {})
            if content.get('text'):
                # Simple extraction - in real implementation would use NLP
                text_snippets = content['text'][:500].split('. ')[:3]
                for snippet in text_snippets:
                    if len(snippet.strip()) > 20:
                        extracted_info['important_facts'].append({
                            'fact': snippet.strip(),
                            'source': result.get('url', ''),
                            'confidence': 0.7,
                            'extraction_method': 'text_analysis'
                        })
    
    # Add extraction metadata
    extracted_info['metadata'] = {
        'extraction_timestamp': datetime.now().isoformat(),
        'analysis_type': analysis_type,
        'total_concepts': len(extracted_info['key_concepts']),
        'total_facts': len(extracted_info['important_facts']),
        'total_references': len(extracted_info['references'])
    }
    
    return {
        'success': True,
        'processed_data': extracted_info,
        'analysis_results': [
            {
                'analysis_id': 'extract_001',
                'type': 'information_extraction',
                'result': f"Extracted {len(extracted_info['key_concepts'])} key concepts and {len(extracted_info['important_facts'])} important facts",
                'confidence': 0.8
            }
        ]
    }


async def transform_data_structure(data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
    """Transform data into structured format for analysis."""
    
    structured_data = {
        'topics': {},
        'entities': [],
        'relationships': [],
        'timeline': [],
        'categories': {}
    }
    
    # Transform Wikipedia data into structured topics
    wikipedia_data = data.get('wikipedia_data', {})
    if wikipedia_data.get('success'):
        for article in wikipedia_data.get('articles', []):
            topic_id = f"topic_{len(structured_data['topics']) + 1}"
            structured_data['topics'][topic_id] = {
                'title': article.get('title', ''),
                'summary': article.get('extract', ''),
                'source': 'wikipedia',
                'importance': 'high' if article.get('title', '').lower() in data.get('research_topic', '').lower() else 'medium',
                'data_points': extract_data_points_from_text(article.get('extract', ''))
            }
    
    # Transform web data into entities and relationships
    web_data = data.get('web_scraped_data', {})
    if web_data.get('success'):
        for result in web_data.get('scraped_results', []):
            # Create entities from headings and important content
            content = result.get('content', {})
            
            # Extract entities from headings
            for heading in content.get('headings', []):
                structured_data['entities'].append({
                    'entity_id': f"entity_{len(structured_data['entities']) + 1}",
                    'name': heading,
                    'type': 'concept',
                    'source_url': result.get('url', ''),
                    'context': 'heading'
                })
            
            # Create relationships between topics and entities
            if content.get('text'):
                # Simple relationship extraction
                for topic_id, topic in structured_data['topics'].items():
                    if topic['title'].lower() in content['text'].lower():
                        structured_data['relationships'].append({
                            'from': topic_id,
                            'to': result.get('url', ''),
                            'relationship_type': 'mentioned_in',
                            'strength': 0.6
                        })
    
    # Categorize data
    structured_data['categories'] = categorize_research_data(structured_data)
    
    return {
        'success': True,
        'processed_data': structured_data,
        'analysis_results': [
            {
                'analysis_id': 'transform_001',
                'type': 'data_structuring',
                'result': f"Structured data into {len(structured_data['topics'])} topics, {len(structured_data['entities'])} entities, and {len(structured_data['relationships'])} relationships",
                'confidence': 0.85
            }
        ]
    }


async def analyze_patterns(data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
    """Analyze patterns in the research data."""
    
    pattern_analysis = {
        'common_themes': [],
        'data_trends': [],
        'source_analysis': {},
        'content_patterns': {},
        'insights': []
    }
    
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
    
    # Simple pattern analysis (would use NLP in real implementation)
    word_frequency = analyze_word_frequency(all_content)
    pattern_analysis['common_themes'] = identify_common_themes(word_frequency)
    pattern_analysis['source_analysis'] = analyze_source_distribution(all_content)
    pattern_analysis['content_patterns'] = analyze_content_patterns(all_content)
    
    # Generate insights
    pattern_analysis['insights'] = generate_pattern_insights(pattern_analysis, analysis_type)
    
    return {
        'success': True,
        'processed_data': pattern_analysis,
        'analysis_results': [
            {
                'analysis_id': 'pattern_001',
                'type': 'pattern_analysis',
                'result': f"Identified {len(pattern_analysis['common_themes'])} common themes and {len(pattern_analysis['insights'])} key insights",
                'confidence': 0.75
            }
        ]
    }


async def validate_data_quality(data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
    """Validate quality and reliability of research data."""
    
    validation_results = {
        'quality_scores': {},
        'reliability_assessment': {},
        'completeness_check': {},
        'consistency_analysis': {},
        'recommendations': []
    }
    
    # Validate Wikipedia data quality
    wikipedia_data = data.get('wikipedia_data', {})
    if wikipedia_data.get('success'):
        validation_results['quality_scores']['wikipedia'] = {
            'completeness': min(len(wikipedia_data.get('articles', [])) / 5, 1.0),
            'reliability': 0.9,  # Wikipedia generally reliable
            'freshness': 0.8,   # Assumes recent data
            'coverage': calculate_coverage_score(wikipedia_data, data.get('research_topic', ''))
        }
    
    # Validate web scraped data quality
    web_data = data.get('web_scraped_data', {})
    if web_data.get('success'):
        scraped_results = web_data.get('scraped_results', [])
        validation_results['quality_scores']['web_scraped'] = {
            'completeness': min(len(scraped_results) / 10, 1.0),
            'reliability': calculate_web_reliability_score(scraped_results),
            'freshness': 0.7,   # Web content varies
            'coverage': calculate_web_coverage_score(scraped_results, data.get('research_topic', ''))
        }
    
    # Overall reliability assessment
    validation_results['reliability_assessment'] = {
        'overall_reliability': calculate_overall_reliability(validation_results['quality_scores']),
        'source_diversity': len([k for k in validation_results['quality_scores'].keys() if validation_results['quality_scores'][k]]),
        'validation_status': 'validated' if calculate_overall_reliability(validation_results['quality_scores']) > 0.7 else 'needs_review'
    }
    
    # Generate validation recommendations
    validation_results['recommendations'] = generate_validation_recommendations(validation_results)
    
    return {
        'success': True,
        'processed_data': validation_results,
        'analysis_results': [
            {
                'analysis_id': 'validate_001',
                'type': 'data_validation',
                'result': f"Overall reliability score: {validation_results['reliability_assessment']['overall_reliability']:.2f}",
                'confidence': 0.9
            }
        ]
    }


# Helper functions

def extract_data_points_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract structured data points from text."""
    # Simple implementation - would use NLP in real system
    sentences = text.split('. ')[:3]  # First 3 sentences
    return [{'point': sentence.strip(), 'type': 'fact'} for sentence in sentences if len(sentence.strip()) > 10]


def categorize_research_data(structured_data: Dict[str, Any]) -> Dict[str, Any]:
    """Categorize research data into meaningful groups."""
    categories = {
        'primary_sources': [],
        'secondary_sources': [],
        'factual_content': [],
        'analytical_content': []
    }
    
    # Simple categorization based on source types
    for topic_id, topic in structured_data['topics'].items():
        if topic['source'] == 'wikipedia':
            categories['secondary_sources'].append(topic_id)
        else:
            categories['primary_sources'].append(topic_id)
    
    return categories


def analyze_word_frequency(content_list: List[Dict[str, Any]]) -> Dict[str, int]:
    """Analyze word frequency across all content."""
    word_freq = {}
    common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'}
    
    for content in content_list:
        words = content['text'].lower().split()
        for word in words:
            clean_word = word.strip('.,!?;:"()[]{}').lower()
            if len(clean_word) > 3 and clean_word not in common_words:
                word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
    
    return dict(sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20])


def identify_common_themes(word_frequency: Dict[str, int]) -> List[Dict[str, Any]]:
    """Identify common themes from word frequency analysis."""
    themes = []
    for word, freq in list(word_frequency.items())[:10]:
        themes.append({
            'theme': word,
            'frequency': freq,
            'relevance': min(freq / max(word_frequency.values()) * 100, 100)
        })
    return themes


def analyze_source_distribution(content_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze distribution of content sources."""
    source_counts = {}
    for content in content_list:
        source = content['source']
        source_counts[source] = source_counts.get(source, 0) + 1
    
    total = len(content_list)
    return {
        'source_counts': source_counts,
        'source_percentages': {k: (v / total) * 100 for k, v in source_counts.items()},
        'source_diversity': len(source_counts)
    }


def analyze_content_patterns(content_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze patterns in content structure."""
    avg_length = sum(len(content['text']) for content in content_list) / len(content_list) if content_list else 0
    
    return {
        'average_content_length': avg_length,
        'total_sources': len(content_list),
        'content_quality': 'high' if avg_length > 500 else 'medium' if avg_length > 200 else 'low'
    }


def generate_pattern_insights(pattern_analysis: Dict[str, Any], analysis_type: str) -> List[Dict[str, Any]]:
    """Generate insights from pattern analysis."""
    insights = []
    
    # Theme-based insights
    if pattern_analysis['common_themes']:
        top_theme = pattern_analysis['common_themes'][0]
        insights.append({
            'insight_type': 'theme_analysis',
            'description': f"The most prominent theme is '{top_theme['theme']}' with {top_theme['relevance']:.1f}% relevance",
            'confidence': 0.8
        })
    
    # Source diversity insights
    source_analysis = pattern_analysis['source_analysis']
    if source_analysis['source_diversity'] > 1:
        insights.append({
            'insight_type': 'source_diversity',
            'description': f"Research draws from {source_analysis['source_diversity']} different source types, indicating good diversity",
            'confidence': 0.9
        })
    
    return insights


def calculate_coverage_score(data: Dict[str, Any], research_topic: str) -> float:
    """Calculate how well the data covers the research topic."""
    # Simple implementation - would use semantic similarity in real system
    articles = data.get('articles', [])
    if not articles:
        return 0.0
    
    topic_mentions = sum(1 for article in articles if research_topic.lower() in article.get('title', '').lower() or research_topic.lower() in article.get('extract', '').lower())
    return min(topic_mentions / len(articles), 1.0)


def calculate_web_reliability_score(scraped_results: List[Dict[str, Any]]) -> float:
    """Calculate reliability score for web scraped data."""
    if not scraped_results:
        return 0.0
    
    # Simple scoring based on content quality indicators
    quality_indicators = 0
    for result in scraped_results:
        content = result.get('content', {})
        if content.get('text') and len(content['text']) > 200:
            quality_indicators += 1
        if content.get('headings') and len(content['headings']) > 0:
            quality_indicators += 1
    
    return min(quality_indicators / (len(scraped_results) * 2), 1.0)


def calculate_web_coverage_score(scraped_results: List[Dict[str, Any]], research_topic: str) -> float:
    """Calculate coverage score for web scraped data."""
    if not scraped_results:
        return 0.0
    
    relevant_results = sum(1 for result in scraped_results 
                          if research_topic.lower() in result.get('title', '').lower() 
                          or research_topic.lower() in result.get('content', {}).get('text', '').lower())
    
    return min(relevant_results / len(scraped_results), 1.0)


def calculate_overall_reliability(quality_scores: Dict[str, Dict[str, float]]) -> float:
    """Calculate overall reliability from quality scores."""
    if not quality_scores:
        return 0.0
    
    total_score = 0
    count = 0
    
    for source, scores in quality_scores.items():
        source_avg = sum(scores.values()) / len(scores)
        total_score += source_avg
        count += 1
    
    return total_score / count if count > 0 else 0.0


def generate_validation_recommendations(validation_results: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on validation results."""
    recommendations = []
    
    overall_reliability = validation_results['reliability_assessment']['overall_reliability']
    
    if overall_reliability < 0.6:
        recommendations.append("Consider adding more reliable sources to improve data quality")
    
    if validation_results['reliability_assessment']['source_diversity'] < 2:
        recommendations.append("Increase source diversity by adding different types of data sources")
    
    # Check individual source quality
    for source, scores in validation_results['quality_scores'].items():
        if scores['completeness'] < 0.5:
            recommendations.append(f"Improve {source} data completeness by gathering more comprehensive information")
        
        if scores['coverage'] < 0.6:
            recommendations.append(f"Enhance {source} coverage of the research topic")
    
    if not recommendations:
        recommendations.append("Data quality is good - consider expanding analysis depth")
    
    return recommendations