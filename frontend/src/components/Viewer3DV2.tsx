import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Building2, ChevronDown, Eye, Hand, Layers3, Map, Maximize2,
  Minus, MousePointer2, Navigation, Plus, RotateCcw, Search, Settings2,
  Square, X, Box, Info, type LucideIcon
} from "lucide-react";

type Props = {
  datasetUrl?: string;
  maxBuildings?: number;
  className?: string;
};

type Position = [number, number, ...number[]];
type PolygonGeometry = { type: "Polygon"; coordinates: Position[][] };
type MultiPolygonGeometry = { type: "MultiPolygon"; coordinates: Position[][][] };
type Geometry = PolygonGeometry | MultiPolygonGeometry;
type Feature = { geometry: Geometry; properties?: Record<string, any> | null };
type RawFeature = { geometry?: Geometry | null; properties?: Record<string, any> | null };
type FeatureCollection = { features?: RawFeature[] };
type Selected = {
  id: string; height: number; floors: number; source: string; confidence: string;
  modelType: string; verticalSource: string; geometryType: string; lat: number; lon: number;
};

const LAYER_ITEMS: Array<[string, boolean, LucideIcon]> = [
  ["Bhopal Buildings (3D)", true, Building2], ["Parcels", false, Square],
  ["Road Network", true, Map], ["Landmarks", true, Navigation],
  ["Water Bodies", true, Navigation], ["Elevation (Terrain)", false, Layers3],
  ["Aerial Imagery", false, Eye],
];
const VIEW_TOOLS: Array<[LucideIcon, string]> = [
  [MousePointer2, "Select"], [Hand, "Pan"], [RotateCcw, "Rotate"],
  [Search, "Zoom"], [Box, "X-Ray"], [Layers3, "Floor View"],
];

const DEFAULT_URL =
  import.meta.env.VITE_BUILDINGS_GEOJSON_URL ||
  "/data/processed/buildings/bhopal_buildings_3d.geojson";
const CENTER = { lat: 23.2596, lon: 77.4126 };
const M_LAT = 111320;
const M_LON = 111320 * Math.cos(THREE.MathUtils.degToRad(CENTER.lat));

const idOf = (f: Feature, i: number) => String(f.properties?.id ?? f.properties?.ulpin ?? f.properties?.building_id ?? f.properties?.fid ?? `BHP-${i + 1}`);
const heightOf = (f: Feature) => {
  const n = Number(f.properties?.height_3d_m ?? f.properties?.estimated_height_m ?? 2.5);
  return Number.isFinite(n) && n > 0 ? Math.max(2.5, n) : 2.5;
};
const project = (lon: number, lat: number) => new THREE.Vector2((lon - CENTER.lon) * M_LON, (lat - CENTER.lat) * M_LAT);

function centroid(f: Feature) {
  const ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0]?.[0];
  if (!ring?.length) return CENTER;
  let x = 0, y = 0;
  ring.forEach(([lon, lat]) => { x += lon; y += lat; });
  return { lon: x / ring.length, lat: y / ring.length };
}

function shapeFromRing(ring: number[][]) {
  const s = new THREE.Shape();
  ring.forEach(([lon, lat], i) => {
    const p = project(lon, lat);
    if (i === 0) s.moveTo(p.x, -p.y); else s.lineTo(p.x, -p.y);
  });
  s.closePath();
  return s;
}

function makeGeometry(f: Feature, height: number) {
  const rings = f.geometry.type === "Polygon"
    ? [f.geometry.coordinates[0]]
    : f.geometry.coordinates.map(p => p[0]);
  const shapes = rings.filter(Boolean).map(shapeFromRing);
  if (!shapes.length) return null;
  const parts = shapes.map(shape => new THREE.ExtrudeGeometry(shape, {
    depth: height, bevelEnabled: false, steps: 1
  }));
  parts.forEach(g => g.rotateX(Math.PI / 2));
  if (parts.length === 1) return parts[0];
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  let offset = 0;
  parts.forEach(g => {
    const p = g.getAttribute("position"), n = g.getAttribute("normal"), u = g.getAttribute("uv"), ix = g.getIndex();
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
    if (ix) for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + offset);
    offset += p.count; g.dispose();
  });
  merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  merged.setIndex(idx); return merged;
}

