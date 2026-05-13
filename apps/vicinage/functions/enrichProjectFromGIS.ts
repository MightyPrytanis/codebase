// ============================================================
// Vicinage — enrichProjectFromGIS function
// Deploy this in the Vicinage app's Code Editor > Functions
// ============================================================
// Takes a parcelId + projectId, fetches real GIS data from
// Barry County ArcGIS + USGS elevation, and updates the Project
// record automatically. Call it from the project creation/edit page.
// ============================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BARRY_ORG = "i0SsdDzLI3mLGmPR";
const BASE = `https://services.arcgis.com/${BARRY_ORG}/arcgis/rest/services`;

async function queryFeatureService(url: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, f: "json", outSR: "4326", returnGeometry: "false" });
  const res = await fetch(`${url}/query?${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function queryParcelGeometry(parcelId: string): Promise<any> {
  const qs = new URLSearchParams({
    where: `Tparcel = '${parcelId}'`,
    outFields: "*",
    f: "json",
    outSR: "4326",
    returnGeometry: "true",
  });
  const res = await fetch(`${BASE}/Parcels_OpenData_View/FeatureServer/14/query?${qs}`);
  return res.json();
}

async function getElevation(lon: number, lat: number): Promise<number> {
  const res = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&wkid=4326&includeDate=false`);
  const d = await res.json();
  return parseFloat(d.value);
}

function computeCentroid(rings: number[][]): { lat: number; lon: number } {
  const lons = rings.map((p) => p[0]);
  const lats = rings.map((p) => p[1]);
  return {
    lat: lats.reduce((a, b) => a + b, 0) / lats.length,
    lon: lons.reduce((a, b) => a + b, 0) / lons.length,
  };
}

