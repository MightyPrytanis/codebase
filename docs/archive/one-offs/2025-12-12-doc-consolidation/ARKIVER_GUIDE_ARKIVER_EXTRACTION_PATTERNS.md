---
Document ID: ARKIVER-PATTERNS
Title: Arkiver Extraction Patterns
Subject(s): Arkiver
Project: Cyrano
Version: v548
Created: 2025-11-24 (2025-W48)
Last Substantive Revision: 2025-11-24 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Created:** 2025-11-24  
**Source:** `/Users/davidtowne/Desktop/Coding/codebase/Legacy/Arkiver/` (formerly Labs/Arkiver, moved to Legacy)  
**Purpose:** Document reusable extraction patterns from Python Arkiver for TypeScript Cyrano integration. **Note:** Python Arkiver is archived in Legacy. TypeScript implementations are in `Cyrano/src/modules/arkiver/extractors/`.

---

## Overview

The Python Arkiver system provides proven extraction and processing patterns that can be adapted for Cyrano's TypeScript implementation. This document catalogs reusable patterns, their implementations, and adaptation strategies.

---

## Pattern 1: Conversation JSON Extractor

### Source
**File:** `arkiver/extractors.py` (lines 26-79)  
**Class:** `ConversationExtractor`

### What It Does
Extracts structured conversation data from ChatGPT conversation JSON exports:
- Parses conversation metadata (title, timestamps)
- Extracts message nodes from conversation mapping
- Handles nested message structures
- Provides full-text content extraction

### Implementation Pattern
```python
def extract(self) -> Iterator[Dict[str, Any]]:
    """Extract conversations from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        conversations = json.load(f)
    
    for conversation in conversations:
        yield {
            "type": "conversation",
            "title": conversation.get("title", "Untitled"),
            "create_time": conversation.get("create_time"),
            "update_time": conversation.get("update_time"),
            "messages": self._extract_messages(conversation.get("mapping", {})),
            "raw_data": conversation
        }

def _extract_messages(self, mapping: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract messages from conversation mapping."""
    messages = []
    for node_id, node_data in mapping.items():
        text = self._extract_text_from_message(node_data)
        if text.strip():
            messages.append({
                "node_id": node_id,
                "text": text,
                "metadata": node_data
            })
    return messages
```

### TypeScript Adaptation
**Target Location:** `src/modules/arkiver/extractors/conversation-extractor.ts` ✅ **IMPLEMENTED**

**Implementation Status:** ✅ **COMPLETE**

**Features Implemented:**
- TypeScript interfaces for conversation structure (`ExtractedConversation`, `ExtractedMessage`)
- Async Promise-based extraction (replaces Python Iterator)
- Uses `fs/promises.readFile` for async file reading
- Zod schema validation for ChatGPT JSON format
- Auto-detection of conversation format (ChatGPT, Claude, or text/markdown)
- Support for multiple conversation formats:
  - ChatGPT JSON (with mapping structure)
  - Claude format (Human/Assistant markers)
  - Plain text and markdown formats
- Title filtering support
- Full text extraction option

**Dependencies:**
- Node.js `fs/promises` ✅
- Zod for validation ✅
- TypeScript `Promise<Array<T>>` ✅

**Integration Points:**
- ✅ Integrated with `arkiver-mcp-tools.ts` for file processing
- ✅ Integrated with `arkiver-tools.ts` for MCP tool interface
- Can feed into existing `textProcessor` for content analysis
- Can feed into `insightProcessor` for conversation insights
- Can feed into `entityProcessor` for extracting people/topics

---

## Pattern 2: Text File Extractor

### Source
**File:** `arkiver/extractors.py` (lines 82-107)  
**Class:** `TextFileExtractor`

### What It Does
Simple but robust plain text file extraction:
- Reads entire file content
- Preserves original formatting
- Provides metadata (filename, path)
- Handles encoding properly

### Implementation Pattern
```python
def extract(self) -> Iterator[Dict[str, Any]]:
    """Extract content from text file."""
    file_path = self.config.get("path")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    yield {
        "type": "text_file",
        "title": file_path.split("/")[-1],
        "content": content,
        "raw_data": {"file_path": file_path}
    }

def get_text_content(self, item: Dict[str, Any]) -> str:
    """Get text content from a text file item."""
    return item.get("content", "")
```

