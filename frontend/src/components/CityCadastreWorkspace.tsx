import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Activity,
  ArrowDownUp,
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Database,
  Eye,
  EyeOff,
  Layers3,
  Map as MapIcon,
  Maximize2,
  Minus,
  MousePointer2,
  Mountain,
  Move,
  Plus,
  RotateCcw,
  RotateCw,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Trees,
  Waypoints,
  X,
} from "lucide-react";

type Geometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type GeoFeature = {
  type: "Feature";
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry: Geometry;
};

type CityData = {
  buildings: GeoFeature[];
  parcels: GeoFeature[];
  totalBuildings: number;
  center: { lat: number; lon: number };
  sourceNote?: string;
};

type OsmWay = { tags?: Record<string, string>; geometry?: Array<{ lat: number; lon: number }> };
type OsmTree = { lat: number; lon: number; tags?: Record<string, string> };
type OsmContext = { roads: OsmWay[]; trees: OsmTree[] };

export type City = "bhopal" | "reference";
type ToolMode = "select" | "pan" | "rotate" | "zoom";
type Layers = {
  buildings: boolean;
  parcels: boolean;
  terrain: boolean;
  underground: boolean;
  validation: boolean;
  roads: boolean;
  trees: boolean;
};
type Check = { name: string; status: "VALID" | "WARNING" | "ERROR"; note: string };

const BHOPAL_DATA_URL = "/data/processed/buildings/bhopal_buildings_3d.geojson";
const NYC_BUILDINGS_URL = "https://data.cityofnewyork.us/resource/5zhs-2jue.geojson";
const NYC_PARCELS_URL =
  "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query";
const NYC_QUERY_BOX = "40.736,-74.012,40.758,-73.978";
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const BHP_DEFAULT_CENTER = { lat: 23.2596, lon: 77.4126 };
const METERS_PER_LATITUDE_DEGREE = 111_320;
const osmContextCache = new Map<string, OsmContext>();

function property(feature: GeoFeature | null | undefined, ...keys: string[]) {
  const props = feature?.properties ?? {};
  for (const key of keys) {
    const normalizedKey = key.toLowerCase();
    const exact = props[key] ?? props[normalizedKey];
    if (exact !== undefined && exact !== null && exact !== "") return exact;
    const caseInsensitive = Object.entries(props).find(
      ([name, value]) => name.toLowerCase() === normalizedKey && value !== undefined && value !== null && value !== "",
    );
    if (caseInsensitive) return caseInsensitive[1];
  }
  return undefined;
}

function numericValue(...values: unknown[]): number | null {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const result = Number(value);
    if (Number.isFinite(result)) return result;
  }
  return null;
}

function identifier(feature: GeoFeature, index: number, city: City) {
  const value = property(
    feature,
    "building_id",
    "building_code",
    "id",
    "ulpin",
    "bin",
    "doitt_id",
    "fid",
  );
  if (value !== undefined) return String(value);
  return city === "bhopal" ? `BHP-${index + 1}` : `NYC-${index + 1}`;
}

function featurePolygons(feature: GeoFeature) {
  return feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
}

function featureCenter(feature: GeoFeature) {
  const ring = featurePolygons(feature)[0]?.[0];
  if (!ring?.length) return { lat: 0, lon: 0 };
  let lon = 0;
  let lat = 0;
  let count = 0;
  for (const point of ring) {
    if (Number.isFinite(point[0]) && Number.isFinite(point[1])) {
      lon += point[0];
      lat += point[1];
      count += 1;
    }
  }
  return count ? { lon: lon / count, lat: lat / count } : { lat: 0, lon: 0 };
}

function projectCoordinate(lon: number, lat: number, center: { lat: number; lon: number }) {
  const east = (lon - center.lon) * METERS_PER_LATITUDE_DEGREE * Math.cos((center.lat * Math.PI) / 180);
  const north = (lat - center.lat) * METERS_PER_LATITUDE_DEGREE;
  return new THREE.Vector2(east, north);
}

async function fetchOpenStreetMapContext(center: CityData["center"], city: City, signal: AbortSignal): Promise<OsmContext> {
  const cacheKey = `${city}:${center.lat.toFixed(4)}:${center.lon.toFixed(4)}`;
  const cached = osmContextCache.get(cacheKey);
  if (cached) return cached;
  const latDelta = city === "bhopal" ? 0.0065 : 0.0105;
  const lonDelta = city === "bhopal" ? 0.0085 : 0.014;
  const south = (center.lat - latDelta).toFixed(5);
  const west = (center.lon - lonDelta).toFixed(5);
  const north = (center.lat + latDelta).toFixed(5);
  const east = (center.lon + lonDelta).toFixed(5);
  const box = `${south},${west},${north},${east}`;
  const query = `[out:json][timeout:20];way["highway"](${box})->.roads;node["natural"="tree"](${box})->.trees;.roads out geom;.trees out body;`;
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    signal,
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query }),
  });
  if (!response.ok) throw new Error(`OpenStreetMap context request failed (${response.status})`);
  const payload = await response.json() as { elements?: Array<{ type: string; tags?: Record<string, string>; geometry?: OsmWay["geometry"]; lat?: number; lon?: number }> };
  const elements = payload.elements ?? [];
  const roads = elements.filter((item): item is typeof item & { geometry: NonNullable<OsmWay["geometry"]> } => item.type === "way" && Array.isArray(item.geometry) && item.geometry.length > 1).slice(0, 2_500);
  const trees = elements.filter((item): item is typeof item & { lat: number; lon: number } => item.type === "node" && Number.isFinite(item.lat) && Number.isFinite(item.lon)).slice(0, 450);
  const context = { roads, trees };
  osmContextCache.set(cacheKey, context);
  return context;
}

function roadWidth(highway: string | undefined) {
  switch (highway) {
    case "motorway": case "trunk": return 9;
    case "primary": return 7;
    case "secondary": return 5.5;
    case "tertiary": return 4.2;
    case "residential": case "unclassified": return 3.1;
    case "service": return 2.4;
    case "footway": case "path": case "cycleway": return 1.2;
    default: return 2.2;
  }
}

function makeRoadSurface(roads: OsmWay[], center: CityData["center"]) {
  const positions: number[] = [];
  const indices: number[] = [];
  let segmentCount = 0;
  roads.forEach((road) => {
    if (segmentCount >= 20_000) return;
    const points = (road.geometry ?? []).map(({ lat, lon }) => projectCoordinate(lon, lat, center));
    const halfWidth = roadWidth(road.tags?.highway) / 2;
    for (let index = 1; index < points.length; index += 1) {
      if (segmentCount >= 20_000) break;
      const start = points[index - 1];
      const end = points[index];
      const dx = end.x - start.x;
      const dz = end.y - start.y;
      const length = Math.hypot(dx, dz);
      if (length < 0.5 || length > 150) continue;
      const ox = (-dz / length) * halfWidth;
      const oz = (dx / length) * halfWidth;
      const first = positions.length / 3;
      positions.push(
        start.x + ox, 0.09, start.y + oz,
        start.x - ox, 0.09, start.y - oz,
        end.x + ox, 0.09, end.y + oz,
        end.x - ox, 0.09, end.y - oz,
      );
      indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
      segmentCount += 1;
    }
  });
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: "#516670", roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "openstreetmap-roads";
  mesh.userData.source = "OpenStreetMap contributors";
  return mesh;
}

function makeMappedTreeSymbols(trees: OsmTree[], center: CityData["center"]) {
  const group = new THREE.Group();
  group.name = "openstreetmap-mapped-tree-symbols";
  if (!trees.length) return group;
  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.17, 1.2, 5);
  const crownGeometry = new THREE.ConeGeometry(0.9, 2.4, 6);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#805e45", roughness: 1 });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: "#568769", roughness: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, trees.length);
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, trees.length);
  const transform = new THREE.Object3D();
  trees.forEach((tree, index) => {
    const point = projectCoordinate(tree.lon, tree.lat, center);
    transform.position.set(point.x, 0.7, point.y);
    transform.rotation.y = (index * 2.399) % (Math.PI * 2);
    transform.updateMatrix();
    trunks.setMatrixAt(index, transform.matrix);
    transform.position.y = 2.15;
    transform.updateMatrix();
    crowns.setMatrixAt(index, transform.matrix);
  });
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  trunks.name = "symbolic-tree-trunks";
  crowns.name = "symbolic-tree-crowns";
  group.add(trunks, crowns);
  return group;
}

function clearThreeGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children.pop();
    child?.traverse((object) => {
      const renderable = object as THREE.Mesh;
      renderable.geometry?.dispose();
      const materials = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      materials.forEach((material) => material?.dispose());
    });
  }
}

function ringToShape(ring: number[][], center: { lat: number; lon: number }) {
  const shape = new THREE.Shape();
  ring.forEach(([lon, lat], index) => {
    const point = projectCoordinate(lon, lat, center);
    if (index === 0) shape.moveTo(point.x, -point.y);
    else shape.lineTo(point.x, -point.y);
  });
  shape.closePath();
  return shape;
}

