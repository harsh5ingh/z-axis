// import { useState } from "react";
// import {
//   Compass,
//   Crosshair,
//   Home,
//   Layers3,
//   Minus,
//   Plus,
//   Ruler,
//   SquareDashed,
// } from "lucide-react";

// const layers = [
//   "Surface",
//   "Buildings",
//   "Underground",
//   "Infrastructure",
//   "Terrain",
// ] as const;

// type Layer = (typeof layers)[number];

// const cityBuildings = [
//   { left: "8%", top: "18%", width: 115, height: 78, rotate: -8 },
//   { left: "25%", top: "11%", width: 150, height: 95, rotate: 4 },
//   { left: "72%", top: "13%", width: 130, height: 90, rotate: -5 },
//   { left: "12%", top: "59%", width: 145, height: 88, rotate: 5 },
//   { left: "73%", top: "64%", width: 150, height: 86, rotate: -4 },
//   { left: "84%", top: "40%", width: 100, height: 70, rotate: 7 },
// ];

// const floorOptions = [
//   "Roof",
//   "Floor 4",
//   "Floor 3",
//   "Floor 2",
//   "Floor 1",
//   "Ground",
//   "Basement",
// ];

// export default function MapCanvas() {
//   const [activeLayer, setActiveLayer] = useState<Layer>("Surface");
//   const [floor, setFloor] = useState("Floor 3");

//   return (
//     <main className="relative h-full min-h-0 w-full overflow-hidden bg-[#cbd5e1]">
//       {/* =====================================================
//           TERRAIN
//       ====================================================== */}

//       <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbeafe_0%,#c7d2fe_24%,#d1fae5_52%,#cbd5e1_100%)]" />

//       {/* subtle terrain patches */}
//       <div className="absolute -left-20 top-[8%] h-[260px] w-[420px] rounded-[50%] bg-emerald-300/20 blur-3xl" />
//       <div className="absolute bottom-[10%] left-[35%] h-[250px] w-[350px] rounded-[50%] bg-emerald-300/20 blur-3xl" />
//       <div className="absolute right-[5%] top-[20%] h-[280px] w-[300px] rounded-[50%] bg-blue-300/20 blur-3xl" />

//       {/* map grid */}
//       <div
//         className="
//           absolute inset-0 opacity-25
//           [background-image:linear-gradient(30deg,transparent_48%,#64748b_49%,transparent_50%),linear-gradient(120deg,transparent_48%,#64748b_49%,transparent_50%)]
//           [background-size:115px_115px]
//         "
//       />

//       {/* =====================================================
//           WATER
//       ====================================================== */}

//       <div
//         className="
//           absolute
//           -right-[8%]
//           top-[3%]
//           h-[48%]
//           w-[35%]
//           rotate-[-9deg]
//           rounded-[48%]
//           bg-gradient-to-br
//           from-blue-300/70
//           via-cyan-200/50
//           to-blue-400/30
//           shadow-inner
//         "
//       />

//       <div
//         className="
//           absolute
//           right-[2%]
//           top-[10%]
//           h-20
//           w-52
//           rotate-[-9deg]
//           rounded-full
//           border-t
//           border-white/50
//         "
//       />

//       {/* =====================================================
//           ROADS
//       ====================================================== */}

//       <div
//         className="
//           absolute
//           left-[-5%]
//           top-[49%]
//           h-[62px]
//           w-[115%]
//           rotate-[-6deg]
//           bg-slate-600/70
//           shadow-[0_4px_8px_rgba(15,23,42,0.18)]
//         "
//       />

//       <div
//         className="
//           absolute
//           bottom-[17%]
//           left-[3%]
//           h-[42px]
//           w-[92%]
//           rotate-[8deg]
//           bg-slate-600/65
//           shadow-[0_4px_8px_rgba(15,23,42,0.15)]
//         "
//       />

//       <div
//         className="
//           absolute
//           left-[51%]
//           top-[-12%]
//           h-[125%]
//           w-[38px]
//           rotate-[18deg]
//           bg-slate-500/45
//         "
//       />

//       {/* road markings */}
//       <div
//         className="
//           absolute
//           left-0
//           top-[51.2%]
//           h-[2px]
//           w-full
//           rotate-[-6deg]
//           border-t-2
//           border-dashed
//           border-yellow-200/50
//         "
//       />

