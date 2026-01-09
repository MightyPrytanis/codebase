export type SupportedCity = 'lansing' | 'albion';

export interface CityTaxConfig {
  city: SupportedCity;
  displayName: string;
  // NOTE: These rates are placeholders until verified from authoritative city sources.
  // They are used for testing/scaffolding only.
  residentRate: number;
  nonresidentRate: number;
  source: 'UNVERIFIED_PLACEHOLDER';
}

export const CITY_TAX_CONFIG: Record<SupportedCity, CityTaxConfig> = {
  lansing: {
    city: 'lansing',
    displayName: 'Lansing, MI',
    residentRate: 0.01,
    nonresidentRate: 0.005,
    source: 'UNVERIFIED_PLACEHOLDER'
  },
  albion: {
    city: 'albion',
    displayName: 'Albion, MI',
    residentRate: 0.01,
    nonresidentRate: 0.005,
    source: 'UNVERIFIED_PLACEHOLDER'
  }
};

