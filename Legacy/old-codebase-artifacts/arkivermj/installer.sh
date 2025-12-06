#!/bin/bash
# Arkiver-MJ Installer Script
set -e

echo "== Arkiver-MJ Setup: Creating folders =="
mkdir -p src/components src/pages src/services src/models src/utils

echo "== Installing dependencies =="
npm install react-router-dom @tanstack/react-query date-fns @mui/material @emotion/react @emotion/styled

echo "== Creating Arkiver-MJ component files =="

# AppHeader
cat <<'EOF' > src/components/AppHeader.tsx
import React from 'react';
export default function AppHeader() {
  return <header style={{padding: "1rem", background: "#1976d2", color: "#fff"}}>Arkiver-MJ: Dashboard</header>;
}
EOF

# HomePage
cat <<'EOF' > src/pages/HomePage.tsx
import React from 'react';
export default function HomePage() {
  return <div>Welcome to Arkiver-MJ! Start by uploading a file.</div>;
}
EOF

# FileService
cat <<'EOF' > src/services/FileService.ts
export function processFile(file: File) {
  // Simulate async processing
  return new Promise(resolve => setTimeout(() => resolve("processed: " + file.name), 1000));
}
EOF

# UploadedFile Model
cat <<'EOF' > src/models/UploadedFile.ts
export interface UploadedFile {
  id: string;
  name: string;
  status: "pending" | "processing" | "done" | "error";
  errorMessage?: string;
}
EOF

# Date Utility
cat <<'EOF' > src/utils/dateFormat.ts
export function formatDate(date: Date): string {
  return date.toLocaleString();
}
EOF

echo "== Overwriting src/App.tsx for Arkiver-MJ =="
# Main App file
cat <<'EOF' > src/App.tsx
import React from 'react';
import AppHeader from './components/AppHeader';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div>
      <AppHeader />
      <main style={{padding: "2rem"}}>
        <HomePage />
      </main>
    </div>
  );
}

export default App;
EOF

echo "== Arkiver-MJ initial skeleton complete! =="
echo "You can now run: npm start"
