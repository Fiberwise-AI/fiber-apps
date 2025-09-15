# Knowledge Builder Pro V2

Advanced knowledge building app with **modular pipeline architecture** using individual step files, shared Pydantic schemas, and the FiberWise platform.

## 🏗️ **Architecture V2**

### **Core Innovation: Separated Concerns**
- **Core Schemas & Base Classes** → `fiberwise-common/pipeline_steps/`
- **App-Specific Steps** → `fiber-apps/knowledge-builder-pro-v2/pipeline/steps/`
- **Individual Step Files** → Maximum modularity and maintainability

### **Pipeline Steps (Each in Own File)**
```
pipeline/steps/
├── wikipedia_research_step.py      # Wikipedia API research
├── web_scraping_step.py           # Playwright web scraping
├── data_extraction_step.py        # Key information extraction
├── data_transformation_step.py    # Data structure transformation
├── data_analysis_step.py          # Pattern analysis
├── data_validation_step.py        # Data quality validation
├── research_coordination_step.py  # Research coordination
├── domain_expert_step.py          # Domain expertise
├── hypothesis_testing_step.py     # Hypothesis generation/testing
└── knowledge_synthesis_step.py    # Final knowledge synthesis
```

## 🎯 **Key Features V2**

✅ **Modular Steps**: Each step in its own file for maximum maintainability
✅ **Pydantic Validation**: Full type safety with JSON-class bidirectional conversion
✅ **Shared Schemas**: Reusable schemas in `fiberwise-common`
✅ **Clean Architecture**: Clear separation between core library and app logic
✅ **Individual Testing**: Each step can be tested independently

## 📋 **Pipeline Flow**

```
1. Wikipedia Research    → WikipediaResearchStep
2. Web Scraping         → WebScrapingStep  
3. Data Extraction      → DataExtractionStep
4. Data Transformation  → DataTransformationStep
5. Data Analysis        → DataAnalysisStep
6. Data Validation      → DataValidationStep
7. Research Coordination → ResearchCoordinationStep
8. Domain Expert        → DomainExpertStep
9. Hypothesis Testing   → HypothesisTestingStep
10. Knowledge Synthesis → KnowledgeSynthesisStep
```

## 🔧 **Schema Integration**

### **Type Safety in Code**
```python
# Validated Pydantic classes with IDE support
input_schema = WikipediaResearchInputSchema(
    research_topic="AI", 
    research_scope=ResearchScope.COMPREHENSIVE
)
```

### **JSON for Database/Agents**
```python
# Seamless JSON conversion for storage
json_schema = step.get_input_json_schema()  # For database
json_data = validated_input.dict()  # For agents
```

## 📁 **File Structure**

```
knowledge-builder-pro-v2/
├── pipeline/
│   ├── steps/
│   │   ├── wikipedia_research_step.py
│   │   ├── web_scraping_step.py
│   │   ├── [8 more individual step files]
│   │   └── __init__.py
│   ├── main.py                    # Main pipeline orchestrator
│   └── __init__.py
├── functions/
│   ├── wikipedia_api_scraper.py
│   └── synthesize_knowledge.py
├── agents/
│   ├── playwright_scraper_agent.py
│   ├── data_processor_agent.py
│   └── [3 more agent files]
├── components/
│   └── knowledge-builder-pro.js
├── app_manifest.yaml              # V2 manifest with step definitions
├── package.json                   # Updated for V2
└── index.js
```

## 🚀 **Usage**

### **Basic Pipeline Execution**
```python
from pipeline import execute_knowledge_building_pipeline

result = await execute_knowledge_building_pipeline(
    'artificial intelligence',
    {
        'research_scope': 'comprehensive',
        'enable_agent_conversations': True,
        'synthesis_mode': 'comprehensive'
    }
)
```

### **Individual Step Usage**
```python
from pipeline.steps import WikipediaResearchStep

step = WikipediaResearchStep(fiber_sdk)
result = await step.execute({
    'research_topic': 'machine learning',
    'research_scope': 'broad'
}, context)
```

### **Schema Access**
```python
# Get JSON schema for database storage
input_schema = step.get_input_json_schema()
output_schema = step.get_output_json_schema()

# Validate data
validated_data = step.validate_input(json_data)
```

## 🧪 **Testing**

```bash
# Test complete pipeline
npm test

# Test connectivity
npm run test-connectivity

# Test individual steps
python -m pytest pipeline/steps/test_wikipedia_research_step.py
```

## 📊 **Benefits of V2 Architecture**

🎯 **Maintainability**: Each step is isolated and independently maintainable
🎯 **Reusability**: Steps can be reused across different pipelines
🎯 **Type Safety**: Full Pydantic validation with IDE support
🎯 **JSON Compatible**: Seamless database and agent integration
🎯 **Testability**: Each step can be unit tested individually
🎯 **Scalability**: New steps can be added without affecting existing ones

## 🔗 **Dependencies**

- **Shared Library**: `fiberwise-common/pipeline_steps/` (schemas & base classes)
- **FiberWise SDK**: Platform integration
- **Pydantic**: Type validation and JSON conversion
- **Playwright**: Web scraping capabilities

## 📈 **Version Comparison**

| Feature | V1 | V2 |
|---------|----|----|
| Step Files | Monolithic | Individual Files |
| Schemas | JSON Dicts | Pydantic Classes |
| Validation | Manual | Automatic |
| Reusability | Limited | High |
| Maintainability | Difficult | Easy |
| Type Safety | None | Full |

Knowledge Builder Pro V2 represents a complete architectural overhaul focused on modularity, type safety, and maintainability while preserving all the powerful research capabilities of the original version.