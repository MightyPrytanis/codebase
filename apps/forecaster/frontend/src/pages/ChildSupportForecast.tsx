import { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function ChildSupportForecast() {
  const [formData, setFormData] = useState({
    jurisdiction: 'michigan',
    payerIncome: '',
    payeeIncome: '',
    numberOfChildren: '1',
    overnightsPayer: '0',
    overnightsPayee: '365',
    healthInsurance: '0',
    childcare: '0',
    otherChildren: '0',
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Connect to actual forecast engine API
      setTimeout(() => {
        setResult({
          message: 'Child support forecast calculation would be performed here',
          note: 'Connect to forecast engine API endpoint',
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error calculating child support forecast:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Child Support Forecast</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jurisdiction
            </label>
            <select
              value={formData.jurisdiction}
              onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="michigan">Michigan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Children
            </label>
            <input
              type="number"
              value={formData.numberOfChildren}
              onChange={(e) => setFormData({ ...formData, numberOfChildren: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payer Income (Annual)
            </label>
            <input
              type="number"
              value={formData.payerIncome}
              onChange={(e) => setFormData({ ...formData, payerIncome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payee Income (Annual)
            </label>
            <input
              type="number"
              value={formData.payeeIncome}
              onChange={(e) => setFormData({ ...formData, payeeIncome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overnights with Payer (per year)
            </label>
            <input
              type="number"
              value={formData.overnightsPayer}
              onChange={(e) => setFormData({ ...formData, overnightsPayer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              max="365"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overnights with Payee (per year)
            </label>
            <input
              type="number"
              value={formData.overnightsPayee}
              onChange={(e) => setFormData({ ...formData, overnightsPayee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              max="365"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Health Insurance (Monthly)
            </label>
            <input
              type="number"
              value={formData.healthInsurance}
              onChange={(e) => setFormData({ ...formData, healthInsurance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Childcare (Monthly)
            </label>
            <input
              type="number"
              value={formData.childcare}
              onChange={(e) => setFormData({ ...formData, childcare: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Children Payer Supports
            </label>
            <input
              type="number"
              value={formData.otherChildren}
              onChange={(e) => setFormData({ ...formData, otherChildren: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
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

