"""
Data extractors for different types of input data.
"""

import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Iterator

class BaseExtractor(ABC):
    """Base class for data extractors."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    @abstractmethod
    def extract(self) -> Iterator[Dict[str, Any]]:
        """Extract data items from the source."""
        pass
    
    @abstractmethod
    def get_text_content(self, item: Dict[str, Any]) -> str:
        """Extract text content from a data item."""
        pass

class ConversationExtractor(BaseExtractor):
    """Extractor for ChatGPT conversation JSON files."""
    
    def extract(self) -> Iterator[Dict[str, Any]]:
        """Extract conversations from JSON file."""
        file_path = self.config.get("path")
        if not file_path:
            raise ValueError("No path specified for conversation extractor")
        
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
    
    def _extract_text_from_message(self, message_data: Dict[str, Any]) -> str:
        """Extract text content from a message node."""
        if not message_data or not message_data.get('message'):
            return ""
        
        content = message_data['message'].get('content', {})
        if content.get('content_type') == 'text':
            parts = content.get('parts', [])
            return ' '.join(str(part) for part in parts if part)
        
        return ""
    
    def get_text_content(self, item: Dict[str, Any]) -> str:
        """Get all text content from a conversation."""
        if item.get("type") != "conversation":
            return ""
        
        messages = item.get("messages", [])
        return ' '.join([msg["text"] for msg in messages if msg.get("text")])

class TextFileExtractor(BaseExtractor):
    """Extractor for plain text files."""
    
    def extract(self) -> Iterator[Dict[str, Any]]:
        """Extract content from text file."""
        file_path = self.config.get("path")
        if not file_path:
            raise ValueError("No path specified for text file extractor")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        yield {
            "type": "text_file",
            "title": file_path.split("/")[-1],  # Just the filename
            "content": content,
            "raw_data": {"file_path": file_path}
        }
    
    def get_text_content(self, item: Dict[str, Any]) -> str:
        """Get text content from a text file item."""
        return item.get("content", "")

# Registry of available extractors
EXTRACTOR_REGISTRY = {
    "conversation_json": ConversationExtractor,
    "text_file": TextFileExtractor,
}