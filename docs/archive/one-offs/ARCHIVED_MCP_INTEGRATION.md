---
Document ID: ARCHIVED-MCP_INTEGRATION
Title: Mcp Integration
Subject(s): Archived | Limited Utility | Experimental | Old Version
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current utility (experimental/Labs code, old version, duplicate, etc.)
Status: Archived
---

**ARCHIVED:** This document relates to experimental/Labs code, old versions, or duplicates and has limited current utility. Archived 2025-11-28.

---

# Arkiver MCP Integration Guide

This guide explains how to integrate Arkiver components with MCP (Model Context Protocol) servers, specifically for use with the Cyrano MCP server.

## Overview

Arkiver has been adapted to provide its core functionality as MCP tools that can be easily integrated into MCP servers. This allows Arkiver's powerful data extraction and categorization capabilities to be exposed as tools that can be used by AI assistants and other MCP clients.

## Available MCP Tools

Arkiver provides the following MCP tools:

### Data Extraction Tools

1. **`extract_conversations`** - Extract and parse ChatGPT conversation data from JSON files
   - Parameters: `file_path` (required), `title_filter` (optional)
   - Returns: Conversation data with titles, timestamps, and text content

2. **`extract_text_content`** - Extract content from plain text files
   - Parameters: `file_path` (required)
   - Returns: File content with metadata and preview

### Data Processing Tools

3. **`categorize_with_keywords`** - Categorize text content using keyword matching
   - Parameters: `text_content` (required), `keywords_config_path` (required), `case_sensitive` (optional)
   - Returns: Matched projects/categories and keywords

4. **`process_with_regex`** - Process text content with regular expression patterns
   - Parameters: `text_content` (required), `patterns` (required), `case_sensitive` (optional)
   - Returns: Pattern matches organized by category

### Output Generation Tools

5. **`generate_categorized_files`** - Generate categorized text files from processed data
   - Parameters: `processed_items` (required), `output_dir` (optional), `include_context` (optional)
   - Returns: List of created output files

### Pipeline Tools

6. **`run_extraction_pipeline`** - Run a complete data extraction and categorization pipeline
   - Parameters: `config_path` (optional), `config_dict` (optional)
   - Returns: Pipeline execution results with statistics

### Configuration Tools

7. **`create_arkiver_config`** - Create a new Arkiver configuration file
   - Parameters: `output_path` (optional), `conversation_path` (optional), `keywords_path` (optional), `output_dir` (optional)
   - Returns: Created configuration file path and content

## Quick Start

### For Cyrano MCP Server

1. **Import the plugin:**
   ```python
   from arkiver import arkiver_plugin
   
   # Get all tool definitions
   tools = arkiver_plugin.get_tools()
   
   # Install into your Cyrano server
   arkiver_plugin.install(cyrano_server)
   ```

2. **Manual integration:**
   ```python
   from arkiver import get_cyrano_tool_definitions, register_arkiver_tools_with_cyrano
   
   # Register all Arkiver tools with your server
   register_arkiver_tools_with_cyrano(cyrano_server)
   ```

### For Generic MCP Servers

1. **Get tool definitions:**
   ```python
   from arkiver import get_arkiver_tools
   
   tools = get_arkiver_tools()
   # Register these tools with your MCP server
   ```

2. **Handle tool calls:**
   ```python
   from arkiver import handle_arkiver_tool_call
   
   def handle_tool_call(tool_name, parameters):
       return handle_arkiver_tool_call(tool_name, parameters)
   ```

## Usage Examples

### Extract Conversations
```python
from arkiver import handle_arkiver_tool_call

result = handle_arkiver_tool_call("extract_conversations", {
    "file_path": "conversations.json",
    "title_filter": "AI"  # Only conversations with "AI" in title
})

print(f"Found {result['total_conversations']} conversations")
```