### TypeScript Adaptation
**Target Location:** `src/modules/arkiver/extractors/text-extractor.ts` ✅ **IMPLEMENTED**

**Implementation Status:** ✅ **COMPLETE**

**Features Implemented:**
- Text file extraction with metadata (file size, encoding, line/word/character counts)
- Markdown structure extraction (headings, paragraphs)
- Plain text file handling
- UTF-8 encoding support

**Notes:**
- Current TypeScript `text-extractor.ts` handles this use case
- Could enhance with streaming for large files
- Add file type detection (MIME type)
- Add encoding detection/conversion

---

## Pattern 3: Keyword Processor

### Source
**File:** `arkiver/processors.py` (lines 22-120)  
**Class:** `KeywordProcessor`

### What It Does
Sophisticated keyword-based categorization:
- Loads keyword-to-category mappings from config
- Matches keywords in text (case-sensitive or not)
- Categorizes content by matched keywords
- Provides detailed match information with context
- For conversations, analyzes individual messages

### Implementation Pattern
```python
def _load_keywords(self, config_path: str) -> Dict[str, str]:
    """Load keywords and their associated projects."""
    with open(config_path, 'r') as f:
        keywords_data = json.loads(f.read())
    
    # Create mapping from keywords to projects
    keyword_to_project = {}
    for project, keywords in keywords_data.items():
        for keyword in keywords:
            key = keyword if self.case_sensitive else keyword.lower()
            keyword_to_project[key] = project
    
    return keyword_to_project

def process(self, item: Dict[str, Any], text_content: str) -> Dict[str, Any]:
    """Process item to find matching keywords and projects."""
    if not self.case_sensitive:
        text_content = text_content.lower()
    
    found_projects = set()
    matched_keywords = []
    
    for keyword, project in self.keyword_to_project.items():
        if keyword in text_content:
            found_projects.add(project)
            matched_keywords.append(keyword)
    
    return {
        "processor": "keyword",
        "projects": list(found_projects),
        "matched_keywords": matched_keywords,
        "has_matches": len(found_projects) > 0
    }
```

### TypeScript Adaptation
**Target Location:** `src/modules/arkiver/processors/keyword-processor.ts` (new file)

**Adaptation Notes:**
- Create new processor following existing processor patterns
- Use Map<string, string> for keyword-to-category mapping
- Support multiple matching strategies (exact, fuzzy, regex)
- Add weighting/scoring for keyword importance
- Integrate with existing `insightProcessor` for pattern detection

**Dependencies:**
- Zod for config schema
- Node.js `fs/promises` for loading config
- Consider `fuse.js` for fuzzy matching (optional)

**Integration Points:**
- Output can feed into database as categorization metadata
- Can enhance `insightProcessor` with keyword-based insights
- Useful for legal document categorization (case types, topics)

---

## Pattern 4: Regex Processor

### Source
**File:** `arkiver/processors.py` (lines 138-173)  
**Class:** `RegexProcessor`

### What It Does
Pattern-based text processing using regex:
- Compiles regex patterns from config
- Supports multiple patterns per category
- Case-sensitive/insensitive matching
- Returns all matches with categories

### Implementation Pattern
```python
def setup(self) -> None:
    """Set up regex patterns from configuration."""
    patterns = self.config.get("patterns", {})
    self.compiled_patterns = {}
    
    flags = re.IGNORECASE if not self.config.get("case_sensitive", False) else 0
    
    for category, pattern in patterns.items():
        self.compiled_patterns[category] = re.compile(pattern, flags)

def process(self, item: Dict[str, Any], text_content: str) -> Dict[str, Any]:
    """Process item using regex patterns."""
    matches = {}
    found_categories = set()
    
    for category, pattern in self.compiled_patterns.items():
        category_matches = pattern.findall(text_content)
        if category_matches:
            matches[category] = category_matches
            found_categories.add(category)
    
    return {
        "processor": "regex",
        "categories": list(found_categories),
        "matches": matches,
        "has_matches": len(found_categories) > 0
    }
```

### TypeScript Adaptation
**Target Location:** `src/modules/arkiver/processors/regex-processor.ts` (new file)

**Adaptation Notes:**
- Use TypeScript native RegExp with compiled patterns
- Add pattern validation at config load time
- Support named capture groups for structured extraction
- Add timeout protection for complex patterns (ReDoS prevention)
- Cache compiled patterns for performance

