# Pipeline Test App

A simple FiberWise app for testing pipeline execution with manual triggers.

## Features

- **Manual Pipeline Execution**: Click a button to trigger pipeline execution
- **Dynamic Data Models**: Stores test results with configurable data fields
- **LLM Agent Integration**: Includes a TestAgent that simulates LLM responses
- **Real-time Results**: View pipeline execution results and status
- **Simple UI**: Clean interface for testing without complexity

## Components

### App Structure
```
pipeline-test/
├── app_manifest.yaml       # App configuration and pipeline definitions
├── index.js               # Entry point
├── README.md             # This file
├── agents/
│   └── test_agent.py     # Test agent with simulated LLM responses
└── components/
    └── pipeline-test-app.js # Main UI component
```

### Dynamic Data Models

**TestResult Model** (`test_results` table):
- `test_id` (UUID) - Primary key
- `test_name` (String) - Human-readable test name
- `input_data` (Text) - Input provided to pipeline
- `pipeline_result` (Text) - JSON result from pipeline execution
- `status` (String) - pending, running, completed, failed
- `created_at` (Timestamp) - Auto-generated creation time

### Pipeline Definition

**Simple Test Pipeline**:
- **Trigger**: Manual (button click)
- **Nodes**: Single TestAgent node
- **Purpose**: Process input text through LLM agent and return structured response

### Test Agent

**TestAgent** features:
- Simulates LLM processing
- Handles various input types (greetings, questions, long text)
- Returns structured responses with metadata
- Configurable via pipeline configuration

## Installation

```bash
# Install the app to local FiberWise instance
fiber app install ./fiber-apps/pipeline-test --to-instance local --verbose

# Update existing installation
fiber app update ./fiber-apps/pipeline-test --to-instance local --verbose
```

## Usage

1. **Access the App**: Navigate to the app in your FiberWise instance
2. **Enter Test Data**: 
   - Test Name: Descriptive name for your test
   - Input Text: Text to process through the pipeline
3. **Select Pipeline**: Choose "Simple Test Pipeline"
4. **Execute**: Click "Execute Pipeline" button
5. **View Results**: Results appear in the right panel with status and output

## Testing Scenarios

### Quick Tests
- **Greeting**: "Hello there" → Agent responds with greeting acknowledgment
- **Question**: "What can you do?" → Agent provides helpful response
- **Long Text**: Paragraph of text → Agent analyzes word count and content
- **Empty Input**: "" → Agent handles empty input gracefully

### Pipeline Flow
1. User clicks "Execute Pipeline"
2. Test record created in `test_results` table with "running" status
3. Pipeline execution begins with input data
4. TestAgent processes input and returns structured response
5. Test record updated with results and "completed" status
6. UI refreshes to show new results

## API Endpoints Used

- `GET /api/v1/pipelines` - List available pipelines
- `POST /api/v1/pipelines/{id}/execute` - Execute specific pipeline
- `GET /api/v1/data/test_results` - Retrieve test results
- `POST /api/v1/data/test_results` - Create new test record
- `PUT /api/v1/data/test_results/{id}` - Update test record

## Development

This app serves as a template for pipeline testing and can be extended with:
- Multiple pipeline configurations
- Additional agents with different capabilities
- More complex data models
- Real LLM integration (replace simulated responses)
- Webhook triggers and scheduled execution testing

## Troubleshooting

- **Pipeline not found**: Ensure app is properly installed and pipelines are created
- **Agent errors**: Check agent logs and input data format
- **Database errors**: Verify data model is properly created during installation
- **UI not loading**: Check browser console for JavaScript errors