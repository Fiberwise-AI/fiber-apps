/**
 * Knowledge Builder Pro Test Suite
 * 
 * Comprehensive test suite for validating the knowledge building pipeline
 * and all associated components.
 */

const { 
    initializeApp, 
    executeKnowledgeBuilding, 
    getResearchStatus, 
    getAvailableComponents,
    testConnectivity,
    fiber 
} = require('./index.js');

/**
 * Run comprehensive test suite
 */
async function runTestSuite() {
    console.log('🚀 Starting Knowledge Builder Pro Test Suite...\n');
    
    const testResults = {
        initialization: false,
        connectivity: false,
        components: false,
        pipeline_execution: false,
        overall_success: false
    };
    
    try {
        // Test 1: Application Initialization
        console.log('🔧 Test 1: Application Initialization');
        testResults.initialization = await testInitialization();
        console.log(`Result: ${testResults.initialization ? '✅ PASS' : '❌ FAIL'}\n`);
        
        // Test 2: Component Connectivity
        console.log('🔗 Test 2: Component Connectivity');
        testResults.connectivity = await testComponentConnectivity();
        console.log(`Result: ${testResults.connectivity ? '✅ PASS' : '❌ FAIL'}\n`);
        
        // Test 3: Available Components
        console.log('📦 Test 3: Available Components');
        testResults.components = await testAvailableComponents();
        console.log(`Result: ${testResults.components ? '✅ PASS' : '❌ FAIL'}\n`);
        
        // Test 4: Pipeline Execution (if other tests pass)
        if (testResults.initialization && testResults.connectivity) {
            console.log('🔄 Test 4: Pipeline Execution');
            testResults.pipeline_execution = await testPipelineExecution();
            console.log(`Result: ${testResults.pipeline_execution ? '✅ PASS' : '❌ FAIL'}\n`);
        } else {
            console.log('⏭️  Test 4: Pipeline Execution - SKIPPED (prerequisites failed)\n');
        }
        
        // Overall Results
        testResults.overall_success = Object.values(testResults).filter(Boolean).length >= 3;
        
        console.log('📊 Test Suite Summary:');
        console.log('========================');
        console.log(`Initialization: ${testResults.initialization ? '✅' : '❌'}`);
        console.log(`Connectivity: ${testResults.connectivity ? '✅' : '❌'}`);
        console.log(`Components: ${testResults.components ? '✅' : '❌'}`);
        console.log(`Pipeline Execution: ${testResults.pipeline_execution ? '✅' : '❌'}`);
        console.log(`Overall Success: ${testResults.overall_success ? '✅' : '❌'}`);
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Test suite failed with error:', error);
        return testResults;
    }
}

/**
 * Test application initialization
 */
async function testInitialization() {
    try {
        const initialized = await initializeApp();
        if (initialized) {
            console.log('   ✓ Application initialized successfully');
            return true;
        } else {
            console.log('   ✗ Application initialization failed');
            return false;
        }
    } catch (error) {
        console.log(`   ✗ Initialization error: ${error.message}`);
        return false;
    }
}

/**
 * Test component connectivity
 */
async function testComponentConnectivity() {
    try {
        const connectivityResults = await testConnectivity();
        
        console.log('   Function Tests:');
        Object.entries(connectivityResults.functions || {}).forEach(([name, status]) => {
            console.log(`     ${status === 'available' ? '✓' : '✗'} ${name}: ${status}`);
        });
        
        console.log('   Agent Tests:');
        Object.entries(connectivityResults.agents || {}).forEach(([name, status]) => {
            console.log(`     ${status === 'available' ? '✓' : '✗'} ${name}: ${status}`);
        });
        
        console.log('   Pipeline Tests:');
        Object.entries(connectivityResults.pipelines || {}).forEach(([name, status]) => {
            console.log(`     ${status === 'available' ? '✓' : '✗'} ${name}: ${status}`);
        });
        
        return connectivityResults.overall_status === 'all_systems_operational' || 
               connectivityResults.overall_status === 'partial_functionality';
               
    } catch (error) {
        console.log(`   ✗ Connectivity test error: ${error.message}`);
        return false;
    }
}

/**
 * Test available components listing
 */
async function testAvailableComponents() {
    try {
        const components = await getAvailableComponents();
        
        console.log(`   ✓ Functions available: ${components.functions?.length || 0}`);
        console.log(`   ✓ Agents available: ${components.agents?.length || 0}`);
        console.log(`   ✓ Pipelines available: ${components.pipelines?.length || 0}`);
        
        const hasMinimumComponents = 
            (components.functions?.length || 0) >= 1 &&
            (components.agents?.length || 0) >= 1 &&
            (components.pipelines?.length || 0) >= 1;
        
        return hasMinimumComponents;
        
    } catch (error) {
        console.log(`   ✗ Components listing error: ${error.message}`);
        return false;
    }
}

/**
 * Test pipeline execution with sample data
 */
