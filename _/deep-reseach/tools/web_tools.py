import os
import httpx
from bs4 import BeautifulSoup
from tavily import TavilyClient

async def search_tavily(query: str) -> list:
    """
    Uses the Tavily Search API to perform a web search.
    Requires TAVILY_API_KEY environment variable.
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        print("Warning: TAVILY_API_KEY environment variable not set.")
        return []
    
    try:
        client = TavilyClient(api_key=api_key)
        # Use a loop since TavilyClient is not async
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: client.search(query=query, search_depth="basic", max_results=5)
        )
        return response.get('results', [])
    except Exception as e:
        print(f"Error during Tavily search: {e}")
        return []

async def scrape_website(url: str) -> str:
    """
    Scrapes the text content from a given URL.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script_or_style in soup(['script', 'style']):
                script_or_style.decompose()
            
            # Get text and clean it up
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
    except Exception as e:
        print(f"Error scraping URL {url}: {e}")
        return ""
