---
Document ID: TESTING-GUIDE
Title: NewArkiver Testing Guide
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

## Testing with Your Own Documents

### Quick Test with Text Files

1. **Create a test document:**
   ```bash
   echo "This is a test about Mac troubleshooting and VPN setup on ASUS routers." > my_test.txt
   ```

2. **Create a custom configuration:**
   ```json
   {
     "data_sources": {
       "my_test": {
         "type": "text_file", 
         "path": "my_test.txt",
         "enabled": true
       }
     },
     "processors": {
       "keyword_matcher": {
         "type": "keyword",
         "config_path": "attached_assets/Projexts and Keywords_1753336389930.txt",
         "enabled": true,
         "case_sensitive": false
       }
     },
     "outputs": {
       "text_files": {
         "type": "text_file",
         "enabled": true,
         "output_dir": "output"
       }
     }
   }
   ```

3. **Run the system:**
   ```bash
   python newarkiver.py -c my_config.json
   ```

### Available Data Source Types

- **`conversation_json`**: ChatGPT conversation exports
- **`text_file`**: Plain text documents (.txt files)

### Extensible for Future Types

The architecture supports adding:
- CSV files
- XML documents  
- Database connections
- Web scraping
- API data sources

### Configuration Examples

#### Multiple Text Files
```json
{
  "data_sources": {
    "document1": {"type": "text_file", "path": "doc1.txt"},
    "document2": {"type": "text_file", "path": "doc2.txt"},
    "conversations": {
      "type": "conversation_json", 
      "path": "attached_assets/reformatted_conversations_1753336339888.json"
    }
  }
}
```

#### Custom Keywords
You can modify `attached_assets/Projexts and Keywords_1753336389930.txt` to add your own categories and keywords.

## Command Line Options

- `python newarkiver.py` - Use default config
- `python newarkiver.py -c custom.json` - Use custom config
- `python newarkiver.py -v` - Verbose logging
- `python newarkiver.py --help` - Show all options

## No UI Currently

The system is currently command-line based. A web UI could be added as a future enhancement using the modular architecture.