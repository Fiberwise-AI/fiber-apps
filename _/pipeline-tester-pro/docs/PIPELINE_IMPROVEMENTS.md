# FiberWise Pipeline Architecture Improvements

## Analysis of IA Modules Architecture

After reviewing the IA Modules pipeline system, several key improvements can be made to our FiberWise pipeline architecture.

## Key Learnings from IA Modules

### 1. **Service Injection Pattern**
- Clean `self.get_db()`, `self.get_http()` methods
- No decorators needed - simple method calls
- Services automatically available to all steps

### 2. **Step-Based Architecture**
- Base `Step` class with standard interface
- `async def work(self, data)` - single method to implement
- Shared data dictionary flows between steps

### 3. **JSON Configuration System**
- Declarative pipeline definitions
- Dynamic step loading from module paths
- Configuration separation from implementation

### 4. **Comprehensive Logging**
- Step-level execution tracking
- Database persistence of execution logs
- Performance monitoring built-in

## Proposed FiberWise Improvements

### Current FiberWise Architecture
```python
# Current approach - each pipeline is a custom class
class ComplexMultiAgentPipeline:
    async def execute(self, input_data):
        test_data = await self.fiber.func.activate('generateTestData', input_data)
        # ... manual orchestration
```

### Improved FiberWise Architecture

#### 1. **Step-Based System**
```python
# pipelines/core/step.py
class FiberStep:
    """Base class for all FiberWise pipeline steps"""
    
    def __init__(self, name: str, config: Dict[str, Any] = None):
        self.name = name
        self.config = config or {}
        self.fiber = None
        self.logger = None
    
    def set_fiber(self, fiber_instance):
        """Inject FiberWise SDK instance"""
        self.fiber = fiber_instance
    
    def set_logger(self, logger):
        """Inject step logger"""
        self.logger = logger
    
    async def work(self, data: Dict[str, Any]) -> Any:
        """Override this method in step implementations"""
        raise NotImplementedError
    
    # Convenience methods for common operations
    async def call_function(self, func_name: str, params: Dict):
        """Call FiberWise function"""
        return await self.fiber.func.activate(func_name, params)
    
    async def call_agent(self, agent_name: str, params: Dict):
        """Call FiberWise agent"""
        return await self.fiber.agent.activate(agent_name, params)
```

#### 2. **Pipeline Orchestrator**
```python
# pipelines/core/pipeline.py
class FiberPipeline:
    """FiberWise pipeline orchestrator"""
    
    def __init__(self, steps: List[FiberStep], fiber_instance, logger=None):
        self.steps = steps
        self.fiber = fiber_instance
        self.logger = logger or StepLogger()
        
        # Inject dependencies into all steps
        for step in self.steps:
            step.set_fiber(fiber_instance)
            step.set_logger(logger)
    
    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute pipeline steps sequentially"""
        data = input_data.copy()
        
        for step in self.steps:
            try:
                await self.logger.log_step_start(step.name, data)
                
                result = await step.work(data)
                data[step.name] = result
                
                await self.logger.log_step_complete(step.name, result)
                
            except Exception as e:
                await self.logger.log_step_error(step.name, e)
                raise
        
        return data
```

#### 3. **Specific Step Implementations**
```python
# pipelines/steps/data_generation_step.py
class DataGenerationStep(FiberStep):
    async def work(self, data: Dict[str, Any]) -> Any:
        config = {
            'data_type': self.config.get('data_type', 'json_objects'),
            'count': self.config.get('count', 10),
            'complexity': self.config.get('complexity', 'medium')
        }
        
        result = await self.call_function('generateTestData', config)
        return result.generated_data

# pipelines/steps/data_processor_step.py
class DataProcessorStep(FiberStep):
    async def work(self, data: Dict[str, Any]) -> Any:
        # Get data from previous step
        input_data = data.get('data_generation', [])
        
        config = {
            'mode': self.config.get('mode', 'transform'),
            'data': input_data
        }
        
        return await self.call_agent('DataProcessorAgent', config)

# pipelines/steps/parallel_processor_step.py
class ParallelProcessorStep(FiberStep):
    async def work(self, data: Dict[str, Any]) -> Any:
        input_data = data.get('data_generation', [])
        
        # Run both processors in parallel
        tasks = [
            self.call_agent('DataProcessorAgent', {
                'mode': 'extract',
                'data': input_data
            }),
            self.call_agent('DataProcessorAgent', {
                'mode': 'transform', 
                'data': input_data
            })
        ]
        
        extract_result, transform_result = await asyncio.gather(*tasks)
        
        return {
            'extract_result': extract_result,
            'transform_result': transform_result
        }
```

#### 4. **JSON Pipeline Configuration**
```json
{
  "name": "Complex Multi-Agent Pipeline",
  "description": "Test Data Generation → Parallel Processing → Synthesis → Analysis",
  "steps": [
    {
      "name": "data_generation",
      "class": "DataGenerationStep",
      "module": "pipelines.steps.data_generation_step",
      "config": {
        "data_type": "json_objects",
        "count": 20,
        "complexity": "medium"
      }
    },
    {
      "name": "parallel_processing",
      "class": "ParallelProcessorStep", 
      "module": "pipelines.steps.parallel_processor_step",
      "config": {}
    },
    {
      "name": "synthesis",
      "class": "SynthesisStep",
      "module": "pipelines.steps.synthesis_step",
      "config": {
        "mode": "synthesis"
      }
    },
    {
      "name": "performance_analysis",
      "class": "PerformanceAnalysisStep",
      "module": "pipelines.steps.performance_analysis_step", 
      "config": {
        "analysis_type": "timing"
      }
    }
  ]
}
```

