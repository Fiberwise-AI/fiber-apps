#!/usr/bin/env python3
"""
Script to check local data and API for deployed apps
"""
import json
import requests
from pathlib import Path

def check_local_app_info():
    """Check what app info is stored locally"""
    print("=== LOCAL APP INFO ===")
    
    app_info_path = Path(".fiber/fiber dev/app_info.json")
    if app_info_path.exists():
        with open(app_info_path) as f:
            app_info = json.load(f)
        print(f"Local app info found:")
        print(f"   App ID: {app_info.get('app_id', 'NOT_SET')}")
        print(f"   App Slug: {app_info.get('app_slug', 'NOT_SET')}")
        print(f"   Version: {app_info.get('version', 'NOT_SET')}")
        return app_info
    else:
        print("No local app info found")
        return None

def check_local_config():
    """Check what instance config exists"""
    print("\n=== LOCAL CONFIG ===")
    
    config_path = Path.home() / ".fiber" / "config.json"
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
        
        instances = config.get('instances', {})
        print(f"Found {len(instances)} instance(s):")
        for name, instance in instances.items():
            base_url = instance.get('base_url', 'NOT_SET')
            print(f"   {name}: {base_url}")
        
        default = config.get('default_instance')
        print(f"   Default: {default}")
        
        return config
    else:
        print("No config found")
        return None

def check_api_apps(config):
    """Check what apps are deployed via API"""
    print("\n=== API APPS ===")
    
    if not config:
        print("ERROR: No config available")
        return
    
    instances = config.get('instances', {})
    fiber_dev = instances.get('fiber dev')
    
    if not fiber_dev:
        print("ERROR: No 'fiber dev' instance configured")
        return
    
    base_url = fiber_dev.get('base_url', '').rstrip('/')
    api_key = fiber_dev.get('api_key', '')
    
    if not base_url or not api_key:
        print("ERROR: Missing base_url or api_key")
        return
    
    try:
        # Check apps endpoint
        headers = {'Authorization': f'Bearer {api_key}'}
        response = requests.get(f"{base_url}/api/v1/apps", headers=headers)
        
        print(f"Apps API response: {response.status_code}")
        
        if response.status_code == 200:
            apps = response.json()
            print(f"OK: Found {len(apps)} app(s):")
            for app in apps:
                name = app.get('name', 'UNKNOWN')
                app_id = app.get('app_id', 'UNKNOWN')
                version = app.get('version', 'UNKNOWN')
                print(f"   {name} (ID: {app_id}, v{version})")
        else:
            print(f"ERROR: API error: {response.text}")
            
    except Exception as e:
        print(f"ERROR: API request failed: {e}")

def check_api_agents(config, app_id=None):
    """Check what agents are deployed"""
    print("\n=== API AGENTS ===")
    
    if not config:
        print("ERROR: No config available")
        return
    
    instances = config.get('instances', {})
    fiber_dev = instances.get('fiber dev')
    
    if not fiber_dev:
        print("ERROR: No 'fiber dev' instance configured")
        return
    
    base_url = fiber_dev.get('base_url', '').rstrip('/')
    api_key = fiber_dev.get('api_key', '')
    
    try:
        headers = {'Authorization': f'Bearer {api_key}'}
        
        # Try different agent endpoints
        endpoints = [
            f"{base_url}/api/v1/agents",
            f"{base_url}/api/v1/apps/agents"
        ]
        
        if app_id:
            endpoints.append(f"{base_url}/api/v1/apps/{app_id}/agents")
        
        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, headers=headers)
                print(f"Agents endpoint {endpoint}: {response.status_code}")
                
                if response.status_code == 200:
                    agents = response.json()
                    print(f"OK: Found {len(agents)} agent(s):")
                    for agent in agents:
                        name = agent.get('name', 'UNKNOWN')
                        agent_id = agent.get('agent_id', 'UNKNOWN')
                        print(f"   {name} (ID: {agent_id})")
                    break
                        
            except Exception as e:
                print(f"ERROR: Endpoint {endpoint} failed: {e}")
                
    except Exception as e:
        print(f"ERROR: Agent check failed: {e}")

def main():
    """Main check function"""
    print("DEPLOYMENT STATUS CHECK")
    print("=" * 50)
    
    # Check local data
    app_info = check_local_app_info()
    config = check_local_config()
    
    # Check API
    check_api_apps(config)
    
    app_id = app_info.get('app_id') if app_info else None
    check_api_agents(config, app_id)
    
    print("\n" + "=" * 50)
    print("OK: Check complete")

if __name__ == "__main__":
    main()