### Categorize Text
```python
result = handle_arkiver_tool_call("categorize_with_keywords", {
    "text_content": "This is about machine learning and AI",
    "keywords_config_path": "keywords.txt",
    "case_sensitive": False
})

print(f"Categories: {result['projects']}")
print(f"Matched keywords: {result['matched_keywords']}")
```

### Run Full Pipeline
```python
config = {
    "data_sources": {
        "conversations": {
            "type": "conversation_json",
            "path": "conversations.json",
            "enabled": True
        }
    },
    "processors": {
        "keyword_matcher": {
            "type": "keyword",
            "config_path": "keywords.txt",
            "enabled": True
        }
    },
    "outputs": {
        "text_files": {
            "type": "text_file",
            "enabled": True,
            "output_dir": "output"
        }
    }
}

result = handle_arkiver_tool_call("run_extraction_pipeline", {
    "config_dict": config
})

print(f"Processed {result['statistics']['total_items']} items")
print(f"Created files: {result['output_files']}")
```

## Integration Patterns

### Plugin-Style Integration
```python
from arkiver import CyranoArchiverPlugin

class MyMCPServer:
    def __init__(self):
        self.plugins = []
    
    def load_plugin(self, plugin):
        plugin.install(self)
        self.plugins.append(plugin)

# Usage
server = MyMCPServer()
arkiver_plugin = CyranoArchiverPlugin()
server.load_plugin(arkiver_plugin)
```

### Direct Function Integration
```python
from arkiver.cyrano_integration import (
    extract_conversations,
    categorize_with_keywords,
    run_extraction_pipeline
)

# These functions can be called directly
result = extract_conversations(file_path="data.json")
categories = categorize_with_keywords(
    text_content="sample text",
    keywords_config_path="keywords.txt"
)
```

## Configuration

Arkiver tools work with standard Arkiver configuration files. You can:

1. Create configurations programmatically using the `create_arkiver_config` tool
2. Use existing configuration files with the `run_extraction_pipeline` tool
3. Pass configuration dictionaries directly to tools

### Sample Configuration
```json
{
  "version": "2.0.0",
  "data_sources": {
    "conversations": {
      "type": "conversation_json",
      "path": "conversations.json",
      "enabled": true
    }
  },
  "processors": {
    "keyword_matcher": {
      "type": "keyword",
      "config_path": "keywords.txt",
      "enabled": true,
      "case_sensitive": false
    }
  },
  "outputs": {
    "text_files": {
      "type": "text_file",
      "enabled": true,
      "output_dir": "output",
      "include_context": true
    }
  }
}
```

## Error Handling

All MCP tools return results in a consistent format:

```python
{
  "success": True,  # or False
  "error": "Error message if success=False",
  # ... tool-specific results
}
```

Always check the `success` field before processing results.

## Testing

You can test the MCP integration using the provided example server:

```bash
# Run the demo
python mcp_server_example.py

# Run interactive demo
python mcp_server_example.py interactive
```

## Tool Metadata

Access metadata about available tools:

```python
from arkiver import ARKIVER_TOOLS_METADATA

print(f"Plugin: {ARKIVER_TOOLS_METADATA['plugin_name']}")
print(f"Version: {ARKIVER_TOOLS_METADATA['plugin_version']}")
print(f"Tools: {ARKIVER_TOOLS_METADATA['tools_count']}")
print(f"Categories: {ARKIVER_TOOLS_METADATA['categories']}")
```

## Best Practices

1. **Error Handling**: Always check the `success` field in tool results
2. **File Paths**: Use absolute paths when possible for reliability
3. **Configuration**: Validate configuration before passing to tools
4. **Memory**: Be mindful of large datasets when using extraction tools
5. **Security**: Be careful with file paths and ensure proper access controls

## Support

For issues or questions about MCP integration:

1. Check the tool results for error messages
2. Verify file paths and permissions
3. Test tools individually before using in pipelines
4. Review the Arkiver documentation for configuration details

The MCP integration maintains full compatibility with existing Arkiver functionality while providing a clean, tool-based interface for MCP servers.