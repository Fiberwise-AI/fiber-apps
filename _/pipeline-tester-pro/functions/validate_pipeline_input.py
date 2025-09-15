"""
Pipeline Input Validation Function

Validates input data against pipeline schema requirements and provides
sanitized input data for execution.
"""

import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class PipelineInputValidator:
    """
    Validates pipeline input data against schema requirements.
    """
    
    def __init__(self):
        self.function_id = "validatePipelineInput"
        self.version = "1.0.0"
        
        # Common validation patterns
        self.validation_patterns = {
            'string': {'type': str, 'min_length': 0, 'max_length': 10000},
            'integer': {'type': int, 'min_value': None, 'max_value': None},
            'number': {'type': (int, float), 'min_value': None, 'max_value': None},
            'boolean': {'type': bool},
            'array': {'type': list, 'min_items': 0, 'max_items': 1000},
            'object': {'type': dict}
        }
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main validation function.
        
        Args:
            input_data: Contains pipeline_id, input_data to validate, and validation_mode
            context: Execution context with services
            
        Returns:
            Validation result with errors and sanitized input
        """
        try:
            pipeline_id = input_data.get('pipeline_id')
            data_to_validate = input_data.get('input_data', {})
            validation_mode = input_data.get('validation_mode', 'strict')
            
            logger.info(f"Validating input for pipeline: {pipeline_id}")
            
            if not pipeline_id:
                raise ValueError("pipeline_id is required for validation")
            
            # Get pipeline schema
            fiber = context.get('fiber')
            if not fiber:
                raise RuntimeError("FiberWise SDK not available in execution context")
            
            pipeline_schema = await self._get_pipeline_schema(fiber, pipeline_id)
            
            # Perform validation
            validation_result = await self._validate_data(
                data_to_validate, 
                pipeline_schema, 
                validation_mode
            )
            
            # Sanitize input if validation passed or in lenient mode
            sanitized_input = data_to_validate
            if validation_result['is_valid'] or validation_mode == 'lenient':
                sanitized_input = await self._sanitize_input(
                    data_to_validate, 
                    pipeline_schema
                )
            
            result = {
                'output': {
                    'is_valid': validation_result['is_valid'],
                    'validation_errors': validation_result['errors'],
                    'sanitized_input': sanitized_input,
                    'schema_version': pipeline_schema.get('version', '1.0.0'),
                    'validation_mode': validation_mode,
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat(),
                        'pipeline_id': pipeline_id
                    }
                },
                'status': 'completed'
            }
            
            logger.info(f"Validation completed: {validation_result['is_valid']}")
            return result
            
        except Exception as e:
            logger.error(f"Error during validation: {str(e)}", exc_info=True)
            return {
                'output': {
                    'is_valid': False,
                    'validation_errors': [f"Validation failed: {str(e)}"],
                    'sanitized_input': {},
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
    
    async def _get_pipeline_schema(self, fiber, pipeline_id: str) -> Dict[str, Any]:
        """
        Retrieve pipeline schema from the system.
        
        Args:
            fiber: FiberWise SDK instance
            pipeline_id: Pipeline identifier
            
        Returns:
            Pipeline schema dictionary
        """
        try:
            # Try to get pipeline definition
            response = await fiber.pipelines.get(pipeline_id)
            
            if response and isinstance(response, dict):
                # Extract input schema from trigger config
                trigger_config = response.get('trigger_config', {})
                config = trigger_config.get('config', {})
                input_schema = config.get('input_schema', {})
                
                if input_schema:
                    return input_schema
            
            # Fallback to basic schema if none found
            logger.warning(f"No specific schema found for pipeline {pipeline_id}, using basic schema")
            return {
                'type': 'object',
                'properties': {},
                'required': [],
                'additionalProperties': True
            }
            
        except Exception as e:
            logger.warning(f"Could not retrieve schema for pipeline {pipeline_id}: {str(e)}")
            # Return permissive schema as fallback
            return {
                'type': 'object',
                'properties': {},
                'required': [],
                'additionalProperties': True
            }
    
    async def _validate_data(
        self, 
        data: Dict[str, Any], 
        schema: Dict[str, Any], 
        mode: str
    ) -> Dict[str, Any]:
        """
        Validate data against schema.
        
        Args:
            data: Data to validate
            schema: Validation schema
            mode: Validation mode (strict, lenient, custom)
            
        Returns:
            Validation result with errors list
        """
        errors = []
        is_valid = True
        
        try:
            # Check if data is required to be an object
            if schema.get('type') == 'object' and not isinstance(data, dict):
                errors.append("Input data must be an object")
                return {'is_valid': False, 'errors': errors}
            
            # Validate required properties
            required_fields = schema.get('required', [])
            for field in required_fields:
                if field not in data:
                    errors.append(f"Required field '{field}' is missing")
                    if mode == 'strict':
                        is_valid = False
            
            # Validate properties
            properties = schema.get('properties', {})
            for field_name, field_data in data.items():
                if field_name in properties:
                    field_schema = properties[field_name]
                    field_errors = await self._validate_field(
                        field_name, 
                        field_data, 
                        field_schema
                    )
                    errors.extend(field_errors)
                    
                    if field_errors and mode == 'strict':
                        is_valid = False
                elif not schema.get('additionalProperties', True):
                    errors.append(f"Additional property '{field_name}' not allowed")
                    if mode == 'strict':
                        is_valid = False
            
            # In lenient mode, only fail on critical errors
            if mode == 'lenient':
                critical_errors = [e for e in errors if 'Required field' in e]
                is_valid = len(critical_errors) == 0
            
        except Exception as e:
            logger.error(f"Error during data validation: {str(e)}")
            errors.append(f"Validation error: {str(e)}")
            is_valid = False
        
        return {
            'is_valid': is_valid,
            'errors': errors
        }
    
    async def _validate_field(
        self, 
        field_name: str, 
        field_value: Any, 
        field_schema: Dict[str, Any]
    ) -> List[str]:
        """
        Validate a single field against its schema.
        
        Args:
            field_name: Name of the field
            field_value: Value to validate
            field_schema: Schema for this field
            
        Returns:
            List of validation errors
        """
        errors = []
        
        try:
            field_type = field_schema.get('type')
            
            # Type validation
            if field_type:
                if not await self._validate_type(field_value, field_type):
                    errors.append(f"Field '{field_name}' must be of type {field_type}")
            
            # String-specific validation
            if field_type == 'string' and isinstance(field_value, str):
                min_length = field_schema.get('minLength', 0)
                max_length = field_schema.get('maxLength')
                
                if len(field_value) < min_length:
                    errors.append(f"Field '{field_name}' must be at least {min_length} characters")
                
                if max_length and len(field_value) > max_length:
                    errors.append(f"Field '{field_name}' must be at most {max_length} characters")
                
                # Pattern validation
                pattern = field_schema.get('pattern')
                if pattern:
                    import re
                    if not re.match(pattern, field_value):
                        errors.append(f"Field '{field_name}' does not match required pattern")
            
            # Number-specific validation
            if field_type in ['number', 'integer'] and isinstance(field_value, (int, float)):
                minimum = field_schema.get('minimum')
                maximum = field_schema.get('maximum')
                
                if minimum is not None and field_value < minimum:
                    errors.append(f"Field '{field_name}' must be at least {minimum}")
                
                if maximum is not None and field_value > maximum:
                    errors.append(f"Field '{field_name}' must be at most {maximum}")
            
            # Array-specific validation
            if field_type == 'array' and isinstance(field_value, list):
                min_items = field_schema.get('minItems', 0)
                max_items = field_schema.get('maxItems')
                
                if len(field_value) < min_items:
                    errors.append(f"Field '{field_name}' must have at least {min_items} items")
                
                if max_items and len(field_value) > max_items:
                    errors.append(f"Field '{field_name}' must have at most {max_items} items")
            
            # Enum validation
            enum_values = field_schema.get('enum')
            if enum_values and field_value not in enum_values:
                errors.append(f"Field '{field_name}' must be one of: {', '.join(map(str, enum_values))}")
        
        except Exception as e:
            logger.error(f"Error validating field {field_name}: {str(e)}")
            errors.append(f"Validation error for field '{field_name}': {str(e)}")
        
        return errors
    
    async def _validate_type(self, value: Any, expected_type: str) -> bool:
        """
        Validate value type.
        
        Args:
            value: Value to check
            expected_type: Expected type name
            
        Returns:
            True if type matches
        """
        type_map = {
            'string': str,
            'integer': int,
            'number': (int, float),
            'boolean': bool,
            'array': list,
            'object': dict
        }
        
        expected_python_type = type_map.get(expected_type)
        if expected_python_type:
            return isinstance(value, expected_python_type)
        
        return True  # Unknown types pass
    
    async def _sanitize_input(
        self, 
        data: Dict[str, Any], 
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Sanitize input data based on schema.
        
        Args:
            data: Original data
            schema: Schema for sanitization
            
        Returns:
            Sanitized data
        """
        sanitized = {}
        properties = schema.get('properties', {})
        
        try:
            for field_name, field_value in data.items():
                if field_name in properties:
                    field_schema = properties[field_name]
                    sanitized[field_name] = await self._sanitize_field(
                        field_value, 
                        field_schema
                    )
                elif schema.get('additionalProperties', True):
                    # Keep additional properties as-is if allowed
                    sanitized[field_name] = field_value
            
            # Add default values for missing required fields
            for field_name, field_schema in properties.items():
                if field_name not in sanitized and 'default' in field_schema:
                    sanitized[field_name] = field_schema['default']
        
        except Exception as e:
            logger.error(f"Error during sanitization: {str(e)}")
            # Return original data if sanitization fails
            return data
        
        return sanitized
    
    async def _sanitize_field(self, value: Any, schema: Dict[str, Any]) -> Any:
        """
        Sanitize a single field value.
        
        Args:
            value: Field value
            schema: Field schema
            
        Returns:
            Sanitized value
        """
        try:
            field_type = schema.get('type')
            
            # Type coercion for strings
            if field_type == 'string' and not isinstance(value, str):
                value = str(value)
            
            # Type coercion for numbers
            elif field_type == 'integer' and isinstance(value, str):
                try:
                    value = int(value)
                except ValueError:
                    pass  # Keep original value
            
            elif field_type == 'number' and isinstance(value, str):
                try:
                    value = float(value)
                except ValueError:
                    pass  # Keep original value
            
            # String trimming and length limits
            if isinstance(value, str):
                value = value.strip()
                max_length = schema.get('maxLength')
                if max_length and len(value) > max_length:
                    value = value[:max_length]
            
            return value
        
        except Exception as e:
            logger.error(f"Error sanitizing field: {str(e)}")
            return value  # Return original on error


