#!/usr/bin/env python3
"""
Batch Documentation Processor
Processes all markdown files: adds standardized headers, renames, and organizes into docs/ library
"""
import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, Dict

# Base directory
BASE_DIR = Path("/Users/davidtowne/Desktop/Coding/codebase")
DOCS_DIR = BASE_DIR / "docs"
EXCLUDE_PATHS = ["Document Archive", "node_modules", ".git", ".temp"]

def date_to_yyw(date_str: Optional[str]) -> str:
    """Convert date string to YYW format (year last digit + ISO week)"""
    if not date_str:
        return "548"  # Default to current week
    
    formats = [
        '%Y-%m-%d',
        '%Y/%m/%d', 
        '%B %d, %Y',
        '%b %d, %Y',
        '%d %B %Y',
        '%d %b %Y',
        '%Y-%m-%d %H:%M:%S',
        '%d %B %Y',
        '%d %b %Y',
    ]
    
    for fmt in formats:
        try:
            date = datetime.strptime(date_str.strip(), fmt)
            year = date.year % 10
            week = date.isocalendar()[1]
            return f"{year}{week:02d}"
        except:
            continue
    
    # Try regex extraction
    match = re.search(r'(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})', date_str)
    if match:
        try:
            year, month, day = map(int, match.groups())
            date = datetime(year, month, day)
            year = date.year % 10
            week = date.isocalendar()[1]
            return f"{year}{week:02d}"
        except:
            pass
    
    return "548"  # Default

def extract_metadata(content: str) -> Dict:
    """Extract metadata from document content"""
    metadata = {
        'created_date': None,
        'revised_date': None,
        'title': None,
        'subject': None,
        'summary': None,
    }
    
    # Extract dates
    date_patterns = [
        (r'\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})', 'created'),
        (r'\*\*Created:\*\*\s*(\d{4}-\d{2}-\d{2})', 'created'),
        (r'\*\*Last.*[Uu]pdated:\*\*\s*(\d{4}-\d{2}-\d{2})', 'revised'),
        (r'\*\*Last.*[Rr]evised:\*\*\s*(\d{4}-\d{2}-\d{2})', 'revised'),
        (r'Date:\s*(\d{4}-\d{2}-\d{2})', 'created'),
        (r'Created:\s*(\d{4}-\d{2}-\d{2})', 'created'),
        (r'(\d{4}-\d{2}-\d{2})', 'created'),  # Generic fallback
    ]
    
    first_500 = content[:500]
    for pattern, date_type in date_patterns:
        match = re.search(pattern, first_500, re.IGNORECASE)
        if match:
            if date_type == 'created' and not metadata['created_date']:
                metadata['created_date'] = match.group(1)
            elif date_type == 'revised' and not metadata['revised_date']:
                metadata['revised_date'] = match.group(1)
            if metadata['created_date']:
                break
    
    # Extract title (first # heading)
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if title_match:
        title = title_match.group(1).strip()
        # Clean up title
        title = re.sub(r'\*\*', '', title)
        title = re.sub(r'⚠️|🚫|✅|❌|⏳|📋', '', title).strip()
        metadata['title'] = title
    
    # Determine subject from title/path
    title_lower = (metadata['title'] or '').lower()
    if 'arkiver' in title_lower:
        metadata['subject'] = 'Arkiver'
    elif 'lexfiat' in title_lower:
        metadata['subject'] = 'LexFiat'
    elif 'cyrano' in title_lower or 'mcp' in title_lower:
        metadata['subject'] = 'Cyrano'
    elif 'ui' in title_lower or 'design' in title_lower:
        metadata['subject'] = 'UI'
    elif 'architecture' in title_lower:
        metadata['subject'] = 'Architecture'
    else:
        metadata['subject'] = 'General'
    
    return metadata

def generate_doc_id(file_path: Path, title: str) -> str:
    """Generate document ID from file path and title"""
    # Use filename as base
    stem = file_path.stem.upper().replace(' ', '-').replace('_', '-')
    # Clean up
    stem = re.sub(r'[^A-Z0-9-]', '', stem)
    # Limit length
    if len(stem) > 40:
        stem = stem[:40]
    return stem

def generate_descriptive_name(file_path: Path, title: str, subject: str) -> str:
    """Generate descriptive filename"""
    # Clean title
    clean_title = re.sub(r'[^\w\s-]', '', title or file_path.stem)
    clean_title = re.sub(r'\s+', '_', clean_title)
    clean_title = clean_title[:50]  # Limit length
    
    # Determine category
    title_lower = (title or '').lower()
    if 'ui' in title_lower or 'design' in title_lower:
        category = 'UI'
    elif 'architecture' in title_lower or 'guide' in title_lower:
        category = 'ARCHITECTURE'
    elif 'status' in title_lower or 'report' in title_lower:
        category = 'STATUS'
    elif 'api' in title_lower or 'integration' in title_lower:
        category = 'API'
    elif 'readme' in file_path.name.lower():
        category = 'README'
    else:
        category = 'GUIDE'
    
    # Build name: SUBJECT_CATEGORY_DESCRIPTIVE_NAME.md
    name_parts = [subject.upper(), category, clean_title.upper()]
    name = '_'.join([p for p in name_parts if p])
    
    # Ensure .md extension
    if not name.endswith('.md'):
        name += '.md'
    
    return name

