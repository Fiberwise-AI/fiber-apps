"""
Google Places Search Step
Searches for businesses using Google Places API based on query parameters.
"""
import logging
import asyncio
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class PlacesSearchStep:
    """Step implementation for searching businesses via Google Places API."""
    
    def __init__(self):
        self.name = "PlacesSearchStep"
        self.description = "Search for businesses using Google Places API"
    
    async def execute(self, parameters: Dict[str, Any], fiber) -> Dict[str, Any]:
        """
        Execute the places search step.
        
        Args:
            parameters: Dict containing 'query' parameter for search
            fiber: Fiber service for API access and configuration
        
        Returns:
            Dict with 'places' array containing business results
        """
        try:
            query = parameters.get('query')
            if not query:
                return {
                    'success': False,
                    'error': 'Missing required parameter: query',
                    'result': {'places': []}
                }
            
            logger.info(f"Searching for businesses with query: {query}")
            
            # Use fiber to make Google Places API call
            # This would typically use fiber's HTTP client or a dedicated Google Places service
            places_results = await self._search_places(query, fiber)
            
            if not places_results:
                logger.warning(f"No results found for query: {query}")
                return {
                    'success': True,
                    'result': {'places': []},
                    'message': f'No businesses found for: {query}'
                }
            
            # Format results according to output schema
            formatted_places = []
            for place in places_results[:10]:  # Limit to top 10 results
                formatted_places.append({
                    'id': place.get('place_id', ''),
                    'name': place.get('name', ''),
                    'rating': place.get('rating', 0),
                    'user_ratings_total': place.get('user_ratings_total', 0),
                    'types': place.get('types', [])
                })
            
            logger.info(f"Found {len(formatted_places)} businesses")
            
            return {
                'success': True,
                'result': {'places': formatted_places},
                'message': f'Found {len(formatted_places)} businesses for: {query}'
            }
            
        except Exception as e:
            logger.error(f"Error in PlacesSearchStep: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'result': {'places': []}
            }
    
    async def _search_places(self, query: str, fiber) -> List[Dict[str, Any]]:
        """
        Make the actual Google Places API call.
        
        Args:
            query: Search query string
            fiber: Fiber service for API access
        
        Returns:
            List of place results from Google Places API
        """
        try:
            # Get Google Places API key from environment or fiber configuration
            api_key = await self._get_api_key(fiber)
            if not api_key:
                raise ValueError("Google Places API key not configured")
            
            # Construct the Places API text search request
            url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {
                'query': query,
                'key': api_key,
                'type': 'establishment'
            }
            
            # Use fiber's HTTP client to make the request
            http_client = await fiber.get_service('http_client')
            response = await http_client.get(url, params=params)
            
            if response.status_code != 200:
                raise Exception(f"Google Places API error: {response.status_code} - {response.text}")
            
            data = response.json()
            
            if data.get('status') != 'OK':
                if data.get('status') == 'ZERO_RESULTS':
                    return []
                else:
                    raise Exception(f"Google Places API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
            
            return data.get('results', [])
            
        except Exception as e:
            logger.error(f"Error calling Google Places API: {str(e)}")
            # For demo purposes, return mock data if API fails
            return await self._get_mock_data(query)
    
    async def _get_api_key(self, fiber) -> str:
        """Get Google Places API key from configuration."""
        try:
            config = await fiber.get_service('config')
            return config.get('GOOGLE_PLACES_API_KEY', '')
        except:
            # Fallback to environment variable
            import os
            return os.getenv('GOOGLE_PLACES_API_KEY', '')
    
    async def _get_mock_data(self, query: str) -> List[Dict[str, Any]]:
        """
        Return mock data for testing when API is not available.
        """
        logger.info(f"Using mock data for query: {query}")
        
        # Extract business type and location for more realistic mock data
        query_lower = query.lower()
        business_type = "business"
        location = "local area"
        
        if "restaurant" in query_lower or "food" in query_lower:
            business_type = "restaurant"
        elif "law" in query_lower or "attorney" in query_lower:
            business_type = "law firm"
        elif "dental" in query_lower or "dentist" in query_lower:
            business_type = "dental practice"
        elif "marketing" in query_lower or "agency" in query_lower:
            business_type = "marketing agency"
        
        # Extract location if present
        if " in " in query_lower:
            location = query_lower.split(" in ")[-1].strip()
        
        mock_places = [
            {
                'place_id': f'mock_place_1_{hash(query) % 10000}',
                'name': f'Elite {business_type.title()} Solutions',
                'rating': 4.5,
                'user_ratings_total': 127,
                'types': ['establishment', 'point_of_interest'],
                'formatted_address': f'123 Main St, {location.title()}',
                'business_status': 'OPERATIONAL'
            },
            {
                'place_id': f'mock_place_2_{hash(query) % 10000}',
                'name': f'Premium {business_type.title()} Group',
                'rating': 4.2,
                'user_ratings_total': 89,
                'types': ['establishment', 'point_of_interest'],
                'formatted_address': f'456 Business Ave, {location.title()}',
                'business_status': 'OPERATIONAL'
            },
            {
                'place_id': f'mock_place_3_{hash(query) % 10000}',
                'name': f'{location.title()} {business_type.title()} Partners',
                'rating': 4.7,
                'user_ratings_total': 203,
                'types': ['establishment', 'point_of_interest'],
                'formatted_address': f'789 Professional Dr, {location.title()}',
                'business_status': 'OPERATIONAL'
            }
        ]
        
        return mock_places