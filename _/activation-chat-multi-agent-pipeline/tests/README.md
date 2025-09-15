# Test Suite for Activation Chat Multi-Agent Pipeline

This directory contains comprehensive tests for the activation-chat-multi-agent-pipeline application, including unit tests, integration tests, and performance tests.

## Test Structure

```
tests/
├── conftest.py                    # Pytest configuration and fixtures
├── test_count_chat_messages.py    # Tests for message counting function
├── test_analyze_chat_context.py   # Tests for context analysis function
├── test_chat_agents.py           # Tests for ChatAgent and ChatSummarizerAgent
├── test_pipeline_integration.py   # Integration tests for complete pipeline
├── requirements.txt              # Test dependencies
└── README.md                     # This file
```

## Test Coverage

### Unit Tests
- **Function Tests**: Individual function logic and error handling
- **Agent Tests**: Agent behavior, LLM integration, and response generation
- **Parameter Handling**: Configuration and parameter validation
- **Error Scenarios**: Edge cases and error recovery

### Integration Tests
- **Pipeline Flow**: End-to-end pipeline execution
- **Data Flow**: Data passing between pipeline nodes
- **Conditional Logic**: Decision-making in pipeline execution
- **Performance**: Large conversation handling and memory efficiency

### Test Categories

#### 1. Message Counting Tests (`test_count_chat_messages.py`)
- ✅ Successful message counting with filtering
- ✅ Empty conversation handling
- ✅ API error handling
- ✅ Different response format handling
- ✅ Parameter filtering (system messages, agent types, length)
- ✅ Message analysis and pattern detection

#### 2. Context Analysis Tests (`test_analyze_chat_context.py`)
- ✅ Summarization decision logic
- ✅ Topic analysis and keyword extraction
- ✅ Conversation quality metrics
- ✅ Recent context retrieval
- ✅ Theme identification
- ✅ Parameter customization

#### 3. Agent Tests (`test_chat_agents.py`)
- ✅ ChatAgent response generation
- ✅ Conversation history integration
- ✅ LLM service interaction
- ✅ ChatSummarizerAgent analysis
- ✅ Summary generation with LLM
- ✅ Conversation insights extraction
- ✅ Error handling and edge cases

#### 4. Integration Tests (`test_pipeline_integration.py`)
- ✅ Complete pipeline workflow
- ✅ Conditional execution paths
- ✅ Data flow between functions
- ✅ Error propagation
- ✅ Metadata tracking
- ✅ Performance with large conversations

## Running Tests

### Prerequisites
```bash
pip install -r requirements.txt
```

### Run All Tests
```bash
# From the app root directory
pytest tests/

# With coverage report
pytest tests/ --cov=functions --cov=agents --cov-report=html

# Parallel execution
pytest tests/ -n auto

# Verbose output
pytest tests/ -v
```

### Run Specific Test Categories
```bash
# Function tests only
pytest tests/test_count_chat_messages.py tests/test_analyze_chat_context.py

# Agent tests only
pytest tests/test_chat_agents.py

# Integration tests only
pytest tests/test_pipeline_integration.py
```

### Run with Performance Profiling
```bash
# With execution time benchmarks
pytest tests/ --benchmark-only

# With timeout protection
pytest tests/ --timeout=30
```

## Test Configuration

### Fixtures Available (`conftest.py`)
- `mock_fiber`: Mocked FiberWise SDK instance
- `mock_llm_service`: Mocked LLM service
- `sample_activations`: Sample chat activation data
- `pipeline_context`: Mock pipeline execution context
- `llm_response`: Sample LLM response format

### Mock Data Formats
The test suite supports multiple API response formats:
- Direct list format
- Dict with 'activations' key
- Dict with 'items' key
- Error string responses

## Test Scenarios Covered

### Happy Path Scenarios
1. **Successful Pipeline Execution**
   - Message count > threshold
   - Quality conversation analysis
   - Comprehensive summarization

2. **Conditional Logic**
   - Should summarize: High message count, good engagement
   - Should not summarize: Low count, poor quality, brief duration

### Error Scenarios
1. **API Failures**
   - Network timeouts
   - Invalid responses
   - Authentication errors

2. **Data Issues**
   - Missing chat IDs
   - Empty conversations
   - Malformed activation data

3. **Service Failures**
   - LLM service unavailable
   - Function execution errors
   - Agent processing failures

### Edge Cases
1. **Data Boundaries**
   - Very large conversations (100+ messages)
   - Empty conversations
   - Single message conversations

2. **Configuration Extremes**
   - Zero thresholds
   - Very high thresholds
   - Disabled features

## Performance Benchmarks

Expected performance characteristics:
- **Message Counting**: < 1 second for 100 messages
- **Context Analysis**: < 2 seconds for 100 messages  
- **Agent Processing**: < 5 seconds with LLM calls
- **Memory Usage**: Stable across multiple executions

## Continuous Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions config
- name: Run Tests
  run: |
    pip install -r tests/requirements.txt
    pytest tests/ --cov=functions --cov=agents --cov-report=xml
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage.xml
```

## Test Data Management

### Mock Data Philosophy
- **Realistic**: Based on actual activation structures
- **Comprehensive**: Covers various message types and scenarios
- **Isolated**: No external dependencies
- **Deterministic**: Consistent results across runs

### Adding New Tests

When adding new tests:
1. Use existing fixtures where possible
2. Follow naming convention: `test_<functionality>_<scenario>`
3. Include both success and failure cases
4. Add integration tests for new pipeline nodes
5. Update this README with new test coverage

## Debugging Test Failures

### Common Issues
1. **Mock Setup**: Ensure proper mock configuration
2. **Async Handling**: Use `pytest.mark.asyncio` for async tests
3. **Time Dependencies**: Use `freezegun` for time-sensitive tests
4. **Data Consistency**: Check mock data matches expected formats

### Debug Commands
```bash
# Run with detailed output
pytest tests/ -v -s

# Run specific test with debugging
pytest tests/test_count_chat_messages.py::TestChatMessageCounter::test_execute_successful_count -v -s

# Profile test execution
pytest tests/ --profile
```

This comprehensive test suite ensures the reliability and robustness of the activation-chat-multi-agent-pipeline system across all usage scenarios.