# Pipeline Architecture Documentation

## Overview

The FiberWise Pipeline System provides a flexible framework for creating, executing, and monitoring multi-step data processing workflows. Pipelines are implemented as Python classes that orchestrate calls to FiberWise functions and agents.

## Architecture Components

### 1. Pipeline Classes
- **Location**: `pipelines/` directory
- **Purpose**: Contain the execution logic for specific pipeline workflows
- **Benefits**: Version controllable, testable, debuggable Python code

### 2. Pipeline Registry
- **File**: `pipelines/__init__.py`
- **Purpose**: Central registry of available pipeline types
- **Function**: Maps pipeline names to implementation classes

### 3. Pipeline Runner Function
- **File**: `functions/run_complex_pipeline.py`
- **Purpose**: FiberWise function that serves as entry point for pipeline execution
- **Role**: Bridge between FiberWise SDK and Python pipeline classes

### 4. Individual Components
- **Functions**: Stateless processing units (data generation, analysis)
- **Agents**: Stateful AI agents with specific processing modes
- **Models**: Data storage for pipeline inputs, outputs, and execution logs

## Pipeline Execution Flow

```
JavaScript UI → run_complex_pipeline() → Pipeline Class → Functions/Agents → Results
     ↓                ↓                      ↓               ↓
   User Input    FiberWise Function    Python Logic    Processing Units
```

### Detailed Flow:

1. **Trigger**: User or external system calls `runComplexPipeline` function
2. **Selection**: Pipeline registry returns appropriate pipeline class
3. **Instantiation**: Pipeline class is created with FiberWise SDK instance
4. **Execution**: Pipeline orchestrates calls to functions and agents
5. **Results**: Execution results and performance data returned

## Current Pipeline Types

### Complex Multi-Agent Pipeline

**Flow**: `Test Data Generation → Parallel Processing → Synthesis → Performance Analysis`

```
  Generate Test Data
         ↓
    ┌────────────┐
    ↓            ↓
Processor 1   Processor 2
(Extract)     (Transform)
    ↓            ↓
    └─── → ──────┘
         ↓
   Advanced Processor
     (Synthesis)
         ↓
  Performance Analysis
```

**Components Used**:
- `generateTestData` function
- `DataProcessorAgent` (extract mode)
- `DataProcessorAgent` (transform mode)  
- `AdvancedTestAgent` (synthesis mode)
- `analyzePipelinePerformance` function

**Parallel Processing**: Steps 2a and 2b execute simultaneously

## Pipeline Implementation Pattern

```python
class MyCustomPipeline:
    def __init__(self, fiber_sdk):
        self.fiber = fiber_sdk
        self.execution_log = []
        self.metadata = {}
    
    async def execute(self, input_data):
        # Step 1: Preparation
        prepared_data = await self._prepare_input(input_data)
        
        # Step 2: Processing (can be parallel)
        results = await self._process_data(prepared_data)
        
        # Step 3: Analysis
        analysis = await self._analyze_results(results)
        
        return {
            'results': results,
            'analysis': analysis,
            'execution_log': self.execution_log,
            'metadata': self.metadata
        }
    
    async def _prepare_input(self, data):
        # Call FiberWise functions/agents
        pass
    
    async def _process_data(self, data):
        # Orchestrate parallel processing
        pass
    
    async def _analyze_results(self, results):
        # Final analysis step
        pass
```

## Future Expansion: Workflows and Triggers

### Workflow Concept
```
External Trigger → Workflow Engine → Pipeline Selection → Pipeline Execution
```

**Potential Workflow Types**:
- **Event-Driven**: Triggered by data changes, user actions, time schedules
- **Conditional**: Choose pipeline based on input data characteristics
- **Sequential**: Chain multiple pipelines together
- **Parallel**: Execute multiple pipelines simultaneously

**Potential Trigger Sources**:
- **API Endpoints**: External systems POST data
- **File Uploads**: New data files trigger processing
- **Scheduled**: Cron-like time-based triggers
- **User Actions**: Manual execution from UI
- **Data Events**: Database changes, model updates

### Workflow Decision Tree
```
Trigger Event → Workflow Analysis → Pipeline Selection
     ↓               ↓                    ↓
  (What?)        (How/When?)         (Which Pipeline?)
```

## Adding New Pipelines

### Step 1: Create Pipeline Class
```python
# pipelines/my_new_pipeline.py
class MyNewPipeline:
    def __init__(self, fiber_sdk):
        self.fiber = fiber_sdk
        
    async def execute(self, input_data):
        # Implementation here
        pass
```

### Step 2: Register Pipeline
```python
# pipelines/__init__.py
from .my_new_pipeline import MyNewPipeline

AVAILABLE_PIPELINES = {
    'complex-multi-agent': ComplexMultiAgentPipeline,
    'my-new-pipeline': MyNewPipeline,  # Add here
}
```

### Step 3: Update Runner Function (if needed)
Add new pipeline type to input schema validation in `run_complex_pipeline.py`

### Step 4: Document Pipeline
Add pipeline documentation to this file with:
- Purpose and use cases
- Input/output schemas
- Component dependencies
- Execution flow diagram

## Error Handling and Monitoring

### Execution Logging
Each pipeline maintains an execution log with:
- Step timestamps
- Component inputs/outputs
- Error messages
- Performance metrics

### Error Recovery
- **Graceful Degradation**: Continue execution with reduced functionality
- **Retry Logic**: Attempt failed steps with exponential backoff
- **Fallback Pipelines**: Switch to simpler pipeline on complex failure

### Performance Monitoring
- **Step Timing**: Individual component execution times
- **Resource Usage**: Memory, CPU utilization per step
- **Throughput**: Items processed per second
- **Success Rates**: Percentage of successful executions

## Data Models

### Pipeline Execution Records
```sql
pipeline_executions:
- execution_id (UUID)
- pipeline_type (string)
- status (running/completed/failed)
- input_data (JSON)
- output_data (JSON)
- execution_log (JSON)
- started_at/completed_at (datetime)
- created_by (user_id)
```

### Pipeline Performance Metrics
```sql
pipeline_metrics:
- metric_id (UUID)
- execution_id (UUID)
- step_name (string)
- metric_type (timing/resource/throughput)
- metric_value (float)
- recorded_at (datetime)
```

## Best Practices

### Pipeline Design
1. **Single Responsibility**: Each pipeline should have one clear purpose
2. **Composable Steps**: Design steps that can be reused across pipelines
3. **Error Boundaries**: Handle errors at appropriate granularity
4. **Idempotency**: Steps should be safely re-runnable

### Performance Optimization
1. **Parallel Execution**: Use `asyncio.gather()` for independent steps
2. **Resource Management**: Monitor memory usage in data-heavy pipelines
3. **Caching**: Cache expensive computations when appropriate
4. **Streaming**: Process large datasets in chunks

### Testing Strategy
1. **Unit Tests**: Test individual pipeline steps
2. **Integration Tests**: Test full pipeline execution
3. **Performance Tests**: Validate execution time and resource usage
4. **Chaos Tests**: Test error handling and recovery

## Security Considerations

### Input Validation
- Validate all input data before processing
- Sanitize user-provided data
- Implement rate limiting for external triggers

### Access Control
- Authenticate pipeline execution requests
- Authorize users for specific pipeline types
- Log all pipeline executions for audit

### Data Privacy
- Handle sensitive data according to privacy policies
- Implement data masking for logs
- Secure data transmission between components

---

*This documentation is living and should be updated as the pipeline system evolves.*