**Dependencies:**
- Native TypeScript RegExp
- Zod for pattern config validation
- Consider `safe-regex` package for ReDoS detection

**Integration Points:**
- Useful for extracting structured data (dates, case numbers, statute citations)
- Can enhance `entityProcessor` with custom entity patterns
- Complements existing Michigan citation validator

---

## Pattern 5: Message Context Extraction

### Source
**File:** `arkiver/processors.py` (lines 99-135)  
**Method:** `_analyze_conversation_messages` in `KeywordProcessor`

### What It Does
Extracts messages with surrounding context:
- Analyzes individual messages in conversations
- Provides previous/next message context
- Only includes context if it's not already a match
- Creates structured context blocks

### Implementation Pattern
```python
def _analyze_conversation_messages(self, conversation: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Analyze individual messages in a conversation."""
    messages = conversation.get("messages", [])
    detailed_matches = []
    
    for i, message in enumerate(messages):
        text = message.get("text", "")
        # ... check for matches ...
        
        if projects:
            context_messages = []
            
            # Previous message (if exists and not a match itself)
            if i > 0:
                prev_text = messages[i-1].get("text", "")
                if not has_keywords(prev_text):
                    context_messages.append(f"PREVIOUS: {prev_text}")
            
            # Current message
            context_messages.append(f"MATCH: {text}")
            
            # Next message (if exists and not a match itself)
            if i < len(messages) - 1:
                next_text = messages[i+1].get("text", "")
                if not has_keywords(next_text):
                    context_messages.append(f"NEXT: {next_text}")
            
            detailed_matches.append({
                "message_index": i,
                "projects": list(projects),
                "context": "\\n\\n".join(context_messages)
            })
    
    return detailed_matches
```

### TypeScript Adaptation
**Target Location:** Can be integrated into `conversation-extractor.ts` or `insight-processor.ts`

**Adaptation Notes:**
- Create generic context extraction utility
- Support configurable context window (N messages before/after)
- Add smart truncation for very long context
- Integrate with existing `InsightProcessor` for richer insights

**Dependencies:**
- No external dependencies needed
- Uses existing TypeScript array methods

**Integration Points:**
- Enhances conversation analysis in Arkiver
- Useful for legal deposition/interview transcripts
- Can improve insight quality with surrounding context

---

## Pattern 6: Extractor Registry Pattern

### Source
**File:** `arkiver/extractors.py` (lines 105-109)  
**File:** `arkiver/processors.py` (lines 171-173)

### What It Does
Provides pluggable architecture for extractors/processors:
- Central registry of available components
- Easy addition of new extractors/processors
- Type-safe lookup by string keys
- Follows plugin pattern

### Implementation Pattern
```python
# Registry of available extractors
EXTRACTOR_REGISTRY = {
    "conversation_json": ConversationExtractor,
    "text_file": TextFileExtractor,
}

# Registry of available processors
PROCESSOR_REGISTRY = {
    "keyword": KeywordProcessor,
    "regex": RegexProcessor,
}

# Usage:
extractor_class = EXTRACTOR_REGISTRY.get(extractor_type)
if extractor_class:
    extractor = extractor_class(config)
    for item in extractor.extract():
        process(item)
```

### TypeScript Adaptation
**Target Location:** `src/modules/arkiver/extractors/index.ts` and `src/modules/arkiver/processors/index.ts`

**Adaptation Notes:**
- Use TypeScript Map or object with proper typing
- Add factory functions for instantiation
- Support lazy loading of processors (optional)
- Add runtime validation of registered components
- Create base interfaces for type safety

**Dependencies:**
- No external dependencies
- Pure TypeScript patterns

**Integration Points:**
- Already partially implemented in existing processor exports
- Can formalize into a proper registry system
- Enables dynamic processor/extractor configuration

---

## Pattern 7: Iterator-Based Extraction

### Source
**File:** `arkiver/extractors.py` (all extractor classes)  
**Pattern:** `extract() -> Iterator[Dict[str, Any]]`

### What It Does
Memory-efficient streaming extraction:
- Uses Python generators/iterators
- Processes one item at a time
- No need to load entire dataset into memory
- Enables pipeline processing

### Implementation Pattern
```python
def extract(self) -> Iterator[Dict[str, Any]]:
    """Extract data items from the source."""
    for item in large_dataset:
        # Process item
        yield {
            "type": "data_item",
            "content": process(item),
            "metadata": get_metadata(item)
        }
```

