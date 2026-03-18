/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Routes, Route, Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import DocumentList from './pages/DocumentList'
import DocumentEditor from './components/DocumentEditor'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center gap-3">
        <FileText className="text-indigo-400" size={22} />
        <Link to="/" className="text-lg font-semibold tracking-tight hover:text-indigo-300 transition-colors">
          SwimMeet
        </Link>
        <span className="ml-2 text-xs text-gray-500 font-mono">competitive AI drafting</span>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DocumentList />} />
          <Route path="/documents/:id" element={<DocumentEditor />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
