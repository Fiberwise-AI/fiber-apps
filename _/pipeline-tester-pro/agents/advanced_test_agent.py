"""
Advanced Test Agent

A sophisticated test agent with configurable responses for comprehensive
pipeline testing and development scenarios.
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import random

logger = logging.getLogger(__name__)

class AdvancedTestAgent:
    """
    Advanced test agent that can simulate various processing scenarios
    for pipeline testing and development.
    
    Features:
    - Configurable response patterns
    - Simulated processing delays
    - Error simulation capabilities
    - Multiple output formats
    - Performance metrics tracking
    """
    
    def __init__(self):
        self.agent_name = "AdvancedTestAgent"
        self._version = "1.0.0"
        
        # Response templates for different scenarios
        self.response_templates = {
            'simple': {
                'status': 'success',
                'processed_data': 'Input processed successfully',
                'metadata': {'processing_type': 'simple'}
            },
            'complex': {
                'status': 'success',
                'analysis_results': {},
                'processed_data': {},
                'recommendations': [],
                'metadata': {'processing_type': 'complex'}
            },
            'error_simulation': {
                'status': 'error',
                'error_message': 'Simulated processing error',
                'error_code': 'SIM_ERROR_001'
            },
            'synthesis': {
                'status': 'success',
                'synthesized_output': '',
                'confidence_score': 0.95,
                'processing_steps': [],
                'metadata': {'processing_type': 'synthesis'}
            }
        }
        
        # Performance simulation parameters
        self.processing_delays = {
            'fast': (0.1, 0.5),      # 100-500ms
            'medium': (0.5, 2.0),    # 500ms-2s
            'slow': (2.0, 5.0),      # 2-5s
            'variable': (0.1, 5.0)   # Variable timing
        }
    
    async def run_agent(
        self, 
        input_data: Dict[str, Any], 
        fiber, 
        llm_service,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process input data with configurable behavior for testing.
        
        Args:
            input_data: Input data to process
            fiber: FiberWise SDK instance
            llm_service: LLM service for text generation
            
        Returns:
            Processed result based on configuration
        """
        start_time = datetime.utcnow()
        
        try:
            # Extract configuration
            config = input_data.get('config', {})
            mode = config.get('mode', 'simple')
            processing_speed = config.get('processing_speed', 'medium')
            simulate_error = config.get('simulate_error', False)
            use_llm = config.get('use_llm', False)
            
            logger.info(f"AdvancedTestAgent processing in mode: {mode}")
            
            # Simulate processing delay
            await self._simulate_processing_delay(processing_speed)
            
            # Handle error simulation
            if simulate_error:
                error_rate = config.get('error_rate', 0.1)
                if random.random() < error_rate:
                    return self._generate_error_response(input_data, config)
            
            # Process based on mode
            if mode == 'simple':
                result = await self._process_simple(input_data, config)
            elif mode == 'complex':
                result = await self._process_complex(input_data, config, llm_service if use_llm else None)
            elif mode == 'synthesis':
                result = await self._process_synthesis(input_data, config, llm_service if use_llm else None)
            elif mode == 'analysis':
                result = await self._process_analysis(input_data, config)
            else:
                result = await self._process_simple(input_data, config)
            
            # Add processing metadata
            end_time = datetime.utcnow()
            processing_time = (end_time - start_time).total_seconds() * 1000  # ms
            
            result['processing_metadata'] = {
                'agent_name': self.agent_name,
                'version': self._version,
                'mode': mode,
                'processing_time_ms': processing_time,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'config_used': config
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in AdvancedTestAgent: {str(e)}")
            return {
                'status': 'error',
                'error_message': f"Agent processing failed: {str(e)}",
                'error_type': 'agent_error',
                'input_data': input_data,
                'processing_metadata': {
                    'agent_name': self.agent_name,
                    'version': self._version,
                    'error_occurred': True,
                    'error_time': datetime.utcnow().isoformat()
                }
            }
    
    async def _simulate_processing_delay(self, speed: str):
        """Simulate realistic processing delays"""
        import asyncio
        
        if speed in self.processing_delays:
            min_delay, max_delay = self.processing_delays[speed]
            delay = random.uniform(min_delay, max_delay)
            await asyncio.sleep(delay)
    
    async def _process_simple(self, input_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Simple processing mode with basic transformations"""
        
        result = self.response_templates['simple'].copy()
        
        # Extract and process input
        text_input = input_data.get('text', input_data.get('input_text', ''))
        data_input = input_data.get('data', {})
        
        # Basic text processing
        if text_input:
            processed_text = {
                'original_length': len(text_input),
                'word_count': len(text_input.split()),
                'uppercase_version': text_input.upper(),
                'reversed_version': text_input[::-1],
                'character_frequency': self._calculate_char_frequency(text_input)
            }
            result['processed_text'] = processed_text
        
        # Basic data processing
        if data_input:
            result['processed_data'] = {
                'input_keys': list(data_input.keys()),
                'input_size': len(str(data_input)),
                'data_types': {k: type(v).__name__ for k, v in data_input.items()}
            }
        
        # Add configuration-specific processing
        if config.get('include_stats', True):
            result['statistics'] = {
                'processing_complexity': 'low',
                'operations_performed': ['text_analysis', 'data_inspection'],
                'confidence_level': random.uniform(0.8, 0.95)
            }
        
        return result
    
    async def _process_complex(
        self, 
        input_data: Dict[str, Any], 
        config: Dict[str, Any], 
        llm_service=None
    ) -> Dict[str, Any]:
        """Complex processing mode with advanced analysis"""
        
        result = self.response_templates['complex'].copy()
        
        text_input = input_data.get('text', input_data.get('input_text', ''))
        data_input = input_data.get('data', {})
        
        # Advanced text analysis
        if text_input:
            text_analysis = {
                'sentiment_analysis': {
                    'sentiment': random.choice(['positive', 'negative', 'neutral']),
                    'confidence': random.uniform(0.6, 0.95),
                    'emotional_indicators': random.sample(['joy', 'anger', 'fear', 'surprise'], 2)
                },
                'linguistic_features': {
                    'readability_score': random.uniform(5.0, 15.0),
                    'complexity_index': random.uniform(1.0, 10.0),
                    'key_phrases': self._extract_key_phrases(text_input),
                    'language_detected': 'en'
                },
                'content_analysis': {
                    'topics_detected': random.sample(['technology', 'business', 'science', 'education'], 2),
                    'entity_count': random.randint(1, 10),
                    'factual_statements': random.randint(0, 5)
                }
            }
            
            # Use LLM for enhanced analysis if available
            if llm_service and len(text_input) > 10:
                try:
                    llm_analysis = await self._perform_llm_analysis(text_input, llm_service)
                    text_analysis['llm_insights'] = llm_analysis
                except Exception as e:
                    logger.warning(f"LLM analysis failed: {str(e)}")
            
            result['analysis_results']['text_analysis'] = text_analysis
        
        # Advanced data analysis
        if data_input:
            data_analysis = {
                'structure_analysis': {
                    'depth': self._calculate_dict_depth(data_input),
                    'complexity_score': random.uniform(1.0, 10.0),
                    'data_distribution': self._analyze_data_distribution(data_input)
                },
                'quality_metrics': {
                    'completeness': random.uniform(0.7, 1.0),
                    'consistency': random.uniform(0.8, 1.0),
                    'validity': random.uniform(0.9, 1.0)
                }
            }
            result['analysis_results']['data_analysis'] = data_analysis
        
        # Generate recommendations
        result['recommendations'] = self._generate_recommendations(input_data, config)
        
        # Enhanced metadata
        result['metadata'].update({
            'analysis_depth': 'comprehensive',
            'processing_algorithms': ['nlp', 'statistical_analysis', 'pattern_recognition'],
            'confidence_score': random.uniform(0.85, 0.98)
        })
        
        return result
    
    async def _process_synthesis(
        self, 
        input_data: Dict[str, Any], 
        config: Dict[str, Any], 
        llm_service=None
    ) -> Dict[str, Any]:
        """Synthesis mode for combining multiple inputs"""
        
        result = self.response_templates['synthesis'].copy()
        
        # Handle multiple inputs for synthesis
        inputs = input_data.get('inputs', [input_data])
        if not isinstance(inputs, list):
            inputs = [inputs]
        
        processing_steps = []
        
        # Step 1: Input normalization
        normalized_inputs = []
        for i, inp in enumerate(inputs):
            normalized = self._normalize_input(inp)
            normalized_inputs.append(normalized)
            processing_steps.append(f"Normalized input {i+1}")
        
        # Step 2: Pattern detection
        patterns = self._detect_patterns(normalized_inputs)
        processing_steps.append("Detected common patterns")
        
        # Step 3: Synthesis
        if llm_service and any(inp.get('text') for inp in normalized_inputs):
            # LLM-based synthesis
            try:
                synthesized_text = await self._perform_llm_synthesis(normalized_inputs, llm_service)
                result['synthesized_output'] = synthesized_text
                processing_steps.append("LLM-based synthesis completed")
            except Exception as e:
                logger.warning(f"LLM synthesis failed: {str(e)}")
                result['synthesized_output'] = self._perform_rule_based_synthesis(normalized_inputs)
                processing_steps.append("Rule-based synthesis completed")
        else:
            # Rule-based synthesis
            result['synthesized_output'] = self._perform_rule_based_synthesis(normalized_inputs)
            processing_steps.append("Rule-based synthesis completed")
        
        # Add synthesis metadata
        result['confidence_score'] = random.uniform(0.8, 0.95)
        result['processing_steps'] = processing_steps
        result['synthesis_metadata'] = {
            'input_count': len(inputs),
            'patterns_detected': len(patterns),
            'synthesis_method': 'llm' if llm_service else 'rule_based'
        }
        
        return result
    
    async def _process_analysis(self, input_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Analysis mode for detailed data examination"""
        
        result = {
            'status': 'success',
            'analysis_type': 'comprehensive',
            'findings': {},
            'metrics': {},
            'recommendations': []
        }
        
        # Analyze different data types
        for key, value in input_data.items():
            if key == 'config':
                continue
                
            analysis = self._analyze_value(key, value)
            result['findings'][key] = analysis
        
        # Generate overall metrics
        result['metrics'] = {
            'total_fields_analyzed': len(result['findings']),
            'data_quality_score': random.uniform(0.7, 0.95),
            'complexity_rating': random.choice(['low', 'medium', 'high']),
            'processing_confidence': random.uniform(0.85, 0.98)
        }
        
        # Generate analysis-based recommendations
        result['recommendations'] = [
            "Consider normalizing text inputs for better processing",
            "Add validation for numeric fields",
            "Implement caching for repeated operations"
        ]
        
        return result
    
    def _generate_error_response(self, input_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate realistic error responses for testing"""
        
        error_types = [
            'validation_error',
            'processing_timeout',
            'resource_unavailable',
            'format_error',
            'dependency_failure'
        ]
        
        error_type = random.choice(error_types)
        
        error_messages = {
            'validation_error': 'Input data validation failed: required field missing',
            'processing_timeout': 'Processing timeout after 30 seconds',
            'resource_unavailable': 'Required external service unavailable',
            'format_error': 'Input data format not supported',
            'dependency_failure': 'Dependent service returned an error'
        }
        
        return {
            'status': 'error',
            'error_type': error_type,
            'error_message': error_messages[error_type],
            'error_code': f'ADV_TEST_{error_type.upper()}',
            'recoverable': error_type in ['processing_timeout', 'resource_unavailable'],
            'retry_after': random.randint(5, 30) if error_type == 'resource_unavailable' else None,
            'input_data_received': len(str(input_data)),
            'processing_metadata': {
                'agent_name': self.agent_name,
                'version': self._version,
                'simulated_error': True
            }
        }
    
    async def _perform_llm_analysis(self, text: str, llm_service) -> Dict[str, Any]:
        """Perform LLM-based text analysis"""
        
        prompt = f"""Analyze the following text and provide insights:

Text: {text[:500]}...

Please provide:
1. Main themes
2. Key concepts
3. Sentiment
4. Complexity level
5. Suggestions for improvement

Format your response as structured analysis."""
        
        try:
            response = await llm_service.generate_completion(
                prompt=prompt,
                temperature=0.3,
                max_tokens=500
            )
            
            if response and isinstance(response, dict) and 'text' in response:
                return {
                    'raw_analysis': response['text'],
                    'analysis_confidence': 0.9,
                    'llm_model_used': 'available',
                    'analysis_timestamp': datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"LLM analysis error: {str(e)}")
        
        return {
            'error': 'LLM analysis unavailable',
            'fallback_used': True
        }
    
    async def _perform_llm_synthesis(self, inputs: list, llm_service) -> str:
        """Perform LLM-based synthesis of multiple inputs"""
        
        # Combine text from inputs
        text_parts = []
        for inp in inputs:
            if isinstance(inp, dict) and 'text' in inp:
                text_parts.append(inp['text'])
            elif isinstance(inp, str):
                text_parts.append(inp)
        
        combined_text = " ".join(text_parts)[:1000]  # Limit length
        
        prompt = f"""Synthesize the following inputs into a coherent summary:

Inputs:
{combined_text}

Please create a concise synthesis that captures the key points and themes."""
        
        try:
            response = await llm_service.generate_completion(
                prompt=prompt,
                temperature=0.5,
                max_tokens=300
            )
            
            if response and isinstance(response, dict) and 'text' in response:
                return response['text'].strip()
        except Exception as e:
            logger.error(f"LLM synthesis error: {str(e)}")
        
        return self._perform_rule_based_synthesis(inputs)
    
    def _perform_rule_based_synthesis(self, inputs: list) -> str:
        """Fallback rule-based synthesis"""
        
        key_terms = []
        for inp in inputs:
            if isinstance(inp, dict):
                if 'text' in inp:
                    words = inp['text'].split()[:10]  # First 10 words
                    key_terms.extend(words)
                key_terms.extend(list(inp.keys()))
            elif isinstance(inp, str):
                key_terms.extend(inp.split()[:5])
        
        # Create simple synthesis
        unique_terms = list(set(key_terms))[:10]
        return f"Synthesis of inputs containing: {', '.join(unique_terms)}"
    
    def _calculate_char_frequency(self, text: str) -> Dict[str, int]:
        """Calculate character frequency in text"""
        freq = {}
        for char in text.lower():
            if char.isalpha():
                freq[char] = freq.get(char, 0) + 1
        return dict(sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5])
    
    def _extract_key_phrases(self, text: str) -> list:
        """Extract key phrases from text"""
        words = text.split()
        # Simple bigram extraction
        phrases = []
        for i in range(len(words) - 1):
            phrase = f"{words[i]} {words[i+1]}"
            if len(phrase) > 5:  # Skip very short phrases
                phrases.append(phrase)
        return phrases[:5]  # Return top 5 phrases
    
    def _calculate_dict_depth(self, data: dict) -> int:
        """Calculate maximum depth of nested dictionary"""
        if not isinstance(data, dict):
            return 0
        if not data:
            return 1
        return 1 + max(self._calculate_dict_depth(v) for v in data.values() if isinstance(v, dict))
    
    def _analyze_data_distribution(self, data: dict) -> Dict[str, Any]:
        """Analyze data type distribution"""
        types = {}
        for value in data.values():
            type_name = type(value).__name__
            types[type_name] = types.get(type_name, 0) + 1
        
        return {
            'type_distribution': types,
            'total_fields': len(data),
            'most_common_type': max(types, key=types.get) if types else 'unknown'
        }
    
    def _generate_recommendations(self, input_data: Dict[str, Any], config: Dict[str, Any]) -> list:
        """Generate processing recommendations"""
        recommendations = []
        
        # Check input size
        input_size = len(str(input_data))
        if input_size > 1000:
            recommendations.append("Consider chunking large inputs for better processing")
        
        # Check data structure
        if isinstance(input_data.get('data'), dict) and len(input_data['data']) > 10:
            recommendations.append("Consider flattening complex nested structures")
        
        # Check text length
        text_input = input_data.get('text', input_data.get('input_text', ''))
        if len(text_input) > 500:
            recommendations.append("Consider text summarization for long inputs")
        
        # Add default recommendation
        recommendations.append("Monitor processing performance for optimization opportunities")
        
        return recommendations
    
    def _normalize_input(self, inp: Any) -> Dict[str, Any]:
        """Normalize input to standard format"""
        if isinstance(inp, str):
            return {'text': inp, 'type': 'string'}
        elif isinstance(inp, dict):
            return {**inp, 'type': 'object'}
        elif isinstance(inp, (int, float)):
            return {'value': inp, 'type': 'number'}
        else:
            return {'data': str(inp), 'type': 'unknown'}
    
    def _detect_patterns(self, inputs: list) -> list:
        """Detect common patterns across inputs"""
        patterns = []
        
        # Check for common keys
        if all(isinstance(inp, dict) for inp in inputs):
            common_keys = set(inputs[0].keys())
            for inp in inputs[1:]:
                common_keys &= set(inp.keys())
            if common_keys:
                patterns.append(f"Common keys: {list(common_keys)}")
        
        # Check for similar data types
        types = [inp.get('type') for inp in inputs]
        if len(set(types)) == 1:
            patterns.append(f"Consistent type: {types[0]}")
        
        return patterns
    
    def _analyze_value(self, key: str, value: Any) -> Dict[str, Any]:
        """Analyze a single value"""
        analysis = {
            'type': type(value).__name__,
            'size': len(str(value)),
            'complexity': 'low'
        }
        
        if isinstance(value, str):
            analysis.update({
                'character_count': len(value),
                'word_count': len(value.split()),
                'contains_numbers': any(c.isdigit() for c in value),
                'contains_special_chars': any(not c.isalnum() and not c.isspace() for c in value)
            })
            
        elif isinstance(value, (list, tuple)):
            analysis.update({
                'item_count': len(value),
                'item_types': list(set(type(item).__name__ for item in value))
            })
            
        elif isinstance(value, dict):
            analysis.update({
                'key_count': len(value),
                'nested_depth': self._calculate_dict_depth(value)
            })
            if analysis['nested_depth'] > 2:
                analysis['complexity'] = 'high'
        
        return analysis


# Export the agent class
__all__ = ["AdvancedTestAgent"]