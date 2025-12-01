#!/bin/bash

echo "=== Dashboard Version Switcher ==="
echo ""
echo "Available versions:"
echo "1. Current (dashboard.tsx - 14.7KB)"
echo "2. Old backup (dashboard-old-20251012-075644.tsx - 14KB)"
echo "3. Copy version (dashboard_copy.tsx - 123 bytes)"
echo ""
echo "Which version do you want to test? (1/2/3): "
read choice

case $choice in
  1)
    echo "Already on current version"
    ;;
  2)
    cp ./client/src/pages/dashboard.tsx ./client/src/pages/dashboard.tsx.backup
    cp ./archive/dashboard-versions/dashboard-old-20251012-075644.tsx ./client/src/pages/dashboard.tsx
    echo "✓ Switched to OLD version (Oct 12 backup)"
    ;;
  3)
    cp ./client/src/pages/dashboard.tsx ./client/src/pages/dashboard.tsx.backup
    cp ./archive/dashboard-versions/dashboard_copy.tsx ./client/src/pages/dashboard.tsx
    echo "✓ Switched to COPY version"
    ;;
  *)
    echo "Invalid choice"
    ;;
esac

echo ""
echo "Refresh your browser to see changes"
