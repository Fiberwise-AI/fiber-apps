"""
Wikipedia API Scraper Function

Comprehensive Wikipedia research using the Wikipedia API.
Fetches main article, related articles, and references for deep topic research.
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any, Optional
from urllib.parse import quote


async def wikipediaApiScraper(topic: str, max_articles: int = 5, include_references: bool = True, language: str = "en") -> Dict[str, Any]:
    """
    Scrape Wikipedia API for comprehensive topic research.
    
    Args:
        topic: Main research topic
        max_articles: Maximum number of related articles to fetch
        include_references: Whether to include article references
        language: Wikipedia language code
        
    Returns:
        Dictionary containing main article, related articles, and references
    """
    
    print(f"[WikipediaAPIScraper] Starting research on topic: {topic}")
    
    base_url = f"https://{language}.wikipedia.org/api/rest_v1"
    
    try:
        async with aiohttp.ClientSession() as session:
            # Step 1: Search for the main article
            main_article = await search_main_article(session, base_url, topic)
            
            if not main_article:
                return {
                    'success': False,
                    'error': f'No Wikipedia article found for topic: {topic}',
                    'main_article': None,
                    'related_articles': [],
                    'references': [],
                    'metadata': {'topic': topic, 'articles_found': 0}
                }
            
            # Step 2: Get related articles
            related_articles = await get_related_articles(session, base_url, main_article['title'], max_articles)
            
            # Step 3: Extract references if requested
            references = []
            if include_references:
                references = await extract_references(session, base_url, main_article['title'])
                
                # Also get references from related articles
                for article in related_articles[:3]:  # Limit to top 3 for performance
                    article_refs = await extract_references(session, base_url, article['title'])
                    references.extend(article_refs)
            
            # Step 4: Prepare comprehensive response
            result = {
                'success': True,
                'main_article': main_article,
                'related_articles': related_articles,
                'references': references,
                'metadata': {
                    'topic': topic,
                    'language': language,
                    'articles_found': 1 + len(related_articles),
                    'references_found': len(references),
                    'search_timestamp': None  # Will be set by framework
                }
            }
            
            print(f"[WikipediaAPIScraper] Research completed: {len(related_articles)} related articles, {len(references)} references")
            return result
            
    except Exception as e:
        print(f"[WikipediaAPIScraper] Error during research: {str(e)}")
        return {
            'success': False,
            'error': f'Wikipedia API scraping failed: {str(e)}',
            'main_article': None,
            'related_articles': [],
            'references': [],
            'metadata': {'topic': topic, 'error': str(e)}
        }


async def search_main_article(session: aiohttp.ClientSession, base_url: str, topic: str) -> Optional[Dict[str, Any]]:
    """Search for the main Wikipedia article on the topic."""
    
    # First try direct page lookup
    encoded_topic = quote(topic.replace(' ', '_'))
    summary_url = f"{base_url}/page/summary/{encoded_topic}"
    
    async with session.get(summary_url) as response:
        if response.status == 200:
            data = await response.json()
            
            # Get full content
            content_url = f"{base_url}/page/mobile-sections/{encoded_topic}"
            async with session.get(content_url) as content_response:
                if content_response.status == 200:
                    content_data = await content_response.json()
                    
                    # Extract main text from sections
                    full_text = ""
                    if 'sections' in content_data:
                        for section in content_data['sections']:
                            if 'text' in section:
                                full_text += section['text'] + "\\n\\n"
                    
                    return {
                        'title': data.get('title', topic),
                        'summary': data.get('extract', ''),
                        'full_text': full_text,
                        'url': data.get('content_urls', {}).get('desktop', {}).get('page', ''),
                        'page_id': data.get('pageid'),
                        'last_modified': data.get('timestamp'),
                        'coordinates': data.get('coordinates'),
                        'image_url': data.get('thumbnail', {}).get('source') if 'thumbnail' in data else None
                    }
    
    # If direct lookup fails, try search
    search_url = f"https://{base_url.split('/')[2]}/w/api.php"
    search_params = {
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': topic,
        'srlimit': 1
    }
    
    async with session.get(search_url, params=search_params) as response:
        if response.status == 200:
            data = await response.json()
            if data.get('query', {}).get('search'):
                first_result = data['query']['search'][0]
                # Recursively get the article using the found title
                return await search_main_article(session, base_url, first_result['title'])
    
    return None


async def get_related_articles(session: aiohttp.ClientSession, base_url: str, main_title: str, max_articles: int) -> List[Dict[str, Any]]:
    """Get related articles using Wikipedia's API."""
    
    related_articles = []
    
    try:
        # Method 1: Get articles that link to this page (backlinks)
        api_url = f"https://{base_url.split('/')[2]}/w/api.php"
        
        # Get pages that link to our main article
        backlinks_params = {
            'action': 'query',
            'format': 'json',
            'list': 'backlinks',
            'bltitle': main_title,
            'bllimit': max_articles * 2,  # Get more to filter
            'blnamespace': 0  # Main namespace only
        }
        
        async with session.get(api_url, params=backlinks_params) as response:
            if response.status == 200:
                data = await response.json()
                backlinks = data.get('query', {}).get('backlinks', [])
                
                # Get summaries for the backlinked articles
                for link in backlinks[:max_articles]:
                    article_summary = await get_article_summary(session, base_url, link['title'])
                    if article_summary:
                        related_articles.append(article_summary)
        
        # Method 2: If we need more articles, try categories
        if len(related_articles) < max_articles:
            categories = await get_article_categories(session, api_url, main_title)
            
            for category in categories[:3]:  # Top 3 categories
                category_articles = await get_articles_in_category(session, api_url, category, max_articles - len(related_articles))
                for article in category_articles:
                    if len(related_articles) >= max_articles:
                        break
                    if article['title'] != main_title:  # Don't include the main article
                        article_summary = await get_article_summary(session, base_url, article['title'])
                        if article_summary:
                            related_articles.append(article_summary)
                
                if len(related_articles) >= max_articles:
                    break
        
    except Exception as e:
        print(f"[WikipediaAPIScraper] Error getting related articles: {str(e)}")
    
    return related_articles[:max_articles]