export default function Viewer3DV2({ datasetUrl = DEFAULT_URL, maxBuildings = 5000, className = "" }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<THREE.Scene>();
  const camera = useRef<THREE.PerspectiveCamera>();
  const renderer = useRef<THREE.WebGLRenderer>();
  const controls = useRef<OrbitControls>();
  const meshes = useRef<THREE.Mesh[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  const [features, setFeatures] = useState<Feature[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [xray, setXray] = useState(false);
  const [style, setStyle] = useState<"realistic" | "uniform" | "gradient">("realistic");
  const [layers, setLayers] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let dead = false;
    setLoading(true); setError("");
    fetch(datasetUrl)
      .then(r => { if (!r.ok) throw new Error(`Dataset request failed: ${r.status}`); return r.json(); })
      .then((json: FeatureCollection) => {
        if (dead) return;
        const fs = (json.features ?? []).filter((f): f is Feature => !!f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"));
        setFeatures(maxBuildings > 0 ? fs.slice(0, maxBuildings) : fs);
      })
      .catch(e => !dead && setError(e instanceof Error ? e.message : "Unable to load 3D dataset"))
      .finally(() => !dead && setLoading(false));
    return () => { dead = true; };
  }, [datasetUrl, maxBuildings]);

  useEffect(() => {
    if (!mount.current) return;
    const el = mount.current;
    const s = new THREE.Scene(); s.background = new THREE.Color("#07131d"); s.fog = new THREE.Fog("#07131d", 1800, 8500); scene.current = s;
    const c = new THREE.PerspectiveCamera(50, el.clientWidth / Math.max(1, el.clientHeight), .1, 20000); c.position.set(850, 760, 1050); camera.current = c;
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(el.clientWidth, el.clientHeight); r.outputColorSpace = THREE.SRGBColorSpace; el.appendChild(r.domElement); renderer.current = r;
    const o = new OrbitControls(c, r.domElement); o.enableDamping = true; o.dampingFactor = .07; o.target.set(0, 30, 0); o.maxPolarAngle = Math.PI / 2.04; controls.current = o;
    s.add(new THREE.HemisphereLight("#d9efff", "#0a1820", 2.1)); const sun = new THREE.DirectionalLight("#fff", 2.8); sun.position.set(500, 1200, 500); s.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: "#10252b", roughness: .95 })); ground.rotation.x = -Math.PI / 2; s.add(ground);
    s.add(new THREE.GridHelper(6000, 60, "#24424d", "#17313a"));
    const resize = () => { c.aspect = el.clientWidth / Math.max(1, el.clientHeight); c.updateProjectionMatrix(); r.setSize(el.clientWidth, el.clientHeight); };
    window.addEventListener("resize", resize); let raf = 0; const loop = () => { raf = requestAnimationFrame(loop); o.update(); r.render(s, c); }; loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); o.dispose(); r.dispose(); el.removeChild(r.domElement); s.clear(); meshes.current = []; };
  }, []);

  useEffect(() => {
    if (!scene.current || !features.length) return;
    const old = scene.current.getObjectByName("bhopal-dataset");
    if (old) { scene.current.remove(old); old.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach(x => x?.dispose()); }); }
    const group = new THREE.Group(); group.name = "bhopal-dataset"; const list: THREE.Mesh[] = [];
    features.forEach((f, i) => {
      const h = heightOf(f); const g = makeGeometry(f, h); if (!g) return;
      const t = Math.min(1, Math.max(0, (h - 2.5) / 20));
      const color = style === "gradient" ? new THREE.Color().setHSL(.58 - t * .5, .78, .55) : new THREE.Color("#5b9dca");
      const m = new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .03, transparent: true, opacity: xray ? .25 : .96, depthWrite: !xray });
      const mesh = new THREE.Mesh(g, m); mesh.userData = { feature: f, index: i, height: h }; group.add(mesh); list.push(mesh);
    });
    scene.current.add(group); meshes.current = list;
    return () => { scene.current?.remove(group); group.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose(); }); };
  }, [features, style, xray]);

  const select = (e: React.PointerEvent) => {
    if (!mount.current || !camera.current) return;
    const rect = mount.current.getBoundingClientRect(); pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(pointer.current, camera.current); const hit = raycaster.current.intersectObjects(meshes.current, false)[0];
    if (!hit) { setSelected(null); return; }
    const d = hit.object.userData as { feature: Feature; index: number; height: number }; const p = d.feature.properties ?? {}; const c = centroid(d.feature);
    setSelected({ id: idOf(d.feature, d.index), height: d.height, floors: Number(p.estimated_floors ?? Math.max(1, Math.round(d.height / 3.2))), source: String(p.height_source ?? "Microsoft Building Density & Height 2023 Q4"), confidence: String(p.height_confidence ?? "Estimated"), modelType: String(p.model_type ?? "Extruded"), verticalSource: String(p.vertical_source ?? "Estimated"), geometryType: d.feature.geometry.type, lat: c.lat, lon: c.lon });
  };

  const reset = () => { if (!camera.current || !controls.current) return; camera.current.position.set(850, 760, 1050); controls.current.target.set(0, 30, 0); controls.current.update(); };
  const zoom = (n: number) => camera.current?.position.multiplyScalar(n);
  const shown = search.trim() ? features.filter((f, i) => idOf(f, i).toLowerCase().includes(search.toLowerCase())) : features;

  return <div className={`relative h-full min-h-[620px] w-full overflow-hidden bg-[#07131d] text-white ${className}`}>
    <div ref={mount} onPointerDown={select} className="absolute inset-0" />

    <header className="absolute inset-x-0 top-0 z-20 flex h-[72px] items-center gap-5 border-b border-white/10 bg-[#07131d]/95 px-5 backdrop-blur-xl">
      <div className="flex min-w-[225px] items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Building2 size={27}/></div><div><div className="text-xl font-bold">GeoVISTA</div><div className="text-xs text-slate-400">3D ULPIN · Bhopal</div></div></div>
      <div className="flex h-11 max-w-[650px] flex-1 items-center gap-3 rounded-xl border border-white/15 bg-white/[.04] px-4"><Search size={18} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search building, property, ULPIN, address..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"/></div>
      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-4 py-2 text-sm lg:flex"><Navigation size={16} className="text-cyan-300"/>Bhopal, Madhya Pradesh</div><Settings2 size={20} className="text-slate-300"/>
    </header>

    <aside className="absolute left-4 top-[88px] z-10 w-[255px] rounded-2xl border border-white/10 bg-[#081923]/95 shadow-2xl backdrop-blur-xl">
      <button onClick={()=>setLayers(v=>!v)} className="flex w-full items-center justify-between border-b border-white/10 px-5 py-4 font-semibold"><span className="flex items-center gap-2"><Layers3 size={18}/>Layers</span>{layers?<ChevronDown size={18}/>:<ChevronDown size={18}/>}</button>
      {layers && <div className="space-y-1 p-4 text-sm">{LAYER_ITEMS.map(([label,on,Icon])=><label key={label} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"><input type="checkbox" defaultChecked={on} className="accent-cyan-400"/><Icon size={16} className="text-slate-300"/><span>{label}</span></label>)}
        <div className="border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Building Style</div>
        {([["realistic","Realistic (Dataset)"],["uniform","Uniform Color"],["gradient","Height Gradient"]] as const).map(([v,l])=><button key={v} onClick={()=>setStyle(v)} className={`mt-2 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${style===v?"border-cyan-400 bg-cyan-400/10 text-cyan-200":"border-transparent text-slate-300 hover:bg-white/5"}`}><Building2 size={17}/>{l}</button>)}
        <button onClick={()=>setXray(v=>!v)} className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 ${xray?"bg-cyan-400/10 text-cyan-200":"text-slate-300"}`}><Eye size={17}/>X-Ray Mode</button>
      </div>}
    </aside>

    <div className="absolute right-4 top-[92px] z-10 overflow-hidden rounded-xl border border-white/10 bg-[#081923]/90 backdrop-blur-xl"><button onClick={()=>zoom(.8)} className="p-3 hover:bg-white/10"><Plus size={20}/></button><button onClick={()=>zoom(1.25)} className="border-t border-white/10 p-3 hover:bg-white/10"><Minus size={20}/></button><button onClick={reset} className="border-t border-white/10 p-3 hover:bg-white/10"><RotateCcw size={18}/></button></div>

    {selected && <aside className="absolute right-4 top-[180px] z-10 w-[325px] rounded-2xl border border-white/10 bg-[#081923]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><Info size={18} className="text-cyan-300"/>Building Information</div><button onClick={()=>setSelected(null)}><X size={18}/></button></div><div className="mb-3 rounded-xl border border-white/10 bg-black/20 p-3"><div className="mb-2 font-semibold">{selected.id}</div>{[["Height (3D)",`${selected.height.toFixed(2)} m`],["Estimated Floors",selected.floors],["Height Source",selected.source],["Confidence",selected.confidence],["Model Type",selected.modelType],["Vertical Source",selected.verticalSource],["Geometry",selected.geometryType],["Latitude",`${selected.lat.toFixed(6)}° N`],["Longitude",`${selected.lon.toFixed(6)}° E`]].map(([k,v])=><div key={String(k)} className="grid grid-cols-[112px_1fr] gap-2 border-t border-white/5 py-2 text-xs"><span className="text-slate-400">{k}</span><span className="break-words">{v}</span></div>)}</div></aside>}

    <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-2xl border border-white/10 bg-[#081923]/95 p-2 shadow-2xl backdrop-blur-xl">
      {VIEW_TOOLS.map(([Icon,label],i)=><button key={label} onClick={()=>i===4&&setXray(v=>!v)} className="flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] text-slate-300 hover:bg-white/5"><Icon size={18}/>{label}</button>)}
      <button onClick={reset} className="flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] text-slate-300 hover:bg-white/5"><RotateCcw size={18}/>Reset</button>
      <button onClick={()=>document.documentElement.requestFullscreen?.()} className="flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] text-slate-300 hover:bg-white/5"><Maximize2 size={18}/>Camera</button>
    </div>

    {loading && <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#07131d]/80 backdrop-blur-sm"><div className="rounded-2xl border border-white/10 bg-[#081923] p-7 text-center shadow-2xl"><Building2 size={40} className="mx-auto mb-3 text-cyan-300"/><div className="font-semibold">Loading Bhopal 3D Dataset</div><div className="mt-1 text-xs text-slate-400">Building footprints + height_3d_m</div></div></div>}
    {error && <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-xl border border-red-400/30 bg-red-950/90 px-5 py-3 text-sm text-red-200">{error}</div>}

    <div className="absolute bottom-16 left-4 z-10 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs backdrop-blur"><div className="font-semibold text-slate-200">Bhopal 3D Dataset</div><div className="mt-1 text-slate-400">{shown.length.toLocaleString()} buildings rendered</div><div className="text-slate-500">Source: Microsoft Building Density & Height 2023 Q4</div></div>
    <footer className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center justify-between border-t border-white/10 bg-[#07131d]/95 px-5 text-[11px] text-slate-400 backdrop-blur-xl"><div className="flex gap-4"><b className="text-slate-200">GeoVISTA</b><span>3D Cadastral Visualization</span><span>Z-Axis Elevation</span><span>Explode View</span><span>X-Ray</span><span>Identity</span><span>History</span></div><div className="flex gap-4"><span>Lat: {CENTER.lat.toFixed(4)}°</span><span>Lon: {CENTER.lon.toFixed(4)}°</span><span className="text-emerald-400">● {features.length.toLocaleString()} buildings</span></div></footer>
  </div>;
}
