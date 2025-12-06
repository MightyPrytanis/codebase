"""
Cyrano MCP Integration for Arkiver
==================================

This module provides ready-to-use integration functions for the Cyrano MCP server.
It exports Arkiver tools in a format that can be directly consumed by Cyrano.
"""

from typing import Dict, Any, List, Callable, Optional
from arkiver import get_arkiver_tools, handle_arkiver_tool_call


def get_cyrano_tool_definitions() -> List[Dict[str, Any]]:
    """
    Get Arkiver tool definitions formatted for Cyrano MCP server.
    
    Returns:
        List of tool definitions ready for Cyrano server registration
    """
    return get_arkiver_tools()


def create_cyrano_tool_handlers() -> Dict[str, Callable]:
    """
    Create tool handler functions for Cyrano MCP server.
    
    Returns:
        Dict mapping tool names to handler functions
    """
    tools = get_arkiver_tools()
    handlers = {}
    
    for tool in tools:
        tool_name = tool["name"]
        
        def create_handler(name: str):
            def handler(**kwargs) -> Dict[str, Any]:
                return handle_arkiver_tool_call(name, kwargs)
            return handler
        
        handlers[tool_name] = create_handler(tool_name)
    
    return handlers


def register_arkiver_tools_with_cyrano(cyrano_server):
    """
    Register all Arkiver tools with a Cyrano MCP server instance.
    
    Args:
        cyrano_server: The Cyrano MCP server instance
    """
    # Get tool definitions and handlers
    tool_definitions = get_cyrano_tool_definitions()
    tool_handlers = create_cyrano_tool_handlers()
    
    # Register each tool with the server
    for tool_def in tool_definitions:
        tool_name = tool_def["name"]
        if hasattr(cyrano_server, 'register_tool'):
            cyrano_server.register_tool(
                name=tool_name,
                description=tool_def["description"],
                parameters=tool_def["inputSchema"],
                handler=tool_handlers[tool_name]
            )
        elif hasattr(cyrano_server, 'add_tool'):
            cyrano_server.add_tool(
                tool_name,
                tool_def["description"],
                tool_def["inputSchema"],
                tool_handlers[tool_name]
            )
        else:
            # Generic registration attempt
            setattr(cyrano_server, f"tool_{tool_name}", tool_handlers[tool_name])


class CyranoArchiverPlugin:
    """
    Plugin class for Cyrano MCP server integration.
    
    This class can be imported and instantiated by the Cyrano server
    to automatically load all Arkiver tools.
    """
    
    def __init__(self):
        self.name = "arkiver"
        self.version = "2.0.0"
        self.description = "Universal data extraction and categorization tools"
        self.tools = get_cyrano_tool_definitions()
        self.handlers = create_cyrano_tool_handlers()
    
    def get_tools(self) -> List[Dict[str, Any]]:
        """Get all tool definitions."""
        return self.tools
    
    def get_handler(self, tool_name: str) -> Optional[Callable]:
        """Get handler for a specific tool."""
        return self.handlers.get(tool_name)
    
    def install(self, server):
        """Install this plugin into a server."""
        register_arkiver_tools_with_cyrano(server)


# Convenience instance for direct import
arkiver_plugin = CyranoArchiverPlugin()


# Direct tool access functions (for manual integration)

def extract_conversations(**kwargs):
    """Direct access to conversation extraction tool."""
    return handle_arkiver_tool_call("extract_conversations", kwargs)


def extract_text_content(**kwargs):
    """Direct access to text content extraction tool."""
    return handle_arkiver_tool_call("extract_text_content", kwargs)


def categorize_with_keywords(**kwargs):
    """Direct access to keyword categorization tool."""
    return handle_arkiver_tool_call("categorize_with_keywords", kwargs)


def process_with_regex(**kwargs):
    """Direct access to regex processing tool."""
    return handle_arkiver_tool_call("process_with_regex", kwargs)


def generate_categorized_files(**kwargs):
    """Direct access to file generation tool."""
    return handle_arkiver_tool_call("generate_categorized_files", kwargs)


def run_extraction_pipeline(**kwargs):
    """Direct access to pipeline execution tool."""
    return handle_arkiver_tool_call("run_extraction_pipeline", kwargs)


def create_arkiver_config(**kwargs):
    """Direct access to configuration creation tool."""
    return handle_arkiver_tool_call("create_arkiver_config", kwargs)


# Tool metadata for documentation/discovery
ARKIVER_TOOLS_METADATA = {
    "plugin_name": "arkiver",
    "plugin_version": "2.0.0",
    "plugin_description": "Universal data extraction and categorization system",
    "author": "MightyPrytanis",
    "homepage": "https://github.com/MightyPrytanis/Arkiver",
    "tools_count": len(get_arkiver_tools()),
    "categories": [
        "data-extraction",
        "text-processing", 
        "categorization",
        "conversation-analysis",
        "file-processing"
    ],
    "supported_formats": [
        "json",
        "txt",
        "chatgpt-conversations"
    ]
}