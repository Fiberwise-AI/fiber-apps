#!/usr/bin/env python3
"""
Test Simple Pipeline

Test the 2-step pipeline execution.
"""

import asyncio
import sys
import os

# Add pipeline to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline'))

from main import run_pipeline


async def test_simple_pipeline():
    """Test the simple 2-step pipeline"""
    
    print("Simple Test Pipeline - Testing 2 Steps\n")
    
    # Test case 1: Positive sentiment text
    test_text_1 = """
    This is an excellent example of artificial intelligence technology. 
    Machine learning algorithms are amazing and wonderful tools for data analysis. 
    I love how AI can solve complex problems efficiently and effectively.
    The future of technology looks fantastic and promising.
    """
    
    print("TEST CASE 1: Positive Sentiment Text")
    print("=" * 40)
    await run_pipeline(test_text_1)
    print("\n" + "=" * 60 + "\n")
    
    # Test case 2: Negative sentiment text
    test_text_2 = """
    This technology is terrible and awful for society. 
    Machine learning algorithms are bad and create horrible problems. 
    I hate how AI systems can be biased and unfair. 
    The worst part is the lack of transparency in these systems.
    """
    
    print("TEST CASE 2: Negative Sentiment Text")
    print("=" * 40)
    await run_pipeline(test_text_2)
    print("\n" + "=" * 60 + "\n")
    
    # Test case 3: Short neutral text
    test_text_3 = """
    Data science involves statistical analysis and programming.
    """
    
    print("TEST CASE 3: Short Neutral Text")
    print("=" * 40)
    await run_pipeline(test_text_3)
    
    print("\nAll pipeline tests completed!")


if __name__ == "__main__":
    asyncio.run(test_simple_pipeline())