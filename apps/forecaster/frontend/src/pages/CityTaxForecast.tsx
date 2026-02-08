import { useEffect, useState } from 'react';
import { Calculator, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { generateCityTaxForecast, type CityTaxForecastRequest } from '../lib/forecaster-api';

const BRANDING_OVERRIDE_STORAGE_KEY = 'lexfiat.forecaster.brandingOverride.v1';
const BRANDING_OVERRIDE_DURATION_MS = 24 * 60 * 60 * 1000;

export default function CityTaxForecast() {
  const [formData, setFormData] = useState({
    city: 'lansing' as CityTaxForecastRequest['city'],
    year: 2024 as CityTaxForecastRequest['year'],
    isResident: true,
    wages: '',
    otherIncome: '',
    withholding: '',
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandingMode, setBrandingMode] = useState<'strip' | 'watermark' | 'none'>('strip');
  const [brandingOverrideExpiresAt, setBrandingOverrideExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRANDING_OVERRIDE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { mode: 'none'; expiresAt: number } | null;
      if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(BRANDING_OVERRIDE_STORAGE_KEY);
        setBrandingMode('strip');
        setBrandingOverrideExpiresAt(null);
        return;
      }
      setBrandingMode(parsed.mode);
      setBrandingOverrideExpiresAt(parsed.expiresAt);
    } catch {
      localStorage.removeItem(BRANDING_OVERRIDE_STORAGE_KEY);
      setBrandingMode('strip');
      setBrandingOverrideExpiresAt(null);
    }
  }, []);

  const requestBrandingModeChange = (mode: 'strip' | 'watermark' | 'none') => {
    if (mode !== 'none') {
      localStorage.removeItem(BRANDING_OVERRIDE_STORAGE_KEY);
      setBrandingOverrideExpiresAt(null);
      setBrandingMode(mode);
      return;
    }

    const step1 = window.confirm(
      [
        'Remove advisory/branding from generated forms?',
        '',
        'LexFiat Forecaster simulates tax preparation software. Outputs are',
        'consistent with applicable law and tax formulas, but are not intended',
        'for actual tax preparation.',
        '',
        'These forecasts are for litigation and planning purposes only.',
        'Removing the advisory may cause outputs to be mistaken for',
        'filing-ready documents by courts, opposing counsel, or clients.',
        '',
        'The user assumes responsibility for any consequences of using',
        'unlabeled outputs.',
        '',
        'Click OK to acknowledge these risks, or Cancel to keep the advisory.',
      ].join('\n')
    );
    if (!step1) {
      setBrandingMode('strip');
      return;
    }

    const step2 = window.prompt('Type REMOVE to confirm removal of the advisory (expires after 24 hours):', '');
    if (step2 !== 'REMOVE') {
      setBrandingMode('strip');
      return;
    }

    const expiresAt = Date.now() + BRANDING_OVERRIDE_DURATION_MS;
    localStorage.setItem(BRANDING_OVERRIDE_STORAGE_KEY, JSON.stringify({ mode: 'none', expiresAt }));
    setBrandingMode('none');
    setBrandingOverrideExpiresAt(expiresAt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Enforce 24h auto-reset (fail safe)
      if (brandingMode === 'none' && brandingOverrideExpiresAt && brandingOverrideExpiresAt <= Date.now()) {
        localStorage.removeItem(BRANDING_OVERRIDE_STORAGE_KEY);
        setBrandingMode('strip');
        setBrandingOverrideExpiresAt(null);
      }

      const request: CityTaxForecastRequest = {
        city: formData.city,
        year: formData.year,
        isResident: formData.isResident,
        wages: parseFloat(formData.wages) || 0,
        otherIncome: formData.otherIncome ? parseFloat(formData.otherIncome) : undefined,
        withholding: formData.withholding ? parseFloat(formData.withholding) : undefined,
      };

      const response = await generateCityTaxForecast(request, {
        presentationMode: brandingMode,
        userRole: 'other',
        licensedInAny: false,
        riskAcknowledged: brandingMode === 'none',
      });

      if (response.success) setResult(response);
      else setError(response.error || 'Failed to generate forecast');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">City Tax Forecast (Testing)</h1>
        <p className="text-charcoal/70">
          City tax forecasting for Lansing and Albion (scaffold). Generated PDFs are forecasts and not filing-ready.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-charcoal mb-2">Branding Mode</label>
        <select
          value={brandingMode}
          onChange={(e) => requestBrandingModeChange(e.target.value as 'strip' | 'watermark' | 'none')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-charcoal"
        >
          <option value="strip">Warning Strip (Default)</option>
          <option value="watermark">Watermark</option>
          <option value="none">No Advisory/Branding (Danger Zone)</option>
        </select>
        <p className="text-xs text-charcoal/50 mt-1">
          Default is a prominent advisory strip. Removing the advisory requires a 2-layer confirmation and automatically resets after 24 hours.
        </p>
        {brandingMode === 'none' && brandingOverrideExpiresAt && (
          <p className="text-xs text-alert-red mt-1">
            Advisory removal is active until {new Date(brandingOverrideExpiresAt).toLocaleString()} (then it resets to the default warning strip).
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value as CityTaxForecastRequest['city'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="lansing">Lansing</option>
              <option value="albion">Albion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) as CityTaxForecastRequest['year'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.isResident}
                onChange={(e) => setFormData({ ...formData, isResident: e.target.checked })}
              />
              Resident
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wages</label>
            <input
              type="number"
              value={formData.wages}
              onChange={(e) => setFormData({ ...formData, wages: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Income</label>
            <input
              type="number"
              value={formData.otherIncome}
              onChange={(e) => setFormData({ ...formData, otherIncome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Withholding</label>
            <input
              type="number"
              value={formData.withholding}
              onChange={(e) => setFormData({ ...formData, withholding: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-charcoal font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Calculating Forecast...
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5" />
              Calculate Forecast
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-alert-red/10 border border-alert-red/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-alert-red mb-1">Error</h3>
            <p className="text-sm text-alert-red/80">{error}</p>
          </div>
        </div>
      )}

      {result && result.success && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-light-green" />
              <h2 className="text-xl font-semibold text-charcoal">Forecast Results</h2>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-accent-gold hover:bg-accent-gold/90 text-charcoal font-semibold rounded-lg transition-colors"
              onClick={async () => {
                try {
                  const apiBase = import.meta.env.VITE_FORECASTER_API_URL || 'http://localhost:3000';
                  const request: CityTaxForecastRequest = {
                    city: formData.city,
                    year: formData.year,
                    isResident: formData.isResident,
                    wages: parseFloat(formData.wages) || 0,
                    otherIncome: formData.otherIncome ? parseFloat(formData.otherIncome) : undefined,
                    withholding: formData.withholding ? parseFloat(formData.withholding) : undefined,
                  };
                  const resp = await fetch(`${apiBase}/api/forecast/city-tax/pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      forecast_input: request,
                      branding: { presentationMode: brandingMode, riskAcknowledged: brandingMode === 'none' },
                    }),
                  });
                  if (!resp.ok) throw new Error(`PDF request failed (${resp.status})`);
                  const blob = await resp.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `LexFiat-Forecaster-CityTax-${request.city}-${request.year}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to download PDF');
                }
              }}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {result?.calculatedValues?.warnings?.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Items requiring review:</strong>
              <ul className="list-disc ml-6 mt-2">
                {result.calculatedValues.warnings.map((w: string, idx: number) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-charcoal overflow-auto">{JSON.stringify(result.calculatedValues, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );

}
)
}