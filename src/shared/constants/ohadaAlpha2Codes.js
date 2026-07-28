// Maps ISO 3166-1 alpha-2 (what Cloudflare's edge geo-detection and most
// IP-geolocation services return) to this codebase's own 3-letter OHADA
// country codes (see OHADA_COUNTRIES in locations.js). Only the 17 OHADA
// member states are listed - any other alpha-2 code means "not covered".
export const ALPHA2_TO_OHADA_CODE = {
  BJ: 'BEN',
  BF: 'BFA',
  CM: 'CMR',
  CF: 'CAF',
  KM: 'COM',
  CG: 'COG',
  CD: 'COD',
  CI: 'CIV',
  GA: 'GAB',
  GN: 'GIN',
  GW: 'GNB',
  GQ: 'GNQ',
  ML: 'MLI',
  NE: 'NER',
  SN: 'SEN',
  TD: 'TCD',
  TG: 'TGO',
}
