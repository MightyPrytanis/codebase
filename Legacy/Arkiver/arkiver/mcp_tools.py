"""
MCP Tools for Arkiver - Universal Data Extraction System
========================================================

This module provides MCP (Model Context Protocol) tool wrappers around 
Arkiver's core functionality for use in MCP servers.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable

from .core import DataExtractor
from .config import Config
from .extractors import EXTRACTOR_REGISTRY
from .processors import PROCESSOR_REGISTRY
from .outputs import OUTPUT_REGISTRY


class MCPToolRegistry:
    """Registry for MCP tools provided by Arkiver."""
    
    def __init__(self):
        self.tools = {}
        self._register_default_tools()
    
    def _register_default_tools(self):
        """Register the default set of Arkiver MCP tools."""
        # Data extraction tools
        self.tools["extract_conversations"] = {
            "name": "extract_conversations",
            "description": "Extract and parse ChatGPT conversation data from JSON files",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the conversation JSON file"
                    },
                    "title_filter": {
                        "type": "string",
                        "description": "Optional filter for conversation titles (partial match)",
                        "default": None
                    }
                },
                "required": ["file_path"]
            },
            "handler": extract_conversations_tool
        }
        
        self.tools["extract_text_content"] = {
            "name": "extract_text_content", 
            "description": "Extract content from text files",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the text file"
                    }
                },
                "required": ["file_path"]
            },
            "handler": extract_text_content_tool
        }
        
        # Data processing tools
        self.tools["categorize_with_keywords"] = {
            "name": "categorize_with_keywords",
            "description": "Categorize text content using keyword matching",
            "parameters": {
                "type": "object",
                "properties": {
                    "text_content": {
                        "type": "string",
                        "description": "Text content to categorize"
                    },
                    "keywords_config_path": {
                        "type": "string", 
                        "description": "Path to keywords configuration file"
                    },
                    "case_sensitive": {
                        "type": "boolean",
                        "description": "Whether matching should be case sensitive",
                        "default": False
                    }
                },
                "required": ["text_content", "keywords_config_path"]
            },
            "handler": categorize_with_keywords_tool
        }
        
        self.tools["process_with_regex"] = {
            "name": "process_with_regex",
            "description": "Process text content with regular expression patterns",
            "parameters": {
                "type": "object",
                "properties": {
                    "text_content": {
                        "type": "string",
                        "description": "Text content to process"
                    },
                    "patterns": {
                        "type": "object",
                        "description": "Dict of category names to regex patterns"
                    },
                    "case_sensitive": {
                        "type": "boolean",
                        "description": "Whether matching should be case sensitive",
                        "default": False
                    }
                },
                "required": ["text_content", "patterns"]
            },
            "handler": process_with_regex_tool
        }
        
        # Output generation tools
        self.tools["generate_categorized_files"] = {
            "name": "generate_categorized_files",
            "description": "Generate categorized text files from processed data",
            "parameters": {
                "type": "object",
                "properties": {
                    "processed_items": {
                        "type": "array",
                        "description": "Array of processed data items"
                    },
                    "output_dir": {
                        "type": "string",
                        "description": "Directory to write output files",
                        "default": "output"
                    },
                    "include_context": {
                        "type": "boolean",
                        "description": "Whether to include context in output",
                        "default": True
                    }
                },
                "required": ["processed_items"]
            },
            "handler": generate_categorized_files_tool
        }
        
        # Pipeline tools
        self.tools["run_extraction_pipeline"] = {
            "name": "run_extraction_pipeline",
            "description": "Run a complete data extraction and categorization pipeline",
            "parameters": {
                "type": "object",
                "properties": {
                    "config_path": {
                        "type": "string",
                        "description": "Path to pipeline configuration file",
                        "default": None
                    },
                    "config_dict": {
                        "type": "object",
                        "description": "Pipeline configuration as dictionary (alternative to config_path)"
                    }
                }
            },
            "handler": run_extraction_pipeline_tool
        }
        
        # Configuration tools
        self.tools["create_arkiver_config"] = {
            "name": "create_arkiver_config",
            "description": "Create a new Arkiver configuration file",
            "parameters": {
                "type": "object",
                "properties": {
                    "output_path": {
                        "type": "string",
                        "description": "Path where to save the configuration",
                        "default": "arkiver_config.json"
                    },
                    "conversation_path": {
                        "type": "string",
                        "description": "Path to conversation JSON file"
                    },
                    "keywords_path": {
                        "type": "string", 
                        "description": "Path to keywords configuration file"
                    },
                    "output_dir": {
                        "type": "string",
                        "description": "Directory for output files",
                        "default": "output"
                    }
                }
            },
            "handler": create_arkiver_config_tool
        }
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Get tool definitions for MCP server registration."""
        return [
            {
                "name": tool["name"],
                "description": tool["description"],
                "inputSchema": tool["parameters"]
            }
            for tool in self.tools.values()
        ]
    
    def get_tool_handler(self, tool_name: str) -> Optional[Callable]:
        """Get the handler function for a tool."""
        tool = self.tools.get(tool_name)
        return tool["handler"] if tool else None


