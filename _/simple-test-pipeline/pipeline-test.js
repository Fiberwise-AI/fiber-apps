/**
 * Pipeline Test Component
 * 
 * Simple UI component for testing the 2-agent pipeline
 */

class PipelineTestComponent extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="pipeline-test-container">
                <h2>Simple Test Pipeline</h2>
                <div class="input-section">
                    <label for="text-input">Enter text to analyze:</label>
                    <textarea id="text-input" placeholder="Enter your text here for analysis..."></textarea>
                    <div class="controls">
                        <select id="analysis-type">
                            <option value="comprehensive">Comprehensive Analysis</option>
                            <option value="basic">Basic Analysis</option>
                        </select>
                        <button id="process-btn" onclick="this.processText()">Process Text</button>
                    </div>
                </div>
                <div class="results-section" id="results" style="display: none;">
                    <h3>Pipeline Results</h3>
                    <div id="processing-results"></div>
                    <div id="summary-results"></div>
                </div>
                <div class="loading" id="loading" style="display: none;">
                    Processing... Please wait.
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.querySelector('#process-btn').addEventListener('click', () => this.processText());
        this.querySelector('#text-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.processText();
            }
        });
    }

    async processText() {
        const textInput = this.querySelector('#text-input');
        const analysisType = this.querySelector('#analysis-type');
        const loading = this.querySelector('#loading');
        const results = this.querySelector('#results');
        const processBtn = this.querySelector('#process-btn');
        
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        // Show loading state
        loading.style.display = 'block';
        results.style.display = 'none';
        processBtn.disabled = true;

        try {
            // Simulate pipeline execution
            console.log('Starting pipeline execution...');
            
            // Step 1: Text Processing
            const step1Result = await this.simulateTextProcessing({
                text: text,
                analysis_type: analysisType.value
            });
            
            if (!step1Result.success) {
                throw new Error(step1Result.error);
            }

            // Step 2: Summary Generation
            const step2Result = await this.simulateSummaryGeneration({
                processed_data: step1Result.data.processed_data,
                summary_type: analysisType.value
            });
            
            if (!step2Result.success) {
                throw new Error(step2Result.error);
            }

            // Display results
            this.displayResults(step1Result.data.processed_data, step2Result.data.summary_data);
            
        } catch (error) {
            console.error('Pipeline execution failed:', error);
            alert(\`Pipeline execution failed: \${error.message}\`);
        } finally {
            loading.style.display = 'none';
            processBtn.disabled = false;
        }
    }

    async simulateTextProcessing(input) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('[TextProcessorAgent] Processing text...');
        
        const words = input.text.split(/\\s+/).filter(word => word.length > 0);
        const sentences = input.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Extract keywords
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had']);
        const wordFreq = {};
        
        words.forEach(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
            if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
                wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
            }
        });
        
        const keywords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([keyword, frequency]) => ({
                keyword,
                frequency,
                relevance: Math.round((frequency / Math.max(...Object.values(wordFreq))) * 100)
            }));
        
        // Analyze sentiment
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best', 'awesome'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'disgusting'];
        
        const textLower = input.text.toLowerCase();
        const positiveCount = positiveWords.reduce((count, word) => count + (textLower.includes(word) ? 1 : 0), 0);
        const negativeCount = negativeWords.reduce((count, word) => count + (textLower.includes(word) ? 1 : 0), 0);
        
        let sentiment;
        if (positiveCount > negativeCount) {
            sentiment = { label: 'positive', confidence: 0.8, positive_indicators: positiveCount, negative_indicators: negativeCount };
        } else if (negativeCount > positiveCount) {
            sentiment = { label: 'negative', confidence: 0.8, positive_indicators: positiveCount, negative_indicators: negativeCount };
        } else {
            sentiment = { label: 'neutral', confidence: 0.6, positive_indicators: positiveCount, negative_indicators: negativeCount };
        }

        return {
            success: true,
            data: {
                processed_data: {
                    word_count: words.length,
                    sentence_count: sentences.length,
                    character_count: input.text.length,
                    keywords: keywords,
                    sentiment: sentiment,
                    original_text: input.text,
                    analysis_type: input.analysis_type
                }
            },
            message: \`Successfully processed text with \${words.length} words\`
        };
    }

    async simulateSummaryGeneration(input) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('[SummarizerAgent] Generating summary...');
        
        const data = input.processed_data;
        
        // Generate insights
        const insights = [];
        
        if (data.word_count > 100) {
            insights.push({ type: 'text_length', insight: 'This is a substantial piece of text with detailed content', confidence: 0.9 });
        } else if (data.word_count > 50) {
            insights.push({ type: 'text_length', insight: 'This is a moderate-length text with good detail', confidence: 0.8 });
        } else {
            insights.push({ type: 'text_length', insight: 'This is a concise text with brief content', confidence: 0.7 });
        }
        
        insights.push({
            type: 'sentiment',
            insight: \`\${data.sentiment.label.charAt(0).toUpperCase() + data.sentiment.label.slice(1)} sentiment detected with \${Math.round(data.sentiment.confidence * 100)}% confidence\`,
            confidence: data.sentiment.confidence
        });
        
        if (data.keywords.length > 0) {
            const topKeyword = data.keywords[0];
            insights.push({
                type: 'content',
                insight: \`Primary focus appears to be '\${topKeyword.keyword}' with \${topKeyword.relevance}% relevance\`,
                confidence: 0.8
            });
        }
        
        // Create summary
        let summary = \`Text analysis of \${data.word_count} words reveals \${data.sentiment.label} sentiment.\`;
        
        if (data.keywords.length > 0) {
            const keywordList = data.keywords.slice(0, 3).map(k => k.keyword).join(', ');
            summary += \` Primary topics include: \${keywordList}.\`;
        }
        
        if (input.summary_type === 'comprehensive') {
            const avgSentenceLength = Math.round(data.word_count / data.sentence_count);
            summary += \` Structure consists of \${data.sentence_count} sentences with average length of \${avgSentenceLength} words.\`;
        }

        return {
            success: true,
            data: {
                summary_data: {
                    text_statistics: {
                        word_count: data.word_count,
                        sentence_count: data.sentence_count,
                        character_count: data.character_count
                    },
                    sentiment_analysis: data.sentiment,
                    key_insights: insights,
                    summary: summary,
                    top_keywords: data.keywords.slice(0, 3),
                    analysis_metadata: {
                        analysis_type: data.analysis_type,
                        summary_type: input.summary_type
                    }
                }
            },
            message: \`Successfully generated summary with \${insights.length} insights\`
        };
    }

    displayResults(processedData, summaryData) {
        const results = this.querySelector('#results');
        const processingDiv = this.querySelector('#processing-results');
        const summaryDiv = this.querySelector('#summary-results');
        
        processingDiv.innerHTML = \`
            <div class="result-card">
                <h4>Step 1: Text Processing Results</h4>
                <div class="stats">
                    <span class="stat">Words: \${processedData.word_count}</span>
                    <span class="stat">Sentences: \${processedData.sentence_count}</span>
                    <span class="stat">Characters: \${processedData.character_count}</span>
                    <span class="stat">Sentiment: \${processedData.sentiment.label} (\${Math.round(processedData.sentiment.confidence * 100)}%)</span>
                </div>
                <div class="keywords">
                    <strong>Keywords:</strong> \${processedData.keywords.map(k => \`\${k.keyword} (\${k.relevance}%)\`).join(', ')}
                </div>
            </div>
        \`;
        
        summaryDiv.innerHTML = \`
            <div class="result-card">
                <h4>Step 2: Summary Generation Results</h4>
                <div class="summary">
                    <strong>Summary:</strong> \${summaryData.summary}
                </div>
                <div class="insights">
                    <strong>Key Insights:</strong>
                    <ul>
                        \${summaryData.key_insights.map(insight => \`<li>\${insight.insight} (confidence: \${Math.round(insight.confidence * 100)}%)</li>\`).join('')}
                    </ul>
                </div>
            </div>
        \`;
        
        results.style.display = 'block';
    }
}

// Register the custom element
customElements.define('pipeline-test', PipelineTestComponent);

export default PipelineTestComponent;