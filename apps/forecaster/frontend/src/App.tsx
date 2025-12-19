import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TaxForecast from './pages/TaxForecast';
import ChildSupportForecast from './pages/ChildSupportForecast';
import QDROForecast from './pages/QDROForecast';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tax" element={<TaxForecast />} />
        <Route path="/support" element={<ChildSupportForecast />} />
        <Route path="/qdro" element={<QDROForecast />} />
      </Routes>
    </Layout>
  );
}

export default App;

