#!/usr/bin/env python3
"""Helper script to calculate YYW version numbers from dates"""
import datetime
import re
import sys

def date_to_yyw(date_str):
    """Convert date string to YYW format (year last 2 digits + ISO week)"""
    if not date_str:
        return None
    
    # Try different date formats
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
            date = datetime.datetime.strptime(date_str.strip(), fmt)
            year = date.year % 10  # Last digit only (2025 -> 5)
            week = date.isocalendar()[1]
            return f"{year}{week:02d}"
        except:
            continue
    
    # Try to extract year-month-day from various formats
    match = re.search(r'(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})', date_str)
    if match:
        try:
            year, month, day = map(int, match.groups())
            date = datetime.date(year, month, day)
            year = date.year % 100
            week = date.isocalendar()[1]
            return f"{year:02d}{week:02d}"
        except:
            pass
    
    return None

if __name__ == '__main__':
    if len(sys.argv) > 1:
        result = date_to_yyw(sys.argv[1])
        print(result if result else "v548")  # Default to current week
    else:
        # Default to today
        today = datetime.date.today()
        year = today.year % 10  # Last digit only
        week = today.isocalendar()[1]
        print(f"{year}{week:02d}")