# Tool implementation functions

def extract_conversations_tool(file_path: str, title_filter: Optional[str] = None) -> Dict[str, Any]:
    """MCP tool to extract conversations from JSON files."""
    try:
        from .extractors import ConversationExtractor
        
        config = {"path": file_path}
        extractor = ConversationExtractor(config)
        
        conversations = []
        for item in extractor.extract():
            # Apply title filter if provided
            if title_filter and title_filter.lower() not in item.get("title", "").lower():
                continue
                
            conversations.append({
                "title": item.get("title", "Untitled"),
                "create_time": item.get("create_time"),
                "update_time": item.get("update_time"),
                "message_count": len(item.get("messages", [])),
                "text_content": extractor.get_text_content(item),
                "preview": extractor.get_text_content(item)[:200] + "..." if len(extractor.get_text_content(item)) > 200 else extractor.get_text_content(item)
            })
        
        return {
            "success": True,
            "total_conversations": len(conversations),
            "conversations": conversations
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "conversations": []
        }


def extract_text_content_tool(file_path: str) -> Dict[str, Any]:
    """MCP tool to extract content from text files."""
    try:
        from .extractors import TextFileExtractor
        
        config = {"path": file_path}
        extractor = TextFileExtractor(config)
        
        items = list(extractor.extract())
        if not items:
            return {
                "success": False,
                "error": "No content extracted from file",
                "content": ""
            }
        
        item = items[0]
        content = extractor.get_text_content(item)
        
        return {
            "success": True,
            "file_path": file_path,
            "title": item.get("title", ""),
            "content": content,
            "content_length": len(content),
            "preview": content[:500] + "..." if len(content) > 500 else content
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "content": ""
        }


def categorize_with_keywords_tool(text_content: str, keywords_config_path: str, case_sensitive: bool = False) -> Dict[str, Any]:
    """MCP tool to categorize text using keyword matching."""
    try:
        from .processors import KeywordProcessor
        
        config = {
            "config_path": keywords_config_path,
            "case_sensitive": case_sensitive
        }
        processor = KeywordProcessor(config)
        
        # Create a dummy item for processing
        dummy_item = {"type": "text", "content": text_content}
        result = processor.process(dummy_item, text_content)
        
        return {
            "success": True,
            "projects": result.get("projects", []),
            "matched_keywords": result.get("matched_keywords", []),
            "has_matches": result.get("has_matches", False)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "projects": [],
            "matched_keywords": []
        }


