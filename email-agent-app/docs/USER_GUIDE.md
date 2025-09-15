# Email Agent App - User Guide

This comprehensive guide will help you get the most out of the Email Agent App's features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting Email Accounts](#connecting-email-accounts)
3. [Navigating the Interface](#navigating-the-interface)
4. [Managing Emails](#managing-emails)
5. [Composing Emails](#composing-emails)
6. [Email Analysis with AI](#email-analysis-with-ai)
7. [Managing Labels](#managing-labels)
8. [Customizing AI Templates](#customizing-ai-templates)
9. [Email Analytics](#email-analytics)
10. [Troubleshooting](#troubleshooting)

## Getting Started

The Email Agent App provides a unified interface for managing emails across multiple providers with powerful AI-assisted features.

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Email accounts with Gmail, Outlook, or Yahoo Mail

### First Launch

Upon first launching the app, you'll see the main dashboard with a prompt to connect your email accounts. Before you can use the app, you'll need to connect at least one email provider.

## Connecting Email Accounts

1. Click the **Settings** button in the top right corner
2. In the settings page, find the "Available Email Providers" section
3. Click the **Connect** button next to the provider you want to add
4. A popup window will appear with connection details
5. Click **Connect** to start the OAuth authentication flow
6. Log in to your email provider and grant the requested permissions
7. Once connected, the provider will appear in your "Connected Accounts" list
8. You can connect multiple accounts from different providers

### Connection Status

Connected accounts show a green "Connected" badge. You can:
- Click **Configure** to access provider-specific settings
- Click **Disconnect** to remove the connection

## Navigating the Interface

The app interface consists of several key areas:

### Header Bar

- **App title**: Click to return to the main view
- **Compose** button: Create a new email
- **Settings** button: Access app settings

### Sidebar

- **Provider selector**: Switch between connected email accounts
- **Folder navigation**: Access different email folders
  - Inbox: Primary incoming mail
  - Sent: Emails you've sent
  - Drafts: Saved email drafts
  - Starred: Important flagged emails
  - Labels: Access and manage custom labels

### Main Content Area

This area changes based on your current view:
- Email list: Shows search results or folder contents
- Email detail: Displays the selected email with analysis
- Compose view: Email composition interface
- Labels view: Label management interface

## Managing Emails

### Searching Emails

1. Select the provider and folder from the sidebar
2. Use the search bar at the top of the email list
3. Enter keywords, sender name, or other search criteria
4. Results will display as you type or when you press Enter
5. Use the advanced filters to refine your search:
   - Date range
   - Has attachments
   - From specific sender
   - With specific label

### Viewing Emails

1. Click on any email in the search results or folder view
2. The email content will display in the main area
3. Use the action buttons to:
   - Reply to the email
   - Mark as read/unread
   - Star/unstar the email
   - Apply labels
   - Delete the email
   - Analyze with AI

### Managing Email Status

- **Read/Unread**: Click the envelope icon to toggle
- **Starred**: Click the star icon to toggle
- **Important**: Click the important icon to toggle

## Composing Emails

### Creating a New Email

1. Click the **Compose** button in the header
2. Enter recipient email address(es) in the "To" field
3. Click "Add Cc/Bcc" to expand those fields if needed
4. Enter a subject for your email
5. Type your message in the body area
6. Click **Send** to send immediately or **Save Draft** to save for later

### Replying to an Email

1. Open the email you want to reply to
2. Click the **Reply** button
3. The compose form will appear with:
   - Recipient pre-filled with the original sender
   - Subject prefixed with "Re:"
   - Original message quoted below your cursor
4. Type your response
5. Click **Send** when ready

### Email Formatting

The compose form supports basic text formatting. You can:
- Use paragraph breaks for readability
- Include links (they'll become clickable)
- Quote previous messages with ">" prefix

## Email Analysis with AI

One of the most powerful features is AI-powered email analysis.

### Analyzing an Email

1. Open the email you want to analyze
2. Click the **Analyze** button
3. The system will process the email and provide insights, including:
   - Summary: A concise overview of the email content
   - Topics: Main subjects discussed in the email
   - Sentiment: The emotional tone (positive, negative, neutral)
   - Priority: Suggested importance level
   - Action Items: Tasks or follow-ups mentioned in the email
   - Suggested Reply: AI-generated response template
   - Suggested Labels: Recommended categories for the email

### Using Analysis Results

- Click **Apply Labels** to automatically add suggested labels
- Click **Use Reply** to start a new reply with the AI suggestion
- View action items to identify follow-up tasks

## Managing Labels

Labels help you organize emails by category or project.

### Viewing Labels

1. Click **Labels** in the sidebar
2. See all system and custom labels with email counts

### Creating New Labels

1. In the Labels view, click **Add Label**
2. Enter a name for your label
3. Click **Save**

### Applying Labels to Emails

1. Open an email
2. Click the **Labels** button
3. Check the boxes for labels you want to apply
4. Click **Apply**

### Removing Labels

1. Open an email
2. Click the **Labels** button
3. Uncheck labels you want to remove
4. Click **Apply**

## Customizing AI Templates

You can customize how AI analyzes your emails by creating templates.

### Accessing Templates

1. Go to Settings
2. Click the **Prompt Templates** tab

### Creating a New Template

1. Click **Add Template**
2. Enter a name and description
3. Create your template using variable placeholders:
   - `{sender}`: Email sender
   - `{subject}`: Email subject
   - `{body}`: Email content
   - `{date}`: Email date
4. Click **Save Template**

### Using Custom Templates

1. Open an email
2. Click the **Analyze** button
3. Select your custom template from the dropdown
4. Click **Analyze**

## Email Analytics

The analytics dashboard provides insights into your email usage and AI analysis.

### Accessing Analytics

Click **Analytics** in the main navigation

### Available Analytics

- **Email Volume**: Emails received over time
- **Sentiment Analysis**: Distribution of positive/negative/neutral emails
- **Priority Distribution**: High/medium/low priority breakdown
- **Top Topics**: Most common subjects in your emails
- **Top Labels**: Most frequently used labels
- **Response Times**: How quickly you respond to emails

### Filtering Analytics

Use the timeframe selector to view:
- Last week
- Last month
- Last year
- All time

## Troubleshooting

### Connection Issues

If you can't connect to an email provider:
1. Check your internet connection
2. Ensure you're using the correct login credentials
3. Verify that you haven't revoked the app's access in your provider settings
4. Try disconnecting and reconnecting the account

### Search Problems

If search results aren't appearing:
1. Verify that your provider connection is active
2. Try more general search terms
3. Check that you're searching in the correct folder
4. Ensure your OAuth token hasn't expired

### Analysis Errors

If email analysis fails:
1. Check that the email content is accessible
2. Verify that the LLM service is available
3. Try using a different analysis template
4. Check for special characters or extremely long content that might cause issues

### Sending Failures

If you can't send emails:
1. Verify that your provider connection has the necessary permissions
2. Check that all recipient addresses are valid
3. Ensure you have internet connectivity
4. Look for any error messages in the notification area