async def get_article_summary(session: aiohttp.ClientSession, base_url: str, title: str) -> Optional[Dict[str, Any]]:
    """Get a summary for a specific article."""
    
    try:
        encoded_title = quote(title.replace(' ', '_'))
        summary_url = f"{base_url}/page/summary/{encoded_title}"
        
        async with session.get(summary_url) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    'title': data.get('title', title),
                    'summary': data.get('extract', ''),
                    'url': data.get('content_urls', {}).get('desktop', {}).get('page', ''),
                    'page_id': data.get('pageid'),
                    'image_url': data.get('thumbnail', {}).get('source') if 'thumbnail' in data else None
                }
    except Exception as e:
        print(f"[WikipediaAPIScraper] Error getting summary for {title}: {str(e)}")
    
    return None


async def get_article_categories(session: aiohttp.ClientSession, api_url: str, title: str) -> List[str]:
    """Get categories for an article."""
    
    try:
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'prop': 'categories',
            'cllimit': 10
        }
        
        async with session.get(api_url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                pages = data.get('query', {}).get('pages', {})
                
                for page_id, page_data in pages.items():
                    categories = page_data.get('categories', [])
                    return [cat['title'].replace('Category:', '') for cat in categories]
    except Exception as e:
        print(f"[WikipediaAPIScraper] Error getting categories: {str(e)}")
    
    return []


async def get_articles_in_category(session: aiohttp.ClientSession, api_url: str, category: str, limit: int) -> List[Dict[str, Any]]:
    """Get articles in a specific category."""
    
    try:
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'categorymembers',
            'cmtitle': f'Category:{category}',
            'cmlimit': limit,
            'cmnamespace': 0  # Main namespace only
        }
        
        async with session.get(api_url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return data.get('query', {}).get('categorymembers', [])
    except Exception as e:
        print(f"[WikipediaAPIScraper] Error getting articles in category {category}: {str(e)}")
    
    return []


async def extract_references(session: aiohttp.ClientSession, base_url: str, title: str) -> List[Dict[str, Any]]:
    """Extract external references from a Wikipedia article."""
    
    references = []
    
    try:
        api_url = f"https://{base_url.split('/')[2]}/w/api.php"
        
        # Get external links from the article
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'prop': 'extlinks',
            'ellimit': 20  # Limit external links
        }
        
        async with session.get(api_url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                pages = data.get('query', {}).get('pages', {})
                
                for page_id, page_data in pages.items():
                    ext_links = page_data.get('extlinks', [])
                    
                    for link in ext_links:
                        url = link.get('*', '')
                        if url and not any(blocked in url for blocked in ['wikipedia.org', 'wikimedia.org', 'wikidata.org']):
                            references.append({
                                'url': url,
                                'source_article': title,
                                'type': 'external_link'
                            })
        
    except Exception as e:
        print(f"[WikipediaAPIScraper] Error extracting references from {title}: {str(e)}")
    
    return references[:10]  # Limit to 10 references per article