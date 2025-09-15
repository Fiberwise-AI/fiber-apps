"""
Data Processor Agent

A specialized agent for data processing operations including extraction,
transformation, and analysis with configurable processing modes.
"""

import json
import logging
import re
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import hashlib
import uuid

logger = logging.getLogger(__name__)

class DataProcessorAgent:
    """
    Versatile data processing agent with multiple processing modes
    for comprehensive data pipeline operations.
    
    Supports:
    - Extract mode: Data extraction and entity recognition
    - Transform mode: Data transformation and normalization
    - Analyze mode: Data analysis and pattern detection
    - Validate mode: Data validation and quality assessment
    """
    
    def __init__(self):
        self.agent_name = "DataProcessorAgent"
        self._version = "1.0.0"
        
        # Processing mode configurations
        self.mode_configs = {
            'extract': {
                'description': 'Extract entities, patterns, and structured data',
                'capabilities': ['entity_extraction', 'pattern_detection', 'metadata_generation'],
                'output_format': 'structured_data'
            },
            'transform': {
                'description': 'Transform and normalize data formats',
                'capabilities': ['format_conversion', 'normalization', 'enrichment'],
                'output_format': 'transformed_data'
            },
            'analyze': {
                'description': 'Analyze data patterns and generate insights',
                'capabilities': ['statistical_analysis', 'trend_detection', 'insight_generation'],
                'output_format': 'analysis_results'
            },
            'validate': {
                'description': 'Validate data quality and consistency',
                'capabilities': ['quality_assessment', 'consistency_check', 'anomaly_detection'],
                'output_format': 'validation_report'
            }
        }
        
        # Entity extraction patterns
        self.extraction_patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',
            'url': r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',
            'date': r'\b\d{4}-\d{2}-\d{2}\b|\b\d{2}/\d{2}/\d{4}\b|\b\d{2}-\d{2}-\d{4}\b',
            'time': r'\b\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?\b',
            'number': r'\b\d+(?:\.\d+)?\b',
            'currency': r'\$\d+(?:,\d{3})*(?:\.\d{2})?',
            'uuid': r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
            'ip_address': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        }
        
        # Data quality metrics
        self.quality_metrics = {
            'completeness': 'Percentage of non-null values',
            'accuracy': 'Correctness of data values',
            'consistency': 'Data consistency across fields',
            'validity': 'Data conforms to expected formats',
            'uniqueness': 'Absence of duplicate records',
            'timeliness': 'Data freshness and relevance'
        }
    
    async def run_agent(
        self,
        input_data: Dict[str, Any],
        fiber,
        llm_service,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process data based on the configured mode and parameters.
        
        Args:
            input_data: Data to process and processing configuration
            fiber: FiberWise SDK instance
            llm_service: LLM service for enhanced processing
            
        Returns:
            Processed data results based on mode
        """
        start_time = datetime.utcnow()
        
        try:
            # Extract configuration
            config = input_data.get('config', {})
            processing_mode = config.get('processing_mode', 'extract')
            
            # Validate processing mode
            if processing_mode not in self.mode_configs:
                raise ValueError(f"Unsupported processing mode: {processing_mode}")
            
            logger.info(f"DataProcessorAgent running in '{processing_mode}' mode")
            
            # Route to appropriate processing method
            if processing_mode == 'extract':
                result = await self._process_extract_mode(input_data, config, llm_service)
            elif processing_mode == 'transform':
                result = await self._process_transform_mode(input_data, config, llm_service)
            elif processing_mode == 'analyze':
                result = await self._process_analyze_mode(input_data, config, llm_service)
            elif processing_mode == 'validate':
                result = await self._process_validate_mode(input_data, config, llm_service)
            else:
                raise ValueError(f"Unhandled processing mode: {processing_mode}")
            
            # Add processing metadata
            end_time = datetime.utcnow()
            processing_time = (end_time - start_time).total_seconds() * 1000  # ms
            
            result['processing_metadata'] = {
                'agent_name': self.agent_name,
                'version': self._version,
                'processing_mode': processing_mode,
                'processing_time_ms': processing_time,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'config_used': config,
                'capabilities_used': self.mode_configs[processing_mode]['capabilities']
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in DataProcessorAgent: {str(e)}")
            return {
                'status': 'error',
                'error_message': f"Data processing failed: {str(e)}",
                'error_type': 'processing_error',
                'input_data_received': len(str(input_data)),
                'processing_metadata': {
                    'agent_name': self.agent_name,
                    'version': self._version,
                    'error_occurred': True,
                    'error_time': datetime.utcnow().isoformat()
                }
            }
    
    async def _process_extract_mode(
        self,
        input_data: Dict[str, Any],
        config: Dict[str, Any],
        llm_service
    ) -> Dict[str, Any]:
        """Extract entities, patterns, and structured data from input"""
        
        # Extract text and data for processing
        text_data = self._extract_text_from_input(input_data)
        structured_data = self._extract_structured_from_input(input_data)
        
        extraction_results = {
            'status': 'success',
            'mode': 'extract',
            'entities': {},
            'patterns': {},
            'metadata': {},
            'structured_elements': {}
        }
        
        # Entity extraction from text
        if text_data:
            extraction_results['entities'] = await self._extract_entities(text_data)
            extraction_results['patterns'] = await self._detect_text_patterns(text_data)
            
            # Use LLM for advanced entity extraction if available
            if llm_service and len(text_data) > 20:
                try:
                    llm_entities = await self._llm_entity_extraction(text_data, llm_service)
                    extraction_results['entities']['llm_extracted'] = llm_entities
                except Exception as e:
                    logger.warning(f"LLM entity extraction failed: {str(e)}")
        
        # Structured data extraction
        if structured_data:
            extraction_results['structured_elements'] = await self._extract_structured_elements(structured_data)
        
        # Generate metadata
        extraction_results['metadata'] = {
            'text_length': len(text_data) if text_data else 0,
            'structured_elements_count': len(structured_data) if structured_data else 0,
            'entities_found': sum(len(entities) for entities in extraction_results['entities'].values() if isinstance(entities, list)),
            'patterns_detected': len(extraction_results['patterns']),
            'extraction_confidence': await self._calculate_extraction_confidence(extraction_results)
        }
        
        return extraction_results
    
    async def _process_transform_mode(
        self,
        input_data: Dict[str, Any],
        config: Dict[str, Any],
        llm_service
    ) -> Dict[str, Any]:
        """Transform and normalize data formats"""
        
        transformation_config = config.get('transformation', {})
        target_format = transformation_config.get('target_format', 'normalized')
        include_enrichment = transformation_config.get('include_enrichment', True)
        
        transformation_results = {
            'status': 'success',
            'mode': 'transform',
            'original_data': input_data,
            'transformed_data': {},
            'transformations_applied': [],
            'data_quality_improvements': {}
        }
        
        # Data normalization
        normalized_data = await self._normalize_data(input_data)
        transformation_results['transformed_data']['normalized'] = normalized_data
        transformation_results['transformations_applied'].append('normalization')
        
        # Format conversion
        if target_format != 'original':
            converted_data = await self._convert_format(normalized_data, target_format)
            transformation_results['transformed_data']['converted'] = converted_data
            transformation_results['transformations_applied'].append(f'format_conversion_to_{target_format}')
        
        # Data enrichment
        if include_enrichment:
            enriched_data = await self._enrich_data(
                transformation_results['transformed_data'].get('converted', normalized_data),
                llm_service
            )
            transformation_results['transformed_data']['enriched'] = enriched_data
            transformation_results['transformations_applied'].append('data_enrichment')
        
        # Quality improvements tracking
        transformation_results['data_quality_improvements'] = await self._assess_quality_improvements(
            input_data,
            transformation_results['transformed_data']
        )
        
        return transformation_results
    
    async def _process_analyze_mode(
        self,
        input_data: Dict[str, Any],
        config: Dict[str, Any],
        llm_service
    ) -> Dict[str, Any]:
        """Analyze data patterns and generate insights"""
        
        analysis_config = config.get('analysis', {})
        analysis_depth = analysis_config.get('depth', 'standard')
        include_statistical = analysis_config.get('include_statistical', True)
        
        analysis_results = {
            'status': 'success',
            'mode': 'analyze',
            'statistical_summary': {},
            'patterns_identified': [],
            'insights': [],
            'anomalies': [],
            'recommendations': []
        }
        
        # Statistical analysis
        if include_statistical:
            analysis_results['statistical_summary'] = await self._perform_statistical_analysis(input_data)
        
        # Pattern identification
        patterns = await self._identify_data_patterns(input_data)
        analysis_results['patterns_identified'] = patterns
        
        # Anomaly detection
        anomalies = await self._detect_anomalies(input_data, patterns)
        analysis_results['anomalies'] = anomalies
        
        # Generate insights
        insights = await self._generate_insights(input_data, patterns, analysis_results['statistical_summary'])
        analysis_results['insights'] = insights
        
        # Use LLM for advanced analysis if available
        if llm_service and analysis_depth in ['advanced', 'comprehensive']:
            try:
                llm_insights = await self._llm_data_analysis(input_data, llm_service)
                analysis_results['llm_insights'] = llm_insights
            except Exception as e:
                logger.warning(f"LLM analysis failed: {str(e)}")
        
        # Generate recommendations
        analysis_results['recommendations'] = await self._generate_analysis_recommendations(
            analysis_results,
            anomalies
        )
        
        return analysis_results
    
    async def _process_validate_mode(
        self,
        input_data: Dict[str, Any],
        config: Dict[str, Any],
        llm_service
    ) -> Dict[str, Any]:
        """Validate data quality and consistency"""
        
        validation_config = config.get('validation', {})
        validation_rules = validation_config.get('rules', [])
        quality_thresholds = validation_config.get('quality_thresholds', {})
        
        validation_results = {
            'status': 'success',
            'mode': 'validate',
            'overall_quality_score': 0,
            'quality_metrics': {},
            'validation_errors': [],
            'validation_warnings': [],
            'data_completeness': {},
            'consistency_checks': {},
            'recommendations': []
        }
        
        # Quality metrics assessment
        quality_metrics = await self._assess_quality_metrics(input_data)
        validation_results['quality_metrics'] = quality_metrics
        
        # Calculate overall quality score
        validation_results['overall_quality_score'] = await self._calculate_overall_quality_score(quality_metrics)
        
        # Data completeness analysis
        validation_results['data_completeness'] = await self._analyze_data_completeness(input_data)
        
        # Consistency checks
        validation_results['consistency_checks'] = await self._perform_consistency_checks(input_data)
        
        # Custom validation rules
        if validation_rules:
            rule_results = await self._apply_validation_rules(input_data, validation_rules)
            validation_results['validation_errors'].extend(rule_results.get('errors', []))
            validation_results['validation_warnings'].extend(rule_results.get('warnings', []))
        
        # Quality threshold checks
        threshold_violations = await self._check_quality_thresholds(quality_metrics, quality_thresholds)
        if threshold_violations:
            validation_results['validation_warnings'].extend(threshold_violations)
        
        # Generate validation recommendations
        validation_results['recommendations'] = await self._generate_validation_recommendations(
            validation_results
        )
        
        return validation_results
    
    def _extract_text_from_input(self, input_data: Dict[str, Any]) -> str:
        """Extract text content from various input formats"""
        text_content = []
        
        # Direct text fields
        for field in ['text', 'content', 'message', 'description', 'body']:
            if field in input_data and isinstance(input_data[field], str):
                text_content.append(input_data[field])
        
        # Extract text from nested structures
        def extract_text_recursive(obj):
            if isinstance(obj, str):
                text_content.append(obj)
            elif isinstance(obj, dict):
                for value in obj.values():
                    extract_text_recursive(value)
            elif isinstance(obj, list):
                for item in obj:
                    extract_text_recursive(item)
        
        # Look for text in nested data
        for key, value in input_data.items():
            if key not in ['text', 'content', 'message', 'description', 'body']:
                if isinstance(value, (dict, list)):
                    extract_text_recursive(value)
        
        return ' '.join(text_content)
    
    def _extract_structured_from_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data elements"""
        structured = {}
        
        for key, value in input_data.items():
            if key not in ['text', 'content', 'message', 'description', 'body']:
                if isinstance(value, (dict, list, int, float)):
                    structured[key] = value
        
        return structured
    
    async def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities using regex patterns"""
        entities = {}
        
        for entity_type, pattern in self.extraction_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Flatten tuples (from phone number capturing groups)
                if entity_type == 'phone' and matches and isinstance(matches[0], tuple):
                    matches = ['-'.join(match) for match in matches]
                entities[entity_type] = list(set(matches))  # Remove duplicates
        
        return entities
    
    async def _detect_text_patterns(self, text: str) -> Dict[str, Any]:
        """Detect patterns in text content"""
        patterns = {}
        
        # Basic text statistics
        patterns['character_count'] = len(text)
        patterns['word_count'] = len(text.split())
        patterns['sentence_count'] = len([s for s in text.split('.') if s.strip()])
        patterns['paragraph_count'] = len([p for p in text.split('\n\n') if p.strip()])
        
        # Language patterns
        patterns['avg_word_length'] = sum(len(word) for word in text.split()) / len(text.split()) if text.split() else 0
        patterns['capitalized_words'] = len([word for word in text.split() if word and word[0].isupper()])
        patterns['numeric_tokens'] = len(re.findall(r'\d+', text))
        
        # Content patterns
        patterns['has_questions'] = '?' in text
        patterns['has_exclamations'] = '!' in text
        patterns['has_urls'] = bool(re.search(self.extraction_patterns['url'], text))
        patterns['has_emails'] = bool(re.search(self.extraction_patterns['email'], text))
        
        return patterns
    
    async def _extract_structured_elements(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and analyze structured data elements"""
        elements = {}
        
        def analyze_structure(obj, path="root"):
            if isinstance(obj, dict):
                elements[path] = {
                    'type': 'object',
                    'key_count': len(obj),
                    'keys': list(obj.keys()),
                    'nested_objects': sum(1 for v in obj.values() if isinstance(v, dict)),
                    'arrays': sum(1 for v in obj.values() if isinstance(v, list))
                }
                for key, value in obj.items():
                    analyze_structure(value, f"{path}.{key}")
            elif isinstance(obj, list):
                elements[path] = {
                    'type': 'array',
                    'length': len(obj),
                    'item_types': list(set(type(item).__name__ for item in obj)),
                    'is_homogeneous': len(set(type(item).__name__ for item in obj)) == 1
                }
                if obj and isinstance(obj[0], (dict, list)):
                    analyze_structure(obj[0], f"{path}[0]")
            else:
                elements[path] = {
                    'type': type(obj).__name__,
                    'value': str(obj)[:100]  # Truncate long values
                }
        
        analyze_structure(data)
        return elements
    
    async def _llm_entity_extraction(self, text: str, llm_service) -> Dict[str, Any]:
        """Use LLM for advanced entity extraction"""
        prompt = f"""Analyze the following text and extract entities:

Text: {text[:1000]}...

Please identify and extract:
1. Named entities (people, organizations, locations)
2. Key concepts and topics
3. Important dates and numbers
4. Technical terms or domain-specific language

Format your response as structured data."""
        
        try:
            response = await llm_service.generate_completion(
                prompt=prompt,
                temperature=0.1,
                max_tokens=500
            )
            
            if response and isinstance(response, dict) and 'text' in response:
                return {
                    'llm_extracted_entities': response['text'],
                    'extraction_confidence': 0.8,
                    'model_used': 'llm_service'
                }
        except Exception as e:
            logger.error(f"LLM entity extraction error: {str(e)}")
        
        return {'error': 'LLM entity extraction failed'}
    
    async def _calculate_extraction_confidence(self, extraction_results: Dict[str, Any]) -> float:
        """Calculate confidence score for extraction results"""
        confidence_factors = []
        
        # Entity extraction confidence
        total_entities = sum(len(entities) for entities in extraction_results['entities'].values() 
                           if isinstance(entities, list))
        if total_entities > 0:
            confidence_factors.append(min(0.9, total_entities / 10))  # Max 0.9 for many entities
        
        # Pattern detection confidence
        pattern_count = len(extraction_results['patterns'])
        if pattern_count > 0:
            confidence_factors.append(min(0.8, pattern_count / 15))  # Max 0.8 for many patterns
        
        # LLM extraction confidence
        if 'llm_extracted' in extraction_results['entities']:
            confidence_factors.append(0.85)  # LLM adds high confidence
        
        return round(sum(confidence_factors) / len(confidence_factors), 3) if confidence_factors else 0.5
    
    async def _normalize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize data formats and structures"""
        normalized = {}
        
        def normalize_value(value):
            if isinstance(value, str):
                # String normalization
                return value.strip().lower() if len(value) < 100 else value.strip()
            elif isinstance(value, dict):
                # Recursive normalization for dictionaries
                return {k: normalize_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                # Normalize list items
                return [normalize_value(item) for item in value]
            else:
                # Return numbers, booleans, etc. as-is
                return value
        
        for key, value in data.items():
            # Normalize keys (lowercase, underscores)
            normalized_key = re.sub(r'[^a-zA-Z0-9_]', '_', key.lower())
            normalized[normalized_key] = normalize_value(value)
        
        return normalized
    
    async def _convert_format(self, data: Dict[str, Any], target_format: str) -> Dict[str, Any]:
        """Convert data to target format"""
        if target_format == 'flat':
            # Flatten nested structures
            return self._flatten_dict(data)
        elif target_format == 'camelCase':
            # Convert keys to camelCase
            return self._convert_keys_to_camel_case(data)
        elif target_format == 'snake_case':
            # Convert keys to snake_case
            return self._convert_keys_to_snake_case(data)
        else:
            return data  # Return original if format not supported
    
    def _flatten_dict(self, data: Dict[str, Any], parent_key: str = '', sep: str = '_') -> Dict[str, Any]:
        """Flatten nested dictionary"""
        items = []
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)
    
    def _convert_keys_to_camel_case(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert dictionary keys to camelCase"""
        def to_camel_case(snake_str):
            components = snake_str.split('_')
            return components[0] + ''.join(x.title() for x in components[1:])
        
        if isinstance(data, dict):
            return {to_camel_case(k): self._convert_keys_to_camel_case(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_keys_to_camel_case(item) for item in data]
        else:
            return data
    
    def _convert_keys_to_snake_case(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert dictionary keys to snake_case"""
        def to_snake_case(camel_str):
            s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', camel_str)
            return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
        
        if isinstance(data, dict):
            return {to_snake_case(k): self._convert_keys_to_snake_case(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_keys_to_snake_case(item) for item in data]
        else:
            return data
    
    async def _enrich_data(self, data: Dict[str, Any], llm_service) -> Dict[str, Any]:
        """Enrich data with additional metadata and derived fields"""
        enriched = data.copy()
        
        # Add metadata
        enriched['_metadata'] = {
            'processed_at': datetime.utcnow().isoformat(),
            'processor_version': self._version,
            'enrichment_applied': True,
            'data_hash': hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
        }
        
        # Generate derived fields
        if 'created_at' in data or 'timestamp' in data:
            timestamp_field = data.get('created_at') or data.get('timestamp')
            if timestamp_field:
                try:
                    dt = datetime.fromisoformat(timestamp_field.replace('Z', '+00:00'))
                    enriched['_derived'] = {
                        'day_of_week': dt.strftime('%A'),
                        'hour_of_day': dt.hour,
                        'is_weekend': dt.weekday() >= 5,
                        'age_days': (datetime.utcnow() - dt.replace(tzinfo=None)).days
                    }
                except ValueError:
                    pass
        
        # Add data quality indicators
        enriched['_quality'] = {
            'completeness_score': self._calculate_completeness(data),
            'field_count': len(data),
            'nested_depth': self._calculate_depth(data),
            'has_nulls': self._has_null_values(data)
        }
        
        return enriched
    
    def _calculate_completeness(self, data: Dict[str, Any]) -> float:
        """Calculate data completeness score"""
        total_fields = 0
        non_null_fields = 0
        
        def count_fields(obj):
            nonlocal total_fields, non_null_fields
            if isinstance(obj, dict):
                for value in obj.values():
                    total_fields += 1
                    if value is not None and value != '':
                        non_null_fields += 1
                    if isinstance(value, (dict, list)):
                        count_fields(value)
            elif isinstance(obj, list):
                for item in obj:
                    count_fields(item)
        
        count_fields(data)
        return round(non_null_fields / total_fields, 3) if total_fields > 0 else 1.0
    
    def _calculate_depth(self, data: Dict[str, Any]) -> int:
        """Calculate maximum nesting depth"""
        if isinstance(data, dict):
            return 1 + (max(map(self._calculate_depth, data.values())) if data else 0)
        elif isinstance(data, list):
            return 1 + (max(map(self._calculate_depth, data)) if data else 0)
        else:
            return 0
    
    def _has_null_values(self, data: Dict[str, Any]) -> bool:
        """Check if data contains null values"""
        def check_nulls(obj):
            if obj is None or obj == '':
                return True
            elif isinstance(obj, dict):
                return any(check_nulls(v) for v in obj.values())
            elif isinstance(obj, list):
                return any(check_nulls(item) for item in obj)
            return False
        
        return check_nulls(data)
    
    async def _assess_quality_improvements(self, original: Dict[str, Any], transformed: Dict[str, Any]) -> Dict[str, Any]:
        """Assess quality improvements from transformation"""
        improvements = {}
        
        # Compare completeness
        orig_completeness = self._calculate_completeness(original)
        trans_completeness = self._calculate_completeness(transformed.get('enriched', transformed.get('normalized', {})))
        improvements['completeness_improvement'] = round(trans_completeness - orig_completeness, 3)
        
        # Compare structure consistency
        orig_depth = self._calculate_depth(original)
        trans_depth = self._calculate_depth(transformed.get('normalized', {}))
        improvements['structure_normalization'] = orig_depth != trans_depth
        
        # Track transformations applied
        improvements['transformations_count'] = len([k for k in transformed.keys() if k != 'original_data'])
        
        return improvements
    
    async def _perform_statistical_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform statistical analysis on data"""
        stats = {}
        
        # Collect numeric values
        numeric_values = []
        def collect_numbers(obj):
            if isinstance(obj, (int, float)):
                numeric_values.append(obj)
            elif isinstance(obj, dict):
                for value in obj.values():
                    collect_numbers(value)
            elif isinstance(obj, list):
                for item in obj:
                    collect_numbers(item)
        
        collect_numbers(data)
        
        if numeric_values:
            import statistics
            stats['numeric_analysis'] = {
                'count': len(numeric_values),
                'mean': round(statistics.mean(numeric_values), 3),
                'median': round(statistics.median(numeric_values), 3),
                'std_dev': round(statistics.stdev(numeric_values), 3) if len(numeric_values) > 1 else 0,
                'min': min(numeric_values),
                'max': max(numeric_values),
                'range': max(numeric_values) - min(numeric_values)
            }
        
        # Analyze text fields
        text_lengths = []
        def collect_text_lengths(obj):
            if isinstance(obj, str):
                text_lengths.append(len(obj))
            elif isinstance(obj, dict):
                for value in obj.values():
                    collect_text_lengths(value)
            elif isinstance(obj, list):
                for item in obj:
                    collect_text_lengths(item)
        
        collect_text_lengths(data)
        
        if text_lengths:
            stats['text_analysis'] = {
                'total_text_fields': len(text_lengths),
                'avg_text_length': round(sum(text_lengths) / len(text_lengths), 1),
                'min_text_length': min(text_lengths),
                'max_text_length': max(text_lengths),
                'total_characters': sum(text_lengths)
            }
        
        return stats
    
    async def _identify_data_patterns(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify patterns in data structure and content"""
        patterns = []
        
        # Structural patterns
        if isinstance(data, dict):
            patterns.append({
                'type': 'structure',
                'pattern': 'key_value_pairs',
                'description': f'Dictionary with {len(data)} key-value pairs',
                'confidence': 1.0
            })
            
            # Check for common field patterns
            keys = list(data.keys())
            if any('id' in key.lower() for key in keys):
                patterns.append({
                    'type': 'identifier',
                    'pattern': 'contains_id_fields',
                    'description': 'Data contains identifier fields',
                    'confidence': 0.9
                })
            
            if any('time' in key.lower() or 'date' in key.lower() for key in keys):
                patterns.append({
                    'type': 'temporal',
                    'pattern': 'contains_temporal_data',
                    'description': 'Data contains time/date information',
                    'confidence': 0.8
                })
        
        return patterns
    
    async def _detect_anomalies(self, data: Dict[str, Any], patterns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalies in data"""
        anomalies = []
        
        # Detect null value anomalies
        null_count = self._count_null_values(data)
        if null_count > 0:
            anomalies.append({
                'type': 'data_quality',
                'anomaly': 'null_values_present',
                'description': f'Found {null_count} null or empty values',
                'severity': 'medium' if null_count < 5 else 'high'
            })
        
        # Detect type inconsistencies
        type_inconsistencies = self._detect_type_inconsistencies(data)
        if type_inconsistencies:
            anomalies.append({
                'type': 'type_consistency',
                'anomaly': 'mixed_types',
                'description': f'Inconsistent data types detected: {type_inconsistencies}',
                'severity': 'medium'
            })
        
        return anomalies
    
    def _count_null_values(self, data: Dict[str, Any]) -> int:
        """Count null, None, and empty string values"""
        count = 0
        def count_nulls(obj):
            nonlocal count
            if obj is None or obj == '':
                count += 1
            elif isinstance(obj, dict):
                for value in obj.values():
                    count_nulls(value)
            elif isinstance(obj, list):
                for item in obj:
                    count_nulls(item)
        
        count_nulls(data)
        return count
    
    def _detect_type_inconsistencies(self, data: Dict[str, Any]) -> List[str]:
        """Detect fields with inconsistent data types"""
        # This is a simplified implementation
        # In practice, you'd analyze arrays and repeated structures
        inconsistencies = []
        
        # Check for mixed types in arrays
        def check_array_consistency(obj, path=""):
            if isinstance(obj, list) and len(obj) > 1:
                types = set(type(item).__name__ for item in obj)
                if len(types) > 1:
                    inconsistencies.append(f"Array at {path} contains mixed types: {list(types)}")
            elif isinstance(obj, dict):
                for key, value in obj.items():
                    check_array_consistency(value, f"{path}.{key}" if path else key)
        
        check_array_consistency(data)
        return inconsistencies
    
    async def _generate_insights(self, data: Dict[str, Any], patterns: List[Dict[str, Any]], stats: Dict[str, Any]) -> List[str]:
        """Generate insights from data analysis"""
        insights = []
        
        # Data structure insights
        if isinstance(data, dict):
            field_count = len(data)
            if field_count > 20:
                insights.append(f"Complex data structure with {field_count} fields - consider normalization")
            elif field_count < 5:
                insights.append("Simple data structure - well-suited for basic processing")
        
        # Statistical insights
        numeric_analysis = stats.get('numeric_analysis', {})
        if numeric_analysis:
            mean_val = numeric_analysis.get('mean', 0)
            std_dev = numeric_analysis.get('std_dev', 0)
            if std_dev > mean_val * 0.5:
                insights.append("High variability in numeric data detected")
        
        # Pattern-based insights
        for pattern in patterns:
            if pattern['type'] == 'temporal':
                insights.append("Temporal data present - consider time-series analysis")
            elif pattern['type'] == 'identifier':
                insights.append("Identifier fields detected - good for data linkage")
        
        return insights[:5]  # Return top 5 insights
    
    async def _llm_data_analysis(self, data: Dict[str, Any], llm_service) -> Dict[str, Any]:
        """Use LLM for advanced data analysis"""
        # Prepare data summary for LLM
        data_summary = {
            'field_count': len(data) if isinstance(data, dict) else 1,
            'data_types': list(set(type(v).__name__ for v in data.values())) if isinstance(data, dict) else [type(data).__name__],
            'sample_fields': list(data.keys())[:5] if isinstance(data, dict) else []
        }
        
        prompt = f"""Analyze this data structure and provide insights:

Data Summary: {json.dumps(data_summary, indent=2)}

Sample Data: {json.dumps(dict(list(data.items())[:3]) if isinstance(data, dict) else data, indent=2)}

Please provide:
1. Key insights about the data structure
2. Potential data quality issues
3. Recommendations for processing
4. Suggested improvements"""
        
        try:
            response = await llm_service.generate_completion(
                prompt=prompt,
                temperature=0.3,
                max_tokens=600
            )
            
            if response and isinstance(response, dict) and 'text' in response:
                return {
                    'llm_insights': response['text'],
                    'analysis_confidence': 0.85,
                    'model_used': 'llm_service'
                }
        except Exception as e:
            logger.error(f"LLM analysis error: {str(e)}")
        
        return {'error': 'LLM analysis failed'}
    
    async def _generate_analysis_recommendations(self, analysis_results: Dict[str, Any], anomalies: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on analysis results"""
        recommendations = []
        
        # Anomaly-based recommendations
        for anomaly in anomalies:
            if anomaly['type'] == 'data_quality':
                recommendations.append("Implement data validation and cleansing processes")
            elif anomaly['type'] == 'type_consistency':
                recommendations.append("Standardize data types and formats")
        
        # Statistical recommendations
        stats = analysis_results.get('statistical_summary', {})
        if stats.get('numeric_analysis', {}).get('std_dev', 0) > 100:
            recommendations.append("Consider data normalization for high variance numeric fields")
        
        # Pattern-based recommendations
        patterns = analysis_results.get('patterns_identified', [])
        if any(p['type'] == 'temporal' for p in patterns):
            recommendations.append("Implement time-series analysis for temporal data")
        
        return recommendations[:5]  # Return top 5 recommendations
    
    async def _assess_quality_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess data quality across multiple dimensions"""
        metrics = {}
        
        # Completeness
        metrics['completeness'] = {
            'score': self._calculate_completeness(data),
            'description': 'Percentage of non-null values'
        }
        
        # Consistency (simplified - check for consistent naming)
        consistency_score = self._assess_naming_consistency(data)
        metrics['consistency'] = {
            'score': consistency_score,
            'description': 'Consistency in field naming and structure'
        }
        
        # Validity (basic format checks)
        validity_score = self._assess_data_validity(data)
        metrics['validity'] = {
            'score': validity_score,
            'description': 'Data conforms to expected formats'
        }
        
        return metrics
    
    def _assess_naming_consistency(self, data: Dict[str, Any]) -> float:
        """Assess consistency in field naming conventions"""
        if not isinstance(data, dict):
            return 1.0
        
        keys = list(data.keys())
        if not keys:
            return 1.0
        
        # Check for consistent naming convention
        snake_case_count = sum(1 for k in keys if '_' in k and k.islower())
        camel_case_count = sum(1 for k in keys if any(c.isupper() for c in k[1:]) and '_' not in k)
        
        total_keys = len(keys)
        consistency_ratio = max(snake_case_count, camel_case_count) / total_keys
        
        return round(consistency_ratio, 3)
    
    def _assess_data_validity(self, data: Dict[str, Any]) -> float:
        """Assess basic data validity"""
        valid_count = 0
        total_count = 0
        
        def check_validity(obj):
            nonlocal valid_count, total_count
            total_count += 1
            
            if isinstance(obj, str):
                # Basic string validity (not empty, reasonable length)
                if obj.strip() and len(obj) < 10000:
                    valid_count += 1
            elif isinstance(obj, (int, float)):
                # Numeric validity (not infinite, not NaN)
                if not (obj == float('inf') or obj != obj):  # NaN check
                    valid_count += 1
            elif isinstance(obj, (dict, list)):
                # Complex types are considered valid if not empty
                if obj:
                    valid_count += 1
                # Recursively check nested objects
                if isinstance(obj, dict):
                    for value in obj.values():
                        check_validity(value)
                elif isinstance(obj, list):
                    for item in obj:
                        check_validity(item)
            else:
                # Other types (bool, None) considered valid
                valid_count += 1
        
        check_validity(data)
        return round(valid_count / total_count, 3) if total_count > 0 else 1.0
    
    async def _calculate_overall_quality_score(self, quality_metrics: Dict[str, Any]) -> float:
        """Calculate overall quality score from individual metrics"""
        scores = [metric['score'] for metric in quality_metrics.values() if isinstance(metric, dict) and 'score' in metric]
        return round(sum(scores) / len(scores), 3) if scores else 0.0
    
    async def _analyze_data_completeness(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze data completeness in detail"""
        completeness = {}
        
        if isinstance(data, dict):
            for key, value in data.items():
                if value is None or value == '':
                    completeness[key] = 0.0
                elif isinstance(value, (dict, list)):
                    # For complex types, calculate nested completeness
                    nested_completeness = self._calculate_completeness(value)
                    completeness[key] = nested_completeness
                else:
                    completeness[key] = 1.0
        
        return completeness
    
    async def _perform_consistency_checks(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform consistency checks on data"""
        checks = {}
        
        # Type consistency
        checks['type_consistency'] = len(self._detect_type_inconsistencies(data)) == 0
        
        # Naming consistency
        checks['naming_consistency'] = self._assess_naming_consistency(data) > 0.8
        
        # Format consistency (simplified)
        checks['format_consistency'] = True  # Placeholder for more complex format checks
        
        return checks
    
    async def _apply_validation_rules(self, data: Dict[str, Any], rules: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Apply custom validation rules"""
        results = {'errors': [], 'warnings': []}
        
        for rule in rules:
            rule_type = rule.get('type', 'unknown')
            field = rule.get('field')
            condition = rule.get('condition')
            message = rule.get('message', f'Validation rule failed for {field}')
            
            # Simple rule evaluation (would be more sophisticated in production)
            if rule_type == 'required' and field:
                if field not in data or data[field] is None or data[field] == '':
                    results['errors'].append(f"Required field '{field}' is missing or empty")
            elif rule_type == 'format' and field and 'pattern' in rule:
                if field in data and isinstance(data[field], str):
                    pattern = rule['pattern']
                    if not re.match(pattern, data[field]):
                        results['warnings'].append(f"Field '{field}' does not match expected format")
        
        return results
    
    async def _check_quality_thresholds(self, quality_metrics: Dict[str, Any], thresholds: Dict[str, float]) -> List[str]:
        """Check if quality metrics meet defined thresholds"""
        violations = []
        
        for metric_name, threshold in thresholds.items():
            if metric_name in quality_metrics:
                metric_data = quality_metrics[metric_name]
                if isinstance(metric_data, dict) and 'score' in metric_data:
                    if metric_data['score'] < threshold:
                        violations.append(f"{metric_name} score ({metric_data['score']}) below threshold ({threshold})")
        
        return violations
    
    async def _generate_validation_recommendations(self, validation_results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []
        
        # Quality score recommendations
        overall_score = validation_results.get('overall_quality_score', 0)
        if overall_score < 0.7:
            recommendations.append("Overall data quality is below acceptable levels - implement comprehensive data cleansing")
        
        # Error-based recommendations
        if validation_results.get('validation_errors'):
            recommendations.append("Address validation errors before processing")
        
        # Warning-based recommendations
        if validation_results.get('validation_warnings'):
            recommendations.append("Review and resolve validation warnings for improved data quality")
        
        # Completeness recommendations
        completeness_issues = [k for k, v in validation_results.get('data_completeness', {}).items() if v < 0.8]
        if completeness_issues:
            recommendations.append(f"Improve completeness for fields: {', '.join(completeness_issues[:3])}")
        
        return recommendations[:5]  # Return top 5 recommendations


# Export the agent class
__all__ = ["DataProcessorAgent"]