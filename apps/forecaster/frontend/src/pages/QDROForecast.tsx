import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { generateQDROForecast, type QDROForecastRequest } from '../lib/forecaster-api';

export default function QDROForecast() {
  const [formData, setFormData] = useState({
    planType: 'defined_contribution' as 'defined_contribution' | 'defined_benefit',
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request: QDROForecastRequest = {
        planType: formData.planType,
        maritalServiceStart: formData.maritalServiceStart,
        maritalServiceEnd: formData.maritalServiceEnd,
        divisionPercentage: parseFloat(formData.divisionPercentage),
        ...(formData.planType === 'defined_contribution' && formData.accountBalance
          ? { accountBalance: parseFloat(formData.accountBalance) }
          : {}),
        ...(formData.planType === 'defined_benefit' && formData.monthlyBenefit
          ? { monthlyBenefit: parseFloat(formData.monthlyBenefit) }
          : {}),
        ...(formData.retirementAge ? { retirementAge: parseInt(formData.retirementAge, 10) } : {}),
        ...(formData.participantDOB ? { participantDOB: formData.participantDOB } : {}),
      };
      const response = await generateQDROForecast(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while calculating the QDRO forecast.');
    } finally {
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
              {result.calculatedValues.maritalServicePeriod !== undefined && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Marital Service Period</span>
                  <span className="font-medium">{result.calculatedValues.maritalServicePeriod} years</span>
                </div>
              )}
              {result.calculatedValues.maritalServicePercentage !== undefined && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Marital Service Percentage</span>
                  <span className="font-medium">{result.calculatedValues.maritalServicePercentage}%</span>
                </div>
              )}
              {result.calculatedValues.accountBalanceAmount !== undefined && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Alternate Payee Account Amount</span>
                  <span className="font-medium font-bold">${result.calculatedValues.accountBalanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {result.calculatedValues.monthlyBenefitAmount !== undefined && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Alternate Payee Monthly Benefit</span>
                  <span className="font-medium font-bold">${result.calculatedValues.monthlyBenefitAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</span>
                </div>
              )}
              {result.calculatedValues.complianceNotes && result.calculatedValues.complianceNotes.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-orange-800 text-sm font-medium mb-1">Notes:</p>
                  <ul className="list-disc list-inside">
                    {result.calculatedValues.complianceNotes.map((note: string, i: number) => (
                      <li key={i} className="text-orange-700 text-sm">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

}