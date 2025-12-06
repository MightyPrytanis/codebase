"""
Core functionality for the Arkiver universal data extraction system.
"""

import logging
import os
from typing import List, Dict, Any

from .config import Config
from .extractors import EXTRACTOR_REGISTRY
from .processors import PROCESSOR_REGISTRY
from .outputs import OUTPUT_REGISTRY

class DataExtractor:
    """Main class for the universal data extraction system."""
    
    def __init__(self, config_path: str = None):
        """Initialize the data extractor with configuration."""
        self.config = Config(config_path)
        self._setup_logging()
        self.logger = logging.getLogger(__name__)
    
    def _setup_logging(self) -> None:
        """Set up logging configuration."""
        log_level = getattr(logging, self.config.get("logging.level", "INFO").upper())
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
        # Configure root logger
        logging.basicConfig(
            level=log_level,
            format=log_format,
            handlers=[]
        )
        
        # Console handler
        if self.config.get("logging.console", True):
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(logging.Formatter(log_format))
            logging.getLogger().addHandler(console_handler)
        
        # File handler (if specified)
        log_file = self.config.get("logging.file")
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(logging.Formatter(log_format))
            logging.getLogger().addHandler(file_handler)
    
    def extract_data(self) -> List[Dict[str, Any]]:
        """Extract data from all configured sources."""
        all_items = []
        
        for source_name, source_config in self.config.data_sources.items():
            self.logger.info(f"Extracting data from source: {source_name}")
            
            extractor_type = source_config.get("type")
            if extractor_type not in EXTRACTOR_REGISTRY:
                self.logger.error(f"Unknown extractor type: {extractor_type}")
                continue
            
            try:
                extractor_class = EXTRACTOR_REGISTRY[extractor_type]
                extractor = extractor_class(source_config)
                
                source_items = list(extractor.extract())
                self.logger.info(f"Extracted {len(source_items)} items from {source_name}")
                
                # Add source metadata
                for item in source_items:
                    item["source_name"] = source_name
                    item["source_config"] = source_config
                
                all_items.extend(source_items)
                
            except Exception as e:
                self.logger.error(f"Error extracting from {source_name}: {str(e)}")
                continue
        
        return all_items
    
    def process_data(self, extracted_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process extracted data through all configured processors."""
        processed_items = []
        
        for item in extracted_items:
            self.logger.debug(f"Processing item: {item.get('title', 'Untitled')}")
            
            # Get text content from the item
            source_config = item.get("source_config", {})
            extractor_type = source_config.get("type")
            
            if extractor_type in EXTRACTOR_REGISTRY:
                extractor_class = EXTRACTOR_REGISTRY[extractor_type]
                extractor = extractor_class(source_config)
                text_content = extractor.get_text_content(item)
            else:
                text_content = str(item)  # Fallback
            
            # Process through all configured processors
            processing_results = []
            
            for processor_name, processor_config in self.config.processors.items():
                processor_type = processor_config.get("type")
                
                if processor_type not in PROCESSOR_REGISTRY:
                    self.logger.error(f"Unknown processor type: {processor_type}")
                    continue
                
                try:
                    processor_class = PROCESSOR_REGISTRY[processor_type]
                    processor = processor_class(processor_config)
                    
                    result = processor.process(item, text_content)
                    result["processor_name"] = processor_name
                    processing_results.append(result)
                    
                except Exception as e:
                    self.logger.error(f"Error in processor {processor_name}: {str(e)}")
                    continue
            
            processed_items.append({
                "original_data": item,
                "text_content": text_content,
                "processing_results": processing_results
            })
        
        return processed_items
    
    def generate_outputs(self, processed_items: List[Dict[str, Any]]) -> List[str]:
        """Generate outputs from processed data."""
        all_output_files = []
        
        for output_name, output_config in self.config.outputs.items():
            self.logger.info(f"Generating output: {output_name}")
            
            output_type = output_config.get("type")
            if output_type not in OUTPUT_REGISTRY:
                self.logger.error(f"Unknown output type: {output_type}")
                continue
            
            try:
                output_class = OUTPUT_REGISTRY[output_type]
                output_handler = output_class(output_config)
                
                output_files = output_handler.write_results(processed_items)
                all_output_files.extend(output_files)
                
                self.logger.info(f"Created {len(output_files)} output files for {output_name}")
                
            except Exception as e:
                self.logger.error(f"Error generating output {output_name}: {str(e)}")
                continue
        
        return all_output_files
    
    def run(self) -> Dict[str, Any]:
        """Run the complete data extraction pipeline."""
        self.logger.info("Starting data extraction pipeline")
        
        # Extract data
        extracted_items = self.extract_data()
        
        if not extracted_items:
            self.logger.warning("No data extracted from sources")
            return {
                "success": False,
                "message": "No data extracted",
                "output_files": []
            }
        
        # Process data
        processed_items = self.process_data(extracted_items)
        
        # Generate summary statistics
        stats = self._generate_statistics(processed_items)
        self.logger.info(f"Processing complete. Stats: {stats}")
        
        # Generate outputs
        output_files = self.generate_outputs(processed_items)
        
        # Handle security cleanup if configured
        if self.config.get("security.prompt_delete_outputs", False):
            self._handle_security_cleanup(output_files)
        
        return {
            "success": True,
            "statistics": stats,
            "output_files": output_files
        }
    
    def _generate_statistics(self, processed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate processing statistics."""
        total_items = len(processed_items)
        categorized_items = 0
        uncategorized_items = 0
        
        categories = set()
        projects = set()
        
        for item in processed_items:
            has_matches = False
            
            for result in item.get("processing_results", []):
                if result.get("has_matches", False):
                    has_matches = True
                    projects.update(result.get("projects", []))
                    categories.update(result.get("categories", []))
            
            if has_matches:
                categorized_items += 1
            else:
                uncategorized_items += 1
        
        return {
            "total_items": total_items,
            "categorized_items": categorized_items,
            "uncategorized_items": uncategorized_items,
            "unique_projects": len(projects),
            "unique_categories": len(categories),
            "projects": sorted(list(projects)),
            "categories": sorted(list(categories))
        }
    
    def _handle_security_cleanup(self, output_files: List[str]) -> None:
        """Handle security cleanup of output files."""
        try:
            delete_files = input("\nDelete output files for security? (y/N): ").lower().strip()
            if delete_files == 'y':
                for filepath in output_files:
                    try:
                        os.remove(filepath)
                        self.logger.info(f"Deleted: {filepath}")
                    except FileNotFoundError:
                        pass
                self.logger.info("Output files deleted for security.")
        except (EOFError, KeyboardInterrupt):
            self.logger.info("Security cleanup skipped.")