function computeBbox(rings: number[][]): { north: number; south: number; east: number; west: number } {
  const lons = rings.map((p) => p[0]);
  const lats = rings.map((p) => p[1]);
  return { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lons), west: Math.min(...lons) };
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const parcelId: string = body.parcelId || body.parcel_id;
    const projectId: string = body.projectId || body.project_id;

    if (!parcelId) return Response.json({ error: "parcelId is required" }, { status: 400, headers: cors });

    // 1. PARCEL GEOMETRY
    const parcelResult = await queryParcelGeometry(parcelId);
    if (!parcelResult.features?.length) {
      return Response.json({ error: `Parcel ${parcelId} not found in Barry County GIS` }, { status: 404, headers: cors });
    }

    const feature = parcelResult.features[0];
    const attrs = feature.attributes;
    const rings: number[][] = feature.geometry.rings[0];
    const centroid = computeCentroid(rings);
    const bbox = computeBbox(rings);
    const bboxGeom = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;

    // 2. ELEVATION (5 points, sequential to avoid rate limits)
    const elevPoints = [
      { label: "centroid", lon: centroid.lon, lat: centroid.lat },
      { label: "nw", lon: bbox.west, lat: bbox.north },
      { label: "ne", lon: bbox.east, lat: bbox.north },
      { label: "sw", lon: bbox.west, lat: bbox.south },
      { label: "se", lon: bbox.east, lat: bbox.south },
    ];
    const elevFt: Record<string, number> = {};
    for (const pt of elevPoints) {
      try {
        const m = await getElevation(pt.lon, pt.lat);
        elevFt[pt.label] = Math.round(m * 3.28084);
      } catch { elevFt[pt.label] = 0; }
    }
    const elevValues = Object.values(elevFt).filter((v) => v > 0);
    const elevMin = Math.min(...elevValues);
    const elevMax = Math.max(...elevValues);
    const elevRelief = elevMax - elevMin;

    // 3. PARALLEL SPATIAL QUERIES
    const sp = {
      geometry: bboxGeom,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      resultRecordCount: "10",
    };

    const [roadsR, zoningR, addrR, bldgR, drainsR, waterR] = await Promise.allSettled([
      queryFeatureService(`${BASE}/BarryRoadCenterlines_view/FeatureServer/231`, sp),
      queryFeatureService(`${BASE}/Barry_County_Zoning_view/FeatureServer/13`, sp),
      queryFeatureService(`${BASE}/BarryAddressPoints_view/FeatureServer/0`, sp),
      queryFeatureService(`${BASE}/Building_Footprints/FeatureServer/1`, sp),
      queryFeatureService(`${BASE}/Drains/FeatureServer/1603`, sp),
      queryFeatureService(`${BASE}/Waterbodies_view/FeatureServer/0`, sp),
    ]);

    // 4. PARSE
    const roads = roadsR.status === "fulfilled"
      ? (roadsR.value.features || []).map((f: any) => ({
          name: f.attributes.Full_StCS, type: f.attributes.Act51,
          nfc: f.attributes.NFC, surface: f.attributes.Surface,
        })) : [];

    const zoningFeats = zoningR.status === "fulfilled" ? (zoningR.value.features || []) : [];
    const zoningClass: string = zoningFeats.length > 0
      ? zoningFeats.sort((a: any, b: any) => b.attributes.Shape__Area - a.attributes.Shape__Area)[0]?.attributes?.zoning_class || "Unknown"
      : "Unknown";

    const addresses = addrR.status === "fulfilled"
      ? (addrR.value.features || []).map((f: any) => f.attributes.Full_Address).filter(Boolean)
      : [];

    const buildings = bldgR.status === "fulfilled"
      ? (bldgR.value.features || []).map((f: any) => ({ area_sqft: Math.round(f.attributes.Shape__Area) }))
      : [];

    const drains = drainsR.status === "fulfilled"
      ? (drainsR.value.features || []).map((f: any) => f.attributes.Name).filter(Boolean)
      : [];

    const waterbodies = waterR.status === "fulfilled"
      ? (waterR.value.features || []).map((f: any) => f.attributes.feature_name || "Unnamed water feature")
      : [];

    // 5. BUILD CONSTRAINT NOTES
    const constraints: string[] = [];
    if (drains.length > 0 || waterbodies.some((w: string) => w !== "Unnamed water feature")) {
      constraints.push(`Drainage features on parcel (${drains.join(", ") || waterbodies[0]}) — setbacks and stormwater management required`);
    }
    if (elevRelief > 50) {
      constraints.push(`${elevRelief}ft elevation change across parcel — grading and site planning important`);
    }
    if (roads.length === 0) {
      constraints.push("No mapped road access — verify easements before development");
    }
    if (zoningClass === "RL") {
      constraints.push("RL zoning — large lot minimums apply; agricultural uses permitted");
    }
    if (zoningClass === "NLR") {
      constraints.push("NLR zoning — Natural/Limited Recreation; significant development restrictions");
    }

    // 6. BUILD DESCRIPTION
    const primaryRoad = roads.find((r: any) => r.nfc === "Major Collector" || r.type === "County Primary") || roads[0];
    const zoningDesc: Record<string, string> = {
      RL: "Rural Large Lot / Rural Residential",
      NLR: "Natural, Limited Recreation",
      AG: "Agricultural",
      R1: "Single Family Residential",
    };

    const description = [
      `${(attrs.Acres || 0).toFixed(2)}-acre parcel (${parcelId}) in Barry County, Michigan.`,
      addresses.length > 0 ? `Address(es): ${addresses.join("; ")}.` : "",
      `Zoning: ${zoningClass}${zoningDesc[zoningClass] ? " (" + zoningDesc[zoningClass] + ")" : ""}.`,
      elevRelief > 0 ? `Elevation: ${elevMin}–${elevMax}ft, ${elevRelief}ft relief — ${elevRelief < 20 ? "flat" : elevRelief < 50 ? "gently rolling" : elevRelief < 100 ? "moderately rolling" : "hilly"} terrain.` : "",
      primaryRoad ? `Road frontage: ${primaryRoad.name} (${primaryRoad.surface}, ${primaryRoad.nfc}).` : "",
      buildings.length > 0 ? `${buildings.length} existing structure(s), ~${buildings.reduce((s: number, b: any) => s + b.area_sqft, 0).toLocaleString()} sq ft total footprint.` : "",
      drains.length > 0 || waterbodies.length > 0 ? `Hydrology: ${[...drains, ...waterbodies.filter((w: string) => w !== "Unnamed water feature")].join(", ") || "unnamed water features present"}.` : "",
    ].filter(Boolean).join(" ");

    // 7. UPDATE PROJECT (if projectId provided)
    const gisData = {
      property_address: addresses.join(", ") || null,
      property_coordinates: { lat: centroid.lat, lon: centroid.lon },
      property_size_acres: parseFloat((attrs.Acres || 0).toFixed(2)),
      location: addresses[0] ? `${addresses[0]}, Michigan` : `Barry County, Michigan`,
      property_description: description,
      constraints,
    };

    if (projectId) {
      await base44.asServiceRole.entities.Project.update(projectId, gisData);
    }

    return Response.json({
      ok: true,
      parcel_id: parcelId,
      project_id: projectId || null,
      updated: !!projectId,
      gis_data: gisData,
      raw: {
        area_acres: parseFloat((attrs.Acres || 0).toFixed(2)),
        centroid,
        bbox,
        polygon_rings: rings,
        zoning: { class: zoningClass, description: zoningDesc[zoningClass] || zoningClass },
        elevation_ft: elevFt,
        roads: [...new Map(roads.map((r: any) => [r.name, r])).values()],
        buildings,
        drains,
        waterbodies,
      },
    }, { status: 200, headers: cors });

  } catch (err: any) {
    return Response.json({ error: err.message || "Internal server error" }, { status: 500, headers: cors });
  }
});
