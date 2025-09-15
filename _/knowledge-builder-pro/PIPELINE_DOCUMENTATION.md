# Knowledge Builder Pro Pipeline Documentation

## Overview

The Knowledge Builder Pro pipeline is a comprehensive research automation system that combines Wikipedia API research, web scraping, multi-agent analysis, and knowledge synthesis to create structured knowledge bases on any topic.

## Pipeline Architecture

```
Wikipedia API → Playwright Scraping → Data Processing → Agent Conversations → Knowledge Synthesis
```

## Pipeline Steps Implementation

### Step 1: Wikipedia API Research 📖

**Location:** `pipelines/knowledge_builder_pipeline.py:144-182`
**Method:** `conduct_wikipedia_research()`
**Function Called:** `wikipediaApiScraper` (`functions/wikipedia_api_scraper.py`)

```python
async def conduct_wikipedia_research(self, topic: str, scope: str) -> Dict[str, Any]:
```

**What it does:**
- Searches Wikipedia for main topic articles
- Retrieves related articles based on research scope
- Extracts references for further web research
- Supports narrow (3 articles), broad (8 articles), comprehensive (15 articles) scopes

**Code Location in Main Pipeline:** Lines 67-70
```python
# Step 1: Wikipedia API Research
print("[KnowledgeBuilderPipeline] Phase 1: Wikipedia API Research")
self.research_state['phase'] = 'wikipedia_research'
wikipedia_data = await self.conduct_wikipedia_research(research_topic, research_scope)
```

---

### Step 2: Playwright Web Scraping 🌐

**Location:** `pipelines/knowledge_builder_pipeline.py:184-227`
**Method:** `conduct_web_scraping()`
**Agent Called:** `PlaywrightScraperAgent` (`agents/playwright_scraper_agent.py`)

```python
async def conduct_web_scraping(self, topic: str, max_sources: int, wikipedia_data: Dict[str, Any]) -> Dict[str, Any]:
```

**What it does:**
- Extracts URLs from Wikipedia references
- Uses Playwright to scrape web content
- Discovers additional relevant sources
- Performs deep content analysis on scraped data

**Code Location in Main Pipeline:** Lines 72-75
```python
# Step 2: Playwright Web Scraping
print("[KnowledgeBuilderPipeline] Phase 2: Web Scraping with Playwright")
self.research_state['phase'] = 'web_scraping'
web_scraped_data = await self.conduct_web_scraping(research_topic, max_sources, wikipedia_data)
```

---

### Step 3: Data Processing & Quality Assessment 🔧

**Location:** `pipelines/knowledge_builder_pipeline.py:229-263`
**Method:** `process_and_analyze_data()`
**Agent Called:** `data_processor_agent` (`agents/data_processor_agent.py`)

```python
async def process_and_analyze_data(self, topic: str, wikipedia_data: Dict[str, Any], web_scraped_data: Dict[str, Any]) -> Dict[str, Any]:
```

**What it does:**
- Extracts key information from all sources
- Transforms data into structured format
- Analyzes patterns across sources
- Validates data quality and reliability

**Processing Modes:**
- **Extract:** Key concepts, facts, references
- **Transform:** Structured topics, entities, relationships
- **Analyze:** Common themes, patterns, insights
- **Validate:** Quality scores, reliability assessment

**Code Location in Main Pipeline:** Lines 77-80
```python
# Step 3: Data Processing & Quality Assessment
print("[KnowledgeBuilderPipeline] Phase 3: Data Processing & Analysis")
self.research_state['phase'] = 'data_processing'
processed_data = await self.process_and_analyze_data(research_topic, wikipedia_data, web_scraped_data)
```

---

### Step 4: Agent Conversations & Hypothesis Testing 🤖

**Location:** `pipelines/knowledge_builder_pipeline.py:265-348`
**Method:** `facilitate_agent_conversations()`
**Agents Called:** Multiple conversational research agents

```python
async def facilitate_agent_conversations(self, topic: str, processed_data: Dict[str, Any]) -> Dict[str, Any]:
```

**What it does:**
- Orchestrates multi-agent research discussions
- Generates and tests hypotheses
- Facilitates expert domain analysis
- Coordinates collaborative knowledge building

**Agents Involved:**
- **Research Coordinator:** `research_coordinator_agent.py` - Orchestrates research process
- **Domain Expert:** `domain_expert_agent.py` - Provides subject matter expertise
- **Hypothesis Agent:** `hypothesis_agent.py` - Generates and tests theories

**Conversation Flow:**
1. Research Coordinator analyzes processed data
2. Domain Expert provides specialized insights
3. Hypothesis Agent generates testable theories
4. Collaborative discussion and validation

**Code Location in Main Pipeline:** Lines 83-88
```python
# Step 4: Agent Conversations & Collaborative Analysis
if enable_agent_conversations:
    print("[KnowledgeBuilderPipeline] Phase 4: Agent Conversations & Hypothesis Testing")
    self.research_state['phase'] = 'agent_collaboration'
    conversation_results = await self.facilitate_agent_conversations(research_topic, processed_data)
```

