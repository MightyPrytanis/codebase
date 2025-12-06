
#!/usr/bin/env python3
"""
LEGACY ARKIVER - DEPRECATED

This is the original Arkiver script, preserved for reference only.

⚠️ THIS SCRIPT IS DEPRECATED ⚠️

Please use the new NewArkiver system instead:
    python newarkiver.py

The new system provides:
- Same functionality with identical output
- Better error handling and logging  
- Configurable processing pipeline
- Extensible architecture
- Type safety and better maintainability

See README.md and MIGRATION.md for details.
"""

import sys
import json
import re
from collections import defaultdict

# Warn users about deprecation
print("⚠️ WARNING: You are using the deprecated legacy Arkiver script!")
print("Please switch to the new NewArkiver system:")
print("    python newarkiver.py")
print()
print("The new system provides the same functionality with many improvements.")
print("See README.md for details.")
print()

# Ask user if they want to continue with legacy script
try:
    response = input("Continue with legacy script? (y/N): ").lower().strip()
    if response != 'y':
        print("Exiting. Please use: python newarkiver.py")
        sys.exit(0)
    print()
except (EOFError, KeyboardInterrupt):
    print("\nExiting. Please use: python newarkiver.py") 
    sys.exit(0)

def load_keywords():
    """Load keywords and their associated projects from the text file."""
    with open('attached_assets/Projexts and Keywords_1753336389930.txt', 'r') as f:
        content = f.read()
    
    # Parse the JSON-like structure
    keywords_data = eval(content)  # Note: eval is used here for simplicity with the given format
    
    # Create a mapping from keywords to projects
    keyword_to_project = {}
    for project, keywords in keywords_data.items():
        for keyword in keywords:
            keyword_to_project[keyword.lower()] = project
    
    return keyword_to_project

def extract_text_from_message(message_data):
    """Extract text content from a message."""
    if not message_data or not message_data.get('message'):
        return ""
    
    content = message_data['message'].get('content', {})
    if content.get('content_type') == 'text':
        parts = content.get('parts', [])
        return ' '.join(str(part) for part in parts if part)
    
    return ""

def search_keywords_in_text(text, keyword_to_project):
    """Search for keywords in text and return matching projects."""
    text_lower = text.lower()
    found_projects = set()
    
    for keyword, project in keyword_to_project.items():
        if keyword in text_lower:
            found_projects.add(project)
    
    return found_projects

