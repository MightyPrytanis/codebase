import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { generateChildSupportForecast, type ChildSupportForecastRequest } from '../lib/forecaster-api';

export default function ChildSupportForecast() {
  const [formData, setFormData] = useState({
    jurisdiction: 'michigan' as 'michigan' | 'other',
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request: ChildSupportForecastRequest = {
        jurisdiction: formData.jurisdiction,
        payerIncome: parseFloat(formData.payerIncome) || 0,
        payeeIncome: parseFloat(formData.payeeIncome) || 0,
        numberOfChildren: parseInt(formData.numberOfChildren, 10),
        overnightsPayer: parseInt(formData.overnightsPayer, 10),
        overnightsPayee: parseInt(formData.overnightsPayee, 10),
        healthInsurance: parseFloat(formData.healthInsurance) || 0,
        childcare: parseFloat(formData.childcare) || 0,
        otherChildren: parseInt(formData.otherChildren, 10),
      };
      const response = await generateChildSupportForecast(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while calculating the child support forecast.');
    } finally {
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

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Forecast Results</h2>
          {result.brandingApplied && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ Hypothetical Forecast — For Planning Purposes Only
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                This is not a legal determination. Consult a qualified attorney before relying on these figures.
              </p>
            </div>
          )}
          {result.calculatedValues && (
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Combined Income</span>
                <span className="font-medium">${result.calculatedValues.combinedIncome?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/yr</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Payer Income Share</span>
                <span className="font-medium">{(result.calculatedValues.payerPercentage != null ? result.calculatedValues.payerPercentage * 100 : 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Base Support Obligation</span>
                <span className="font-medium">${result.calculatedValues.baseSupportObligation?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</span>
              </div>
              {result.calculatedValues.parentingTimeAdjustment !== 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Parenting Time Adjustment</span>
                  <span className="font-medium">-${result.calculatedValues.parentingTimeAdjustment?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b bg-green-50 px-2 rounded">
                <span className="text-gray-800 font-semibold">Estimated Monthly Support</span>
                <span className="font-bold text-green-800 text-lg">${result.calculatedValues.finalSupportAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

}