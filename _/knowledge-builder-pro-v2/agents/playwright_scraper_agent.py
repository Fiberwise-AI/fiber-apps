"""
Playwright Web Scraper Agent

Advanced web scraping agent using Playwright for deep content extraction.
Handles JavaScript-heavy sites and dynamic content loading.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from playwright.async_api import async_playwright, Browser, Page
import aiohttp
from urllib.parse import urljoin, urlparse


class PlaywrightScraperAgent:
    """
    Web scraping agent using Playwright for comprehensive content extraction.
    """
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.max_pages_per_session = 10
        self.page_timeout = 30000  # 30 seconds
        
    async def activate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main activation method for the Playwright scraper agent.
        
        Args:
            input_data: Dictionary containing scraping parameters
            
        Returns:
            Dictionary with scraped content and metadata
        """
        
        mode = input_data.get('mode', 'scrape_urls')
        
        if mode == 'scrape_urls':
            return await self.scrape_urls(input_data)
        elif mode == 'discover_and_scrape':
            return await self.discover_and_scrape(input_data)
        elif mode == 'deep_content_analysis':
            return await self.deep_content_analysis(input_data)
        else:
            return {
                'success': False,
                'error': f'Unknown mode: {mode}',
                'scraped_data': []
            }
    
    async def scrape_urls(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Scrape a list of specific URLs."""
        
        urls = input_data.get('urls', [])
        research_topic = input_data.get('research_topic', '')
        
        if not urls:
            return {
                'success': False,
                'error': 'No URLs provided for scraping',
                'scraped_data': []
            }
        
        print(f"[PlaywrightScraperAgent] Scraping {len(urls)} URLs for topic: {research_topic}")
        
        try:
            async with async_playwright() as playwright:
                # Launch browser with optimal settings for scraping
                browser = await playwright.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-extensions'
                    ]
                )
                
                scraped_data = []
                
                for i, url in enumerate(urls[:self.max_pages_per_session]):
                    print(f"[PlaywrightScraperAgent] Scraping URL {i+1}/{len(urls)}: {url}")
                    
                    page_data = await self.scrape_single_page(browser, url, research_topic)
                    if page_data:
                        scraped_data.append(page_data)
                    
                    # Small delay to be respectful
                    await asyncio.sleep(1)
                
                await browser.close()
                
                return {
                    'success': True,
                    'scraped_data': scraped_data,
                    'metadata': {
                        'urls_attempted': len(urls),
                        'pages_scraped': len(scraped_data),
                        'research_topic': research_topic
                    }
                }
                
        except Exception as e:
            print(f"[PlaywrightScraperAgent] Error during URL scraping: {str(e)}")
            return {
                'success': False,
                'error': f'Playwright scraping failed: {str(e)}',
                'scraped_data': []
            }
    
    async def discover_and_scrape(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Discover relevant URLs based on search and then scrape them."""
        
        research_topic = input_data.get('research_topic', '')
        max_sources = input_data.get('max_sources', 5)
        
        print(f"[PlaywrightScraperAgent] Discovering sources for topic: {research_topic}")
        
        try:
            # Step 1: Use search engines to discover relevant URLs
            discovered_urls = await self.discover_urls(research_topic, max_sources)
            
            if not discovered_urls:
                return {
                    'success': False,
                    'error': 'No relevant URLs discovered',
                    'scraped_data': []
                }
            
            # Step 2: Scrape the discovered URLs
            scrape_input = {
                'urls': discovered_urls,
                'research_topic': research_topic
            }
            
            return await self.scrape_urls(scrape_input)
            
        except Exception as e:
            print(f"[PlaywrightScraperAgent] Error during discovery and scraping: {str(e)}")
            return {
                'success': False,
                'error': f'Discovery and scraping failed: {str(e)}',
                'scraped_data': []
            }
    
    async def deep_content_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform deep content analysis on scraped data."""
        
        scraped_data = input_data.get('scraped_data', [])
        research_topic = input_data.get('research_topic', '')
        
        if not scraped_data:
            return {
                'success': False,
                'error': 'No scraped data provided for analysis',
                'analysis_results': []
            }
        
        print(f"[PlaywrightScraperAgent] Analyzing {len(scraped_data)} scraped pages")
        
        analysis_results = []
        
        for page_data in scraped_data:
            analysis = await self.analyze_page_content(page_data, research_topic)
            analysis_results.append(analysis)
        
        return {
            'success': True,
            'analysis_results': analysis_results,
            'metadata': {
                'pages_analyzed': len(analysis_results),
                'research_topic': research_topic
            }
        }
    
    async def scrape_single_page(self, browser: Browser, url: str, research_topic: str = '') -> Optional[Dict[str, Any]]:
        """Scrape a single web page with comprehensive content extraction."""
        
        try:
            page = await browser.new_page()
            
            # Set user agent to appear more human-like
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            # Navigate to the page
            await page.goto(url, wait_until='domcontentloaded', timeout=self.page_timeout)
            
            # Wait for dynamic content to load
            await page.wait_for_timeout(2000)
            
            # Extract comprehensive content
            page_content = await page.evaluate('''() => {
                // Remove script and style elements
                const scripts = document.querySelectorAll('script, style, nav, footer, aside, .nav, .navigation, .sidebar, .ads, .advertisement');
                scripts.forEach(el => el.remove());
                
                // Get main content
                const title = document.title || '';
                const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
                
                // Try to find main content area
                let mainContent = '';
                const mainSelectors = ['main', 'article', '.content', '.main-content', '.post-content', '#content', '.entry-content'];
                
                for (const selector of mainSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.innerText.length > 200) {
                        mainContent = element.innerText;
                        break;
                    }
                }
                
                // Fallback to body content if no main content found
                if (!mainContent) {
                    mainContent = document.body.innerText || '';
                }
                
                // Extract headings for structure
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                    .map(h => ({
                        level: h.tagName,
                        text: h.innerText.trim()
                    }))
                    .filter(h => h.text.length > 0);
                
                // Extract links
                const links = Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({
                        text: a.innerText.trim(),
                        href: a.href
                    }))
                    .filter(link => link.text.length > 0 && link.href.startsWith('http'))
                    .slice(0, 20); // Limit to 20 links
                
                // Extract images
                const images = Array.from(document.querySelectorAll('img[src]'))
                    .map(img => ({
                        src: img.src,
                        alt: img.alt || '',
                        title: img.title || ''
                    }))
                    .slice(0, 10); // Limit to 10 images
                
                return {
                    title,
                    metaDescription,
                    mainContent: mainContent.substring(0, 10000), // Limit content length
                    headings,
                    links,
                    images,
                    wordCount: mainContent.split(/\\s+/).length
                };
            }''')
            
            await page.close()
            
            # Calculate relevance score if research topic provided
            relevance_score = 0.0
            if research_topic:
                relevance_score = self.calculate_relevance_score(page_content['mainContent'], research_topic)
            
            return {
                'url': url,
                'title': page_content['title'],
                'meta_description': page_content['metaDescription'],
                'content': page_content['mainContent'],
                'headings': page_content['headings'],
                'links': page_content['links'],
                'images': page_content['images'],
                'word_count': page_content['wordCount'],
                'relevance_score': relevance_score,
                'scraped_at': None,  # Will be set by framework
                'success': True
            }
            
        except Exception as e:
            print(f"[PlaywrightScraperAgent] Error scraping {url}: {str(e)}")
            return {
                'url': url,
                'title': '',
                'content': '',
                'error': str(e),
                'success': False
            }
    
    async def discover_urls(self, research_topic: str, max_sources: int) -> List[str]:
        """Discover relevant URLs using search engines."""
        
        discovered_urls = []
        
        try:
            # Use DuckDuckGo search (no API key required)
            search_queries = [
                f'"{research_topic}" research',
                f'{research_topic} analysis',
                f'{research_topic} study',
                f'{research_topic} academic',
                f'{research_topic} report'
            ]
            
            async with aiohttp.ClientSession() as session:
                for query in search_queries[:3]:  # Limit to 3 search queries
                    search_url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
                    
                    try:
                        async with session.get(search_url, headers={
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }) as response:
                            if response.status == 200:
                                # This is a simplified approach - in production you'd parse the HTML
                                # For now, we'll use some common academic and research sites
                                pass
                    except Exception as e:
                        print(f"[PlaywrightScraperAgent] Search error: {str(e)}")
            
            # Fallback: Use predefined high-quality research sources
            # These are sites known to have good research content
            fallback_sources = [
                f"https://scholar.google.com/scholar?q={research_topic.replace(' ', '+')}",
                f"https://www.researchgate.net/search?q={research_topic.replace(' ', '+')}",
                f"https://arxiv.org/search/?query={research_topic.replace(' ', '+')}",
                f"https://www.ncbi.nlm.nih.gov/pubmed/?term={research_topic.replace(' ', '+')}",
            ]
            
            discovered_urls.extend(fallback_sources[:max_sources])
            
        except Exception as e:
            print(f"[PlaywrightScraperAgent] URL discovery error: {str(e)}")
        
        return discovered_urls[:max_sources]
    
    def calculate_relevance_score(self, content: str, research_topic: str) -> float:
        """Calculate how relevant the content is to the research topic."""
        
        if not content or not research_topic:
            return 0.0
        
        content_lower = content.lower()
        topic_words = research_topic.lower().split()
        
        # Simple scoring based on keyword frequency
        score = 0.0
        total_words = len(content.split())
        
        if total_words == 0:
            return 0.0
        
        for word in topic_words:
            if len(word) > 2:  # Skip very short words
                word_count = content_lower.count(word)
                score += word_count / total_words
        
        # Normalize score to 0-1 range
        return min(score * 100, 1.0)
    
    async def analyze_page_content(self, page_data: Dict[str, Any], research_topic: str) -> Dict[str, Any]:
        """Analyze scraped page content for research insights."""
        
        content = page_data.get('content', '')
        title = page_data.get('title', '')
        url = page_data.get('url', '')
        
        # Extract key insights (simplified - could use NLP here)
        insights = []
        
        # Look for common research indicators
        research_keywords = ['study', 'research', 'analysis', 'findings', 'conclusion', 'results', 'data', 'evidence']
        
        sentences = content.split('.')
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(keyword in sentence_lower for keyword in research_keywords):
                if len(sentence.strip()) > 20:  # Skip very short sentences
                    insights.append(sentence.strip())
        
        return {
            'url': url,
            'title': title,
            'key_insights': insights[:10],  # Top 10 insights
            'analysis_score': page_data.get('relevance_score', 0.0),
            'content_quality': 'high' if len(content) > 1000 else 'medium' if len(content) > 500 else 'low'
        }