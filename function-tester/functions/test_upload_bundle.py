"""Upload Bundle Entity Testing Function"""
import json
import os
import tempfile
import shutil

def test_upload_bundle_entity(input_data):
    """
    Test function for upload bundle entity functionality
    Simulates creating and processing a bundle entity for testing purposes
    """
    entity_name = input_data.get('entity_name', 'test_entity')
    entity_type = input_data.get('entity_type', 'test')
    test_content = input_data.get('content', 'Test entity content')
    
    try:
        # Create a temporary bundle structure for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            bundle_path = os.path.join(temp_dir, f"{entity_name}_bundle")
            os.makedirs(bundle_path)
            
            # Create entity metadata
            metadata = {
                "name": entity_name,
                "type": entity_type,
                "version": "1.0.0",
                "created_at": "2024-01-01T00:00:00Z",
                "content": test_content
            }
            
            # Write metadata file
            metadata_file = os.path.join(bundle_path, "metadata.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Create content file
            content_file = os.path.join(bundle_path, "content.txt")
            with open(content_file, 'w') as f:
                f.write(test_content)
            
            # Simulate bundle validation
            bundle_size = sum(os.path.getsize(os.path.join(bundle_path, f)) 
                            for f in os.listdir(bundle_path))
            
            return {
                "status": "success",
                "entity_name": entity_name,
                "entity_type": entity_type,
                "bundle_size": bundle_size,
                "files_created": os.listdir(bundle_path),
                "test_result": "Bundle entity creation and validation successful",
                "metadata": metadata
            }
    
    except Exception as e:
        return {
            "status": "error",
            "error_message": str(e),
            "entity_name": entity_name,
            "test_result": "Bundle entity test failed"
        }

# Entry point for the function
def run(input_data):
    return test_upload_bundle_entity(input_data)
