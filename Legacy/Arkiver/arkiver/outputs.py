"""
Output handlers for processed data.
"""

import os
import json
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Dict, Any, List
from pathlib import Path

class BaseOutput(ABC):
    """Base class for output handlers."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.setup()
    
    @abstractmethod
    def setup(self) -> None:
        """Set up the output handler."""
        pass
    
    @abstractmethod
    def write_results(self, processed_items: List[Dict[str, Any]]) -> List[str]:
        """Write processed results to output. Returns list of created files."""
        pass

class TextFileOutput(BaseOutput):
    """Output handler that writes results to text files."""
    
    def setup(self) -> None:
        """Set up output directory."""
        self.output_dir = self.config.get("output_dir", "output")
        self.include_uncategorized = self.config.get("include_uncategorized", True)
        self.include_context = self.config.get("include_context", True)
        
        # Create output directory if it doesn't exist
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def write_results(self, processed_items: List[Dict[str, Any]]) -> List[str]:
        """Write results to separate text files by project/category."""
        # Organize data by projects/categories
        categorized_data = defaultdict(list)
        uncategorized_data = []
        
        for item in processed_items:
            original_data = item.get("original_data", {})
            processing_results = item.get("processing_results", [])
            
            # Find projects from all processors
            all_projects = set()
            has_matches = False
            
            for result in processing_results:
                if result.get("has_matches", False):
                    has_matches = True
                    projects = result.get("projects", [])
                    categories = result.get("categories", [])
                    all_projects.update(projects)
                    all_projects.update(categories)
            
            if has_matches:
                for project in all_projects:
                    categorized_data[project].append({
                        "original_data": original_data,
                        "processing_results": processing_results
                    })
            else:
                uncategorized_data.append({
                    "original_data": original_data,
                    "processing_results": processing_results
                })
        
        created_files = []
        
        # Write categorized results
        for project, items in categorized_data.items():
            filename = self._get_safe_filename(f"{project}_messages.txt")
            filepath = os.path.join(self.output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"=== {project.upper()} MESSAGES ===\\n")
                f.write(f"Total items: {len(items)}\\n\\n")
                
                for i, item_data in enumerate(items, 1):
                    self._write_item(f, i, item_data, project)
            
            created_files.append(filepath)
        
        # Write uncategorized results if enabled
        if self.include_uncategorized and uncategorized_data:
            filename = "uncategorized_items.txt"
            filepath = os.path.join(self.output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("=== UNCATEGORIZED ITEMS ===\\n")
                f.write(f"Found {len(uncategorized_data)} items without matching criteria:\\n\\n")
                
                for item_data in uncategorized_data:
                    original = item_data["original_data"]
                    title = original.get("title", "Untitled")
                    f.write(f"- {title}\\n")
                    
                    # Write preview for conversations
                    if original.get("type") == "conversation":
                        preview = self._get_conversation_preview(original)
                        if preview:
                            f.write(f"  Preview: {preview}\\n")
                    elif original.get("type") == "text_file":
                        content = original.get("content", "")
                        preview = content[:200] + "..." if len(content) > 200 else content
                        f.write(f"  Preview: {preview}\\n")
                    
                    f.write("\\n")
            
            created_files.append(filepath)
        
        return created_files
    
    def _write_item(self, file_handle, item_number: int, item_data: Dict[str, Any], current_project: str) -> None:
        """Write a single item to the file."""
        original = item_data["original_data"]
        processing_results = item_data["processing_results"]
        
        title = original.get("title", "Untitled")
        file_handle.write(f"=== Item {item_number}: {title} ===\\n")
        
        # Write cross-project information
        all_projects = set()
        for result in processing_results:
            all_projects.update(result.get("projects", []))
            all_projects.update(result.get("categories", []))
        
        other_projects = [p for p in all_projects if p != current_project]
        if other_projects:
            file_handle.write(f"Also matches: {', '.join(other_projects)}\\n")
        else:
            file_handle.write("Only matches this category\\n")
        
        # Write detailed context for conversations
        if self.include_context and original.get("type") == "conversation":
            self._write_conversation_context(file_handle, processing_results)
        
        file_handle.write("\\n")  # Empty line between items
    
    def _write_conversation_context(self, file_handle, processing_results: List[Dict[str, Any]]) -> None:
        """Write conversation context from keyword processor results."""
        for result in processing_results:
            if result.get("processor") == "keyword":
                detailed_matches = result.get("detailed_matches", [])
                if detailed_matches:
                    file_handle.write("Context:\\n")
                    for match in detailed_matches:
                        context = match.get("context", "")
                        for line in context.split("\\n"):
                            file_handle.write(f"  {line}\\n")
                        file_handle.write("\\n")  # Empty line between matches
    
    def _get_conversation_preview(self, conversation: Dict[str, Any]) -> str:
        """Get a preview of conversation content."""
        messages = conversation.get("messages", [])
        if not messages:
            return ""
        
        all_text = " ".join([msg.get("text", "") for msg in messages])
        return all_text[:200] + "..." if len(all_text) > 200 else all_text
    
    def _get_safe_filename(self, filename: str) -> str:
        """Get a filesystem-safe filename."""
        # Replace spaces and special characters
        safe_name = filename.lower().replace(" ", "_")
        # Remove any remaining unsafe characters
        safe_chars = "abcdefghijklmnopqrstuvwxyz0123456789_-."
        return "".join(c for c in safe_name if c in safe_chars)

class JSONOutput(BaseOutput):
    """Output handler that writes results to JSON files."""
    
    def setup(self) -> None:
        """Set up JSON output configuration."""
        self.output_dir = self.config.get("output_dir", "output")
        self.pretty_print = self.config.get("pretty_print", True)
        
        # Create output directory if it doesn't exist
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def write_results(self, processed_items: List[Dict[str, Any]]) -> List[str]:
        """Write results to JSON file."""
        filename = "extraction_results.json"
        filepath = os.path.join(self.output_dir, filename)
        
        # Prepare data for JSON serialization
        json_data = {
            "version": "2.0.0",
            "total_items": len(processed_items),
            "results": processed_items
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            if self.pretty_print:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
            else:
                json.dump(json_data, f, ensure_ascii=False)
        
        return [filepath]

# Registry of available outputs
OUTPUT_REGISTRY = {
    "text_file": TextFileOutput,
    "json": JSONOutput,
}