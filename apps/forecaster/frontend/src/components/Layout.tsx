import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, FileText, Scale } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">
                LexFiat Forecaster<sup className="text-xs">™</sup>
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link
                to="/tax"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/tax'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-1" />
                Tax
              </Link>
              <Link
                to="/support"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/support'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Scale className="inline h-4 w-4 mr-1" />
                Support
              </Link>
              <Link
                to="/qdro"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/qdro'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                QDRO
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            LexFiat Forecaster<sup>™</sup> - Hypothetical Forecasts Only. Not Filing Ready.
          </p>
        </div>
      </footer>
    </div>
  );
}

