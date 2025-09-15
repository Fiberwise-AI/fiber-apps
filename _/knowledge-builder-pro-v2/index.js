/**
 * Knowledge Builder Pro App Entry Point
 * 
 * Main entry point for the Knowledge Builder Pro application.
 * Initializes the app and provides access to pipeline execution capabilities.
 */

const { FiberWise } = require('@fiberwise/sdk');

// Initialize FiberWise SDK
const fiber = new FiberWise();

/**
 * Main application initialization
 */
async function initializeApp() {
    console.log('[KnowledgeBuilderPro] Initializing Knowledge Builder Pro application...');
    
    try {
        // Register available pipelines
        console.log('[KnowledgeBuilderPro] Registering knowledge building pipeline...');
        
        // Verify pipeline registration
        const availablePipelines = await fiber.pipeline.list();
        console.log('[KnowledgeBuilderPro] Available pipelines:', availablePipelines);
        
        console.log('[KnowledgeBuilderPro] Knowledge Builder Pro application initialized successfully');
        return true;
        
    } catch (error) {
        console.error('[KnowledgeBuilderPro] Failed to initialize application:', error);
        return false;
    }
}

/**
 * Execute knowledge building pipeline
 * @param {string} researchTopic - The topic to research
 * @param {Object} options - Pipeline execution options
 * @returns {Promise<Object>} Pipeline execution results
 */
async function executeKnowledgeBuilding(researchTopic, options = {}) {
    console.log(`[KnowledgeBuilderPro] Starting knowledge building for topic: ${researchTopic}`);
    
    const defaultOptions = {
        research_scope: 'comprehensive',
        max_wikipedia_articles: 5,
        max_web_sources: 10,
        synthesis_mode: 'comprehensive',
        enable_agent_conversations: true,
        conversation_rounds: 3
    };
    
    const pipelineInput = {
        research_topic: researchTopic,
        ...defaultOptions,
        ...options,
        execution_id: `kb_${Date.now()}`,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Execute the knowledge building pipeline
        const result = await fiber.pipeline.execute('knowledge-builder', pipelineInput);
        
        console.log(`[KnowledgeBuilderPro] Knowledge building completed for: ${researchTopic}`);
        return result;
        
    } catch (error) {
        console.error(`[KnowledgeBuilderPro] Knowledge building failed for ${researchTopic}:`, error);
        throw error;
    }
}

/**
 * Get research project status
 * @param {string} executionId - The execution ID to check
 * @returns {Promise<Object>} Project status information
 */
async function getResearchStatus(executionId) {
    try {
        // In a full implementation, this would query the database
        // For now, return a simple status structure
        return {
            execution_id: executionId,
            status: 'completed', // Would be dynamic in real implementation
            progress: 100,
            current_step: 'knowledge_synthesis',
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`[KnowledgeBuilderPro] Failed to get research status for ${executionId}:`, error);
        throw error;
    }
}

/**
 * List all available research functions and agents
 * @returns {Promise<Object>} Available components
 */
async function getAvailableComponents() {
    try {
        const functions = await fiber.func.list();
        const agents = await fiber.agent.list();
        const pipelines = await fiber.pipeline.list();
        
        return {
            functions: functions.filter(f => f.startsWith('wikipedia') || f.startsWith('synthesize')),
            agents: agents.filter(a => a.includes('research') || a.includes('scraper') || a.includes('processor')),
            pipelines: pipelines.filter(p => p.includes('knowledge'))
        };
        
    } catch (error) {
        console.error('[KnowledgeBuilderPro] Failed to get available components:', error);
        throw error;
    }
}

/**
 * Test pipeline connectivity and component availability
 * @returns {Promise<Object>} Test results
 */
async function testConnectivity() {
    console.log('[KnowledgeBuilderPro] Testing component connectivity...');
    
    const testResults = {
        functions: {},
        agents: {},
        pipelines: {},
        overall_status: 'unknown'
    };
    
    try {
        // Test Wikipedia API scraper function
        try {
            await fiber.func.activate('wikipediaApiScraper', {
                topic: 'test',
                max_articles: 1,
                include_references: false
            });
            testResults.functions.wikipedia_scraper = 'available';
        } catch (error) {
            testResults.functions.wikipedia_scraper = `error: ${error.message}`;
        }
        
        // Test knowledge synthesis function
        try {
            await fiber.func.activate('synthesizeKnowledge', {
                project_id: 'test',
                synthesis_mode: 'summary'
            });
            testResults.functions.knowledge_synthesis = 'available';
        } catch (error) {
            testResults.functions.knowledge_synthesis = `error: ${error.message}`;
        }
        
        // Test Playwright scraper agent
        try {
            await fiber.agent.activate('PlaywrightScraperAgent', {
                mode: 'scrape_urls',
                urls: ['https://example.com'],
                max_depth: 1
            });
            testResults.agents.playwright_scraper = 'available';
        } catch (error) {
            testResults.agents.playwright_scraper = `error: ${error.message}`;
        }
        
        // Test data processor agent
        try {
            await fiber.agent.activate('data_processor_agent', {
                mode: 'extract',
                data: { test: 'data' },
                analysis_type: 'summary'
            });
            testResults.agents.data_processor = 'available';
        } catch (error) {
            testResults.agents.data_processor = `error: ${error.message}`;
        }
        
        // Test pipeline availability
        try {
            const pipelines = await fiber.pipeline.list();
            testResults.pipelines.knowledge_builder = pipelines.includes('knowledge-builder') ? 'available' : 'not_registered';
        } catch (error) {
            testResults.pipelines.knowledge_builder = `error: ${error.message}`;
        }
        
        // Determine overall status
        const allTests = [
            ...Object.values(testResults.functions),
            ...Object.values(testResults.agents),
            ...Object.values(testResults.pipelines)
        ];
        
        const availableCount = allTests.filter(status => status === 'available').length;
        const totalTests = allTests.length;
        
        if (availableCount === totalTests) {
            testResults.overall_status = 'all_systems_operational';
        } else if (availableCount > totalTests / 2) {
            testResults.overall_status = 'partial_functionality';
        } else {
            testResults.overall_status = 'limited_functionality';
        }
        
        console.log('[KnowledgeBuilderPro] Connectivity test completed:', testResults);
        return testResults;
        
    } catch (error) {
        console.error('[KnowledgeBuilderPro] Connectivity test failed:', error);
        testResults.overall_status = 'test_failed';
        return testResults;
    }
}

// Export main functions for use by other components
module.exports = {
    initializeApp,
    executeKnowledgeBuilding,
    getResearchStatus,
    getAvailableComponents,
    testConnectivity,
    fiber
};

// Auto-initialize if run directly
if (require.main === module) {
    initializeApp().then(success => {
        if (success) {
            console.log('[KnowledgeBuilderPro] Application ready for knowledge building operations');
        } else {
            console.error('[KnowledgeBuilderPro] Application initialization failed');
            process.exit(1);
        }
    });
}