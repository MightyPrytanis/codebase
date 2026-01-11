import { useEffect, useState } from 'react';
import { Calculator, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { generateTaxForecast, type TaxForecastRequest } from '../lib/forecaster-api';

const BRANDING_OVERRIDE_STORAGE_KEY = 'lexfiat.forecaster.brandingOverride.v1';
const BRANDING_OVERRIDE_DURATION_MS = 24 * 60 * 60 * 1000;

export default function TaxForecast() {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    filingStatus: 'single' as TaxForecastRequest['filingStatus'],
    wages: '',
    selfEmploymentIncome: '',
    interestIncome: '',
    dividendIncome: '',
    capitalGains: '',
    standardDeduction: '',
    itemizedDeductions: '',
    qualifyingChildrenUnder17: '0',
    otherDependents: '0',
    filerAge: '',
    spouseAge: '',
    canBeClaimedAsDependent: false,
    estimatedWithholding: '',
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
      // If storage is corrupted, fail safe to default branding
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

    // 2-layer acknowledgement before allowing advisory removal
    const step1 = window.confirm(
      [
        'DANGER ZONE: Remove advisory/branding from generated forms?',
        '',
        'These outputs are projections and are NOT real filings.',
        'If you remove the advisory, the PDFs may be easily mistaken for filing-ready documents.',
        'Consult a qualified tax professional before relying on these outputs.',
        '',
        'Click OK to continue, or Cancel to keep the advisory.',
      ].join('\n')
    );
    if (!step1) {
      setBrandingMode('strip');
      return;
    }

    const step2 = window.prompt('Type REMOVE to confirm you want to remove the advisory (expires after 24 hours):', '');
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

      const request: TaxForecastRequest = {
        year: formData.year,
        filingStatus: formData.filingStatus,
        wages: parseFloat(formData.wages) || 0,
        selfEmploymentIncome: formData.selfEmploymentIncome ? parseFloat(formData.selfEmploymentIncome) : undefined,
        interestIncome: formData.interestIncome ? parseFloat(formData.interestIncome) : undefined,
        dividendIncome: formData.dividendIncome ? parseFloat(formData.dividendIncome) : undefined,
        capitalGains: formData.capitalGains ? parseFloat(formData.capitalGains) : undefined,
        standardDeduction: formData.standardDeduction ? parseFloat(formData.standardDeduction) : undefined,
        itemizedDeductions: formData.itemizedDeductions ? parseFloat(formData.itemizedDeductions) : undefined,
        qualifyingChildrenUnder17: parseInt(formData.qualifyingChildrenUnder17) || 0,
        otherDependents: parseInt(formData.otherDependents) || 0,
        filerAge: formData.filerAge ? parseInt(formData.filerAge) : undefined,
        spouseAge: formData.spouseAge ? parseInt(formData.spouseAge) : undefined,
        canBeClaimedAsDependent: formData.canBeClaimedAsDependent,
        estimatedWithholding: formData.estimatedWithholding ? parseFloat(formData.estimatedWithholding) : undefined,
      };

      const response = await generateTaxForecast(request, {
        presentationMode: brandingMode,
        userRole: 'other',
        licensedInAny: false,
        riskAcknowledged: brandingMode === 'none',
      });

      if (response.success) {
        setResult(response);
      } else {
        setError(response.error || 'Failed to generate forecast');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Tax Return Forecast</h1>
        <p className="text-charcoal/70">Generate hypothetical tax return forecasts using IRS forms and calculations</p>
      </div>

      {/* Branding Mode Selector */}
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
              onChange={(e) =>
                setFormData({ ...formData, filingStatus: e.target.value as TaxForecastRequest['filingStatus'] })
              }
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
              Qualifying Children (Under 17)
            </label>
            <input
              type="number"
              value={formData.qualifyingChildrenUnder17}
              onChange={(e) => setFormData({ ...formData, qualifyingChildrenUnder17: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Dependents
            </label>
            <input
              type="number"
              value={formData.otherDependents}
              onChange={(e) => setFormData({ ...formData, otherDependents: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filer Age (needed for 0-child EITC)
            </label>
            <input
              type="number"
              value={formData.filerAge}
              onChange={(e) => setFormData({ ...formData, filerAge: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              placeholder="optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spouse Age (MFJ, 0-child EITC)
            </label>
            <input
              type="number"
              value={formData.spouseAge}
              onChange={(e) => setFormData({ ...formData, spouseAge: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              placeholder="optional"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.canBeClaimedAsDependent}
                onChange={(e) => setFormData({ ...formData, canBeClaimedAsDependent: e.target.checked })}
              />
              I can be claimed as a dependent on another taxpayer&apos;s return (affects EITC)
            </label>
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
                  const request: TaxForecastRequest = {
                    year: formData.year,
                    filingStatus: formData.filingStatus,
                    wages: parseFloat(formData.wages) || 0,
                    selfEmploymentIncome: formData.selfEmploymentIncome ? parseFloat(formData.selfEmploymentIncome) : undefined,
                    interestIncome: formData.interestIncome ? parseFloat(formData.interestIncome) : undefined,
                    dividendIncome: formData.dividendIncome ? parseFloat(formData.dividendIncome) : undefined,
                    capitalGains: formData.capitalGains ? parseFloat(formData.capitalGains) : undefined,
                    standardDeduction: formData.standardDeduction ? parseFloat(formData.standardDeduction) : undefined,
                    itemizedDeductions: formData.itemizedDeductions ? parseFloat(formData.itemizedDeductions) : undefined,
                    qualifyingChildrenUnder17: parseInt(formData.qualifyingChildrenUnder17) || 0,
                    otherDependents: parseInt(formData.otherDependents) || 0,
                    filerAge: formData.filerAge ? parseInt(formData.filerAge) : undefined,
                    spouseAge: formData.spouseAge ? parseInt(formData.spouseAge) : undefined,
                    canBeClaimedAsDependent: formData.canBeClaimedAsDependent,
                    estimatedWithholding: formData.estimatedWithholding ? parseFloat(formData.estimatedWithholding) : undefined,
                  };

                  const resp = await fetch(`${apiBase}/api/forecast/tax/pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      forecast_input: request,
                      branding: {
                        presentationMode: brandingMode,
                        userRole: 'other',
                        licensedInAny: false,
                        riskAcknowledged: brandingMode === 'none',
                      },
                    }),
                  });
                  if (!resp.ok) throw new Error(`PDF request failed (${resp.status})`);
                  const blob = await resp.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `LexFiat-Forecaster-1040-${request.year}.pdf`;
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
          
          {result.brandingApplied && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Branding Applied:</strong> {result.presentationMode === 'strip' ? 'Warning Strip' : 
                result.presentationMode === 'watermark' ? 'Watermark' : 'None'}
            </div>
          )}

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
            <pre className="text-sm text-charcoal overflow-auto">
              {JSON.stringify(result.calculatedValues, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

