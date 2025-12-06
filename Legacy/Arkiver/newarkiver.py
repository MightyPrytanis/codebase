#!/usr/bin/env python3
"""
NewArkiver - Universal Data Extraction System
===============================================

A modern, modular replacement for the original Arkiver that supports
universal data extraction and processing with configurable pipelines.

This merges the concepts of Arkiver (conversation analysis) with 
NewArkiver (universal data extraction) to create a single, powerful
and extensible data processing system.
"""

import sys
import argparse
from arkiver import DataExtractor

def main():
    """Main entry point for NewArkiver."""
    parser = argparse.ArgumentParser(
        description="NewArkiver - Universal Data Extraction System",
        epilog="For detailed configuration options, see the generated config.json file."
    )
    
    parser.add_argument(
        "-c", "--config",
        default=None,
        help="Path to configuration file (default: config.json)"
    )
    
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    parser.add_argument(
        "--version",
        action="version",
        version="NewArkiver 2.0.0 - Universal Data Extraction System"
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize the data extractor
        extractor = DataExtractor(config_path=args.config)
        
        # Override logging level if verbose requested
        if args.verbose:
            import logging
            logging.getLogger().setLevel(logging.DEBUG)
        
        print("=== NewArkiver - Universal Data Extraction System ===")
        print("Merging Arkiver + NewArkiver concepts into a unified system")
        print()
        
        # Run the extraction pipeline
        results = extractor.run()
        
        if results["success"]:
            stats = results["statistics"]
            output_files = results["output_files"]
            
            print("=== PROCESSING COMPLETE ===")
            print("Created the following output files:")
            for filepath in output_files:
                print(f"  - {filepath}")
            
            print(f"\n=== STATISTICS ===")
            print(f"Total items processed: {stats['total_items']}")
            print(f"Categorized items: {stats['categorized_items']}")
            print(f"Uncategorized items: {stats['uncategorized_items']}")
            
            if stats['projects']:
                print(f"\n=== PROJECTS/CATEGORIES FOUND ===")
                for project in stats['projects']:
                    print(f"  - {project}")
            
            print(f"\nTotal unique projects/categories: {stats['unique_projects']}")
            
        else:
            print(f"Processing failed: {results.get('message', 'Unknown error')}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nProcessing interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()