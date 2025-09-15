#!/usr/bin/env python3
"""
Debug script to check what the my-apps API returns
"""
import requests
import json
from pathlib import Path

def get_config():
    """Get config from user's fiber directory"""
    config_path = Path.home() / ".fiber" / "config.json"
    if config_path.exists():
        with open(config_path) as f:
            return json.load(f)
    return None

def check_my_apps_api():
    """Check what the my-apps API returns"""
    config = get_config()
    if not config:
        print("ERROR: No fiber config found")
        return
    
    instances = config.get('instances', {})
    fiber_dev = instances.get('fiber dev')
    
    if not fiber_dev:
        print("ERROR: No 'fiber dev' instance found")
        return
    
    base_url = fiber_dev.get('base_url', '').rstrip('/')
    api_key = fiber_dev.get('api_key', '')
    
    print(f"Testing API: {base_url}/api/v1/users/my-apps")
    
    try:
        headers = {'Authorization': f'Bearer {api_key}'}
        response = requests.get(f"{base_url}/api/v1/users/my-apps", headers=headers)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            apps = response.json()
            print(f"Found {len(apps)} apps:")
            
            for i, app in enumerate(apps):
                print(f"\nApp {i+1}:")
                print(f"  app_id: {app.get('app_id', 'MISSING')}")
                print(f"  name: {app.get('name', 'MISSING')}")
                print(f"  app_slug: {app.get('app_slug', 'MISSING')}")
                print(f"  version: {app.get('version', 'MISSING')}")
                print(f"  status: {app.get('marketplace_status', 'MISSING')}")
                
                # Check if any key fields are None/missing
                if not app.get('app_id'):
                    print("  *** WARNING: app_id is missing or None ***")
                    
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    check_my_apps_api()