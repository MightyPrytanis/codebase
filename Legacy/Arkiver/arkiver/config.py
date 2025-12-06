"""
Configuration management for the Arkiver system.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

class Config:
    """Configuration manager for Arkiver."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize config from file or defaults."""
        self.config_path = config_path or self._get_default_config_path()
        self._config = self._load_config()
    
    def _get_default_config_path(self) -> str:
        """Get the default configuration file path."""
        return "config.json"
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file or create defaults."""
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return self._create_default_config()
    
    def _create_default_config(self) -> Dict[str, Any]:
        """Create default configuration."""
        default_config = {
            "version": "2.0.0",
            "data_sources": {
                "conversations": {
                    "type": "conversation_json",
                    "path": "attached_assets/reformatted_conversations_1753336339888.json",
                    "enabled": True
                }
            },
            "processors": {
                "keyword_matcher": {
                    "type": "keyword",
                    "config_path": "attached_assets/Projexts and Keywords_1753336389930.txt",
                    "enabled": True,
                    "case_sensitive": False
                }
            },
            "outputs": {
                "text_files": {
                    "type": "text_file",
                    "enabled": True,
                    "output_dir": "output",
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
                "prompt_delete_outputs": True
            }
        }
        
        # Save default config
        self.save_config(default_config)
        return default_config
    
    def save_config(self, config: Optional[Dict[str, Any]] = None) -> None:
        """Save configuration to file."""
        config_to_save = config or self._config
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(config_to_save, f, indent=2, ensure_ascii=False)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key."""
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any) -> None:
        """Set configuration value by key."""
        keys = key.split('.')
        config = self._config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
    
    @property
    def data_sources(self) -> Dict[str, Any]:
        """Get enabled data sources."""
        sources = self.get("data_sources", {})
        return {k: v for k, v in sources.items() if v.get("enabled", True)}
    
    @property
    def processors(self) -> Dict[str, Any]:
        """Get enabled processors."""
        processors = self.get("processors", {})
        return {k: v for k, v in processors.items() if v.get("enabled", True)}
    
    @property
    def outputs(self) -> Dict[str, Any]:
        """Get enabled outputs."""
        outputs = self.get("outputs", {})
        return {k: v for k, v in outputs.items() if v.get("enabled", True)}