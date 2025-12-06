#!/usr/bin/env python3
"""
Arkiver MCP Server Example
===========================

This is an example MCP server that demonstrates how to integrate
Arkiver's data extraction tools into an MCP server architecture.

This server exposes Arkiver's functionality as MCP tools that can be
called by MCP clients.
"""

import json
import sys
from typing import Any, Dict, List

# Import Arkiver MCP tools
from arkiver import get_arkiver_tools, handle_arkiver_tool_call


class ArchiverMCPServer:
    """Example MCP server that exposes Arkiver tools."""
    
    def __init__(self):
        self.tools = get_arkiver_tools()
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """List all available tools."""
        return self.tools
    
    def call_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool with the given parameters."""
        return handle_arkiver_tool_call(tool_name, parameters)
    
    def get_tool_schema(self, tool_name: str) -> Dict[str, Any]:
        """Get the schema for a specific tool."""
        for tool in self.tools:
            if tool["name"] == tool_name:
                return tool
        return {}


def demo_mcp_server():
    """Demonstrate the MCP server functionality."""
    print("=== Arkiver MCP Server Demo ===\n")
    
    server = ArchiverMCPServer()
    
    print("Available Tools:")
    print("================")
    for tool in server.list_tools():
        print(f"- {tool['name']}: {tool['description']}")
    print()
    
    # Example: Create a configuration
    print("Example: Creating Arkiver Configuration")
    print("======================================")
    config_result = server.call_tool("create_arkiver_config", {
        "output_path": "/tmp/demo_config.json",
        "conversation_path": "attached_assets/reformatted_conversations_1753336339888.json",
        "keywords_path": "attached_assets/Projexts and Keywords_1753336389930.txt",
        "output_dir": "/tmp/demo_output"
    })
    
    print(f"Config creation result: {json.dumps(config_result, indent=2)}")
    print()
    
    # Example: Extract conversations
    print("Example: Extracting Conversations")
    print("=================================")
    
    # Check if the conversation file exists
    import os
    conv_path = "attached_assets/reformatted_conversations_1753336339888.json"
    if os.path.exists(conv_path):
        extract_result = server.call_tool("extract_conversations", {
            "file_path": conv_path,
            "title_filter": "AI"  # Filter conversations with "AI" in title
        })
        
        print(f"Extraction result: {extract_result.get('total_conversations', 0)} conversations found")
        if extract_result.get('conversations'):
            print("Sample conversation titles:")
            for conv in extract_result['conversations'][:3]:
                print(f"  - {conv['title']}")
    else:
        print(f"Conversation file not found: {conv_path}")
    print()
    
    # Example: Categorize text with keywords
    print("Example: Categorizing Text with Keywords") 
    print("=======================================")
    
    keywords_path = "attached_assets/Projexts and Keywords_1753336389930.txt"
    if os.path.exists(keywords_path):
        sample_text = "This is about artificial intelligence and machine learning systems for data analysis"
        
        categorize_result = server.call_tool("categorize_with_keywords", {
            "text_content": sample_text,
            "keywords_config_path": keywords_path,
            "case_sensitive": False
        })
        
        print(f"Categorization result: {json.dumps(categorize_result, indent=2)}")
    else:
        print(f"Keywords file not found: {keywords_path}")


def interactive_mcp_demo():
    """Interactive demo of MCP server functionality."""
    server = ArchiverMCPServer()
    
    print("=== Arkiver MCP Server Interactive Demo ===\n")
    print("Available tools:")
    for i, tool in enumerate(server.list_tools(), 1):
        print(f"{i}. {tool['name']}: {tool['description']}")
    
    print("\nType 'help <tool_name>' to see tool parameters")
    print("Type 'call <tool_name>' to call a tool")
    print("Type 'quit' to exit\n")
    
    while True:
        try:
            command = input("mcp> ").strip().lower()
            
            if command == 'quit':
                break
            elif command.startswith('help '):
                tool_name = command[5:].strip()
                schema = server.get_tool_schema(tool_name)
                if schema:
                    print(f"\nTool: {schema['name']}")
                    print(f"Description: {schema['description']}")
                    print("Parameters:")
                    print(json.dumps(schema['inputSchema'], indent=2))
                else:
                    print(f"Tool '{tool_name}' not found")
                    
            elif command.startswith('call '):
                tool_name = command[5:].strip()
                schema = server.get_tool_schema(tool_name)
                if schema:
                    print(f"\nCalling tool: {tool_name}")
                    print("Enter parameters as JSON (or empty dict {}):")
                    try:
                        params_json = input("params> ") 
                        params = json.loads(params_json) if params_json.strip() else {}
                        result = server.call_tool(tool_name, params)
                        print("Result:")
                        print(json.dumps(result, indent=2))
                    except json.JSONDecodeError:
                        print("Invalid JSON parameters")
                    except Exception as e:
                        print(f"Error: {e}")
                else:
                    print(f"Tool '{tool_name}' not found")
                    
            elif command == 'list':
                for tool in server.list_tools():
                    print(f"- {tool['name']}")
                    
            else:
                print("Commands: help <tool>, call <tool>, list, quit")
                
        except KeyboardInterrupt:
            break
        except EOFError:
            break
    
    print("\nGoodbye!")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mcp_demo()
    else:
        demo_mcp_server()