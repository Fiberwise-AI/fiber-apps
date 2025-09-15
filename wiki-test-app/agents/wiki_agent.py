"""
Wiki Agent for managing wiki pages with mixed isolation.
Demonstrates public content with user-tracked edit history.
"""

from typing import Dict, Any, List, Optional
import uuid
import json
from datetime import datetime
from fiberwise_common.agents.base_agent import BaseAgent
from fiberwise_common.services.database_service import DatabaseService


class WikiAgent(BaseAgent):
    """Agent for managing wiki pages and edit history tracking."""
    
    def __init__(self):
        super().__init__()
        self.db_service = DatabaseService()
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute wiki operations based on input commands.
        
        Available commands:
        - create_page: Create a new wiki page with edit tracking
        - update_page: Update existing page and record edit history
        - get_page: Get page content and basic info
        - get_page_history: Get edit history for a page
        - search_pages: Search through wiki pages
        - get_user_contributions: Get edit history for a specific user
        - bulk_create_demo: Create demo pages for testing
        """
        command = input_data.get('command', 'get_page')
        
        command_map = {
            'create_page': self._create_page,
            'update_page': self._update_page,
            'get_page': self._get_page,
            'get_page_history': self._get_page_history,
            'search_pages': self._search_pages,
            'get_user_contributions': self._get_user_contributions,
            'bulk_create_demo': self._bulk_create_demo_pages,
            'analyze_collaboration': self._analyze_collaboration
        }
        
        if command in command_map:
            return await command_map[command](input_data)
        else:
            return {
                'success': False,
                'error': f'Unknown command: {command}',
                'available_commands': list(command_map.keys())
            }
    
    async def _create_page(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new wiki page with user tracking."""
        try:
            title = input_data.get('title', '').strip()
            content = input_data.get('content', '').strip()
            summary = input_data.get('summary', '').strip()
            user_id = input_data.get('user_id', 'system')
            user_name = input_data.get('user_name', 'System')
            
            if not title or not content:
                return {
                    'success': False,
                    'error': 'Title and content are required'
                }
            
            # Generate slug from title
            slug = self._generate_slug(title)
            
            # Check if page with this slug already exists
            existing = await self.db_service.get_records('wiki_pages', {'page_slug': slug})
            if existing:
                return {
                    'success': False,
                    'error': f'Page with slug "{slug}" already exists'
                }
            
            page_id = str(uuid.uuid4())
            
            # Create the page (public, no user isolation)
            page_data = {
                'page_id': page_id,
                'page_title': title,
                'page_slug': slug,
                'content': content,
                'summary': summary,
                'last_editor_id': user_id,
                'last_editor_name': user_name,
                'view_count': 0
            }
            
            await self.db_service.create_record('wiki_pages', page_data)
            
            # Create edit history entry (tracks user)
            edit_data = {
                'edit_id': str(uuid.uuid4()),
                'page_id': page_id,
                'user_id': user_id,
                'user_name': user_name,
                'edit_type': 'create',
                'new_content': content,
                'edit_summary': f'Created page: {title}',
                'characters_changed': len(content)
            }
            
            await self.db_service.create_record('edit_history', edit_data)
            
            return {
                'success': True,
                'message': f'Wiki page "{title}" created successfully',
                'data': {
                    'page_id': page_id,
                    'page_slug': slug,
                    'title': title,
                    'created_by': user_name,
                    'isolation_info': {
                        'page_visibility': 'public (user_isolation: disabled)',
                        'edit_tracking': 'user-specific history recorded'
                    }
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to create page: {str(e)}'
            }
    
    async def _update_page(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing page and record edit history."""
        try:
            page_slug = input_data.get('page_slug', '').strip()
            new_content = input_data.get('content', '').strip()
            edit_summary = input_data.get('edit_summary', 'Updated page content').strip()
            user_id = input_data.get('user_id', 'system')
            user_name = input_data.get('user_name', 'System')
            
            if not page_slug or not new_content:
                return {
                    'success': False,
                    'error': 'Page slug and content are required'
                }
            
            # Get existing page
            pages = await self.db_service.get_records('wiki_pages', {'page_slug': page_slug})
            if not pages:
                return {
                    'success': False,
                    'error': f'Page with slug "{page_slug}" not found'
                }
            
            page = pages[0]
            previous_content = page.get('content', '')
            
            # Calculate change metrics
            char_diff = len(new_content) - len(previous_content)
            
            # Update the page
            update_data = {
                'content': new_content,
                'last_editor_id': user_id,
                'last_editor_name': user_name,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            await self.db_service.update_record('wiki_pages', page['page_id'], update_data)
            
            # Record edit history
            edit_data = {
                'edit_id': str(uuid.uuid4()),
                'page_id': page['page_id'],
                'user_id': user_id,
                'user_name': user_name,
                'edit_type': 'update',
                'previous_content': previous_content,
                'new_content': new_content,
                'edit_summary': edit_summary,
                'characters_changed': char_diff
            }
            
            await self.db_service.create_record('edit_history', edit_data)
            
            return {
                'success': True,
                'message': f'Page "{page["page_title"]}" updated successfully',
                'data': {
                    'page_slug': page_slug,
                    'updated_by': user_name,
                    'characters_changed': char_diff,
                    'edit_summary': edit_summary
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to update page: {str(e)}'
            }
    
    async def _get_page(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get page content (public access)."""
        try:
            page_slug = input_data.get('page_slug', '').strip()
            
            if not page_slug:
                return {
                    'success': False,
                    'error': 'Page slug is required'
                }
            
            # Get page (accessible to all users)
            pages = await self.db_service.get_records('wiki_pages', {'page_slug': page_slug})
            if not pages:
                return {
                    'success': False,
                    'error': f'Page "{page_slug}" not found'
                }
            
            page = pages[0]
            
            # Increment view count
            new_count = (page.get('view_count', 0) or 0) + 1
            await self.db_service.update_record('wiki_pages', page['page_id'], {'view_count': new_count})
            
            return {
                'success': True,
                'message': f'Retrieved page "{page["page_title"]}"',
                'data': {
                    'page': {**page, 'view_count': new_count},
                    'access_info': {
                        'visibility': 'public',
                        'can_edit': 'all users',
                        'edit_history': 'tracked by user'
                    }
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get page: {str(e)}'
            }
    
    async def _get_page_history(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get edit history for a page."""
        try:
            page_slug = input_data.get('page_slug', '').strip()
            limit = input_data.get('limit', 50)
            
            if not page_slug:
                return {
                    'success': False,
                    'error': 'Page slug is required'
                }
            
            # Get page ID
            pages = await self.db_service.get_records('wiki_pages', {'page_slug': page_slug})
            if not pages:
                return {
                    'success': False,
                    'error': f'Page "{page_slug}" not found'
                }
            
            page_id = pages[0]['page_id']
            
            # Get edit history
            history = await self.db_service.get_records(
                'edit_history', 
                {'page_id': page_id},
                order_by='created_at DESC',
                limit=limit
            )
            
            return {
                'success': True,
                'message': f'Retrieved {len(history)} edit records for "{page_slug}"',
                'data': {
                    'page_title': pages[0]['page_title'],
                    'total_edits': len(history),
                    'edit_history': history,
                    'contributors': list(set([edit['user_name'] for edit in history]))
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get page history: {str(e)}'
            }
    
    async def _get_user_contributions(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get all edit contributions from a specific user."""
        try:
            user_id = input_data.get('user_id', '').strip()
            limit = input_data.get('limit', 100)
            
            if not user_id:
                return {
                    'success': False,
                    'error': 'User ID is required'
                }
            
            # Get user's edit history
            edits = await self.db_service.get_records(
                'edit_history',
                {'user_id': user_id},
                order_by='created_at DESC',
                limit=limit
            )
            
            # Get page titles for each edit
            page_ids = list(set([edit['page_id'] for edit in edits]))
            pages = {}
            for page_id in page_ids:
                page_records = await self.db_service.get_records('wiki_pages', {'page_id': page_id})
                if page_records:
                    pages[page_id] = page_records[0]['page_title']
            
            # Enhance edit records with page titles
            for edit in edits:
                edit['page_title'] = pages.get(edit['page_id'], 'Unknown Page')
            
            return {
                'success': True,
                'message': f'Retrieved {len(edits)} contributions',
                'data': {
                    'user_name': edits[0]['user_name'] if edits else 'Unknown',
                    'total_contributions': len(edits),
                    'pages_edited': len(set([edit['page_id'] for edit in edits])),
                    'contributions': edits
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get user contributions: {str(e)}'
            }
    
    async def _bulk_create_demo_pages(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create demo pages for testing mixed isolation."""
        try:
            demo_pages = [
                {
                    'title': 'Welcome to Wiki',
                    'content': '''# Welcome to the Wiki Test App

This is a demonstration of mixed isolation in FiberWise:

## How It Works
- **Pages are public**: All users can see and edit all pages
- **History is tracked**: Every edit records who made the change
- **Attribution matters**: Full transparency of contributions

## Test This App
1. Create pages as different users
2. Edit each other's pages  
3. View the edit history to see user tracking
4. Notice content is shared but authorship is preserved''',
                    'summary': 'Introduction to the wiki and how mixed isolation works'
                },
                {
                    'title': 'Collaboration Guidelines',
                    'content': '''# Collaboration Guidelines

## Editing Etiquette
- Always provide meaningful edit summaries
- Respect other contributors' work
- Make constructive improvements
- Discuss major changes if possible

## Content Standards
- Keep information accurate and up-to-date
- Use clear, accessible language
- Organize content with proper headings
- Cite sources when appropriate

## Community
This wiki demonstrates how public content with user tracking enables:
- Transparent collaboration
- Accountability for changes
- Shared knowledge building
- Attribution of contributions''',
                    'summary': 'Guidelines for collaborative editing'
                },
                {
                    'title': 'Technical Documentation',
                    'content': '''# Technical Documentation

## User Isolation Settings
This app uses `user_isolation: disabled` which means:
- All users see the same content
- No automatic data filtering by user
- Shared global namespace for all pages

## Edit History Tracking
Despite disabled isolation, we manually track:
- User ID for each edit
- User name for display
- Edit type (create, update, delete)
- Content changes and summaries
- Timestamps for all modifications

## Database Schema
- `wiki_pages`: Public pages visible to all
- `edit_history`: User-attributed change log

This demonstrates mixed approaches to data isolation.''',
                    'summary': 'Technical details about the isolation implementation'
                }
            ]
            
            created_pages = []
            user_id = input_data.get('demo_user_id', 'demo-system')
            user_name = input_data.get('demo_user_name', 'Demo System')
            
            for page_info in demo_pages:
                result = await self._create_page({
                    'title': page_info['title'],
                    'content': page_info['content'],
                    'summary': page_info['summary'],
                    'user_id': user_id,
                    'user_name': user_name
                })
                
                if result['success']:
                    created_pages.append(result['data'])
            
            return {
                'success': True,
                'message': f'Created {len(created_pages)} demo pages',
                'data': {
                    'pages_created': created_pages,
                    'demo_info': {
                        'purpose': 'Demonstrate mixed isolation',
                        'features': [
                            'Public content sharing',
                            'User-tracked edit history',
                            'Collaborative editing',
                            'Attribution transparency'
                        ]
                    }
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to create demo pages: {str(e)}'
            }
    
    async def _analyze_collaboration(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze collaboration patterns in the wiki."""
        try:
            # Get all pages and edit history
            pages = await self.db_service.get_records('wiki_pages')
            edits = await self.db_service.get_records('edit_history', order_by='created_at DESC')
            
            # Analyze data
            total_pages = len(pages)
            total_edits = len(edits)
            unique_contributors = len(set([edit['user_id'] for edit in edits]))
            
            # Find most active contributors
            contributor_counts = {}
            for edit in edits:
                user = edit['user_name']
                contributor_counts[user] = contributor_counts.get(user, 0) + 1
            
            top_contributors = sorted(contributor_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Find most edited pages
            page_edit_counts = {}
            for edit in edits:
                page_id = edit['page_id']
                page_edit_counts[page_id] = page_edit_counts.get(page_id, 0) + 1
            
            most_edited = []
            for page_id, edit_count in sorted(page_edit_counts.items(), key=lambda x: x[1], reverse=True)[:3]:
                page_info = next((p for p in pages if p['page_id'] == page_id), None)
                if page_info:
                    most_edited.append({
                        'title': page_info['page_title'],
                        'edit_count': edit_count
                    })
            
            return {
                'success': True,
                'message': 'Collaboration analysis complete',
                'data': {
                    'overview': {
                        'total_pages': total_pages,
                        'total_edits': total_edits,
                        'unique_contributors': unique_contributors,
                        'avg_edits_per_page': round(total_edits / max(total_pages, 1), 2)
                    },
                    'top_contributors': top_contributors,
                    'most_edited_pages': most_edited,
                    'isolation_benefits': {
                        'transparency': 'All edits are attributed to users',
                        'accountability': 'Change history preserves authorship',
                        'collaboration': 'Public access enables shared knowledge',
                        'tracking': 'Mixed approach balances openness with attribution'
                    }
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to analyze collaboration: {str(e)}'
            }
    
    def _generate_slug(self, title: str) -> str:
        """Generate URL-friendly slug from title."""
        import re
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        return slug.strip('-')


# Register the agent
agent = WikiAgent()