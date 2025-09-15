# Lead Generator App

An automated B2B lead generation pipeline that finds, enriches, and qualifies local business leads with human approval before adding them to your CRM system.

## Overview

This Fiberwise app implements a comprehensive B2B lead generation pipeline with the following features:

- **Business Discovery**: Uses Google Places API to find businesses by location and type
- **Data Enrichment**: AI-powered social media discovery for LinkedIn, Twitter, and Facebook
- **Lead Scoring**: Intelligent quality assessment using AI agents
- **Human Review**: Interactive approval workflow with detailed lead summaries
- **CRM Integration**: Automatic addition of approved leads to HubSpot, Salesforce, or custom CRM

## Pipeline Architecture

The pipeline follows a structured approach with formal input/output schemas for each step:

1. **Find Businesses** (`PlacesSearchStep`) - Search Google Places API
2. **Get Business Details** (`PlaceDetailsStep`) - Retrieve detailed business information  
3. **Enrich with Social Media** (`AgentEnricherStep`) - AI-powered social media discovery
4. **Score Lead Quality** (`AgentScorerStep`) - AI assessment of lead potential
5. **Human Review** (`human_input`) - Interactive approval workflow
6. **Add to CRM** (`AddToCrmStep`) - Add approved leads to CRM system

## File Structure

```
lead-generator-app/
├── app_manifest.yaml              # App configuration with pipeline definition
├── README.md                      # This documentation
└── src/
    └── pipelines/
        └── steps/
            ├── google/
            │   ├── places_search.py      # Google Places API search
            │   └── place_details.py     # Business details retrieval
            ├── agents/
            │   ├── enricher.py          # AI social media enrichment
            │   └── scorer.py            # AI lead quality scoring
            └── crm/
                └── add_contact.py       # CRM integration
```

## Input Parameters

When executing the pipeline, provide:

```json
{
  "business_type": "marketing agency",
  "location": "San Francisco, CA"
}
```

## Step Implementation Details

### Google Places Integration
- **PlacesSearchStep** (`src/pipelines/steps/google/places_search.py`): Searches for businesses using text search
- **PlaceDetailsStep** (`src/pipelines/steps/google/place_details.py`): Retrieves detailed business information including website, phone, address

### AI Agent Integration  
- **AgentEnricherStep** (`src/pipelines/steps/agents/enricher.py`): Uses AI agents to find social media profiles
- **AgentScorerStep** (`src/pipelines/steps/agents/scorer.py`): AI-powered lead quality assessment with scoring and reasoning

### Human Review Interface
Interactive form showing:
- Business summary (name, website, social media)
- AI quality score and reasoning
- Approval/rejection decision
- Notes field for additional context

### CRM Integration
**AddToCrmStep** (`src/pipelines/steps/crm/add_contact.py`) supports multiple CRM systems:
- **HubSpot**: Direct API integration
- **Salesforce**: API integration (placeholder)
- **Pipedrive**: API integration (placeholder)
- **Generic/Database**: Local database storage
- **Mock CRM**: For testing and demonstration

## Configuration

### Required Environment Variables

```bash
# Google Places API (optional - falls back to mock data)
GOOGLE_PLACES_API_KEY=your_google_api_key

# CRM Configuration
CRM_TYPE=hubspot  # or salesforce, pipedrive, database, mock
CRM_API_KEY=your_crm_api_key
CRM_BASE_URL=https://api.hubapi.com
CRM_DEFAULT_OWNER=owner_id
```

### Agent Dependencies

The pipeline references these AI agents (to be configured separately):

1. **social_media_finder_agent**: For social media URL discovery
2. **b2b_lead_scorer_agent**: For lead quality assessment

*Note: Agents are not yet supported in the UI, so these will use mock responses until agent integration is available.*

## Output Schema

Each step provides structured output with formal schemas:

```json
{
  "success": true,
  "result": {
    "final_result": {
      "company_name": "Elite Solutions Group",
      "website": "https://www.elitesolutions.com", 
      "lead_score": 82,
      "crm_record_id": "LEAD_A1B2C3D4",
      "decision": "Approve"
    },
    "step_results": {
      "find_businesses": { "places": [...] },
      "get_top_business_details": { "name": "...", "website": "..." },
      "enrich_with_socials": { "linkedin_url": "...", "twitter_url": "..." },
      "score_lead_quality": { "score": 82, "reasoning": "..." },
      "human_review_lead": { "decision": "Approve", "notes": "..." },
      "add_to_crm": { "success": true, "crm_record_id": "LEAD_A1B2C3D4" }
    }
  }
}
```

## Flow Control

The pipeline includes conditional logic:

- **No businesses found**: Ends with failure status
- **Human rejection**: Ends with success but skips CRM addition
- **Human approval**: Continues to CRM integration
- **Error handling**: Proper error propagation and fallback mechanisms

## Mock Data Support

All steps include mock data support for demonstration and testing:

- **Places API**: Generates realistic business listings based on search query
- **Agent responses**: Simulated social media discovery and intelligent scoring
- **CRM integration**: Mock CRM with generated record IDs

This allows the pipeline to work immediately without requiring external API keys or agent configurations.

## Deployment

Deploy using the Fiberwise CLI from the project root:

```bash
cd fiber-apps/lead-generator-app
fiber app deploy .
```

The app will be available in your Fiberwise dashboard for pipeline execution.

## Usage

1. Navigate to the Lead Generator app in your dashboard
2. Execute the B2B Lead Generation pipeline
3. Provide business type and location parameters
4. Monitor progress through the pipeline steps
5. Review and approve/reject leads in the human review step
6. Approved leads are automatically added to your CRM

## Features Demonstrated

This app showcases advanced Fiberwise pipeline capabilities:

- **Input/Output Schemas**: Formal data contracts for each step
- **Conditional Flow Control**: Branching logic based on step results
- **Human-in-the-Loop**: Interactive approval workflows
- **AI Agent Integration**: Structured agent activation and response parsing
- **External API Integration**: Google Places API with fallback mock data
- **Multi-CRM Support**: Flexible CRM integration patterns
- **Error Handling**: Robust error propagation and recovery

The implementation follows the enhanced pipeline architecture with formal I/O schemas, making the system self-documenting and enabling comprehensive validation.