import { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function QDROForecast() {
  const [formData, setFormData] = useState({
    planType: 'defined_contribution',
    accountBalance: '',
    monthlyBenefit: '',
    maritalServiceStart: '',
    maritalServiceEnd: '',
    retirementAge: '',
    divisionPercentage: '50',
    participantDOB: '',
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
          message: 'QDRO forecast calculation would be performed here',
          note: 'Connect to forecast engine API endpoint',
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error calculating QDRO forecast:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">QDRO Forecast</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan Type
          </label>
          <select
            value={formData.planType}
            onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="defined_contribution">Defined Contribution</option>
            <option value="defined_benefit">Defined Benefit</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {formData.planType === 'defined_contribution' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Balance
              </label>
              <input
                type="number"
                value={formData.accountBalance}
                onChange={(e) => setFormData({ ...formData, accountBalance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Benefit
              </label>
              <input
                type="number"
                value={formData.monthlyBenefit}
                onChange={(e) => setFormData({ ...formData, monthlyBenefit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division Percentage (%)
            </label>
            <input
              type="number"
              value={formData.divisionPercentage}
              onChange={(e) => setFormData({ ...formData, divisionPercentage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Service Start Date
            </label>
            <input
              type="date"
              value={formData.maritalServiceStart}
              onChange={(e) => setFormData({ ...formData, maritalServiceStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Service End Date
            </label>
            <input
              type="date"
              value={formData.maritalServiceEnd}
              onChange={(e) => setFormData({ ...formData, maritalServiceEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {formData.planType === 'defined_benefit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={formData.retirementAge}
                  onChange={(e) => setFormData({ ...formData, retirementAge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="55"
                  max="75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participant Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.participantDOB}
                  onChange={(e) => setFormData({ ...formData, participantDOB: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
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