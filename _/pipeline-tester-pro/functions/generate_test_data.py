"""
Generate Test Data Function

Creates synthetic test data for pipeline testing with configurable complexity,
data types, and reproducible seeding for consistent test scenarios.
"""

import json
import logging
import random
import string
from typing import Dict, Any, List
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class TestDataGenerator:
    """
    Generates synthetic test data for comprehensive pipeline testing.
    
    Supports multiple data types with configurable complexity levels
    and reproducible seeding for consistent test results.
    """
    
    def __init__(self):
        self.function_id = "generateTestData"
        self.version = "1.0.0"
        
        # Data generation templates
        self.templates = {
            'user_messages': {
                'simple': [
                    "Hello", "How are you?", "Thank you", "Goodbye",
                    "Yes", "No", "Maybe", "I don't know"
                ],
                'medium': [
                    "Can you help me with my account?",
                    "I'm having trouble logging in",
                    "What are your business hours?",
                    "How do I reset my password?",
                    "I need to update my billing information",
                    "Can you explain how this feature works?"
                ],
                'complex': [
                    "I've been experiencing intermittent connectivity issues with your service over the past week, particularly during peak hours between 2-4 PM EST. The error messages I'm receiving suggest a timeout, but I'm not sure if this is related to my local network configuration or your servers.",
                    "I'm trying to integrate your API into our existing workflow management system, but I'm encountering authentication errors when using OAuth 2.0. I've followed the documentation step by step, but the token refresh mechanism doesn't seem to be working as expected.",
                    "Our team is evaluating your platform for a large-scale deployment that would involve processing approximately 50,000 transactions per day. We need to understand the scalability characteristics, particularly around data ingestion rates and real-time processing capabilities."
                ]
            },
            'json_objects': {
                'simple': ['user_profile', 'product_info', 'order_summary'],
                'medium': ['transaction_record', 'user_activity', 'system_metrics'],
                'complex': ['analytics_dashboard', 'ml_model_results', 'enterprise_config']
            },
            'text_samples': {
                'simple': ['short phrases', 'basic sentences', 'simple descriptions'],
                'medium': ['paragraph content', 'article excerpts', 'documentation'],
                'complex': ['technical specifications', 'legal documents', 'research papers']
            },
            'numeric_data': {
                'simple': {'range': (1, 100), 'precision': 0},
                'medium': {'range': (1, 10000), 'precision': 2},
                'complex': {'range': (1, 1000000), 'precision': 6}
            }
        }
        
        # Sample names and entities for realistic data
        self.sample_data = {
            'first_names': ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn'],
            'last_names': ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'],
            'companies': ['TechCorp', 'DataSys', 'CloudFlow', 'InnovateLab', 'StreamTech', 'ProcessHub'],
            'products': ['Dashboard Pro', 'Analytics Suite', 'Data Pipeline', 'ML Platform', 'API Gateway'],
            'cities': ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Boston', 'Denver'],
            'domains': ['@company.com', '@techcorp.io', '@startup.co', '@enterprise.net']
        }
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main execution function for generating test data.
        
        Args:
            input_data: Generation parameters and configuration
            context: Pipeline execution context
            
        Returns:
            Generated test data with metadata
        """
        try:
            # Extract parameters
            data_type = input_data.get('data_type', 'user_messages')
            count = input_data.get('count', 10)
            complexity = input_data.get('complexity', 'medium')
            seed = input_data.get('seed')
            
            # Validation
            if count < 1 or count > 1000:
                raise ValueError("Count must be between 1 and 1000")
            
            if data_type not in self.templates:
                raise ValueError(f"Unsupported data type: {data_type}")
            
            if complexity not in ['simple', 'medium', 'complex']:
                raise ValueError("Complexity must be 'simple', 'medium', or 'complex'")
            
            logger.info(f"Generating {count} {data_type} items with {complexity} complexity")
            
            # Set random seed for reproducibility
            if seed is not None:
                random.seed(seed)
            
            # Generate data based on type
            generated_data = await self._generate_data(data_type, count, complexity)
            
            # Generate metadata
            metadata = {
                'generation_timestamp': datetime.utcnow().isoformat(),
                'data_type': data_type,
                'count_requested': count,
                'count_generated': len(generated_data),
                'complexity': complexity,
                'seed_used': seed,
                'generator_version': self.version,
                'generation_stats': await self._calculate_stats(generated_data, data_type)
            }
            
            result = {
                'output': {
                    'generated_data': generated_data,
                    'metadata': metadata,
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat()
                    }
                },
                'status': 'completed'
            }
            
            logger.info(f"Generated {len(generated_data)} items successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error generating test data: {str(e)}", exc_info=True)
            return {
                'output': {
                    'generated_data': [],
                    'error': str(e),
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat(),
                        'error_occurred': True
                    }
                },
                'status': 'failed',
                'error': str(e)
            }
    
    async def _generate_data(self, data_type: str, count: int, complexity: str) -> List[Any]:
        """Generate data based on type and complexity"""
        
        if data_type == 'user_messages':
            return await self._generate_user_messages(count, complexity)
        elif data_type == 'json_objects':
            return await self._generate_json_objects(count, complexity)
        elif data_type == 'text_samples':
            return await self._generate_text_samples(count, complexity)
        elif data_type == 'numeric_data':
            return await self._generate_numeric_data(count, complexity)
        else:
            raise ValueError(f"Unsupported data type: {data_type}")
    
    async def _generate_user_messages(self, count: int, complexity: str) -> List[str]:
        """Generate realistic user messages"""
        
        base_messages = self.templates['user_messages'][complexity]
        generated = []
        
        for i in range(count):
            if complexity == 'simple':
                # Simple messages, mostly from templates
                message = random.choice(base_messages)
                
            elif complexity == 'medium':
                # Medium complexity with variations
                if random.random() < 0.7:
                    message = random.choice(base_messages)
                else:
                    # Generate variations
                    templates = [
                        f"I need help with {random.choice(['my account', 'billing', 'setup', 'configuration'])}",
                        f"Can you tell me about {random.choice(['pricing', 'features', 'support', 'integration'])}?",
                        f"I'm having issues with {random.choice(['login', 'payment', 'upload', 'download'])}",
                    ]
                    message = random.choice(templates)
                    
            else:  # complex
                # Complex messages with realistic scenarios
                if random.random() < 0.5:
                    message = random.choice(base_messages)
                else:
                    # Generate complex scenarios
                    scenarios = [
                        f"I'm implementing a {random.choice(['microservices', 'data pipeline', 'ML workflow'])} architecture and need guidance on {random.choice(['scaling', 'security', 'monitoring', 'optimization'])}. My current setup involves {random.choice(['Kubernetes', 'Docker', 'AWS', 'Azure'])} and I'm processing approximately {random.randint(1000, 100000)} requests per hour.",
                        f"Our enterprise deployment requires {random.choice(['SSO integration', 'LDAP authentication', 'role-based access', 'audit logging'])} and we need to ensure compliance with {random.choice(['GDPR', 'HIPAA', 'SOX', 'PCI-DSS'])}. The system will serve {random.randint(100, 10000)} concurrent users across {random.randint(3, 20)} geographical regions.",
                        f"I'm experiencing performance bottlenecks in our {random.choice(['data processing', 'API gateway', 'analytics engine', 'search system'])} component. The latency has increased from {random.randint(10, 100)}ms to {random.randint(200, 2000)}ms over the past {random.randint(1, 30)} days, particularly during {random.choice(['peak hours', 'batch processing', 'data ingestion', 'report generation'])}."
                    ]
                    message = random.choice(scenarios)
            
            generated.append(message)
        
        return generated
    
    async def _generate_json_objects(self, count: int, complexity: str) -> List[Dict[str, Any]]:
        """Generate realistic JSON objects"""
        
        generated = []
        
        for i in range(count):
            if complexity == 'simple':
                obj = await self._create_simple_json()
            elif complexity == 'medium':
                obj = await self._create_medium_json()
            else:  # complex
                obj = await self._create_complex_json()
            
            generated.append(obj)
        
        return generated
    
    async def _create_simple_json(self) -> Dict[str, Any]:
        """Create simple JSON object"""
        return {
            'id': str(uuid.uuid4()),
            'name': f"{random.choice(self.sample_data['first_names'])} {random.choice(self.sample_data['last_names'])}",
            'email': f"{random.choice(self.sample_data['first_names']).lower()}{random.choice(self.sample_data['domains'])}",
            'status': random.choice(['active', 'inactive', 'pending']),
            'created_at': (datetime.utcnow() - timedelta(days=random.randint(1, 365))).isoformat()
        }
    
    async def _create_medium_json(self) -> Dict[str, Any]:
        """Create medium complexity JSON object"""
        return {
            'user_id': str(uuid.uuid4()),
            'profile': {
                'first_name': random.choice(self.sample_data['first_names']),
                'last_name': random.choice(self.sample_data['last_names']),
                'email': f"{random.choice(self.sample_data['first_names']).lower()}{random.choice(self.sample_data['domains'])}",
                'phone': f"+1-{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                'location': {
                    'city': random.choice(self.sample_data['cities']),
                    'timezone': random.choice(['UTC-8', 'UTC-5', 'UTC-3', 'UTC+0', 'UTC+1'])
                }
            },
            'account': {
                'type': random.choice(['free', 'premium', 'enterprise']),
                'status': random.choice(['active', 'suspended', 'trial']),
                'created_at': (datetime.utcnow() - timedelta(days=random.randint(1, 1000))).isoformat(),
                'last_login': (datetime.utcnow() - timedelta(hours=random.randint(1, 720))).isoformat()
            },
            'preferences': {
                'notifications': random.choice([True, False]),
                'theme': random.choice(['light', 'dark', 'auto']),
                'language': random.choice(['en', 'es', 'fr', 'de', 'ja'])
            },
            'metrics': {
                'login_count': random.randint(1, 500),
                'data_usage_mb': random.randint(10, 10000),
                'api_calls': random.randint(0, 50000)
            }
        }
    
    async def _create_complex_json(self) -> Dict[str, Any]:
        """Create complex JSON object"""
        return {
            'organization': {
                'id': str(uuid.uuid4()),
                'name': random.choice(self.sample_data['companies']),
                'type': random.choice(['startup', 'enterprise', 'government', 'non-profit']),
                'industry': random.choice(['technology', 'healthcare', 'finance', 'education', 'retail']),
                'employees': random.randint(10, 100000),
                'founded': random.randint(1990, 2023),
                'headquarters': {
                    'city': random.choice(self.sample_data['cities']),
                    'country': 'US',
                    'timezone': random.choice(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'])
                }
            },
            'deployment': {
                'environment': random.choice(['production', 'staging', 'development']),
                'region': random.choice(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']),
                'instance_type': random.choice(['t3.micro', 't3.small', 'm5.large', 'c5.xlarge']),
                'auto_scaling': {
                    'enabled': random.choice([True, False]),
                    'min_instances': random.randint(1, 5),
                    'max_instances': random.randint(10, 100),
                    'target_cpu': random.randint(50, 80)
                }
            },
            'configuration': {
                'features': {
                    'advanced_analytics': random.choice([True, False]),
                    'real_time_processing': random.choice([True, False]),
                    'ml_predictions': random.choice([True, False]),
                    'custom_integrations': random.choice([True, False])
                },
                'limits': {
                    'api_rate_limit': random.randint(1000, 100000),
                    'storage_gb': random.randint(100, 10000),
                    'concurrent_users': random.randint(50, 5000),
                    'data_retention_days': random.randint(30, 2555)
                },
                'integrations': [
                    {
                        'name': random.choice(['Salesforce', 'HubSpot', 'Slack', 'Teams', 'Jira']),
                        'type': random.choice(['CRM', 'messaging', 'ticketing', 'analytics']),
                        'enabled': random.choice([True, False]),
                        'config': {
                            'webhook_url': f"https://api.{random.choice(self.sample_data['companies']).lower()}.com/webhook",
                            'auth_method': random.choice(['oauth', 'api_key', 'jwt']),
                            'sync_frequency': random.choice(['real-time', 'hourly', 'daily'])
                        }
                    } for _ in range(random.randint(1, 5))
                ]
            },
            'analytics': {
                'usage_metrics': {
                    'total_requests': random.randint(10000, 10000000),
                    'successful_requests': random.randint(9000, 9900000),
                    'error_rate': round(random.uniform(0.001, 0.1), 4),
                    'avg_response_time_ms': random.randint(50, 2000),
                    'peak_concurrent_users': random.randint(100, 50000)
                },
                'performance_data': [
                    {
                        'timestamp': (datetime.utcnow() - timedelta(hours=i)).isoformat(),
                        'cpu_usage': round(random.uniform(10, 90), 2),
                        'memory_usage': round(random.uniform(20, 85), 2),
                        'disk_io': random.randint(100, 10000),
                        'network_io': random.randint(1000, 100000)
                    } for i in range(24)  # Last 24 hours
                ]
            },
            'security': {
                'compliance': {
                    'certifications': random.sample(['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS'], random.randint(1, 3)),
                    'last_audit': (datetime.utcnow() - timedelta(days=random.randint(30, 365))).isoformat(),
                    'next_audit': (datetime.utcnow() + timedelta(days=random.randint(30, 365))).isoformat()
                },
                'access_control': {
                    'sso_enabled': random.choice([True, False]),
                    'mfa_required': random.choice([True, False]),
                    'session_timeout_minutes': random.randint(30, 480),
                    'password_policy': {
                        'min_length': random.randint(8, 16),
                        'require_special_chars': random.choice([True, False]),
                        'rotation_days': random.randint(30, 180)
                    }
                }
            }
        }
    
    async def _generate_text_samples(self, count: int, complexity: str) -> List[str]:
        """Generate text samples of varying complexity"""
        
        generated = []
        
        for i in range(count):
            if complexity == 'simple':
                # Short phrases and sentences
                templates = [
                    "Quick brown fox jumps over lazy dog",
                    "The weather is nice today",
                    "Please check your email for updates",
                    "System maintenance scheduled for tonight",
                    "Thank you for your feedback"
                ]
                text = random.choice(templates)
                
            elif complexity == 'medium':
                # Paragraph-length content
                templates = [
                    f"Our {random.choice(self.sample_data['products'])} solution provides comprehensive {random.choice(['analytics', 'monitoring', 'automation', 'integration'])} capabilities for modern enterprises. With advanced features and intuitive design, it helps organizations streamline their operations and improve efficiency.",
                    f"The latest update to our platform includes significant improvements to {random.choice(['performance', 'security', 'usability', 'scalability'])}. Users can now enjoy faster processing times, enhanced data protection, and a more streamlined interface.",
                    f"Integration with {random.choice(['third-party', 'enterprise', 'cloud-based', 'legacy'])} systems has never been easier. Our robust API framework supports multiple authentication methods and provides real-time data synchronization across platforms."
                ]
                text = random.choice(templates)
                
            else:  # complex
                # Long-form technical content
                topics = ['microservices architecture', 'machine learning pipelines', 'data governance', 'cloud migration', 'API security']
                topic = random.choice(topics)
                
                text = f"""
                Technical Specification: {topic.title()}
                
                Executive Summary:
                This document outlines the implementation strategy for {topic} within our current infrastructure. The proposed solution addresses key challenges including scalability, security, and maintainability while ensuring minimal disruption to existing operations.
                
                Architecture Overview:
                The recommended approach leverages industry best practices and proven technologies to deliver a robust, enterprise-grade solution. Key components include distributed processing engines, automated deployment pipelines, and comprehensive monitoring systems.
                
                Implementation Phases:
                1. Assessment and Planning ({random.randint(2, 4)} weeks)
                2. Proof of Concept Development ({random.randint(4, 8)} weeks)
                3. Pilot Deployment ({random.randint(6, 12)} weeks)
                4. Full Production Rollout ({random.randint(8, 16)} weeks)
                
                Risk Mitigation:
                Potential risks include data migration challenges, integration complexity, and performance optimization requirements. Mitigation strategies involve comprehensive testing, phased deployment, and robust rollback procedures.
                
                Success Metrics:
                - Performance improvement: {random.randint(20, 80)}%
                - Cost reduction: {random.randint(10, 40)}%
                - System reliability: {random.randint(95, 99)}.{random.randint(0, 9)}%
                """.strip()
            
            generated.append(text)
        
        return generated
    
    async def _generate_numeric_data(self, count: int, complexity: str) -> List[Dict[str, Any]]:
        """Generate numeric datasets"""
        
        config = self.templates['numeric_data'][complexity]
        min_val, max_val = config['range']
        precision = config['precision']
        
        generated = []
        
        for i in range(count):
            if complexity == 'simple':
                # Simple number or basic metrics
                data = {
                    'value': round(random.uniform(min_val, max_val), precision),
                    'timestamp': datetime.utcnow().isoformat(),
                    'unit': random.choice(['count', 'percentage', 'score'])
                }
                
            elif complexity == 'medium':
                # Time series or grouped metrics
                data = {
                    'metrics': {
                        'cpu_usage': round(random.uniform(0, 100), 2),
                        'memory_usage': round(random.uniform(0, 100), 2),
                        'disk_usage': round(random.uniform(0, 100), 2),
                        'network_io': round(random.uniform(0, max_val), precision)
                    },
                    'timestamp': datetime.utcnow().isoformat(),
                    'instance_id': f"i-{random.randint(100000, 999999)}",
                    'region': random.choice(['us-east-1', 'us-west-2', 'eu-west-1'])
                }
                
            else:  # complex
                # Multi-dimensional data with correlations
                base_value = random.uniform(min_val, max_val)
                data = {
                    'dataset': {
                        'primary_metric': round(base_value, precision),
                        'secondary_metrics': [
                            round(base_value * random.uniform(0.8, 1.2), precision) 
                            for _ in range(random.randint(3, 10))
                        ],
                        'statistical_measures': {
                            'mean': round(base_value, precision),
                            'median': round(base_value * random.uniform(0.9, 1.1), precision),
                            'std_dev': round(base_value * random.uniform(0.1, 0.3), precision),
                            'percentiles': {
                                '25th': round(base_value * 0.75, precision),
                                '50th': round(base_value, precision),
                                '75th': round(base_value * 1.25, precision),
                                '95th': round(base_value * 1.5, precision)
                            }
                        }
                    },
                    'metadata': {
                        'sample_size': random.randint(1000, 100000),
                        'collection_period': f"{random.randint(1, 30)} days",
                        'confidence_interval': f"{random.randint(90, 99)}%",
                        'data_quality_score': round(random.uniform(0.8, 1.0), 3)
                    },
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            generated.append(data)
        
        return generated
    
    async def _calculate_stats(self, generated_data: List[Any], data_type: str) -> Dict[str, Any]:
        """Calculate statistics about generated data"""
        
        stats = {
            'total_items': len(generated_data),
            'data_type': data_type,
            'generation_method': 'synthetic'
        }
        
        if data_type == 'user_messages':
            lengths = [len(str(item)) for item in generated_data]
            stats.update({
                'avg_length': round(sum(lengths) / len(lengths), 2) if lengths else 0,
                'min_length': min(lengths) if lengths else 0,
                'max_length': max(lengths) if lengths else 0,
                'total_characters': sum(lengths)
            })
            
        elif data_type == 'json_objects':
            sizes = [len(json.dumps(item)) for item in generated_data]
            stats.update({
                'avg_size_bytes': round(sum(sizes) / len(sizes), 2) if sizes else 0,
                'total_size_bytes': sum(sizes),
                'unique_keys': len(set().union(*(item.keys() if isinstance(item, dict) else [] for item in generated_data)))
            })
            
        elif data_type == 'text_samples':
            word_counts = [len(str(item).split()) for item in generated_data]
            stats.update({
                'avg_word_count': round(sum(word_counts) / len(word_counts), 2) if word_counts else 0,
                'total_words': sum(word_counts),
                'avg_words_per_sentence': round(sum(word_counts) / len(word_counts), 1) if word_counts else 0
            })
            
        elif data_type == 'numeric_data':
            stats.update({
                'contains_arrays': any(isinstance(item, (list, tuple)) for item in generated_data),
                'contains_objects': any(isinstance(item, dict) for item in generated_data),
                'data_structure': 'mixed' if any(isinstance(item, dict) for item in generated_data) else 'simple'
            })
        
        return stats


# Function factory for pipeline system
async def generate_test_data(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pipeline function entry point for test data generation.
    
    Args:
        input_data: Generation parameters
        context: Pipeline execution context
        
    Returns:
        Function execution result with generated data
    """
    generator = TestDataGenerator()
    return await generator.execute(input_data, context)


# Export function metadata
FUNCTION_METADATA = {
    'id': 'generateTestData',
    'name': 'Generate Test Data',
    'description': 'Generates synthetic test data for pipeline testing',
    'version': '1.0.0',
    'input_schema': {
        'type': 'object',
        'properties': {
            'data_type': {
                'type': 'string',
                'enum': ['user_messages', 'json_objects', 'text_samples', 'numeric_data'],
                'description': 'Type of test data to generate'
            },
            'count': {
                'type': 'integer',
                'minimum': 1,
                'maximum': 1000,
                'default': 10,
                'description': 'Number of items to generate'
            },
            'complexity': {
                'type': 'string',
                'enum': ['simple', 'medium', 'complex'],
                'default': 'medium',
                'description': 'Complexity level of generated data'
            },
            'seed': {
                'type': 'integer',
                'description': 'Random seed for reproducible results'
            }
        },
        'required': ['data_type']
    },
    'output_schema': {
        'type': 'object',
        'properties': {
            'generated_data': {
                'type': 'array',
                'description': 'Array of generated test data items'
            },
            'metadata': {
                'type': 'object',
                'description': 'Generation metadata and statistics'
            }
        }
    }
}