def process_with_regex_tool(text_content: str, patterns: Dict[str, str], case_sensitive: bool = False) -> Dict[str, Any]:
    """MCP tool to process text with regex patterns."""
    try:
        from .processors import RegexProcessor
        
        config = {
            "patterns": patterns,
            "case_sensitive": case_sensitive
        }
        processor = RegexProcessor(config)
        
        # Create a dummy item for processing
        dummy_item = {"type": "text", "content": text_content}
        result = processor.process(dummy_item, text_content)
        
        return {
            "success": True,
            "categories": result.get("categories", []),
            "matches": result.get("matches", {}),
            "has_matches": result.get("has_matches", False)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "categories": [],
            "matches": {}
        }


def generate_categorized_files_tool(processed_items: List[Dict[str, Any]], output_dir: str = "output", include_context: bool = True) -> Dict[str, Any]:
    """MCP tool to generate categorized output files."""
    try:
        from .outputs import TextFileOutput
        
        config = {
            "output_dir": output_dir,
            "include_uncategorized": True,
            "include_context": include_context
        }
        output_handler = TextFileOutput(config)
        
        created_files = output_handler.write_results(processed_items)
        
        return {
            "success": True,
            "created_files": created_files,
            "output_dir": output_dir,
            "files_count": len(created_files)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "created_files": []
        }


def run_extraction_pipeline_tool(config_path: Optional[str] = None, config_dict: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """MCP tool to run a complete extraction pipeline."""
    try:
        if config_dict:
            # Create a temporary config file from the dictionary
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(config_dict, f, indent=2)
                temp_config_path = f.name
            config_path = temp_config_path
        
        extractor = DataExtractor(config_path=config_path)
        results = extractor.run()
        
        # Clean up temporary file if created
        if config_dict and temp_config_path:
            Path(temp_config_path).unlink(missing_ok=True)
        
        return {
            "success": results.get("success", False),
            "statistics": results.get("statistics", {}),
            "output_files": results.get("output_files", []),
            "message": results.get("message", "")
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "statistics": {},
            "output_files": []
        }


def create_arkiver_config_tool(
    output_path: str = "arkiver_config.json",
    conversation_path: Optional[str] = None,
    keywords_path: Optional[str] = None,
    output_dir: str = "output"
) -> Dict[str, Any]:
    """MCP tool to create an Arkiver configuration file."""
    try:
        config = Config()
        
        # Create a basic configuration
        config_data = {
            "version": "2.0.0",
            "data_sources": {},
            "processors": {},
            "outputs": {
                "text_files": {
                    "type": "text_file",
                    "enabled": True,
                    "output_dir": output_dir,
                    "include_uncategorized": True,
                    "include_context": True
                }
            },
            "logging": {
                "level": "INFO",
                "console": True,
                "file": None
            },
            "security": {
                "prompt_delete_outputs": False
            }
        }
        
        # Add conversation data source if provided
        if conversation_path:
            config_data["data_sources"]["conversations"] = {
                "type": "conversation_json",
                "path": conversation_path,
                "enabled": True
            }
        
        # Add keyword processor if provided
        if keywords_path:
            config_data["processors"]["keyword_matcher"] = {
                "type": "keyword",
                "config_path": keywords_path,
                "enabled": True,
                "case_sensitive": False
            }
        
        # Save the configuration
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)
        
        return {
            "success": True,
            "config_path": output_path,
            "config": config_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "config_path": output_path
        }


# Global registry instance
mcp_registry = MCPToolRegistry()

# Convenience functions for MCP server integration
def get_arkiver_tools() -> List[Dict[str, Any]]:
    """Get all Arkiver MCP tool definitions."""
    return mcp_registry.get_tool_definitions()


def handle_arkiver_tool_call(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Handle an MCP tool call for Arkiver tools."""
    handler = mcp_registry.get_tool_handler(tool_name)
    if not handler:
        return {
            "success": False,
            "error": f"Unknown tool: {tool_name}"
        }
    
    try:
        return handler(**parameters)
    except Exception as e:
        logging.exception(f"Error in tool {tool_name}")
        return {
            "success": False,
            "error": f"Tool execution error: {str(e)}"
        }