async function testPipelineExecution() {
    try {
        console.log('   🔄 Starting sample pipeline execution...');
        
        const testTopic = 'artificial intelligence';
        const testOptions = {
            research_scope: 'summary',
            max_wikipedia_articles: 2,
            max_web_sources: 3,
            synthesis_mode: 'summary',
            enable_agent_conversations: false, // Disable for faster testing
            conversation_rounds: 1
        };
        
        const startTime = Date.now();
        const result = await executeKnowledgeBuilding(testTopic, testOptions);
        const executionTime = Date.now() - startTime;
        
        console.log(`   ✓ Pipeline completed in ${executionTime}ms`);
        console.log(`   ✓ Execution ID: ${result.execution_metadata?.execution_id || 'unknown'}`);
        console.log(`   ✓ Success status: ${result.success ? 'true' : 'false'}`);
        
        if (result.knowledge_base) {
            console.log(`   ✓ Knowledge base generated with ${Object.keys(result.knowledge_base).length} sections`);
        }
        
        return result.success === true;
        
    } catch (error) {
        console.log(`   ✗ Pipeline execution error: ${error.message}`);
        return false;
    }
}

/**
 * Run individual component tests
 */
async function runComponentTests() {
    console.log('🧪 Running Individual Component Tests...\n');
    
    // Test Wikipedia API Scraper
    console.log('📖 Testing Wikipedia API Scraper:');
    try {
        const wikipediaResult = await fiber.func.activate('wikipediaApiScraper', {
            topic: 'machine learning',
            max_articles: 2,
            include_references: false,
            language: 'en'
        });
        console.log(`   ✓ Wikipedia scraper: ${wikipediaResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (wikipediaResult.success) {
            console.log(`   ✓ Retrieved ${wikipediaResult.articles?.length || 0} articles`);
        }
    } catch (error) {
        console.log(`   ✗ Wikipedia scraper error: ${error.message}`);
    }
    
    // Test Knowledge Synthesis
    console.log('\n🧠 Testing Knowledge Synthesis:');
    try {
        const synthesisResult = await fiber.func.activate('synthesizeKnowledge', {
            project_id: 'test_project_' + Date.now(),
            synthesis_mode: 'summary'
        });
        console.log(`   ✓ Knowledge synthesis: ${synthesisResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (synthesisResult.success) {
            console.log(`   ✓ Generated ${synthesisResult.key_findings?.length || 0} key findings`);
        }
    } catch (error) {
        console.log(`   ✗ Knowledge synthesis error: ${error.message}`);
    }
    
    // Test Data Processor Agent
    console.log('\n🔧 Testing Data Processor Agent:');
    try {
        const processorResult = await fiber.agent.activate('data_processor_agent', {
            mode: 'extract',
            data: {
                wikipedia_data: {
                    success: true,
                    articles: [{
                        title: 'Test Article',
                        extract: 'This is a test article for processing.'
                    }]
                }
            },
            analysis_type: 'summary'
        });
        console.log(`   ✓ Data processor: ${processorResult.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
        console.log(`   ✗ Data processor error: ${error.message}`);
    }
}

/**
 * Performance benchmark test
 */
async function runPerformanceTest() {
    console.log('⚡ Running Performance Benchmark...\n');
    
    const performanceMetrics = {
        initialization_time: 0,
        component_discovery_time: 0,
        small_pipeline_time: 0,
        memory_usage: process.memoryUsage()
    };
    
    try {
        // Initialization time
        const initStart = Date.now();
        await initializeApp();
        performanceMetrics.initialization_time = Date.now() - initStart;
        
        // Component discovery time
        const discoveryStart = Date.now();
        await getAvailableComponents();
        performanceMetrics.component_discovery_time = Date.now() - discoveryStart;
        
        // Small pipeline execution time
        const pipelineStart = Date.now();
        await executeKnowledgeBuilding('test topic', {
            research_scope: 'summary',
            max_wikipedia_articles: 1,
            max_web_sources: 1,
            synthesis_mode: 'insights_only',
            enable_agent_conversations: false
        });
        performanceMetrics.small_pipeline_time = Date.now() - pipelineStart;
        
        console.log('📊 Performance Results:');
        console.log(`   Initialization: ${performanceMetrics.initialization_time}ms`);
        console.log(`   Component Discovery: ${performanceMetrics.component_discovery_time}ms`);
        console.log(`   Small Pipeline: ${performanceMetrics.small_pipeline_time}ms`);
        console.log(`   Memory Usage: ${Math.round(performanceMetrics.memory_usage.heapUsed / 1024 / 1024)}MB`);
        
        return performanceMetrics;
        
    } catch (error) {
        console.log(`   ✗ Performance test error: ${error.message}`);
        return performanceMetrics;
    }
}

// Main test execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--components')) {
        await runComponentTests();
    } else if (args.includes('--performance')) {
        await runPerformanceTest();
    } else if (args.includes('--all')) {
        await runTestSuite();
        await runComponentTests();
        await runPerformanceTest();
    } else {
        await runTestSuite();
    }
}

// Export for programmatic use
module.exports = {
    runTestSuite,
    runComponentTests,
    runPerformanceTest,
    testInitialization,
    testComponentConnectivity,
    testAvailableComponents,
    testPipelineExecution
};

// Run tests if called directly
if (require.main === module) {
    main().then(() => {
        console.log('\n🏁 Test execution completed');
    }).catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });
}