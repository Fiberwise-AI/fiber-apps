#!/usr/bin/env python3
"""
Test Agents

Test the 2 agents independently with real implementation.
"""

import asyncio
import sys
import os

# Add agents to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agents'))

from text_processor_agent import TextProcessorAgent
from summarizer_agent import SummarizerAgent


async def test_text_processor_agent():
    """Test the text processor agent"""
    print("Testing Text Processor Agent")
    print("=" * 40)
    
    agent = TextProcessorAgent()
    
    # Test case 1: Positive sentiment
    input_data = {
        'text': 'This is an excellent example of artificial intelligence technology. Machine learning is amazing and wonderful.',
        'analysis_type': 'comprehensive'
    }
    
    context = {'start_time': '2024-01-01T00:00:00'}
    
    result = await agent.execute(input_data, context)
    
    print(f"Success: {result.success}")
    if result.success:
        data = result.data['processed_data']
        print(f"  Word count: {data['word_count']}")
        print(f"  Sentiment: {data['sentiment']['label']} ({data['sentiment']['confidence']:.0%})")
        print(f"  Top keywords: {', '.join([k['keyword'] for k in data['keywords'][:3]])}")
    else:
        print(f"  Error: {result.error}")
    
    print()
    return result


async def test_summarizer_agent():
    """Test the summarizer agent"""
    print("Testing Summarizer Agent")
    print("=" * 40)
    
    # First get processed data from text processor
    processor = TextProcessorAgent()
    input_data = {
        'text': 'Artificial intelligence is transforming industries. Machine learning algorithms are becoming more sophisticated. This technology enables amazing innovations.',
        'analysis_type': 'comprehensive'
    }
    
    processor_result = await processor.execute(input_data, {})
    
    if not processor_result.success:
        print(f"Processor failed: {processor_result.error}")
        return
    
    # Now test summarizer
    summarizer = SummarizerAgent()
    summarizer_input = {
        'processed_data': processor_result.data['processed_data'],
        'summary_type': 'comprehensive'
    }
    
    context = {'start_time': '2024-01-01T00:00:00'}
    
    result = await summarizer.execute(summarizer_input, context)
    
    print(f"Success: {result.success}")
    if result.success:
        data = result.data['summary_data']
        print(f"  Summary: {data['summary']}")
        print(f"  Insights generated: {len(data['key_insights'])}")
        print(f"  Top insights:")
        for insight in data['key_insights'][:2]:
            print(f"    - {insight['insight']}")
    else:
        print(f"  Error: {result.error}")
    
    print()
    return result


async def test_agent_pipeline():
    """Test the complete agent pipeline"""
    print("Testing Complete Agent Pipeline")
    print("=" * 40)
    
    # Step 1: Text Processing
    processor = TextProcessorAgent()
    step1_input = {
        'text': 'Machine learning is a powerful technology that enables computers to learn from data. It has applications in healthcare, finance, and many other industries. The future looks bright for AI development.',
        'analysis_type': 'comprehensive'
    }
    
    step1_result = await processor.execute(step1_input, {'start_time': '2024-01-01T00:00:00'})
    
    if not step1_result.success:
        print(f"Step 1 failed: {step1_result.error}")
        return
    
    print(f"Step 1 completed: {step1_result.message}")
    
    # Step 2: Summary Generation
    summarizer = SummarizerAgent()
    step2_input = {
        'processed_data': step1_result.data['processed_data'],
        'summary_type': 'comprehensive'
    }
    
    step2_result = await summarizer.execute(step2_input, {'start_time': '2024-01-01T00:00:00'})
    
    if not step2_result.success:
        print(f"Step 2 failed: {step2_result.error}")
        return
    
    print(f"Step 2 completed: {step2_result.message}")
    
    # Display final results
    summary_data = step2_result.data['summary_data']
    print(f"\nPIPELINE RESULTS:")
    print(f"Summary: {summary_data['summary']}")
    print(f"Sentiment: {summary_data['sentiment_analysis']['label']} ({summary_data['sentiment_analysis']['confidence']:.0%})")
    print(f"Keywords: {', '.join([k['keyword'] for k in summary_data['top_keywords']])}")
    
    print()


async def main():
    """Run all agent tests"""
    print("Simple Test Pipeline - Agent Testing\n")
    
    await test_text_processor_agent()
    await test_summarizer_agent()
    await test_agent_pipeline()
    
    print("All agent tests completed!")


if __name__ == "__main__":
    asyncio.run(main())