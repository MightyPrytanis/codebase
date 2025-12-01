#!/usr/bin/env python3
"""Script to process documentation files and add standardized headers"""
import os
import re
import sys
from datetime import datetime
from pathlib import Path

def date_to_yyw(date_str):
    """Convert date string to YYW format"""
    if not date_str:
        return None
    
    formats = [
        '%Y-%m-%d',
        '%Y/%m/%d', 
        '%B %d, %Y',
        '%b %d, %Y',
        '%d %B %Y',
        '%d %b %Y',
        '%Y-%m-%d %H:%M:%S',
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
    
    return None

def extract_date_from_content(content):
    """Extract creation date from document content"""
    # Look for common date patterns
    patterns = [
        r'\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})',
        r'\*\*Created:\*\*\s*(\d{4}-\d{2}-\d{2})',
        r'Date:\s*(\d{4}-\d{2}-\d{2})',
        r'Created:\s*(\d{4}-\d{2}-\d{2})',
        r'(\d{4}-\d{2}-\d{2})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content[:500])  # Check first 500 chars
        if match:
            return match.group(1)
    
    return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 doc_processor.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract date
    date_str = extract_date_from_content(content)
    version = date_to_yyw(date_str) if date_str else "548"  # Default to current
    
    print(f"File: {file_path}")
    print(f"Date found: {date_str}")
    print(f"Version: v{version}")

