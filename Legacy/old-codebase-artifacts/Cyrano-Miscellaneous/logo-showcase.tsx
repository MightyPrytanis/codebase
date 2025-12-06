import React from 'react';
import { Logo, LexFiatIcon, LexFiatWordmark, LexFiatFull } from './logo';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export function LogoShowcase() {
  return (
    <div className="space-y-8 p-8 bg-slate-900 min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">LexFiat Brand Identity</h1>
        <p className="text-slate-400">Simplified Edison bulb design with bolder lines and flatter aesthetic</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Full Logo Variations */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Full Logo - Various Sizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo size="xl" />
              <span className="text-xs text-slate-400">Extra Large (64px)</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo size="lg" />
              <span className="text-xs text-slate-400">Large (48px)</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo size="md" />
              <span className="text-xs text-slate-400">Medium (32px)</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo size="sm" />
              <span className="text-xs text-slate-400">Small (24px)</span>
            </div>
          </CardContent>
        </Card>

        {/* Icon Only */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Icon Only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="icon" size="xl" />
              <span className="text-xs text-slate-400">App Icon - 64px</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="icon" size="lg" />
              <span className="text-xs text-slate-400">Navigation - 48px</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="icon" size="md" />
              <span className="text-xs text-slate-400">Toolbar - 32px</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="icon" size="sm" />
              <span className="text-xs text-slate-400">Favicon - 24px</span>
            </div>
          </CardContent>
        </Card>

        {/* Wordmark Only */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Wordmark Only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="wordmark" size="xl" />
              <span className="text-xs text-slate-400">Hero Text</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="wordmark" size="lg" />
              <span className="text-xs text-slate-400">Page Headers</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="wordmark" size="md" />
              <span className="text-xs text-slate-400">Navigation</span>
            </div>
            <div className="flex flex-col items-center space-y-4 p-4 bg-slate-700 rounded-lg">
              <Logo variant="wordmark" size="sm" />
              <span className="text-xs text-slate-400">Small Text</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Light Background Variations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-300">
          <CardHeader>
            <CardTitle className="text-gray-900">On Light Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4 p-4 bg-gray-100 rounded-lg">
              <div className="text-gray-900">
                <Logo size="lg" className="[&_span]:text-gray-900 [&_span:first-child]:text-amber-600" />
              </div>
              <span className="text-xs text-gray-600">Light theme adaptation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900 to-slate-900 border-blue-700">
          <CardHeader>
            <CardTitle className="text-white">On Gradient Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4 p-4 bg-blue-800/30 rounded-lg">
              <Logo size="lg" />
              <span className="text-xs text-blue-200">Overlay adaptation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Design Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-300">
              <h4 className="font-semibold text-gold mb-2">Key Improvements:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Simplified, flatter Edison bulb design</li>
                <li>• Bolder stroke weights (3-4px)</li>
                <li>• Geometric filament pattern</li>
                <li>• Cleaner base with minimal details</li>
                <li>• Radial gradient for depth</li>
                <li>• Professional drop shadow</li>
                <li>• Scalable SVG format</li>
                <li>• Consistent LexFiat gold branding</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guidelines */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gold mb-3">Brand Colors</h4>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gold rounded"></div>
                <span>Primary Gold: #fbbf24</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-amber-600 rounded"></div>
                <span>Secondary Gold: #d97706</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-slate-800 rounded border border-slate-600"></div>
                <span>Dark Base: #1f2937</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gold mb-3">Typography</h4>
            <div className="space-y-2 text-sm text-slate-300">
              <div>• Font: Inter (system default)</div>
              <div>• Weight: Bold (700)</div>
              <div>• Tracking: Tight (-0.025em)</div>
              <div>• "Lex" in gold, "Fiat" in white</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}