### TypeScript Adaptation
**Target Location:** All extractor implementations

**Adaptation Notes:**
- Use TypeScript async generators: `async function* extract()`
- Or use Node.js streams for very large datasets
- Return `AsyncIterableIterator<ExtractedItem>`
- Add backpressure handling for streams
- Consider batch processing for efficiency

**Dependencies:**
- Native TypeScript async generators
- Optional: Node.js `stream` module for large files

**Integration Points:**
- Can integrate with existing queue system
- Enables real-time processing pipelines
- Useful for large document processing

---

## Pattern 8: Configuration-Driven Processing

### Source
**File:** `arkiver/config.py` and all component files  
**Pattern:** JSON-based configuration with defaults

### What It Does
Flexible, externalized configuration:
- JSON configuration files for all components
- Default configuration generation
- Environment-specific overrides
- Type-safe config parsing

### Implementation Pattern
```python
# Load configuration
with open(config_path, 'r') as f:
    config = json.load(f)

# Access with defaults
output_dir = config.get("output_dir", "output")
case_sensitive = config.get("case_sensitive", False)

# Component-specific config
for name, processor_config in config.get("processors", {}).items():
    processor_type = processor_config.get("type")
    processor = PROCESSOR_REGISTRY[processor_type](processor_config)
```

### TypeScript Adaptation
**Target Location:** Throughout Arkiver module

**Adaptation Notes:**
- Use Zod schemas for config validation
- Support environment variable overrides
- Add config validation at load time
- Support JSON5 or YAML for better readability
- Add config hot-reloading (optional)

**Dependencies:**
- Zod (already in use)
- Optional: `dotenv` for env vars
- Optional: `json5` or `js-yaml` for enhanced formats

**Integration Points:**
- Integrate with existing schema system
- Can use database for persistent config
- Environment-specific configs for dev/staging/prod

---

## Adaptation Priority Matrix

### High Priority (Implement First)
1. ✅ **Text File Extractor** - Already implemented
2. **Conversation JSON Extractor** - Valuable for chat/conversation data
3. **Keyword Processor** - Enables content categorization
4. **Registry Pattern** - Improves extensibility

### Medium Priority
5. **Regex Processor** - Useful for structured extraction
6. **Message Context Extraction** - Enhances conversation analysis
7. **Iterator-Based Extraction** - Memory efficiency for large datasets

### Low Priority (Nice to Have)
8. **Configuration-Driven Processing** - Already partially implemented

---

## Implementation Checklist

### For Each Pattern:
- [ ] Review Python implementation
- [ ] Define TypeScript interfaces/types
- [ ] Create Zod validation schemas
- [ ] Implement core logic
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Document usage examples
- [ ] Integrate with existing processors
- [ ] Add to processor/extractor registry

---

## Dependencies Summary

### Required
- `zod` - Input validation (already installed)
- `fs/promises` - File I/O (Node.js built-in)
- TypeScript native features (RegExp, generators, Maps)

### Optional
- `fuse.js` - Fuzzy keyword matching
- `safe-regex` - ReDoS protection
- `json5` or `js-yaml` - Enhanced config formats
- `dotenv` - Environment configuration

---

## Integration Strategy

### Phase 1: Core Extractors
1. Implement Conversation JSON Extractor
2. Enhance existing Text File Extractor
3. Create extractor registry system

### Phase 2: Processors
1. Implement Keyword Processor
2. Implement Regex Processor
3. Add message context extraction

### Phase 3: Infrastructure
1. Formalize registry patterns
2. Add configuration management
3. Implement streaming extraction (if needed)

### Phase 4: Integration
1. Connect extractors to queue system
2. Add MCP tool wrappers
3. Create end-to-end pipelines
4. Document usage patterns

---

## Notes

- Python Arkiver has proven these patterns in production use
- All patterns are well-documented in source
- Most patterns map cleanly to TypeScript/Node.js
- Consider performance implications of async operations
- Maintain compatibility with existing Cyrano processors

---

**Last Updated:** 2025-11-24  
**Status:** Documentation complete, ready for implementation  
**Python Source:** `/Users/davidtowne/Desktop/Coding/codebase/Labs/Arkiver/`  
**TypeScript Target:** `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/src/modules/arkiver/`
