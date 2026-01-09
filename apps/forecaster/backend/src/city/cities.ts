export type SupportedCity = 'lansing' | 'albion';

export interface CityTaxConfig {
  city: SupportedCity;
  displayName: string;
  // NOTE: Rates are configured from a user-provided statutory reference and should be
  // independently verified against authoritative sources during validation.
  residentRate: number;
  nonresidentRate: number;
  source: 'USER_PROVIDED_STATUTORY_REFERENCE_MCL_141_601_ET_SEQ';
}

export const CITY_TAX_CONFIG: Record<SupportedCity, CityTaxConfig> = {
  lansing: {
    city: 'lansing',
    displayName: 'Lansing, MI',
    residentRate: 0.01,
    nonresidentRate: 0.005,
    source: 'USER_PROVIDED_STATUTORY_REFERENCE_MCL_141_601_ET_SEQ'
  },
  albion: {
    city: 'albion',
    displayName: 'Albion, MI',
    residentRate: 0.01,
    nonresidentRate: 0.005,
    source: 'USER_PROVIDED_STATUTORY_REFERENCE_MCL_141_601_ET_SEQ'
  }
};

