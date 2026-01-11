import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Extractor from './pages/Extractor';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Visualizations from './pages/Visualizations';
import AiAssistant from './pages/AiAssistant';
import AiIntegrity from './pages/AiIntegrity';

function App() {
  return (
    <Router>
      <header style={{padding: "1rem", background: "#1976d2", color: "#fff"}}>
        Arkiver-MJ
        <nav style={{marginTop: "1rem"}}>
          <Link style={{marginRight: '8px'}} to="/">Dashboard</Link>
          <Link style={{marginRight: '8px'}} to="/extractor">Extractor</Link>
          <Link style={{marginRight: '8px'}} to="/insights">Insights</Link>
          <Link style={{marginRight: '8px'}} to="/settings">Settings</Link>
          <Link style={{marginRight: '8px'}} to="/visualizations">Visualizations</Link>
          <Link style={{marginRight: '8px'}} to="/ai-assistant">AI Assistant</Link>
          <Link to="/ai-integrity">AI Integrity</Link>
        </nav>
      </header>
      <main style={{padding: "2rem"}}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/extractor" element={<Extractor />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/visualizations" element={<Visualizations />} />
          <Route path="/ai-Assistant" element={<AiAssistant />} />
          <Route path="/ai-integrity" element={<AiIntegrity />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

}
)
}
}
}
}
}