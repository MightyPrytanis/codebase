"""
Data processors for analyzing and categorizing extracted content.
"""

import json
import re
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Dict, Any, Set, List

class BaseProcessor(ABC):
    """Base class for data processors."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.setup()
    
    @abstractmethod
    def setup(self) -> None:
        """Set up the processor with its configuration."""
        pass
    
    @abstractmethod
    def process(self, item: Dict[str, Any], text_content: str) -> Dict[str, Any]:
        """Process a data item and return analysis results."""
        pass

class KeywordProcessor(BaseProcessor):
    """Processor that matches keywords to categorize content."""
    
    def setup(self) -> None:
        """Load keywords from configuration file."""
        # Initialize case sensitivity first
        self.case_sensitive = self.config.get("case_sensitive", False)
        
        config_path = self.config.get("config_path")
        if not config_path:
            raise ValueError("No config_path specified for keyword processor")
        
        self.keyword_to_project = self._load_keywords(config_path)
    
    def _load_keywords(self, config_path: str) -> Dict[str, str]:
        """Load keywords and their associated projects."""
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse the JSON-like structure - using json.loads for safety
        try:
            keywords_data = json.loads(content)
        except json.JSONDecodeError:
            # Fallback to eval for the existing format (not recommended for production)
            keywords_data = eval(content)
        
        # Create a mapping from keywords to projects
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
        
        # For conversation types, also analyze individual messages
        detailed_matches = []
        if item.get("type") == "conversation":
            detailed_matches = self._analyze_conversation_messages(item)
            # Update found projects with message-level matches
            for match in detailed_matches:
                found_projects.update(match.get("projects", []))
        
        return {
            "processor": "keyword",
            "projects": list(found_projects),
            "matched_keywords": matched_keywords,
            "detailed_matches": detailed_matches,
            "has_matches": len(found_projects) > 0
        }
    
    def _analyze_conversation_messages(self, conversation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze individual messages in a conversation."""
        messages = conversation.get("messages", [])
        detailed_matches = []
        
        for i, message in enumerate(messages):
            text = message.get("text", "")
            if not self.case_sensitive:
                text = text.lower()
            
            projects = set()
            for keyword, project in self.keyword_to_project.items():
                if keyword in text:
                    projects.add(project)
            
            if projects:
                # Get context messages (previous and next)
                context_messages = []
                
                # Previous message (if exists)
                if i > 0:
                    prev_text = messages[i-1].get("text", "")
                    prev_has_matches = any(kw in (prev_text.lower() if not self.case_sensitive else prev_text) 
                                          for kw in self.keyword_to_project.keys())
                    if not prev_has_matches:
                        context_messages.append(f"PREVIOUS: {prev_text}")
                
                # Current message
                context_messages.append(f"MATCH: {message.get('text', '')}")
                
                # Next message (if exists)
                if i < len(messages) - 1:
                    next_text = messages[i+1].get("text", "")
                    next_has_matches = any(kw in (next_text.lower() if not self.case_sensitive else next_text) 
                                          for kw in self.keyword_to_project.keys())
                    if not next_has_matches:
                        context_messages.append(f"NEXT: {next_text}")
                
                detailed_matches.append({
                    "message_index": i,
                    "projects": list(projects),
                    "context": "\n\n".join(context_messages)
                })
        
        return detailed_matches

class RegexProcessor(BaseProcessor):
    """Processor that uses regular expressions for pattern matching."""
    
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

# Registry of available processors
PROCESSOR_REGISTRY = {
    "keyword": KeywordProcessor,
    "regex": RegexProcessor,
}