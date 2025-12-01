---
Document ID: ARCHIVED-ARKIVER-UNIVERSAL-DATA-EXTRACTION
Title: Arkiver Universal Data Extraction System (Python)
Subject(s): Archived | Python | Outdated
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Python-based Arkiver documentation archived. TypeScript implementations are in Cyrano/src/modules/arkiver/
Status: Archived
---

**ARCHIVED:** This document describes the Python Arkiver implementation which is archived in Legacy/. Production uses TypeScript implementations in `Cyrano/src/modules/arkiver/`. Archived 2025-11-28.

---

---
Document ID: README
Title: Arkiver - Universal Data Extraction System
Subject(s): Arkiver
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

A modern, modular data extraction and categorization system that merges the original Arkiver conversation analysis capabilities with NewArkiver universal data processing concepts.

## Overview

This project represents the merger of **Arkiver** (conversation analysis tool) and **NewArkiver** (universal data extractor concept) into a single, powerful, and extensible system for processing various types of data.

### Key Features

- **Universal Data Extraction**: Support for multiple data formats (JSON conversations, text files, etc.)
- **Modular Architecture**: Pluggable extractors, processors, and output handlers
- **Configurable Processing**: JSON-based configuration for all pipeline components
- **Extensible Design**: Easy to add new data sources, processing methods, and output formats
- **Modern Python**: Clean, type-hinted code with proper error handling and logging
- **MCP Integration**: Ready-to-use tools for Model Context Protocol (MCP) servers, including Cyrano

## Quick Start

### Basic Usage

1. **Run with default configuration:**
   ```bash
   python newarkiver.py
   ```

2. **Use custom configuration:**
   ```bash
   python newarkiver.py -c my_config.json
   ```

3. **Verbose output:**
   ```bash
   python newarkiver.py -v
   ```

### First Run

On first run, NewArkiver will create a `config.json` file with default settings. The system is pre-configured to work with the existing conversation data and keyword files.

## MCP Integration

Arkiver components are now available as MCP (Model Context Protocol) tools for integration with MCP servers like Cyrano:

```python
# Quick integration with Cyrano MCP server
from arkiver import arkiver_plugin
arkiver_plugin.install(cyrano_server)

# Or get tools manually
from arkiver import get_arkiver_tools, handle_arkiver_tool_call
tools = get_arkiver_tools()  # Get 7 data extraction tools
result = handle_arkiver_tool_call("extract_conversations", {"file_path": "data.json"})
```

Available MCP tools:
- `extract_conversations` - Parse ChatGPT conversation JSON files
- `extract_text_content` - Extract content from text files  
- `categorize_with_keywords` - Categorize text using keyword matching
- `process_with_regex` - Process text with regex patterns
- `generate_categorized_files` - Create organized output files
- `run_extraction_pipeline` - Execute complete processing pipelines
- `create_arkiver_config` - Generate configuration files

See [MCP_INTEGRATION.md](MCP_INTEGRATION.md) for detailed integration guide.

## Architecture

### Core Components

1. **Data Extractors** (`arkiver/extractors.py`)
   - `ConversationExtractor`: Processes ChatGPT conversation JSON files
   - `TextFileExtractor`: Handles plain text files
   - Extensible registry system for adding new extractors

2. **Data Processors** (`arkiver/processors.py`)
   - `KeywordProcessor`: Matches text against keyword lists to categorize content
   - `RegexProcessor`: Uses regular expressions for pattern matching
   - Support for multiple processors per pipeline

3. **Output Handlers** (`arkiver/outputs.py`)
   - `TextFileOutput`: Creates organized text files by category
   - `JSONOutput`: Exports results as structured JSON
   - Configurable output formats and locations

4. **Configuration System** (`arkiver/config.py`)
   - JSON-based configuration
   - Default configuration generation
   - Environment-specific settings

