"""
Email Analysis Pipeline

Multi-provider email analysis pipeline that demonstrates:
1. Explicit provider selection (no defaults)
2. OAuth credential service usage  
3. LLM provider selection for analysis
4. Pipeline execution with service injection

This pipeline can be activated with:
fiber activate ./email_analysis_pipeline.py --input-data '{
    "email_provider": "google",
    "llm_provider": "openai-gpt4", 
    "analysis_type": "sentiment",
    "email_limit": 10
}'
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

async def execute(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute email analysis pipeline with explicit provider selection.
    
    Args:
        input_data: Pipeline parameters
            - email_provider (str, required): OAuth provider ('google', 'microsoft') 
            - llm_provider (str, required): LLM provider for analysis
            - analysis_type (str, required): Type of analysis ('sentiment', 'summary', 'classification')
            - email_limit (int, required): Number of emails to analyze
            - email_label (str, optional): Email label/folder ('INBOX', 'SENT', etc.)
        context: Service context with injected services
    
    Returns:
        Analysis results with provider metadata
    """
    
    # Step 1: Validate required inputs (no defaults)
    validation_result = _validate_inputs(input_data)
    if not validation_result['valid']:
        return {"success": False, "error": validation_result['error']}
    
    email_provider = input_data['email_provider']
    llm_provider = input_data['llm_provider'] 
    analysis_type = input_data['analysis_type']
    email_limit = input_data['email_limit']
    email_label = input_data.get('email_label')  # Optional parameter
    
    try:
        # Step 2: Validate providers are available
        oauth_providers = context['providers']['oauth']
        llm_providers = context['providers']['llm']
        
        if email_provider not in oauth_providers:
            return {"success": False, "error": f"OAuth provider '{email_provider}' not configured"}
        
        if llm_provider not in llm_providers:
            return {"success": False, "error": f"LLM provider '{llm_provider}' not configured"}
        
        logger.info(f"Starting email analysis: {email_provider} → {llm_provider} → {analysis_type}")
        
        # Step 3: Get email service for specified provider
        email_service = await _get_email_service(email_provider, oauth_providers[email_provider], context)
        
        # Step 4: Fetch emails
        emails = await _fetch_emails(email_service, email_limit, email_label)
        if not emails:
            return {"success": False, "error": "No emails found to analyze"}
        
        logger.info(f"Retrieved {len(emails)} emails from {email_provider}")
        
        # Step 5: Get LLM service for analysis
        llm_service = await context['get_llm_service'](llm_provider)
        
        # Step 6: Analyze emails
        analysis_results = await _analyze_emails(emails, analysis_type, llm_service)
        
        # Step 7: Generate summary statistics
        summary = _generate_analysis_summary(emails, analysis_results, analysis_type)
        
        return {
            "success": True,
            "data": {
                "analysis_results": analysis_results,
                "summary": summary,
                "metadata": {
                    "email_provider": email_provider,
                    "llm_provider": llm_provider,
                    "analysis_type": analysis_type,
                    "emails_processed": len(emails),
                    "timestamp": datetime.now().isoformat()
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Pipeline execution failed: {str(e)}")
        return {"success": False, "error": f"Pipeline execution failed: {str(e)}"}

def _validate_inputs(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate required inputs with no defaults"""
    
    required_fields = ['email_provider', 'llm_provider', 'analysis_type', 'email_limit']
    
    for field in required_fields:
        if field not in input_data:
            return {"valid": False, "error": f"Required field '{field}' missing"}
        
        if not input_data[field]:
            return {"valid": False, "error": f"Required field '{field}' cannot be empty"}
    
    # Validate email_limit is positive integer
    try:
        email_limit = int(input_data['email_limit'])
        if email_limit <= 0 or email_limit > 100:
            return {"valid": False, "error": "email_limit must be between 1 and 100"}
    except (ValueError, TypeError):
        return {"valid": False, "error": "email_limit must be a valid integer"}
    
    # Validate analysis_type
    valid_analysis_types = ['sentiment', 'summary', 'classification', 'topics']
    if input_data['analysis_type'] not in valid_analysis_types:
        return {"valid": False, "error": f"analysis_type must be one of: {', '.join(valid_analysis_types)}"}
    
    # Validate email_provider 
    valid_email_providers = ['google', 'microsoft', 'yahoo']
    if input_data['email_provider'] not in valid_email_providers:
        return {"valid": False, "error": f"email_provider must be one of: {', '.join(valid_email_providers)}"}
    
    return {"valid": True}

async def _get_email_service(provider: str, oauth_config: Dict[str, Any], context: Dict[str, Any]):
    """Get email service for specified provider"""
    
    # Get OAuth service for this provider
    oauth_service = await context['get_oauth_service'](provider)
    
    if provider == 'google':
        return GmailService(oauth_service, oauth_config)
    elif provider == 'microsoft':
        return OutlookService(oauth_service, oauth_config)
    elif provider == 'yahoo':
        return YahooService(oauth_service, oauth_config)
    else:
        raise ValueError(f"Unsupported email provider: {provider}")

async def _fetch_emails(email_service, limit: int, label: Optional[str]) -> List[Dict[str, Any]]:
    """Fetch emails from the email service"""
    
    # Use label if provided, otherwise use provider default
    fetch_params = {'limit': limit}
    if label:
        fetch_params['label'] = label
    
    return await email_service.get_recent_emails(**fetch_params)

async def _analyze_emails(emails: List[Dict[str, Any]], analysis_type: str, llm_service) -> List[Dict[str, Any]]:
    """Analyze emails using specified LLM service"""
    
    results = []
    
    for email in emails:
        try:
            # Prepare email content for analysis
            email_content = f"Subject: {email.get('subject', '')}\nFrom: {email.get('sender', '')}\nContent: {email.get('snippet', '')}"
            
            # Generate analysis prompt based on type
            prompt = _generate_analysis_prompt(email_content, analysis_type)
            
            # Call LLM service
            response = await llm_service.generate(prompt)
            
            results.append({
                "email_id": email.get('id'),
                "subject": email.get('subject'),
                "sender": email.get('sender'),
                "analysis_type": analysis_type,
                "analysis_result": response.get('text', ''),
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to analyze email {email.get('id', 'unknown')}: {str(e)}")
            results.append({
                "email_id": email.get('id'),
                "subject": email.get('subject'),
                "analysis_type": analysis_type,
                "analysis_result": None,
                "error": str(e)
            })
    
    return results

def _generate_analysis_prompt(email_content: str, analysis_type: str) -> str:
    """Generate analysis prompt based on type"""
    
    if analysis_type == 'sentiment':
        return f"""Analyze the sentiment of this email and respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL.

Email content:
{email_content}

Sentiment:"""
    
    elif analysis_type == 'summary':
        return f"""Provide a concise 1-2 sentence summary of this email.

Email content:
{email_content}

Summary:"""
    
    elif analysis_type == 'classification':
        return f"""Classify this email into one category: WORK, PERSONAL, PROMOTIONAL, SPAM, or OTHER.

Email content:
{email_content}

Category:"""
    
    elif analysis_type == 'topics':
        return f"""Extract the main topics from this email. List up to 3 topics, separated by commas.

Email content:
{email_content}

Topics:"""
    
    else:
        return f"""Analyze this email for {analysis_type}.

Email content:
{email_content}

Analysis:"""

def _generate_analysis_summary(emails: List[Dict[str, Any]], results: List[Dict[str, Any]], analysis_type: str) -> Dict[str, Any]:
    """Generate summary statistics from analysis results"""
    
    total_emails = len(emails)
    successful_analyses = len([r for r in results if r.get('analysis_result') is not None])
    failed_analyses = total_emails - successful_analyses
    
    summary = {
        "total_emails": total_emails,
        "successful_analyses": successful_analyses,
        "failed_analyses": failed_analyses,
        "success_rate": (successful_analyses / total_emails * 100) if total_emails > 0 else 0,
        "analysis_type": analysis_type
    }
    
    # Add type-specific summaries
    if analysis_type == 'sentiment' and successful_analyses > 0:
        sentiments = [r.get('analysis_result', '').strip().upper() for r in results if r.get('analysis_result')]
        summary['sentiment_distribution'] = {
            'POSITIVE': sentiments.count('POSITIVE'),
            'NEGATIVE': sentiments.count('NEGATIVE'), 
            'NEUTRAL': sentiments.count('NEUTRAL')
        }
    
    elif analysis_type == 'classification' and successful_analyses > 0:
        categories = [r.get('analysis_result', '').strip().upper() for r in results if r.get('analysis_result')]
        summary['category_distribution'] = {
            'WORK': categories.count('WORK'),
            'PERSONAL': categories.count('PERSONAL'),
            'PROMOTIONAL': categories.count('PROMOTIONAL'),
            'SPAM': categories.count('SPAM'),
            'OTHER': categories.count('OTHER')
        }
    
    return summary

# Email service implementations (simplified for example)
class GmailService:
    def __init__(self, oauth_service, config):
        self.oauth_service = oauth_service
        self.config = config
    
    async def get_recent_emails(self, limit: int, label: str = 'INBOX') -> List[Dict[str, Any]]:
        # Implementation would use Gmail API with OAuth
        # This is a simplified example
        return []

class OutlookService:
    def __init__(self, oauth_service, config):
        self.oauth_service = oauth_service
        self.config = config
    
    async def get_recent_emails(self, limit: int, label: str = 'INBOX') -> List[Dict[str, Any]]:
        # Implementation would use Outlook API with OAuth
        # This is a simplified example  
        return []

class YahooService:
    def __init__(self, oauth_service, config):
        self.oauth_service = oauth_service
        self.config = config
    
    async def get_recent_emails(self, limit: int, label: str = 'INBOX') -> List[Dict[str, Any]]:
        # Implementation would use Yahoo API with OAuth
        # This is a simplified example
        return []