//       {/* =====================================================
//           CITY BUILDINGS
//       ====================================================== */}

//       {cityBuildings.map((building, index) => (
//         <CityBuilding
//           key={index}
//           left={building.left}
//           top={building.top}
//           width={building.width}
//           height={building.height}
//           rotate={building.rotate}
//         />
//       ))}

//       {/* =====================================================
//           VEGETATION
//       ====================================================== */}

//       <TreeCluster left="31%" top="28%" />
//       <TreeCluster left="61%" top="68%" />
//       <TreeCluster left="19%" top="43%" />
//       <TreeCluster left="78%" top="53%" />

//       {/* =====================================================
//           SELECTED PARCEL
//       ====================================================== */}

//       <div
//         className="
//           absolute
//           left-[51%]
//           top-[46%]
//           z-10
//           h-[190px]
//           w-[165px]
//           -translate-x-1/2
//           -translate-y-1/2
//           rotate-[-4deg]
//           border-2
//           border-blue-600
//           bg-blue-500/10
//           shadow-[0_0_45px_rgba(37,99,235,0.35)]
//         "
//       />

//       {/* parcel corner markers */}
//       <div className="absolute left-[44.7%] top-[36%] z-20 h-2 w-2 rounded-full bg-blue-600" />
//       <div className="absolute left-[55.5%] top-[34.8%] z-20 h-2 w-2 rounded-full bg-blue-600" />
//       <div className="absolute left-[57.1%] top-[54.8%] z-20 h-2 w-2 rounded-full bg-blue-600" />
//       <div className="absolute left-[45%] top-[56.5%] z-20 h-2 w-2 rounded-full bg-blue-600" />

//       {/* =====================================================
//           SELECTED 3D BUILDING
//       ====================================================== */}

//       <SelectedBuilding />

//       {/* =====================================================
//           PROPERTY LABEL
//       ====================================================== */}

//       <div className="absolute left-[51%] top-[21%] z-40 -translate-x-1/2">
//         <div className="rounded-xl border border-blue-500 bg-slate-950/95 px-4 py-2.5 text-white shadow-2xl backdrop-blur-xl">
//           <p className="whitespace-nowrap text-[11px] font-bold">
//             IN-MP-BPL-P001-B01-F03-U02
//           </p>

//           <p className="mt-0.5 text-[9px] text-slate-300">
//             Residential Unit · 1,245.6 m²
//           </p>
//         </div>

//         <div className="mx-auto h-8 w-px bg-blue-500" />

//         <div className="mx-auto h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(37,99,235,0.9)]" />
//       </div>

//       {/* =====================================================
//           PLACE LABELS
//       ====================================================== */}

//       <PlaceLabel left="13%" top="12%" text="Upper Lake" />
//       <PlaceLabel left="18%" top="70%" text="City Park" />
//       <PlaceLabel left="76%" top="35%" text="Main Road" />
//       <PlaceLabel left="49%" top="72%" text="Bhopal" />

//       {/* =====================================================
//           TOOLBAR
//       ====================================================== */}

//       <div className="absolute left-4 top-4 z-50 flex items-center gap-1 rounded-xl border border-white/70 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl">
//         <ToolButton icon={<Ruler size={15} />} text="Measure" />
//         <ToolButton icon={<SquareDashed size={15} />} text="Area" />
//         <ToolButton icon={<Layers3 size={15} />} text="Layers" />
//       </div>

//       {/* =====================================================
//           COMPASS
//       ====================================================== */}

//       <div className="absolute right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white/95 shadow-xl backdrop-blur">
//         <Compass size={25} className="text-slate-700" />

//         <span className="absolute top-1 text-[7px] font-bold text-red-500">
//           N
//         </span>
//       </div>

//       {/* =====================================================
//           NAVIGATION
//       ====================================================== */}

//       <div className="absolute right-4 top-[70px] z-50 overflow-hidden rounded-xl border border-white bg-white/95 shadow-xl backdrop-blur">
//         <NavButton>
//           <Home size={15} />
//         </NavButton>

//         <NavButton>
//           <Plus size={17} />
//         </NavButton>

//         <NavButton>
//           <Minus size={17} />
//         </NavButton>

//         <NavButton>
//           <Crosshair size={15} />
//         </NavButton>
//       </div>

//       {/* =====================================================
//           FLOOR SELECTOR
//       ====================================================== */}