def determine_docs_subdirectory(file_path: Path, title: str, subject: str) -> str:
    """Determine which docs/ subdirectory file should go to"""
    title_lower = (title or '').lower()
    path_lower = str(file_path).lower()
    
    if 'ui' in title_lower or 'design' in title_lower or 'ui' in path_lower:
        return 'ui'
    elif 'architecture' in title_lower or 'architecture' in path_lower:
        return 'architecture'
    elif 'api' in title_lower or 'api' in path_lower or 'integration' in title_lower:
        return 'api'
    elif 'status' in title_lower or 'report' in title_lower or 'completion' in title_lower:
        return 'status'
    elif 'readme' in file_path.name.lower():
        return 'reference'
    else:
        return 'guides'

def create_standardized_header(metadata: Dict, doc_id: str, file_path: Path) -> str:
    """Create standardized YAML frontmatter header"""
    created_date = metadata['created_date'] or "2025-11-28"
    revised_date = metadata['revised_date'] or created_date
    
    created_yyw = date_to_yyw(created_date)
    revised_yyw = date_to_yyw(revised_date)
    current_yyw = date_to_yyw("2025-11-28")  # Today
    
    version = f"v{revised_yyw}" if revised_yyw != created_yyw else f"v{created_yyw}"
    
    # Get ISO week for dates
    def get_iso_week(date_str):
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d')
            return f"{date.year}-W{date.isocalendar()[1]:02d}"
        except:
            return f"2025-W48"
    
    created_iso = get_iso_week(created_date) if metadata['created_date'] else "2025-W48"
    revised_iso = get_iso_week(revised_date) if metadata['revised_date'] else created_iso
    format_iso = "2025-W48"  # Today
    
    title = metadata['title'] or file_path.stem.replace('_', ' ').title()
    subject = metadata['subject'] or 'General'
    
    header = f"""---
Document ID: {doc_id}
Title: {title}
Subject(s): {subject}
Project: Cyrano
Version: {version}
Created: {created_date} ({created_iso})
Last Substantive Revision: {revised_date} ({revised_iso})
Last Format Update: 2025-11-28 ({format_iso})
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
"""
    
    if metadata['summary']:
        header += f"Summary: {metadata['summary']}\n"
    
    header += """Status: Active
---

"""
    
    return header

def process_file(file_path: Path) -> Tuple[bool, str]:
    """Process a single markdown file"""
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has standardized header
        if content.startswith('---\nDocument ID:'):
            return False, "Already processed"
        
        # Extract metadata
        metadata = extract_metadata(content)
        
        # Generate doc ID and name
        doc_id = generate_doc_id(file_path, metadata['title'])
        new_name = generate_descriptive_name(file_path, metadata['title'], metadata['subject'])
        
        # Determine destination
        subdir = determine_docs_subdirectory(file_path, metadata['title'], metadata['subject'])
        dest_dir = DOCS_DIR / subdir
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / new_name
        
        # Create header
        header = create_standardized_header(metadata, doc_id, file_path)
        
        # Remove old header if present (first few lines that look like headers)
        lines = content.split('\n')
        # Skip old YAML frontmatter or markdown headers
        start_idx = 0
        if lines[0].startswith('---'):
            # Skip YAML frontmatter
            for i, line in enumerate(lines[1:], 1):
                if line.strip() == '---':
                    start_idx = i + 1
                    break
        elif lines[0].startswith('#'):
            # Skip first heading and metadata lines
            for i, line in enumerate(lines[1:6], 1):
                if line.strip() and not (line.startswith('**') or line.startswith('*') or line.startswith('---') or line.startswith('#')):
                    start_idx = i
                    break
            if start_idx == 0:
                start_idx = 1
        
        # Reconstruct content with new header
        body = '\n'.join(lines[start_idx:])
        new_content = header + body.lstrip()
        
        # Write to destination
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, f"Moved to docs/{subdir}/{new_name}"
    
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    """Main processing function"""
    print("Starting batch documentation processing...")
    print(f"Base directory: {BASE_DIR}")
    print(f"Docs directory: {DOCS_DIR}")
    print()
    
    # Find all markdown files
    md_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not any(exc in root for exc in EXCLUDE_PATHS)]
        
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                md_files.append(file_path)
    
    print(f"Found {len(md_files)} markdown files to process")
    print()
    
    # Process files
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    for i, file_path in enumerate(md_files, 1):
        rel_path = file_path.relative_to(BASE_DIR)
        print(f"[{i}/{len(md_files)}] Processing: {rel_path}")
        
        success, message = process_file(file_path)
        
        if success:
            print(f"  ✓ {message}")
            success_count += 1
        elif "Already processed" in message:
            print(f"  ⊘ {message}")
            skipped_count += 1
        else:
            print(f"  ✗ {message}")
            error_count += 1
    
    print()
    print("=" * 60)
    print(f"Processing complete!")
    print(f"  Success: {success_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total: {len(md_files)}")
    print("=" * 60)

if __name__ == '__main__':
    main()

