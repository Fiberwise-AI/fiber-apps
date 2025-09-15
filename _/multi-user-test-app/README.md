# Multi-User Login Test App

This app demonstrates how `user_isolation: enforced` works in FiberWise by allowing you to test data separation between different users.

## User Isolation Configuration

```yaml
user_isolation: enforced
```

This configuration means:
- **enforced**: All data is automatically isolated by user
- **auto_user_assignment**: New records automatically get the current user's ID
- **protect_user_id**: Users cannot modify the user_id field

## Testing User Isolation

### Step 1: Setup Multiple Users
1. Ensure you have at least 2 different user accounts in your FiberWise instance
2. Install this app: `fiber app deploy multi-user-test-app`

### Step 2: Test Data Isolation
1. **Login as User A**
   - Navigate to the Multi-User Test App
   - Create several messages with different categories
   - Note the messages appear in "Your Messages" section

2. **Logout and Login as User B**  
   - Navigate to the same app
   - Notice that User A's messages are NOT visible
   - Create different messages as User B
   - Only User B's messages appear

3. **Switch Back to User A**
   - Login again as User A
   - Verify User A still sees only their original messages
   - User B's messages are not visible to User A

### Step 3: Verify in Database
Check the database table `user_messages`:
```sql
SELECT message_text, user_id, created_at FROM user_messages;
```

You should see:
- Each message has a different `user_id` 
- Users can only query messages matching their `user_id`

## Agent Testing

Use the MessageTestAgent to test programmatically:

```javascript
// Create test message
agent.execute({
  command: 'create_test_message',
  message_text: 'Testing user isolation',
  category: 'test'
})

// Get current user's messages  
agent.execute({
  command: 'get_user_messages'
})

// Explain isolation
agent.execute({
  command: 'explain_isolation'
})
```

## Expected Behavior

With `user_isolation: "enforced"`:

✅ **What Works:**
- Each user sees only their own data
- New records automatically get correct user_id
- Users cannot access other users' data
- Database queries are filtered by user_id

❌ **What's Prevented:**
- Users cannot see other users' messages
- Users cannot modify user_id field
- Cross-user data access is blocked
- Agents cannot bypass user isolation

## Files Structure

```
multi-user-test-app/
├── app_manifest.yaml          # App configuration with user_isolation: enforced
├── index.js                   # Main UI component
├── agents/
│   └── message_test_agent.py  # Agent for testing isolation
└── README.md                  # This file
```

## Comparison with Different Isolation Levels

| Level | Behavior |
|-------|----------|
| `enforced` | Complete data separation, automatic user_id assignment |
| `optional` | Can bypass isolation in special cases |  
| `disabled` | All users share the same data |

This app uses `enforced` to demonstrate the strictest isolation level.