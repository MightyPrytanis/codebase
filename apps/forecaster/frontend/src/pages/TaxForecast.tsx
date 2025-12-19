import { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function TaxForecast() {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    filingStatus: 'single',
    wages: '',
    selfEmploymentIncome: '',
    interestIncome: '',
    dividendIncome: '',
    capitalGains: '',
    standardDeduction: '',
    itemizedDeductions: '',
    dependents: '0',
    estimatedWithholding: '',
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Connect to actual forecast engine API
      // For now, show placeholder
      setTimeout(() => {
        setResult({
          message: 'Tax forecast calculation would be performed here',
          note: 'Connect to forecast engine API endpoint',
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error calculating tax forecast:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tax Return Forecast</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Year
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="2018"
              max="2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filing Status
            </label>
            <select
              value={formData.filingStatus}
              onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
              <option value="qualifying_widow">Qualifying Widow(er)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wages
            </label>
            <input
              type="number"
              value={formData.wages}
              onChange={(e) => setFormData({ ...formData, wages: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Self-Employment Income
            </label>
            <input
              type="number"
              value={formData.selfEmploymentIncome}
              onChange={(e) => setFormData({ ...formData, selfEmploymentIncome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Income
            </label>
            <input
              type="number"
              value={formData.interestIncome}
              onChange={(e) => setFormData({ ...formData, interestIncome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dividend Income
            </label>
            <input
              type="number"
              value={formData.dividendIncome}
              onChange={(e) => setFormData({ ...formData, dividendIncome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capital Gains
            </label>
            <input
              type="number"
              value={formData.capitalGains}
              onChange={(e) => setFormData({ ...formData, capitalGains: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Deduction
            </label>
            <input
              type="number"
              value={formData.standardDeduction}
              onChange={(e) => setFormData({ ...formData, standardDeduction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Auto-calculated if empty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Itemized Deductions
            </label>
            <input
              type="number"
              value={formData.itemizedDeductions}
              onChange={(e) => setFormData({ ...formData, itemizedDeductions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependents
            </label>
            <input
              type="number"
              value={formData.dependents}
              onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Withholding
            </label>
            <input
              type="number"
              value={formData.estimatedWithholding}
              onChange={(e) => setFormData({ ...formData, estimatedWithholding: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            'Calculating...'
          ) : (
            <>
              <Calculator className="h-5 w-5 mr-2" />
              Calculate Forecast
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Forecast Results</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

