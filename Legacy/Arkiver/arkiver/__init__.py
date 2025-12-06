"""
Arkiver - Universal Data Extraction System
==========================================

A modular, configurable data extraction and categorization system.
"""

__version__ = "2.0.0"
__author__ = "MightyPrytanis"

from .core import DataExtractor
from .config import Config
from .extractors import ConversationExtractor
from .processors import KeywordProcessor
from .outputs import TextFileOutput

# MCP Tools integration
from .mcp_tools import (
    get_arkiver_tools,
    handle_arkiver_tool_call,
    mcp_registry,
    MCPToolRegistry
)

# Cyrano MCP Server integration
from .cyrano_integration import (
    get_cyrano_tool_definitions,
    create_cyrano_tool_handlers,
    register_arkiver_tools_with_cyrano,
    CyranoArchiverPlugin,
    arkiver_plugin,
    ARKIVER_TOOLS_METADATA
)

__all__ = [
    "DataExtractor",
    "Config", 
    "ConversationExtractor",
    "KeywordProcessor",
    "TextFileOutput",
    # MCP Tools
    "get_arkiver_tools",
    "handle_arkiver_tool_call", 
    "mcp_registry",
    "MCPToolRegistry",
    # Cyrano Integration
    "get_cyrano_tool_definitions",
    "create_cyrano_tool_handlers",
    "register_arkiver_tools_with_cyrano",
    "CyranoArchiverPlugin",
    "arkiver_plugin",
    "ARKIVER_TOOLS_METADATA"
]