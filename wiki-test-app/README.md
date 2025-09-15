# Wiki Test App - Mixed Isolation Demo

This app demonstrates **mixed isolation** in FiberWise: public content with user-tracked edit history.

## Key Concept: Mixed Isolation

Unlike pure isolation models, this app shows a hybrid approach:

| Component | Isolation Level | Behavior |
|-----------|----------------|----------|
| **Wiki Pages** | `user_isolation: disabled` | Public, all users share same content |
| **Edit History** | User-tracked | Every change records who made it |

## Architecture

### Pages (Public/Shared)
- **Visibility**: All users see the same wiki pages
- **Editing**: Anyone can edit any page
- **Storage**: Single shared namespace
- **Access**: No user-based filtering

### Edit History (User-Attributed) 
- **Tracking**: Every edit records user ID and name
- **Accountability**: Full audit trail of who changed what
- **Transparency**: Edit history visible to all users
- **Attribution**: Contributors get credit for their work

## Testing Mixed Isolation

### Setup
1. Install the app: `fiber app deploy wiki-test-app`
2. Ensure you have multiple user accounts

### Test Scenarios

#### Scenario 1: Public Content Sharing
1. **User A Login**
   - Create a new wiki page "Project Overview"
   - Add initial content
   - Notice page is immediately public

2. **User B Login**  
   - Navigate to same app
   - See "Project Overview" page created by User A
   - Edit the page, add more content
   - Your changes are immediately visible

3. **User A Returns**
   - See User B's edits in the same page
   - Content is merged and shared
   - No user-specific filtering

#### Scenario 2: Edit History Tracking
1. **Create Demo Content**
   - User A creates "Guidelines" page
   - User B edits it to add sections
   - User C makes corrections

2. **View Edit History**
   - Go to page history view
   - See chronological list of all edits
   - Each edit shows:
     - Who made the change
     - When it was made
     - Edit summary
     - Character count changes

3. **User Attribution**
   - Original author is preserved
   - All contributors are credited
   - Edit summaries provide context

#### Scenario 3: Collaborative Workflow
1. **Start with User A**
   - Create "Technical Specs" page
   - Add basic structure

2. **User B Enhances**
   - Add detailed sections
   - Include implementation notes
   - Provide edit summary: "Added implementation details"

3. **User C Reviews**
   - Make corrections and improvements
   - Edit summary: "Fixed typos and clarified requirements"

4. **Check Results**
   - All users see the latest version
   - History shows all contributions
   - Attribution is preserved

## Agent Testing

Use the WikiAgent for programmatic testing:

### Create Demo Content
```javascript
// Create sample pages for testing
agent.execute({
  command: 'bulk_create_demo',
  demo_user_id: 'test-user',
  demo_user_name: 'Test User'
})
```

### Test Page Operations
```javascript
// Create a new page
agent.execute({
  command: 'create_page',
  title: 'Test Page',
  content: 'This is test content',
  summary: 'Testing page creation',
  user_id: 'user123',
  user_name: 'John Doe'
})

// Update existing page
agent.execute({
  command: 'update_page',
  page_slug: 'test-page',
  content: 'Updated content with more details',
  edit_summary: 'Added more information',
  user_id: 'user456',
  user_name: 'Jane Smith'
})

// Get page history
agent.execute({
  command: 'get_page_history',
  page_slug: 'test-page',
  limit: 10
})
```

### Analyze Collaboration
```javascript
// Get collaboration insights
agent.execute({
  command: 'analyze_collaboration'
})

// Get user contributions
agent.execute({
  command: 'get_user_contributions',
  user_id: 'user123',
  limit: 50
})
```

## Database Schema

### wiki_pages (Public)
```sql
CREATE TABLE wiki_pages (
  page_id UUID PRIMARY KEY,
  page_title VARCHAR NOT NULL,
  page_slug VARCHAR UNIQUE NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR,
  last_editor_id VARCHAR,
  last_editor_name VARCHAR,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### edit_history (User-Tracked)
```sql
CREATE TABLE edit_history (
  edit_id UUID PRIMARY KEY,
  page_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  user_name VARCHAR NOT NULL,
  edit_type VARCHAR NOT NULL, -- create, update, delete
  previous_content TEXT,
  new_content TEXT NOT NULL,
  edit_summary VARCHAR,
  characters_changed INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Expected Behaviors

### ✅ What Works (Mixed Isolation)
- **Shared Content**: All users access same wiki pages
- **Public Editing**: Anyone can modify any page
- **User Tracking**: Every edit records the author
- **Edit History**: Full audit trail with attribution
- **Collaboration**: Transparent multi-user editing
- **Accountability**: Clear ownership of changes

### 🔍 Key Differences from Pure Isolation

| Pure Isolation (`enforced`) | Mixed Isolation (Wiki App) |
|----------------------------|----------------------------|
| Each user sees only their data | All users see same content |
| Automatic user filtering | No content filtering |
| Complete data separation | Shared data with tracking |
| User-specific namespaces | Global shared namespace |

### 🎯 Use Cases for Mixed Isolation
- **Wikis**: Public content, attributed edits
- **Documentation**: Shared knowledge base with author tracking
- **Collaborative Documents**: Joint editing with change history
- **Community Content**: Public contributions with accountability
- **Knowledge Bases**: Shared information with edit attribution

## File Structure

```
wiki-test-app/
├── app_manifest.yaml          # user_isolation: disabled for public content
├── index.js                   # Main UI with wiki home and create page
├── agents/
│   └── wiki_agent.py         # Page management and history tracking
└── README.md                 # This documentation
```

## Comparison with Other Isolation Levels

This app demonstrates the spectrum of isolation options:

1. **Pure Isolation (`enforced`)**: Complete user separation - see `multi-user-test-app`
2. **Mixed Isolation (`disabled` + tracking)**: Public content with attribution - **this app**
3. **No Isolation (`disabled`)**: Completely shared data with no tracking

Mixed isolation is ideal when you need transparency and collaboration while maintaining accountability.