# Function factory for pipeline system
async def validate_pipeline_input(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pipeline function entry point for input validation.
    
    Args:
        input_data: Function input data
        context: Pipeline execution context
        
    Returns:
        Function execution result
    """
    validator = PipelineInputValidator()
    return await validator.execute(input_data, context)


# Export function metadata
FUNCTION_METADATA = {
    'id': 'validatePipelineInput',
    'name': 'Validate Pipeline Input',
    'description': 'Validates input data against pipeline schema requirements',
    'version': '1.0.0',
    'input_schema': {
        'type': 'object',
        'properties': {
            'pipeline_id': {
                'type': 'string',
                'description': 'ID of the pipeline to validate against'
            },
            'input_data': {
                'type': 'object',
                'description': 'Input data to validate'
            },
            'validation_mode': {
                'type': 'string',
                'enum': ['strict', 'lenient', 'custom'],
                'default': 'strict',
                'description': 'Validation strictness level'
            }
        },
        'required': ['pipeline_id', 'input_data']
    },
    'output_schema': {
        'type': 'object',
        'properties': {
            'is_valid': {
                'type': 'boolean',
                'description': 'Whether input data is valid'
            },
            'validation_errors': {
                'type': 'array',
                'items': {'type': 'string'},
                'description': 'List of validation error messages'
            },
            'sanitized_input': {
                'type': 'object',
                'description': 'Sanitized and normalized input data'
            }
        }
    }
}