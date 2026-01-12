#!/usr/bin/env python3
"""
Cyrano Integration Example
==========================

This example demonstrates how to integrate Arkiver tools into the Cyrano MCP server.
Copy this code into your Cyrano server to add Arkiver's data extraction capabilities.
"""

# Import Arkiver MCP integration
from arkiver import (
    arkiver_plugin,
    get_cyrano_tool_definitions, 
    handle_arkiver_tool_call,
    ARKIVER_TOOLS_METADATA
)

def integrate_arkiver_with_cyrano(cyrano_server):
    """
    Integrate Arkiver tools with Cyrano MCP server.
    
    Args:
        cyrano_server: Your Cyrano MCP server instance
    """
    print(f"Installing Arkiver plugin v{ARKIVER_TOOLS_METADATA['plugin_version']}...")
    
    # Method 1: Use the plugin (recommended)
    try:
        arkiver_plugin.install(cyrano_server)
        print(f"✓ Successfully installed {len(arkiver_plugin.tools)} Arkiver tools")
        return True
    except Exception as e:
        print(f"Plugin installation failed: {e}")
        
        # Method 2: Manual registration fallback
        try:
            tools = get_cyrano_tool_definitions()
            for tool in tools:
                # Register each tool manually (adapt to your server's API)
                if hasattr(cyrano_server, 'register_tool'):
                    def create_handler(tool_name):
                        return lambda **kwargs: handle_arkiver_tool_call(tool_name, kwargs)
                    
                    cyrano_server.register_tool(
                        name=tool['name'],
                        description=tool['description'],
                        schema=tool['inputSchema'],
                        handler=create_handler(tool['name'])
                    )
                elif hasattr(cyrano_server, 'add_tool'):
                    cyrano_server.add_tool(tool['name'], tool['description'], tool['inputSchema'])
            
            print(f"✓ Manually registered {len(tools)} Arkiver tools")
            return True
            
        except Exception as e2:
            print(f"Manual registration also failed: {e2}")
            return False


def demo_arkiver_usage():
    """Demonstrate Arkiver tool usage."""
    print("\n=== Arkiver Tools Demo ===")
    
    # Example 1: Extract conversations
    print("\n1. Extract ChatGPT conversations:")
    conv_result = handle_arkiver_tool_call("extract_conversations", {
        "file_path": "attached_assets/reformatted_conversations_1753336339888.json",
        "title_filter": "AI"
    })
    
    if conv_result["success"]:
        print(f"   Found {conv_result['total_conversations']} AI-related conversations")
    else:
        print(f"   Error: {conv_result['error']}")
    
    # Example 2: Categorize text
    print("\n2. Categorize text with keywords:")
    cat_result = handle_arkiver_tool_call("categorize_with_keywords", {
        "text_content": "Discussion about machine learning algorithms and neural networks",
        "keywords_config_path": "attached_assets/Projexts and Keywords_1753336389930.txt"
    })
    
    if cat_result["success"]:
        print(f"   Matched projects: {cat_result['projects']}")
        print(f"   Keywords found: {cat_result['matched_keywords']}")
    else:
        print(f"   Error: {cat_result['error']}")
    
    # Example 3: Create configuration
    print("\n3. Create Arkiver configuration:")
    config_result = handle_arkiver_tool_call("create_arkiver_config", {
        "output_path": "/tmp/cyrano_arkiver_config.json",
        "conversation_path": "conversations.json",
        "keywords_path": "keywords.txt"
    })
    
    if config_result["success"]:
        print(f"   Config created: {config_result['config_path']}")
    else:
        print(f"   Error: {config_result['error']}")


# Example integration with a hypothetical Cyrano server
class ExampleCyranoServer:
    """Example Cyrano server class for demonstration."""
    
    def __init__(self):
        self.tools = {}
    
    def register_tool(self, name, description, schema, handler):
        """Register a tool with the server."""
        self.tools[name] = {
            'name': name,
            'description': description, 
            'schema': schema,
            'handler': handler
        }
        print(f"Registered tool: {name}")
    
    def call_tool(self, name, params):
        """Call a registered tool."""
        if name in self.tools:
            return self.tools[name]['handler'](**params)
        else:
            return {"error": f"Tool {name} not found"}
    
    def list_tools(self):
        """List all registered tools."""
        return list(self.tools.keys())


if __name__ == "__main__":
    # Example usage
    print("=== Cyrano-Arkiver Integration Example ===")
    
    # Create example server
    cyrano_server = ExampleCyranoServer()
    
    # Integrate Arkiver
    success = integrate_arkiver_with_cyrano(cyrano_server)
    
    if success:
        print(f"\nRegistered tools: {cyrano_server.list_tools()}")
        
        # Test a tool call
        result = cyrano_server.call_tool("create_arkiver_config", {
            "output_path": "/tmp/test_config.json"
        })
        print(f"\nTest tool call result: {result['success']}")
    
    # Show demo
    demo_arkiver_usage()
    
    print("\n=== Integration Complete ===")
    print("Arkiver tools are now available in your Cyrano MCP server!")
)
)
)
)
)
)
)
)
)
)
)