function makeExtrusion(feature: GeoFeature, center: { lat: number; lon: number }, height: number) {
  const shapes: THREE.Shape[] = [];
  for (const polygon of featurePolygons(feature)) {
    const outer = polygon[0];
    if (!outer || outer.length < 4) continue;
    const shape = ringToShape(outer, center);
    for (const inner of polygon.slice(1)) {
      if (!inner || inner.length < 4) continue;
      const hole = new THREE.Path();
      inner.forEach(([lon, lat], index) => {
        const point = projectCoordinate(lon, lat, center);
        if (index === 0) hole.moveTo(point.x, -point.y);
        else hole.lineTo(point.x, -point.y);
      });
      hole.closePath();
      shape.holes.push(hole);
    }
    shapes.push(shape);
  }
  if (!shapes.length || !Number.isFinite(height) || height <= 0) return null;
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: height,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function heightMeters(feature: GeoFeature, city: City) {
  if (city === "bhopal") {
    return numericValue(
      property(feature, "height_3d_m"),
      property(feature, "estimated_height_m"),
      property(feature, "height"),
    );
  }
  const roofFeet = numericValue(property(feature, "height_roof", "Height Roof"));
  return roofFeet === null ? null : roofFeet * 0.3048;
}

function groundElevationMeters(feature: GeoFeature, city: City) {
  if (city === "bhopal") {
    return numericValue(property(feature, "ground_elevation_m", "elevation_ground_m"));
  }
  const elevationFeet = numericValue(property(feature, "ground_elevation", "Ground Elevation"));
  return elevationFeet === null ? null : elevationFeet * 0.3048;
}

function propertyBbl(feature: GeoFeature | null) {
  const value = property(feature, "base_bbl", "mappluto_bbl", "bbl", "parcel_id");
  return value === undefined ? "" : String(value).replace(/\.0$/, "");
}

function parcelId(feature: GeoFeature, index: number) {
  const value = property(feature, "bbl", "base_bbl", "plutomapid", "objectid");
  return value === undefined ? `MAPPLUTO-${index + 1}` : String(value).replace(/\.0$/, "");
}

function polygonAreaSquareMeters(feature: GeoFeature, center: { lat: number; lon: number }) {
  let total = 0;
  for (const polygon of featurePolygons(feature)) {
    for (let ringIndex = 0; ringIndex < polygon.length; ringIndex += 1) {
      const ring = polygon[ringIndex];
      let ringArea = 0;
      for (let pointIndex = 0; pointIndex < ring.length; pointIndex += 1) {
        const first = projectCoordinate(ring[pointIndex][0], ring[pointIndex][1], center);
        const second = projectCoordinate(
          ring[(pointIndex + 1) % ring.length][0],
          ring[(pointIndex + 1) % ring.length][1],
          center,
        );
        ringArea += first.x * second.y - second.x * first.y;
      }
      const area = Math.abs(ringArea) / 2;
      total += ringIndex === 0 ? area : -area;
    }
  }
  return Math.max(0, total);
}

function isClosedPolygon(feature: GeoFeature) {
  const polygons = featurePolygons(feature);
  if (!polygons.length) return false;
  return polygons.every((polygon) => {
    const ring = polygon[0];
    if (!ring || ring.length < 4) return false;
    const first = ring[0];
    const last = ring[ring.length - 1];
    return first[0] === last[0] && first[1] === last[1];
  });
}

function featureCollection(value: unknown): GeoFeature[] {
  if (!value || typeof value !== "object") return [];
  const features = (value as { features?: unknown[] }).features ?? [];
  return features.filter((item): item is GeoFeature => {
    if (!item || typeof item !== "object") return false;
    const feature = item as GeoFeature;
    return (
      feature.type === "Feature" &&
      !!feature.geometry &&
      (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
    );
  });
}

async function fetchNycBuildings(signal: AbortSignal) {
  const query = new URLSearchParams({
    $limit: "1400",
    $order: "height_roof DESC",
    $where: `within_box(the_geom, ${NYC_QUERY_BOX.split(",").join(", ")})`,
  });
  const response = await fetch(`${NYC_BUILDINGS_URL}?${query}`, {
    signal,
    headers: { Accept: "application/geo+json, application/json" },
  });
  if (!response.ok) throw new Error(`NYC building data request failed (${response.status})`);
  return featureCollection(await response.json());
}

async function fetchNycParcels(signal: AbortSignal) {
  const [south, west, north, east] = NYC_QUERY_BOX.split(",");
  const query = new URLSearchParams({
    where: "1=1",
    geometry: `${west},${south},${east},${north}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    outSR: "4326",
    f: "geojson",
    resultRecordCount: "1800",
  });
  const response = await fetch(`${NYC_PARCELS_URL}?${query}`, {
    signal,
    headers: { Accept: "application/geo+json, application/json" },
  });
  if (!response.ok) throw new Error(`NYC parcel data request failed (${response.status})`);
  return featureCollection(await response.json());
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function localPoint(feature: GeoFeature, center: { lat: number; lon: number }) {
  const c = featureCenter(feature);
  return projectCoordinate(c.lon, c.lat, center);
}

function addParcelLines(
  group: THREE.Group,
  parcels: GeoFeature[],
  center: { lat: number; lon: number },
) {
  parcels.forEach((parcel, index) => {
    const item = new THREE.Group();
    item.userData = { parcel, index };
    for (const polygon of featurePolygons(parcel)) {
      const ring = polygon[0];
      if (!ring || ring.length < 3) continue;
      const points = ring.map(([lon, lat]) => {
        const projected = projectCoordinate(lon, lat, center);
        return new THREE.Vector3(projected.x, 0.55, projected.y);
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: "#e3bb6b",
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const line = new THREE.LineLoop(geometry, material);
      line.userData = { parcel, index };
      item.add(line);
    }
    group.add(item);
  });
}

function makeUndergroundGroup() {
  const group = new THREE.Group();
  group.name = "conceptual-underground";
  for (let index = -4; index <= 4; index += 1) {
    const offset = index * 70;
    const horizontal = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-520, -11, offset),
      new THREE.Vector3(-180, -11.5, offset + 7),
      new THREE.Vector3(180, -12, offset - 5),
      new THREE.Vector3(520, -11.5, offset + 2),
    ]);
    const vertical = new THREE.CatmullRomCurve3([
      new THREE.Vector3(offset, -12, -520),
      new THREE.Vector3(offset + 5, -11.5, -180),
      new THREE.Vector3(offset - 4, -12, 180),
      new THREE.Vector3(offset, -11.5, 520),
    ]);
    for (const curve of [horizontal, vertical]) {
      const geometry = new THREE.TubeGeometry(curve, 32, index % 3 === 0 ? 1.1 : 0.55, 5, false);
      const material = new THREE.MeshStandardMaterial({
        color: index % 3 === 0 ? "#4dc0bc" : "#8c9da8",
        roughness: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const pipe = new THREE.Mesh(geometry, material);
      pipe.userData = { conceptual: true };
      group.add(pipe);
    }
  }
  return group;
}

function makeElevationSurface(
  features: GeoFeature[],
  center: { lat: number; lon: number },
  datum: number,
) {
  const samples = features
    .map((feature) => {
      const elevation = groundElevationMeters(feature, "bhopal") ??
        (() => {
          const feet = numericValue(property(feature, "ground_elevation", "Ground Elevation"));
          return feet === null ? null : feet * 0.3048;
        })();
      if (elevation === null) return null;
      const point = localPoint(feature, center);
      return { x: point.x, z: point.y, y: elevation - datum };
    })
    .filter((sample): sample is { x: number; z: number; y: number } => sample !== null);

  if (samples.length < 3) return null;
  const geometry = new THREE.PlaneGeometry(1_200, 1_200, 32, 32);
  const positions = geometry.getAttribute("position");
  const colors: number[] = [];
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = -positions.getY(index);
    const nearby = samples
      .map((sample) => ({ sample, distance: Math.hypot(sample.x - x, sample.z - z) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
    let weighted = 0;
    let weights = 0;
    for (const item of nearby) {
      const weight = 1 / Math.max(16, item.distance * item.distance);
      weighted += item.sample.y * weight;
      weights += weight;
    }
    const relativeHeight = weights ? weighted / weights : 0;
    positions.setZ(index, THREE.MathUtils.clamp(relativeHeight * 1.5, -18, 18));
    const tint = THREE.MathUtils.clamp((relativeHeight + 5) / 18, 0, 1);
    const color = new THREE.Color().setHSL(0.49 - tint * 0.11, 0.55, 0.3 + tint * 0.22);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.64,
    roughness: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -0.25;
  mesh.userData = { derivedFromBuildingGroundElevations: true };
  return mesh;
}

function demoIdentifier(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `3D-ULPIN-DEMO-${(hash >>> 0).toString(16).slice(-5).toUpperCase().padStart(5, "0")}`;
}

const STATUS_STYLE: Record<Check["status"], string> = {
  VALID: "border-emerald-300/15 bg-emerald-300/10 text-emerald-200",
  WARNING: "border-amber-300/15 bg-amber-300/10 text-amber-100",
  ERROR: "border-rose-300/15 bg-rose-300/10 text-rose-200",
};

const STATUS_DOT: Record<Check["status"], string> = {
  VALID: "bg-emerald-400",
  WARNING: "bg-amber-400",
  ERROR: "bg-rose-400",
};

type CityCadastreWorkspaceProps = {
  legacyViewer?: React.ReactNode;
  showLegacyInspector?: boolean;
  selectedCity?: City;
  onCityChange?: (city: City) => void;
  showCitySelector?: boolean;
};

export function CityCadastreWorkspace({
  legacyViewer,
  showLegacyInspector = true,
  selectedCity,
  onCityChange,
  showCitySelector = true,
}: CityCadastreWorkspaceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const parcelGroupRef = useRef<THREE.Group | null>(null);
  const volumeGroupRef = useRef<THREE.Group | null>(null);
  const floorGroupRef = useRef<THREE.Group | null>(null);
  const terrainGroupRef = useRef<THREE.Group | null>(null);
  const undergroundGroupRef = useRef<THREE.Group | null>(null);
  const roadsGroupRef = useRef<THREE.Group | null>(null);
  const treesGroupRef = useRef<THREE.Group | null>(null);
  const buildingMeshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const mapClickRef = useRef<(event: MouseEvent) => void>(() => {});
  const initialCameraRef = useRef({ x: 420, y: 520, z: 420 });

  const [internalCity, setInternalCity] = useState<City>("bhopal");
  const city = selectedCity ?? internalCity;
  const changeCity = (nextCity: City) => {
    setInternalCity(nextCity);
    onCityChange?.(nextCity);
  };
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<CityData | null>(null);
  const [osmContext, setOsmContext] = useState<OsmContext | null>(null);
  const [osmStatus, setOsmStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Starting 3D workspace…");
  const [error, setError] = useState("");
  const [layers, setLayers] = useState<Layers>({
    buildings: true,
    parcels: true,
    terrain: false,
    underground: false,
    validation: true,
    roads: true,
    trees: false,
  });
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<GeoFeature | null>(null);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(-1);
  const [selectedParcel, setSelectedParcel] = useState<GeoFeature | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [showFloorView, setShowFloorView] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [xray, setXray] = useState(false);
  const [tool, setTool] = useState<ToolMode>("select");
  const [showLegacy, setShowLegacy] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [validationResult, setValidationResult] = useState<Check[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [demoUlpIn, setDemoUlpIn] = useState("");
  const [zRange, setZRange] = useState({ min: 0, max: 3 });

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    setSelectedBuilding(null);
    setSelectedBuildingIndex(-1);
    setSelectedParcel(null);
    setValidationResult(null);
    setDemoUlpIn("");
    setShowFloorView(false);
    setShowVolume(false);

    if (city === "bhopal") {
      setLoadingMessage("Preparing the Bhopal project dataset…");
      const worker = new Worker(new URL("./bhopalDataset.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent<
        | { kind: "progress"; message: string }
        | {
            kind: "success";
            features: GeoFeature[];
            totalFeatures: number;
            center: { lat: number; lon: number };
            radiusMeters: number;
          }
        | { kind: "error"; message: string }
      >) => {
        const message = event.data;
        if (message.kind === "progress") {
          setLoadingMessage(message.message);
        } else if (message.kind === "error") {
          setError(message.message);
          setLoading(false);
        } else {
          setData({
            buildings: message.features,
            parcels: [],
            totalBuildings: message.totalFeatures,
            center: message.center,
            sourceNote: `Local inspection radius: ${Math.round(message.radiusMeters).toLocaleString()} m`,
          });
          setLoading(false);
        }
      };
      worker.onerror = () => {
        setError("The Bhopal dataset worker could not start. Check that the GeoJSON file is in frontend/public/data/processed/buildings/.");
        setLoading(false);
      };
      worker.postMessage({
        url: BHOPAL_DATA_URL,
        maxFeatures: 1_500,
        initialRadiusMeters: 720,
      });
      return () => {
        abortController.abort();
        worker.terminate();
      };
    }

    setLoadingMessage("Loading New York City open building and parcel data…");
    Promise.allSettled([
      fetchNycBuildings(abortController.signal),
      fetchNycParcels(abortController.signal),
    ]).then(([buildingResult, parcelResult]) => {
      if (abortController.signal.aborted) return;
      if (buildingResult.status === "rejected" || buildingResult.value.length === 0) {
        const message =
          buildingResult.status === "rejected" && buildingResult.reason instanceof Error
            ? buildingResult.reason.message
            : "The NYC open building service returned no footprints for this sample area.";
        setError(`${message} Check your internet connection, then switch back to Reference City.`);
        setLoading(false);
        return;
      }

      const buildings = buildingResult.value;
      const centers = buildings.map(featureCenter);
      const center = {
        lat: centers.reduce((sum, point) => sum + point.lat, 0) / centers.length,
        lon: centers.reduce((sum, point) => sum + point.lon, 0) / centers.length,
      };
      const parcels = parcelResult.status === "fulfilled" ? parcelResult.value : [];
      setData({
        buildings,
        parcels,
        totalBuildings: buildings.length,
        center,
        sourceNote:
          parcelResult.status === "fulfilled"
            ? "NYC Open Data · Midtown Manhattan sample"
            : "Building data loaded; parcel service unavailable for this session.",
      });
      setLoading(false);
    });

    return () => abortController.abort();
  }, [city, reloadKey]);

  useEffect(() => {
    if (!data) {
      setOsmContext(null);
      setOsmStatus("idle");
      return;
    }
    const controller = new AbortController();
    setOsmContext(null);
    setOsmStatus("loading");
    fetchOpenStreetMapContext(data.center, city, controller.signal)
      .then((context) => {
        if (controller.signal.aborted) return;
        setOsmContext(context);
        setOsmStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setOsmStatus("error");
      });
    return () => controller.abort();
  }, [data, city]);

  useEffect(() => {
    const roadsGroup = roadsGroupRef.current;
    const treesGroup = treesGroupRef.current;
    if (!roadsGroup || !treesGroup || !data || !osmContext) return;
    clearThreeGroup(roadsGroup);
    clearThreeGroup(treesGroup);
    const roads = makeRoadSurface(osmContext.roads, data.center);
    if (roads) roadsGroup.add(roads);
    treesGroup.add(makeMappedTreeSymbols(osmContext.trees, data.center));
    roadsGroup.visible = layers.roads;
    treesGroup.visible = layers.trees;
  }, [data, osmContext, city]);

  const baseElevations = useMemo(
    () =>
      (data?.buildings ?? [])
        .map((feature) => groundElevationMeters(feature, city))
        .filter((value): value is number => value !== null),
    [data, city],
  );
  const elevationDatum = useMemo(() => median(baseElevations), [baseElevations]);

  const parcelLookup = useMemo(() => {
    const result = new Map<string, GeoFeature>();
    (data?.parcels ?? []).forEach((parcel) => {
      const id = parcelId(parcel, 0);
      const bbl = property(parcel, "bbl", "base_bbl");
      result.set(String(bbl ?? id).replace(/\.0$/, ""), parcel);
      result.set(id.replace(/\.0$/, ""), parcel);
    });
    return result;
  }, [data]);

  const linkedParcel = useMemo(() => {
    if (selectedBuilding) return parcelLookup.get(propertyBbl(selectedBuilding)) ?? null;
    return selectedParcel;
  }, [selectedBuilding, selectedParcel, parcelLookup]);

  const selectedMeasurement = useMemo(() => {
    if (!selectedBuilding) return null;
    const height = heightMeters(selectedBuilding, city);
    const elevation = groundElevationMeters(selectedBuilding, city);
    const bbl = propertyBbl(selectedBuilding);
    const parcelFloors = numericValue(property(linkedParcel, "numfloors", "num_floors"));
    const datasetFloors = numericValue(property(selectedBuilding, "estimated_floors", "floors"));
    const floorsRaw = parcelFloors ?? datasetFloors ?? (height ? height / 3.2 : 1);
    const floors = Math.max(1, Math.round(floorsRaw));
    const floorHeight = height && floors ? height / floors : 3.2;
    const floorBase = (elevation ?? 0) + selectedFloor * floorHeight;
    const area = data ? polygonAreaSquareMeters(selectedBuilding, data.center) : 0;
    const heightSource =
      city === "bhopal"
        ? String(property(selectedBuilding, "height_source") ?? "Dataset field not supplied")
        : "NYC OTI Building Footprints · Height Roof (source feet, displayed in metres)";
    const confidence =
      city === "bhopal"
        ? String(property(selectedBuilding, "height_confidence", "confidence") ?? "Not supplied")
        : "Source value · City dataset (no per-building confidence field)";
    const modelType = String(
      property(selectedBuilding, "model_type") ??
        (city === "reference" ? "Extruded open footprint · reference view" : "Extruded project footprint"),
    );
    const floorSource = parcelFloors !== null
      ? "PLUTO floor count · parcel-level context"
      : datasetFloors !== null
        ? "Dataset estimated_floors field"
        : "Derived from height ÷ 3.2 m · prototype subdivision";
    const verticalSource =
      city === "bhopal"
        ? String(property(selectedBuilding, "vertical_source") ?? "Not supplied")
        : "Ground Elevation + Height Roof · source feet converted to metres";
    const min = zRange.min;
    const max = zRange.max;
    return {
      height,
      elevation,
      floors,
      floorHeight,
      floorBase,
      floorTop: floorBase + floorHeight,
      area,
      volume: area * Math.max(0, max - min),
      bbl,
      heightSource,
      confidence,
      modelType,
      floorSource,
      verticalSource,
      zMin: min,
      zMax: max,
      floorTopElevation: (elevation ?? 0) + (height ?? 0),
    };
  }, [selectedBuilding, city, data, linkedParcel, selectedFloor, zRange]);

  const checks = useMemo<Check[]>(() => {
    if (!selectedBuilding || !selectedMeasurement) return [];
    const geometryValid = isClosedPolygon(selectedBuilding);
    const hasParcelRelationship = !!selectedMeasurement.bbl && !!linkedParcel;
    const heightValid = selectedMeasurement.height !== null && selectedMeasurement.height > 0;
    const zValid = selectedMeasurement.zMax > selectedMeasurement.zMin;
    const volumeValid = selectedMeasurement.area > 0 && selectedMeasurement.volume > 0;
    const groundKnown = selectedMeasurement.elevation !== null;
    const floorRatio = selectedMeasurement.height
      ? selectedMeasurement.height / selectedMeasurement.floors
      : 0;
    const floorPlausible = floorRatio >= 1.8 && floorRatio <= 5.5;

    return [
      {
        name: "Building geometry",
        status: geometryValid ? "VALID" : "ERROR",
        note: geometryValid ? "Closed polygon ring with a usable footprint." : "Footprint ring is missing, open, or too short.",
      },
      {
        name: "Height input",
        status: heightValid ? "VALID" : "ERROR",
        note: heightValid ? `${selectedMeasurement.height?.toFixed(2)} m from the displayed source field.` : "No positive source height is available.",
      },
      {
        name: "Building ↔ parcel link",
        status: hasParcelRelationship ? "VALID" : "WARNING",
        note: hasParcelRelationship
          ? `Matched by parcel key ${selectedMeasurement.bbl}.`
          : city === "bhopal"
            ? "The Bhopal buildings file does not include parcel polygon geometry."
            : "No matching parcel polygon was returned for this building key.",
      },
      {
        name: "Vertical range",
        status: zValid ? "VALID" : "ERROR",
        note: zValid ? `Z-min ${selectedMeasurement.zMin.toFixed(2)} m < Z-max ${selectedMeasurement.zMax.toFixed(2)} m.` : "Z-max must be above Z-min.",
      },
      {
        name: "Floor consistency",
        status: floorPlausible && selectedMeasurement.floorSource.includes("PLUTO") ? "VALID" : "WARNING",
        note: `${selectedMeasurement.floors} levels · ${selectedMeasurement.floorHeight.toFixed(2)} m/level; ${selectedMeasurement.floorSource}.`,
      },
      {
        name: "Ground elevation",
        status: groundKnown ? "VALID" : "WARNING",
        note: groundKnown
          ? `${selectedMeasurement.elevation?.toFixed(2)} m at building base from the dataset.`
          : "No building base elevation field; Z display uses a local relative datum.",
      },
      {
        name: "Spatial reference",
        status: "VALID",
        note: city === "reference" ? "NYC source geometry requested in WGS 84 (EPSG:4326)." : "Project GeoJSON coordinates are treated as WGS 84 (EPSG:4326).",
      },
      {
        name: "3D volume",
        status: volumeValid ? "VALID" : "ERROR",
        note: volumeValid ? `${selectedMeasurement.volume.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³ · footprint area × selected Z range.` : "A positive footprint and vertical range are required.",
      },
    ];
  }, [selectedBuilding, selectedMeasurement, linkedParcel, city]);

  useEffect(() => {
    if (!mountRef.current) return;
    const host = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#07131d");
    scene.fog = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, host.clientWidth / Math.max(1, host.clientHeight), 0.3, 50_000);
    camera.position.set(420, 520, 420);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    const handleCanvasClick = (event: MouseEvent) => mapClickRef.current(event);
    renderer.domElement.addEventListener("click", handleCanvasClick);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.screenSpacePanning = true;
    controls.minDistance = 3;
    controls.maxDistance = 20_000;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#dbeeff", "#10252d", 2.05));
    const sun = new THREE.DirectionalLight("#fff5e7", 2.1);
    sun.position.set(-420, 1_000, 560);
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#53a9bd", 0.7);
    fill.position.set(430, 250, -500);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50_000, 50_000),
      new THREE.MeshStandardMaterial({ color: "#12252d", roughness: 0.96, metalness: 0 }),
    );
    ground.name = "local-ground-datum";
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -22;
    scene.add(ground);
    scene.add(new THREE.GridHelper(3_200, 64, "#48616a", "#203843"));

    const buildings = new THREE.Group();
    buildings.name = "buildings";
    scene.add(buildings);
    buildingGroupRef.current = buildings;
    const parcels = new THREE.Group();
    parcels.name = "parcels";
    scene.add(parcels);
    parcelGroupRef.current = parcels;
    const volumes = new THREE.Group();
    volumes.name = "selected-property-volume";
    scene.add(volumes);
    volumeGroupRef.current = volumes;
    const floors = new THREE.Group();
    floors.name = "selected-floor-slice";
    scene.add(floors);
    floorGroupRef.current = floors;
    const terrain = new THREE.Group();
    terrain.name = "derived-elevation-surface";
    scene.add(terrain);
    terrainGroupRef.current = terrain;
    const underground = makeUndergroundGroup();
    underground.visible = false;
    scene.add(underground);
    undergroundGroupRef.current = underground;
    const roads = new THREE.Group();
    roads.name = "openstreetmap-road-layer";
    scene.add(roads);
    roadsGroupRef.current = roads;
    const trees = new THREE.Group();
    trees.name = "openstreetmap-tree-layer";
    trees.visible = false;
    scene.add(trees);
    treesGroupRef.current = trees;

    const resize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = Math.max(1, mountRef.current.clientWidth);
      const height = Math.max(1, mountRef.current.clientHeight);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    let frame = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("click", handleCanvasClick);
      scene.traverse((object) => {
        const item = object as THREE.Mesh;
        if (item.geometry) item.geometry.dispose();
        const materials = Array.isArray(item.material) ? item.material : [item.material];
        materials.forEach((material) => material?.dispose());
      });
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      buildingGroupRef.current = null;
      parcelGroupRef.current = null;
      volumeGroupRef.current = null;
      floorGroupRef.current = null;
      terrainGroupRef.current = null;
      undergroundGroupRef.current = null;
      roadsGroupRef.current = null;
      treesGroupRef.current = null;
      buildingMeshesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const buttons = controls.mouseButtons;
    if (tool === "pan") buttons.LEFT = THREE.MOUSE.PAN;
    else if (tool === "zoom") buttons.LEFT = THREE.MOUSE.DOLLY;
    else buttons.LEFT = THREE.MOUSE.ROTATE;
    buttons.RIGHT = THREE.MOUSE.PAN;
  }, [tool]);

  useEffect(() => {
    const scene = sceneRef.current;
    const buildingGroup = buildingGroupRef.current;
    const parcelGroup = parcelGroupRef.current;
    const terrainGroup = terrainGroupRef.current;
    if (!scene || !buildingGroup || !parcelGroup || !data) return;

    const disposeGroup = (group: THREE.Group) => {
      while (group.children.length) {
        const child = group.children.pop();
        if (!child) continue;
        child.traverse((object) => {
          const item = object as THREE.Mesh;
          item.geometry?.dispose();
          const materials = Array.isArray(item.material) ? item.material : [item.material];
          materials.forEach((material) => material?.dispose());
        });
      }
    };
    disposeGroup(buildingGroup);
    disposeGroup(parcelGroup);
    if (terrainGroup) disposeGroup(terrainGroup);

    buildingMeshesRef.current = [];
    const referenceDatum = median(
      data.buildings
        .map((feature) => groundElevationMeters(feature, city))
        .filter((value): value is number => value !== null),
    );

    data.buildings.forEach((feature, index) => {
      const height = heightMeters(feature, city);
      if (height === null || height <= 0) return;
      const geometry = makeExtrusion(feature, data.center, height);
      if (!geometry) return;
      const material = new THREE.MeshStandardMaterial({
        color: index % 7 === 0 ? "#80c3d6" : "#4c9bb6",
        roughness: 0.82,
        metalness: 0.04,
        transparent: true,
        opacity: 0.96,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const elevation = groundElevationMeters(feature, city);
      const relativeElevation = elevation === null ? 0 : elevation - referenceDatum;
      mesh.position.y = relativeElevation;
      mesh.userData = { feature, index, height, relativeElevation, baseColor: material.color.clone() };
      buildingGroup.add(mesh);
      buildingMeshesRef.current.push(mesh);
    });

    addParcelLines(parcelGroup, data.parcels, data.center);
    const elevationSurface = makeElevationSurface(data.buildings, data.center, referenceDatum);
    if (elevationSurface) terrainGroup?.add(elevationSurface);

    const span = Math.min(1_900, Math.max(260, (city === "bhopal" ? 1_040 : 1_450)));
    initialCameraRef.current = { x: span * 0.43, y: span * 0.55, z: span * 0.47 };
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(
        initialCameraRef.current.x,
        initialCameraRef.current.y,
        initialCameraRef.current.z,
      );
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    buildingGroup.visible = layers.buildings;
    parcelGroup.visible = layers.parcels && data.parcels.length > 0;
    if (terrainGroup) terrainGroup.visible = layers.terrain && !!elevationSurface;
    if (undergroundGroupRef.current) undergroundGroupRef.current.visible = layers.underground;
  }, [data, city]);

  useEffect(() => {
    if (buildingGroupRef.current) buildingGroupRef.current.visible = layers.buildings;
    if (parcelGroupRef.current) {
      parcelGroupRef.current.visible = layers.parcels && (data?.parcels.length ?? 0) > 0;
    }
    if (terrainGroupRef.current) terrainGroupRef.current.visible = layers.terrain;
    if (undergroundGroupRef.current) undergroundGroupRef.current.visible = layers.underground;
    if (roadsGroupRef.current) roadsGroupRef.current.visible = layers.roads;
    if (treesGroupRef.current) treesGroupRef.current.visible = layers.trees && (osmContext?.trees.length ?? 0) > 0;
  }, [layers, data, osmContext]);

  useEffect(() => {
    buildingMeshesRef.current.forEach((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      const feature = (mesh.userData.feature ?? null) as GeoFeature | null;
      const selected = feature === selectedBuilding;
      material.color.copy(
        selected
          ? new THREE.Color("#efc878")
          : (mesh.userData.baseColor as THREE.Color),
      );
      material.opacity = xray ? (selected ? 0.48 : 0.22) : selected ? 1 : 0.96;
      material.depthWrite = !xray;
      mesh.visible = !showFloorView || (selectedBuilding ? selected : false);
    });
    const group = buildingGroupRef.current;
    if (group) group.visible = layers.buildings;
  }, [selectedBuilding, xray, showFloorView, layers.buildings]);

  useEffect(() => {
    const group = volumeGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const child = group.children.pop();
      child?.traverse((object) => {
        const item = object as THREE.Mesh;
        item.geometry?.dispose();
        const materials = Array.isArray(item.material) ? item.material : [item.material];
        materials.forEach((material) => material?.dispose());
      });
    }
    if (!showVolume || !selectedBuilding || !data || !selectedMeasurement) return;
    const geometry = makeExtrusion(selectedBuilding, data.center, zRange.max - zRange.min);
    if (!geometry) return;
    const fill = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: "#f1bb65",
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    fill.position.y = zRange.min - elevationDatum;
    group.add(fill);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: "#f5d18e", transparent: true, opacity: 0.95 }),
    );
    edges.position.copy(fill.position);
    group.add(edges);
  }, [showVolume, selectedBuilding, data, selectedMeasurement, elevationDatum, zRange]);

  useEffect(() => {
    const group = floorGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const child = group.children.pop();
      child?.traverse((object) => {
        const item = object as THREE.Mesh;
        item.geometry?.dispose();
        const materials = Array.isArray(item.material) ? item.material : [item.material];
        materials.forEach((material) => material?.dispose());
      });
    }
    if (!showFloorView || !selectedBuilding || !data || !selectedMeasurement) return;
    const geometry = makeExtrusion(selectedBuilding, data.center, selectedMeasurement.floorHeight);
    if (!geometry) return;
    const level = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: "#64c4d2",
        transparent: true,
        opacity: 0.82,
        roughness: 0.6,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    level.position.y = selectedMeasurement.floorBase - elevationDatum;
    group.add(level);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: "#c1edf0", transparent: true, opacity: 0.95 }),
    );
    edge.position.copy(level.position);
    group.add(edge);
  }, [showFloorView, selectedBuilding, selectedFloor, data, selectedMeasurement, elevationDatum]);

  const focusBuilding = (feature: GeoFeature, index: number) => {
    if (!data) return;
    setSelectedBuilding(feature);
    setSelectedBuildingIndex(index);
    setSelectedParcel(parcelLookup.get(propertyBbl(feature)) ?? null);
    setSelectedFloor(0);
    setShowFloorView(false);
    setShowVolume(false);
    setDemoUlpIn("");
    setZRange({ min: 0, max: 3 });
    const point = localPoint(feature, data.center);
    const height = heightMeters(feature, city) ?? 12;
    const base = groundElevationMeters(feature, city);
    const relativeElevation = base === null ? 0 : base - elevationDatum;
    if (cameraRef.current && controlsRef.current) {
      const distance = Math.max(30, Math.min(240, height * 2.8));
      const target = new THREE.Vector3(point.x, relativeElevation + height * 0.45, point.y);
      controlsRef.current.target.copy(target);
      cameraRef.current.position.set(
        target.x + distance * 0.88,
        target.y + distance * 0.66,
        target.z + distance,
      );
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    if (!selectedBuilding || !selectedMeasurement) return;
    const floorBase = selectedMeasurement.floorBase;
    setZRange({
      min: Number(floorBase.toFixed(2)),
      max: Number((floorBase + selectedMeasurement.floorHeight).toFixed(2)),
    });
  }, [selectedBuilding, selectedFloor, selectedMeasurement?.floorBase, selectedMeasurement?.floorHeight]);

  const handleMapClick = (event: MouseEvent) => {
    if (tool !== "select" || !mountRef.current || !cameraRef.current || !data) return;
    const bounds = mountRef.current.getBoundingClientRect();
    pointerRef.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointerRef.current.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycasterRef.current.params.Line = { threshold: 3.5 };
    raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);

    const buildingHits = layers.buildings && buildingGroupRef.current
      ? raycasterRef.current.intersectObjects(buildingGroupRef.current.children, true)
      : [];
    if (buildingHits.length) {
      let mesh: THREE.Object3D | null = buildingHits[0].object;
      while (mesh && !mesh.userData.feature) mesh = mesh.parent;
      if (mesh?.userData.feature) {
        focusBuilding(mesh.userData.feature as GeoFeature, Number(mesh.userData.index ?? -1));
        setShowInspector(true);
        return;
      }
    }

    const parcelHits = layers.parcels && parcelGroupRef.current
      ? raycasterRef.current.intersectObjects(parcelGroupRef.current.children, true)
      : [];
    if (parcelHits.length) {
      const item = parcelHits[0].object.userData.parcel
        ? parcelHits[0].object
        : parcelHits[0].object.parent;
      const parcel = item?.userData.parcel as GeoFeature | undefined;
      if (parcel) {
        setSelectedParcel(parcel);
        setSelectedBuilding(null);
        setSelectedBuildingIndex(-1);
        setShowFloorView(false);
        setShowVolume(false);
        setDemoUlpIn("");
        setShowInspector(true);
        return;
      }
    }
    setSelectedBuilding(null);
    setSelectedBuildingIndex(-1);
    setSelectedParcel(null);
    setShowInspector(true);
    setShowFloorView(false);
    setShowVolume(false);
    setDemoUlpIn("");
  };
  mapClickRef.current = handleMapClick;

  const selectBuildingForParcel = () => {
    if (!selectedParcel || !data) return;
    const bbl = propertyBbl(selectedParcel);
    const index = data.buildings.findIndex((feature) => propertyBbl(feature) === bbl);
    if (index >= 0) focusBuilding(data.buildings[index], index);
  };

  const filteredBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !data) return [];
    return data.buildings
      .map((feature, index) => ({ feature, index }))
      .filter(({ feature, index }) => {
        const fields = [
          identifier(feature, index, city),
          property(feature, "name"),
          property(feature, "base_bbl", "mappluto_bbl", "bbl"),
          property(feature, "address", "address1"),
        ];
        return fields.some((value) => String(value ?? "").toLowerCase().includes(query));
      })
      .slice(0, 6);
  }, [search, data, city]);

  const runValidation = () => {
    if (isValidating) return;
    setIsValidating(true);
    window.setTimeout(() => {
      setValidationResult(checks);
      setIsValidating(false);
    }, 320);
  };

  const toggleLayer = (name: keyof Layers) =>
    setLayers((previous) => ({ ...previous, [name]: !previous[name] }));

  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(
      initialCameraRef.current.x,
      initialCameraRef.current.y,
      initialCameraRef.current.z,
    );
    controlsRef.current.update();
  };

  const zoomCamera = (scale: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const target = controlsRef.current.target;
    camera.position.sub(target).multiplyScalar(scale).add(target);
    controlsRef.current.update();
  };

  const layerRows: Array<{
    id: keyof Layers;
    title: string;
    note: string;
    icon: React.ElementType;
    disabled?: boolean;
  }> = [
    { id: "buildings", title: "Buildings", note: "3D footprints + source height", icon: Building2 },
    { id: "roads", title: "Road network", note: osmStatus === "loading" ? "Loading OpenStreetMap roads…" : osmStatus === "ready" ? `${osmContext?.roads.length.toLocaleString() ?? "0"} mapped roads · OSM` : "OpenStreetMap service unavailable", icon: MapIcon },
    { id: "trees", title: "Mapped trees", note: osmStatus === "ready" ? `${osmContext?.trees.length.toLocaleString() ?? "0"} OSM points · symbols not to scale` : "Optional OpenStreetMap tree points", icon: Trees, disabled: osmStatus !== "ready" || (osmContext?.trees.length ?? 0) === 0 },
    {
      id: "parcels",
      title: "Surface parcels",
      note: city === "reference" ? "NYC MapPLUTO tax lots" : "No parcel polygons in this file",
      icon: Square,
      disabled: city === "bhopal" || (city === "reference" && (data?.parcels.length ?? 0) === 0),
    },
    { id: "terrain", title: "Elevation surface", note: "Interpolated from building base elevations", icon: Mountain, disabled: !baseElevations.length },
    { id: "underground", title: "Underground", note: "Conceptual network · prototype", icon: Waypoints },
    { id: "validation", title: "Validation", note: "Technical prototype checks", icon: ShieldCheck },
  ];

  const displayFeature = selectedBuilding ?? selectedParcel;
  const displayId = selectedBuilding
    ? identifier(selectedBuilding, selectedBuildingIndex, city)
    : selectedParcel
      ? parcelId(selectedParcel, 0)
      : "No feature selected";
  const sourceBadge = city === "bhopal" ? "ACTUAL PROJECT DATASET" : "REFERENCE DATA · PROTOTYPE";
  const activeDemoId = demoUlpIn || "Select a building and floor to create one";
  const allChecks = validationResult ?? [];
  const validCount = allChecks.filter((check) => check.status === "VALID").length;
  const warningCount = allChecks.filter((check) => check.status === "WARNING").length;
  const errorCount = allChecks.filter((check) => check.status === "ERROR").length;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#07131d] shadow-xl shadow-slate-900/10" data-language-static="true">
        <div className="relative h-[clamp(560px,78svh,900px)] min-h-[560px] w-full overflow-hidden bg-[#07131d] text-white">
          <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />

          <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-[#07131d]/95 px-4 py-3 backdrop-blur-xl sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-wide">GeoVISTA <span className="font-normal text-slate-400">/ 3D Cadastre</span></div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
                    {city === "bhopal" ? "Bhopal · Madhya Pradesh" : "Reference City · New York"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-bold tracking-wide text-slate-200">
                <span className={`h-1.5 w-1.5 rounded-full ${city === "bhopal" ? "bg-emerald-400" : "bg-amber-300"}`} />
                {sourceBadge}
              </div>
            </div>

            {showCitySelector && <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => changeCity("bhopal")}
                className={`flex min-h-[54px] items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${city === "bhopal" ? "border-cyan-300/45 bg-cyan-300/10" : "border-white/10 bg-white/[.025] hover:bg-white/[.06]"}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${city === "bhopal" ? "border-cyan-200 bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,.12)]" : "border-slate-500"}`} />
                <span>
                  <span className="block text-[11px] font-bold">BHOPAL — GeoVISTA 3D CADASTRE</span>
                  <span className="mt-0.5 block text-[9px] uppercase tracking-[.12em] text-slate-400">Real project dataset · primary city</span>
                </span>
              </button>
              <button
                onClick={() => changeCity("reference")}
                className={`flex min-h-[54px] items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${city === "reference" ? "border-amber-300/45 bg-amber-300/10" : "border-white/10 bg-white/[.025] hover:bg-white/[.06]"}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${city === "reference" ? "border-amber-100 bg-amber-300 shadow-[0_0_0_4px_rgba(252,211,77,.12)]" : "border-slate-500"}`} />
                <span>
                  <span className="block text-[11px] font-bold">REFERENCE CITY — PS DEMONSTRATION</span>
                  <span className="mt-0.5 block text-[9px] uppercase tracking-[.12em] text-slate-400">New York City · prototype / not official cadastre</span>
                </span>
              </button>
            </div>}
          </header>

          <div className="absolute left-1/2 top-[112px] z-10 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-[#091923]/90 p-1 shadow-lg backdrop-blur">
            <button onClick={() => setShowLayers((value) => { const next = !value; if (next && window.matchMedia("(max-width: 767px)").matches) setShowInspector(false); return next; })} aria-expanded={showLayers} className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[10px] font-semibold transition ${showLayers ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-white/[.06]"}`}><Layers3 size={13} />Layers</button>
            <button onClick={() => setShowSearch((value) => !value)} aria-expanded={showSearch} className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[10px] font-semibold transition ${showSearch ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-white/[.06]"}`}><Search size={13} />Search</button>
            <button onClick={() => setShowInspector((value) => { const next = !value; if (next && window.matchMedia("(max-width: 767px)").matches) setShowLayers(false); return next; })} aria-expanded={showInspector} className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[10px] font-semibold transition ${showInspector ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-white/[.06]"}`}><Activity size={13} />Inspector{displayFeature ? " · 1" : ""}</button>
          </div>

          {showLayers && <aside className="absolute bottom-[70px] left-3 top-[150px] z-10 flex w-[220px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#091923]/95 shadow-xl backdrop-blur-xl max-sm:right-3 max-sm:w-auto sm:left-4 sm:w-[244px]">
            <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-200"><Layers3 size={15} className="text-cyan-300" /> GIS layers</div>
              <div className="flex items-center gap-2"><span className="text-[9px] text-slate-500">7 available layers</span><button onClick={() => setShowLayers(false)} aria-label="Close layers panel" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={14} /></button></div>
            </div>
            <div className="space-y-1 overflow-y-auto p-2">
              {layerRows.map(({ id, title, note, icon: Icon, disabled }) => (
                <button
                  key={id}
                  disabled={disabled}
                  onClick={() => toggleLayer(id)}
                  title={disabled ? note : `Toggle ${title}`}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/[.055]"}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${layers[id] ? "bg-cyan-300/10 text-cyan-200" : "bg-white/[.04] text-slate-500"}`}><Icon size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-slate-200">{title}</span>
                    <span className="mt-0.5 block truncate text-[9px] text-slate-500">{note}</span>
                  </span>
                  <span className={`h-3 w-3 rounded-sm border ${layers[id] ? "border-cyan-300 bg-cyan-300 shadow-[inset_0_0_0_2px_#091923]" : "border-slate-600"}`} />
                </button>
              ))}
            </div>
            <div className="mt-auto border-t border-white/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.15em] text-slate-500"><Database size={12} /> Data provenance</div>
              {city === "bhopal" ? (
                <a href="#bhopal-dataset-source" className="text-[10px] leading-relaxed text-cyan-100/80 hover:text-cyan-100">Bhopal buildings GeoJSON<br />Local project dataset · 115k scale</a>
              ) : (
                <div className="space-y-1 text-[10px] leading-relaxed text-cyan-100/80">
                  <a href="https://data.cityofnewyork.us/City-Government/BUILDING/5zhs-2jue" target="_blank" rel="noreferrer" className="block hover:text-cyan-100">NYC OTI Building Footprints ↗</a>
                  <a href="https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer" target="_blank" rel="noreferrer" className="block hover:text-cyan-100">NYC DCP MapPLUTO tax lots ↗</a>
                </div>
              )}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="mt-2 block border-t border-white/10 pt-2 text-[9px] text-slate-400 hover:text-cyan-100">Roads and mapped tree points © OpenStreetMap contributors ↗</a>
            </div>
          </aside>}

          {showInspector && <aside className="absolute bottom-[70px] right-3 top-[150px] z-10 flex w-[248px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#091923]/95 shadow-xl backdrop-blur-xl max-sm:left-3 max-sm:w-auto sm:right-4 sm:w-[294px]">
            <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-200"><Activity size={15} className="text-cyan-300" /> Feature inspector</div>
              <div className="flex items-center gap-1"><button onClick={() => { setSelectedBuilding(null); setSelectedParcel(null); setShowFloorView(false); setShowVolume(false); }} disabled={!displayFeature} className="rounded px-2 py-1 text-[9px] text-slate-500 hover:bg-white/10 hover:text-white disabled:hidden">Clear</button><button onClick={() => setShowInspector(false)} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close inspector panel"><X size={14} /></button></div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <div className="rounded-lg border border-white/[.08] bg-white/[.035] p-3">
                <div className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">Selected feature</div>
                <div className="mt-1 break-all text-sm font-bold text-white">{displayId}</div>
                <div className="mt-1 text-[10px] text-slate-400">{selectedBuilding ? "Building footprint" : selectedParcel ? "Tax lot / surface parcel" : "Click a building or parcel boundary"}</div>
              </div>

              {selectedBuilding && selectedMeasurement ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="Height" value={selectedMeasurement.height === null ? "Not supplied" : `${selectedMeasurement.height.toFixed(1)} m`} />
                    <Metric label="Levels" value={String(selectedMeasurement.floors)} />
                    <Metric label="Base Z" value={selectedMeasurement.elevation === null ? "Unknown" : `${selectedMeasurement.elevation.toFixed(1)} m`} />
                    <Metric label="Footprint" value={`${selectedMeasurement.area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m²`} />
                  </div>

                  <div className="space-y-2 rounded-lg border border-white/[.08] bg-white/[.025] p-3">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Vertical delineation</span><span className="text-[9px] text-amber-200">{selectedMeasurement.floorSource.includes("Derived") || selectedMeasurement.floorSource.includes("estimated") ? "DERIVED" : "SOURCE VALUE"}</span></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedFloor((floor) => Math.max(0, floor - 1))} disabled={selectedFloor <= 0} className="rounded-md border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-30" aria-label="Previous floor"><ChevronLeft size={14} /></button>
                      <select value={selectedFloor} onChange={(event) => setSelectedFloor(Number(event.target.value))} className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#0e202b] px-2 py-2 text-[11px] text-white outline-none">
                        {Array.from({ length: Math.min(100, selectedMeasurement.floors) }, (_, index) => (
                          <option key={index} value={index}>{index === 0 ? "Ground" : `Floor ${index}`}</option>
                        ))}
                      </select>
                      <button onClick={() => setSelectedFloor((floor) => Math.min(selectedMeasurement.floors - 1, floor + 1))} disabled={selectedFloor >= selectedMeasurement.floors - 1} className="rounded-md border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-30" aria-label="Next floor"><ChevronRight size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[9px] text-slate-500">Z-min (m)<input type="number" step="0.1" value={zRange.min} onChange={(event) => setZRange((range) => ({ ...range, min: Number(event.target.value) }))} className="mt-1 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-[10px] text-white outline-none focus:border-cyan-300/40" /></label>
                      <label className="text-[9px] text-slate-500">Z-max (m)<input type="number" step="0.1" value={zRange.max} onChange={(event) => setZRange((range) => ({ ...range, max: Number(event.target.value) }))} className="mt-1 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-[10px] text-white outline-none focus:border-cyan-300/40" /></label>
                    </div>
                    <div className="text-[9px] leading-relaxed text-slate-500">{selectedMeasurement.floorHeight.toFixed(2)} m per level · {selectedMeasurement.floorSource}. Not surveyed unit boundaries.</div>
                    <button onClick={() => { setShowFloorView((value) => !value); setShowVolume(false); }} className={`flex w-full items-center justify-center gap-2 rounded-md border px-2 py-2 text-[10px] font-bold transition ${showFloorView ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[.035] text-slate-200 hover:bg-white/[.07]"}`}><Layers3 size={13} />{showFloorView ? "Show whole building" : "Isolate selected floor"}</button>
                  </div>

                  <div className="rounded-lg border border-amber-300/20 bg-amber-300/[.06] p-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-amber-100"><Ruler size={13} /> 3D property volume</div>
                    <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-[10px]"><span className="text-slate-500">Selected Z range</span><span className="text-right text-slate-200">{zRange.min.toFixed(1)}–{zRange.max.toFixed(1)} m</span><span className="text-slate-500">Envelope volume</span><span className="text-right text-slate-200">{selectedMeasurement.volume.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³</span></div>
                    <button onClick={() => { setShowVolume((value) => !value); setShowFloorView(false); }} className={`mt-2 flex w-full items-center justify-center gap-2 rounded-md border px-2 py-2 text-[10px] font-bold transition ${showVolume ? "border-amber-200/40 bg-amber-200/10 text-amber-100" : "border-white/10 bg-white/[.035] text-slate-200 hover:bg-white/[.07]"}`}><Square size={13} />{showVolume ? "Hide highlighted volume" : "Show 3D property volume"}</button>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-white/[.08] bg-white/[.025] p-3 text-[10px]">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">Source fields</div>
                    <SourceRow label="Height" value={selectedMeasurement.heightSource} />
                    <SourceRow label="Confidence" value={selectedMeasurement.confidence} />
                    <SourceRow label="Model" value={selectedMeasurement.modelType} />
                    <SourceRow label="Vertical" value={selectedMeasurement.verticalSource} />
                    <SourceRow label="Parcel key" value={selectedMeasurement.bbl || "Not supplied"} />
                    <SourceRow label="Spatial ref" value="WGS 84 · EPSG:4326" />
                  </div>

                  {city === "reference" && (
                    <div className="rounded-lg border border-violet-300/20 bg-violet-300/[.06] p-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-violet-100"><BadgeCheck size={13} /> Prototype identity</div>
                      <div className="mt-1.5 break-all font-mono text-[11px] text-white">{activeDemoId}</div>
                      <div className="mt-1 text-[9px] text-violet-100/60">Demonstration identifier · not government-issued</div>
                      <div className="mt-2 space-y-1 border-t border-white/[.08] pt-2 text-[9px] text-slate-400"><div>Parcel + building identity</div><div>Vertical level + Z range</div><div>Spatial reference: EPSG:4326</div></div>
                      <button onClick={() => setDemoUlpIn(demoIdentifier(`${selectedMeasurement.bbl}|${identifier(selectedBuilding, selectedBuildingIndex, city)}|${selectedFloor}|${zRange.min}|${zRange.max}|EPSG:4326`))} className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-violet-300/15 px-2 py-2 text-[10px] font-bold text-violet-100 transition hover:bg-violet-300/25"><Sparkles size={13} />Generate demo 3D ULPIN</button>
                    </div>
                  )}
                </>
              ) : selectedParcel ? (
                <>
                  <div className="space-y-1 rounded-lg border border-white/[.08] bg-white/[.025] p-3 text-[10px]">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">Parcel attributes</div>
                    <SourceRow label="BBL / ID" value={propertyBbl(selectedParcel) || parcelId(selectedParcel, 0)} />
                    <SourceRow label="Address" value={String(property(selectedParcel, "address", "address1") ?? "Not supplied")} />
                    <SourceRow label="Floors" value={String(property(selectedParcel, "numfloors") ?? "Not supplied")} />
                    <SourceRow label="Source" value="NYC DCP MapPLUTO · reference data" />
                  </div>
                  <button onClick={selectBuildingForParcel} disabled={!data?.buildings.some((feature) => propertyBbl(feature) === propertyBbl(selectedParcel))} className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-2.5 text-[10px] font-bold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"><Building2 size={14} />Select linked building</button>
                  <div className="text-[9px] leading-relaxed text-slate-500">Parcel → building link uses the source BBL key. A tax lot may contain multiple buildings; this sample selects the first returned match.</div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-center text-[10px] leading-relaxed text-slate-500"><MousePointer2 size={17} className="mx-auto mb-2 text-cyan-200/70" />Click a 3D building, or turn on the parcel layer and select a boundary. The inspector will show the source height, vertical range and provenance.</div>
              )}
            </div>
            {selectedBuilding && (
              <div className="border-t border-white/10 p-2.5">
                <button onClick={runValidation} disabled={isValidating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300/15 px-3 py-2.5 text-[10px] font-bold text-cyan-100 transition hover:bg-cyan-300/25 disabled:opacity-60"><ShieldCheck size={14} />{isValidating ? "Checking geometry…" : "Run prototype validation"}</button>
                {validationResult && <div className="mt-2 flex justify-between px-1 text-[9px] font-semibold"><span className="text-emerald-300">{validCount} valid</span><span className="text-amber-200">{warningCount} warnings</span><span className="text-rose-300">{errorCount} errors</span></div>}
              </div>
            )}
          </aside>}

          <div className={`absolute ${showInspector ? "right-[274px] top-[158px] sm:right-[324px]" : "right-4 top-[158px]"} z-10 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#091923]/90 shadow-lg backdrop-blur`}>
            <button onClick={() => zoomCamera(0.78)} className="p-2.5 text-slate-200 transition hover:bg-white/10" title="Zoom in"><Plus size={16} /></button>
            <button onClick={() => zoomCamera(1.28)} className="border-t border-white/10 p-2.5 text-slate-200 transition hover:bg-white/10" title="Zoom out"><Minus size={16} /></button>
            <button onClick={resetCamera} className="border-t border-white/10 p-2.5 text-slate-200 transition hover:bg-white/10" title="Reset view"><RotateCcw size={15} /></button>
          </div>

          <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[94%] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-lg border border-white/10 bg-[#091923]/95 p-1 shadow-xl backdrop-blur-xl">
            {([
              ["select", MousePointer2, "Select"],
              ["pan", Move, "Pan"],
              ["rotate", RotateCw, "Rotate"],
              ["zoom", Search, "Zoom"],
            ] as const).map(([value, Icon, label]) => (
              <button key={value} onClick={() => setTool(value)} className={`flex min-w-[56px] flex-col items-center gap-1 rounded-md px-2.5 py-2 text-[9px] transition ${tool === value ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:bg-white/[.06] hover:text-white"}`}><Icon size={15} />{label}</button>
            ))}
            <span className="mx-1 h-7 w-px bg-white/10" />
            <button onClick={() => setXray((value) => !value)} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-md px-2.5 py-2 text-[9px] transition ${xray ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:bg-white/[.06] hover:text-white"}`}>{xray ? <EyeOff size={15} /> : <Eye size={15} />}X-Ray</button>
            <button onClick={() => { setShowFloorView((value) => !value); setShowVolume(false); }} disabled={!selectedBuilding} className={`flex min-w-[66px] flex-col items-center gap-1 rounded-md px-2.5 py-2 text-[9px] transition disabled:opacity-30 ${showFloorView ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:bg-white/[.06] hover:text-white"}`}><Layers3 size={15} />Floor view</button>
            <button onClick={() => document.documentElement.requestFullscreen?.()} className="flex min-w-[60px] flex-col items-center gap-1 rounded-md px-2.5 py-2 text-[9px] text-slate-400 transition hover:bg-white/[.06] hover:text-white"><Maximize2 size={15} />Expand</button>
          </div>

          <div className="absolute bottom-[70px] left-3 z-10 max-w-[calc(100%-24px)] rounded-lg border border-white/10 bg-[#07131d]/85 px-3 py-2 text-[9px] leading-relaxed text-slate-400 backdrop-blur sm:left-4 sm:max-w-[calc(100%-560px)]">
            <div className="font-semibold text-slate-200">{city === "bhopal" ? "BHOPAL — GeoVISTA 3D CADASTRE" : "REFERENCE CITY — PS DEMONSTRATION"}</div>
            <div>{loading ? loadingMessage : data?.sourceNote}</div>
            {city === "reference" && <div className="text-amber-100/75">Prototype / Reference Data — Not Official Cadastral Records</div>}
          </div>

          {showSearch && <div className="absolute left-3 top-[158px] z-10 w-[230px] sm:left-4 sm:w-[280px]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search visible building ID / BBL…" className="w-full rounded-lg border border-white/10 bg-[#091923]/90 py-2.5 pl-9 pr-9 text-[10px] text-white outline-none backdrop-blur focus:border-cyan-300/35" />
              <button onClick={() => { setShowSearch(false); setSearch(""); }} aria-label="Close search panel" className="absolute right-2 top-1.5 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={13} /></button>
            </div>
            {filteredBuildings.length > 0 && (
              <div className="mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#091923]/95 shadow-xl backdrop-blur">
                {filteredBuildings.map(({ feature, index }) => (
                  <button key={`${identifier(feature, index, city)}-${index}`} onClick={() => { focusBuilding(feature, index); setSearch(""); }} className="flex w-full items-center justify-between border-b border-white/[.05] px-3 py-2 text-left text-[10px] hover:bg-white/[.06]"><span className="truncate font-semibold text-slate-100">{identifier(feature, index, city)}</span><span className="ml-2 shrink-0 text-slate-500">{heightMeters(feature, city)?.toFixed(1) ?? "—"} m</span></button>
                ))}
              </div>
            )}
            {search.trim() && filteredBuildings.length === 0 && <div className="mt-1 rounded-lg border border-white/10 bg-[#091923]/95 px-3 py-2 text-[10px] text-slate-400">No matching building in this loaded map sample.</div>}
          </div>}

          {showFloorView && selectedBuilding && selectedMeasurement && (
            <div className="absolute left-1/2 top-[48%] z-10 -translate-x-1/2 rounded-full border border-cyan-200/20 bg-[#0a1b25]/90 px-4 py-2 text-[10px] font-semibold text-cyan-50 shadow-lg backdrop-blur">Isolated level {selectedFloor === 0 ? "Ground" : selectedFloor} · derived from building height</div>
          )}

          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#07131d]/75 backdrop-blur-sm">
              <div className="max-w-sm rounded-xl border border-white/10 bg-[#0a1b25] px-7 py-6 text-center shadow-2xl">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100"><Building2 size={22} /></div>
                <div className="text-sm font-bold text-white">{city === "bhopal" ? "Bhopal 3D Cadastre" : "NYC reference data"}</div>
                <div className="mt-1.5 text-[11px] text-slate-400">{loadingMessage}</div>
                <div className="mx-auto mt-4 h-1 w-44 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300" /></div>
              </div>
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#07131d]/75 p-5 backdrop-blur-sm">
              <div className="max-w-md rounded-xl border border-rose-300/20 bg-[#1c1518] p-5 text-center shadow-2xl">
                <CircleAlert size={24} className="mx-auto mb-2 text-rose-200" />
                <div className="text-sm font-bold text-white">Could not load this city</div>
                <p className="mt-2 text-xs leading-relaxed text-rose-100/75">{error}</p>
                <button onClick={() => setReloadKey((key) => key + 1)} className="mt-4 rounded-md border border-white/10 px-3 py-2 text-[10px] text-slate-200 hover:bg-white/[.06]">Retry</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/70 bg-[#091923] px-4 py-2.5 text-[9px] text-slate-400">
          <div className="flex items-center gap-2"><span className="font-semibold text-slate-200">{data?.buildings.length.toLocaleString() ?? "—"}</span> buildings in the view <span className="text-slate-600">/</span> <span className="font-semibold text-slate-200">{data?.totalBuildings.toLocaleString() ?? "—"}</span> source features</div>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{city === "bhopal" ? "Project GeoJSON · local asset" : "NYC public APIs · source-backed sample"}</div>
        </div>
      </section>

      {displayFeature && (
        <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500"><Ruler size={14} className="text-blue-600" /> Vertical property workflow</div>
                <h3 className="mt-1 text-base font-bold text-slate-900">Footprint + Z-range = 3D property volume</h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">Select a building, choose a level, adjust the vertical extent, highlight its volume, then generate a demonstration identity.</p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-800">Prototype technical workflow</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["1", "Parcel + building", linkedParcel ? "Matched by source key" : "Building selected"],
                ["2", "Vertical level", `Level ${selectedFloor} · ${selectedMeasurement?.floorHeight.toFixed(1) ?? "—"} m`],
                ["3", "Z range", `${zRange.min.toFixed(1)} → ${zRange.max.toFixed(1)} m`],
                ["4", "3D identity", demoUlpIn || "Not generated yet"],
              ].map(([step, title, detail]) => <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0e3550] text-[9px] font-bold text-white">{step}</span><span className="text-[10px] font-bold text-slate-700">{title}</span></div><div className="mt-2 break-words text-[10px] leading-relaxed text-slate-500">{detail}</div></div>)}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
              <div className="flex items-center gap-2"><ArrowDownUp size={13} className="text-blue-500" />{selectedMeasurement?.area.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"} m² footprint · {selectedMeasurement?.volume.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? "—"} m³ envelope</div>
              <div className="flex items-center gap-1.5"><CircleHelp size={12} />No ownership or legal unit boundary implied</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500"><ShieldCheck size={14} className="text-emerald-700" /> Topology / validation</div><h3 className="mt-1 text-base font-bold text-slate-900">Prototype geometry checks</h3></div>
              <button onClick={runValidation} disabled={isValidating} className="shrink-0 rounded-md bg-[#0e3550] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#174d6b] disabled:opacity-50">{isValidating ? "Running…" : "Run checks"}</button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Technical prototype validation only · not official or legal cadastral validation.</p>
            {validationResult ? (
              <>
                <div className="mt-3 flex gap-2 text-[9px] font-bold"><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">{validCount} VALID</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{warningCount} WARNING</span><span className="rounded-full bg-rose-50 px-2 py-1 text-rose-800">{errorCount} ERROR</span></div>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {allChecks.map((check) => <div key={check.name} className={`rounded-lg border px-2.5 py-2 ${STATUS_STYLE[check.status]}`}><div className="flex items-center gap-2 text-[9px] font-bold"><span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[check.status]}`} />{check.status} · {check.name}</div><div className="mt-1 text-[9px] leading-relaxed opacity-75">{check.note}</div></div>)}
                </div>
              </>
            ) : <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[10px] text-slate-500">Geometry checks have not been run for this selection.</div>}
          </div>

        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500"><Sparkles size={14} className="text-violet-600" /> GeoVISTA AI / ML pipeline</div><h3 className="mt-1 text-base font-bold text-slate-900">From source data to a validated 3D property identity</h3></div>
          <div className="flex items-center gap-3 text-[9px] font-semibold"><span className="flex items-center gap-1.5 text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Implemented</span><span className="flex items-center gap-1.5 text-amber-800"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Prototype / planned</span></div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Input imagery / point cloud", "PLANNED", "No model inference is run in this demo."],
            ["Building footprints", "IMPLEMENTED", "Loads source polygons from the selected city."],
            ["Height + base elevation", "IMPLEMENTED", "Reads supplied source attributes; no new prediction."],
            ["Floor segmentation", "PROTOTYPE", "Equal-height floor bands derived from available height."],
            ["Volume + topology checks", "PROTOTYPE", "Local geometric envelope and deterministic checks."],
            ["3D property identity", "PROTOTYPE", "Demo token only; not an official ULPIN."],
          ].map(([title, status, description], index) => <div key={title} className="relative rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Stage {index + 1}</span><span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${status === "IMPLEMENTED" ? "bg-emerald-100 text-emerald-800" : status === "PLANNED" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-800"}`}>{status}</span></div>
            <div className="mt-2 text-[10px] font-bold leading-snug text-slate-800">{title}</div><div className="mt-1 text-[9px] leading-relaxed text-slate-500">{description}</div>
            {index < 5 && <ChevronRight size={13} className="absolute -right-[9px] top-1/2 z-10 hidden -translate-y-1/2 text-slate-400 lg:block" />}
          </div>)}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-600"><Database size={14} className="text-blue-700" />
          {city === "bhopal" ? <span id="bhopal-dataset-source">Bhopal: <b>bhopal_buildings_3d.geojson</b> · source attributes preserved · 3D viewer uses a nearby sample from the full dataset.</span> : <span>NYC: official building footprints + MapPLUTO public tax-lot data for a bounded reference sample. All identifiers and workflows are prototype demonstrations.</span>}
        </div>
        {showLegacyInspector && <button onClick={() => setShowLegacy((value) => !value)} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:bg-slate-100"><MapIcon size={13} />{showLegacy ? "Hide existing GeoVISTA inspector" : "Open existing GeoVISTA inspector"}<ChevronDown size={13} className={showLegacy ? "rotate-180" : ""} /></button>}
      </div>
      {showLegacyInspector && showLegacy && legacyViewer && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{legacyViewer}</div>}

      <div className="sr-only" aria-live="polite">{data ? `${data.buildings.length} building features loaded for ${city}` : loadingMessage}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-white/[.07] bg-white/[.035] px-2.5 py-2"><div className="text-[8px] font-bold uppercase tracking-[.13em] text-slate-500">{label}</div><div className="mt-1 truncate text-[11px] font-semibold text-slate-100">{value}</div></div>;
}

function SourceRow({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[66px_1fr] gap-2 border-t border-white/[.055] pt-1.5 first:border-0 first:pt-0"><span className="text-slate-500">{label}</span><span className="break-words text-right text-slate-200">{value}</span></div>;
}