---

### Step 5: Knowledge Synthesis 🧠

**Location:** `pipelines/knowledge_builder_pipeline.py:350-395`
**Method:** `synthesize_knowledge()`
**Function Called:** `synthesizeKnowledge` (`functions/synthesize_knowledge.py`)

```python
async def synthesize_knowledge(self, topic: str, processed_data: Dict[str, Any], conversation_results: Dict[str, Any], synthesis_depth: str) -> Dict[str, Any]:
```

**What it does:**
- Combines all research data into comprehensive knowledge base
- Generates key findings and insights
- Calculates confidence scores
- Creates recommendations for future research

**Synthesis Modes:**
- **Comprehensive:** Full detailed analysis with cross-references
- **Summary:** Executive summary with key points
- **Insights Only:** Core insights and breakthrough findings

**Code Location in Main Pipeline:** Lines 91-95
```python
# Step 5: Knowledge Synthesis
print("[KnowledgeBuilderPipeline] Phase 5: Knowledge Synthesis")
self.research_state['phase'] = 'synthesis'
knowledge_base = await self.synthesize_knowledge(
    research_topic, processed_data, conversation_results, synthesis_depth
)
```

---

## Complete Pipeline Flow

**Main Pipeline Method:** `pipelines/knowledge_builder_pipeline.py:29-142`

```python
async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
```

### Pipeline Execution Order:

1. **Lines 67-70:** Wikipedia API Research
2. **Lines 72-75:** Playwright Web Scraping  
3. **Lines 77-80:** Data Processing & Analysis
4. **Lines 83-88:** Agent Conversations (optional)
5. **Lines 91-95:** Knowledge Synthesis

### Input Parameters:

```python
{
    'research_topic': str,           # Main research topic
    'research_scope': str,           # 'narrow', 'broad', 'comprehensive'
    'max_sources': int,              # Maximum web sources to scrape
    'enable_agent_conversations': bool, # Enable multi-agent analysis
    'synthesis_depth': str           # 'summary', 'detailed', 'insights_only'
}
```

### Output Structure:

```python
{
    'research_topic': str,
    'execution_successful': bool,
    'research_summary': {
        'wikipedia_articles': int,
        'web_sources': int,
        'agent_conversations': int,
        'knowledge_elements': int
    },
    'research_data': {
        'wikipedia_research': Dict,
        'web_scraping_results': Dict,
        'processed_analysis': Dict,
        'agent_conversations': Dict,
        'final_knowledge_base': Dict
    },
    'execution_metadata': {
        'pipeline_version': str,
        'execution_time': str,
        'research_state': Dict,
        'execution_log': List,
        'quality_score': float
    }
}
```

## File Structure

```
knowledge-builder-pro/
├── pipelines/
│   ├── __init__.py
│   └── knowledge_builder_pipeline.py      # Main pipeline orchestrator
├── functions/
│   ├── wikipedia_api_scraper.py          # Step 1: Wikipedia research
│   └── synthesize_knowledge.py           # Step 5: Knowledge synthesis
├── agents/
│   ├── playwright_scraper_agent.py       # Step 2: Web scraping
│   ├── data_processor_agent.py          # Step 3: Data processing
│   ├── research_coordinator_agent.py     # Step 4: Research coordination
│   ├── domain_expert_agent.py           # Step 4: Domain expertise
│   └── hypothesis_agent.py              # Step 4: Hypothesis testing
├── components/
│   └── knowledge-builder-pro.js         # UI component
├── app_manifest.yaml                     # App configuration
├── index.js                             # App entry point
├── package.json                         # Dependencies
└── test.js                              # Test suite
```

## Usage Examples

### Basic Usage:
```javascript
const result = await executeKnowledgeBuilding('artificial intelligence', {
    research_scope: 'comprehensive',
    max_sources: 15,
    enable_agent_conversations: true,
    synthesis_depth: 'detailed'
});
```

### Quick Summary:
```javascript
const result = await executeKnowledgeBuilding('machine learning', {
    research_scope: 'narrow',
    max_sources: 5,
    enable_agent_conversations: false,
    synthesis_depth: 'summary'
});
```

### Testing:
```bash
# Run full test suite
npm test

# Test connectivity
npm run test-connectivity

# List available components
npm run list-components
```

## Key Features

✅ **Comprehensive Research:** Wikipedia API + web scraping + agent analysis
✅ **Multi-Agent Collaboration:** Research coordination, domain expertise, hypothesis testing  
✅ **Data Quality Validation:** Reliability scoring and source analysis
✅ **Flexible Synthesis:** Multiple depth levels and output formats
✅ **Complete Testing:** Connectivity, performance, and integration tests
✅ **Clean Architecture:** Proper separation between Python processing and JavaScript UI