"""
Delphi Adapter for Potemkin Argument Parser
Provides Python interface to Delphi moral reasoning model
"""

import requests
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
import yaml


@dataclass
class DelphiResponse:
    """Structured response from Delphi API"""
    query: str
    judgment: str
    confidence: float
    reasoning: Optional[str] = None


class DelphiAdapter:
    """
    Adapter for integrating Delphi moral reasoning into Potemkin
    """
    
    def __init__(self, config_path: str = "delphi_config.yaml"):
        """Initialize adapter with configuration"""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.api_url = self.config['delphi']['api_url']
        self.timeout = self.config['delphi']['timeout']
        self.confidence_threshold = self.config['delphi']['confidence_threshold']
    
    def analyze_argument(self, argument_text: str) -> DelphiResponse:
        """
        Analyze a legal/ethical argument using Delphi
        
        Args:
            argument_text: The argument or claim to analyze
            
        Returns:
            DelphiResponse with judgment and confidence
        """
        try:
            payload = {
                "query": argument_text,
                "format": "structured"
            }
            
            response = requests.post(
                f"{self.api_url}/query",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            data = response.json()
            
            return DelphiResponse(
                query=argument_text,
                judgment=data.get('judgment', 'unknown'),
                confidence=data.get('confidence', 0.0),
                reasoning=data.get('reasoning')
            )
            
        except requests.exceptions.RequestException as e:
            print(f"Error querying Delphi API: {e}")
            return DelphiResponse(
                query=argument_text,
                judgment="error",
                confidence=0.0,
                reasoning=str(e)
            )
    
    def batch_analyze(self, arguments: List[str]) -> List[DelphiResponse]:
        """
        Analyze multiple arguments in batch
        
        Args:
            arguments: List of argument texts
            
        Returns:
            List of DelphiResponse objects
        """
        return [self.analyze_argument(arg) for arg in arguments]
    
    def is_confident(self, response: DelphiResponse) -> bool:
        """Check if response meets confidence threshold"""
        return response.confidence >= self.confidence_threshold
    
    def format_for_potemkin(self, response: DelphiResponse) -> Dict:
        """
        Format Delphi response for Potemkin pipeline
        
        Returns:
            Dictionary compatible with Potemkin's argument structure
        """
        return {
            "parser": "delphi",
            "original_text": response.query,
            "moral_judgment": response.judgment,
            "confidence_score": response.confidence,
            "reasoning": response.reasoning,
            "meets_threshold": self.is_confident(response),
            "metadata": {
                "parser_version": self.config['delphi']['version'],
                "api_endpoint": self.api_url
            }
        }


# Example usage
if __name__ == "__main__":
    adapter = DelphiAdapter()
    
    test_argument = "A lawyer should disclose client confidences if doing so prevents substantial harm to others."
    
    result = adapter.analyze_argument(test_argument)
    formatted = adapter.format_for_potemkin(result)
    
    print(json.dumps(formatted, indent=2))