//       <div className="absolute left-[58%] top-[40%] z-50 flex -translate-y-1/2 flex-col gap-1">
//         {floorOptions.map((item) => {
//           const active = floor === item;

//           return (
//             <button
//               key={item}
//               type="button"
//               onClick={() => setFloor(item)}
//               className={`
//                 min-w-[68px]
//                 rounded-md
//                 border
//                 px-2.5
//                 py-1.5
//                 text-left
//                 text-[9px]
//                 font-semibold
//                 shadow-md
//                 backdrop-blur
//                 transition-all
//                 ${
//                   active
//                     ? "border-blue-600 bg-blue-600 text-white shadow-blue-500/30"
//                     : "border-white/80 bg-white/90 text-slate-600 hover:bg-blue-50"
//                 }
//               `}
//             >
//               {item}
//             </button>
//           );
//         })}
//       </div>

//       {/* =====================================================
//           MINI MAP
//       ====================================================== */}

//       <MiniMap />

//       {/* =====================================================
//           LAYER SWITCHER
//       ====================================================== */}

//       <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-xl border border-white/80 bg-white/95 p-1 shadow-xl backdrop-blur-xl">
//         {layers.map((layer) => {
//           const active = activeLayer === layer;

//           return (
//             <button
//               key={layer}
//               type="button"
//               onClick={() => setActiveLayer(layer)}
//               className={`
//                 whitespace-nowrap
//                 rounded-lg
//                 px-3
//                 py-1.5
//                 text-[9px]
//                 font-semibold
//                 transition-all
//                 ${
//                   active
//                     ? "bg-blue-600 text-white shadow-sm"
//                     : "text-slate-600 hover:bg-slate-100"
//                 }
//               `}
//             >
//               {layer}
//             </button>
//           );
//         })}
//       </div>
//     </main>
//   );
// }

// /* =========================================================
//    3D BUILDING
// ========================================================= */

// function CityBuilding({
//   left,
//   top,
//   width,
//   height,
//   rotate,
// }: {
//   left: string;
//   top: string;
//   width: number;
//   height: number;
//   rotate: number;
// }) {
//   return (
//     <div
//       className="absolute z-10"
//       style={{
//         left,
//         top,
//         width,
//         height,
//         transform: `rotate(${rotate}deg)`,
//       }}
//     >
//       {/* shadow */}
//       <div className="absolute left-3 top-4 h-full w-full rounded-md bg-slate-800/20 blur-md" />

//       {/* building */}
//       <div className="relative h-full w-full overflow-hidden rounded-md border border-slate-500/60 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-[6px_10px_18px_rgba(15,23,42,0.25)]">
//         {/* roof/windows */}
//         <div className="absolute inset-2 grid grid-cols-5 gap-1 opacity-40">
//           {Array.from({ length: 20 }).map((_, i) => (
//             <span
//               key={i}
//               className="rounded-[1px] border border-white/50 bg-slate-200/70"
//             />
//           ))}
//         </div>

//         {/* roof highlight */}
//         <div className="absolute inset-x-0 top-0 h-1 bg-white/35" />

//         {/* side extrusion */}
//         <div className="absolute -bottom-2 left-1 h-2 w-full origin-top -skew-x-[40deg] bg-slate-700/45" />
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    SELECTED BUILDING
// ========================================================= */

// function SelectedBuilding() {
//   return (
//     <div className="absolute left-[51%] top-[43%] z-30 h-[168px] w-[122px] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg]">
//       {/* shadow */}
//       <div className="absolute left-4 top-5 h-full w-full rounded-lg bg-blue-900/25 blur-xl" />

//       {/* building body */}
//       <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-300/70 via-blue-400/60 to-blue-600/50 shadow-[0_20px_45px_rgba(37,99,235,0.4)] backdrop-blur-sm">
//         {/* floors */}
//         <div className="absolute inset-0 flex flex-col">
//           <BuildingFloor active />
//           <BuildingFloor />
//           <BuildingFloor />
//           <BuildingFloor />
//         </div>

//         {/* glass windows */}
//         <div className="absolute inset-3 grid grid-cols-4 gap-1 opacity-45">
//           {Array.from({ length: 20 }).map((_, i) => (
//             <span
//               key={i}
//               className="rounded-sm border border-blue-100 bg-white/30"
//             />
//           ))}
//         </div>

