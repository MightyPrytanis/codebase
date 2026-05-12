# Vicinage — Backend Functions

## enrichProjectFromGIS

Fetches real parcel data from Barry County, MI ArcGIS servers and USGS elevation API,
then auto-populates the Vicinage Project entity record.

### Usage
POST /functions/enrichProjectFromGIS
{
  "parcelId": "14-008-017-00",
  "projectId": "optional-project-id-to-auto-update"
}

### Returns
- property_address — from GIS address points
- property_coordinates — {lat, lon} centroid
- property_size_acres — from parcel attributes
- property_description — auto-generated narrative
- constraints — array of development constraint strings

### Data Sources
- Barry County ArcGIS (org: i0SsdDzLI3mLGmPR) — parcels, roads, zoning, addresses, buildings, drains, waterbodies
- USGS National Map Elevation API (epqs.nationalmap.gov)

### Deployment
Deploy as a backend function in the Vicinage Base44 app (Code Editor > Functions).
No API keys required — all public endpoints.

### Validated
Tested with parcel 14-008-017-00 (Thornapple Glen, 60.23 acres, Middleville MI 49333).