5. **Core Engine** (`arkiver/core.py`)
   - Pipeline orchestration
   - Logging and statistics
   - Error handling and recovery

## Configuration

The system uses a JSON configuration file to define:

- **Data Sources**: What data to extract and how
- **Processors**: How to analyze and categorize the data
- **Outputs**: Where and how to save results
- **Logging**: Verbosity and output preferences
- **Security**: Cleanup and safety options

### Example Configuration Structure

```json
{
  "data_sources": {
    "conversations": {
      "type": "conversation_json",
      "path": "attached_assets/reformatted_conversations_1753336339888.json",
      "enabled": true
    }
  },
  "processors": {
    "keyword_matcher": {
      "type": "keyword",
      "config_path": "attached_assets/Projexts and Keywords_1753336389930.txt",
      "case_sensitive": false
    }
  },
  "outputs": {
    "text_files": {
      "type": "text_file",
      "output_dir": "output",
      "include_context": true
    }
  }
}
```

## Migration from Original Arkiver

The NewArkiver system is designed to be a drop-in replacement for the original `main.py` script:

### Compatibility

- ✅ **Same input files**: Uses existing conversation JSON and keyword files
- ✅ **Same output format**: Generates the same text file outputs
- ✅ **Enhanced features**: Adds configurability, modularity, and extensibility
- ✅ **Better error handling**: More robust processing with detailed logging

### Key Improvements

1. **Modular Design**: Each component is separate and testable
2. **Configuration-Driven**: No hardcoded paths or settings
3. **Extensible**: Easy to add new data types and processing methods
4. **Better Logging**: Comprehensive logging and statistics
5. **Type Safety**: Full type hints for better development experience
6. **Error Recovery**: Graceful handling of malformed data or missing files

## Extending the System

### Adding a New Data Extractor

```python
from arkiver.extractors import BaseExtractor, EXTRACTOR_REGISTRY

class MyExtractor(BaseExtractor):
    def extract(self):
        # Your extraction logic here
        yield {"type": "my_data", "content": "..."}
    
    def get_text_content(self, item):
        return item.get("content", "")

# Register your extractor
EXTRACTOR_REGISTRY["my_type"] = MyExtractor
```

### Adding a New Processor

```python
from arkiver.processors import BaseProcessor, PROCESSOR_REGISTRY

class MyProcessor(BaseProcessor):
    def setup(self):
        # Initialize your processor
        pass
    
    def process(self, item, text_content):
        # Your processing logic
        return {
            "processor": "my_processor",
            "results": [...],
            "has_matches": True
        }

PROCESSOR_REGISTRY["my_processor"] = MyProcessor
```

## Output Structure

### Text Files
- `{category}_messages.txt`: Messages categorized by project/topic
- `uncategorized_items.txt`: Items that didn't match any criteria

### JSON Output
- `extraction_results.json`: Complete results in structured format

## Legacy Support

The original `main.py` is preserved for reference, but all new development should use the NewArkiver system through `newarkiver.py`.

## Requirements

- Python 3.8+
- No external dependencies (uses only standard library)

## Development

### Project Structure
```
arkiver/
├── arkiver/              # Main package
│   ├── __init__.py      # Package initialization
│   ├── core.py          # Core extraction engine
│   ├── config.py        # Configuration management
│   ├── extractors.py    # Data extraction modules
│   ├── processors.py    # Data processing modules
│   └── outputs.py       # Output generation modules
├── newarkiver.py        # Main entry point
├── main.py              # Legacy script (preserved)
├── config.json          # Generated configuration
└── attached_assets/     # Data files
```

## Security

- Configurable output file cleanup
- No use of `eval()` for parsing (uses safe JSON parsing)
- Comprehensive input validation
- Secure file handling

## License

This project is part of the MightyPrytanis repository collection. See repository settings for license information.

---

*NewArkiver represents the successful merger of Arkiver's proven conversation analysis capabilities with modern, extensible data processing architecture.*