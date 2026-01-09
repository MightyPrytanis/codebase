import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { calculateFederal, type FederalTaxInput } from './tax/federal.js';
import { FORM_1040_MAPPINGS, type PresentationMode } from './pdf/form-mappings.js';
import { applyBranding, fillPdfForm } from './pdf/pdf-filler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In dev: cwd is backend root. In prod: dist is sibling of templates.
const templatesDir = path.resolve(__dirname, '../templates/forms');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const ForecastRequestSchema = z.object({
  forecast_input: z.object({
    year: z.union([z.literal(2023), z.literal(2024), z.literal(2025)]),
    filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow']),
    wages: z.number().nonnegative(),
    selfEmploymentIncome: z.number().optional(),
    interestIncome: z.number().optional(),
    dividendIncome: z.number().optional(),
    capitalGains: z.number().optional(),
    otherIncome: z.number().optional(),
    standardDeduction: z.number().optional(),
    itemizedDeductions: z.number().optional(),
    estimatedWithholding: z.number().optional()
  }),
  branding: z
    .object({
      presentationMode: z.enum(['strip', 'watermark', 'none']).optional(),
      riskAcknowledged: z.boolean().optional()
    })
    .optional()
});

function requireRiskAck(mode: PresentationMode, riskAcknowledged: boolean | undefined) {
  if (mode !== 'none') return;
  if (!riskAcknowledged) {
    const err = new Error('Risk acknowledgement required to remove the advisory/branding.');
    (err as any).statusCode = 400;
    throw err;
  }
}

function filingStatusIndex(status: FederalTaxInput['filingStatus']): number {
  return (
    {
      single: 0,
      married_joint: 1,
      married_separate: 2,
      head_of_household: 3,
      qualifying_widow: 4
    }[status] ?? 0
  );
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Utility endpoint for mapping new PDFs (e.g., Michigan forms):
// send { pdfBase64 } and receive extracted field names.
app.post('/api/forms/inspect', async (req, res) => {
  try {
    const Body = z.object({ pdfBase64: z.string().min(1) });
    const parsed = Body.parse(req.body);
    const bytes = Buffer.from(parsed.pdfBase64, 'base64');
    const pdf = await PDFDocument.load(bytes);
    const form = pdf.getForm();
    const names = form.getFields().map((f) => f.getName());
    res.json({ success: true, fieldCount: names.length, fieldNames: names });
  } catch (err) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.post('/api/forecast/tax', async (req, res) => {
  try {
    const parsed = ForecastRequestSchema.parse(req.body);
    const mode: PresentationMode = parsed.branding?.presentationMode ?? 'strip';
    requireRiskAck(mode, parsed.branding?.riskAcknowledged);

    const calc = calculateFederal(parsed.forecast_input);
    res.json({
      success: true,
      forecastType: 'tax_return',
      calculatedValues: calc,
      brandingApplied: mode !== 'none',
      presentationMode: mode
    });
  } catch (err) {
    const status = (err as any)?.statusCode ?? 500;
    res.status(status).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.post('/api/forecast/tax/pdf', async (req, res) => {
  try {
    const parsed = ForecastRequestSchema.parse(req.body);
    const mode: PresentationMode = parsed.branding?.presentationMode ?? 'strip';
    requireRiskAck(mode, parsed.branding?.riskAcknowledged);

    const calc = calculateFederal(parsed.forecast_input);
    const year = parsed.forecast_input.year;

    const templatePath = path.join(templatesDir, `f1040--${year}.pdf`);
    const templatePdf = await fs.readFile(templatePath);

    const withholding = Number(parsed.forecast_input.estimatedWithholding || 0);
    const refundOrBalance = calc.refundOrBalance;

    const fillData: Record<string, unknown> = {
      filingStatus: filingStatusIndex(parsed.forecast_input.filingStatus),
      wages: parsed.forecast_input.wages,
      taxableInterest: parsed.forecast_input.interestIncome ?? 0,
      ordinaryDividends: parsed.forecast_input.dividendIncome ?? 0,
      capitalGain: parsed.forecast_input.capitalGains ?? 0,
      otherIncome: parsed.forecast_input.otherIncome ?? 0,
      totalIncome: calc.grossIncome,
      adjustedGrossIncome: calc.adjustedGrossIncome,
      standardDeductionAmount: calc.deductionUsed,
      taxableIncome: calc.taxableIncome,
      taxOwed: calc.totalTax,
      federalTaxWithheld: withholding,
      totalPayments: withholding,
      overpayment: refundOrBalance > 0 ? refundOrBalance : 0,
      amountOwed: refundOrBalance < 0 ? Math.abs(refundOrBalance) : 0
    };

    const filled = await fillPdfForm({ templatePdf, fieldMappings: FORM_1040_MAPPINGS, formData: fillData });
    const branded = await applyBranding({ pdf: Buffer.from(filled.pdfBase64, 'base64'), presentationMode: mode });
    const pdfBytes = Buffer.from(branded.pdfBase64, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="LexFiat-Forecaster-1040-${year}.pdf"`);
    res.send(pdfBytes);
  } catch (err) {
    const status = (err as any)?.statusCode ?? 500;
    res.status(status).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ Forecaster backend listening on http://localhost:${port}`);
});