def parse_conversations():
    """Parse the conversations JSON file and categorize by keywords."""
    # Load keywords
    keyword_to_project = load_keywords()
    
    # Load conversations
    with open('attached_assets/reformatted_conversations_1753336339888.json', 'r') as f:
        conversations = json.load(f)
    
    # Results storage
    categorized_conversations = defaultdict(list)
    uncategorized_conversations = []
    
    print(f"Loaded {len(keyword_to_project)} keywords across {len(set(keyword_to_project.values()))} projects")
    print(f"Processing {len(conversations)} conversations...\n")
    
    for conversation in conversations:
        title = conversation.get('title', 'Untitled')
        mapping = conversation.get('mapping', {})
        
        # Extract all messages with their order
        messages = []
        for node_id, node_data in mapping.items():
            text = extract_text_from_message(node_data)
            if text.strip():
                messages.append({
                    'text': text,
                    'node_id': node_id,
                    'matches_keywords': bool(search_keywords_in_text(text, keyword_to_project))
                })
        
        # Find messages that match keywords and get context
        matching_messages = []
        found_projects = set()
        
        for i, message in enumerate(messages):
            if message['matches_keywords']:
                projects = search_keywords_in_text(message['text'], keyword_to_project)
                found_projects.update(projects)
                
                # Get context messages (previous and next)
                context_messages = []
                
                # Previous message (if exists and doesn't match keywords)
                if i > 0 and not messages[i-1]['matches_keywords']:
                    context_messages.append(f"PREVIOUS: {messages[i-1]['text']}")
                
                # Current message
                context_messages.append(f"MATCH: {message['text']}")
                
                # Next message (if exists and doesn't match keywords)
                if i < len(messages) - 1 and not messages[i+1]['matches_keywords']:
                    context_messages.append(f"NEXT: {messages[i+1]['text']}")
                
                matching_messages.append({
                    'context': '\n\n'.join(context_messages),
                    'projects': projects
                })
        
        if found_projects:
            conversation_info = {
                'title': title,
                'create_time': conversation.get('create_time'),
                'update_time': conversation.get('update_time'),
                'matching_messages': matching_messages
            }
            
            for project in found_projects:
                categorized_conversations[project].append(conversation_info)
        else:
            # For uncategorized, just show a preview
            all_text = ' '.join([msg['text'] for msg in messages])
            conversation_info = {
                'title': title,
                'create_time': conversation.get('create_time'),
                'update_time': conversation.get('update_time'),
                'text_preview': all_text[:200] + '...' if len(all_text) > 200 else all_text
            }
            uncategorized_conversations.append(conversation_info)
    
    # Reorganize by project - collect all messages for each project
    messages_by_project = defaultdict(list)
    
    for project_name in categorized_conversations.keys():
        for conv in categorized_conversations[project_name]:
            for match in conv['matching_messages']:
                if project_name in match['projects']:
                    messages_by_project[project_name].append({
                        'conversation_title': conv['title'],
                        'context': match['context'],
                        'all_projects': match['projects']
                    })
    
    # Write results to separate files for each project
    output_files = []
    
    for project in sorted(messages_by_project.keys()):
        messages_list = messages_by_project[project]
        filename = f"{project.lower().replace(' ', '_')}_messages.txt"
        output_files.append(filename)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"=== {project.upper()} MESSAGES ===\n")
            f.write(f"Total messages: {len(messages_list)}\n\n")
            
            for i, message in enumerate(messages_list, 1):
                f.write(f"=== Message {i}: {message['conversation_title']} ===\n")
                if len(message['all_projects']) > 1:
                    f.write(f"Also matches projects: {', '.join([p for p in message['all_projects'] if p != project])}\n")
                else:
                    f.write("Only matches this project\n")
                f.write("Context:\n")
                
                # Write context with proper indentation
                for line in message['context'].split('\n'):
                    f.write(f"  {line}\n")
                f.write("\n")  # Empty line between messages
    
    # Write uncategorized conversations to a separate file
    uncategorized_filename = "uncategorized_conversations.txt"
    output_files.append(uncategorized_filename)
    
    with open(uncategorized_filename, 'w', encoding='utf-8') as f:
        f.write("=== UNCATEGORIZED CONVERSATIONS ===\n")
        f.write(f"Found {len(uncategorized_conversations)} conversations without matching keywords:\n\n")
        
        for conv in uncategorized_conversations:
            f.write(f"- {conv['title']}\n")
            if 'text_preview' in conv and conv['text_preview'].strip():
                f.write(f"  Preview: {conv['text_preview']}\n")
            f.write("\n")
    
    # Print summary to console
    print("=== FILE OUTPUT COMPLETE ===")
    print("Created the following output files:")
    for filename in output_files:
        print(f"  - {filename}")
    
    print(f"\n=== MESSAGES BY PROJECT ===")
    for project in sorted(messages_by_project.keys()):
        messages_list = messages_by_project[project]
        print(f"{project.upper()}: {len(messages_list)} messages")
    
    print(f"\nUNCATEGORIZED: {len(uncategorized_conversations)} conversations")
    
    # Summary
    total_categorized = sum(len(convs) for convs in categorized_conversations.values())
    print(f"\n=== SUMMARY ===")
    print(f"Total conversations: {len(conversations)}")
    print(f"Categorized: {total_categorized}")
    print(f"Uncategorized: {len(uncategorized_conversations)}")
    
    # Option to delete output files for security
    delete_files = input("\nDelete output files for security? (y/N): ").lower().strip()
    if delete_files == 'y':
        import os
        for filename in output_files:
            try:
                os.remove(filename)
                print(f"Deleted: {filename}")
            except FileNotFoundError:
                pass
        print("Output files deleted for security.")
    
    return categorized_conversations, uncategorized_conversations

if __name__ == "__main__":
    try:
        parse_conversations()
    except FileNotFoundError as e:
        print(f"Error: Could not find file - {e}")
    except Exception as e:
        print(f"Error: {e}")
