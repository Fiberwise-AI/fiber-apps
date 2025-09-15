#!/usr/bin/env python3
"""
Test Steps Execution

Simple test script to execute individual pipeline steps and verify they work.
"""

import asyncio
import sys
import os

# Add the pipeline steps to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline', 'steps'))

from data_analysis_step import DataAnalysisStep
from data_extraction_step import DataExtractionStep


async def test_data_extraction_step():
    """Test the data extraction step"""
    print("Testing Data Extraction Step")
    
    # Mock input data
    input_data = {
        'data': {
            'wikipedia_data': {
                'success': True,
                'articles': [
                    {
                        'title': 'Artificial Intelligence',
                        'extract': 'Artificial intelligence (AI) is intelligence demonstrated by machines. It has applications in computer science and was developed in 1950.',
                        'references': [
                            {'url': 'https://example.com/ai-ref', 'title': 'AI Reference'}
                        ]
                    }
                ]
            },
            'web_scraped_data': {
                'success': True,
                'scraped_results': [
                    {
                        'url': 'https://example.com/ai-article',
                        'title': 'AI Article',
                        'content': {
                            'text': 'Machine learning is 85% accurate. There are 2.5 billion users of AI systems. The technology costs $1000 million annually.',
                            'headings': ['Introduction', 'Applications']
                        }
                    }
                ]
            }
        },
        'analysis_type': 'comprehensive'
    }
    
    context = {'start_time': '2024-01-01T00:00:00'}
    
    step = DataExtractionStep()
    result = await step.execute(input_data, context)
    
    print(f"   Success: {result['success']}")
    if result['success']:
        data = result['data']['processed_data']
        print(f"   Key concepts: {len(data.get('key_concepts', []))}")
        print(f"   Important facts: {len(data.get('important_facts', []))}")
        print(f"   Statistical data: {len(data.get('statistical_data', []))}")
        print(f"   References: {len(data.get('references', []))}")
    else:
        print(f"   Error: {result.get('error')}")
    
    print()


async def test_data_analysis_step():
    """Test the data analysis step"""
    print("Testing Data Analysis Step")
    
    # Mock input data with content for analysis
    input_data = {
        'data': {
            'wikipedia_data': {
                'success': True,
                'articles': [
                    {
                        'title': 'Artificial Intelligence',
                        'extract': 'Artificial intelligence is a technology that enables machines to learn and think. It is used in robotics, automation, and data science.'
                    },
                    {
                        'title': 'Machine Learning',
                        'extract': 'Machine learning is a subset of artificial intelligence. It focuses on algorithms that can learn from data without being explicitly programmed.'
                    }
                ]
            },
            'web_scraped_data': {
                'success': True,
                'scraped_results': [
                    {
                        'url': 'https://example.com/ai-trends',
                        'title': 'AI Trends',
                        'content': {
                            'text': 'Artificial intelligence technology is growing rapidly. Machine learning algorithms are becoming more sophisticated. Data science applications are expanding across industries.'
                        }
                    }
                ]
            }
        },
        'analysis_type': 'comprehensive'
    }
    
    context = {'research_topic': 'artificial intelligence'}
    
    step = DataAnalysisStep()
    result = await step.execute(input_data, context)
    
    print(f"   Success: {result['success']}")
    if result['success']:
        data = result['data']['processed_data']
        print(f"   Common themes: {len(data.get('common_themes', []))}")
        print(f"   Source diversity: {data.get('source_analysis', {}).get('source_diversity', 0)}")
        print(f"   Insights generated: {len(data.get('insights', []))}")
        
        # Show top themes
        themes = data.get('common_themes', [])[:3]
        if themes:
            print("   Top themes:")
            for theme in themes:
                print(f"     - {theme.get('theme', 'Unknown')}: {theme.get('relevance', 0):.1f}% relevance")
    else:
        print(f"   Error: {result.get('error')}")
    
    print()


async def main():
    """Run all step tests"""
    print("Knowledge Builder Pro V2 - Step Testing\n")
    
    await test_data_extraction_step()
    await test_data_analysis_step()
    
    print("All step tests completed!")


if __name__ == "__main__":
    asyncio.run(main())