#### 5. **Dynamic Pipeline Loading**
```python
# pipelines/core/loader.py
def load_pipeline_from_json(json_file: str, fiber_instance) -> FiberPipeline:
    """Load pipeline from JSON configuration"""
    with open(json_file, 'r') as f:
        config = json.load(f)
    
    steps = []
    for step_def in config['steps']:
        step_class = load_step_class(step_def['module'], step_def['class'])
        step = step_class(step_def['name'], step_def.get('config', {}))
        steps.append(step)
    
    return FiberPipeline(steps, fiber_instance)

def load_step_class(module_path: str, class_name: str):
    """Dynamically import step class"""
    module = importlib.import_module(module_path)
    return getattr(module, class_name)
```

#### 6. **Simple Pipeline Runner Function**
```python
# functions/run_pipeline.py
async def run_pipeline(pipeline_name: str, input_data: Dict[str, Any]):
    """FiberWise function to run any pipeline by name"""
    
    # Load pipeline configuration
    pipeline_file = f"pipelines/configs/{pipeline_name}.json"
    
    # Create pipeline
    pipeline = load_pipeline_from_json(pipeline_file, FIBER)
    
    # Execute pipeline
    result = await pipeline.run(input_data)
    
    return {
        'success': True,
        'pipeline_name': pipeline_name,
        'results': result,
        'execution_id': str(uuid.uuid4())
    }
```

## Implementation Benefits

### 1. **Simplified Step Creation**
```python
# Before: Complex pipeline class with manual orchestration
class ComplexMultiAgentPipeline:
    async def execute(self, input_data):
        # 50+ lines of manual orchestration

# After: Simple step classes
class DataGenerationStep(FiberStep):
    async def work(self, data):
        return await self.call_function('generateTestData', self.config)
```

### 2. **Reusable Components**
- Steps can be used across multiple pipelines
- Configuration drives behavior, not hardcoded logic
- Easy to add new steps without changing existing code

### 3. **Better Testing**
```python
# Test individual steps
step = DataGenerationStep('test', {'data_type': 'user_messages'})
step.set_fiber(mock_fiber)
result = await step.work({'input': 'test'})

# Test full pipelines
pipeline = load_pipeline_from_json('test_pipeline.json', mock_fiber)
result = await pipeline.run({'test': 'data'})
```

### 4. **Enhanced Observability**
- Every step execution logged automatically
- Performance metrics collected per step
- Error tracking with stack traces
- Database persistence of execution history

## Migration Strategy

### Phase 1: Core Infrastructure
1. Create `FiberStep` base class
2. Create `FiberPipeline` orchestrator  
3. Create `StepLogger` for execution tracking
4. Create pipeline loader utilities

### Phase 2: Step Library
1. Convert existing pipeline logic to step classes
2. Create reusable step library
3. Write JSON configurations for existing pipelines
4. Update `run_pipeline` function

### Phase 3: Enhanced Features
1. Add step dependency resolution
2. Add conditional step execution
3. Add parallel step execution groups
4. Add pipeline composition and inheritance

### Phase 4: Developer Experience
1. Create step templates and generators
2. Add pipeline validation and linting
3. Create visual pipeline editor
4. Add performance optimization suggestions

## Updated App Manifest

```yaml
functions:
- name: runPipeline
  description: Execute any pipeline by name with JSON configuration
  implementation_path: functions/run_pipeline.py
  input_schema:
    type: object
    properties:
      pipeline_name:
        type: string
        description: Name of pipeline to execute
      input_data:
        type: object
        description: Input data for pipeline

# Individual functions remain the same
- name: generateTestData
  implementation_path: functions/generate_test_data.py
  
- name: analyzePipelinePerformance
  implementation_path: functions/analyze_pipeline_performance.py

# Individual agents remain the same  
agents:
- name: DataProcessorAgent
  implementation_path: agents/data_processor_agent.py
  
- name: AdvancedTestAgent
  implementation_path: agents/advanced_test_agent.py
```

## Comparison: Before vs After

### Before: Monolithic Pipeline Classes
```python
# Hardcoded logic, difficult to test, not reusable
class ComplexMultiAgentPipeline:
    async def execute(self, input_data):
        # All orchestration logic hardcoded
        # Difficult to modify or extend
        # Hard to test individual components
```

### After: Composable Step System
```python
# Declarative JSON configuration
{
  "steps": [
    {"class": "DataGenerationStep", "config": {...}},
    {"class": "ParallelProcessorStep", "config": {...}},
    {"class": "SynthesisStep", "config": {...}}
  ]
}

# Simple step implementations
class DataGenerationStep(FiberStep):
    async def work(self, data):
        return await self.call_function('generateTestData', self.config)
```

**Result**: More maintainable, testable, and extensible pipeline system that matches the proven patterns from IA Modules while leveraging FiberWise's unique capabilities.