//         {/* top highlight */}
//         <div className="absolute inset-x-0 top-0 h-1 bg-white/60" />
//       </div>

//       {/* 3D extrusion */}
//       <div className="absolute -bottom-3 left-2 h-3 w-full -skew-x-[40deg] rounded-b bg-blue-800/45" />
//     </div>
//   );
// }

// function BuildingFloor({
//   active = false,
// }: {
//   active?: boolean;
// }) {
//   return (
//     <div
//       className={`
//         flex-1
//         border-b
//         border-blue-200/50
//         ${
//           active
//             ? "bg-blue-500/25"
//             : "bg-blue-400/10"
//         }
//       `}
//     />
//   );
// }

// /* =========================================================
//    TREES
// ========================================================= */

// function TreeCluster({
//   left,
//   top,
// }: {
//   left: string;
//   top: string;
// }) {
//   return (
//     <div
//       className="absolute z-10"
//       style={{ left, top }}
//     >
//       <div className="flex items-end gap-1 opacity-55">
//         <Tree />
//         <Tree small />
//         <Tree />
//       </div>
//     </div>
//   );
// }

// function Tree({ small = false }: { small?: boolean }) {
//   return (
//     <div className="relative">
//       <div
//         className={`
//           rounded-full
//           bg-emerald-600/60
//           shadow-[0_4px_8px_rgba(16,185,129,0.18)]
//           ${
//             small
//               ? "h-5 w-5"
//               : "h-7 w-7"
//           }
//         `}
//       />

//       <div className="absolute left-1/2 top-[65%] h-3 w-1 -translate-x-1/2 bg-amber-900/40" />
//     </div>
//   );
// }

// /* =========================================================
//    LABEL
// ========================================================= */

// function PlaceLabel({
//   left,
//   top,
//   text,
// }: {
//   left: string;
//   top: string;
//   text: string;
// }) {
//   return (
//     <div
//       className="absolute z-20 rounded-lg bg-white/85 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur"
//       style={{ left, top }}
//     >
//       {text}
//     </div>
//   );
// }

// /* =========================================================
//    MINI MAP
// ========================================================= */

// function MiniMap() {
//   return (
//     <div className="absolute bottom-4 left-4 z-50 h-[145px] w-[175px] overflow-hidden rounded-xl border border-white bg-white/95 shadow-xl backdrop-blur-xl">
//       <div className="flex h-7 items-center justify-between border-b border-slate-200 px-2.5">
//         <span className="text-[9px] font-bold text-slate-700">
//           2D Map View
//         </span>

//         <span className="text-[10px] font-bold text-blue-600">
//           ⛶
//         </span>
//       </div>

//       <div className="relative h-[calc(100%-28px)] bg-[#dbeafe]">
//         <div className="absolute left-3 top-6 h-2 w-[135px] rotate-[-8deg] bg-slate-400/60" />
//         <div className="absolute left-8 top-12 h-2 w-[120px] rotate-[12deg] bg-slate-400/60" />
//         <div className="absolute left-16 top-0 h-[110px] w-2 rotate-[25deg] bg-slate-400/50" />

//         <div className="absolute left-[45%] top-[42%] h-7 w-9 rotate-[-4deg] border-2 border-blue-600 bg-blue-500/30" />

//         <div className="absolute left-[49%] top-[38%] h-2.5 w-2.5 rounded-full bg-blue-600 shadow-lg" />
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    TOOLBAR
// ========================================================= */

// function ToolButton({
//   icon,
//   text,
// }: {
//   icon: React.ReactNode;
//   text: string;
// }) {
//   return (
//     <button
//       type="button"
//       className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
//     >
//       {icon}
//       {text}
//     </button>
//   );
// }

// /* =========================================================
//    NAV BUTTON
// ========================================================= */

// function NavButton({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <button
//       type="button"
//       className="flex h-9 w-9 items-center justify-center border-b border-slate-100 text-slate-600 transition last:border-b-0 hover:bg-slate-50 hover:text-blue-600"
//     >
//       {children}
//     </button>
//   );
// }

import CesiumViewer from "./CesiumViewer";

export default function MapCanvas() {
  return (
    <main className="relative h-full min-h-0 w-full overflow-hidden">
      <CesiumViewer />
    </main>
  );
}